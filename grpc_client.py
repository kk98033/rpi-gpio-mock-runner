import sys
import os
import grpc
import json
import simulation_pb2
import simulation_pb2_grpc

def main():
    if len(sys.argv) < 3:
        print("使用方式錯誤！")
        print("格式: python grpc_client.py <檔案名稱> <Lab標籤> [模擬秒數] [模擬距離]")
        print("範例: python grpc_client.py hc-sr04.py hc-sr04 3 80")
        sys.exit(1)

    file_path = sys.argv[1]
    lab_label = sys.argv[2]
    duration = 5.0
    distance = 50.0

    if len(sys.argv) >= 4:
        try:
            duration = float(sys.argv[3])
        except ValueError:
            print("錯誤: 秒數必須是數字")
            sys.exit(1)

    if len(sys.argv) >= 5:
        try:
            distance = float(sys.argv[4])
        except ValueError:
            print("錯誤: 距離必須是數字")
            sys.exit(1)

    if not os.path.exists(file_path):
        print(f"錯誤: 找不到檔案 '{file_path}'")
        sys.exit(1)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code_content = f.read()
    except Exception as e:
        print(f"讀取檔案失敗: {e}")
        sys.exit(1)

    print(f"--- 準備發送 gRPC 測試 ---")
    print(f"目標檔案: {file_path}")
    print(f"Lab 標籤: {lab_label}")
    print(f"模擬時間: {duration} 秒")
    print(f"模擬距離: {distance} cm")
    print(f"伺服器  : localhost:50051")

    with grpc.insecure_channel('localhost:50051') as channel:
        stub = simulation_pb2_grpc.SimulationServiceStub(channel)
        
        request = simulation_pb2.SimulateRequest(
            code=code_content,
            lab=lab_label,
            duration=duration,
            distance=distance
        )

        try:
            response = stub.Simulate(request)
            
            if response.status == "completed":
                print(f"\n模擬成功！")
                print(f"實際執行: {response.duration} 秒")
                print(f"Log 數量: {len(response.logs)}")
                
                # 轉換 logs 為 list of dict 以便儲存或顯示
                logs_list = []
                for log in response.logs:
                    logs_list.append({
                        "time": log.time,
                        "pin": log.pin,
                        "level": log.level
                    })
                
                output_filename = "client_output_grpc.json"
                result = {
                    "status": response.status,
                    "lab_label": response.lab_label,
                    "duration": response.duration,
                    "input_settings": {
                        "lab": response.input_settings.lab,
                        "duration": response.input_settings.duration,
                        "distance": response.input_settings.distance
                    },
                    "logs": logs_list
                }
                
                if response.server_stderr:
                    result["server_stderr"] = response.server_stderr

                with open(output_filename, "w", encoding="utf-8") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                
                print(f"完整結果已儲存至: {output_filename}")

                if logs_list:
                    print("\n前 3 筆 Log 預覽:")
                    print(json.dumps(logs_list[:3], indent=2, ensure_ascii=False))

            else:
                print(f"\n模擬失敗")
                print(f"錯誤訊息: {response.error}")
                print(f"詳細資訊: {response.details}")
                if response.server_stderr:
                    print(f"Server Stderr: {response.server_stderr}")

        except grpc.RpcError as e:
            print(f"\ngRPC 呼叫失敗: {e.code()}")
            print(f"詳細訊息: {e.details()}")

if __name__ == "__main__":
    main()
