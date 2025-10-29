import RPi.GPIO as GPIO
import time

PIN1 = 7  # 使用 BOARD 模式的第 7 腳位

GPIO.setmode(GPIO.BOARD)
GPIO.setup(PIN1, GPIO.OUT)

pwm = GPIO.PWM(PIN1, 100)  # 設定頻率 100Hz
pwm.start(0)  # 起始占空比為 0%

try:
    while True:
        # 漸亮
        for duty in range(0, 101, 5):
            pwm.ChangeDutyCycle(duty)
            time.sleep(0.05)
        time.sleep(2)

        # 漸暗
        for duty in range(100, -1, -5):
            pwm.ChangeDutyCycle(duty)
            time.sleep(0.05)
        time.sleep(2)

except KeyboardInterrupt:
    pass

pwm.stop()
GPIO.cleanup()