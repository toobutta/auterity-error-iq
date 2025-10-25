import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ScissorsIcon,
  ArrowPathIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'video' | 'audio' | 'image' | 'text';
  src?: string;
  thumbnail?: string;
  effects?: VideoEffect[];
}

interface VideoEffect {
  id: string;
  type: 'filter' | 'transition' | 'text' | 'audio';
  startTime: number;
  endTime: number;
  properties: Record<string, any>;
}

interface VideoTimelineEditorProps {
  videoClips: VideoClip[];
  onClipsChange: (clips: VideoClip[]) => void;
  duration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
  className?: string;
}

export const VideoTimelineEditor: React.FC<VideoTimelineEditorProps> = ({
  videoClips,
  onClipsChange,
  duration,
  currentTime,
  onTimeChange,
  onPlay,
  onPause,
  onStop,
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<Application | null>(null);
  const timelineRef = useRef<Container | null>(null);
  const playheadRef = useRef<Graphics | null>(null);

  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application({
      width: canvasRef.current.clientWidth,
      height: 300,
      backgroundColor: 0x1a1a1a,
      antialias: true
    });

    canvasRef.current.appendChild(app.view as any);
    pixiAppRef.current = app;

    // Create timeline container
    const timeline = new Container();
    app.stage.addChild(timeline);
    timelineRef.current = timeline;

    // Create playhead
    const playhead = new Graphics();
    playhead.lineStyle(2, 0xff6b35);
    playhead.moveTo(0, 0);
    playhead.lineTo(0, 300);
    timeline.addChild(playhead);
    playheadRef.current = playhead;

    return () => {
      app.destroy(true);
      pixiAppRef.current = null;
    };
  }, []);

  // Update timeline when clips change
  useEffect(() => {
    if (!timelineRef.current || !pixiAppRef.current) return;

    const timeline = timelineRef.current;
    const app = pixiAppRef.current;

    // Clear existing clips
    timeline.children.forEach(child => {
      if (child !== playheadRef.current) {
        timeline.removeChild(child);
      }
    });

    // Draw time ruler
    drawTimeRuler(timeline, duration, zoom);

    // Draw video clips
    videoClips.forEach(clip => {
      drawVideoClip(timeline, clip, zoom);
    });

    // Draw effects tracks
    drawEffectsTracks(timeline, videoClips, zoom);
  }, [videoClips, zoom, duration]);

  // Update playhead position
  useEffect(() => {
    if (!playheadRef.current) return;

    const playheadX = (currentTime / duration) * (canvasRef.current?.clientWidth || 800) * zoom;
    playheadRef.current.x = playheadX;
  }, [currentTime, duration, zoom]);

  const drawTimeRuler = (timeline: Container, duration: number, zoom: number) => {
    const ruler = new Graphics();
    const width = (canvasRef.current?.clientWidth || 800) * zoom;
    const height = 40;

    ruler.lineStyle(1, 0x404040);
    ruler.moveTo(0, height);
    ruler.lineTo(width, height);

    // Draw time markers
    const markerInterval = Math.max(1, Math.floor(duration / 20)); // Every 5% of duration
    for (let i = 0; i <= duration; i += markerInterval) {
      const x = (i / duration) * width;
      const markerHeight = i % (markerInterval * 5) === 0 ? 15 : 10;

      ruler.moveTo(x, height);
      ruler.lineTo(x, height - markerHeight);

      // Add time label for major markers
      if (i % (markerInterval * 5) === 0) {
        const timeText = new Text(formatTime(i), new TextStyle({
          fontSize: 10,
          fill: 0x888888
        }));
        timeText.x = x + 2;
        timeText.y = height - 25;
        ruler.addChild(timeText);
      }
    }

    timeline.addChild(ruler);
  };

  const drawVideoClip = (timeline: Container, clip: VideoClip, zoom: number) => {
    const width = (canvasRef.current?.clientWidth || 800) * zoom;
    const clipWidth = (clip.duration / duration) * width;
    const clipX = (clip.startTime / duration) * width;
    const clipY = 50 + (getTrackIndex(clip.type) * 60);

    const clipRect = new Graphics();
    clipRect.beginFill(selectedClip === clip.id ? 0xff6b35 : getClipColor(clip.type));
    clipRect.drawRoundedRect(0, 0, clipWidth, 50, 4);
    clipRect.endFill();

    // Add clip border
    clipRect.lineStyle(2, selectedClip === clip.id ? 0xff8c42 : 0x555555);
    clipRect.drawRoundedRect(0, 0, clipWidth, 50, 4);

    clipRect.x = clipX;
    clipRect.y = clipY;

    // Add clip name
    const clipText = new Text(clip.name, new TextStyle({
      fontSize: 12,
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: clipWidth - 8
    }));
    clipText.x = clipX + 4;
    clipText.y = clipY + 4;
    timeline.addChild(clipText);

    // Add thumbnail if available
    if (clip.thumbnail) {
      // In a real implementation, you'd load the actual thumbnail texture
      const thumbRect = new Graphics();
      thumbRect.beginFill(0x333333);
      thumbRect.drawRect(clipX + clipWidth - 60, clipY + 5, 50, 40);
      thumbRect.endFill();
      timeline.addChild(thumbRect);
    }

    timeline.addChild(clipRect);

    // Make clip interactive
    clipRect.interactive = true;
    clipRect.on('pointerdown', () => {
      setSelectedClip(clip.id);
    });
  };

  const drawEffectsTracks = (timeline: Container, clips: VideoClip[], zoom: number) => {
    const width = (canvasRef.current?.clientWidth || 800) * zoom;

    clips.forEach(clip => {
      clip.effects?.forEach(effect => {
        const effectWidth = ((effect.endTime - effect.startTime) / duration) * width;
        const effectX = (effect.startTime / duration) * width;
        const effectY = 50 + (getTrackIndex(clip.type) * 60) + 55;

        const effectRect = new Graphics();
        effectRect.beginFill(getEffectColor(effect.type));
        effectRect.drawRoundedRect(0, 0, effectWidth, 20, 2);
        effectRect.endFill();

        effectRect.x = effectX;
        effectRect.y = effectY;

        // Add effect label
        const effectText = new Text(effect.type, new TextStyle({
          fontSize: 10,
          fill: 0xffffff
        }));
        effectText.x = effectX + 2;
        effectText.y = effectY + 2;
        timeline.addChild(effectText);

        timeline.addChild(effectRect);
      });
    });
  };

  const getTrackIndex = (type: string): number => {
    const trackMap: Record<string, number> = {
      'video': 0,
      'audio': 1,
      'image': 2,
      'text': 3
    };
    return trackMap[type] || 0;
  };

  const getClipColor = (type: string): number => {
    const colorMap: Record<string, number> = {
      'video': 0xff6b35,
      'audio': 0x00d4aa,
      'image': 0x6366f1,
      'text': 0x8b5cf6
    };
    return colorMap[type] || 0x64748b;
  };

  const getEffectColor = (type: string): number => {
    const colorMap: Record<string, number> = {
      'filter': 0xf59e0b,
      'transition': 0x10b981,
      'text': 0x8b5cf6,
      'audio': 0x06b6d4
    };
    return colorMap[type] || 0x64748b;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  const handleTimelineClick = (event: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / (rect.width * zoom)) * duration;

    onTimeChange(Math.max(0, Math.min(time, duration)));
  };

  return (
    <div className={cn('video-timeline-editor', className)}>
      {/* Toolbar */}
      <div className="timeline-toolbar">
        <div className="timeline-controls">
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="timeline-btn"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={onStop}
            className="timeline-btn"
            title="Stop"
          >
            <StopIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="timeline-zoom">
          <button
            onClick={handleZoomOut}
            className="timeline-btn"
            title="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5" />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="timeline-btn"
            title="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="timeline-info">
          <ClockIcon className="w-4 h-4" />
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div
        ref={canvasRef}
        className="timeline-canvas"
        onClick={handleTimelineClick}
        style={{ height: '300px', cursor: 'crosshair' }}
      />

      {/* Clip Details Panel */}
      {selectedClip && (
        <div className="timeline-details">
          {(() => {
            const clip = videoClips.find(c => c.id === selectedClip);
            return clip ? (
              <div className="clip-details">
                <h4>{clip.name}</h4>
                <div className="clip-info">
                  <span>Type: {clip.type}</span>
                  <span>Duration: {formatTime(clip.duration)}</span>
                  <span>Start: {formatTime(clip.startTime)}</span>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};
