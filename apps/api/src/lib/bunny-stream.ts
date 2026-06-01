/**
 * Bunny Stream — VOD video management
 * Library: cravr-videos (ID: 672123)
 *
 * Flow for creator video upload:
 *   1. Creator requests upload  →  POST /api/content/video-upload-url
 *   2. API creates a video entry in Bunny  →  returns videoId + TUS upload URL
 *   3. Frontend uploads directly to Bunny via TUS (resumable upload)
 *   4. Bunny encodes + delivers via CDN automatically
 *   5. Playback URL: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 *      or HLS:       https://{pullZone}.b-cdn.net/{videoId}/playlist.m3u8
 *
 * Docs: https://docs.bunny.net/reference/video_createvideo
 */

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID ?? "";
const API_KEY    = process.env.BUNNY_STREAM_API_KEY    ?? "";
const BASE       = `https://video.bunnycdn.com/library/${LIBRARY_ID}`;

const headers = () => ({
  AccessKey: API_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BunnyVideo {
  videoId: string;
  title: string;
  status: number; // 0=Queued 1=Processing 2=Encoding 3=Finished 4=Error 5=UploadFailed
  length: number; // seconds
  views: number;
  thumbnailFileName: string;
}

// ── Create a video entry + get TUS upload URL ─────────────────────────────────

export interface CreateVideoResult {
  videoId: string;
  /** TUS resumable upload endpoint — pass directly to the frontend */
  uploadUrl: string;
  /** Embed iframe URL for playback */
  embedUrl: string;
  /** HLS playlist URL for native players */
  hlsUrl: string;
}

/**
 * Create a video entry in Bunny Stream and return upload credentials.
 * The frontend uses the TUS uploadUrl to stream the file directly to Bunny
 * (no file data passes through your API server).
 */
export async function createVideoUpload(title: string): Promise<CreateVideoResult> {
  const res = await fetch(`${BASE}/videos`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny createVideo failed: ${res.status} ${text}`);
  }

  const video: BunnyVideo = await res.json();
  const videoId = video.videoId;

  return {
    videoId,
    // TUS upload endpoint — client sends PUT/PATCH here with the file bytes
    uploadUrl: `https://video.bunnycdn.com/tusupload`,
    embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`,
    hlsUrl: `https://vz-${LIBRARY_ID}.b-cdn.net/${videoId}/playlist.m3u8`,
  };
}

// ── Get video info ────────────────────────────────────────────────────────────

export async function getVideo(videoId: string): Promise<BunnyVideo | null> {
  try {
    const res = await fetch(`${BASE}/videos/${videoId}`, { headers: headers() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Delete video ──────────────────────────────────────────────────────────────

export async function deleteVideo(videoId: string): Promise<void> {
  try {
    await fetch(`${BASE}/videos/${videoId}`, {
      method: "DELETE",
      headers: headers(),
    });
  } catch {
    // Fire-and-forget
  }
}

// ── Video status helpers ──────────────────────────────────────────────────────

export const VideoStatus = {
  QUEUED:        0,
  PROCESSING:    1,
  ENCODING:      2,
  FINISHED:      3,
  ERROR:         4,
  UPLOAD_FAILED: 5,
} as const;

export function isReady(status: number): boolean {
  return status === VideoStatus.FINISHED;
}

// ── TUS upload headers for frontend ──────────────────────────────────────────

/**
 * Returns the headers the frontend needs to include when doing a TUS upload.
 * Call this from the API and return these headers to the client — never expose
 * the raw API key to the frontend directly.
 */
export function getTusHeaders(videoId: string): Record<string, string> {
  return {
    AuthorizationSignature: API_KEY, // Bunny uses the library API key for TUS auth
    AuthorizationExpire: "0",        // 0 = no expiry on upload auth
    VideoId: videoId,
    LibraryId: LIBRARY_ID,
  };
}
