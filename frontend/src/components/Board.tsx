import React from 'react';
import type { PinState } from '../utils/gpioParser';
import { SevenSegment } from './SevenSegment';
import { Buzzer } from './Buzzer';
import { Ultrasonic } from './Ultrasonic';
import { Led } from './Led';
import type { ComponentConfig } from './PinMapping';

interface BoardProps {
    selectedSensors: string[];
    pinState: PinState;
    distance: number;
    setDistance: (d: number) => void;
    componentConfig?: ComponentConfig[];
}

export const Board: React.FC<BoardProps> = ({ selectedSensors, pinState, distance, setDistance, componentConfig }) => {

    const renderContent = () => {
        // Priority 1: Render based on manual Pin Mapping configuration
        if (componentConfig && componentConfig.length > 0) {
            return (
                <div className="flex flex-wrap gap-8 items-center justify-center">
                    {componentConfig.map(comp => {
                        switch (comp.type) {
                            case 'led':
                                return (
                                    <Led
                                        key={comp.id}
                                        pinState={pinState}
                                        pin={comp.pins.pin}
                                        label={`LED (GPIO ${comp.pins.pin})`}
                                    />
                                );
                            case 'buzzer':
                                return (
                                    <Buzzer
                                        key={comp.id}
                                        pinState={pinState}
                                        pin={comp.pins.pin}
                                    />
                                );
                            case 'ultrasonic':
                                return (
                                    <Ultrasonic
                                        key={comp.id}
                                        distance={distance}
                                        setDistance={setDistance}
                                    />
                                );
                            case '7-segment':
                                return <SevenSegment key={comp.id} pinState={pinState} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            );
        }

        // Priority 2: Render based on selected sensors (Default / Legacy Mode)
        return (
            <div className="flex flex-wrap gap-8 items-center justify-center p-8">
                {selectedSensors.length === 0 && (
                    <div className="text-gray-500">Select sensors to visualize components.</div>
                )}

                {selectedSensors.includes('led') && (
                    <div className="flex gap-4 p-4 border border-gray-800 rounded-xl bg-gray-900/50">
                        <Led pinState={pinState} pin={17} color="red" label="LED 1 (17)" />
                        <Led pinState={pinState} pin={27} color="green" label="LED 2 (27)" />
                        <Led pinState={pinState} pin={22} color="blue" label="LED 3 (22)" />
                        {/* Extra LED for PWM or other uses */}
                        <Led pinState={pinState} pin={18} color="white" label="PWM (18)" />
                    </div>
                )}

                {selectedSensors.includes('buzzer') && (
                    <Buzzer pinState={pinState} pin={12} />
                )}

                {selectedSensors.includes('4seg') && (
                    <SevenSegment pinState={pinState} />
                )}

                {selectedSensors.includes('ultrasonic') && (
                    <Ultrasonic distance={distance} setDistance={setDistance} />
                )}
            </div>
        );
    };

    return (
        <div className="w-full h-full min-h-[400px] bg-gray-900 rounded-xl border border-gray-700 p-8 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            <div className="relative z-10 w-full flex justify-center">
                {renderContent()}
            </div>
        </div>
    );
};
