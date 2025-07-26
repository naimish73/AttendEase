
"use client";

import { useState, useRef, useEffect, type FC } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, Repeat } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCapture: FC<CameraCaptureProps> = ({ onCapture }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const enableStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions in your browser settings.",
          });
        }
    };

    if (isDialogOpen && !capturedImage) {
      enableStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isDialogOpen, capturedImage, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png");
        setCapturedImage(imageDataUrl);

        // Stop the stream after capture
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      toast({
        title: "Photo Captured!",
        description: "The new profile photo has been set.",
      })
      handleOpenChange(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset states when dialog is closed
      setCapturedImage(null);
      setHasCameraPermission(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Capture Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>

        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access in your browser to use this feature.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="relative">
            {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-md" />
            ) : (
                <video 
                    ref={videoRef} 
                    className="w-full aspect-video rounded-md bg-muted" 
                    autoPlay 
                    muted 
                    playsInline 
                />
            )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="mt-4">
          {capturedImage ? (
            <div className="flex w-full justify-between">
              <Button onClick={handleRetake} variant="outline">
                <Repeat className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" />
                Confirm Photo
              </Button>
            </div>
          ) : (
            <>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                Capture
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
