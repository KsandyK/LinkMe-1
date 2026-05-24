/**
 * LINKME â€” Mock Data
 * All data is fictional. No CCBill references. No AI watermarks.
 * Maximized monetization system with 8+ VIP tiers, spender rewards, credits, gifts, and more.
 */

// ============ VIP SUBSCRIPTION TIERS (8 TIERS) ============
export const VIP_TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: 4.99,
    monthlyCredits: 100,
    videoCallMinutes: 30,
    features: ["Browse profiles", "Send messages", "View public content"],
    color: "#64748b",
    badge: "ðŸ“±",
  },
  {
    id: "silver",
    name: "Silver",
    price: 9.99,
    monthlyCredits: 250,
    videoCallMinutes: 60,
    features: ["All Basic features", "Profile boost (1x/month)", "Priority messages", "View 1 exclusive photo/creator"],
    color: "#c0c0c0",
    badge: "ðŸ¥ˆ",
  },
  {
    id: "gold",
    name: "Gold",
    price: 19.99,
    monthlyCredits: 500,
    videoCallMinutes: 120,
    features: ["All Silver features", "Profile boost (2x/month)", "Unlimited exclusive photos", "1 private session/month", "Creator discount (10%)"],
    color: "#fbbf24",
    badge: "ðŸ¥‡",
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 39.99,
    monthlyCredits: 1000,
    videoCallMinutes: 300,
    features: ["All Gold features", "Profile boost (4x/month)", "2 private sessions/month", "Early access to new creators", "Creator discount (15%)", "Priority support"],
    color: "#e0e7ff",
    badge: "ðŸ’Ž",
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 69.99,
    monthlyCredits: 2000,
    videoCallMinutes: 600,
    features: ["All Platinum features", "Profile boost (unlimited)", "4 private sessions/month", "VIP badge on profile", "Creator discount (20%)", "Concierge matching service"],
    color: "#7dd3fc",
    badge: "ðŸ’ ",
  },
  {
    id: "elite",
    name: "Elite",
    price: 99.99,
    monthlyCredits: 3500,
    videoCallMinutes: 1000,
    features: ["All Diamond features", "6 private sessions/month", "Exclusive creator access", "Custom video messages", "Dedicated account manager", "Creator discount (25%)"],
    color: "#a78bfa",
    badge: "ðŸ‘‘",
  },
  {
    id: "vip_plus",
    name: "VIP+",
    price: 149.99,
    monthlyCredits: 5000,
    videoCallMinutes: 1500,
    features: ["All Elite features", "8 private sessions/month", "Priority live stream access", "Custom photo requests", "Monthly bonus credits (500)", "Creator discount (30%)"],
    color: "#f97316",
    badge: "ðŸ”¥",
  },
  {
    id: "founders_club",
    name: "Founder's Club",
    price: 249.99,
    monthlyCredits: 10000,
    videoCallMinutes: 2500,
    features: ["All VIP+ features", "10 private sessions/month", "Lifetime VIP badge", "Unlimited custom requests", "Monthly bonus credits (1000)", "Creator discount (40%)", "Exclusive founder events"],
    color: "#ec4899",
    badge: "ðŸ’Žâœ¨",
  },
];

