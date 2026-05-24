import { Router, type IRouter } from "express";

const router: IRouter = Router();

const MESSAGE_CREDIT_COST = 10;

const mockThreads = [
  {
    id: "thread-1",
    recipientId: "profile-1",
    recipientName: "Luna Rose",
    recipientAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=luna`,
    lastMessage: "Hey! Loved your live stream last night 🔥",
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 2,
    creditCostPerMessage: MESSAGE_CREDIT_COST,
    isOnline: true,
  },
  {
    id: "thread-2",
    recipientId: "profile-2",
    recipientName: "Alex Storm",
    recipientAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=alex`,
    lastMessage: "Thanks for the gift! 💎",
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 0,
    creditCostPerMessage: MESSAGE_CREDIT_COST,
    isOnline: true,
  },
  {
    id: "thread-3",
    recipientId: "profile-4",
    recipientName: "Marcus Vane",
    recipientAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=marcus`,
    lastMessage: "See you tonight at 9PM EST!",
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
    creditCostPerMessage: MESSAGE_CREDIT_COST,
    isOnline: false,
  },
];

router.get("/messages", (_req, res) => {
  res.json(mockThreads);
});

router.post("/messages", (req, res) => {
  const { recipientId, content } = req.body;
  
  if (!recipientId || !content) {
    res.status(400).json({ error: "recipientId and content required" });
    return;
  }
  
  res.json({
    success: true,
    creditsSpent: MESSAGE_CREDIT_COST,
    newBalance: 750 - MESSAGE_CREDIT_COST,
    messageId: `MSG-${Date.now()}`,
  });
});

export default router;
