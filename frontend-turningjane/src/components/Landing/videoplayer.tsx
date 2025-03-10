import { onMount, createSignal } from "solid-js";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoBackground = () => {
  const [playerRef, setPlayerRef] = createSignal<HTMLDivElement | undefined>();

  onMount(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const playerElement = playerRef();
      if (!playerElement) return;
      
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
            onReady: (event: { target: YT.Player }) => {
              event.target.playVideo();
              
              // Make video fill container while maintaining aspect ratio
              const updateSize = () => {
                const container = playerElement.parentElement;
                if (container) {
                  const width = container.clientWidth;
                  const height = container.clientHeight;
                  const aspectRatio = 16/9;
                  
                  let newWidth = width;
                  let newHeight = width / aspectRatio;
                  
                  if (newHeight < height) {
                    newHeight = height;
                    newWidth = height * aspectRatio;
                  }
                  
                  // Instead of using setSize which doesn't exist according to the type definitions,
                  // we'll modify the iframe element directly
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
              
              updateSize();
              window.addEventListener('resize', updateSize);
            },
            onStateChange: (event: { data: number; target: YT.Player }) => {
              // Restart video if it ends
              if (event.data === YT.PlayerState.ENDED) { // Using the constant instead of 0
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
            class="absolute top-0 left-0 w-full h-full object-cover"
            id="youtube-player"
          />
        </div>
      </div>
      
      {/* Overlay to darken video and add text */}
      <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center">
        <h1 class="text-white text-7xl font-bold tracking-wider" style="font-family: 'Bebas Neue', sans-serif;">
          .TurningJane
        </h1>
      </div>
    </div>
  );
};

export default VideoBackground;