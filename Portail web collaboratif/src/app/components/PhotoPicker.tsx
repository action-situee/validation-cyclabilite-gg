import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';
import { compressImage, estimateBase64SizeKB, MAX_PHOTOS } from '../utils/image';

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const canAdd = photos.length < MAX_PHOTOS;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      const remaining = MAX_PHOTOS - photos.length;
      const toProcess = Array.from(files).slice(0, remaining);
      const compressed: string[] = [];

      for (const file of toProcess) {
        const dataUri = await compressImage(file);
        const sizeKB = estimateBase64SizeKB(dataUri);
        if (sizeKB > 500) {
          console.warn(`Photo compressée à ${sizeKB}KB, conservée.`);
        }
        compressed.push(dataUri);
      }

      onChange([...photos, ...compressed]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du traitement');
    } finally {
      setLoading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.12em] text-[#5c5c5c] mb-2">
        Photos <span className="text-[#999] font-mono">{photos.length}/{MAX_PHOTOS}</span>
      </label>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="relative shrink-0 w-20 h-20 overflow-hidden border-2 border-[#0a0a0a] group cursor-pointer"
              onClick={() => setPreviewPhoto(photo)}
            >
              <img
                src={photo}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(i);
                }}
                className="absolute top-0 right-0 w-5 h-5 bg-[#0a0a0a] flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
                aria-label="Supprimer la photo"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a]/70 text-white text-[8px] text-center py-0.5 font-mono">
                {estimateBase64SizeKB(photo)} KB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {canAdd && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#2d6a4f]
                       text-[10px] uppercase tracking-wider text-[#2d6a4f] hover:bg-[#f0fdf4] hover:border-[#1b4332] transition-colors
                       active:translate-y-px disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Photo
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#999]
                       text-[10px] uppercase tracking-wider text-[#999] hover:bg-[#f0f0ec] hover:border-[#0a0a0a] transition-colors
                       active:translate-y-px disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            Galerie
          </button>
        </div>
      )}

      {error && (
        <p className="text-[10px] text-red-600 mt-1.5 uppercase tracking-wider">{error}</p>
      )}

      {loading && (
        <p className="text-[10px] text-[#2d6a4f] mt-1.5 flex items-center gap-1 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" />
          Compression...
        </p>
      )}

      {/* Full-screen preview modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 border-2 border-white/40 flex items-center justify-center
                       hover:bg-white/10 transition-colors"
            onClick={() => setPreviewPhoto(null)}
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewPhoto}
            alt="Aperçu"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}