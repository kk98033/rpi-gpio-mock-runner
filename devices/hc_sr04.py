import sys
from .base import VirtualDevice

class HCSR04(VirtualDevice):
    def __init__(self, trig_pin, echo_pin, distance=50):
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin
        self.distance = distance
        self.last_trig_time = 0
        # 除錯：確認設備已初始化
        print(f"[HCSR04] Init: Trig={trig_pin}, Echo={echo_pin}, Dist={distance}", file=sys.stderr)

    def handle_output(self, pin, value, current_time):
        # 偵測 TRIG 腳位是否被拉高
        if pin == self.trig_pin and value == 1:
            self.last_trig_time = current_time
            print(f"[HCSR04] Trigger detected at {current_time:.4f}", file=sys.stderr)

    def handle_input(self, pin, current_time):
        # 攔截 ECHO 腳位的讀取請求
        if pin == self.echo_pin:
            try:
                # 公式: 距離 = (時間 * 聲速 34300) / 2  => 時間 = 距離 / 17150
                pulse_width = self.distance / 17150.0
                time_since_trig = current_time - self.last_trig_time
                
                # 除錯：印出計算狀態 (為了避免洗版，可以只在特定條件下印)
                # print(f"[HCSR04] Reading Echo... delta={time_since_trig:.6f}", file=sys.stderr)

                start_delay = 0.0001
                
                if time_since_trig < start_delay:
                    return 0 # 還沒開始 (硬體延遲)
                elif time_since_trig < (start_delay + pulse_width):
                    return 1 # 回波 High
                else:
                    return 0 # 回波結束
            except Exception as e:
                # 捕捉並印出錯誤，這是找出崩潰的關鍵
                print(f"[HCSR04] Error in handle_input: {e}", file=sys.stderr)
                return 0
        
        return None