# gRPC Client Usage Guide

This guide explains how to use the new gRPC-based client for the RPi GPIO Mock Runner.

## Prerequisites

1.  **Python 3.7+**
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    Or if using `venv`:
    ```bash
    .\venv\Scripts\pip install -r requirements.txt
    ```

## Generating Proto Code (Optional)

If you modify `simulation.proto`, you need to regenerate the Python code:

```bash
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. simulation.proto
```

## Running the Server

Start the gRPC server:

```bash
python grpc_server.py
```
The server listens on port `50051`.

## Running the Client

Use `grpc_client.py` to send simulation requests.

### Usage

```bash
python grpc_client.py <filename> <lab_label> [duration] [distance]
```

-   `filename`: Path to the Python script to simulate (e.g., `hc-sr04.py`).
-   `lab_label`: Label for the lab (e.g., `hc-sr04`).
-   `duration`: (Optional) Simulation duration in seconds. Default: 5.
-   `distance`: (Optional) Mock distance for ultrasonic sensor in cm. Default: 50.

### Example

```bash
python grpc_client.py hc-sr04.py hc-sr04 3 80
```

### Output

The client prints the simulation result to the console and saves the full details to `client_output_grpc.json`.

```json
{
  "status": "completed",
  "lab_label": "hc-sr04",
  "duration": 3.0,
  "input_settings": {
    "lab": "hc-sr04",
    "duration": 3.0,
    "distance": 80.0
  },
  "logs": [
    {
      "time": 0.1,
      "pin": 17,
      "level": 1
    },
    ...
  ]
}
```
