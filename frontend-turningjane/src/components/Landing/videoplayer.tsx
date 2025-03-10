import { onMount, createSignal } from "solid-js";

// Add TypeScript interface for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoBackground = () => {
  const [playerRef, setPlayerRef] = createSignal<HTMLDivElement | undefined>();

  onMount(() => {
    // Add YouTube iframe API correctly
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize YouTube player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (!playerRef()) return;
      
      new window.YT.Player(playerRef(), {
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
          modestbranding: 1
        },
        events: {
          onReady: (event: { target: { playVideo: () => void; }; }) => {
            event.target.playVideo();
          }
        }
      });
    };
  });

  return (
    <div class="relative h-screen w-screen overflow-hidden">
      {/* Video container */}
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="relative w-full h-full">
          {/* Use a div instead of iframe for the YouTube player to initialize in */}
          <div
            ref={setPlayerRef}
            class="absolute top-0 left-0 w-full h-full"
            id="youtube-player"
          />
        </div>
      </div>
      
      {/* Overlay to darken video and add text */}
      <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center">
        <h1 class="text-white text-7xl font-bold tracking-wider">
          .TurningJane
        </h1>
      </div>
    </div>
  );
};

export default VideoBackground;