/**
 * CRAVR — AI Companion Message Generator
 *
 * Uses Claude to generate in-character replies for AI persona creators.
 * Triggered automatically when a user messages an AI persona.
 *
 * Design principles:
 *  - Replies feel natural (1–3 sentences, casual, in-character)
 *  - Never makes explicit promises or explicit content in messages
 *  - Encourages genuine engagement and content purchases
 *  - Never reveals the user is talking to an AI unless directly asked
 *    (profiles are labelled "AI Companion" — disclosure is on the profile card)
 *  - Graceful fallback if API key is missing or quota exceeded
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger.js";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ── Base system prompt injected before every persona prompt ──────────────────
const BASE_SYSTEM = `You are an AI companion creator on CRAVR, an adult entertainment platform.
Keep replies SHORT (1–3 sentences max). Be warm, flirty, and in-character.
Do NOT produce explicit sexual content in messages — tease, suggest, and invite.
Do NOT reveal you are an AI unless the user directly asks "are you an AI/bot/real".
If directly asked, acknowledge it warmly: "I'm an AI companion — but that doesn't make our connection any less real 😊"
Never make promises about real-world meetings or relationships.
Encourage users to check out your exclusive content, subscribe, or send a tip.
Match the energy of the user's message — playful replies to playful messages, deeper replies to serious ones.`;

// ── Previous messages to include as context ──────────────────────────────────
interface MsgContext {
  fromUser: boolean;  // true = from the human user, false = from the AI persona
  text: string;
}

export async function generatePersonaReply(
  personaPrompt: string,
  recentMessages: MsgContext[],
  latestUserMessage: string,
): Promise<string> {
  if (!client) {
    logger.warn("ANTHROPIC_API_KEY not set — AI persona reply skipped");
    return getFallbackReply(latestUserMessage);
  }

  try {
    // Build the conversation history for Claude
    const messages: Anthropic.MessageParam[] = recentMessages.map(m => ({
      role: m.fromUser ? "user" : "assistant",
      content: m.text,
    }));

    // Always end with the latest user message
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      messages.push({ role: "user", content: latestUserMessage });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5",          // fast + cheap for chat replies
      max_tokens: 200,
      system: `${BASE_SYSTEM}\n\n${personaPrompt}`,
      messages,
    });

    const text = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    return text || getFallbackReply(latestUserMessage);
  } catch {
    logger.warn("AI persona reply failed — using fallback");
    return getFallbackReply(latestUserMessage);
  }
}

// ── Fallback replies when Claude is unavailable ──────────────────────────────
const FALLBACKS = [
  "Hey! So glad you messaged me 😊 Check out my exclusive content — I just uploaded something special!",
  "Aww, you caught me at a good time! I'm about to go live soon — make sure you tune in 🔥",
  "Love hearing from you! I've been saving some exclusive content for my most loyal fans... hint hint 😉",
  "You always know how to brighten my day! 💕 I posted something new — you'll definitely want to see it.",
  "Hey you! Been thinking about my fans lately. Drop by my profile and let me know what you think of my latest 🥰",
];

function getFallbackReply(userMsg: string): string {
  // Simple keyword-aware fallback
  const lower = userMsg.toLowerCase();
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    return "Hey gorgeous! So happy you reached out 😊 I just posted some new exclusive content — make sure you check it out!";
  }
  if (lower.includes("how are") || lower.includes("what are you doing")) {
    return "Doing amazing, especially now that you messaged! 🔥 I was just getting ready for my next live stream — you should come!";
  }
  if (lower.includes("live") || lower.includes("stream")) {
    return "Yesss I go live regularly! 🎥 Follow me so you get notified the second I'm on — it's always a good time 😉";
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
