import React from 'react';
import type { PinState } from '../utils/gpioParser';

interface LedProps {
    pinState: PinState;
    pin: number;
    color?: string;
    label?: string;
}

export const Led: React.FC<LedProps> = ({ pinState, pin, color = 'red', label }) => {
    // Check if pin is high (1) or PWM > 0
    // PinState is now Record<number, { value: number, frequency?: number }>
    const pinData = pinState[pin];
    const value = pinData ? pinData.value : 0;
    const isOn = value > 0;

    // Calculate opacity for PWM (0-100)
    const opacity = Math.min(value, 100) / 100;

    // Map color names to Tailwind classes or hex
    const getColorClass = (c: string) => {
        switch (c) {
            case 'red': return 'bg-red-500 shadow-red-500/50';
            case 'green': return 'bg-green-500 shadow-green-500/50';
            case 'blue': return 'bg-blue-500 shadow-blue-500/50';
            case 'yellow': return 'bg-yellow-500 shadow-yellow-500/50';
            default: return 'bg-red-500 shadow-red-500/50';
        }
    };

    return (
        <div className="flex flex-col items-center mx-2">
            <div
                className={`w-8 h-8 rounded-full transition-all duration-75 border-2 border-gray-600 ${isOn ? getColorClass(color) + ' shadow-[0_0_15px_currentColor]' : 'bg-gray-800'}`}
                style={{ opacity: isOn ? Math.max(0.3, opacity) : 1 }}
            ></div>
            <div className="text-xs text-gray-400 mt-1 font-mono">{label || `Pin ${pin}`}</div>
        </div>
    );
};
