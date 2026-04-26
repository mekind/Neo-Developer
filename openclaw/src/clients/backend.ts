export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
export const BACKEND_SERVICE_TOKEN = process.env.BACKEND_SERVICE_TOKEN || '';

export const backendClient = {
  async fetchDueAgents(now?: string): Promise<any[]> {
    const url = new URL('/agents/due', BACKEND_BASE_URL);
    if (now) {
      url.searchParams.set('at', now);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${BACKEND_SERVICE_TOKEN}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch due agents: ${res.status}`);
    }

    return res.json();
  },

  async createNotification(userId: string, data: { agentId?: string, kind: string, body: string, meta?: any }) {
    const url = `${BACKEND_BASE_URL}/users/${userId}/notifications`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BACKEND_SERVICE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      throw new Error(`Failed to create notification: ${res.status}`);
    }

    return res.json();
  }
};
