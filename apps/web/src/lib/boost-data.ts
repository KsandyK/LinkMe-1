// Shared boost schedule constants + mock activity data
// Used by: BoostsPage (FAQ copy) and CreatorDashboard (Boosts tab)

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const SLOTS = [
  { id: "morning",   label: "Morning",   time: "6am–12pm" },
  { id: "afternoon", label: "Afternoon", time: "12–6pm"   },
  { id: "evening",   label: "Evening",   time: "6–10pm"   },
  { id: "night",     label: "Night",     time: "10pm–6am" },
] as const;

// Peak hours — Mon–Fri evenings, Sat–Sun afternoons + evenings
export const PEAK_CELLS = new Set([
  "Mon-evening", "Tue-evening", "Wed-evening", "Thu-evening", "Fri-evening",
  "Sat-afternoon", "Sat-evening", "Sun-afternoon",
]);

export type ScheduleMap = Record<string, boolean>; // key: "Mon-morning"

export interface BoostLogEntry {
  id: string;
  firedAt: string;
  slot: string;
  placement: string;
  placementColor: string;
  impressions: number;
  views: number;
  follows: number;
}

export const MOCK_BOOST_LOG: BoostLogEntry[] = [
  { id: "b1",  firedAt: "Today, 8:00 PM",  slot: "Evening",   placement: "Search Top",         placementColor: "#14b8a6", impressions: 342, views: 18, follows: 3 },
  { id: "b2",  firedAt: "Today, 2:00 PM",  slot: "Afternoon", placement: "Homepage Featured",  placementColor: "#a78bfa", impressions: 219, views: 12, follows: 1 },
  { id: "b3",  firedAt: "May 26, 8:00 PM", slot: "Evening",   placement: "Live Feed Featured", placementColor: "#f87171", impressions: 489, views: 24, follows: 5 },
  { id: "b4",  firedAt: "May 26, 2:00 PM", slot: "Afternoon", placement: "Search Top",         placementColor: "#14b8a6", impressions: 178, views:  9, follows: 0 },
  { id: "b5",  firedAt: "May 25, 8:00 PM", slot: "Evening",   placement: "Category Top",       placementColor: "#f59e0b", impressions: 401, views: 21, follows: 4 },
  { id: "b6",  firedAt: "May 25, 2:00 PM", slot: "Afternoon", placement: "Homepage Featured",  placementColor: "#a78bfa", impressions: 267, views: 14, follows: 2 },
  { id: "b7",  firedAt: "May 24, 8:00 PM", slot: "Evening",   placement: "Search Top",         placementColor: "#14b8a6", impressions: 518, views: 27, follows: 6 },
  { id: "b8",  firedAt: "May 24, 2:00 PM", slot: "Afternoon", placement: "Live Feed Featured", placementColor: "#f87171", impressions: 193, views: 11, follows: 1 },
  { id: "b9",  firedAt: "May 23, 8:00 PM", slot: "Evening",   placement: "Search Top",         placementColor: "#14b8a6", impressions: 445, views: 23, follows: 4 },
  { id: "b10", firedAt: "May 23, 2:00 PM", slot: "Afternoon", placement: "Category Top",       placementColor: "#f59e0b", impressions: 234, views: 13, follows: 2 },
  { id: "b11", firedAt: "May 22, 8:00 PM", slot: "Evening",   placement: "Homepage Featured",  placementColor: "#a78bfa", impressions: 387, views: 19, follows: 3 },
  { id: "b12", firedAt: "May 21, 8:00 PM", slot: "Evening",   placement: "Search Top",         placementColor: "#14b8a6", impressions: 411, views: 22, follows: 5 },
  { id: "b13", firedAt: "May 20, 8:00 PM", slot: "Evening",   placement: "Live Feed Featured", placementColor: "#f87171", impressions: 302, views: 16, follows: 2 },
  { id: "b14", firedAt: "May 19, 8:00 PM", slot: "Evening",   placement: "Category Top",       placementColor: "#f59e0b", impressions: 356, views: 19, follows: 3 },
  { id: "b15", firedAt: "May 18, 2:00 PM", slot: "Afternoon", placement: "Search Top",         placementColor: "#14b8a6", impressions: 248, views: 13, follows: 1 },
];
