import { Router } from "express";
import { z } from "zod";
import db from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { generatePersonaReply } from "../lib/ai-persona.js";

const router = Router();

const MSG_CREDIT_COST = 2; // credits per message to a premium creator

// ── GET /api/messages/conversations ──────────────────────────────────────────
router.get("/messages/conversations", requireAuth, async (req, res) => {
  const links = await db.conversationParticipant.findMany({
    where: { userId: req.user!.sub },
    orderBy: { conversation: { updatedAt: "desc" } },
    include: {
      conversation: {
        include: {
          participants: {
            where: { userId: { not: req.user!.sub } },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                  creatorProfile: { select: { isLive: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const conversations = links.map((l) => ({
    id: l.conversation.id,
    updatedAt: l.conversation.updatedAt,
    otherParticipant: l.conversation.participants[0]?.user ?? null,
    lastMessage: l.conversation.messages[0] ?? null,
    lastReadAt: l.lastReadAt,
  }));

  res.json(conversations);
});

// ── GET /api/messages/conversations/:id ──────────────────────────────────────
router.get("/messages/conversations/:id", requireAuth, async (req, res) => {
  const { before, limit = "50" } = req.query as Record<string, string>;

  // Verify participant
  const link = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: String(req.params.id), userId: req.user!.sub } },
  });
  if (!link) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db.message.findMany({
    where: {
      conversationId: String(req.params.id),
      ...(before && { createdAt: { lt: new Date(before) } }),
    },
    orderBy: { createdAt: "desc" },
    take: Number(limit),
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

  // Mark read
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: String(req.params.id), userId: req.user!.sub } },
    data: { lastReadAt: new Date() },
  });

  res.json(messages.reverse());
});

// ── POST /api/messages/conversations — start or find DM ──────────────────────
router.post("/messages/conversations", requireAuth, async (req, res) => {
  const { recipientId } = req.body as { recipientId: string };
  if (!recipientId || recipientId === req.user!.sub) {
    res.status(400).json({ error: "Valid recipientId required" });
    return;
  }

  // Check existing conversation between the two users
  const existing = await db.conversation.findFirst({
    where: {
      participants: {
        every: { userId: { in: [req.user!.sub, recipientId] } },
      },
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) {
    res.json(existing);
    return;
  }

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId: req.user!.sub }, { userId: recipientId }],
      },
    },
    include: { participants: true },
  });

  res.status(201).json(conversation);
});

// ── POST /api/messages/conversations/:id/send ─────────────────────────────────
const SendSchema = z.object({
  text: z.string().min(1).max(2000),
});

router.post("/messages/conversations/:id/send", requireAuth, async (req, res) => {
  const parsed = SendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const link = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: String(req.params.id), userId: req.user!.sub } },
  });
  if (!link) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Deduct credits if sending to a creator
  const otherLink = await db.conversationParticipant.findFirst({
    where: { conversationId: String(req.params.id), userId: { not: req.user!.sub } },
    include: {
      user: {
        include: {
          creatorProfile: { select: { isApproved: true, isAiPersona: true, aiPersonaPrompt: true } },
        },
      },
    },
  });

  let creditCost = 0;
  if (otherLink?.user?.creatorProfile?.isApproved) {
    const sender = await db.user.findUnique({ where: { id: req.user!.sub } });
    if (!sender || sender.credits < MSG_CREDIT_COST) {
      res.status(402).json({ error: "Insufficient credits", required: MSG_CREDIT_COST });
      return;
    }
    creditCost = MSG_CREDIT_COST;
    await db.user.update({
      where: { id: req.user!.sub },
      data: { credits: { decrement: MSG_CREDIT_COST } },
    });
  }

  const message = await db.message.create({
    data: {
      conversationId: String(req.params.id),
      senderId: req.user!.sub,
      text: parsed.data.text,
      creditCost,
    },
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

  await db.conversation.update({
    where: { id: String(req.params.id) },
    data: { updatedAt: new Date() },
  });

  res.status(201).json(message);

  // ── AI Companion auto-reply ────────────────────────────────────────────────
  // Fire-and-forget: if the recipient is an AI persona, generate a Claude reply
  // after a realistic "typing" delay of 3–8 seconds so it feels natural.
  const personaProfile = otherLink?.user?.creatorProfile;
  if (personaProfile?.isAiPersona && otherLink?.user) {
    const aiUserId      = otherLink.user.id;
    const convId        = String(req.params.id);
    const personaPrompt = personaProfile.aiPersonaPrompt ?? "";
    const userText      = parsed.data.text;

    const delay = 3000 + Math.random() * 5000; // 3–8 seconds

    setTimeout(async () => {
      try {
        // Fetch last 6 messages for context
        const recent = await db.message.findMany({
          where: { conversationId: convId },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { senderId: true, text: true },
        });

        const history = recent.reverse().map(m => ({
          fromUser: m.senderId !== aiUserId,
          text: m.text,
        }));

        const reply = await generatePersonaReply(personaPrompt, history, userText);

        await db.message.create({
          data: { conversationId: convId, senderId: aiUserId, text: reply, creditCost: 0 },
        });
        await db.conversation.update({
          where: { id: convId },
          data: { updatedAt: new Date() },
        });
      } catch {
        // Silently fail — user just won't get a reply this time
      }
    }, delay);
  }
});

export default router;
