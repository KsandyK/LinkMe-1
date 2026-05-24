import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaDevices } from './useMediaDevices';

describe('useMediaDevices', () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices
    const mockGetUserMedia = vi.fn();
    const mockEnumerateDevices = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: mockEnumerateDevices,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });
  });

  it('should initialize with no devices detected', () => {
    const { result } = renderHook(() => useMediaDevices());

    expect(result.current.hasMicrophone).toBe(false);
    expect(result.current.hasWebcam).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should detect microphone and webcam when available', async () => {
    const mockEnumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' },
      { kind: 'videoinput', deviceId: 'cam1', label: 'Webcam' },
    ]);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: mockEnumerateDevices,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      await result.current.checkDevices();
    });

    expect(result.current.hasMicrophone).toBe(true);
    expect(result.current.hasWebcam).toBe(true);
  });

  it('should handle permission denied error', async () => {
    const mockGetUserMedia = vi.fn().mockRejectedValue(
      new Error('Permission denied')
    );

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    const { result } = renderHook(() => useMediaDevices());

    await act(async () => {
      const success = await result.current.requestPermissions();
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('Permission denied');
  });
});
