import RPi.GPIO as GPIO
import time

# === 腳位設定 (BCM 模式) ===
TRIG_PIN = 27
ECHO_PIN = 22
LED_PIN = 4
BUZZER_PIN = 17

# === 初始化 GPIO ===
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

GPIO.setup(TRIG_PIN, GPIO.OUT)
GPIO.setup(ECHO_PIN, GPIO.IN)
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

# 初始化 PWM (用於呼吸燈)
pwm_led = GPIO.PWM(LED_PIN, 100) # 100Hz
pwm_running = False # 紀錄 PWM 是否正在執行

def measure_distance():
    """測量距離 (已包含修正後的邏輯)"""
    GPIO.output(TRIG_PIN, False)
    time.sleep(0.1) # 縮短冷卻時間加快反應

    GPIO.output(TRIG_PIN, True)
    time.sleep(0.00001)
    GPIO.output(TRIG_PIN, False)

    # 關鍵修正：給予初始值，避免模擬過快導致變數未定義
    pulse_start = time.time()
    pulse_end = time.time()

    # 等待回波
    while GPIO.input(ECHO_PIN) == 0:
        pulse_start = time.time()

    while GPIO.input(ECHO_PIN) == 1:
        pulse_end = time.time()

    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150
    return round(distance, 2)

try:
    print("智慧警報器啟動...")
    
    while True:
        dist = measure_distance()
        # 由於 Mock 環境的 print 看不到，這裡的 print 主要是讓人在真實樹莓派上除錯用
        # 在 Mock 環境中我們會看 Log
        
        if dist < 10:
            # === [模式 A] 危險距離 (<10cm) ===
            # 動作：蜂鳴器叫、LED 閃爍 (數位控制)
            
            # 如果 PWM 正在跑，要先停掉才能用數位控制
            if pwm_running:
                pwm_led.stop()
                pwm_running = False
            
            # 蜂鳴器：叫 (High)
            GPIO.output(BUZZER_PIN, GPIO.HIGH)
            
            # LED：急促閃爍
            GPIO.output(LED_PIN, GPIO.HIGH)
            time.sleep(0.1)
            GPIO.output(LED_PIN, GPIO.LOW)
            time.sleep(0.1)
            
        else:
            # === [模式 B] 安全距離 (>=10cm) ===
            # 動作：蜂鳴器安靜、LED 呼吸燈 (PWM 控制)
            
            # 蜂鳴器：閉嘴 (Low)
            GPIO.output(BUZZER_PIN, GPIO.LOW)
            
            # LED：呼吸燈效果
            if not pwm_running:
                pwm_led.start(0)
                pwm_running = True
            
            # 執行一次快速呼吸循環 (避免卡住太久無法測距)
            # 漸亮
            for dc in range(0, 101, 10):
                pwm_led.ChangeDutyCycle(dc)
                time.sleep(0.02)
            # 漸暗
            for dc in range(100, -1, -10):
                pwm_led.ChangeDutyCycle(dc)
                time.sleep(0.02)

except KeyboardInterrupt:
    pass
finally:
    pwm_led.stop()
    GPIO.cleanup()