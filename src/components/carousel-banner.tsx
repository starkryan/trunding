"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function CarouselBanner() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const autoplayInterval = useRef<NodeJS.Timeout | null>(null);
  
  const banners = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=300&fit=crop",
      alt: "Investment Platform",
      link: "/invest",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1554224155-8d04cb236d58?w=1200&h=300&fit=crop",
      alt: "Financial Growth",
      link: "/portfolio",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=300&fit=crop",
      alt: "Secure Trading",
      link: "/trade",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&h=300&fit=crop",
      alt: "Bitcoin Investment",
      link: "/wallet",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&h=300&fit=crop",
      alt: "Crypto Trading",
      link: "/market",
    },
  ];

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (api) {
      autoplayInterval.current = setInterval(() => {
        api.scrollNext();
      }, 3000);
    }
  }, [api]);

  const stopAutoplay = useCallback(() => {
    if (autoplayInterval.current) {
      clearInterval(autoplayInterval.current);
      autoplayInterval.current = null;
    }
  }, []);

  const scrollTo = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
      // Restart autoplay when manually navigating
      stopAutoplay();
      setTimeout(startAutoplay, 100);
    }
  }, [api, stopAutoplay, startAutoplay]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    setCurrent(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (api) {
      startAutoplay();
    }

    return () => {
      stopAutoplay();
    };
  }, [api, startAutoplay, stopAutoplay]);

  // Pause autoplay when user hovers over carousel
  const handleMouseEnter = () => {
    stopAutoplay();
  };

  const handleMouseLeave = () => {
    startAutoplay();
  };

  return (
    <div className="w-full">
      <div className="banner-slider relative">
        <Carousel
          className="w-full"
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {banners.map((banner) => (
              <CarouselItem key={banner.id}>
                <div className="slider-item">
                  <Card className="banner border-0 rounded-none overflow-hidden">
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={banner.alt}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={banner.image}
                        alt={banner.alt}
                        className="banner-image w-full h-[200px] md:h-[250px] lg:h-[300px] object-cover"
                      />
                    </a>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dots Indicator inside carousel */}
        <div className="slider-dots absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`slider-dot w-2 h-2 rounded-full transition-all duration-300 hover:bg-gray-400 ${
                current === index 
                  ? "bg-gray-600 w-6 rounded-lg" 
                  : "bg-gray-300"
              }`}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
