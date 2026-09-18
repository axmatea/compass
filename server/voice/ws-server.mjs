// Browser-facing realtime voice endpoint: ws(s)://<host>/api/voice/realtime[?sessionId=...]
// Close codes: 4503 Boson not configured (client falls back to browser speech),
//              4502 upstream failed, 4429 too many voice connections.
import { WebSocketServer } from 'ws';
import { createRealtimeBridge } from './realtime-bridge.mjs';
import { connectBoson } from './boson-realtime.mjs';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function attachVoiceServer(httpServer, { runtime, config, connectUpstream, maxPerIp = 3, maxTotal = 20, logger = console }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 512 * 1024, perMessageDeflate: false });
  const perIp = new Map();
  let total = 0;

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/voice/realtime') return; // other upgrade handlers may claim it
    // Same-origin only (browser sends Origin; non-browser test clients may omit it).
    const origin = req.headers.origin;
    if (origin) {
      try { if (new URL(origin).host !== req.headers.host) { socket.destroy(); return; } } catch { socket.destroy(); return; }
    }
    wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, req, url));
  });

  function onConnection(ws, req, url) {
    const ip = req.socket.remoteAddress || 'unknown';
    const client = {
      sendJson: (o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); },
      sendBinary: (b) => { if (ws.readyState === 1) ws.send(b, { binary: true }); },
      close: (code, reason) => { try { ws.close(code, reason); } catch { /* closed */ } },
    };
    if (!config.boson.apiKey && !connectUpstream) {
      client.sendJson({ type: 'error', code: 'boson_not_configured', message: 'Realtime voice unavailable; use browser fallback.' });
      return client.close(4503, 'boson_not_configured');
    }
    if (total >= maxTotal || (perIp.get(ip) || 0) >= maxPerIp) return client.close(4429, 'too_many_voice_connections');
    total++; perIp.set(ip, (perIp.get(ip) || 0) + 1);
    const release = () => { total--; const n = (perIp.get(ip) || 1) - 1; if (n > 0) perIp.set(ip, n); else perIp.delete(ip); };

    const sid = url.searchParams.get('sessionId');
    const bridge = createRealtimeBridge({
      client,
      runtime,
      sessionId: sid ? (ID_RE.test(sid) ? sid : 'invalid') : undefined, // 'invalid' -> reset flagged
      voice: config.boson.voice,
      turnDetection: config.boson.turnDetection,
      connectUpstream: connectUpstream || (() => connectBoson({ apiKey: config.boson.apiKey, url: config.boson.realtimeUrl })),
      logger,
    });
    ws.on('message', (data, isBinary) => {
      if (isBinary) return bridge.onClientAudio(Buffer.isBuffer(data) ? data : Buffer.from(data));
      let msg; try { msg = JSON.parse(data.toString('utf8')); } catch { return; }
      if (msg && typeof msg.type === 'string') bridge.onClientJson(msg);
    });
    ws.on('close', () => { release(); bridge.close(); });
    ws.on('error', () => {});
    bridge.start().catch((err) => {
      logger.error?.('[voice] upstream connect failed', err.code || err.name, err.closeCode ?? '');
      client.sendJson({ type: 'error', code: err.closeCode === 3000 ? 'boson_auth' : 'boson_connect_failed', message: 'Realtime voice unavailable; use browser fallback.' });
      bridge.close(4502, 'boson_connect_failed');
    });
  }

  return { wss, stats: () => ({ total, perIp: perIp.size }) };
}
