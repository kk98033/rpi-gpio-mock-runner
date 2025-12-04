import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { PinState } from '../utils/gpioParser';

interface BuzzerProps {
    pinState: PinState;
    pin?: number;
}

export const Buzzer: React.FC<BuzzerProps> = ({ pinState, pin = 12 }) => {
    // Check if pin is high or has PWM value > 0
    const pinData = pinState[pin];
    const value = pinData ? pinData.value : 0;
    const frequency = pinData?.frequency || 440; // Default to 440Hz
    const isOn = value > 0;

    // Calculate intensity for PWM (0-100)
    // const intensity = Math.min(value, 100) / 100; // Unused

    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);

    useEffect(() => {
        if (isOn) {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (!oscillatorRef.current) {
                const osc = audioCtxRef.current.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);

                const gainNode = audioCtxRef.current.createGain();
                gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);

                osc.connect(gainNode);
                gainNode.connect(audioCtxRef.current.destination);

                osc.start();
                oscillatorRef.current = osc;
            } else {
                // Update frequency if already running
                oscillatorRef.current.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
            }
        }

        return () => {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
        };
    }, [isOn, value, frequency]);

    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg w-32">
            <div className={`relative p-4 rounded-full transition-all duration-100 ${isOn ? 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : 'bg-gray-600'}`}>
                {isOn ? (
                    <Volume2 size={32} className="text-black animate-pulse" />
                ) : (
                    <VolumeX size={32} className="text-gray-400" />
                )}

                {/* Sound waves animation */}
                {isOn && (
                    <>
                        <div className="absolute inset-0 rounded-full border-2 border-yellow-500 animate-ping opacity-75"></div>
                        <div className="absolute -inset-2 rounded-full border border-yellow-500 animate-ping opacity-50 delay-75"></div>
                    </>
                )}
            </div>
            <div className="mt-2 text-center">
                <div className="text-sm font-bold text-gray-300">Buzzer</div>
                <div className="text-xs text-gray-500 font-mono">Pin {pin}</div>
                {isOn && <div className="text-xs text-yellow-400 font-mono mt-1">PWM: {value}%</div>}
            </div>
        </div>
    );
};
