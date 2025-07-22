"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
  showNavigation?: boolean;
  showPagination?: boolean;
  slidesPerView?: number;
  spaceBetween?: number;
}

export function Carousel({
  items,
  autoplay = true,
  showNavigation = true,
  showPagination = true,
  slidesPerView = 1,
  spaceBetween = 30,
}: CarouselProps) {
  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        navigation={showNavigation}
        pagination={{ clickable: true }}
        autoplay={autoplay ? {
          delay: 4000,
          disableOnInteraction: false,
        } : false}
        loop={items.length > 1}
        breakpoints={{
          640: {
            slidesPerView: Math.min(2, slidesPerView),
            spaceBetween: 20,
          },
          768: {
            slidesPerView: Math.min(3, slidesPerView),
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: slidesPerView,
            spaceBetween: spaceBetween,
          },
        }}
        className="w-full h-full"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="relative bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white text-6xl font-bold opacity-20">
                      {item.title.charAt(0)}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity duration-300"></div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {item.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export function HeroCarousel({ items }: { items: CarouselItem[] }) {
  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={true}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={items.length > 1}
        className="w-full h-[400px] md:h-[500px]"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-2xl px-4">
                  <h2 className="text-4xl md:text-6xl font-bold mb-4">
                    {item.title}
                  </h2>
                  <p className="text-lg md:text-xl mb-8 opacity-90">
                    {item.description}
                  </p>
                  {item.link && (
                    <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                      Learn More
                    </button>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}