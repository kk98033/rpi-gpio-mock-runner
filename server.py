import os, sys
import json
import shutil
import tempfile
import subprocess
import logging
import signal
from flask import Flask, request, jsonify
from colorama import init, Fore, Back, Style

# Initialize colorama
init(autoreset=True)

app = Flask(__name__)

# Configure logging to be less verbose for Flask, we'll handle our own output
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# === Helper Functions for Colored Output ===
def print_header(title):
    print(f"\n{Back.CYAN}{Fore.BLACK} {title} {Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

def print_footer(status, duration):
    color = Back.GREEN if status == "SUCCESS" else Back.RED
    print(f"{Fore.CYAN}{'-'*60}{Style.RESET_ALL}")
    print(f"{color}{Fore.WHITE} STATUS: {status} {Style.RESET_ALL} | Duration: {duration}s")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

def print_info(label, value):
    print(f"{Fore.YELLOW}{label:<15}: {Fore.WHITE}{value}{Style.RESET_ALL}")

# === 路徑設定 ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_RUNNER_SRC = os.path.join(BASE_DIR, 'mock_runner.py')
DEVICES_DIR_SRC = os.path.join(BASE_DIR, 'devices')  # devices 資料夾路徑

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({"error": "Missing 'code' field"}), 400

    # 接收參數
    user_code = data['code']
    lab_label = data.get('lab', 'unknown')
    
    # 處理 duration (若超過 10 秒則強制限制)
    raw_duration = data.get('duration', 5)
    duration = min(float(raw_duration), 10.0)
    
    # 從前端接收距離設定，預設 50cm (給超音波使用)
    mock_distance = data.get('distance', 50)

    # === Print Simulation Start Info ===
    print_header("NEW SIMULATION REQUEST")
    print_info("Lab", lab_label)
    print_info("Duration", f"{duration}s")
    print_info("Distance", f"{mock_distance}cm")
    print(f"{Fore.CYAN}{'-'*60}{Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}>>> Output from mock_runner.py:{Style.RESET_ALL}")

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # === 準備檔案環境 ===
            
            # 複製 mock_runner.py
            target_runner = os.path.join(temp_dir, 'mock_runner.py')
            if os.path.exists(MOCK_RUNNER_SRC):
                shutil.copy(MOCK_RUNNER_SRC, target_runner)
            else:
                print(f"{Fore.RED}Error: mock_runner.py not found{Style.RESET_ALL}")
                return jsonify({"error": "mock_runner.py not found on server"}), 500

            # 複製 devices 資料夾
            target_devices_dir = os.path.join(temp_dir, 'devices')
            if os.path.exists(DEVICES_DIR_SRC):
                shutil.copytree(DEVICES_DIR_SRC, target_devices_dir)
            else:
                print(f"{Fore.RED}Error: devices/ directory not found{Style.RESET_ALL}")
                return jsonify({"error": "devices/ directory not found on server"}), 500

            # 寫入使用者程式碼
            user_script_path = os.path.join(temp_dir, 'user_script.py')
            with open(user_script_path, 'w', encoding='utf-8') as f:
                f.write(user_code)

            # === 準備執行指令 ===
            
            # 加入 --lab 參數
            cmd = [
                sys.executable, 
                'mock_runner.py', 
                'user_script.py',
                '--lab', str(lab_label)
            ]
            
            # === 設定環境變數 ===
            env = os.environ.copy()
            env["MOCK_DISTANCE"] = str(mock_distance)

            # === 執行模擬 ===
            process = subprocess.Popen(
                cmd,
                cwd=temp_dir,
                env=env,
                stdout=None,  # Output directly to console
                stderr=subprocess.PIPE,
                text=True
            )

            try:
                # 等待程式執行 (blocking)
                stdout, stderr = process.communicate(timeout=duration)
            except subprocess.TimeoutExpired:
                print(f"\n{Fore.YELLOW}[Timeout] Sending SIGINT...{Style.RESET_ALL}")
                process.send_signal(signal.SIGINT)
                try:
                    stdout, stderr = process.communicate(timeout=1)
                except subprocess.TimeoutExpired:
                    process.kill()
                    stdout, stderr = process.communicate()
                    print(f"{Fore.RED}[Timeout] Process killed forcefully.{Style.RESET_ALL}")

            # === 讀取結果 (修改重點) ===
            log_file = os.path.join(temp_dir, 'mock_log.json')
            
            # 印出 stderr 供伺服器除錯
            if stderr:
                print(f"\n{Fore.RED}--- [Subprocess Stderr] ---{Style.RESET_ALL}")
                print(f"{Fore.RED}{stderr}{Style.RESET_ALL}")
                print(f"{Fore.RED}---------------------------{Style.RESET_ALL}")

            if os.path.exists(log_file):
                with open(log_file, 'r', encoding='utf-8') as f:
                    result = json.load(f)
                
                # === 新增：將 User Input 資訊封裝進回傳 JSON ===
                # 這樣前端就能看到原本設定的參數
                result['input_settings'] = {
                    "lab": lab_label,
                    "duration": duration,  # 這是實際限制後的秒數
                    "distance": mock_distance
                }
                
                # 為了方便，這些也可以放在第一層 (看你習慣)
                result['lab_label'] = lab_label
                result['status'] = 'completed'
                
                # 放入 stderr
                if stderr:
                    result['server_stderr'] = stderr
                
                print_footer("SUCCESS", duration)
                return jsonify(result)
            else:
                print(f"{Fore.RED}Error: Log file missing.{Style.RESET_ALL}")
                print_footer("FAILED", duration)
                return jsonify({
                    "error": "No log generated.",
                    "details": stderr, 
                    "status": "failed",
                    # 即使失敗也回傳原本的設定，方便除錯
                    "input_settings": {
                        "lab": lab_label,
                        "duration": duration,
                        "distance": mock_distance
                    }
                }), 400

        except Exception as e:
            print(f"{Fore.RED}Server Error: {e}{Style.RESET_ALL}")
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print_header("SERVER STARTED")
    print_info("Host", "0.0.0.0")
    print_info("Port", "5050")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")
    app.run(host='0.0.0.0', port=5050, debug=True)