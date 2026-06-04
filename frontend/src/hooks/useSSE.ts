import { useCallback, useRef, useState } from 'react';
import { createSSEConnection, fetchResult } from '../services/api';
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
          errorCountRef.current = 0;

          const data = JSON.parse(event.data) as SSEEvent & { type?: string };

          // Ignore keepalive pings
          if (data.type === 'ping') return;

          setEvents((prev) => [...prev, data]);

          if (data.status === 'complete') {
            doneRef.current = true;
            if (data.result) {
              setResult(data.result);
            } else {
              // Backend finished but sent no result — try fetching directly
              fetchResult(jobId).then((r) => {
                if (r) setResult(r as OutreachResult);
                else setError('Processing completed but result was unavailable. Please try again.');
              });
            }
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
        if (doneRef.current) return;

        errorCountRef.current += 1;

        // After 5 consecutive errors, try fetching result before giving up
        if (errorCountRef.current >= 5) {
          source.close();
          fetchResult(jobId).then((r) => {
            if (r) {
              doneRef.current = true;
              setResult(r as OutreachResult);
              setIsStreaming(false);
            } else {
              setError('Connection lost. Please try again.');
              setIsStreaming(false);
            }
          });
        }
        // Otherwise let EventSource auto-reconnect
      };
    },
    [disconnect]
  );

  return { events, result, isStreaming, error, connect, disconnect };
}
