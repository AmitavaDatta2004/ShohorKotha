
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, RefreshCw, X, Check, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
                description: "Could not access the camera. Please check permissions.",
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
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-fullscreen p-0 gap-0 border-0 z-[2000]">
        <DialogHeader className="sr-only">
          <DialogTitle>Camera</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-screen bg-black flex items-center justify-center">
          <canvas ref={canvasRef} className="absolute -top-[9999px] -left-[9999px]" />

          <div className="absolute top-4 left-4 z-20">
            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white">
              <ArrowLeft />
            </Button>
          </div>

          {!capturedImage ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <div className="absolute bottom-6 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-around items-center z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-16 h-16 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={handleFlipCamera}
                >
                  <RefreshCw className="w-8 h-8" />
                </Button>
                <button
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Capture photo"
                  onClick={handleCapture}
                />
                <div className="w-16 h-16" />
              </div>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              <div className="absolute bottom-6 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-around items-center z-10">
                <Button 
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-destructive/80 text-white hover:bg-destructive"
                  onClick={handleRetake}
                >
                  <X className="w-8 h-8"/>
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  className="w-16 h-16 rounded-full bg-green-600/80 text-white hover:bg-green-600"
                  onClick={handleConfirm}
                >
                  <Check className="w-8 h-8"/>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
