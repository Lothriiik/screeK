import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryProps {
    images: string[];
    variant?: 'grid' | 'carousel';
    columns?: 2 | 3 | 4;
}

export function Gallery({ images, variant = 'grid', columns = 3 }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (variant === 'carousel') {
        return <Carousel images={images} />;
    }

    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };

    return (
        <>
            <div className={`grid ${gridCols[columns]} gap-4`}>
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="aspect-video border-4 border-white/10 overflow-hidden cursor-pointer hover:border-primary-400 transition-colors group"
                        onClick={() => setSelectedImage(image)}
                    >
                        <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-6xl w-full">
                        <button
                            className="absolute top-4 right-4 w-12 h-12 border-4 border-white/20 hover:border-primary-400 flex items-center justify-center font-black text-2xl transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            ×
                        </button>
                        <img
                            src={selectedImage}
                            alt="Selected"
                            className="w-full h-auto border-4 border-primary-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

interface CarouselProps {
    images: string[];
    autoPlay?: boolean;
    interval?: number;
}

export function Carousel({ images, autoPlay = false, interval = 3000 }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    // Auto-play effect
    useState(() => {
        if (autoPlay) {
            const timer = setInterval(goToNext, interval);
            return () => clearInterval(timer);
        }
    });

    return (
        <div className="relative w-full">
            {/* Main Image */}
            <div className="aspect-video border-4 border-white/10 overflow-hidden">
                <img
                    src={images[currentIndex]}
                    alt={`Slide ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 border-4 border-white/20 bg-black/50 hover:border-primary-400 hover:bg-black/80 flex items-center justify-center transition-all"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 border-4 border-white/20 bg-black/50 hover:border-primary-400 hover:bg-black/80 flex items-center justify-center transition-all"
            >
                <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 border-2 transition-all ${index === currentIndex
                                ? 'bg-primary-400 border-primary-400 w-8'
                                : 'bg-transparent border-white/40 hover:border-white'
                            }`}
                    />
                ))}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-6 gap-2 mt-4">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`aspect-video border-4 overflow-hidden transition-all ${index === currentIndex
                                ? 'border-primary-400'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                    >
                        <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 px-4 py-2 bg-black/80 border-2 border-white/20">
                <span className="text-sm font-black">
                    {currentIndex + 1} / {images.length}
                </span>
            </div>
        </div>
    );
}
