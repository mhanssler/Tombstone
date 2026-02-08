import { useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  elapsed: number; // elapsed time in ms
  isRunning: boolean;
  start: () => void;
  stop: () => number; // returns elapsed time
  reset: () => void;
}

export function useTimer(startTime?: number): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(Boolean(startTime));
  const [startedAt, setStartedAt] = useState<number | null>(startTime ?? null);
  const [elapsed, setElapsed] = useState(startTime ? Date.now() - startTime : 0);

  useEffect(() => {
    if (!isRunning || !startedAt) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  // Update if startTime changes externally
  useEffect(() => {
    if (startTime) {
      setStartedAt(startTime);
      setIsRunning(true);
      setElapsed(Date.now() - startTime);
    } else {
      setIsRunning(false);
      setStartedAt(null);
    }
  }, [startTime]);

  const start = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setIsRunning(true);
    setElapsed(0);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    const finalElapsed = startedAt ? Date.now() - startedAt : elapsed;
    return finalElapsed;
  }, [startedAt, elapsed]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    setElapsed(0);
  }, []);

  return { elapsed, isRunning, start, stop, reset };
}
