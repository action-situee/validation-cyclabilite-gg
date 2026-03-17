/**
 * Compresse et redimensionne une image File en data URI JPEG.
 * Max 1200px côté le plus long, qualité JPEG 0.7.
 * Gère aussi la rotation EXIF via le support natif du navigateur.
 */
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;
const MAX_PHOTOS = 3;

export { MAX_PHOTOS };

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier n\'est pas une image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.onload = () => {
        // Calculate target dimensions
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          } else {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas non supporté'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG data URI
        const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(dataUri);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Estime la taille en KB d'une data URI base64.
 */
export function estimateBase64SizeKB(dataUri: string): number {
  // Remove header (data:image/jpeg;base64,)
  const base64 = dataUri.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
