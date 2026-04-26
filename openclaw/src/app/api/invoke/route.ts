import { NextResponse } from 'next/server';
import { matchesUnsafePattern, pickOutOfScopePhrase } from '../../../runtime/guardrails';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, formality = 'polite' } = body;

    if (matchesUnsafePattern(input)) {
      return NextResponse.json({
        success: false,
        error: "Unsafe input detected.",
        message: pickOutOfScopePhrase(formality)
      }, { status: 400 });
    }

    // Stub for OC-02 agent invocation
    return NextResponse.json({
      success: true,
      message: "Agent invocation successful (stub)",
      input
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
