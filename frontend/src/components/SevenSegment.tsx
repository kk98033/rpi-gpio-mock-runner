import React from 'react';
import type { PinState } from '../utils/gpioParser';

interface SevenSegmentProps {
    pinState: PinState;
}

// Pin Mappings
const SEGMENTS = [2, 3, 4, 17, 27, 22, 10, 9]; // a, b, c, d, e, f, g, dp
const DIGITS = [11, 5, 6, 13]; // DIG1, DIG2, DIG3, DIG4

export const SevenSegment: React.FC<SevenSegmentProps> = ({ pinState }) => {
    // Helper to check if a pin is active (LOW = 0 is ON)
    const isPinActive = (pin: number) => {
        const pinData = pinState[pin];
        const val = pinData ? pinData.value : 1; // Default to 1 (HIGH/OFF)
        return val === 0;
    };

    // Render a single digit
    const renderDigit = (digitPin: number, index: number) => {
        const isDigitActive = isPinActive(digitPin);

        // If the digit common pin is NOT active (HIGH), the whole digit is off (for Common Anode/Cathode logic)
        // Assuming Common Anode: Digit Pin HIGH = ON? Or LOW = ON?
        // Usually Common Cathode: Digit LOW = Select, Segment HIGH = Light.
        // Or Common Anode: Digit HIGH = Select, Segment LOW = Light.
        // The python script says: "active_digits = [pin for pin in digits if state.get(pin, 1) == 0]"
        // So Digit Pin LOW (0) = Active.
        // "seg_states = [state.get(pin, 0) == 0 for pin in segments] # 低電位亮"
        // So Segment Pin LOW (0) = Light.
        // This implies Common Anode? (VCC on digit, Ground on segment to light?)
        // Wait, if Digit is LOW (GND) and Segment is LOW (GND), no current flows.
        // If Digit is HIGH (VCC) and Segment is LOW (GND), current flows -> Light.
        // BUT the python script says `active_digits` are those with state 0.
        // And `seg_states` are those with state 0.
        // This is confusing electrically but we follow the python logic:
        // Digit is ACTIVE if 0. Segment is ON if 0.
        // So we light up if Digit is 0 AND Segment is 0.

        // const opacity = isDigitActive ? 1 : 0.1; // Unused

        // Segment positions (approximate SVG paths)
        // A: Top
        // B: Top Right
        // C: Bottom Right
        // D: Bottom
        // E: Bottom Left
        // F: Top Left
        // G: Middle
        // DP: Dot

        const segmentOn = (segIndex: number) => isPinActive(SEGMENTS[segIndex]);

        const getColor = (segIndex: number) => {
            return isDigitActive && segmentOn(segIndex) ? '#ff0000' : '#330000'; // Red LED
        };

        return (
            <div key={digitPin} className="relative w-16 h-24 mx-1">
                <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-md">
                    {/* A */}
                    <path d="M 20 10 L 80 10 L 70 20 L 30 20 Z" fill={getColor(0)} />
                    {/* B */}
                    <path d="M 80 10 L 90 20 L 80 70 L 70 60 L 70 20 Z" fill={getColor(1)} />
                    {/* C */}
                    <path d="M 80 70 L 90 80 L 80 130 L 70 120 L 70 80 Z" fill={getColor(2)} />
                    {/* D */}
                    <path d="M 20 130 L 80 130 L 70 120 L 30 120 Z" fill={getColor(3)} />
                    {/* E */}
                    <path d="M 20 70 L 30 80 L 30 120 L 20 130 L 10 120 L 10 80 Z" fill={getColor(4)} />
                    {/* F */}
                    <path d="M 20 10 L 30 20 L 30 60 L 20 70 L 10 60 L 10 20 Z" fill={getColor(5)} />
                    {/* G */}
                    <path d="M 20 70 L 30 60 L 70 60 L 80 70 L 70 80 L 30 80 Z" fill={getColor(6)} />
                    {/* DP */}
                    <circle cx="90" cy="130" r="5" fill={getColor(7)} />
                </svg>
                <div className="absolute top-0 left-0 text-xs text-gray-600 font-mono">{index + 1}</div>
            </div>
        );
    };

    return (
        <div className="bg-black p-4 rounded-xl border-4 border-gray-800 shadow-2xl inline-block">
            <div className="flex">
                {DIGITS.map((pin, idx) => renderDigit(pin, idx))}
            </div>
            <div className="text-center text-gray-500 text-xs mt-2 font-mono">4-Digit 7-Segment Display</div>
        </div>
    );
};
