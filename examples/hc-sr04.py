import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

# 超聲波模組的 TRIG_y 與 ECHO_r 引腳設定
TRIG_y = 27   # GPIO13
ECHO_r = 22   # GPIO15

LED_PIN = 4
Buzzer_PIN = 17

GPIO.setup(TRIG_y, GPIO.OUT)
GPIO.setup(ECHO_r, GPIO.IN)
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.setup(Buzzer_PIN, GPIO.OUT)

pwm = GPIO.PWM(LED_PIN, 100)
voice = GPIO.PWM(Buzzer_PIN, 523)

def measure_distance():
    GPIO.output(TRIG_y, False)
    time.sleep(0.5)

    GPIO.output(TRIG_y, True)
    time.sleep(0.00001)
    GPIO.output(TRIG_y, False)

    # 先給初始值，避免迴圈沒跑導致變數不存在
    pulse_start = time.time()
    pulse_end = time.time()

    while GPIO.input(ECHO_r) == 0:
        pulse_start = time.time()

    while GPIO.input(ECHO_r) == 1:
        pulse_end = time.time()

    pulse_duration = pulse_end - pulse_start
    distance = pulse_duration * 17150
    distance = round(distance, 2)

    return distance

# if __name__ == "__main__":
distance = measure_distance()
print(f"Distance: {distance} cm")

pwm.start(50)
voice.start(50)
time.sleep(1)
pwm.stop()
voice.stop()