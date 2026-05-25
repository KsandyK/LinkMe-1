/**
 * Live Stream WebSocket Handler
 *
 * Message types (client → server):
 *   join_feed        { feedId }                    — join a stream room
 *   leave_feed       {}                            — leave current room
 *   chat             { text, creditTip? }          — send chat message
 *
 * WebRTC Signaling (client → server → peer):
 *   rtc_offer        { feedId, sdp }              — creator broadcasts SDP offer
 *   rtc_answer       { targetUserId, sdp }        — viewer sends answer to creator
 *   rtc_ice          { targetUserId, candidate }  — ICE candidate exchange
 *
 * Message types (server → client):
 *   viewer_count     { count }
 *   chat_msg         { id, userId, username, text, creditTip, createdAt }
 *   rtc_offer        { fromUserId, sdp }
 *   rtc_answer       { fromUserId, sdp }
 *   rtc_ice          { fromUserId, candidate }
 *   stream_ended     {}
 *   error            { message }
 */

import db from "../lib/db.js";
import { AuthedSocket, joinRoom, leaveRoom, broadcast, send, rooms } from "./index.js";

// userId → socket (for direct WebRTC signaling)
const userSockets = new Map<string, AuthedSocket>();

export async function handleLiveMessage(
  sock: AuthedSocket,
  data: Record<string, unknown>,
) {
  const userId = sock.user!.sub;
  const username = sock.user!.username;

  // Register socket by userId for direct signaling
  userSockets.set(userId, sock);

  switch (data.type) {

    // ── Join a stream room ──────────────────────────────────────────────────
    case "join_feed": {
      const feedId = data.feedId as string;
      if (!feedId) { send(sock, { type: "error", message: "feedId required" }); return; }

      leaveRoom(sock);
      joinRoom(feedId, sock);

      const count = rooms.get(feedId)?.size ?? 1;

      // Update viewer count in DB (debounce via periodic flush in prod)
      await db.liveFeed.update({
        where: { id: feedId },
        data: {
          viewerCount: count,
          peakViewers: { set: undefined },   // handled by raw query below
        },
      }).catch(() => null);

      // Bump peak if current > recorded
      await db.$executeRaw`
        UPDATE "LiveFeed"
        SET "peakViewers" = GREATEST("peakViewers", ${count})
        WHERE id = ${feedId}
      `.catch(() => null);

      broadcast(feedId, { type: "viewer_count", count });
      send(sock, { type: "joined_feed", feedId, viewerCount: count });
      break;
    }

    // ── Leave a stream room ─────────────────────────────────────────────────
    case "leave_feed": {
      const roomId = sock.roomId;
      leaveRoom(sock);
      if (roomId) {
        const count = rooms.get(roomId)?.size ?? 0;
        broadcast(roomId, { type: "viewer_count", count });
        await db.liveFeed.update({ where: { id: roomId }, data: { viewerCount: count } }).catch(() => null);
      }
      break;
    }

    // ── Chat message ────────────────────────────────────────────────────────
    case "chat": {
      const feedId = sock.roomId;
      if (!feedId) { send(sock, { type: "error", message: "Join a feed first" }); return; }

      const text = (data.text as string)?.trim();
      if (!text || text.length > 500) { send(sock, { type: "error", message: "Invalid message" }); return; }

      const creditTip = Number(data.creditTip ?? 0);

      // Deduct credits for tips
      if (creditTip > 0) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user || user.credits < creditTip) {
          send(sock, { type: "error", message: "Insufficient credits" });
          return;
        }
        await db.user.update({ where: { id: userId }, data: { credits: { decrement: creditTip } } });
      }

      // Simple keyword moderation
      const BLOCKED = ["spam", "scam", "click here", "onlyfans.com"];
      if (BLOCKED.some((w) => text.toLowerCase().includes(w))) {
        send(sock, { type: "error", message: "Message blocked by moderation filter" });
        return;
      }

      const msg = await db.chatMessage.create({
        data: { feedId, userId, username, text, creditTip },
      });

      broadcast(feedId, {
        type: "chat_msg",
        id: msg.id,
        userId,
        username,
        text,
        creditTip,
        createdAt: msg.createdAt,
      });
      break;
    }

    // ── WebRTC: creator broadcasts SDP offer ──────────────────────────────
    case "rtc_offer": {
      const feedId = data.feedId as string;
      const sdp = data.sdp;
      if (!feedId || !sdp) { send(sock, { type: "error", message: "feedId and sdp required" }); return; }

      // Persist offer so late joiners can connect
      await db.liveFeed.update({
        where: { id: feedId },
        data: { sdpOffer: typeof sdp === "string" ? sdp : JSON.stringify(sdp) },
      }).catch(() => null);

      // Broadcast to all viewers in the room
      broadcast(feedId, { type: "rtc_offer", fromUserId: userId, sdp }, sock);
      break;
    }

    // ── WebRTC: viewer sends SDP answer directly to creator ───────────────
    case "rtc_answer": {
      const targetSocket = userSockets.get(data.targetUserId as string);
      if (targetSocket) {
        send(targetSocket, { type: "rtc_answer", fromUserId: userId, sdp: data.sdp });
      }
      break;
    }

    // ── WebRTC: ICE candidate ─────────────────────────────────────────────
    case "rtc_ice": {
      const targetSocket = userSockets.get(data.targetUserId as string);
      if (targetSocket) {
        send(targetSocket, { type: "rtc_ice", fromUserId: userId, candidate: data.candidate });
      }
      break;
    }

    // ── Creator ends stream ───────────────────────────────────────────────
    case "end_stream": {
      const feedId = sock.roomId;
      if (!feedId) return;

      broadcast(feedId, { type: "stream_ended" });

      await db.liveFeed.update({
        where: { id: feedId },
        data: { isLive: false, endedAt: new Date(), viewerCount: 0, sdpOffer: null },
      }).catch(() => null);

      const creator = await db.creatorProfile.findUnique({ where: { userId } });
      if (creator) {
        await db.creatorProfile.update({ where: { id: creator.id }, data: { isLive: false } }).catch(() => null);
      }

      leaveRoom(sock);
      break;
    }

    default:
      send(sock, { type: "error", message: `Unknown message type: ${data.type}` });
  }
}
