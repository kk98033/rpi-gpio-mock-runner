# API Client Example Guide

本指南說明如何使用 `call_api_smart_alarm.py` 透過 Python 程式碼呼叫 Mock Runner 的 API 伺服器。

## 簡介

`call_api_smart_alarm.py` 是一個範例腳本，展示如何將本地的 `smart_alarm.py` 程式碼發送至 `server.py` 進行模擬，並取得 JSON 格式的執行結果。

## 前置作業

1. **啟動伺服器**：
   確保 `server.py` 正在執行中。
   ```bash
   python server.py
   ```
   伺服器預設監聽 `http://localhost:5050`。

2. **安裝依賴**：
   此腳本需要 `requests` 套件。
   ```bash
   pip install requests
   ```

## 執行方式

直接執行 Python 腳本：

```bash
python call_api_smart_alarm.py
```

## 程式說明

該腳本會自動設定以下參數進行模擬：

- **Code**: 讀取 `examples/smart_alarm.py` 的內容。
- **Lab**: `led,buzzer,ultrasonic` (啟用 LED、蜂鳴器與超音波感測器)。
- **Duration**: `5` 秒。
- **Distance**: `5` cm (模擬障礙物距離為 5 公分，預期會觸發警報)。

## 預期輸出

執行成功後，終端機將顯示伺服器回傳的狀態與部分 Log：

```text
Sending request to http://localhost:5050/api/simulate...
Lab: led,buzzer,ultrasonic
Duration: 5s
Distance: 5cm

=== Simulation Success ===
Status: completed
Used Pins: [17, 4, 27, 22]
Log Count: 156

First 5 Logs:
{'time': 0.0, 'action': 'GPIO.setup', 'pin': 27, 'value': 0}
{'time': 0.0, 'action': 'GPIO.setup', 'pin': 22, 'value': 1}
{'time': 0.0, 'action': 'GPIO.setup', 'pin': 4, 'value': 0}
{'time': 0.0, 'action': 'GPIO.setup', 'pin': 17, 'value': 0}
{'time': 0.0, 'action': 'PWM.init', 'pin': 4, 'value': 100}
```
