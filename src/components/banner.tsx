"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BannerProps {
  onClose?: () => void;
  className?: string;
}

export default function Banner({ onClose, className }: BannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const bannerImages = [
    {
      src: "/banner.png",
      alt: "Investment Platform Banner",
      title: "",
      description: ""
    }
  ];

  if (!isVisible) {
    return null;
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const currentBanner = bannerImages[currentSlide];

  useEffect(() => {
    setImageLoaded(false);
  }, [currentSlide]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Banner Image Container */}
      <div className="relative w-full aspect-[3/1] sm:aspect-[4/1] md:aspect-[5/1] bg-gradient-to-br from-primary/20 to-primary/10 min-h-[200px]">
        <Image
          src={currentBanner.src}
          alt={currentBanner.alt}
          fill
          className={cn(
            "object-contain transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
          onLoadingComplete={() => setImageLoaded(true)}
          onError={() => {
            console.error('Banner image failed to load:', currentBanner.src);
            setImageLoaded(false);
          }}
        />

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Loading banner...</p>
            </div>
          </div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />



        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        {/* Navigation Arrows - Only show if multiple banners */}
        {bannerImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handlePrevious}
            >
              <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        {/* Slide Indicators - Only show if multiple banners */}
        {bannerImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentSlide
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                )}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}