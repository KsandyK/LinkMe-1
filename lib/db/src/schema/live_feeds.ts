import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const liveFeedsTable = pgTable("live_feeds", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  hostName: text("host_name").notNull(),
  hostAvatarUrl: text("host_avatar_url").notNull(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  viewerCount: integer("viewer_count").notNull().default(0),
  category: text("category").notNull(),
  isVip: boolean("is_vip").notNull().default(false),
  vipCost: integer("vip_cost").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  startedAt: text("started_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  badges: jsonb("badges").$type<Array<{ id: string; name: string; icon: string; color: string; description: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiveFeedSchema = createInsertSchema(liveFeedsTable).omit({ createdAt: true });
export type InsertLiveFeed = z.infer<typeof insertLiveFeedSchema>;
export type LiveFeed = typeof liveFeedsTable.$inferSelect;
