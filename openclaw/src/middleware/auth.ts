export function verifyServiceToken(authHeader: string | null): boolean {
  if (!authHeader) return false;
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const expectedToken = process.env.BACKEND_SERVICE_TOKEN;
  
  if (!expectedToken) {
    console.error('BACKEND_SERVICE_TOKEN is not configured');
    return false;
  }
  
  return token === expectedToken;
}
