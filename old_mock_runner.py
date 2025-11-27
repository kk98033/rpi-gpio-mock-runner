import sys
import time
import json
import importlib.util

# === 匯入 Mock.GPIO 代替 RPi.GPIO ===
import Mock.GPIO as GPIO
sys.modules['RPi'] = type(sys)('RPi')
sys.modules['RPi.GPIO'] = GPIO

# === 日誌列表 ===
logs = []
start_time = time.time()

# === 包裝 GPIO 方法來記錄行為 ===
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
    log_action("GPIO.output", pin, value)
    orig_output(pin, value)
GPIO.output = logged_output

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

# === 匯入目標 Raspberry Pi 程式 ===
if len(sys.argv) < 2:
    print("Usage: python mock_runner.py your_rpi_script.py")
    sys.exit(1)

target_file = sys.argv[1]
spec = importlib.util.spec_from_file_location("target", target_file)
target = importlib.util.module_from_spec(spec)
spec.loader.exec_module(target)

# === 輸出 JSON 檔 ===
output_file = "mock_log.json"
with open(output_file, "w") as f:
    json.dump({
        "program": target_file,
        "start_time": start_time,
        "duration": round(time.time() - start_time, 3),
        "logs": logs
    }, f, indent=2)

print(f"模擬完成，已輸出 {output_file}")