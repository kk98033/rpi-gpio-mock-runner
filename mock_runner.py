import sys
import time
import json
import os
import argparse
import importlib.util

# === 1. 匯入 Mock.GPIO 並替換系統模組 ===
import Mock.GPIO as GPIO
sys.modules['RPi'] = type(sys)('RPi')
sys.modules['RPi.GPIO'] = GPIO

# === 2. 全域變數 ===
logs = []
start_time = time.time()
active_devices = []  # 存放已啟用的虛擬設備

# === 3. 設備初始化邏輯 ===
def setup_devices(lab_label):
    """根據 lab 標籤載入對應的虛擬設備"""
    # 從環境變數讀取距離設定，預設 50cm
    dist = float(os.environ.get("MOCK_DISTANCE", 50))
    
    if lab_label == 'hc-sr04' or lab_label == 'ultrasonic':
        from devices.hc_sr04 import HCSR04
        # 這裡假設腳位是 TRIG=27, ECHO=22 (對應你的 hc-sr04.py)
        # 如果要更靈活，可以再透過環境變數傳入腳位
        device = HCSR04(trig_pin=27, echo_pin=22, distance=dist)
        active_devices.append(device)
        print(f"[MockRunner] Loaded HC-SR04 (dist={dist}cm)")

    elif lab_label == 'led':
        # LED 其實不需要特殊邏輯，因為只要看 Output Log 就好了
        # 但如果要模擬按鈕輸入，就可以在這裡加 ButtonDevice
        pass

# === 4. GPIO Hook 函式 (核心轉發邏輯) ===
def log_action(action, pin=None, value=None):
    now = time.time() - start_time
    logs.append({
        "time": round(now, 3),
        "action": action,
        "pin": pin,
        "value": value
    })

orig_output = GPIO.output
def logged_output(pin, value):
    now = time.time()
    
    # 1. 寫入 Log
    log_action("GPIO.output", pin, value)
    
    # 2. 通知所有設備 (例如觸發超音波 TRIG)
    for device in active_devices:
        device.handle_output(pin, value, now)
        
    orig_output(pin, value)
GPIO.output = logged_output

orig_input = GPIO.input
def simulated_input(pin):
    now = time.time()
    
    # 1. 問問看有沒有設備要負責這個腳位的 Input (例如超音波 ECHO)
    for device in active_devices:
        result = device.handle_input(pin, now)
        if result is not None:
            return result
            
    # 2. 沒有人認領，就回傳 Mock.GPIO 的預設值
    return orig_input(pin)
GPIO.input = simulated_input

# === 5. PWM Hook (維持原樣) ===
orig_pwm = GPIO.PWM
class LoggedPWM(GPIO.PWM):
    def __init__(self, pin, freq):
        super().__init__(pin, freq)
        self.pin = pin
        log_action("PWM.init", pin, freq)
    def ChangeDutyCycle(self, duty):
        log_action("PWM.ChangeDutyCycle", self.pin, duty)
        super().ChangeDutyCycle(duty)
    def start(self, duty):
        log_action("PWM.start", self.pin, duty)
        super().start(duty)
    def stop(self):
        log_action("PWM.stop", self.pin)
        super().stop()
GPIO.PWM = LoggedPWM

# === 6. 主程式執行 ===
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("script", help="User script to run")
    # 接收 lab 參數，用來決定要載入哪些設備
    parser.add_argument("--lab", default="unknown", help="Lab label (e.g., led, hc-sr04)")
    args = parser.parse_args()

    # 初始化設備
    setup_devices(args.lab)

    # 載入並執行使用者程式
    target_file = args.script
    
    try:
        spec = importlib.util.spec_from_file_location("target", target_file)
        target = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(target)
    except SystemExit:
        pass # 允許 sys.exit()
    except Exception as e:
        # 捕捉使用者程式的錯誤，避免 Runner 崩潰，但要在 Log 中記錄嗎？
        # 這裡選擇讓它拋出，讓 Server 端的 stderr 捕捉
        raise e
    finally:
        # 模擬結束，輸出 JSON
        output_file = "mock_log.json"
        result = {
            "program": target_file,
            "lab": args.lab,
            "start_time": start_time,
            "duration": round(time.time() - start_time, 3),
            "logs": logs
        }
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        
        print(f"[MockRunner] Simulation finished. Log saved to {output_file}")