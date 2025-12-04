import React, { useState } from 'react';
import { FileJson, Maximize2, Minimize2 } from 'lucide-react';

interface JsonViewerProps {
    data: any;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!data) return null;

    return (
        <div className={`flex flex-col bg-gray-900 border border-gray-700 overflow-hidden transition-all duration-200 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full rounded-lg'}`}>
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileJson size={16} className="text-yellow-500" />
                    <span className="text-gray-300 text-sm font-bold uppercase tracking-wider">Simulation Output (JSON)</span>
                </div>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <pre className={`font-mono text-green-400 whitespace-pre-wrap break-all ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
};
