import React from 'react';

interface ImageUploaderProps {
  label?: string;
  // Standardizing to use arrays internally for display, but props can accept single for compat
  images?: { id: string; previewUrl: string }[]; 
  previewUrl?: string | null; // Backward compat for single image mode
  onFileSelect: (file: File) => void;
  onRemove?: (id: string) => void;
  onClear?: () => void;
  compact?: boolean;
  aspectRatio?: string;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  images = [],
  previewUrl, 
  onFileSelect, 
  onRemove,
  onClear,
  compact = false,
  aspectRatio,
  maxFiles = 1
}) => {
  
  // Normalize input to an array for rendering logic
  const displayImages = previewUrl 
    ? [{ id: 'single', previewUrl }] 
    : images;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  // Determine grid columns based on maxFiles or current count
  // If maxFiles is 1, we fill the space.
  // If maxFiles > 1, we use a flex layout to fit items.
  const isMulti = maxFiles > 1;

  // Default aspect ratios
  const dimensionClass = aspectRatio 
    ? `w-full ${aspectRatio}`
    : compact 
      ? 'aspect-square w-full' 
      : 'aspect-[3/4] w-full';

  return (
    <div className="flex flex-col gap-1.5 group">
      {label && (
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1 group-hover:text-zinc-300 transition-colors">
          {label}
        </span>
      )}

      {/* Main Container - Dark Mode Glass */}
      <div className={`relative ${dimensionClass} rounded-xl overflow-hidden bg-zinc-900/40 border border-white/5 shadow-sm transition-all duration-300 hover:border-white/10 hover:bg-zinc-800/40 hover:shadow-md backdrop-blur-md`}>
        
        <div className="w-full h-full flex">
          
          {displayImages.length > 0 ? (
            <div className={`w-full h-full ${isMulti ? 'flex' : ''}`}>
              {displayImages.map((img, index) => (
                <div 
                  key={img.id} 
                  className={`relative h-full border-r border-white/5 last:border-r-0 overflow-hidden group/item
                    ${isMulti ? 'flex-1 min-w-0' : 'w-full'}
                  `}
                >
                  <img 
                    src={img.previewUrl} 
                    alt="Upload" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" 
                  />
                  
                  {/* Remove Button */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      if (maxFiles === 1 && onClear) onClear();
                      else if (onRemove) onRemove(img.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-zinc-300 hover:bg-red-500/80 hover:text-white rounded-full shadow-sm opacity-0 group-hover/item:opacity-100 transition-all z-10 backdrop-blur-sm"
                    title="Remove"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add Button (If Multi and space available) */}
              {isMulti && displayImages.length < maxFiles && (
                <label className="flex-1 min-w-0 h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group/add">
                  <div className="w-6 h-6 rounded-full border border-zinc-700 text-zinc-600 flex items-center justify-center group-hover/add:border-zinc-500 group-hover/add:text-zinc-400 group-hover/add:bg-zinc-800 transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>
          ) : (
            /* Empty State */
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800/30 text-zinc-600 flex items-center justify-center mb-1 group-hover:border-zinc-500 group-hover:text-zinc-300 group-hover:bg-zinc-700 transition-all shadow-sm">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                 </svg>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}

          {/* Checked Indicator */}
          {displayImages.length > 0 && displayImages.length === maxFiles && (
             <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-lg pointer-events-none z-10">
               <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
               </svg>
             </div>
          )}
        </div>
      </div>
      
      {/* File Count Indicator */}
      {isMulti && displayImages.length > 0 && (
         <div className="flex justify-end px-1">
           <span className="text-[9px] font-medium text-zinc-500 tracking-tight">
             {displayImages.length}/{maxFiles}
           </span>
         </div>
      )}
    </div>
  );
};