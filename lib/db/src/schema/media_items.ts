import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaItemsTable = pgTable("media_items", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull(),
  type: text("type").notNull(), // "photo" | "video"
  thumbnailUrl: text("thumbnail_url").notNull(),
  mediaUrl: text("media_url"),
  isLocked: boolean("is_locked").notNull().default(true),
  creditCost: integer("credit_cost").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaItemSchema = createInsertSchema(mediaItemsTable).omit({ createdAt: true });
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type MediaItem = typeof mediaItemsTable.$inferSelect;
