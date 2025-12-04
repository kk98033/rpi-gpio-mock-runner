import React, { useState, useEffect } from 'react';
import { Trash2, PlayCircle, AlertCircle } from 'lucide-react';

export interface ComponentConfig {
    id: string;
    type: 'led' | 'buzzer' | 'ultrasonic' | '7-segment';
    pins: { [key: string]: number };
}

interface PinMappingProps {
    usedPins: number[];
    onStart: (config: ComponentConfig[]) => void;
}

export const PinMapping: React.FC<PinMappingProps> = ({ usedPins, onStart }) => {
    const [components, setComponents] = useState<ComponentConfig[]>([]);
    const [availablePins, setAvailablePins] = useState<number[]>([]);

    useEffect(() => {
        // Calculate available pins based on usedPins and assigned pins
        const assigned = new Set<number>();
        components.forEach(c => Object.values(c.pins).forEach(p => assigned.add(p)));
        setAvailablePins(usedPins.filter(p => !assigned.has(p)));
    }, [usedPins, components]);

    const addComponent = (type: ComponentConfig['type']) => {
        const newComponent: ComponentConfig = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            pins: {}
        };

        // Auto-assign pins if possible
        if (type === '7-segment') {
            // Auto-map if standard pins are present
            // segments = [2,3,4,17,27,22,10,9] (a-g, dp)
            // digits = [11,5,6,13] (d1-d4)
            const standardSegments = [2, 3, 4, 17, 27, 22, 10, 9];
            const segmentNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'];
            const standardDigits = [11, 5, 6, 13];
            const digitNames = ['d1', 'd2', 'd3', 'd4'];

            const hasAllSegments = standardSegments.every(p => usedPins.includes(p));
            const hasAllDigits = standardDigits.every(p => usedPins.includes(p));

            if (hasAllSegments && hasAllDigits) {
                newComponent.pins = {};
                standardSegments.forEach((p, i) => {
                    newComponent.pins[segmentNames[i]] = p;
                });
                standardDigits.forEach((p, i) => {
                    newComponent.pins[digitNames[i]] = p;
                });
            } else {
                newComponent.pins = {};
            }
        } else if (type === 'ultrasonic') {
            // Needs 2 pins
        } else {
            // Needs 1 pin
            if (availablePins.length > 0) {
                newComponent.pins = { pin: availablePins[0] };
            }
        }

        setComponents([...components, newComponent]);
    };

    const removeComponent = (id: string) => {
        setComponents(components.filter(c => c.id !== id));
    };

    const updateComponentPin = (id: string, pinKey: string, pinValue: number) => {
        setComponents(components.map(c => {
            if (c.id === id) {
                return { ...c, pins: { ...c.pins, [pinKey]: pinValue } };
            }
            return c;
        }));
    };

    const getPinOptions = (currentPin?: number) => {
        const opts = availablePins.map(p => (
            <option key={p} value={p}>GPIO {p}</option>
        ));
        if (currentPin && !availablePins.includes(currentPin)) {
            opts.push(<option key={currentPin} value={currentPin}>GPIO {currentPin}</option>);
        }
        return opts;
    };

    const isConfigValid = () => {
        // Check if all used pins are assigned? Or just if all components have pins?
        // Requirement: "每個pin都找到主人才能進行模擬" (Every pin must find an owner to simulate)
        const assigned = new Set<number>();
        components.forEach(c => Object.values(c.pins).forEach(p => assigned.add(p)));
        return usedPins.every(p => assigned.has(p));
    };

    return (
        <div className="w-full h-full p-6 bg-gray-900 rounded-xl border border-gray-700 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="text-cyan-400" /> Configure Visualization
            </h2>
            <p className="text-gray-400 mb-6">
                Map the detected GPIO pins to virtual components. All detected pins must be assigned.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                {/* Detected Pins List */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">Detected Pins</h3>
                    <div className="flex flex-wrap gap-2">
                        {usedPins.map(p => {
                            const isAssigned = !availablePins.includes(p);
                            return (
                                <span
                                    key={p}
                                    className={`px-2 py-1 rounded text-xs font-mono font-bold ${isAssigned ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-red-900 text-red-300 border border-red-700 animate-pulse'}`}
                                >
                                    GPIO {p} {isAssigned ? '(Mapped)' : '(Unmapped)'}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Components List */}
                {components.map(comp => (
                    <div key={comp.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 relative group">
                        <button
                            onClick={() => removeComponent(comp.id)}
                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-24 font-bold text-cyan-300 uppercase text-sm">{comp.type}</div>

                            <div className="flex-1 flex flex-wrap gap-4">
                                {comp.type === 'led' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-400">Pin:</label>
                                        <select
                                            value={comp.pins.pin || ''}
                                            onChange={(e) => updateComponentPin(comp.id, 'pin', Number(e.target.value))}
                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {getPinOptions(comp.pins.pin)}
                                        </select>
                                    </div>
                                )}

                                {comp.type === 'buzzer' && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-400">Pin:</label>
                                        <select
                                            value={comp.pins.pin || ''}
                                            onChange={(e) => updateComponentPin(comp.id, 'pin', Number(e.target.value))}
                                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {getPinOptions(comp.pins.pin)}
                                        </select>
                                    </div>
                                )}

                                {comp.type === 'ultrasonic' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-400">Trig:</label>
                                            <select
                                                value={comp.pins.trig || ''}
                                                onChange={(e) => updateComponentPin(comp.id, 'trig', Number(e.target.value))}
                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                {getPinOptions(comp.pins.trig)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-400">Echo:</label>
                                            <select
                                                value={comp.pins.echo || ''}
                                                onChange={(e) => updateComponentPin(comp.id, 'echo', Number(e.target.value))}
                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                                            >
                                                <option value="">Select...</option>
                                                {getPinOptions(comp.pins.echo)}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {comp.type === '7-segment' && (
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="text-xs text-gray-500">Segments (a,b,c,d,e,f,g,dp)</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].map(seg => (
                                                <div key={seg} className="flex items-center gap-1">
                                                    <label className="text-xs text-gray-400 w-4">{seg}</label>
                                                    <select
                                                        value={comp.pins[seg] || ''}
                                                        onChange={(e) => updateComponentPin(comp.id, seg, Number(e.target.value))}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-xs text-white focus:border-cyan-500 outline-none"
                                                    >
                                                        <option value="">-</option>
                                                        {getPinOptions(comp.pins[seg])}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Digits (1,2,3,4)</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['d1', 'd2', 'd3', 'd4'].map(digit => (
                                                <div key={digit} className="flex items-center gap-1">
                                                    <label className="text-xs text-gray-400 w-4">{digit.replace('d', '')}</label>
                                                    <select
                                                        value={comp.pins[digit] || ''}
                                                        onChange={(e) => updateComponentPin(comp.id, digit, Number(e.target.value))}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-xs text-white focus:border-cyan-500 outline-none"
                                                    >
                                                        <option value="">-</option>
                                                        {getPinOptions(comp.pins[digit])}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Component Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => addComponent('led')}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <span className="text-sm font-bold text-gray-300">Add LED</span>
                    </button>
                    <button
                        onClick={() => addComponent('buzzer')}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-bold text-gray-300">Add Buzzer</span>
                    </button>
                    <button
                        onClick={() => addComponent('ultrasonic')}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/50 flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-bold text-gray-300">Add Ultrasonic</span>
                    </button>
                    <button
                        onClick={() => addComponent('7-segment')}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
                    >
                        <div className="w-8 h-8 bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-500 font-mono text-xs">
                            8.8.8.8
                        </div>
                        <span className="text-sm font-bold text-gray-300">Add 7-Segment</span>
                    </button>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-800 pt-4 flex justify-end">
                <button
                    onClick={() => onStart(components)}
                    disabled={!isConfigValid()}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all shadow-lg shadow-cyan-500/20"
                >
                    <PlayCircle size={20} />
                    Start Visualization
                </button>
            </div>
        </div>
    );
};
