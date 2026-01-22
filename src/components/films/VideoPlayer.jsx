/**
 * ============================================================================
 * VIDEO PLAYER COMPONENT
 * ============================================================================
 *
 * A responsive video player that embeds Vimeo or YouTube videos.
 *
 * FEATURES:
 * - Supports both Vimeo and YouTube
 * - Responsive sizing (maintains 16:9 aspect ratio)
 * - Configurable autoplay, mute, and controls
 * - Accessible with proper title attribute
 *
 * USAGE:
 * <VideoPlayer
 *   url="https://player.vimeo.com/video/123456789"
 *   type="vimeo"
 *   title="My Film Title"
 * />
 *
 * URL FORMATS:
 * - Vimeo: https://player.vimeo.com/video/VIDEO_ID
 * - YouTube: https://www.youtube.com/embed/VIDEO_ID
 *
 * ============================================================================
 */

/**
 * VideoPlayer Component
 *
 * Embeds a video from Vimeo or YouTube in a responsive container.
 *
 * @param {Object} props - Component props
 * @param {string} props.url - The embed URL for the video
 * @param {string} props.type - Video platform: 'vimeo' or 'youtube'
 * @param {string} props.title - Title for accessibility (iframe title attribute)
 * @param {boolean} props.autoplay - Whether to autoplay the video (default: false)
 * @param {boolean} props.muted - Whether video starts muted (default: false)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} The video player
 */
function VideoPlayer({
  url,
  type = 'vimeo',
  title = 'Video',
  autoplay = false,
  muted = false,
  className = '',
}) {
  /**
   * Build the embed URL with parameters
   *
   * Vimeo and YouTube use different URL parameters for the same features.
   * This function adds the appropriate parameters based on the platform.
   */
  const getEmbedUrl = () => {
    // Create a URL object for easier parameter manipulation
    const embedUrl = new URL(url);

    if (type === 'vimeo') {
      // Vimeo parameters
      // autoplay=1 → start playing automatically
      // muted=1 → start with sound off (required for autoplay in most browsers)
      // title=0 → hide the video title overlay
      // byline=0 → hide the creator name
      // portrait=0 → hide the creator avatar
      if (autoplay) embedUrl.searchParams.set('autoplay', '1');
      if (muted) embedUrl.searchParams.set('muted', '1');
      embedUrl.searchParams.set('title', '0');
      embedUrl.searchParams.set('byline', '0');
      embedUrl.searchParams.set('portrait', '0');
    } else if (type === 'youtube') {
      // YouTube parameters
      // autoplay=1 → start playing automatically
      // mute=1 → start with sound off
      // rel=0 → don't show related videos from other channels at the end
      // modestbranding=1 → smaller YouTube logo
      if (autoplay) embedUrl.searchParams.set('autoplay', '1');
      if (muted) embedUrl.searchParams.set('mute', '1');
      embedUrl.searchParams.set('rel', '0');
      embedUrl.searchParams.set('modestbranding', '1');
    }

    return embedUrl.toString();
  };


  return (
    // Outer container - sets the responsive aspect ratio
    <div
      className={`
        relative                         /* Position context for iframe */
        w-full                           /* Full width of container */
        aspect-video                     /* 16:9 aspect ratio (Tailwind utility) */
        bg-black                         /* Black background while loading */
        overflow-hidden                  /* Hide any overflow */
        ${className}                     /* Additional classes */
      `}
    >
      {/*
        The iframe embeds the video player from the external service.

        Key attributes:
        - src: The embed URL with parameters
        - allow: Browser permissions for video playback features
        - allowFullScreen: Enables fullscreen button
        - title: Accessibility - describes the iframe content
      */}
      <iframe
        src={getEmbedUrl()}
        title={title}
        className="
          absolute                       /* Position absolutely within container */
          top-0                          /* Align to top */
          left-0                         /* Align to left */
          w-full                         /* Full width */
          h-full                         /* Full height */
          border-0                       /* No border */
        "
        // 'allow' specifies what the iframe can do
        // accelerometer, autoplay, etc. are features needed for video playback
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
          web-share
        "
        // Enable fullscreen functionality
        allowFullScreen
        // Loading attribute for performance
        // 'lazy' means the iframe won't load until it's close to the viewport
        loading="lazy"
      />
    </div>
  );
}

// Export for use in FilmDetail page
export default VideoPlayer;
