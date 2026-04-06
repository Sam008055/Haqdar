import jsQR from 'jsqr';
import sharp from 'sharp';

/**
 * Scans an image (base64) for QR codes.
 * Uses sharp (already bundled with Next.js) + jsQR.
 * 100% local — no API calls, no internet, no cost.
 */
export async function detectQRCode(base64Data: string): Promise<{ found: boolean; data: string | null }> {
  try {
    console.log('[HaqDar QR] Scanning image for QR codes...');
    
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Use sharp to get raw RGBA pixel data
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const imageData = new Uint8ClampedArray(data.buffer);
    
    const qrResult = jsQR(imageData, info.width, info.height);
    
    if (qrResult && qrResult.data) {
      console.log(`[HaqDar QR] ✅ QR Code DETECTED! Data: "${qrResult.data.slice(0, 200)}"`);
      return { found: true, data: qrResult.data };
    }
    
    console.log('[HaqDar QR] ❌ No QR code found in image.');
    return { found: false, data: null };
  } catch (e: any) {
    console.warn(`[HaqDar QR] Scanner error: ${e?.message?.slice(0, 100)}`);
    return { found: false, data: null };
  }
}
