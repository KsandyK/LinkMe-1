import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/creator/dashboard", (_req, res) => {
  res.json({
    creatorId: "creator-1",
    displayName: "Luna Rose",
    tier: "Established",
    monthlyEarnings: 8750.50,
    totalEarnings: 142300.75,
    platformCut: 20,
    creatorCut: 80,
    weeklyPayoutNext: new Date(Date.now() + 4 * 86400000).toISOString(),
    totalFollowers: 12847,
    totalLikes: 89234,
    contentSold: 2341,
    giftReceived: 892,
    revenueBreakdown: {
      subscriptions: 3200,
      contentUnlocks: 2850,
      gifts: 1450,
      tips: 720,
      privateDates: 530.50,
    },
    badges: [
      { id: "hot-creator", name: "Hot Creator", icon: "🔥", color: "#f97316", description: "Top trending creator" },
      { id: "top-creator", name: "Top Creator", icon: "⭐", color: "#eab308", description: "Consistently top performer" },
    ],
  });
});

router.get("/user/account", (_req, res) => {
  res.json({
    id: "user-1",
    username: "vibeuser_123",
    displayName: "Alex M.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=user123",
    tier: "vibe_pro",
    tierLabel: "Vibe Pro",
    monthlySpend: 734,
    nextTierSpend: 1000,
    nextTierLabel: "Vibe Elite",
    creditBalance: 750,
    bonusCreditsRate: 22,
    discountRate: 18,
    boostsPerMonth: 12,
    boostsUsed: 4,
    badges: [
      { id: "loyal-fan", name: "Loyal Fan", icon: "❤️", color: "#ef4444", description: "Consistent supporter" },
      { id: "super-fan", name: "Super Fan", icon: "⭐", color: "#f59e0b", description: "Top supporter" },
      { id: "vibe-pro", name: "Vibe Pro", icon: "⚡", color: "#8b5cf6", description: "Pro tier member" },
    ],
    memberSince: "2024-06-15",
    referralCode: "VIBEALEX2024",
    referralCredits: 350,
  });
});

export default router;
