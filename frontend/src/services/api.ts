import type { OutreachRequest } from '../types';

const API_BASE = '/api';

export async function startOutreach(
  request: OutreachRequest
): Promise<{ job_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/outreach/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Failed to start outreach');
  }

  return response.json();
}

export function createSSEConnection(jobId: string): EventSource {
  return new EventSource(`${API_BASE}/outreach/stream/${jobId}`);
}
