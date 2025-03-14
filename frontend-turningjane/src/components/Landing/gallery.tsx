import { Component, createSignal, For, onMount } from "solid-js";
import { Motion } from "@motionone/solid";

// Function to convert image URL to WebP using a client-side approach
const convertToWebP = async (imageUrl: string): Promise<string> => {
  try {
    // Create a new Image object to load the original image
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS issues
    
    // Wait for the image to load
    const imageLoaded = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageUrl;
    });
    
    const loadedImg = await imageLoaded;
    
    // Create a canvas to draw the image
    const canvas = document.createElement("canvas");
    canvas.width = (loadedImg as HTMLImageElement).width;
    canvas.height = (loadedImg as HTMLImageElement).height;
    
    // Draw the image on the canvas
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(loadedImg as HTMLImageElement, 0, 0);
    
    // Convert the canvas content to WebP
    const webpData = canvas.toDataURL("image/webp", 0.8); // 0.8 quality is a good balance
    
    return webpData;
  } catch (error) {
    console.error("Error converting to WebP:", error);
    return imageUrl; // Fallback to original image URL if conversion fails
  }
};

const Gallery: Component = () => {
  const [selectedImage, setSelectedImage] = createSignal<string | null>(null);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [optimizedImages, setOptimizedImages] = createSignal<Array<{
    src: string;
    webpSrc: string;
    alt: string;
    gridClass: string;
    isWebpLoaded: boolean;
  }>>([]);

  const originalImages = [
    { src: "https://i.postimg.cc/XvBDhP7x/Screenshot-20250314-100212.png", alt: "Bassura Fest 2024", gridClass: "div1" },
    { src: "https://i.postimg.cc/NMwbnfnf/IMG-20241020-WA0006.jpg", alt: "Berisik #4", gridClass: "div2" },
    { src: "https://i.postimg.cc/Qdx26STn/Screenshot-20250314-095818.png", alt: "Opus Fest 2024", gridClass: "div3" },
    { src: "https://i.postimg.cc/cJc8sxHJ/IMG-6873.avif", alt: "Noisepitch Vol.2", gridClass: "div4" },
    { src: "https://i.postimg.cc/tC1PhGrr/Screenshot-20250314-100741.png", alt: "Gen.Z Area 2024", gridClass: "div5" },
  ];

  onMount(async () => {
    // Initialize with original images first
    setOptimizedImages(originalImages.map(img => ({ 
      ...img, 
      webpSrc: img.src,  // Initially set to original
      isWebpLoaded: false
    })));
    
    // Process images in the background
    const processImages = async () => {
      const processedImages = await Promise.all(
        originalImages.map(async (img) => {
          try {
            // Skip conversion for avif images as they're already optimized
            if (img.src.endsWith('.avif')) {
              return { 
                ...img, 
                webpSrc: img.src, 
                isWebpLoaded: true 
              };
            }
            
            const webpSrc = await convertToWebP(img.src);
            return { 
              ...img, 
              webpSrc, 
              isWebpLoaded: true 
            };
          } catch (error) {
            console.error(`Error processing image ${img.src}:`, error);
            return { 
              ...img, 
              webpSrc: img.src, 
              isWebpLoaded: false 
            };
          }
        })
      );
      
      setOptimizedImages(processedImages);
      setIsLoaded(true);
    };
    
    // Start processing images
    processImages();
  });

  const openLightbox = (src: string) => {
    // Always use the best quality image (original) for lightbox
    const originalSrc = optimizedImages().find(img => img.webpSrc === src)?.src || src;
    setSelectedImage(originalSrc);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  // Function to check if the browser supports WebP
  const isWebPSupported = (): boolean => {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return true;
    }
    return false;
  };

  return (
    <div class="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div class="relative h-48 sm:h-64 md:h-80 overflow-hidden">
        <div class="absolute inset-0 bg-black/60 z-10" />
        <div class="absolute inset-0 bg-cover bg-center" />
        <div class="absolute inset-0 flex items-center justify-center z-20 px-4">
          <Motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            class="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white tracking-wider uppercase drop-shadow-lg font-bebasneue text-center"
          >
            <span class="text-gray-400">.TurningJane</span> Gallery
          </Motion.h1>
        </div>
      </div>

      {/* Gallery Section with Custom Grid */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <style>
          {`
            /* Desktop Grid Layout */
            @media (min-width: 768px) {
              .gallery-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                grid-template-rows: repeat(6, 1fr);
                grid-column-gap: 8px;
                grid-row-gap: 8px;
                min-height: 80vh;
              }
              
              .div1 { grid-area: 1 / 1 / 5 / 3; }
              .div2 { grid-area: 5 / 1 / 7 / 3; }
              .div3 { grid-area: 1 / 3 / 7 / 5; }
              .div4 { grid-area: 1 / 5 / 4 / 7; }
              .div5 { grid-area: 4 / 5 / 7 / 7; }
            }
            
            /* Tablet Grid Layout */
            @media (min-width: 640px) and (max-width: 767px) {
              .gallery-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-auto-rows: minmax(180px, auto);
                gap: 8px;
              }
              
              .div3 {
                grid-column: span 2;
              }
            }
            
            /* Mobile Grid Layout */
            @media (max-width: 639px) {
              .gallery-grid {
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              
              .gallery-grid > div {
                height: 260px;
              }
            }
          `}
        </style>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          class="gallery-grid"
        >
          <For each={optimizedImages()}>
            {(image, index) => (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index() * 0.1, duration: 0.4 }}
                class={`group relative overflow-hidden rounded-lg cursor-pointer ${image.gridClass}`}
                onClick={() => openLightbox(image.webpSrc)}
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 z-10">
                  <p class="text-white font-medium truncate text-sm sm:text-base">{image.alt}</p>
                </div>
                <img
                  src={image.webpSrc}
                  alt={image.alt}
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </Motion.div>
            )}
          </For>
        </Motion.div>
      </div>

      {/* Lightbox - More Responsive */}
      {selectedImage() && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button 
            class="absolute top-2 right-2 sm:top-4 sm:right-4 text-white text-3xl p-2 z-10" 
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            &times;
          </button>
          <div class="max-w-full max-h-full relative">
            <img
              src={selectedImage()!}
              alt="Selected image"
              class="max-h-[80vh] sm:max-h-[85vh] md:max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </Motion.div>
      )}
    </div>
  );
};

export default Gallery;