// ============ CREDIT PACKAGES ============
export const CREDIT_PACKAGES = [
  // Micro Packages
  { id: "micro-1", name: "Starter", credits: 50, price: 4.99, savings: 0, category: "micro" },
  { id: "micro-2", name: "Quick Boost", credits: 100, price: 8.99, savings: 10, category: "micro" },
  
  // Standard Packages
  { id: "std-1", name: "Standard", credits: 250, price: 19.99, savings: 0, category: "standard" },
  { id: "std-2", name: "Popular", credits: 500, price: 34.99, savings: 12, category: "standard" },
  { id: "std-3", name: "Value Pack", credits: 1000, price: 59.99, savings: 20, category: "standard" },
  
  // Bulk Packages (20-50% off)
  { id: "bulk-1", name: "Bulk Deal", credits: 2500, price: 99.99, savings: 33, category: "bulk" },
  { id: "bulk-2", name: "Mega Pack", credits: 5000, price: 169.99, savings: 43, category: "bulk" },
  { id: "bulk-3", name: "Ultimate", credits: 10000, price: 299.99, savings: 50, category: "bulk" },
  
  // Subscription Auto-Recharge
  { id: "sub-1", name: "Auto-Recharge 500/mo", credits: 500, price: 29.99, savings: 25, recurring: true, category: "subscription" },
  { id: "sub-2", name: "Auto-Recharge 1000/mo", credits: 1000, price: 49.99, savings: 33, recurring: true, category: "subscription" },
  { id: "sub-3", name: "Auto-Recharge 2500/mo", credits: 2500, price: 99.99, savings: 40, recurring: true, category: "subscription" },
];

// ============ GIFT OPTIONS (20+ GIFTS) ============
export const GIFT_OPTIONS = [
  // Tier 1: $1-5
  { id: "gift-1", name: "Wink", emoji: "ðŸ‘‹", price: 1, category: "social", description: "A friendly wink" },
  { id: "gift-2", name: "Heart", emoji: "â¤ï¸", price: 2, category: "social", description: "Show your love" },
  { id: "gift-3", name: "Rose", emoji: "ðŸŒ¹", price: 3, category: "romantic", description: "Classic romance" },
  { id: "gift-4", name: "Champagne", emoji: "ðŸ¾", price: 5, category: "celebration", description: "Let's celebrate!" },
  
  // Tier 2: $10-25
  { id: "gift-5", name: "Coffee Date", emoji: "â˜•", price: 10, category: "date", description: "Let's grab coffee" },
  { id: "gift-6", name: "Dinner Date", emoji: "ðŸ½ï¸", price: 15, category: "date", description: "Dinner for two" },
  { id: "gift-7", name: "Movie Night", emoji: "ðŸŽ¬", price: 12, category: "date", description: "Movie & chill" },
  { id: "gift-8", name: "Adventure", emoji: "ðŸŽ¢", price: 20, category: "date", description: "Let's go on an adventure" },
  { id: "gift-9", name: "Concert Tickets", emoji: "ðŸŽµ", price: 25, category: "experience", description: "Live music experience" },
  
  // Tier 3: $50-100
  { id: "gift-10", name: "Luxury Watch", emoji: "âŒš", price: 50, category: "luxury", description: "Timeless elegance" },
  { id: "gift-11", name: "Designer Bag", emoji: "ðŸ‘œ", price: 75, category: "luxury", description: "High fashion" },
  { id: "gift-12", name: "Jewelry", emoji: "ðŸ’Ž", price: 100, category: "luxury", description: "Sparkling beauty" },
  { id: "gift-13", name: "Weekend Getaway", emoji: "ðŸ–ï¸", price: 150, category: "experience", description: "Escape together" },
  
  // Tier 4: $250-500
  { id: "gift-14", name: "Yacht Party", emoji: "â›µ", price: 250, category: "vip", description: "Luxury yacht experience" },
  { id: "gift-15", name: "Private Jet", emoji: "âœˆï¸", price: 500, category: "vip", description: "First-class travel" },
  { id: "gift-16", name: "Diamond Ring", emoji: "ðŸ’", price: 300, category: "luxury", description: "Forever commitment" },
  { id: "gift-17", name: "Luxury Car", emoji: "ðŸŽï¸", price: 400, category: "vip", description: "Dream ride" },
  
  // Tier 5: $1000+
  { id: "gift-18", name: "Rolex Watch", emoji: "âŒšâœ¨", price: 1000, category: "ultra_luxury", description: "Ultimate timepiece" },
  { id: "gift-19", name: "Lamborghini", emoji: "ðŸŽï¸ðŸ’Ž", price: 2500, category: "ultra_luxury", description: "Ultimate luxury car" },
  { id: "gift-20", name: "Island Paradise", emoji: "ðŸï¸âœ¨", price: 5000, category: "ultra_luxury", description: "Own an island" },
];

