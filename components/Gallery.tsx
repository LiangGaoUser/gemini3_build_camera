import React from 'react';
import { Photo } from '../types';
import Polaroid from './Polaroid';

interface GalleryProps {
  photos: Photo[];
  onDelete: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ photos, onDelete }) => {
  if (photos.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-gray-400 font-hand text-xl opacity-60 border-2 border-dashed border-gray-300 rounded-xl m-4 bg-white/30">
        Capture a moment to see it here...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-10 px-4 md:px-10">
      <div className="flex flex-nowrap gap-4 min-w-min">
        {[...photos].reverse().map((photo) => (
          <Polaroid key={photo.id} photo={photo} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

export default Gallery;
