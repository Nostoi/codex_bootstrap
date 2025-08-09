/**
 * CDN Asset Management Service
 * Handles optimization and delivery of static assets for ADHD-friendly performance
 */

export class CDNAssetManager {
  private static readonly CDN_DOMAIN = process.env.CDN_DOMAIN || 'cdn.codex-bootstrap.com';
  private static readonly FALLBACK_ENABLED = true;

  /**
   * Get optimized asset URL with CDN and fallback support
   */
  static getAssetUrl(
    assetPath: string,
    options: {
      quality?: number;
      width?: number;
      format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
      priority?: boolean;
    } = {}
  ): string {
    const { quality = 85, width, format = 'auto', priority = false } = options;

    // For development, use local assets
    if (process.env.NODE_ENV === 'development') {
      return assetPath;
    }

    try {
      const params = new URLSearchParams();
      params.set('url', assetPath);

      if (width) params.set('w', width.toString());
      params.set('q', quality.toString());
      params.set('f', format);

      // ADHD optimization flags
      params.set('progressive', 'true');
      if (priority) params.set('priority', 'true');

      const cdnUrl = `https://${this.CDN_DOMAIN}/assets?${params}`;

      // Return CDN URL with fallback
      return this.FALLBACK_ENABLED ? this.wrapWithFallback(cdnUrl, assetPath) : cdnUrl;
    } catch (error) {
      console.warn('CDN URL generation failed, using original asset:', error);
      return assetPath;
    }
  }

  /**
   * Get font URL with optimal caching
   */
  static getFontUrl(fontPath: string): string {
    if (process.env.NODE_ENV === 'development') {
      return fontPath;
    }

    const params = new URLSearchParams({
      url: fontPath,
      cache: '31536000', // 1 year cache
      immutable: 'true',
    });

    return `https://${this.CDN_DOMAIN}/fonts?${params}`;
  }

  /**
   * Get critical CSS with inline optimization
   */
  static getCriticalCSSUrl(cssPath: string, inline = false): string {
    if (process.env.NODE_ENV === 'development') {
      return cssPath;
    }

    const params = new URLSearchParams({
      url: cssPath,
      inline: inline.toString(),
      minify: 'true',
      critical: 'true',
    });

    return `https://${this.CDN_DOMAIN}/css?${params}`;
  }

  /**
   * Preload critical assets for ADHD-optimized loading
   */
  static getCriticalAssetPreloads(): Array<{
    href: string;
    rel: string;
    as?: string;
    type?: string;
    crossorigin?: string;
  }> {
    const criticalAssets = [
      // Critical fonts
      {
        href: this.getFontUrl('/fonts/inter-var.woff2'),
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
      // Critical CSS
      {
        href: this.getCriticalCSSUrl('/styles/critical.css'),
        rel: 'preload',
        as: 'style',
      },
    ];

    return criticalAssets;
  }

  /**
   * Wrap CDN URL with fallback mechanism
   */
  private static wrapWithFallback(cdnUrl: string, fallbackUrl: string): string {
    // In a real implementation, this would return a URL that handles fallback logic
    // For now, we'll return the CDN URL and handle fallback in the client
    return cdnUrl;
  }

  /**
   * Get performance-optimized image srcset for responsive images
   */
  static getResponsiveImageSrcSet(
    imagePath: string,
    sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
  ): string {
    return sizes.map(size => `${this.getAssetUrl(imagePath, { width: size })} ${size}w`).join(', ');
  }

  /**
   * Generate ADHD-optimized loading strategy
   */
  static getLoadingStrategy(assetType: 'image' | 'font' | 'script' | 'style', priority = false) {
    const strategies = {
      image: {
        loading: priority ? 'eager' : 'lazy',
        decoding: 'async',
        fetchpriority: priority ? 'high' : 'auto',
      },
      font: {
        display: 'swap', // Prevent FOIT (Flash of Invisible Text)
        fetchpriority: priority ? 'high' : 'auto',
      },
      script: {
        loading: priority ? 'eager' : 'defer',
        fetchpriority: priority ? 'high' : 'auto',
      },
      style: {
        media: priority ? 'all' : 'print',
        onload: priority ? undefined : "this.media='all'",
      },
    };

    return strategies[assetType] || {};
  }
}