// ============ SPENDER REWARDS TIERS ============
export const SPENDER_REWARDS = [
  {
    tier: "bronze",
    name: "Bronze Spender",
    minSpent: 0,
    maxSpent: 499,
    benefits: ["5% cashback on gifts", "Monthly bonus 50 credits"],
    badge: "ðŸ¥‰",
  },
  {
    tier: "silver",
    name: "Silver Spender",
    minSpent: 500,
    maxSpent: 1499,
    benefits: ["10% cashback on gifts", "Monthly bonus 150 credits", "Priority support"],
    badge: "ðŸ¥ˆ",
  },
  {
    tier: "gold",
    name: "Gold Spender",
    minSpent: 1500,
    maxSpent: 4999,
    benefits: ["15% cashback on gifts", "Monthly bonus 300 credits", "Exclusive creator access", "VIP badge"],
    badge: "ðŸ¥‡",
  },
  {
    tier: "platinum",
    name: "Platinum Spender",
    minSpent: 5000,
    maxSpent: 9999,
    benefits: ["20% cashback on gifts", "Monthly bonus 500 credits", "Concierge service", "Exclusive events"],
    badge: "ðŸ’Ž",
  },
  {
    tier: "diamond",
    name: "Diamond Spender",
    minSpent: 10000,
    maxSpent: Infinity,
    benefits: ["25% cashback on gifts", "Monthly bonus 1000 credits", "Lifetime VIP status", "Personal account manager"],
    badge: "ðŸ’ âœ¨",
  },
];

// ============ PREMIUM BADGES ============
export const PREMIUM_BADGES = [
  { id: "verified", name: "Verified", icon: "âœ“", price: 9.99, description: "Verified profile" },
  { id: "pro", name: "Pro Creator", icon: "â­", price: 19.99, description: "Professional creator badge" },
  { id: "elite", name: "Elite", icon: "ðŸ‘‘", price: 49.99, description: "Elite status badge" },
  { id: "vip", name: "VIP", icon: "ðŸ’Ž", price: 99.99, description: "VIP exclusive badge" },
];

// ============ PRIVATE SESSIONS ============
export const PRIVATE_SESSIONS_CONFIG = {
  maxPerUserPerMonth: 1,
  maxPerCreatorPerMonth: 10,
  pricePerMinute: { min: 0.50, max: 2.00 },
  defaultDuration: 30,
  creatorAcceptanceRequired: true,
};

