// HTTP API for COMPASS. Mounted by server.mjs under /api/*.
//
// Contract (COMPASS_MASTER section 5, frozen once agreed):
//   POST /api/turn {sessionId?, text}
//     Accept: application/json  -> {sessionId, turnId, state, patch, reply, toolResult, superseded, events}
//     Accept: text/event-stream -> SSE, one event per agent event, then `event: result` with the JSON above
//   POST /api/session              -> {sessionId, state}
//   GET  /api/session/:id          -> {state}
//   GET  /api/session/:id/events   -> SSE of all session events (all turns), for the live UI
//   GET  /api/health               -> presence flags only, never secrets
//   GET  /api/voice/providers      -> voice provider capabilities
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const MAX_BODY = 16 * 1024;
const MAX_TEXT = 500;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function send(res, status, body) {
  res.writeHead(status, JSON_HEADERS).end(JSON.stringify(body));
}

async function readJson(req) {
  const type = req.headers['content-type'] || '';
  if (!/application\/json/i.test(type)) throw Object.assign(new Error('Content-Type must be application/json'), { status: 415 });
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

function createRateLimiter({ perMinute, now = () => Date.now() }) {
  const buckets = new Map();
  return (key) => {
    const t = now();
    const b = buckets.get(key) || { tokens: perMinute, at: t };
    b.tokens = Math.min(perMinute, b.tokens + ((t - b.at) / 60_000) * perMinute);
    b.at = t;
    if (buckets.size > 10_000) buckets.clear();
    buckets.set(key, b);
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  };
}

function openSse(res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write(': compass\n\n');
  return (type, data) => { if (!res.writableEnded) res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`); };
}

const publicState = (s) => s; // state holds no secrets; single place to filter later

export function createApiHandler({ runtime, health, voice, turnsPerMinute = 30, logger = console }) {
  const allowTurn = createRateLimiter({ perMinute: turnsPerMinute });

  return async function handleApi(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '');
    const method = req.method;
    try {
      if (path === '/api/health' && method === 'GET') return send(res, 200, { ok: true, ...health() });

      if (path === '/api/voice/providers' && method === 'GET') return send(res, 200, { providers: voice.list(), active: voice.activeName });

      if (path === '/api/session' && method === 'POST') {
        const s = runtime.createSession();
        return send(res, 201, { sessionId: s.id, state: publicState(s.state) });
      }

      const m = /^\/api\/session\/([^/]+)(\/events)?$/.exec(path);
      if (m && method === 'GET') {
        const id = decodeURIComponent(m[1]);
        const s = ID_RE.test(id) && runtime.getSession(id);
        if (!s) return send(res, 404, { error: 'session_not_found' });
        if (!m[2]) return send(res, 200, { state: publicState(s.state) });
        const write = openSse(res);
        write('state', { state: publicState(s.state) });
        const off = runtime.subscribe(id, (ev) => write(ev.type, ev));
        const beat = setInterval(() => res.write(': ping\n\n'), 15_000);
        req.on('close', () => { clearInterval(beat); off(); });
        return;
      }

      if (path === '/api/turn' && method === 'POST') {
        if (!allowTurn(req.socket.remoteAddress || 'unknown')) return send(res, 429, { error: 'rate_limited' });
        const body = await readJson(req);
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text) return send(res, 400, { error: 'text_required' });
        if (text.length > MAX_TEXT) return send(res, 400, { error: 'text_too_long', max: MAX_TEXT });
        let sessionId = typeof body.sessionId === 'string' && ID_RE.test(body.sessionId) ? body.sessionId : null;
        if (!sessionId || !runtime.getSession(sessionId)) sessionId = runtime.createSession().id;

        const wantsSse = /text\/event-stream/i.test(req.headers.accept || '');
        if (wantsSse) {
          const write = openSse(res);
          const result = await runtime.runTurn(sessionId, text, { onEvent: (ev) => write(ev.type, ev) });
          const { events, ...rest } = result;
          write('result', { ...rest, state: publicState(rest.state) });
          res.end();
          return;
        }
        const result = await runtime.runTurn(sessionId, text);
        const status = result.error === 'not_configured' ? 503 : 200;
        return send(res, status, { ...result, state: publicState(result.state) });
      }

      if (path.startsWith('/api/voice/')) return send(res, 501, { error: 'voice_endpoint_not_implemented', provider: voice.activeName });

      return send(res, 404, { error: 'not_found' });
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) logger.error('[api]', req.method, path, err?.code || err?.name, String(err?.message || '').slice(0, 200));
      if (!res.headersSent) return send(res, status, { error: status >= 500 ? 'internal_error' : err.message });
      res.end();
    }
  };
}
