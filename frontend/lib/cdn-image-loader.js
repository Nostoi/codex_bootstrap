/**
 * Custom image loader for CDN optimization
 * Supports ADHD-optimized image delivery with adaptive quality
 */

const CDN_DOMAIN = process.env.CDN_DOMAIN || 'cdn.codex-bootstrap.com';

export default function cdnImageLoader({ src, width, quality }) {
  // ADHD-optimized quality settings based on viewport
  const adhdQuality = quality || (width <= 640 ? 85 : width <= 1200 ? 80 : 75);

  // Construct CDN URL with optimization parameters
  const params = new URLSearchParams({
    url: src,
    w: width,
    q: adhdQuality,
    // Enable progressive loading for focus-friendly experience
    progressive: 'true',
    // Optimize for fast perceived loading
    placeholder: 'blur',
    // Auto-format for best compression
    auto: 'format,compress',
  });

  return `https://${CDN_DOMAIN}/image?${params}`;
}
