import { Component, createSignal, For } from "solid-js";
import { Motion } from "@motionone/solid";

const Gallery: Component = () => {
  const [selectedImage, setSelectedImage] = createSignal<string | null>(null);
  const [isLoaded, setIsLoaded] = createSignal(false);

  const images = [
    { src: "https://cdn.creatureandcoagency.com/uploads/2020/04/Save-the-savannah-2.jpg", alt: "Savannah wildlife 1", gridClass: "div1" },
    { src: "https://cdn.creatureandcoagency.com/uploads/2020/04/Save-the-savannah-5.jpg", alt: "Savannah wildlife 2", gridClass: "div2" },
    { src: "https://www.science.org/do/10.1126/science.aaz0250/abs/friendship_1280p.jpg", alt: "Wildlife friendship", gridClass: "div3" },
    { src: "https://i.natgeofe.com/n/d1bd9b23-ed52-4e8c-abb5-049fbe13ac9d/NationalGeographic_2431674_square.jpg", alt: "National Geographic wildlife", gridClass: "div4" },
    { src: "https://i.ytimg.com/vi/2KkGev-JVIo/maxresdefault.jpg", alt: "Safari animals", gridClass: "div5" },
  ];

  setTimeout(() => setIsLoaded(true), 100);

  const openLightbox = (src: string) => {
    setSelectedImage(src);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = "auto";
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden">
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
          animate={{ opacity: isLoaded() ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          class="gallery-grid"
        >
          <For each={images}>
            {(image, index) => (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index() * 0.1, duration: 0.4 }}
                class={`group relative overflow-hidden rounded-lg cursor-pointer ${image.gridClass}`}
                onClick={() => openLightbox(image.src)}
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 z-10">
                  <p class="text-white font-medium truncate text-sm sm:text-base">{image.alt}</p>
                </div>
                <img
                  src={image.src}
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