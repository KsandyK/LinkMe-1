/**
 * Bunny.net Storage + CDN utilities
 *
 * Storage zone:  cravr-media  (dash.bunny.net → Storage → cravr-media)
 * CDN hostname:  cdn.cravr.fun (backed by cravr-cdn pull zone)
 *
 * Public files:  https://cdn.cravr.fun/{path}
 * Private files: https://cdn.cravr.fun/{path}?token={hash}&expires={unix}
 *
 * Environment variables required:
 *   BUNNY_STORAGE_ZONE      — storage zone name (cravr-media)
 *   BUNNY_STORAGE_PASSWORD  — FTP/API password from Bunny dashboard
 *   BUNNY_STORAGE_REGION    — storage region endpoint prefix (ny, la, sg, etc.)
 *   BUNNY_CDN_HOSTNAME      — custom CDN hostname (cdn.cravr.fun)
 *   BUNNY_CDN_TOKEN_KEY     — token authentication secret key from Bunny dashboard
 */

import crypto from "crypto";

const STORAGE_ZONE     = process.env.BUNNY_STORAGE_ZONE     ?? "cravr-media";
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD ?? "";
const STORAGE_REGION   = process.env.BUNNY_STORAGE_REGION   ?? "ny";
const CDN_HOSTNAME     = process.env.BUNNY_CDN_HOSTNAME     ?? "cdn.cravr.fun";
const CDN_TOKEN_KEY    = process.env.BUNNY_CDN_TOKEN_KEY    ?? "";

// Storage API base URL — always use regional endpoint (works for all regions incl. ny)
// e.g. https://ny.storage.bunnycdn.com/cravr-media/path/to/file
// https://docs.bunny.net/reference/storage-api
const storageBase = (): string =>
  `https://${STORAGE_REGION || "ny"}.storage.bunnycdn.com`;

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  /** Full CDN URL (unsigned — for public files) */
  url: string;
  /** The path within the storage zone, e.g. "profiles/uuid/avatar.jpg" */
  path: string;
}

/**
 * Upload a file buffer to Bunny storage zone.
 *
 * @param path     - Destination path within the storage zone (no leading slash)
 *                   e.g. "profiles/user-123/avatar.jpg"
 * @param buffer   - File content as a Buffer
 * @param mimeType - MIME type, e.g. "image/jpeg"
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  const url = `${storageBase()}/${STORAGE_ZONE}/${path}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_PASSWORD,
      "Content-Type": mimeType,
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Bunny upload failed: ${response.status} ${text}`);
  }

  return {
    url: `https://${CDN_HOSTNAME}/${path}`,
    path,
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete a file from Bunny storage zone.
 * Fire-and-forget — does not throw on failure.
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const url = `${storageBase()}/${STORAGE_ZONE}/${path}`;
    await fetch(url, {
      method: "DELETE",
      headers: { AccessKey: STORAGE_PASSWORD },
    });
  } catch {
    // Best-effort — log in production monitoring
  }
}

// ── Signed CDN URLs (token authentication) ────────────────────────────────────

/**
 * Generate a time-limited signed URL for private CDN content.
 *
 * Uses Bunny's token authentication:
 * https://docs.bunny.net/docs/cdn-token-authentication
 *
 * Token = base64url(md5(TOKEN_KEY + "/" + path + expires))
 *
 * @param path          - CDN path, e.g. "/vip/creator-123/video.mp4"
 * @param expiresIn     - Validity in seconds (default 3600 = 1 hour)
 */
export function signCdnUrl(path: string, expiresIn = 3600): string {
  if (!CDN_TOKEN_KEY) {
    // No token key configured — return unsigned URL (dev/demo mode)
    return `https://${CDN_HOSTNAME}${path}`;
  }

  const expires = Math.floor(Date.now() / 1000) + expiresIn;

  // Bunny's algorithm: md5(key + path_without_query + expires)
  // Note: path must start with "/" — strip any query string first
  const cleanPath = path.split("?")[0];
  const rawToken = `${CDN_TOKEN_KEY}${cleanPath}${expires}`;
  const token = crypto
    .createHash("md5")
    .update(rawToken)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `https://${CDN_HOSTNAME}${cleanPath}?token=${token}&expires=${expires}`;
}

/**
 * Public CDN URL — no token, no expiry. Use for profile pictures and
 * any content that doesn't require access control.
 */
export function publicCdnUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${CDN_HOSTNAME}${cleanPath}`;
}

// ── Path helpers ──────────────────────────────────────────────────────────────

export const BunnyPaths = {
  /** Profile avatar: profiles/{userId}/avatar.{ext} */
  avatar: (userId: string, ext = "jpg") => `profiles/${userId}/avatar.${ext}`,

  /** Creator content: content/{creatorId}/{contentId}.{ext} */
  content: (creatorId: string, contentId: string, ext = "jpg") =>
    `content/${creatorId}/${contentId}.${ext}`,

  /** VIP-gated content: vip/{creatorId}/{contentId}.{ext} */
  vipContent: (creatorId: string, contentId: string, ext = "mp4") =>
    `vip/${creatorId}/${contentId}.${ext}`,

  /** Message attachment: messages/{conversationId}/{messageId}.{ext} */
  attachment: (conversationId: string, messageId: string, ext = "jpg") =>
    `messages/${conversationId}/${messageId}.${ext}`,
} as const;
