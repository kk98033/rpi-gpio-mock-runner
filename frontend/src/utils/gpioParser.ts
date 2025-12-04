export interface LogEntry {
    time: number;
    action: string;
    pin: number;
    value: number;
}

export interface PinStateValue {
    value: number;
    frequency?: number;
}

export interface SimulationResult {
    program: string;
    start_time: number;
    duration: number;
    logs: LogEntry[];
    input_settings?: {
        lab: string;
        duration: number;
        distance: number;
    };
}

export type PinState = Record<number, PinStateValue>;

export const parseGpioState = (logs: LogEntry[], currentTime: number): PinState => {
    const state: PinState = {};

    // Initialize all used pins to 0 (or 1 if active low? usually 0 is low)
    // We'll assume 0.

    for (const log of logs) {
        if (log.time > currentTime) break;

        // Only care about output actions
        if (log.action === 'GPIO.output' || log.action === 'PWM.ChangeDutyCycle' || log.action === 'PWM.start') {
            if (!state[log.pin]) state[log.pin] = { value: 0 };
            state[log.pin].value = log.value;
        }

        if (log.action === 'PWM.init') {
            if (!state[log.pin]) state[log.pin] = { value: 0 };
            state[log.pin].frequency = log.value;
        }

        if (log.action === 'PWM.ChangeFrequency') {
            if (!state[log.pin]) state[log.pin] = { value: 0 };
            state[log.pin].frequency = log.value;
        }

        // Handle PWM stop?
        if (log.action === 'PWM.stop') {
            if (!state[log.pin]) state[log.pin] = { value: 0 };
            state[log.pin].value = 0;
        }
    }

    return state;
};
