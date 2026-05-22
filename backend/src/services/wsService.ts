import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface ClientInfo {
  ws: WebSocket;
  assignmentId?: string;
}

const clients = new Map<string, ClientInfo>();

export const initWebSocket = (server: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = Math.random().toString(36).substring(2);
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const assignmentId = url.searchParams.get('assignmentId') || undefined;

    clients.set(clientId, { ws, assignmentId });
    console.log(`🔌 WS client connected: ${clientId}, watching: ${assignmentId}`);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.assignmentId) {
          const client = clients.get(clientId);
          if (client) client.assignmentId = msg.assignmentId;
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`🔌 WS client disconnected: ${clientId}`);
    });

    ws.on('error', (err) => console.error(`WS error [${clientId}]:`, err));

    // Send immediate connection ack
    ws.send(JSON.stringify({ type: 'connected', clientId }));
  });

  return wss;
};

export const notifyAssignment = (
  assignmentId: string,
  payload: Record<string, unknown>
): void => {
  const message = JSON.stringify({ ...payload, assignmentId });
  clients.forEach(({ ws, assignmentId: watchingId }) => {
    if (watchingId === assignmentId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};
