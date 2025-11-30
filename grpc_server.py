import grpc
from concurrent import futures
import time
import os
import sys
import shutil
import tempfile
import subprocess
import logging
import json
import signal

import simulation_pb2
import simulation_pb2_grpc

# === 設定 ===
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_RUNNER_SRC = os.path.join(BASE_DIR, 'mock_runner.py')
DEVICES_DIR_SRC = os.path.join(BASE_DIR, 'devices')

class SimulationService(simulation_pb2_grpc.SimulationServiceServicer):
    def Simulate(self, request, context):
        user_code = request.code
        lab_label = request.lab if request.lab else 'unknown'
        
        # 處理 duration
        raw_duration = request.duration if request.duration > 0 else 5.0
        duration = min(float(raw_duration), 10.0)
        
        # 處理 distance
        mock_distance = request.distance if request.distance > 0 else 50.0

        logger.info(f"Received simulation request: lab={lab_label}, duration={duration}, distance={mock_distance}")

        if not user_code:
            return simulation_pb2.SimulateResponse(
                error="Missing 'code' field",
                status="failed"
            )

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # === 準備檔案環境 ===
                target_runner = os.path.join(temp_dir, 'mock_runner.py')
                if os.path.exists(MOCK_RUNNER_SRC):
                    shutil.copy(MOCK_RUNNER_SRC, target_runner)
                else:
                    return simulation_pb2.SimulateResponse(error="mock_runner.py not found on server", status="failed")

                target_devices_dir = os.path.join(temp_dir, 'devices')
                if os.path.exists(DEVICES_DIR_SRC):
                    shutil.copytree(DEVICES_DIR_SRC, target_devices_dir)
                else:
                    return simulation_pb2.SimulateResponse(error="devices/ directory not found on server", status="failed")

                user_script_path = os.path.join(temp_dir, 'user_script.py')
                with open(user_script_path, 'w', encoding='utf-8') as f:
                    f.write(user_code)

                # === 準備執行指令 ===
                cmd = [
                    sys.executable, 
                    'mock_runner.py', 
                    'user_script.py',
                    '--lab', str(lab_label)
                ]
                
                # === 設定環境變數 ===
                env = os.environ.copy()
                env["MOCK_DISTANCE"] = str(mock_distance)

                # === 執行模擬 ===
                process = subprocess.Popen(
                    cmd,
                    cwd=temp_dir,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                stderr_output = ""
                try:
                    stdout, stderr = process.communicate(timeout=duration)
                    stderr_output = stderr
                except subprocess.TimeoutExpired:
                    logger.info("Time reached. Sending SIGINT...")
                    process.send_signal(signal.SIGINT)
                    try:
                        stdout, stderr = process.communicate(timeout=1)
                        stderr_output = stderr
                    except subprocess.TimeoutExpired:
                        process.kill()
                        stdout, stderr = process.communicate()
                        stderr_output = stderr
                        logger.warning("Process killed forcefully.")

                # === 讀取結果 ===
                log_file = os.path.join(temp_dir, 'mock_log.json')
                
                response = simulation_pb2.SimulateResponse()
                response.lab_label = lab_label
                response.server_stderr = stderr_output if stderr_output else ""
                response.duration = duration
                
                # 回傳 Input Settings
                response.input_settings.lab = lab_label
                response.input_settings.duration = duration
                response.input_settings.distance = mock_distance

                if os.path.exists(log_file):
                    with open(log_file, 'r', encoding='utf-8') as f:
                        result_json = json.load(f)
                    
                    response.status = "completed"
                    
                    # 轉換 logs
                    if 'logs' in result_json:
                        for log in result_json['logs']:
                            log_entry = response.logs.add()
                            log_entry.time = log.get('time', 0.0)
                            log_entry.pin = log.get('pin', -1)
                            log_entry.level = log.get('level', 0)
                            
                    return response
                else:
                    response.status = "failed"
                    response.error = "No log generated"
                    response.details = stderr_output
                    return response

            except Exception as e:
                logger.error(f"Server error: {e}")
                return simulation_pb2.SimulateResponse(error=str(e), status="failed")

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    simulation_pb2_grpc.add_SimulationServiceServicer_to_server(SimulationService(), server)
    server.add_insecure_port('[::]:50051')
    logger.info("gRPC Server started on port 50051")
    server.start()
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
