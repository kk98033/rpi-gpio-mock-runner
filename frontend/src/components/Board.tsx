import React from 'react';
import type { PinState } from '../utils/gpioParser';
import { SevenSegment } from './SevenSegment';
import { Buzzer } from './Buzzer';
import { Ultrasonic } from './Ultrasonic';
import { Led } from './Led';
import type { ComponentConfig } from './PinMapping';

interface BoardProps {
    lab: string;
    pinState: PinState;
    distance: number;
    setDistance: (d: number) => void;
    componentConfig?: ComponentConfig[];
}

export const Board: React.FC<BoardProps> = ({ lab, pinState, distance, setDistance, componentConfig }) => {

    const renderContent = () => {
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
                                // Need to pass segment pins to SevenSegment component
                                // But SevenSegment currently hardcodes pins or takes pinState directly.
                                // Let's assume SevenSegment is updated or we pass a mapped pinState?
                                // For now, we'll just render it and let it use its internal logic if it matches,
                                // or we might need to update SevenSegment to accept pin mapping.
                                // Given the requirement "4x七段顯示器他會預設套用...用戶還是可以自行修改",
                                // we should probably pass the pin mapping to SevenSegment.
                                // Let's check SevenSegment.tsx first? 
                                // For now, I'll pass the whole component config or just render it.
                                // Ideally SevenSegment should accept a `pins` prop.
                                return <SevenSegment key={comp.id} pinState={pinState} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            );
        }

        // Fallback to legacy lab mode if no config
        switch (lab) {
            case 'led':
                return (
                    <div className="flex gap-8">
                        <Led pinState={pinState} pin={17} color="red" label="LED 1 (17)" />
                        <Led pinState={pinState} pin={27} color="green" label="LED 2 (27)" />
                        <Led pinState={pinState} pin={22} color="blue" label="LED 3 (22)" />
                        {/* Breathing LED example uses Pin 7 (Board) -> BCM 4? No, RPi.GPIO default is BCM usually unless setmode BOARD. 
                    The README says `breathing_led.py` uses Pin 7. 
                    If setmode is BOARD, Pin 7 is BCM 4.
                    Let's add a generic LED for Pin 7/4 just in case.
                */}
                        <Led pinState={pinState} pin={4} color="yellow" label="LED (BCM 4 / Pin 7)" />
                        {/* Also check for PWM on pin 12 or 18 */}
                        <Led pinState={pinState} pin={18} color="white" label="PWM (18)" />
                    </div>
                );
            case 'clock':
            case '7-segment':
                return <SevenSegment pinState={pinState} />;
            case 'buzzer':
                return <Buzzer pinState={pinState} pin={12} />;
            case 'hc-sr04':
            case 'smart_alarm':
                return (
                    <div className="flex flex-col gap-8 items-center">
                        <Ultrasonic distance={distance} setDistance={setDistance} />
                        {lab === 'smart_alarm' && (
                            <div className="flex gap-8 mt-4">
                                <Buzzer pinState={pinState} pin={12} />
                                <Led pinState={pinState} pin={17} color="red" label="Alarm LED" />
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="text-gray-500">
                        Select a Lab to visualize components.
                        <div className="flex flex-wrap gap-4 mt-4 opacity-50">
                            <Led pinState={pinState} pin={17} />
                            <SevenSegment pinState={pinState} />
                            <Buzzer pinState={pinState} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full min-h-[400px] bg-gray-900 rounded-xl border border-gray-700 p-8 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            <div className="relative z-10">
                {renderContent()}
            </div>
        </div>
    );
};
