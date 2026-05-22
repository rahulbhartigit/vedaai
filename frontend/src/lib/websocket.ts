const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';

type WsEventType = 'connected' | 'job:processing' | 'job:done' | 'job:failed';
type WsListener = (data: Record<string, unknown>) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private assignmentId: string | null = null;
  private listeners = new Map<WsEventType, Set<WsListener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  connect(assignmentId: string) {
    this.intentionalClose = false;
    this.assignmentId = assignmentId;
    this.cleanup();
    this.ws = new WebSocket(`${WS_URL}?assignmentId=${assignmentId}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'subscribe', assignmentId }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown> & { type: WsEventType };
        const set = this.listeners.get(data.type);
        set?.forEach((fn) => fn(data));
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose && this.assignmentId) {
        this.reconnectTimer = setTimeout(() => this.connect(this.assignmentId!), 3000);
      }
    };
  }

  on(event: WsEventType, cb: WsListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private cleanup() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) { this.intentionalClose = true; this.ws.close(); this.ws = null; }
  }

  disconnect() { this.cleanup(); this.assignmentId = null; }
}

export const wsManager = new WebSocketManager();
