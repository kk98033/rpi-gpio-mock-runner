import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface TimelineProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
    currentTime,
    duration,
    isPlaying,
    onTogglePlay,
    onStop,
    onSeek,
    playbackSpeed,
    setPlaybackSpeed,
}) => {
    const formatTime = (t: number) => t.toFixed(3);

    return (
        <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 font-mono text-lg font-bold">
                    {formatTime(currentTime)}s <span className="text-gray-500">/ {formatTime(duration)}s</span>
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Speed:</span>
                    {[0.1, 0.5, 1, 2, 5].map((speed) => (
                        <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-2 py-1 text-xs rounded ${playbackSpeed === speed ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>

            <input
                type="range"
                min="0"
                max={duration}
                step="0.01"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
            />

            <div className="flex justify-center items-center gap-4 mt-4">
                <button
                    onClick={onTogglePlay}
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button
                    onClick={onStop}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                    <Square size={20} fill="currentColor" />
                </button>
            </div>
        </div>
    );
};
