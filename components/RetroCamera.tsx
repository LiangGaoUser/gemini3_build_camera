import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface RetroCameraProps {
  onCapture: (dataUrl: string) => void;
}

const RetroCamera: React.FC<RetroCameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [shutterPressed, setShutterPressed] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // Printing animation state
  const [printingPhoto, setPrintingPhoto] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          aspectRatio: 1,
        },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please verify permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isPrinting) return;

    setShutterPressed(true);
    setTimeout(() => setShutterPressed(false), 150);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300); // Flash duration

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;

      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      context.save();
      if (facingMode === 'user') {
        context.translate(size, 0);
        context.scale(-1, 1);
      }
      // Draw video
      context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      
      // Vintage Filter
      // 1. Warm overlay
      context.fillStyle = 'rgba(255, 240, 200, 0.15)'; 
      context.globalCompositeOperation = 'overlay';
      context.fillRect(0, 0, size, size);
      
      // 2. Soft contrast/vignette
      const gradient = context.createRadialGradient(size/2, size/2, size/3, size/2, size/2, size);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);

      context.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Start printing animation
      setPrintingPhoto(dataUrl);
      
      // Delay slightly to allow DOM render before triggering transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsPrinting(true);
        });
      });

      // Wait for animation to finish before adding to gallery
      setTimeout(() => {
        onCapture(dataUrl);
        setPrintingPhoto(null);
        setIsPrinting(false);
      }, 3500); // 3.5s total duration matching CSS
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="relative w-full max-w-[360px] mx-auto perspective-1000 select-none mb-20">
      {/* Main Camera Body - Added z-20 to sit on top of printing photo */}
      <div className="relative z-20 bg-[#Fdfdfd] rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4),inset_0_-4px_6px_rgba(0,0,0,0.1)] border border-gray-200 aspect-[4/5] flex flex-col items-center overflow-hidden transform transition-transform duration-300">
        
        {/* Top Section: Viewfinder & Flash */}
        <div className="w-full h-1/3 bg-[#f8f8f8] border-b border-gray-200 relative flex justify-between px-8 pt-6">
           
           {/* Flash Unit */}
           <div className="relative w-20 h-16 bg-gray-800 rounded-lg border-4 border-gray-300 overflow-hidden shadow-inner">
              {/* Flash texture */}
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-600 to-black bg-[length:4px_4px]"></div>
              {/* The Flash Burst */}
              <div className={`absolute inset-0 bg-white transition-opacity duration-75 ${isFlashing ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/20"></div>
           </div>

           {/* Viewfinder (Sensor) */}
           <div className="w-16 h-16 bg-[#1a1a1a] rounded-xl border-4 border-gray-300 shadow-inner flex items-center justify-center overflow-hidden">
              <div className="w-8 h-8 bg-[#0a0a0a] rounded-full shadow-[inset_0_0_5px_rgba(255,255,255,0.3)]"></div>
              <div className="absolute top-2 right-2 w-4 h-4 bg-white/10 rounded-full blur-sm"></div>
           </div>
        </div>

        {/* Rainbow Stripe - The Iconic Look */}
        <div className="absolute top-[33%] left-0 right-0 h-auto flex flex-col items-center justify-center z-0 py-4 pointer-events-none">
             <div className="w-2/3 h-12 flex flex-col shadow-sm opacity-90">
                 <div className="h-2 bg-[#FF545E]"></div> {/* Red */}
                 <div className="h-2 bg-[#FF9D47]"></div> {/* Orange */}
                 <div className="h-2 bg-[#FFD644]"></div> {/* Yellow */}
                 <div className="h-2 bg-[#58D661]"></div> {/* Green */}
                 <div className="h-2 bg-[#3F93E9]"></div> {/* Blue */}
             </div>
        </div>

        {/* Middle Section: The Lens (Video Feed) */}
        <div className="relative flex-1 w-full flex items-center justify-center z-10 -mt-6">
            
            {/* Outer Lens Ring */}
            <div className="relative w-64 h-64 rounded-full bg-[#2a2a2a] shadow-[0_10px_20px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center p-1">
                
                {/* Distance Ring Markings */}
                <div className="absolute inset-0 rounded-full border-2 border-[#444] opacity-30"></div>
                
                {/* Middle Gray Ring */}
                <div className="w-full h-full rounded-full bg-[#1a1a1a] border-[6px] border-[#3a3a3a] flex items-center justify-center overflow-hidden relative">
                    
                    {/* The Actual Camera Feed */}
                    <div className="w-48 h-48 rounded-full overflow-hidden relative bg-black border-4 border-black shadow-inner">
                       {error ? (
                           <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-2 bg-black">
                               {error}
                           </div>
                       ) : (
                           <>
                            <video 
                                ref={videoRef}
                                autoPlay 
                                playsInline 
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                           </>
                       )}
                       {/* Lens Glare overlay */}
                       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none rounded-full"></div>
                       <div className="absolute top-8 left-8 w-12 h-6 bg-white/20 blur-md rotate-[-45deg] rounded-full pointer-events-none"></div>
                    </div>

                    {/* Lens Text */}
                    <div className="absolute bottom-4 text-[8px] font-sans text-gray-400 tracking-widest opacity-60 font-bold uppercase">
                        116mm f/11
                    </div>
                </div>
            </div>

            {/* Red Shutter Button */}
            <button 
                onClick={handleCapture}
                disabled={isPrinting}
                className={`absolute right-6 bottom-8 w-16 h-16 rounded-full border-4 border-[#d1d5db] bg-[#e11d48] shadow-[0_4px_0_#9f1239,0_8px_10px_rgba(0,0,0,0.3)] transition-all ${shutterPressed ? 'translate-y-1 shadow-[0_2px_0_#9f1239,inset_0_2px_5px_rgba(0,0,0,0.4)]' : 'hover:bg-[#f43f5e]'} ${isPrinting ? 'opacity-50 cursor-not-allowed' : ''} z-30 flex items-center justify-center`}
                aria-label="Take Photo"
            >
                <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/30 to-transparent"></div>
            </button>

            {/* Camera Switch Button */}
            <button 
                onClick={toggleCamera}
                className="absolute left-8 bottom-10 w-10 h-10 rounded-full bg-gray-200 text-gray-600 shadow-md flex items-center justify-center active:scale-95 z-30 hover:bg-white border border-gray-300"
                aria-label="Switch Camera"
            >
                <RefreshCw size={16} />
            </button>
        </div>

        {/* Bottom Eject Slot */}
        <div className="w-full h-12 bg-[#222] mt-auto border-t-4 border-[#111] relative z-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-2 bg-[#000] rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
        </div>
        
        {/* Brand Label */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-gray-300 font-sans font-bold tracking-widest text-xs opacity-50">
            INSTANT CAM
        </div>

      </div>
      
      {/* Printing Animation Layer - Behind camera (z-10) */}
      {printingPhoto && (
        <div 
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 z-10 transition-transform duration-[3500ms] ease-linear will-change-transform ${isPrinting ? 'translate-y-[115%]' : 'translate-y-0'}`}
        >
           <div className="bg-white p-3 pb-8 shadow-2xl rounded-sm border border-gray-200">
               <div className="aspect-[4/5] bg-gray-900 relative overflow-hidden">
                    {/* Initially darker to simulate developing? Optional, keep it simple for now */}
                    <img src={printingPhoto} alt="Printing" className="w-full h-full object-cover animate-pulse" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
               </div>
               {/* Placeholder for text lines */}
               <div className="mt-2 space-y-1 opacity-30">
                  <div className="h-1 bg-gray-300 w-full rounded"></div>
               </div>
           </div>
        </div>
      )}
      
      {/* Strap Lugs */}
      <div className="absolute top-16 -left-2 w-4 h-10 bg-gray-300 rounded-l-md border border-gray-400 shadow-sm z-[-1]"></div>
      <div className="absolute top-16 -right-2 w-4 h-10 bg-gray-300 rounded-r-md border border-gray-400 shadow-sm z-[-1]"></div>

    </div>
  );
};

export default RetroCamera;