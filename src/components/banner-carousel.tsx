"use client"

import { useState, useCallback, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'

const banners = [
  {
    id: 1,
    src: '/banner1.png',
    alt: 'Investment Opportunities',
    title: 'Smart Investment Solutions',
    subtitle: 'Grow your wealth with our premium reward services'
  },
  {
    id: 2,
    src: '/banner2.png',
    alt: 'Reward Services',
    title: 'Guaranteed Returns',
    subtitle: 'Secure investments with daily rewards'
  },
  {
    id: 3,
    src: '/banner3.png',
    alt: 'Financial Growth',
    title: 'Start Your Journey',
    subtitle: 'Join thousands of successful investors'
  },
  {
    id: 4,
    src: '/banner4.png',
    alt: 'Mintward Platform',
    title: 'Trusted by Thousands',
    subtitle: 'Experience the future of investment platforms'
  },
  {
    id: 5,
    src: '/banner5.png',
    alt: 'Premium Features',
    title: 'Advanced Analytics',
    subtitle: 'Track your investments with powerful tools'
  }
]

export default function BannerCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: false
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  
  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index)
  }, [emblaApi])

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {/* Main Carousel */}
        <div className="relative" ref={emblaRef}>
          <div className="flex">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="relative flex-[0_0_100%] min-w-0 aspect-video md:aspect-[16/9] rounded-lg overflow-hidden"
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  className="object-cover"
                  priority={banner.id <= 2} // Prioritize first two images
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === selectedIndex
                    ? 'w-6 md:w-8 h-1.5 md:h-2 bg-white'
                    : 'w-1.5 md:w-2 h-1.5 md:h-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}