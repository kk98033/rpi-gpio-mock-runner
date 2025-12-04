import requests
import os

# 設定 API URL
API_URL = "http://localhost:5050/api/simulate"

# 讀取 smart_alarm.py 的程式碼
file_path = "examples/smart_alarm.py"
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    code_content = f.read()

# 設定請求參數
payload = {
    "code": code_content,
    "lab": "led,buzzer,ultrasonic",  # 啟用 LED, 蜂鳴器, 超音波
    "duration": 5,                    # 模擬 5 秒
    "distance": 5                     # 模擬距離 5cm (危險距離，觸發警報)
}

print(f"Sending request to {API_URL}...")
print(f"Lab: {payload['lab']}")
print(f"Duration: {payload['duration']}s")
print(f"Distance: {payload['distance']}cm")

try:
    response = requests.post(API_URL, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== Simulation Success ===")
        print(f"Status: {result.get('status')}")
        print(f"Used Pins: {result.get('used_pins')}")
        print(f"Log Count: {len(result.get('logs', []))}")
        
        # 顯示前 5 筆 Log
        print("\nFirst 5 Logs:")
        for log in result.get('logs', [])[:5]:
            print(log)
    else:
        print("\n=== Simulation Failed ===")
        print(f"Status Code: {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError:
    print(f"\nError: Could not connect to server at {API_URL}")
    print("Please make sure server.py is running.")
