"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "../algorithms/types";
import {
  applySearchEvents,
  createPlaybackSnapshot,
  nextExpansionBoundary,
} from "../playback/reducer";
import type { PlaybackSnapshot } from "../playback/types";

export interface PlaybackController {
  snapshot: PlaybackSnapshot;
  cursor: number;
  isPlaying: boolean;
  isComplete: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  load: (result: SearchResult, autoplay?: boolean) => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
}

export function usePlayback(activeResult: SearchResult | null): PlaybackController {
  const [snapshot, setSnapshot] = useState(createPlaybackSnapshot);
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(55);
  const resultRef = useRef<SearchResult | null>(activeResult);

  useEffect(() => {
    resultRef.current = activeResult;
  }, [activeResult]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCursor(0);
    setSnapshot(createPlaybackSnapshot());
  }, []);

  const load = useCallback((result: SearchResult, autoplay = true) => {
    resultRef.current = result;
    setSnapshot(createPlaybackSnapshot());
    setCursor(0);
    setIsPlaying(autoplay);
  }, []);

  const play = useCallback(() => {
    const result = resultRef.current;
    if (!result) return;
    setCursor((currentCursor) => {
      if (currentCursor >= result.events.length) {
        setSnapshot(createPlaybackSnapshot());
        return 0;
      }
      return currentCursor;
    });
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);

  const step = useCallback(() => {
    const result = resultRef.current;
    if (!result) return;
    setIsPlaying(false);
    setCursor((currentCursor) => {
      const boundary = nextExpansionBoundary(result.events, currentCursor);
      setSnapshot((currentSnapshot) =>
        applySearchEvents(currentSnapshot, result.events.slice(currentCursor, boundary)),
      );
      return boundary;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying || !activeResult) return;
    if (cursor >= activeResult.events.length) return;

    const eventsPerFrame = Math.max(1, Math.round(speed / 14));
    const frameDelay = Math.max(12, 78 - speed * 0.65);
    const timer = window.setTimeout(() => {
      const nextCursor = Math.min(activeResult.events.length, cursor + eventsPerFrame);
      setSnapshot((current) =>
        applySearchEvents(current, activeResult.events.slice(cursor, nextCursor)),
      );
      setCursor(nextCursor);
      if (nextCursor >= activeResult.events.length) setIsPlaying(false);
    }, frameDelay);

    return () => window.clearTimeout(timer);
  }, [activeResult, cursor, isPlaying, speed]);

  const setSpeed = useCallback((nextSpeed: number) => {
    setSpeedState(Math.min(100, Math.max(1, nextSpeed)));
  }, []);

  return {
    snapshot,
    cursor,
    isPlaying,
    isComplete: Boolean(activeResult && cursor >= activeResult.events.length),
    speed,
    setSpeed,
    load,
    play,
    pause,
    step,
    reset,
  };
}
