# Raspberry Pi GPIO 模擬執行器（Mock Runner）

## 專案簡介

本專案提供一個可在桌機上運行的模擬環境，讓原本在 Raspberry Pi 上使用 `RPi.GPIO` 的 Python 程式能夠在沒有實體硬體的情況下被執行與驗證。  
系統利用 `Mock.GPIO` 套件模擬 GPIO 行為，並記錄所有操作（如 `GPIO.output()`、`PWM.ChangeDutyCycle()`）與時間戳記，最終輸出成結構化的 JSON 檔案。  
這使得開發者能在上傳至實體樹莓派之前，先在桌機上驗證邏輯正確性。

---

## 功能特色

- 可直接執行實際的 Raspberry Pi GPIO 程式
- 自動將 `RPi.GPIO` 替換為 `Mock.GPIO`
- 記錄所有 GPIO 輸出與 PWM 操作的時序
- 產生結構化的 JSON 檔案，方便後續分析或重播
- 支援 LED、蜂鳴器（PWM）、時脈（Clock）等模擬
- 內含多個範例與輸出格式化工具

---

## 專案結構

```
.
├── mock_runner.py               # 模擬執行主程式
├── breathing_led.py             # LED 呼吸燈範例
├── buzzer.py                    # 蜂鳴器（PWM）範例
├── clock.py                     # 時脈信號輸出範例
├── hc-sr04.py                   # 超音波感測器範例（模擬）
├── format_clock_log_grouped.py  # 時脈輸出格式化工具
├── replay_clock_log.py          # 時脈輸出重播工具
├── clock_output.log             # 範例輸出紀錄檔
└── mock_log.json                # 模擬執行後生成的記錄檔
```

---

## 安裝方式

```bash
pip install Mock.GPIO
```

此套件可在 Windows、macOS、Linux 等環境使用，無需安裝實體 Raspberry Pi 的驅動。

---

## 使用方式

### 1. 在桌機上執行你的樹莓派程式

```bash
python mock_runner.py breathing_led.py
```

此指令會：  
1. 自動使用 `Mock.GPIO` 取代 `RPi.GPIO`  
2. 執行你的原始程式（邏輯完全相同）  
3. 紀錄所有 GPIO 與 PWM 操作  
4. 生成一份名為 `mock_log.json` 的模擬紀錄檔案

---

### 2. 範例輸出

```json
{
  "program": "breathing_led.py",
  "start_time": 1761737890.8166678,
  "duration": 2.512,
  "logs": [
    {
      "time": 0.0,
      "action": "PWM.init",
      "pin": 7,
      "value": 100
    },
    {
      "time": 0.0,
      "action": "PWM.start",
      "pin": 7,
      "value": 0
    },
    {
      "time": 0.0,
      "action": "PWM.ChangeDutyCycle",
      "pin": 7,
      "value": 0
    },
    {
      "time": 0.055,
      "action": "PWM.ChangeDutyCycle",
      "pin": 7,
      "value": 5
    },
    {
      "time": 0.11,
      "action": "PWM.ChangeDutyCycle",
      "pin": 7,
      "value": 10
    }
  ]
}
```

---

## LED 與輸出格式化方式

`format_clock_log_grouped.py` 可用於整理 LED 或時脈訊號的輸出結果。  
此腳本會將同一腳位連續的輸出值（HIGH/LOW）自動合併，計算每段持續時間，輸出為更易讀的格式。

執行方式：

```bash
python format_clock_log_grouped.py
```

輸出結果範例：

```json
[t=0.002s]
 _ 
|_|
|_|

[t=0.015s]
 _ 
|_|
 _|
```

此格式可用於：  
- 驗證 LED 閃爍或時脈週期是否正確  

---

## LED 格式化邏輯

LED 格式化的邏輯基於輸出腳位的狀態變化：  
1. 將同一腳位連續相同電位的段落合併  
2. 計算每一段的持續時間與時間區間  
3. 輸出整理後的結構化資料  

用途：  
- 分析 LED 或時脈的實際週期  
- 估算開關頻率與能量消耗  
- 比對實機與模擬結果是否一致