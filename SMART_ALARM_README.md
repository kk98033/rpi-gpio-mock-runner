# Smart Alarm Simulation Guide

本指南說明如何使用 `mock_runner.py` 來模擬 `smart_alarm.py` 智慧警報器程式。

## 程式簡介

`smart_alarm.py` 是一個整合型的範例，模擬倒車雷達或入侵警報系統。
- **當距離 < 10cm**：視為危險，蜂鳴器響起，LED 急促閃爍。
- **當距離 >= 10cm**：視為安全，蜂鳴器靜音，LED 呈現呼吸燈效果。

## 使用感測器

此程式使用了以下元件：
- **LED** (GPIO 4)
- **Buzzer** (GPIO 17)
- **Ultrasonic Sensor (HC-SR04)** (TRIG: 27, ECHO: 22)

## 執行指令

請使用以下指令來執行模擬，並透過 `--lab` 參數啟用所需的虛擬感測器：

```bash
python mock_runner.py examples/smart_alarm.py --lab led,buzzer,ultrasonic
```

## 測試情境

由於這是模擬環境，你可以透過設定環境變數 `MOCK_DISTANCE` 來模擬不同的距離情境。

### 1. 模擬危險距離 (5cm)

```bash
# Windows PowerShell
$env:MOCK_DISTANCE="5"; python mock_runner.py examples/smart_alarm.py --lab led,buzzer,ultrasonic
```

```bash
# Linux / macOS
MOCK_DISTANCE=5 python mock_runner.py examples/smart_alarm.py --lab led,buzzer,ultrasonic
```

**預期結果**：
- 終端機 Log 顯示 `GPIO.output(17, 1)` (蜂鳴器響)。
- LED 快速切換 HIGH/LOW。

### 2. 模擬安全距離 (50cm)

```bash
# Windows PowerShell
$env:MOCK_DISTANCE="50"; python mock_runner.py examples/smart_alarm.py --lab led,buzzer,ultrasonic
```

```bash
# Linux / macOS
MOCK_DISTANCE=50 python mock_runner.py examples/smart_alarm.py --lab led,buzzer,ultrasonic
```

**預期結果**：
- 終端機 Log 顯示 `PWM.ChangeDutyCycle` (呼吸燈效果)。
- 蜂鳴器保持 LOW。

## 檢視結果

執行完畢後，開啟 `mock_log.json` 即可查看完整的 GPIO 操作紀錄。