// ============ ORIGINAL PROFILES ============
export const MOCK_PROFILES = [
  {
    id: "profile-1",
    username: "luna_rose",
    displayName: "Luna Rose",
    age: 24,
    location: "Miami, FL",
    gender: "Female",
    bodyType: "Athletic",
    ethnicity: "Latina",
    height: "5'5\"",
    isLive: true,
    isCreator: true,
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna&backgroundColor=b6e3f4",
    coverUrl: "https://picsum.photos/seed/luna-cover/1200/400",
    tagline: "Your Miami sunshine â˜€ï¸ Live every night 9PM EST",
    bio: "Miami native living my best life. I love the beach, dancing, and deep conversations. I'm here to connect authentically with amazing people. Join my streams for the ultimate vibe!",
    viewerCount: 1247,
    tier: "established",
    rating: 4.9,
    personalityTraits: ["Adventurous", "Playful", "Passionate", "Empathetic"],
    lifestyle: "Active & Social",
    interests: ["Beach life", "Dancing", "Travel", "Music", "Fitness"],
    hobbies: ["Salsa dancing", "Yoga", "Cooking", "Reading"],
    lookingFor: "Someone who matches my energy and loves to have fun.",
    relationshipGoals: "Open to everything from casual connections to something deeper.",
    liveSchedule: "Mon, Wed, Fri â€” 9PMâ€“11PM EST | Sat â€” 8PMâ€“Midnight EST",
    sexualPreferences: { orientation: "Bisexual", lockedDetails: "Unlock to view intimate preferences" },
    followersCount: 12847,
    likesCount: 89234,
    joinedDate: "2023-03-15",
    badges: [
      { id: "hot-creator", name: "Hot Creator", icon: "ðŸ”¥", color: "#f97316", description: "Trending creator" },
      { id: "top-creator", name: "Top Creator", icon: "ðŸ†", color: "#eab308", description: "Top performer" },
    ],
    mediaItems: [
      { id: "profile-1-photo-1", type: "photo", thumbnailUrl: "https://picsum.photos/seed/luna-p1/400/500", isLocked: true, creditCost: 50, title: "Exclusive Photo 1" },
      { id: "profile-1-photo-2", type: "photo", thumbnailUrl: "https://picsum.photos/seed/luna-p2/400/500", isLocked: true, creditCost: 50, title: "Exclusive Photo 2" },
      { id: "profile-1-photo-3", type: "photo", thumbnailUrl: "https://picsum.photos/seed/luna-p3/400/500", isLocked: true, creditCost: 75, title: "Special Photo Set" },
      { id: "profile-1-video-1", type: "video", thumbnailUrl: "https://picsum.photos/seed/luna-v1/400/300", isLocked: true, creditCost: 150, title: "Private Video 1" },
      { id: "profile-1-video-2", type: "video", thumbnailUrl: "https://picsum.photos/seed/luna-v2/400/300", isLocked: true, creditCost: 200, title: "VIP Video Experience" },
    ],
    privateSessionRate: 1.50,
    acceptedPrivateSessions: 5,
    monthlyPrivateSessions: 0,
  },
  {
    id: "profile-2",
    username: "alex_storm",
    displayName: "Alex Storm",
    age: 28,
    location: "New York, NY",
    gender: "Male",
    bodyType: "Muscular",
    ethnicity: "Mixed",
    height: "6'1\"",
    isLive: true,
    isCreator: true,
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alexstorm&backgroundColor=c0aede",
    coverUrl: "https://picsum.photos/seed/alex-cover/1200/400",
    tagline: "NYC nightlife & deep conversations ðŸŒ†",
    bio: "NYC guy who loves good food, great conversation and making genuine connections. Real talks only.",
    viewerCount: 892,
    tier: "rising",
    rating: 4.7,
    personalityTraits: ["Confident", "Witty", "Ambitious", "Loyal"],
    lifestyle: "Urban Professional",
    interests: ["Nightlife", "Fitness", "Music", "Travel", "Food"],
    hobbies: ["Boxing", "DJing", "Photography", "Cooking"],
    lookingFor: "Authentic connections with people who know what they want.",
    relationshipGoals: "Open to exploration.",
    liveSchedule: "Tue, Thu â€” 10PMâ€“Midnight EST | Friâ€“Sat â€” 11PMâ€“2AM EST",
    sexualPreferences: { orientation: "Straight", lockedDetails: "Unlock to view preferences" },
    followersCount: 7234,
    likesCount: 45678,
    joinedDate: "2023-06-20",
    badges: [
      { id: "rising-star", name: "Rising Star", icon: "â­", color: "#a78bfa", description: "Fast-growing creator" },
    ],
    mediaItems: [
      { id: "profile-2-photo-1", type: "photo", thumbnailUrl: "https://picsum.photos/seed/alex-p1/400/500", isLocked: true, creditCost: 40, title: "Exclusive Photo" },
      { id: "profile-2-video-1", type: "video", thumbnailUrl: "https://picsum.photos/seed/alex-v1/400/300", isLocked: true, creditCost: 120, title: "Private Video" },
    ],
    privateSessionRate: 1.25,
    acceptedPrivateSessions: 3,
    monthlyPrivateSessions: 0,
  },
  {
    id: "profile-3",
    username: "jade_velvet",
    displayName: "Jade Velvet",
    age: 26,
    location: "Los Angeles, CA",
    gender: "Female",
    bodyType: "Curvy",
    ethnicity: "Asian",
    height: "5'3\"",
    isLive: false,
    isCreator: true,
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jade&backgroundColor=ffd5dc",
    coverUrl: "https://picsum.photos/seed/jade-cover/1200/400",
    tagline: "LA girl, creative soul ðŸŽ¨",
    bio: "Artist and creator sharing my world with you. Let's vibe and connect on a deeper level.",
    viewerCount: 0,
    tier: "rising",
    rating: 4.8,
    personalityTraits: ["Creative", "Thoughtful", "Spontaneous", "Kind"],
    lifestyle: "Artistic",
    interests: ["Art", "Music", "Fashion", "Travel"],
    hobbies: ["Painting", "Photography", "Meditation", "Cooking"],
    lookingFor: "Creative minds and genuine souls.",
    relationshipGoals: "Looking for meaningful connections.",
    liveSchedule: "Wed, Fri, Sun â€” 8PMâ€“10PM PST",
    sexualPreferences: { orientation: "Pansexual", lockedDetails: "Unlock to view preferences" },
    followersCount: 5432,
    likesCount: 34567,
    joinedDate: "2023-08-10",
    badges: [],
    mediaItems: [
      { id: "profile-3-photo-1", type: "photo", thumbnailUrl: "https://picsum.photos/seed/jade-p1/400/500", isLocked: true, creditCost: 35, title: "Art Piece" },
    ],
    privateSessionRate: 1.00,
    acceptedPrivateSessions: 2,
    monthlyPrivateSessions: 0,
  },
];

