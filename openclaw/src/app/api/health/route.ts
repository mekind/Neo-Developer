import { NextResponse } from 'next/server';

const BOOT_TIME = Date.now();

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.BACKEND_BASE_URL;
  let backend: 'ok' | 'unreachable' | 'unconfigured' = 'unconfigured';

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(2_000),
      });
      backend = res.ok ? 'ok' : 'unreachable';
    } catch {
      backend = 'unreachable';
    }
  }

  return NextResponse.json({
    ok: true,
    service: 'openclaw',
    version: process.env.npm_package_version ?? '0.1.0',
    uptime_s: Math.floor((Date.now() - BOOT_TIME) / 1000),
    checks: {
      ai_gateway: process.env.AI_GATEWAY_API_KEY ? 'configured' : 'unconfigured',
      backend,
      default_model: process.env.DEFAULT_MODEL ?? null,
    },
  });
}
