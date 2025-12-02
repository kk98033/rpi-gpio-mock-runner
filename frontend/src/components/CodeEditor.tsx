import React from 'react';
import { PlayCircle } from 'lucide-react';

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
    lab: string;
    setLab: (lab: string) => void;
    onRun: () => void;
    isLoading: boolean;
    duration: number;
    setDuration: (d: number) => void;
    distance: number;
    setDistance: (d: number) => void;
}

const LABS = [
    { id: 'led', name: 'LED / Breathing' },
    { id: 'clock', name: '7-Segment Clock' },
    { id: 'buzzer', name: 'Buzzer' },
    { id: 'hc-sr04', name: 'Ultrasonic (HC-SR04)' },
    { id: 'smart_alarm', name: 'Smart Alarm' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
    code, setCode, lab, setLab, onRun, isLoading,
    duration, setDuration, distance, setDistance
}) => {
    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-900 p-3 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-mono">Lab:</span>
                    <select
                        value={lab}
                        onChange={(e) => setLab(e.target.value)}
                        className="bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                    >
                        {LABS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>

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

                    {(lab === 'hc-sr04' || lab === 'smart_alarm') && (
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
