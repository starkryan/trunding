"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { useTheme } from 'next-themes'

const bannerConfig = [
  {
    id: 1,
    lightSrc: '/carousel-white1.png',
    darkSrc: '/carousel-black1.png',
    alt: 'Investment Opportunities',
    title: 'Smart Investment Solutions',
    subtitle: 'Grow your wealth with our premium reward services'
  },
  {
    id: 2,
    lightSrc: '/carousel-white2.png',
    darkSrc: '/carousel-black2.png',
    alt: 'Reward Services',
    title: 'Guaranteed Returns',
    subtitle: 'Secure investments with daily rewards'
  },
  {
    id: 3,
    lightSrc: '/carousel-white3.png',
    darkSrc: '/carousel-black3.png',
    alt: 'Financial Growth',
    title: 'Start Your Journey',
    subtitle: 'Join thousands of successful investors'
  },
  {
    id: 4,
    lightSrc: '/carousel-white4.png',
    darkSrc: '/carousel-black4.png',
    alt: 'Mintward Platform',
    title: 'Trusted by Thousands',
    subtitle: 'Experience the future of investment platforms'
  },
  {
    id: 5,
    lightSrc: '/carousel-white5.png',
    darkSrc: '/carousel-black5.png',
    alt: 'Premium Features',
    title: 'Advanced Analytics',
    subtitle: 'Track your investments with powerful tools'
  }
]

export default function BannerCarousel() {
  const { theme } = useTheme()

  const banners = useMemo(() => {
    return bannerConfig.map(banner => ({
      ...banner,
      src: theme === 'dark' ? banner.darkSrc : banner.lightSrc
    }))
  }, [theme])

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
    <div className="w-full mt-5">
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

       {/* Progress Indicators (Smaller Version) */}
<div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1">
  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
    {scrollSnaps.map((_, index) => (
      <button
        key={index}
        onClick={() => scrollTo(index)}
        className={`transition-all duration-300 rounded-full ${
          index === selectedIndex
            ? 'w-3 h-1 bg-white'
            : 'w-1.5 h-1 bg-white/50 hover:bg-white/80'
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