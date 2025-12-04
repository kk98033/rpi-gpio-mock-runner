import React from 'react';
import { PlayCircle } from 'lucide-react';

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
    selectedSensors: string[];
    setSelectedSensors: (sensors: string[]) => void;
    onRun: () => void;
    isLoading: boolean;
    duration: number;
    setDuration: (d: number) => void;
    distance: number;
    setDistance: (d: number) => void;
}

const SENSORS = [
    { id: 'led', name: 'LED' },
    { id: 'buzzer', name: 'Buzzer' },
    { id: '4seg', name: '7-Segment' },
    { id: 'ultrasonic', name: 'Ultrasonic' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
    code, setCode, selectedSensors, setSelectedSensors, onRun, isLoading,
    duration, setDuration, distance, setDistance
}) => {
    const toggleSensor = (id: string) => {
        if (selectedSensors.includes(id)) {
            setSelectedSensors(selectedSensors.filter(s => s !== id));
        } else {
            setSelectedSensors([...selectedSensors, id]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-900 p-3 border-b border-gray-700 flex flex-col gap-3">
                {/* Top Row: Sensors */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-sm font-mono">Sensors:</span>
                    <div className="flex gap-2">
                        {SENSORS.map(sensor => (
                            <button
                                key={sensor.id}
                                onClick={() => toggleSensor(sensor.id)}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${selectedSensors.includes(sensor.id)
                                        ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200'
                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {sensor.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Row: Controls */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-mono">Duration(s):</span>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-16 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                                min={1}
                                max={10}
                            />
                        </div>

                        {selectedSensors.includes('ultrasonic') && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs font-mono">Dist(cm):</span>
                                <input
                                    type="number"
                                    value={distance}
                                    onChange={(e) => setDistance(Number(e.target.value))}
                                    className="w-16 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onRun}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-bold transition-all ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'}`}
                    >
                        {isLoading ? 'Running...' : <><PlayCircle size={16} /> Run Simulation</>}
                    </button>
                </div>
            </div>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 focus:outline-none resize-none"
                spellCheck={false}
                placeholder="# Paste your Python code here..."
            />
        </div>
    );
};
