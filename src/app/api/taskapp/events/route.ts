import { NextRequest } from 'next/server';
import { getReporterEmail } from '@/modules/ayuda/actions/getReporterEmail';
import { Logger } from '@/shared/lib/logger';

const logger = new Logger('api/taskapp/events');

export async function GET(req: NextRequest) {
  const reporter = await getReporterEmail();
  if (!reporter) {
    return new Response('Unauthorized', { status: 401 });
  }

  const baseUrl = process.env.TASKAPP_BASE_URL;
  const apiKey = process.env.TASKAPP_PROJECT_API_KEY;

  if (!baseUrl || !apiKey) {
    logger.error('Missing TASKAPP_BASE_URL or TASKAPP_PROJECT_API_KEY');
    return new Response('Server configuration error', { status: 500 });
  }

  // getReporterEmail() returns ReporterIdentity ({ email, name })
  const reporterEmail = reporter.email;

  const upstreamUrl = `${baseUrl}/api/public/v1/events?reporter_email=${encodeURIComponent(reporterEmail)}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        'X-Project-Key': apiKey,
        Accept: 'text/event-stream',
      },
      signal: req.signal,
    });
  } catch (error) {
    logger.error('Failed to connect to TaskApp SSE', { data: { error } });
    return new Response('Upstream unavailable', { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    logger.error('TaskApp SSE returned non-OK', { data: { status: upstream.status } });
    return new Response('Upstream unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
