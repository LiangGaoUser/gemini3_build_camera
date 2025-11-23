import React, { useState } from 'react';
import { Photo } from '../types';
import { Download, Trash2, RotateCw } from 'lucide-react';

interface PolaroidProps {
  photo: Photo;
  onDelete: (id: string) => void;
}

const Polaroid: React.FC<PolaroidProps> = ({ photo, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // 1. Setup Canvas with high resolution (4x standard display size for quality)
      // Display size reference: w-64 (256px) x h-80 (320px)
      const scale = 4;
      const width = 256 * scale;  // 1024px
      const height = 320 * scale; // 1280px
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not create canvas context");

      // 2. Draw Polaroid Paper Background (White)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 3. Define Layout Metrics (based on CSS padding)
      // p-3 (12px) sides/top, pb-16 (64px) bottom
      const padX = 12 * scale;
      const padTop = 12 * scale;
      const padBottom = 64 * scale;
      
      const imgAreaW = width - (padX * 2);
      const imgAreaH = height - padTop - padBottom;

      // 4. Load Image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photo.dataUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 5. Calculate "Object-Cover" cropping
      const srcAspect = img.width / img.height;
      const destAspect = imgAreaW / imgAreaH;

      let drawX, drawY, drawW, drawH;

      if (srcAspect > destAspect) {
        // Source is wider: fill height, crop width
        drawH = imgAreaH;
        drawW = imgAreaH * srcAspect;
        drawX = padX + (imgAreaW - drawW) / 2;
        drawY = padTop;
      } else {
        // Source is taller: fill width, crop height
        drawW = imgAreaW;
        drawH = imgAreaW / srcAspect;
        drawX = padX;
        drawY = padTop + (imgAreaH - drawH) / 2;
      }

      // 6. Draw Image with Filters & Clipping
      ctx.save();
      
      // Clip to inner photo area
      ctx.beginPath();
      ctx.rect(padX, padTop, imgAreaW, imgAreaH);
      ctx.clip();

      // Draw dark background behind image (like CSS bg-gray-900)
      ctx.fillStyle = '#111827';
      ctx.fillRect(padX, padTop, imgAreaW, imgAreaH);

      // Apply vintage filter effect matches CSS: contrast-110 sepia-[0.2]
      ctx.filter = 'contrast(1.1) sepia(0.2)';
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      
      // Draw Inner Vignette (Shadow)
      ctx.filter = 'none';
      const gradient = ctx.createRadialGradient(
        width / 2, padTop + imgAreaH / 2, imgAreaW * 0.3,
        width / 2, padTop + imgAreaH / 2, imgAreaW * 0.8
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(padX, padTop, imgAreaW, imgAreaH);

      ctx.restore();

      // 7. Draw Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#1f2937'; // gray-800

      // Caption
      const captionSize = 20 * scale; // text-xl
      ctx.font = `${captionSize}px "Gochi Hand", cursive`;
      
      // Position calculation: Image Bottom + Margin Top (mt-4 = 16px) + Cap height approx
      const textBlockStart = padTop + imgAreaH + (16 * scale);
      ctx.fillText(photo.caption, width / 2, textBlockStart + captionSize * 0.8);

      // Timestamp
      ctx.fillStyle = '#6b7280'; // gray-500
      const dateSize = 14 * scale; // text-sm
      ctx.font = `${dateSize}px "Gochi Hand", cursive`;
      // Margin top (mt-1 = 4px)
      ctx.fillText(photo.timestamp, width / 2, textBlockStart + captionSize + (4 * scale) + dateSize * 0.8);

      // 8. Trigger Download
      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = finalDataUrl;
      link.download = `retro-polaroid-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Download failed", err);
      alert("Could not generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Delete this memory?')) {
        onDelete(photo.id);
    }
  };

  return (
    <div 
      className="relative group w-64 h-80 flex-shrink-0 cursor-pointer perspective-1000 mx-2"
      style={{ transform: `rotate(${photo.rotation}deg)` }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full bg-white p-3 pb-16 shadow-lg backface-hidden flex flex-col items-center">
            {/* Dark inner background for photo */}
            <div className="w-full aspect-[4/5] bg-gray-900 overflow-hidden relative">
                <img src={photo.dataUrl} alt="Memory" className="w-full h-full object-cover filter contrast-110 sepia-[0.2]" />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
            </div>
            
            {/* Handwritten Caption Area */}
            <div className="mt-4 text-center">
                 <p className="font-hand text-xl text-gray-800 leading-none">{photo.caption}</p>
                 <p className="font-hand text-sm text-gray-500 mt-1">{photo.timestamp}</p>
            </div>

            {/* Hint Icon */}
            <div className="absolute right-2 top-1/2 translate-x-4 text-gray-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <RotateCw size={20} />
            </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 w-full h-full bg-gray-100 shadow-lg backface-hidden rotate-y-180 p-6 flex flex-col justify-between border-2 border-gray-200">
             <div className="text-center">
                <div className="font-hand text-gray-400 text-lg mb-2 transform -rotate-2">
                    Start a story...
                </div>
                <div className="w-full h-px bg-gray-300 mb-6"></div>
                <div className="w-full h-px bg-gray-300 mb-6"></div>
                <div className="w-full h-px bg-gray-300 mb-6"></div>
                <div className="w-full h-px bg-gray-300 mb-6"></div>
             </div>

             <div className="flex justify-between items-center mt-auto">
                <button 
                    onClick={handleDelete}
                    className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`flex items-center gap-2 px-4 py-2 bg-retro-pink text-white font-bold rounded-full text-sm shadow-md hover:bg-retro-pinkDark transition-colors ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                >
                    <Download size={16} />
                    {isDownloading ? 'SAVING...' : 'SAVE'}
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Polaroid;