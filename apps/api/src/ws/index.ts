/**
 * WebSocket Server
 *
 * Handles two real-time channels on a single WS port:
 *   - /ws/live  — live-stream room (chat, viewer counts, WebRTC signaling)
 *   - /ws/msg   — private DM conversations
 *
 * Auth: clients send { type: "auth", token: "<JWT access token>" } as the
 * first message after connecting. The connection is closed if not authed
 * within 10 seconds.
 */

import { WebSocketServer, WebSocket, RawData } from "ws";
import { IncomingMessage } from "http";
import { verifyAccessToken, JwtPayload } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { handleLiveMessage } from "./live.js";
import { handleMessagingMessage } from "./messaging.js";

export interface AuthedSocket extends WebSocket {
  user?: JwtPayload;
  roomId?: string;
  channel?: "live" | "msg";
  isAlive?: boolean;
}

// ── Room registry ─────────────────────────────────────────────────────────────
// feedId  → Set<AuthedSocket>
// convId  → Set<AuthedSocket>
export const rooms = new Map<string, Set<AuthedSocket>>();

export function joinRoom(roomId: string, socket: AuthedSocket) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(socket);
  socket.roomId = roomId;
}

export function leaveRoom(socket: AuthedSocket) {
  if (socket.roomId && rooms.has(socket.roomId)) {
    rooms.get(socket.roomId)!.delete(socket);
    if (rooms.get(socket.roomId)!.size === 0) rooms.delete(socket.roomId);
  }
}

export function broadcast(roomId: string, payload: object, exclude?: AuthedSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(payload);
  for (const client of room) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function send(socket: AuthedSocket, payload: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

// ── Server factory ────────────────────────────────────────────────────────────
export function createWsServer(port: number) {
  const wss = new WebSocketServer({ port });

  // Heartbeat — detect stale connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const sock = ws as AuthedSocket;
      if (!sock.isAlive) {
        leaveRoom(sock);
        return sock.terminate();
      }
      sock.isAlive = false;
      sock.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const sock = ws as AuthedSocket;
    sock.isAlive = true;

    // Determine channel from URL path: /ws/live or /ws/msg
    const url = req.url ?? "";
    sock.channel = url.includes("/live") ? "live" : "msg";

    // Require auth within 10 s
    const authTimeout = setTimeout(() => {
      if (!sock.user) {
        send(sock, { type: "error", message: "Authentication timeout" });
        sock.terminate();
      }
    }, 10_000);

    sock.on("pong", () => { sock.isAlive = true; });

    sock.on("message", (raw: RawData) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        send(sock, { type: "error", message: "Invalid JSON" });
        return;
      }

      // ── Auth handshake ──────────────────────────────────────────────────────
      if (data.type === "auth") {
        try {
          sock.user = verifyAccessToken(data.token as string);
          clearTimeout(authTimeout);
          send(sock, { type: "auth_ok", userId: sock.user.sub });
          logger.debug({ userId: sock.user.sub, channel: sock.channel }, "WS authenticated");
        } catch {
          send(sock, { type: "error", message: "Invalid access token" });
          sock.terminate();
        }
        return;
      }

      // All other messages require auth
      if (!sock.user) {
        send(sock, { type: "error", message: "Not authenticated" });
        return;
      }

      // Route to channel handler
      if (sock.channel === "live") {
        handleLiveMessage(sock, data).catch((err) =>
          logger.error({ err, userId: sock.user?.sub }, "Live WS error"),
        );
      } else {
        handleMessagingMessage(sock, data).catch((err) =>
          logger.error({ err, userId: sock.user?.sub }, "Msg WS error"),
        );
      }
    });

    sock.on("close", () => {
      clearTimeout(authTimeout);
      leaveRoom(sock);
      logger.debug({ userId: sock.user?.sub }, "WS disconnected");
    });

    sock.on("error", (err) => {
      logger.error({ err, userId: sock.user?.sub }, "WS error");
    });
  });

  logger.info({ port }, "WebSocket server listening");
  return wss;
}
