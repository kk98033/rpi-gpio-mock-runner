import React from 'react';
import { FileJson } from 'lucide-react';

interface JsonViewerProps {
    data: any;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
                <FileJson size={16} className="text-yellow-500" />
                <span className="text-gray-300 text-sm font-bold uppercase tracking-wider">Simulation Output (JSON)</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
};
