import { useState } from 'react';
import { startOutreach } from '../services/api';
import type { OutreachRequest } from '../types';
import { useSSE } from './useSSE';

export function useOutreach() {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const sse = useSSE();

  const generate = async (request: OutreachRequest) => {
    setIsStarting(true);
    setStartError(null);

    try {
      const { job_id } = await startOutreach(request);
      sse.connect(job_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setStartError(message);
    } finally {
      setIsStarting(false);
    }
  };

  return {
    generate,
    isStarting,
    startError,
    events: sse.events,
    result: sse.result,
    isStreaming: sse.isStreaming,
    sseError: sse.error,
  };
}
