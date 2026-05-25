/**
 * LINKME — WebSocket Client
 *
 * Two channels on separate WS connections:
 *   LiveSocket  → ws://host:3001/ws/live   (streams, WebRTC signaling)
 *   MsgSocket   → ws://host:3001/ws/msg    (private DMs)
 *
 * Usage:
 *   const live = createLiveSocket(token);
 *   live.on("chat_msg", handler);
 *   live.send({ type: "join_feed", feedId: "..." });
 *   live.close();
 */

const WS_BASE = (import.meta as any).env?.VITE_WS_URL ?? "ws://localhost:3001";

type MessageHandler = (data: Record<string, unknown>) => void;

// ── Socket wrapper ────────────────────────────────────────────────────────────

export class LinkMeSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private path: string;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30_000;
  private closed = false;
  private authenticated = false;
  private queue: object[] = [];

  constructor(path: "/ws/live" | "/ws/msg", token: string) {
    this.path = path;
    this.token = token;
    this.connect();
  }

  private connect() {
    if (this.closed) return;
    this.authenticated = false;
    this.ws = new WebSocket(`${WS_BASE}${this.path}`);

    this.ws.onopen = () => {
      // Authenticate immediately
      this.ws!.send(JSON.stringify({ type: "auth", token: this.token }));
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as Record<string, unknown>;
        if (data.type === "auth_ok") {
          this.authenticated = true;
          // Flush queued messages
          const q = this.queue.splice(0);
          for (const msg of q) this.ws!.send(JSON.stringify(msg));
        }
        const handlers = this.handlers.get(data.type as string);
        if (handlers) handlers.forEach(h => h(data));
        const wildcards = this.handlers.get("*");
        if (wildcards) wildcards.forEach(h => h(data));
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.authenticated = false;
      if (!this.closed) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  /** Register an event handler. Returns an unsubscribe function. */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  /** Send a message (queued until authenticated). */
  send(payload: object) {
    if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.queue.push(payload);
    }
  }

  /** Permanently close this connection (no reconnect). */
  close() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.handlers.clear();
    this.queue = [];
  }

  get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN && this.authenticated;
  }
}

// ── Factory helpers ───────────────────────────────────────────────────────────

export function createLiveSocket(token: string) {
  return new LinkMeSocket("/ws/live", token);
}

export function createMsgSocket(token: string) {
  return new LinkMeSocket("/ws/msg", token);
}

// ── Legacy helpers (kept for backward compatibility) ──────────────────────────

let _liveSocket: LinkMeSocket | null = null;
let _msgSocket: LinkMeSocket | null = null;

export function getLiveSocket(token?: string): LinkMeSocket | null {
  if (token && !_liveSocket) _liveSocket = createLiveSocket(token);
  return _liveSocket;
}

export function getMsgSocket(token?: string): LinkMeSocket | null {
  if (token && !_msgSocket) _msgSocket = createMsgSocket(token);
  return _msgSocket;
}

export function disconnectAll() {
  _liveSocket?.close(); _liveSocket = null;
  _msgSocket?.close(); _msgSocket = null;
}
