# Docker 使用指南

本指南說明如何使用 Docker 來部署與執行 RPi GPIO Mock Runner。使用 Docker 可以確保執行環境的一致性，並避免 Windows 環境下 Process 與 Signal 的相容性問題。

## 前置需求

請確保您的電腦已安裝 **Docker Desktop**。
- [下載 Docker Desktop](https://www.docker.com/products/docker-desktop/)

## 快速啟動 (推薦)

使用 `docker-compose` 是最簡單的方式，它會自動處理建置與參數設定。

### 1. 啟動服務

在專案根目錄執行：

```bash
docker-compose up --build
```

- `--build`：確保每次都重新建置映像檔，以包含最新的程式碼變更。
- 加上 `-d` 參數可於背景執行：`docker-compose up -d --build`

### 2. 確認運作

服務啟動後，將監聽 **5050** Port。
您可以看到類似以下的 Log：

```text
rpi-mock-runner |  SERVER STARTED 
rpi-mock-runner | ============================================================
rpi-mock-runner | Host           : 0.0.0.0
rpi-mock-runner | Port           : 5050
rpi-mock-runner | ============================================================
```

### 3. 停止服務

若在前景執行，按 `Ctrl+C` 即可停止。
若在背景執行，請輸入：

```bash
docker-compose down
```

## 手動建置與執行 (進階)

若不想使用 docker-compose，也可以直接使用 docker 指令。

### 1. 建置映像檔

```bash
docker build -t rpi-mock-runner .
```

### 2. 執行容器

```bash
docker run -p 5050:5050 --name my-mock-runner rpi-mock-runner
```

- `-p 5050:5050`：將容器的 5050 Port 對應到本機的 5050 Port。
- `--name`：指定容器名稱。

## 開發模式

在 `docker-compose.yml` 中，我們配置了 Volume 掛載：

```yaml
volumes:
  - ./devices:/app/devices
```

這意味著當您在本地修改 `devices/` 資料夾內的程式碼時，容器內會即時同步，無需重新建置映像檔即可生效（需重啟 Server 或依賴 Flask 的 Reload 機制）。

## 常見問題

### Q: 為什麼要用 Docker？
A: `mock_runner.py` 使用 `subprocess` 與 `signal` 來管理模擬流程。在 Windows 上，Python 的 `os.kill` 與 Signal 機制與 Linux 不同，容易導致模擬無法正確停止或 Log 遺失。使用 Docker (Linux 容器) 可以完全模擬 Raspberry Pi 的 OS 行為。

### Q: 如何查看容器內的 Log？
A: 使用以下指令：

```bash
docker logs -f rpi-mock-runner
```
