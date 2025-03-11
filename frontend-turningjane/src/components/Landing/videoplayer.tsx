import { onMount, createSignal } from "solid-js";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoBackground = () => {
  const [playerRef, setPlayerRef] = createSignal<HTMLDivElement | undefined>();

  onMount(() => {
    // Load Google Font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const playerElement = playerRef();
      if (!playerElement) return;

      // Initialize YouTube player
      new window.YT.Player(playerElement, {
        videoId: 'hTWKbfoikeg',
        playerVars: {
          autoplay: 1,
          controls: 0,
          showinfo: 0,
          mute: 1,
          loop: 1,
          playlist: 'hTWKbfoikeg',
          start: 56,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          cc_load_policy: 0,
          playsinline: 1,
          enablejsapi: 1
        },
        events: {
          onReady: (event: { target: any }) => {
            event.target.playVideo();

            // Responsive video sizing function
            const updateSize = () => {
              const container = playerElement.parentElement;
              if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                const aspectRatio = 16 / 9;

                let newWidth = width;
                let newHeight = width / aspectRatio;

                if (newHeight < height) {
                  newHeight = height;
                  newWidth = height * aspectRatio;
                }

                // Update iframe dimensions and position
                const iframe = playerElement.querySelector('iframe');
                if (iframe) {
                  iframe.style.width = `${newWidth}px`;
                  iframe.style.height = `${newHeight}px`;
                  iframe.style.position = 'absolute';
                  iframe.style.left = `${(width - newWidth) / 2}px`;
                  iframe.style.top = `${(height - newHeight) / 2}px`;
                }
              }
            };

            // Initial size update
            updateSize();

            // Update size on window resize
            window.addEventListener('resize', updateSize);
          },
          onStateChange: (event: { data: number; target: any }) => {
            // Restart video if it ends
            if (event.data === window.YT.PlayerState.ENDED) {
              event.target.seekTo(56);
              event.target.playVideo();
            }
          }
        }
      });
    };
  });

  return (
    <div class="relative h-screen w-screen overflow-hidden">
      {/* Video container */}
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div class="relative w-full h-full">
          <div
            ref={setPlayerRef}
            class="absolute top-0 left-0 w-full h-full"
            id="youtube-player"
          />
        </div>
      </div>

      {/* Overlay with responsive text */}
      <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40 flex flex-col items-center justify-center p-4">
        <h1
          class="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider text-center"
          style="font-family: 'Bebas Neue', sans-serif;"
        >
          .TurningJane
        </h1>
      </div>
    </div>
  );
};

export default VideoBackground;