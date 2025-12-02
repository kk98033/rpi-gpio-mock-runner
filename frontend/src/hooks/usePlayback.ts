import { useState, useEffect, useRef } from 'react';

interface UsePlaybackProps {
    duration: number;
    onTimeUpdate?: (time: number) => void;
}

export const usePlayback = ({ duration, onTimeUpdate }: UsePlaybackProps) => {
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | undefined>(undefined);

    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = (time - lastTimeRef.current) / 1000;
            setCurrentTime((prevTime) => {
                const newTime = prevTime + deltaTime * playbackSpeed;
                if (newTime >= duration) {
                    setIsPlaying(false);
                    return duration;
                }
                return newTime;
            });
        }
        lastTimeRef.current = time;
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            lastTimeRef.current = undefined;
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, duration, playbackSpeed]);

    useEffect(() => {
        if (onTimeUpdate) {
            onTimeUpdate(currentTime);
        }
    }, [currentTime, onTimeUpdate]);

    const togglePlay = () => {
        if (currentTime >= duration) {
            setCurrentTime(0);
        }
        setIsPlaying(!isPlaying);
    };

    const stop = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const seek = (time: number) => {
        setCurrentTime(Math.max(0, Math.min(time, duration)));
    };

    return {
        currentTime,
        isPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        togglePlay,
        stop,
        seek,
        setCurrentTime
    };
};
