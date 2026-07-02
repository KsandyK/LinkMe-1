/**
 * Private Messaging WebSocket Handler
 *
 * Message types (client → server):
 *   join_conversation  { conversationId }
 *   leave_conversation {}
 *   send_message       { conversationId, text }
 *   typing             { conversationId, isTyping }
 *   mark_read          { conversationId }
 *
 * Message types (server → client):
 *   new_message        { message }
 *   typing_indicator   { userId, username, isTyping }
 *   message_read       { conversationId, userId }
 *   error              { message }
 */

import db from "../lib/db.js";
import { AuthedSocket, joinRoom, leaveRoom, broadcast, send } from "./index.js";

const MSG_CREDIT_COST = 2;

export async function handleMessagingMessage(
  sock: AuthedSocket,
  data: Record<string, unknown>,
) {
  const userId = sock.user!.sub;
  const username = sock.user!.username;

  switch (data.type) {

    // ── Join a conversation room ────────────────────────────────────────────
    case "join_conversation": {
      const convId = data.conversationId as string;
      if (!convId) { send(sock, { type: "error", message: "conversationId required" }); return; }

      // Verify participation
      const link = await db.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: convId, userId } },
      });
      if (!link) { send(sock, { type: "error", message: "Not a participant" }); return; }

      leaveRoom(sock);
      joinRoom(convId, sock);
      send(sock, { type: "joined_conversation", conversationId: convId });
      break;
    }

    // ── Leave a conversation room ───────────────────────────────────────────
    case "leave_conversation": {
      leaveRoom(sock);
      break;
    }

    // ── Send a message ──────────────────────────────────────────────────────
    case "send_message": {
      const convId = data.conversationId as string;
      const text = (data.text as string)?.trim();

      if (!convId || !text || text.length > 2000) {
        send(sock, { type: "error", message: "Invalid conversationId or text" });
        return;
      }

      // Verify participant
      const link = await db.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: convId, userId } },
      });
      if (!link) { send(sock, { type: "error", message: "Not a participant" }); return; }

      // Credit cost for messaging creators
      const otherLink = await db.conversationParticipant.findFirst({
        where: { conversationId: convId, userId: { not: userId } },
        include: { user: { include: { creatorProfile: { select: { isApproved: true } } } } },
      });

      let creditCost = 0;
      if (otherLink?.user?.creatorProfile?.isApproved) {
        const sender = await db.user.findUnique({ where: { id: userId } });
        if (!sender || sender.credits < MSG_CREDIT_COST) {
          send(sock, { type: "error", message: `Insufficient credits (need ${MSG_CREDIT_COST})` });
          return;
        }
        creditCost = MSG_CREDIT_COST;
        await db.user.update({ where: { id: userId }, data: { credits: { decrement: MSG_CREDIT_COST } } });
      }

      const message = await db.message.create({
        data: { conversationId: convId, senderId: userId, text, creditCost },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      });

      await db.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

      // Broadcast to everyone in the room (including sender for confirmation)
      broadcast(convId, { type: "new_message", message });

      // Notify the other participant if offline (no WS connection in room)
      if (otherLink) {
        await db.notification.create({
          data: {
            userId: otherLink.userId,
            type: "new_message",
            title: `New message from ${username}`,
            body: text.length > 80 ? text.slice(0, 80) + "…" : text,
            data: { conversationId: convId, senderId: userId },
          },
        }).catch(() => null);
      }
      break;
    }

    // ── Typing indicator ────────────────────────────────────────────────────
    case "typing": {
      const convId = data.conversationId as string;
      if (!convId) return;
      broadcast(convId, {
        type: "typing_indicator",
        userId,
        username,
        isTyping: Boolean(data.isTyping),
      }, sock);
      break;
    }

    // ── Mark conversation read ──────────────────────────────────────────────
    case "mark_read": {
      const convId = data.conversationId as string;
      if (!convId) return;

      await db.conversationParticipant.update({
        where: { conversationId_userId: { conversationId: convId, userId } },
        data: { lastReadAt: new Date() },
      }).catch(() => null);

      broadcast(convId, { type: "message_read", conversationId: convId, userId });
      break;
    }

    default:
      send(sock, { type: "error", message: `Unknown message type: ${data.type}` });
  }
}
