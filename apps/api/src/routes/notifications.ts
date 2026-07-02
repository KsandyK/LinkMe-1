import { Router } from "express";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/notifications
 *
 * Server-computed notification feed for the signed-in user. Aggregates
 * existing data (no dedicated table / migration required):
 *   • Live creators streaming right now  → "X is live now"
 *   • Unread direct messages             → "N new messages"
 *
 * The client decorates each item with an icon/accent by `type` and merges in
 * its own purely-local items (e.g. the daily-reward nudge). Returns a stable
 * `id` per item so the client can track which have been seen.
 */
router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const [liveFeeds, links] = await Promise.all([
    // Top live streams right now
    db.liveFeed.findMany({
      where: { isLive: true },
      orderBy: { viewerCount: "desc" },
      take: 5,
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { displayName: true } },
              },
            },
          },
        },
      },
    }),
    // Conversations + their latest message, to compute unread
    db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    }),
  ]);

  type Notif = { id: string; type: "live" | "message"; title: string; sub: string; href: string };
  const notifications: Notif[] = [];

  for (const feed of liveFeeds) {
    const name = feed.creator?.user?.profile?.displayName ?? feed.creator?.user?.username ?? "A creator";
    notifications.push({
      id: `live-${feed.id}`,
      type: "live",
      title: `${name} is live now`,
      sub: feed.category ? `Streaming in ${feed.category}` : "Tap to watch",
      href: `/live/${feed.id}`,
    });
  }

  let unread = 0;
  for (const l of links) {
    const last = l.conversation.messages[0];
    if (!last || last.senderId === userId) continue;
    if (!l.lastReadAt || last.createdAt > l.lastReadAt) unread++;
  }
  if (unread > 0) {
    notifications.push({
      id: `msg-${unread}`,
      type: "message",
      title: `${unread} new message${unread !== 1 ? "s" : ""}`,
      sub: "Creators are waiting to hear back",
      href: "/messages",
    });
  }

  res.json({ notifications });
});

export default router;
