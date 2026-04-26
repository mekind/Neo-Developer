import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { backendClient } from '../../../clients/backend';
import { runInvoke } from '../../../runtime/run';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  
  try {
    const dueAgents = await backendClient.fetchDueAgents(now);
    
    if (!dueAgents || dueAgents.length === 0) {
      return NextResponse.json({
        processed: 0,
        succeeded: 0,
        failed: 0,
        duration_ms: 0
      });
    }

    const start = Date.now();
    const limit = pLimit(5);
    let succeeded = 0;
    let failed = 0;

    const promises = dueAgents.map(agent => limit(async () => {
      try {
        const response = await runInvoke({
          user_id: agent.user_id,
          agent_id: agent.agent_id,
          input: "system: cron tick",
          trigger: "cron",
          context: agent.context
        });

        await backendClient.createNotification(agent.user_id, {
          agentId: agent.agent_id,
          kind: 'message',
          body: response.reply || '',
          meta: { used_skills: response.used_skills }
        });
        
        succeeded++;
      } catch (err) {
        console.error(`Failed to process agent ${agent.agent_id}:`, err);
        failed++;
      }
    }));

    await Promise.all(promises);

    return NextResponse.json({
      processed: dueAgents.length,
      succeeded,
      failed,
      duration_ms: Date.now() - start
    });
  } catch (error) {
    console.error('Tick processing failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
