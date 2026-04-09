export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function resizeIfLarge(dataUrl: string, maxDim = 2048): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise(r => (img.onload = r));

  if (img.width <= maxDim && img.height <= maxDim) return dataUrl;

  const canvas = document.createElement('canvas');
  const scale = maxDim / Math.max(img.width, img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
