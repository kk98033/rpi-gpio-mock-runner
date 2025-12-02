import React from 'react';
import { Radar } from 'lucide-react';

interface UltrasonicProps {
    distance: number;
    setDistance: (d: number) => void;
}

export const Ultrasonic: React.FC<UltrasonicProps> = ({ distance, setDistance }) => {
    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg w-48">
            <div className="flex gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 border-4 border-gray-500 shadow-inner flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full opacity-20"></div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-300 border-4 border-gray-500 shadow-inner flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full opacity-20"></div>
                </div>
            </div>

            <div className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-1">
                <Radar size={16} className="text-cyan-400" /> HC-SR04
            </div>

            <div className="w-full">
                <label className="text-xs text-gray-500 block mb-1">Obstacle Distance (cm)</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="2"
                        max="400"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-gray-400">cm</span>
                </div>
            </div>

            {/* Visual representation of distance */}
            <div className="w-full mt-3 h-1 bg-gray-700 rounded overflow-hidden relative">
                <div
                    className="absolute left-0 top-0 h-full bg-cyan-500 transition-all"
                    style={{ width: `${Math.min((distance / 400) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};
