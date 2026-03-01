"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageComparisonProps {
  before: string;
  after: string;
  className?: string;
  beforeOverlay?: React.ReactNode;
  afterOverlay?: React.ReactNode;
}

/**
 * ImageComparison - A cinematic interactive slider to compare Before and After images.
 * Now supports clipped overlays for state-specific metadata.
 */
export function ImageComparison({ before, after, className, beforeOverlay, afterOverlay }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden select-none touch-none cursor-ew-resize group",
        className
      )}
      onMouseMove={(e) => isDragging && handleMove(e)}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={handleMove}
      onClick={handleMove}
    >
      {/* After Image (Base Layer - Resolved) */}
      <div className="absolute inset-0">
        <Image
          src={after}
          alt="Resolved state"
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        
        {/* Fixed Label: Resolved */}
        <div className="absolute top-4 right-4 z-30 pointer-events-none text-right">
          <span className="bg-emerald-600/80 backdrop-blur-xl text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-widest shadow-2xl">
            Resolved
          </span>
        </div>
        
        {/* Dynamic Overlay: Resolved State (e.g. checkmark) */}
        {afterOverlay}
      </div>

      {/* Before Image (Overlay Layer - Initial State with Clip Path) */}
      <div
        className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={before}
          alt="Original issue state"
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        
        {/* Fixed Label: Initial State */}
        <div className="absolute top-4 left-4 z-30 pointer-events-none">
          <span className="bg-slate-950/80 backdrop-blur-xl text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-widest shadow-2xl">
            Initial State
          </span>
        </div>

        {/* Dynamic Overlay: Initial State (e.g. severity text) */}
        {beforeOverlay}
      </div>

      {/* Slider Handle Line */}
      <div
        className="absolute inset-y-0 z-20 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none transition-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Technical Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-4 border-indigo-600 shadow-[0_0_30px_rgba(0,0,0,0.3)] flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-indigo-600 rounded-full" />
            <div className="w-1 h-4 bg-indigo-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
