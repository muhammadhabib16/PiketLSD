/**
 * Utility to compress image dataURL while strictly preserving the original aspect ratio
 * (anti-melar / anti-gepeng) using high-precision Canvas rendering.
 *
 * @param {string} dataUrl - Source image data URL or base64 string
 * @param {Object} options - Configuration options
 * @param {number} [options.maxDimension=960] - Maximum width or height in px (HD quality)
 * @param {number} [options.quality=0.80] - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<{ dataUrl: string, base64: string, width: number, height: number, estimatedKb: number }>}
 */
export async function compressImageAspectRatio(dataUrl, options = {}) {
  const { maxDimension = 960, quality = 0.80 } = options;

  if (!dataUrl) {
    throw new Error('Data gambar tidak valid untuk dikompres.');
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        if (!originalWidth || !originalHeight) {
          // If dimensions are missing, fallback gracefully
          const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          return resolve({
            dataUrl,
            base64: rawBase64,
            width: 0,
            height: 0,
            estimatedKb: Math.round((rawBase64.length * 0.75) / 1024)
          });
        }

        // Calculate proportional scale strictly preserving aspect ratio
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          if (originalWidth >= originalHeight) {
            // Landscape or square orientation
            targetWidth = maxDimension;
            targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
          } else {
            // Portrait orientation (typical mobile selfies)
            targetHeight = maxDimension;
            targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          return resolve({
            dataUrl,
            base64: rawBase64,
            width: originalWidth,
            height: originalHeight,
            estimatedKb: Math.round((rawBase64.length * 0.75) / 1024)
          });
        }

        // Apply high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill white background to prevent transparent pixel artifacts in JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw image keeping exact 1:1 proportional aspect ratio
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = compressedDataUrl.includes(',')
          ? compressedDataUrl.split(',')[1]
          : compressedDataUrl;

        const estimatedKb = Math.round((base64.length * 0.75) / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          base64,
          width: targetWidth,
          height: targetHeight,
          estimatedKb
        });
      } catch (err) {
        console.warn('Kompresi gambar gagal, menggunakan data asli:', err);
        const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve({
          dataUrl,
          base64: rawBase64,
          width: 0,
          height: 0,
          estimatedKb: Math.round((rawBase64.length * 0.75) / 1024)
        });
      }
    };

    img.onerror = () => {
      console.warn('Gagal memuat gambar ke elemen Image untuk kompresi.');
      const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve({
        dataUrl,
        base64: rawBase64,
        width: 0,
        height: 0,
        estimatedKb: Math.round((rawBase64.length * 0.75) / 1024)
      });
    };

    img.src = dataUrl;
  });
}
