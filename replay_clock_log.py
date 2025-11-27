# -*- coding: utf-8 -*-
import json

# === 你定義的 GPIO 腳位 ===
segments = [2, 3, 4, 17, 27, 22, 10, 9]   # a,b,c,d,e,f,g,dp
digits = [11, 5, 6, 13]                   # 位選 DIG1~4

# === 七段圖案 (只畫亮的) ===
def draw_digit(a,b,c,d,e,f,g,dp=False):
    """回傳三行文字，顯示該數字的亮段"""
    line1 = " _ " if a else "   "
    line2 = f"{'|' if f else ' '}{'_' if g else ' '}{'|' if b else ' '}"
    line3 = f"{'|' if e else ' '}{'_' if d else ' '}{'|' if c else ' '}"
    return [line1, line2, line3]

def render_display(state):
    """根據 GPIO 狀態組合出整個四位數顯示器畫面"""
    digits_output = []
    # 決定哪一位目前啟用 (假設共陽/共陰根據電路調整)
    active_digits = [pin for pin in digits if state.get(pin, 1) == 0]
    if not active_digits:
        return None  # 沒有位亮起

    # 簡單假設只亮一位
    # 取得七段腳狀態
    seg_states = [state.get(pin, 0) for pin in segments]
    a,b,c,d,e,f,g,dp = seg_states
    digits_output.append(draw_digit(a,b,c,d,e,f,g,dp))

    # 合併行
    lines = ["".join(row) for row in zip(*digits_output)]
    return "\n".join(lines)

def main():
    with open("client_output.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    logs = data["logs"]
    output_lines = []
    state = {}
    last_time = None

    # 依時間排序
    logs.sort(key=lambda x: x["time"])

    for log in logs:
        t = log["time"]
        pin = log["pin"]
        val = log["value"]
        state[pin] = val

        # 檢查同一時間段的事件是否結束（時間改變代表一批結束）
        if last_time is not None and abs(t - last_time) > 0.001:
            frame = render_display(state)
            if frame:
                output_lines.append(f"[t={last_time:.3f}s]\n{frame}\n")
        last_time = t

    # 處理最後一段
    frame = render_display(state)
    if frame:
        output_lines.append(f"[t={last_time:.3f}s]\n{frame}\n")

    # 寫入 log 檔
    with open("clock_output.log", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print("已輸出到 clock_output.log")

if __name__ == "__main__":
    main()
