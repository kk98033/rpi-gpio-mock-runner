import RPi.GPIO as GPIO
import time

BUZZER_PIN = 12
GPIO.setmode(GPIO.BOARD)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

# 定義音階頻率 (赫茲 Hz) - 這裡是 C4 到 C5 的頻率
# Do = 262Hz, Re = 294Hz, Mi = 330Hz...
TONES = {
    'Do': 262,
    'Re': 294,
    'Mi': 330,
    'Fa': 349,
    'Sol': 392,
    'La': 440,
    'Si': 494,
    'Do_High': 523
}

# 初始化 PWM
# 參數：(腳位, 初始頻率)
pwm = GPIO.PWM(BUZZER_PIN, 440) 

# 啟動 PWM，但先將佔空比 (Duty Cycle) 設為 0 (靜音)
# 佔空比 50% 通常是用來產生聲音的最佳比例
pwm.start(0)

try:
    print("開始播放 Do Re Mi...")
    melody = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do_High']
    
    while True:
        for note in melody:
            # 1. 改變頻率 (音調)
            pwm.ChangeFrequency(TONES[note])
            
            # 2. 開啟聲音 (設定佔空比為 50%)
            pwm.ChangeDutyCycle(50)
            print(f"Playing: {note}")
            time.sleep(0.5) # 每個音持續 0.5 秒
            
            # 3. 短暫停頓 (讓音符之間分開，比較好聽)
            pwm.ChangeDutyCycle(0) # 靜音
            time.sleep(0.1)

        time.sleep(1) # 播放完一次後休息 1 秒

except KeyboardInterrupt:
    # 程式停止時的清理工作
    pwm.stop()
    GPIO.cleanup()
    print("\n程式結束，清理 GPIO")