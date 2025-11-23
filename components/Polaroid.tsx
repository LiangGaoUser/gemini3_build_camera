import React, { useState } from 'react';
import { Photo } from '../types';
import { Download, Trash2, RotateCw } from 'lucide-react';

interface PolaroidProps {
  photo: Photo;
  onDelete: (id: string) => void;
}

const Polaroid: React.FC<PolaroidProps> = ({ photo, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `retro-cam-${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    className="flex items-center gap-2 px-4 py-2 bg-retro-pink text-white font-bold rounded-full text-sm shadow-md hover:bg-retro-pinkDark transition-colors"
                >
                    <Download size={16} />
                    SAVE
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Polaroid;