// ============ LIVE FEEDS ============
export const MOCK_LIVE_FEEDS = [
  {
    id: "live-1",
    creatorId: "profile-1",
    title: "Luna's Evening Vibes ðŸŒ™",
    category: "Dating & Connection",
    thumbnailUrl: "https://picsum.photos/seed/live-luna/800/600",
    viewerCount: 1247,
    duration: 45,
    startTime: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "live-2",
    creatorId: "profile-2",
    title: "NYC Late Night Chat",
    category: "Dating & Connection",
    thumbnailUrl: "https://picsum.photos/seed/live-alex/800/600",
    viewerCount: 892,
    duration: 30,
    startTime: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "live-3",
    creatorId: "profile-3",
    title: "Creative Hour with Jade",
    category: "Dating & Connection",
    thumbnailUrl: "https://picsum.photos/seed/live-jade/800/600",
    viewerCount: 456,
    duration: 15,
    startTime: new Date(Date.now() - 15 * 60000),
  },
  {
    id: "live-4",
    creatorId: "profile-1",
    title: "Q&A with Luna Rose",
    category: "Dating & Connection",
    thumbnailUrl: "https://picsum.photos/seed/live-luna-qa/800/600",
    viewerCount: 2100,
    duration: 60,
    startTime: new Date(Date.now() - 60 * 60000),
  },
];

// ============ MESSAGES ============
export const MOCK_MESSAGES = [
  {
    id: "msg-1",
    senderId: "user-1",
    senderName: "You",
    recipientId: "profile-1",
    recipientName: "Luna Rose",
    content: "Hey Luna! Your stream was amazing last night ðŸ”¥",
    timestamp: new Date(Date.now() - 2 * 60000),
    isRead: true,
  },
  {
    id: "msg-2",
    senderId: "profile-1",
    senderName: "Luna Rose",
    recipientId: "user-1",
    recipientName: "You",
    content: "Thanks so much! ðŸ’• Hope to see you again soon",
    timestamp: new Date(Date.now() - 60000),
    isRead: true,
  },
];

// ============ BOOST PACKAGES ============
export const MOCK_BOOST_PACKAGES = [
  { id: "boost-1", name: "1 Hour Boost", hours: 1, price: 9.99, viewers: "2x visibility" },
  { id: "boost-2", name: "4 Hour Boost", hours: 4, price: 29.99, viewers: "3x visibility" },
  { id: "boost-3", name: "24 Hour Boost", hours: 24, price: 79.99, viewers: "5x visibility" },
  { id: "boost-4", name: "7 Day Boost", hours: 168, price: 199.99, viewers: "10x visibility" },
];

