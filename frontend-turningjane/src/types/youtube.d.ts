interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
  
  declare namespace YT {
    class Player {
      constructor(element: HTMLElement | string, options: PlayerOptions);
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead?: boolean): void;
      getPlayerState(): number;
      getCurrentTime(): number;
      getDuration(): number;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      getVolume(): number;
    }
  
    interface PlayerOptions {
      videoId: string;
      width?: number | string;
      height?: number | string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        showinfo?: 0 | 1;
        mute?: 0 | 1;
        loop?: 0 | 1;
        playlist?: string;
        start?: number;
        end?: number;
        rel?: 0 | 1;
        modestbranding?: 0 | 1;
        iv_load_policy?: 1 | 3;
        fs?: 0 | 1;
        disablekb?: 0 | 1;
        title?: 0 | 1;
        cc_load_policy?: 0 | 1;
        playsinline?: 0 | 1;
        enablejsapi?: 0 | 1;
        origin?: string;
      };
      events?: {
        onReady?: (event: { target: Player }) => void;
        onStateChange?: (event: { data: number; target: Player }) => void;
        onPlaybackQualityChange?: (event: { quality: string; target: Player }) => void;
        onError?: (event: { data: number; target: Player }) => void;
      };
    }
  
    // Player state constants
    const PlayerState: {
      UNSTARTED: -1;
      ENDED: 0;
      PLAYING: 1;
      PAUSED: 2;
      BUFFERING: 3;
      CUED: 5;
    };
  }