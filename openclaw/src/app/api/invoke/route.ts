import { NextRequest, NextResponse } from 'next/server';
import { InvokeRequestSchema } from '@/types/zod-schemas';
import { verifyServiceToken } from '@/middleware/auth';
import { runInvoke } from '@/runtime/run';
import { matchesUnsafePattern, pickOutOfScopePhrase } from '@/runtime/guardrails';

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

    const { input, context } = parsed.data;
    
    // Guardrails check (extract formality from config if available, default to polite)
    const formality = (context.config?.formality as 'polite' | 'casual') || 'polite';
    if (matchesUnsafePattern(input)) {
      return NextResponse.json({
        reply: null,
        used_skills: [],
        refused: {
          reason: "Unsafe input detected.",
          phrase: pickOutOfScopePhrase(formality)
        }
      });
    }

    const response = await runInvoke(parsed.data);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Invoke error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
