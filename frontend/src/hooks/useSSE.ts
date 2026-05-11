import { useCallback, useRef, useState } from 'react';
import { createSSEConnection } from '../services/api';
import type { OutreachResult, SSEEvent } from '../types';

interface UseSSEReturn {
  events: SSEEvent[];
  result: OutreachResult | null;
  isStreaming: boolean;
  error: string | null;
  connect: (jobId: string) => void;
  disconnect: () => void;
}

export function useSSE(): UseSSEReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const errorCountRef = useRef(0);
  const doneRef = useRef(false);

  const disconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const connect = useCallback(
    (jobId: string) => {
      disconnect();
      setEvents([]);
      setResult(null);
      setError(null);
      setIsStreaming(true);
      errorCountRef.current = 0;
      doneRef.current = false;

      const source = createSSEConnection(jobId);
      sourceRef.current = source;

      source.onmessage = (event) => {
        try {
          // Reset error count on successful message
          errorCountRef.current = 0;

          const data: SSEEvent = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);

          if (data.status === 'complete' && data.result) {
            doneRef.current = true;
            setResult(data.result);
            setIsStreaming(false);
            source.close();
          }

          if (data.status === 'error') {
            setError(data.message);
            setIsStreaming(false);
            source.close();
          }
        } catch {
          // Skip malformed events
        }
      };

      source.onerror = () => {
        // Don't error if we already completed
        if (doneRef.current) return;

        errorCountRef.current += 1;

        // EventSource auto-reconnects. Only give up after 5 consecutive errors.
        if (errorCountRef.current >= 5) {
          setError('Connection lost. Please try again.');
          setIsStreaming(false);
          source.close();
        }
        // Otherwise let EventSource auto-reconnect
      };
    },
    [disconnect]
  );

  return { events, result, isStreaming, error, connect, disconnect };
}
