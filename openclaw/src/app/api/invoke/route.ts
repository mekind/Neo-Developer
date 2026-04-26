import { NextRequest, NextResponse } from 'next/server';
import { InvokeRequestSchema } from '@/types/zod-schemas';
import { verifyServiceToken } from '@/middleware/auth';
import { runInvoke } from '@/runtime/run';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!verifyServiceToken(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = InvokeRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error }, { status: 400 });
    }

    const response = await runInvoke(parsed.data);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Invoke error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
