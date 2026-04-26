import { backendClient } from '../clients/backend';

export async function appendLog(userId: string, event: string): Promise<void> {
  const path = `/users/${userId}/log`;
  
  // Use Promise.allSettled so failures don't affect the response
  await Promise.allSettled([
    backendClient.post(path, { event })
  ]);
}
