interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
  
  declare namespace YT {
    class Player {
      constructor(element: HTMLElement | string, options: PlayerOptions);
      playVideo(): void;
    }
  
    interface PlayerOptions {
      videoId: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        showinfo?: 0 | 1;
        mute?: 0 | 1;
        loop?: 0 | 1;
        playlist?: string;
        start?: number;
        rel?: 0 | 1;
        modestbranding?: 0 | 1;
      };
      events?: {
        onReady?: (event: { target: Player }) => void;
      };
    }
  }