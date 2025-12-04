# Raspberry Pi GPIO 模擬執行器（Mock Runner）

## 專案簡介

本專案提供一個可在桌機上運行的模擬環境，讓原本在 Raspberry Pi 上使用 `RPi.GPIO` 的 Python 程式能夠在沒有實體硬體的情況下被執行與驗證。  
系統利用 `Mock.GPIO` 套件模擬 GPIO 行為，並記錄所有操作（如 `GPIO.output()`、`PWM.ChangeDutyCycle()`）與時間戳記，最終輸出成結構化的 JSON 檔案。  
這使得開發者能在上傳至實體樹莓派之前，先在桌機上驗證邏輯正確性。

---

## 功能特色

- **多感測器支援**：可自由組合 LED、蜂鳴器、七段顯示器、超音波感測器。
- **動態視覺化**：前端根據選擇的感測器自動渲染對應的虛擬元件。
- **PWM 頻率模擬**：支援 `PWM.ChangeFrequency`，蜂鳴器可播放不同音調。
- **全螢幕 JSON 檢視**：方便檢查詳細的模擬日誌。
- **彩色伺服器輸出**：伺服器端提供清晰、彩色的執行狀態與日誌。
- **自動 Pin Mapping**：支援自動偵測與手動配置 GPIO 腳位對應。

---

## 專案結構

```
.
├── examples/                    # 範例程式碼
│   ├── breathing_led.py         # LED 呼吸燈範例
│   ├── buzzer.py                # 蜂鳴器（PWM）範例
│   ├── clock.py                 # 時脈信號輸出範例
│   ├── hc-sr04.py               # 超音波感測器範例（模擬）
│   └── smart_alarm.py           # 智慧警報器範例 (整合測試)
├── mock_runner.py               # 模擬執行主程式
├── devices/                     # 虛擬設備邏輯
│   ├── __init__.py
│   ├── base.py
│   └── hc_sr04.py
├── server.py                    # Flask API 伺服器
├── frontend/                    # React 前端專案
├── test_client.py               # API 測試工具
├── Dockerfile                   # Docker 設定檔
├── docker-compose.yml           # Docker Compose 設定
├── format_clock_log_grouped.py  # 時脈輸出格式化工具
├── replay_clock_log.py          # 時脈輸出重播工具
├── clock_output.log             # 範例輸出紀錄檔
└── mock_log.json                # 模擬執行後生成的記錄檔
```

---

## 安裝方式

```bash
pip install Mock.GPIO colorama flask
```

此套件可在 Windows、macOS、Linux 等環境使用，無需安裝實體 Raspberry Pi 的驅動。

---

## 前端開發環境設定

本專案包含一個 React 前端介面，用於視覺化模擬結果。

1. 進入前端目錄：
   ```bash
   cd frontend
   ```
2. 安裝依賴：
   ```bash
   npm install
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
4. 開啟瀏覽器訪問 `http://localhost:6969`。

---

## 使用方式（本地執行）

### 1. 在桌機上執行你的樹莓派程式

```bash
python mock_runner.py examples/breathing_led.py --lab led,buzzer
```

此指令會：  
1. 自動使用 `Mock.GPIO` 取代 `RPi.GPIO`  
2. 執行你的原始程式（邏輯完全相同）  
3. 紀錄所有 GPIO 與 PWM 操作  
4. 生成一份名為 `mock_log.json` 的模擬紀錄檔案

`--lab` 參數現在支援逗號分隔的多個感測器，例如：`led,buzzer` 或 `hc-sr04,4seg`。

---

### 2. 範例輸出

