export type InvokeTrigger = 'message' | 'approach';

export type RefusalReason = 'out_of_scope' | 'boundary_violation' | 'safety';

export interface MemorySnapshot {
  profile?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  interests?: string[];
  recent_history?: Array<{ ts: string; event: string; meta?: unknown }>;
}

export interface InvokeRequest {
  user_id: string;
  agent_id: string;
  input: string;
  trigger: InvokeTrigger;
  context: {
    soul: Record<string, unknown>;
    config: Record<string, unknown>;
    memory_snapshot: MemorySnapshot;
  };
}

export interface InvokeResponse {
  reply: string;
  used_skills: string[];
  tokens?: { input: number; output: number };
  refused: { reason: RefusalReason } | null;
}

export interface TickRequest {
  now: string;
}

export interface TickResponse {
  processed: number;
  succeeded: number;
  failed: Array<{ agent_id: string; error: string }>;
  duration_ms: number;
}
