"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { FaSun, FaMoon } from "react-icons/fa"

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
  }
]

export default function TestCarouselPage() {
  const { theme, setTheme } = useTheme()

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

  const currentBanner = banners[selectedIndex]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Theme-Based Carousel Test</h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Current Theme: {theme}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <FaSun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <FaMoon className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="ml-2">Toggle Theme</span>
            </Button>
          </div>
        </div>

        <div className="w-full">
          <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
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
                      priority={banner.id <= 2}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                    />
                  </div>
                ))}
              </div>
            </div>

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

        <div className="mt-8 p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Current Banner Info</h2>
          <div className="space-y-2">
            <p><strong>Title:</strong> {currentBanner?.title}</p>
            <p><strong>Subtitle:</strong> {currentBanner?.subtitle}</p>
            <p><strong>Image Source:</strong> {currentBanner?.src}</p>
            <p><strong>Theme:</strong> {theme}</p>
            <p><strong>Expected Light Image:</strong> {currentBanner?.lightSrc}</p>
            <p><strong>Expected Dark Image:</strong> {currentBanner?.darkSrc}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Observe the current carousel image</li>
            <li>Click the "Toggle Theme" button to switch between light and dark themes</li>
            <li>Verify that the carousel images change based on the theme:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Light theme should show carousel-white*.png images</li>
                <li>Dark theme should show carousel-black*.png images</li>
              </ul>
            </li>
            <li>Check the "Current Banner Info" section to confirm the correct image source is being used</li>
          </ol>
        </div>
      </div>
    </div>
  )
}