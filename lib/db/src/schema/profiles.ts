import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  gender: text("gender").notNull(),
  bodyType: text("body_type"),
  ethnicity: text("ethnicity"),
  height: text("height"),
  isLive: boolean("is_live").notNull().default(false),
  isCreator: boolean("is_creator").notNull().default(false),
  avatarUrl: text("avatar_url").notNull(),
  coverUrl: text("cover_url"),
  tagline: text("tagline").notNull(),
  bio: text("bio").notNull().default(""),
  viewerCount: integer("viewer_count").default(0),
  tier: text("tier").notNull().default("starter"),
  rating: integer("rating").default(45), // Store as 0-100 scale (45 = 4.5 stars)
  totalEarnings: integer("total_earnings").default(0), // Store in cents to avoid floating-point errors
  personalityTraits: jsonb("personality_traits").$type<string[]>().default([]),
  lifestyle: text("lifestyle"),
  interests: jsonb("interests").$type<string[]>().default([]),
  hobbies: jsonb("hobbies").$type<string[]>().default([]),
  lookingFor: text("looking_for").notNull().default(""),
  relationshipGoals: text("relationship_goals").notNull().default(""),
  liveSchedule: text("live_schedule").notNull().default(""),
  sexualOrientation: text("sexual_orientation"),
  followersCount: integer("followers_count").default(0),
  likesCount: integer("likes_count").default(0),
  joinedDate: text("joined_date").notNull(),
  badges: jsonb("badges").$type<Array<{ id: string; name: string; icon: string; color: string; description: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
