import { NextResponse } from 'next/server';

export async function POST() {
  const apiKey = process.env.REACTOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'REACTOR_API_KEY is not configured.' }, { status: 503 });
  }

  const response = await fetch('https://api.reactor.inc/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Reactor-API-Key': apiKey,
    },
    body: JSON.stringify({
      authorization_details: [{
        type: 'session',
        resources: { models: { match: ['xmax/x2'] } },
        constraints: { max_sessions: 1 },
      }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Reactor token request failed.' }, { status: response.status });
  }

  const { jwt } = await response.json() as { jwt: string };
  return NextResponse.json({ jwt });
}
