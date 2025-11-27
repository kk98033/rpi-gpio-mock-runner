import os
import json
import shutil
import tempfile
import subprocess
import logging
import signal  # 用來發送中斷訊號
from flask import Flask, request, jsonify

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # === 準備檔案環境 ===
            
            # 複製 mock_runner.py
            target_runner = os.path.join(temp_dir, 'mock_runner.py')
            if os.path.exists(MOCK_RUNNER_SRC):
                shutil.copy(MOCK_RUNNER_SRC, target_runner)
            else:
                return jsonify({"error": "mock_runner.py not found on server"}), 500

            # 複製 devices 資料夾
            target_devices_dir = os.path.join(temp_dir, 'devices')
            if os.path.exists(DEVICES_DIR_SRC):
                shutil.copytree(DEVICES_DIR_SRC, target_devices_dir)
            else:
                return jsonify({"error": "devices/ directory not found on server"}), 500

            # 寫入使用者程式碼
            user_script_path = os.path.join(temp_dir, 'user_script.py')
            with open(user_script_path, 'w', encoding='utf-8') as f:
                f.write(user_code)

            # === 準備執行指令 ===
            
            # 加入 --lab 參數
            cmd = [
                'python3', 
                'mock_runner.py', 
                'user_script.py',
                '--lab', str(lab_label)
            ]
            
            logger.info(f"Running simulation for lab: {lab_label}, duration: {duration}s")
            
            # === 設定環境變數 ===
            env = os.environ.copy()
            env["MOCK_DISTANCE"] = str(mock_distance)

            # === 執行模擬 ===
            process = subprocess.Popen(
                cmd,
                cwd=temp_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            try:
                # 等待程式執行 (blocking)
                stdout, stderr = process.communicate(timeout=duration)
            except subprocess.TimeoutExpired:
                logger.info("Time reached. Sending SIGINT (Ctrl+C) to stop gracefully...")
                process.send_signal(signal.SIGINT)
                try:
                    stdout, stderr = process.communicate(timeout=1)
                except subprocess.TimeoutExpired:
                    process.kill()
                    stdout, stderr = process.communicate()
                    logger.warning("Process refused to exit, killed forcefully.")

            # === 讀取結果 (修改重點) ===
            log_file = os.path.join(temp_dir, 'mock_log.json')
            
            # 印出 stderr 供伺服器除錯
            if stderr:
                logger.warning(f"--- [Subprocess Stderr] ---\n{stderr}\n---------------------------")

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
                
                return jsonify(result)
            else:
                logger.error(f"Log file missing. Stderr: {stderr}")
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
            logger.error(f"Server error: {e}")
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)