// ============ CREATOR STATS ============
export const MOCK_CREATOR_STATS = {
  monthlyEarnings: 8750.50,
  payoutPercentage: 80,
  totalEarnings: 142300.75,
  nextPayout: 2816,
  nextPayoutDate: "2026-04-04",
  monthlyRevenue: [
    { month: "Jan", amount: 6200 },
    { month: "Feb", amount: 7100 },
    { month: "Mar", amount: 8750 },
  ],
  revenueBreakdown: [
    { label: "Video Calls", value: 45, color: "#14b8a6" },
    { label: "Subscriptions", value: 30, color: "#a78bfa" },
    { label: "Gifts", value: 15, color: "#f97316" },
    { label: "Tips", value: 10, color: "#ec4899" },
  ],
  totalFollowers: 12847,
  newFollowersThisMonth: 234,
  totalLikes: 89234,
  totalViews: 456789,
  avgViewersPerStream: 1247,
  contentSold: 2341,
  contentUnlocks: 1892,
  giftsReceived: 892,
  recentPayouts: [
    { date: "Mar 14", amount: 1842 },
    { date: "Mar 21", amount: 2105 },
    { date: "Mar 28", amount: 1987 },
    { date: "Apr 4 (est)", amount: 2816 },
  ],
  tier: "established",
  tierEarnings: { min: 5000, max: 15000 },
  platformFee: 20,
  creatorShare: 80,
};

// ============ MONETIZATION SUMMARY ============
export const MONETIZATION_OPPORTUNITIES = {
  vipSubscriptions: "8 tiers from $4.99â€“$249.99/month",
  creditPackages: "9 packages from $4.99â€“$299.99 with bulk discounts",
  gifts: "20+ gift options from $1â€“$5000",
  spenderRewards: "5 tiers with 5â€“25% cashback",
  premiumBadges: "4 badges from $9.99â€“$99.99",
  privateSessions: "Per-minute billing, max 1/user/month, 10/creator/month",
  customVideoMessages: "Creator-specific pricing",
  exclusiveContent: "Photo/video unlocks via credits",
  liveStreamTips: "During live streams",
  referralProgram: "Affiliate commissions",
};

// ============ BILLING & TRANSACTIONS ============
export const MOCK_TRANSACTIONS = [
  {
    id: "tx-1",
    type: "credit_purchase",
    description: "Purchased 500 Credits",
    amount: 34.99,
    date: new Date(Date.now() - 7 * 24 * 60 * 60000),
    status: "completed",
    paymentMethod: "Visa ending in 4242",
  },
  {
    id: "tx-2",
    type: "vip_subscription",
    description: "Platinum VIP Monthly",
    amount: 39.99,
    date: new Date(Date.now() - 5 * 24 * 60 * 60000),
    status: "completed",
    paymentMethod: "Mastercard ending in 5555",
  },
  {
    id: "tx-3",
    type: "gift_sent",
    description: "Sent Rose to Luna Rose",
    amount: 3.00,
    date: new Date(Date.now() - 3 * 24 * 60 * 60000),
    status: "completed",
    paymentMethod: "Credits",
  },
  {
    id: "tx-4",
    type: "credit_purchase",
    description: "Purchased 1000 Credits",
    amount: 59.99,
    date: new Date(Date.now() - 2 * 24 * 60 * 60000),
    status: "completed",
    paymentMethod: "Visa ending in 4242",
  },
  {
    id: "tx-5",
    type: "private_session",
    description: "30-min Private Session with Luna Rose",
    amount: 45.00,
    date: new Date(Date.now() - 1 * 24 * 60 * 60000),
    status: "completed",
    paymentMethod: "Credits",
  },
];
