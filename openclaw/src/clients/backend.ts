export class BackendClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
    this.token = process.env.BACKEND_SERVICE_TOKEN || '';
  }

  async fetch(path: string, options: RequestInit = {}, retries = 1): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok && retries > 0) {
        return this.fetch(path, options, retries - 1);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        return this.fetch(path, options, retries - 1);
      }
      throw error;
    }
  }

  async post(path: string, body: any) {
    return this.fetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async fetchDueAgents(now?: string): Promise<any[]> {
    const url = new URL('/agents/due', this.baseUrl);
    if (now) {
      url.searchParams.set('at', now);
    }
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch due agents: ${res.status}`);
    }
    return res.json();
  }

  async createNotification(userId: string, data: { agentId?: string, kind: string, body: string, meta?: any }) {
    const res = await this.post(`/users/${userId}/notifications`, data);
    if (!res.ok) {
      throw new Error(`Failed to create notification: ${res.status}`);
    }
    return res.json();
  }
}

export const backendClient = new BackendClient();