```json
{
  "program": "examples/breathing_led.py",
  "lab": "led,buzzer",
  "start_time": 1761737890.8166678,
  "duration": 2.512,
  "used_pins": [7, 12],
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

## API 伺服器與遠端模擬

除了直接在本地執行 `mock_runner.py`，本專案也支援透過 **Flask API 伺服器** 進行遠端模擬。這允許前端網頁或教學平台將程式碼傳送至後端執行，並取得 JSON 格式的模擬結果。

### 1. 啟動 API 伺服器

伺服器負責接收程式碼、建立隔離的執行環境（支援 Docker）、執行模擬並回傳結果。

#### 方式 A：使用 Docker（推薦，最穩定）

為了避免 Windows 環境下的 Process 與 Signal 問題，強烈建議使用 Docker 啟動伺服器。

1. 確保已安裝 Docker Desktop。
2. 在專案根目錄執行：

```bash
docker-compose up --build
```

伺服器啟動後將監聽 `http://localhost:5050`。

#### 方式 B：本地 Python 直接執行

若在 Linux/macOS 環境，也可直接執行：

1. 安裝伺服器依賴：
   ```bash
   pip install Flask requests colorama
   ```
2. 啟動伺服器：
   ```bash
   python server.py
   ```

---

### 2. 使用測試客戶端 (Client)

`test_client.py` 是一個用來測試 API 的工具，它會讀取你的 Python 檔案，將其發送給伺服器，並顯示回傳的模擬結果。

#### 指令格式

```bash
python test_client.py <檔案名稱> <Lab標籤> [模擬秒數] [模擬距離]
```

- **檔案名稱**：要測試的 Python 腳本（例如 `examples/hc-sr04.py`）。
- **Lab標籤**：告訴模擬器要載入哪些虛擬設備（例如 `led`, `hc-sr04`）。
- **模擬秒數**（選填）：模擬執行的時間，預設 5 秒。
- **模擬距離**（選填）：僅用於超音波實驗，設定障礙物距離（cm），預設 50cm。

#### 使用範例

**範例 1：測試 LED 呼吸燈（模擬 3 秒）**

```bash
python test_client.py examples/breathing_led.py led 3
```

**範例 2：測試超音波感測器（模擬 2 秒，障礙物距離 30cm）**

```bash
python test_client.py examples/hc-sr04.py hc-sr04 2 30
```

**範例 3：測試智慧警報器（模擬危險距離 5cm）**

```bash
python test_client.py examples/smart_alarm.py hc-sr04 2 5
```

執行成功後，會在目錄下產生 `client_output.json`，內容包含完整的 GPIO 操作紀錄。

---

### 3. API 規格說明

若你想自行開發前端呼叫此服務，API 規格如下：

- **Endpoint**: `POST /api/simulate`
- **Content-Type**: `application/json`

**請求格式 (Request Payload):**

```json
{
  "code": "import RPi.GPIO as GPIO...",  // 完整的 Python 程式碼字串
  "lab": "led,buzzer",                   // 感測器列表 (逗號分隔)
  "duration": 5,                         // 模擬秒數 (Max 10s)
  "distance": 30                         // (選填) 超音波模擬距離
}
```

**回應格式 (Response):**

```json
{
  "program": "user_script.py",
  "lab": "led,buzzer",
  "start_time": 1761737890.816,
  "duration": 2.512,
  "status": "completed",
  "input_settings": {
    "lab": "led,buzzer",
    "duration": 5.0,
    "distance": 30
  },
  "used_pins": [17, 12],                 // 程式實際使用的 GPIO 腳位
  "logs": [
    {
      "time": 0.51,
      "action": "GPIO.output",
      "pin": 17,
      "value": 1
    }
    // ... 更多操作紀錄
  ]
}
```

---

## 進階文件指南

本專案包含多份詳細文件，針對不同需求提供說明：

- **[Docker 使用指南](DOCKER_README.md)**：
  說明如何使用 Docker 與 Docker Compose 來部署與執行模擬環境，解決跨平台相容性問題。

- **[Smart Alarm 模擬指南](SMART_ALARM_README.md)**：
  針對 `smart_alarm.py` 範例的詳細操作說明，包含如何設定環境變數來模擬不同距離情境。

- **[API Client 範例指南](API_CLIENT_README.md)**：
  說明如何使用 Python (`call_api_smart_alarm.py`) 透過 HTTP 請求呼叫模擬伺服器，適合想要整合自動化測試的開發者。