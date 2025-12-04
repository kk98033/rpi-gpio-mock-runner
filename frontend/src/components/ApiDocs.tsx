import React, { useState } from 'react';
import { X, Book, Code, Server, FileJson, PlayCircle } from 'lucide-react';

import axios from 'axios';

interface ApiDocsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({ isOpen, onClose }) => {
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [testDuration, setTestDuration] = useState<number>(0);

    // Interactive inputs
    const [testCode, setTestCode] = useState('import RPi.GPIO as GPIO\nimport time\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(17, GPIO.OUT)\nGPIO.output(17, GPIO.HIGH)\ntime.sleep(0.5)\nGPIO.output(17, GPIO.LOW)');
    const [testLab, setTestLab] = useState('led');
    const [testDurationInput, setTestDurationInput] = useState(1);
    const [testDistance, setTestDistance] = useState(50);

    const handleTestApi = async () => {
        setTestLoading(true);
        setTestResult(null);
        const startTime = performance.now();

        try {
            const response = await axios.post('/api/simulate', {
                code: testCode,
                lab: testLab,
                duration: testDurationInput,
                distance: testDistance
            });
            setTestResult(response.data);
        } catch (error: any) {
            setTestResult({ error: error.message, details: error.response?.data });
        } finally {
            setTestDuration(Math.round(performance.now() - startTime));
            setTestLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Book size={24} />
                        <h2 className="text-xl font-bold">API Documentation</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-300">

                    {/* Introduction */}
                    <section>
                        <p className="text-lg text-gray-400 mb-4">
                            The RPi GPIO Mock Runner exposes a RESTful API to execute Python scripts in a simulated environment.
                            It returns a structured JSON log of all GPIO actions, which can be used for visualization or analysis.
                        </p>
                        <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700 w-fit">
                            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-cyan-300 font-mono">/api/simulate</code>
                        </div>
                    </section>

                    {/* Request Parameters */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Server size={20} className="text-purple-400" /> Request Parameters
                        </h3>
                        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900 text-gray-400">
                                    <tr>
                                        <th className="p-3">Field</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Required</th>
                                        <th className="p-3">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    <tr>
                                        <td className="p-3 font-mono text-cyan-300">code</td>
                                        <td className="p-3 font-mono text-yellow-400">string</td>
                                        <td className="p-3 text-red-400">Yes</td>
                                        <td className="p-3">The complete Python script content to execute.</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-mono text-cyan-300">lab</td>
                                        <td className="p-3 font-mono text-yellow-400">string</td>
                                        <td className="p-3 text-gray-500">No</td>
                                        <td className="p-3">
                                            Lab environment tag or comma-separated list of sensors. Defaults to 'unknown'. <br />
                                            Options: <code className="bg-gray-900 px-1 rounded">led</code>, <code className="bg-gray-900 px-1 rounded">buzzer</code>, <code className="bg-gray-900 px-1 rounded">4seg</code>, <code className="bg-gray-900 px-1 rounded">ultrasonic</code> <br />
                                            Example: <code className="bg-gray-900 px-1 rounded">led,buzzer</code>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-mono text-cyan-300">duration</td>
                                        <td className="p-3 font-mono text-yellow-400">number</td>
                                        <td className="p-3 text-gray-500">No</td>
                                        <td className="p-3">Simulation duration in seconds. Max 10s. Default 5s.</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-mono text-cyan-300">distance</td>
                                        <td className="p-3 font-mono text-yellow-400">number</td>
                                        <td className="p-3 text-gray-500">No</td>
                                        <td className="p-3">Simulated obstacle distance (cm) for Ultrasonic sensors. Default 50.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Response Format */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileJson size={20} className="text-yellow-400" /> Response Format
                        </h3>
                        <p className="mb-4 text-sm text-gray-400">
                            The API returns a JSON object containing the simulation status, input settings, and a chronological list of GPIO events.
                        </p>
                        <pre className="bg-gray-950 p-4 rounded-lg border border-gray-700 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre">
                            {`{
  "status": "completed",
  "input_settings": {
    "lab": "hc-sr04",
    "duration": 5.0,
    "distance": 30
  },
  "used_pins": [
    17,
    12
  ],
  "logs": [
    {
      "time": 0.0,
      "action": "GPIO.setup",
      "pin": 17,
      "value": 0
    },
    {
      "time": 0.51,
      "action": "GPIO.output",
      "pin": 17,
      "value": 1
    },
    {
      "time": 1.51,
      "action": "PWM.ChangeDutyCycle",
      "pin": 12,
      "value": 50
    }
  ]
}`}
                        </pre>
                        <ul className="mt-4 space-y-2 text-sm text-gray-400 list-disc list-inside">
                            <li><strong className="text-white">used_pins</strong>: List of all GPIO pins used during the simulation.</li>
                            <li><strong className="text-white">logs</strong>: Array of events. Each event has a timestamp (seconds from start), action type, pin number (BCM or BOARD), and value.</li>
                            <li><strong className="text-white">action</strong>: Can be `GPIO.setup`, `GPIO.output`, `PWM.start`, `PWM.ChangeDutyCycle`, etc.</li>
                        </ul>
                    </section>

                    {/* Examples */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Code size={20} className="text-blue-400" /> Usage Examples
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Python Example */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Python (requests)</h4>
                                <pre className="bg-gray-950 p-4 rounded-lg border border-gray-700 font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre">
                                    {`import requests

url = "http://localhost:5050/api/simulate"
payload = {
    "code": """
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)
GPIO.output(17, GPIO.HIGH)
time.sleep(1)
    """,
    "lab": "led",
    "duration": 2
}

response = requests.post(url, json=payload)
print(response.json())`}
                                </pre>
                            </div>

                            {/* JavaScript Example */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-300 mb-2">JavaScript (fetch)</h4>
                                <pre className="bg-gray-950 p-4 rounded-lg border border-gray-700 font-mono text-xs text-yellow-300 overflow-x-auto whitespace-pre">
                                    {`const runSimulation = async () => {
  const response = await fetch('http://localhost:5050/api/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: \`
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)
GPIO.output(17, GPIO.HIGH)
time.sleep(1)
      \`,
      lab: 'led',
      duration: 2
    })
  });

  const result = await response.json();
  console.log(result);
};`}
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* Live Test */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <PlayCircle size={20} className="text-green-400" /> Live Test
                        </h3>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-400 mb-4">
                                Customize the request parameters below and send a real request to the server.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Lab / Sensors (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={testLab}
                                        onChange={(e) => setTestLab(e.target.value)}
                                        placeholder="e.g. led,buzzer"
                                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Duration (s)</label>
                                        <input
                                            type="number"
                                            value={testDurationInput}
                                            onChange={(e) => setTestDurationInput(Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Distance (cm)</label>
                                        <input
                                            type="number"
                                            value={testDistance}
                                            onChange={(e) => setTestDistance(Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs text-gray-500 mb-1">Python Code</label>
                                <textarea
                                    value={testCode}
                                    onChange={(e) => setTestCode(e.target.value)}
                                    className="w-full h-32 bg-gray-900 border border-gray-700 rounded p-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleTestApi}
                                disabled={testLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                            >
                                {testLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle size={16} /> Run Test Request
                                    </>
                                )}
                            </button>

                            {testResult && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>Status: <span className="text-green-400 font-bold">200 OK</span></span>
                                        <span>Time: <span className="text-yellow-400 font-bold">{testDuration}ms</span></span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute top-0 right-0 p-2 text-xs text-gray-500 font-mono">JSON</div>
                                        <pre className="bg-gray-950 p-4 rounded-lg border border-gray-700 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre-wrap max-h-64">
                                            {JSON.stringify(testResult, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};
