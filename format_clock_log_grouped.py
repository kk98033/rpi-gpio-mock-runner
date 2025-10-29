# -*- coding: utf-8 -*-
import json
from collections import defaultdict

# === 你的 GPIO 腳位設定 ===
segments = [2, 3, 4, 17, 27, 22, 10, 9]  # a,b,c,d,e,f,g,dp
digits = [11, 5, 6, 13]                  # DIG1~DIG4
ALL_PINS = segments + digits

# === 畫出單一數字（無邊框，只畫亮的線） ===
def draw_digit(a,b,c,d,e,f,g,dp=False):
    """回傳三行文字，顯示亮段"""
    line1 = " _ " if a else "   "
    line2 = f"{'|' if f else ' '}{'_' if g else ' '}{'|' if b else ' '}"
    line3 = f"{'|' if e else ' '}{'_' if d else ' '}{'|' if c else ' '}"
    return [line1, line2, line3]

# === 將 GPIO 狀態轉成圖案 ===
def render_display(state):
    # 根據 active digits 判定哪些位亮
    active_digits = [pin for pin in digits if state.get(pin, 1) == 0]
    if not active_digits:
        return None

    # 模擬同時顯示一個數字（如果你要多位，這裡可擴充）
    seg_states = [state.get(pin, 0) == 0 for pin in segments]  # 低電位亮
    a,b,c,d,e,f,g,dp = seg_states
    lines = draw_digit(a,b,c,d,e,f,g,dp)
    return "\n".join(lines)

# === 合併相近時間段的 GPIO 狀態 ===
def group_logs(logs, threshold=0.01):
    """
    將時間差小於 threshold 秒的 log 合併成同一幀
    """
    frames = []
    current_time = None
    current_state = {}

    for log in logs:
        t = log["time"]
        pin = log["pin"]
        val = log["value"]

        # 初始化
        if current_time is None:
            current_time = t
            current_state = {}

        # 若時間差太大，視為新幀
        if abs(t - current_time) > threshold:
            frames.append((current_time, current_state.copy()))
            current_state = {}
            current_time = t

        current_state[pin] = val

    # 最後一幀
    if current_state:
        frames.append((current_time, current_state))

    return frames

def main():
    with open("mock_log.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    logs = data["logs"]
    logs.sort(key=lambda x: x["time"])

    grouped = group_logs(logs, threshold=0.01)
    output_lines = []

    # 狀態暫存：跨幀保留舊狀態（GPIO 沒變也需顯示）
    global_state = defaultdict(lambda: 1)

    for t, changes in grouped:
        # 更新狀態
        for pin, val in changes.items():
            global_state[pin] = val

        frame = render_display(global_state)
        if frame:
            output_lines.append(f"[t={t:.3f}s]\n{frame}\n")

    with open("clock_output.log", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"已輸出 {len(output_lines)} 幀到 clock_output.log")

if __name__ == "__main__":
    main()