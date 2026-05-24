import { useState, useEffect, useCallback } from 'react';

export interface MediaDeviceStatus {
  hasMicrophone: boolean;
  hasWebcam: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * Hook to detect and manage webcam and microphone availability
 * Used by creators to check if they can stream
 */
export function useMediaDevices() {
  const [status, setStatus] = useState<MediaDeviceStatus>({
    hasMicrophone: false,
    hasWebcam: false,
    isStreaming: false,
    error: null,
  });

  const checkDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setStatus(prev => ({
          ...prev,
          error: 'Media devices API not supported in this browser'
        }));
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      const hasWebcam = devices.some(device => device.kind === 'videoinput');

      setStatus({
        hasMicrophone,
        hasWebcam,
        isStreaming: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check media devices';
      setStatus(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Stop all tracks immediately - we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());

      setStatus({
        hasMicrophone: true,
        hasWebcam: true,
        isStreaming: false,
        error: null,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permission denied';
      setStatus(prev => ({
        ...prev,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      setStatus(prev => ({
        ...prev,
        isStreaming: true,
        error: null,
      }));

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
      setStatus(prev => ({
        ...prev,
        error: errorMessage,
        isStreaming: false,
      }));
      return null;
    }
  }, []);

  const stopStreaming = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStatus(prev => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  useEffect(() => {
    checkDevices();

    // Listen for device changes (e.g., camera plugged in/out)
    const handleDeviceChange = () => {
      checkDevices();
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [checkDevices]);

  return {
    ...status,
    checkDevices,
    requestPermissions,
    startStreaming,
    stopStreaming,
  };
}
