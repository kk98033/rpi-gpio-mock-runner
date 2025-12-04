import RPi.GPIO as GPIO
import time
from time import localtime

# 7 段對應腳位（a,b,c,d,e,f,g,dp）
segments = [2,3,4,17,27,22,10,9]
# 4 位選腳位
digits = [11,5,6,13]

# 每個數字對應 7 段的開關狀態 (共陽型，1=關，0=亮)
num = {
    0:(0,0,0,0,0,0,1,1),
    1:(1,0,0,1,1,1,1,1),
    2:(0,0,1,0,0,1,0,1),
    3:(0,0,0,0,1,1,0,1),
    4:(1,0,0,1,1,0,0,1),
    5:(0,1,0,0,1,0,0,1),
    6:(0,1,0,0,0,0,0,1),
    7:(0,0,0,1,1,1,1,1),
    8:(0,0,0,0,0,0,0,1),
    9:(0,0,0,0,1,0,0,1)
}

GPIO.setmode(GPIO.BCM)
for pin in segments + digits:
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, 1)

def show_number(value):
    s = f"{value:04d}"
    for i in range(4):
        # 關掉所有位選
        for d in digits:
            GPIO.output(d, 1)
        # 設定段碼
        for seg in range(8):
            GPIO.output(segments[seg], num[int(s[i])][seg])
        # 打開當前位選
        GPIO.output(digits[i], 0)
        time.sleep(0.005)  # multiplexing 延遲

def clock_loop():
    while True:
        t = localtime()
        now = t.tm_hour * 100 + t.tm_min
        for _ in range(100):  # 快速刷新，避免閃爍
            show_number(now)

try:
    clock_loop()
except KeyboardInterrupt:
    GPIO.cleanup()