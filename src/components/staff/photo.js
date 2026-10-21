// Turns a camera photo into a small JPEG with a proof label burned in
// ("RG-001 · Jalan Elmina 3 · Road Works Team A"), so it fits in browser storage (~100 KB).
const MAX_SIDE = 960;
const QUALITY = 0.72;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That file could not be opened as a photo.'));
    image.src = src;
  });
}

/** @param {File|string} source a photo File from the camera, or an image URL */
export async function makeProofPhoto(source, label) {
  if (source instanceof File && !source.type.startsWith('image/')) throw new Error('Choose a photo (JPG or PNG).');
  const url = source instanceof File ? URL.createObjectURL(source) : source;
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    // Proof label along the bottom edge.
    const bar = Math.max(28, Math.round(height * 0.075));
    ctx.fillStyle = 'rgba(20, 33, 61, 0.78)';
    ctx.fillRect(0, height - bar, width, bar);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.round(bar * 0.42)}px "IBM Plex Sans", "Segoe UI", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`✓ ${label}`, Math.round(bar * 0.4), height - bar / 2, width - bar * 0.8);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } finally {
    if (source instanceof File) URL.revokeObjectURL(url);
  }
}
