import sys
import time
import json
import os
import argparse
import importlib.util

# === 匯入 Mock.GPIO 並替換系統模組 ===
import Mock.GPIO as GPIO
sys.modules['RPi'] = type(sys)('RPi')
sys.modules['RPi.GPIO'] = GPIO

# === 全域變數 ===
logs = []
start_time = time.time()
active_devices = []  # 存放已啟用的虛擬設備
used_pins = set()    # 存放已使用的 GPIO 腳位
MAX_DURATION = None  # 儲存最大執行時間

# === 超時檢查函式 ===
def check_timeout():
    """檢查是否超過模擬時間，若超過則引發 SystemExit"""
    if MAX_DURATION is not None:
        if (time.time() - start_time) >= MAX_DURATION:
            # 引發 SystemExit 會被外層的 try...except 捕捉，進而執行 finally
            raise SystemExit("Simulation Timeout")

# === 攔截 time.sleep 以便在睡眠中也能檢查超時 ===
original_sleep = time.sleep
def hb_sleep(seconds):
    check_timeout() # 睡前檢查
    original_sleep(seconds)
    check_timeout() # 睡醒檢查
time.sleep = hb_sleep

# === 設備初始化邏輯 ===
def setup_devices(lab_label):
    """根據 lab 標籤載入對應的虛擬設備"""
    # 從環境變數讀取距離設定，預設 50cm
    dist = float(os.environ.get("MOCK_DISTANCE", 50))
    # print(lab_label) # Debug用，可註解
    if 'hc-sr04' in lab_label or 'ultrasonic' in lab_label:
        from devices.hc_sr04 import HCSR04
        # 這裡假設腳位是 TRIG=27, ECHO=22 (對應你的 hc-sr04.py)
        device = HCSR04(trig_pin=27, echo_pin=22, distance=dist)
        active_devices.append(device)
        print(f"[MockRunner] Loaded HC-SR04 (dist={dist}cm)")

    elif lab_label == 'led':
        pass

# === GPIO Hook 函式 (核心轉發邏輯) ===
def log_action(action, pin=None, value=None):
    check_timeout()  # 每次動作前檢查是否超時
    now = time.time() - start_time
    logs.append({
        "time": round(now, 3),
        "action": action,
        "pin": pin,
        "value": value
    })
    if pin is not None:
        used_pins.add(pin)

orig_output = GPIO.output
def logged_output(pin, value):
    now = time.time()
    
    # 寫入 Log
    log_action("GPIO.output", pin, value)
    
    # 通知所有設備 (例如觸發超音波 TRIG)
    for device in active_devices:
        device.handle_output(pin, value, now)
        
    orig_output(pin, value)
GPIO.output = logged_output

orig_input = GPIO.input
def simulated_input(pin):
    check_timeout() # [NEW]
    used_pins.add(pin)
    now = time.time()
    
    # 問問看有沒有設備要負責這個腳位的 Input (例如超音波 ECHO)
    for device in active_devices:
        result = device.handle_input(pin, now)
        if result is not None:
            return result
            
    # 沒有人認領，就回傳 Mock.GPIO 的預設值
    return orig_input(pin)
GPIO.input = simulated_input

orig_setup = GPIO.setup
def logged_setup(pin, mode, pull_up_down=None, initial=None):
    check_timeout() # [NEW]
    # 支援 pin 為 list 或 tuple 的情況
    if isinstance(pin, (list, tuple)):
        for p in pin:
            used_pins.add(p)
    else:
        used_pins.add(pin)
        
    kwargs = {}
    if pull_up_down is not None:
        kwargs['pull_up_down'] = pull_up_down
    if initial is not None:
        kwargs['initial'] = initial
        
    orig_setup(pin, mode, **kwargs)
GPIO.setup = logged_setup

# === 5. PWM Hook ===
orig_pwm = GPIO.PWM
class LoggedPWM(GPIO.PWM):
    def __init__(self, pin, freq):
        check_timeout() # [NEW]
        super().__init__(pin, freq)
        self.pin = pin
        log_action("PWM.init", pin, freq)
    def ChangeDutyCycle(self, duty):
        log_action("PWM.ChangeDutyCycle", self.pin, duty)
        super().ChangeDutyCycle(duty)
    def ChangeFrequency(self, frequency):
        log_action("PWM.ChangeFrequency", self.pin, frequency)
        super().ChangeFrequency(frequency)
    def start(self, duty):
        log_action("PWM.start", self.pin, duty)
        super().start(duty)
    def stop(self):
        log_action("PWM.stop", self.pin)
        super().stop()
GPIO.PWM = LoggedPWM

# === 主程式執行 ===
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("script", help="User script to run")
    # 接收 lab 參數，用來決定要載入哪些設備
    parser.add_argument("--lab", default="unknown", help="Lab label (e.g., led, hc-sr04)")
    # 接收 duration 參數
    parser.add_argument("--duration", type=float, default=None, help="Max simulation duration")
    args = parser.parse_args()

    # 設定全域超時時間
    MAX_DURATION = args.duration

    # 初始化設備
    setup_devices(args.lab)

    # 載入並執行使用者程式
    target_file = args.script
    
    try:
        spec = importlib.util.spec_from_file_location("target", target_file)
        target = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(target)
    except SystemExit:
        # 捕捉我們自己拋出的超時 (check_timeout)，或是使用者 sys.exit()
        # 這算是正常結束的一種，讓我們能夠進入 finally 寫 log
        print(f"[MockRunner] Stopped (Reason: SystemExit/Timeout)")
    except Exception as e:
        # 捕捉使用者程式的錯誤，避免 Runner 崩潰
        # 這裡印出錯誤讓 Server stderr 捕捉
        print(f"[MockRunner] Script Error: {e}")
    finally:
        # 模擬結束，輸出 JSON
        output_file = "mock_log.json"
        result = {
            "program": target_file,
            "lab": args.lab,
            "start_time": start_time,
            "duration": round(time.time() - start_time, 3),
            "used_pins": sorted(list(used_pins)),
            "logs": logs
        }
        
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
            print(f"[MockRunner] Simulation finished. Log saved to {output_file}")
        except Exception as e:
            print(f"[MockRunner] Failed to write log: {e}")