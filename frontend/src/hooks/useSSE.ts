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

      const source = createSSEConnection(jobId);
      sourceRef.current = source;

      source.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);

          if (data.status === 'complete' && data.result) {
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
        // Only show error if we haven't completed successfully
        if (sourceRef.current?.readyState === EventSource.CLOSED) {
          return;
        }
        setError('Connection lost. Try again.');
        setIsStreaming(false);
        source.close();
      };
    },
    [disconnect]
  );

  return { events, result, isStreaming, error, connect, disconnect };
}
