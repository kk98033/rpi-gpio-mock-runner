import sys
import os
import requests
import json

# 設定伺服器位址 (Port 5050)
SERVER_URL = "http://localhost:5050/api/simulate"

def main():
    # 檢查參數數量 (至少需要 檔名 和 Label)
    if len(sys.argv) < 3:
        print("使用方式錯誤！")
        print("格式: python test_client.py <檔案名稱> <Lab標籤> [模擬秒數] [模擬距離]")
        print("範例: python test_client.py hc-sr04.py hc-sr04 3 80")
        sys.exit(1)

    # 取得參數
    file_path = sys.argv[1]
    lab_label = sys.argv[2]
    
    # 預設值
    duration = 5
    distance = 50  # 預設距離 50cm
    
    # 處理模擬秒數 (第 3 個參數)
    if len(sys.argv) >= 4:
        try:
            duration = float(sys.argv[3])
        except ValueError:
            print("錯誤: 秒數必須是數字")
            sys.exit(1)

    # 處理模擬距離 (第 4 個參數) - 新增功能
    if len(sys.argv) >= 5:
        try:
            distance = float(sys.argv[4])
        except ValueError:
            print("錯誤: 距離必須是數字")
            sys.exit(1)

    # 檢查檔案是否存在
    if not os.path.exists(file_path):
        print(f"錯誤: 找不到檔案 '{file_path}'")
        sys.exit(1)

    # 讀取程式碼內容
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
    except Exception as e:
        print(f"讀取檔案失敗: {e}")
        sys.exit(1)

    print(f"--- 準備發送測試 ---")
    print(f"目標檔案: {file_path}")
    print(f"Lab 標籤: {lab_label}")
    print(f"模擬時間: {duration} 秒")
    print(f"模擬距離: {distance} cm") # 顯示距離
    print(f"伺服器  : {SERVER_URL}")

    # 建構 Payload (新增 distance)
    payload = {
        "lab": lab_label,
        "duration": duration,
        "code": code_content,
        "distance": distance
    }

    # 發送請求
    try:
        response = requests.post(SERVER_URL, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            
            # 將結果存檔
            output_filename = "client_output.json"
            with open(output_filename, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"\n模擬成功！ (Status: 200)")
            print(f"實際執行: {result.get('duration')} 秒")
            print(f"Log 數量: {len(result.get('logs', []))}")
            print(f"完整結果已儲存至: {output_filename}")
            
            # 簡單檢查一下有沒有測到距離 (Log 預覽)
            logs = result.get('logs', [])
            if logs:
                print("\n前 3 筆 Log 預覽:")
                print(json.dumps(logs[:3], indent=2, ensure_ascii=False))

        else:
            print(f"\n伺服器回傳錯誤 (Status: {response.status_code})")
            print(f"回應內容: {response.text}")

    except requests.exceptions.ConnectionError:
        print(f"\n無法連線到伺服器 ({SERVER_URL})")
        print("請確認 server.py 是否已啟動且 Port 設定正確。")
    except Exception as e:
        print(f"\n發生未預期錯誤: {e}")

if __name__ == "__main__":
    main()