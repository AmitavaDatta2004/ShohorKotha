
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, RefreshCw, X, Check, ArrowLeft, Scan, Crosshair, Cpu, Activity, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (dataUri: string) => void;
}

export default function CameraModal({ open, onOpenChange, onPhotoCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startStream = async () => {
      if (capturedImage || !open) return;
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: facingMode } }
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
         try {
            currentStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(currentStream);
            if (videoRef.current) {
                videoRef.current.srcObject = currentStream;
            }
        } catch (error) {
             console.error("Error accessing camera:", error);
            toast({
                variant: 'destructive',
                title: "Camera Error",
                description: "Could not access the camera. Please check your browser permissions.",
            });
            onOpenChange(false);
        }
      }
    };

    if (open && !capturedImage) {
      startStream();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
       if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, capturedImage, facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
      }
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onInteractOutside={(e) => e.preventDefault()} 
        className="max-w-none w-screen h-[100dvh] p-0 gap-0 border-0 z-[2000] overflow-hidden bg-slate-950 flex flex-col items-center justify-center translate-x-0 translate-y-0 left-0 top-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Camera View</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Neural Grid Overlay */}
          <div className="absolute inset-0 neural-grid opacity-10 pointer-events-none z-10"></div>
          
          {/* Animated Scan Line */}
          {!capturedImage && (
            <div className="absolute w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-scan z-20 pointer-events-none opacity-40"></div>
          )}

          {/* HUD Frame Corners */}
          <div className="absolute inset-0 z-20 pointer-events-none p-4 md:p-12">
            <div className="w-full h-full relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-xl"></div>
              
              {/* HUD Labels */}
              <div className="absolute top-4 left-4 md:left-12 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 font-mono">Camera Active</span>
              </div>
              
              <div className="absolute bottom-4 right-4 md:right-12 flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 font-mono mb-1">Focus Ready</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 font-mono">Stabilized View</span>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="absolute -top-[9999px] -left-[9999px]" />

          <div className="absolute top-6 left-6 z-30">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose} 
              className="rounded-2xl h-12 w-12 md:h-14 md:w-14 bg-white/5 border border-white/10 backdrop-blur-xl text-white hover:bg-white/10 transition-all shadow-2xl"
            >
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </div>

          {!capturedImage ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" autoPlay muted playsInline />
              
              {/* HUD Targeting Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="relative h-40 w-40 md:h-48 md:w-48 border-2 border-white/10 rounded-full flex items-center justify-center">
                  <Crosshair className="h-10 w-10 md:h-12 md:w-12 text-white/20" />
                  <div className="absolute -inset-4 border border-indigo-500/20 rounded-full animate-ping [animation-duration:4s]"></div>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 right-0 p-6 flex justify-around items-center z-30">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-white hover:bg-white/10 hover:text-indigo-400 transition-all"
                  onClick={handleFlipCamera}
                >
                  <RefreshCw className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
                
                <button
                  className="group relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
                  aria-label="Capture photo"
                  onClick={handleCapture}
                >
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition-all"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white bg-white/10 backdrop-blur-md group-hover:scale-95 group-active:scale-90 transition-all flex items-center justify-center shadow-2xl">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                  </div>
                </button>

                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md flex items-center justify-center opacity-40">
                  <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              
              <div className="absolute inset-0 bg-indigo-600/5 mix-blend-overlay z-20 pointer-events-none"></div>

              <div className="absolute bottom-16 md:bottom-12 left-0 right-0 p-6 md:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center z-30">
                <Button 
                  onClick={handleRetake}
                  className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl bg-slate-900 border-2 border-white/10 text-white font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl group text-xs md:text-sm"
                >
                  <X className="mr-3 h-5 w-5 md:h-6 md:w-6 text-red-500 group-hover:rotate-90 transition-transform" />
                  Retake
                </Button>
                
                <Button 
                  onClick={handleConfirm}
                  className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 shadow-[0_0_30px_rgba(79,70,229,0.4)] group text-xs md:text-sm"
                >
                  <Check className="mr-3 h-5 w-5 md:h-6 md:w-6 text-emerald-400 group-hover:scale-125 transition-transform" />
                  Use Photo
                </Button>
              </div>
              
              {/* Captured Metadata HUD */}
              <div className="absolute top-24 right-6 md:right-12 z-30 space-y-4 text-right">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Captured Status</p>
                  <p className="text-lg md:text-xl font-black text-white italic uppercase">Success</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Image ID</p>
                  <p className="text-xs md:text-sm font-bold text-white font-mono">#{Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
