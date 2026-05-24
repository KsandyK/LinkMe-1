import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface StreamingPlayerProps {
  hlsUrl: string;
  streamTitle: string;
  creatorName: string;
  viewerCount?: number;
  isLive?: boolean;
  onError?: (error: string) => void;
}

/**
 * Real-time Streaming Player Component
 * Supports HLS (HTTP Live Streaming) with adaptive bitrate
 */
export const StreamingPlayer: React.FC<StreamingPlayerProps> = ({
  hlsUrl,
  streamTitle,
  creatorName,
  viewerCount = 0,
  isLive = true,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if browser supports HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      setIsLoading(false);
    } else {
      // Use HLS.js for other browsers
      loadHLSPlayer();
    }

    return () => {
      if (video.src) {
        video.pause();
        video.src = '';
      }
    };
  }, [hlsUrl]);

  // Load HLS.js library for cross-browser support
  const loadHLSPlayer = async () => {
    try {
      // TODO: Import HLS.js from CDN or npm
      // For now, use native HLS support
      const video = videoRef.current;
      if (video) {
        video.src = hlsUrl;
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load HLS player';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      {/* Video Container */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-center">
              <p className="text-red-500 font-semibold mb-2">Stream Error</p>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">LIVE</span>
          </div>
        )}

        {/* Viewer Count */}
        {viewerCount > 0 && (
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full">
            <p className="text-white text-sm">👥 {viewerCount.toLocaleString()} watching</p>
          </div>
        )}

        {/* Stream Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h2 className="text-white font-bold text-lg">{streamTitle}</h2>
          <p className="text-gray-300 text-sm">by {creatorName}</p>
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Player Controls */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <span className="text-gray-300 text-xs whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="text-gray-300 hover:text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={handleMute}
                className="text-gray-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover:w-20 transition-all h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings */}
            <button
              className="text-gray-300 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-gray-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingPlayer;
