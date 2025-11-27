# devices/base.py
class VirtualDevice:
    """所有虛擬設備的基礎類別"""
    
    def handle_output(self, pin, value, current_time):
        """
        當使用 GPIO.output(pin, value) 時觸發
        :param pin: 腳位編號
        :param value: 輸出電位 (0 或 1)
        :param current_time: 目前模擬時間 (float)
        """
        pass

    def handle_input(self, pin, current_time):
        """
        當使用 GPIO.input(pin) 時觸發
        :param pin: 腳位編號
        :param current_time: 目前模擬時間 (float)
        :return: 0 或 1 (若該設備要控制此腳位)，否則回傳 None
        """
        return None
        
    def handle_pwm(self, pin, value, current_time):
        """當 PWM 狀態改變時觸發 (預留擴充用)"""
        pass