"use client";

import { CarouselWrapper } from "~/components/anime/carousel-wrapper";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "~/components/anime/styles.css";

function MessageHandler() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const messageParam = searchParams.get('message');
    if (messageParam) {
      setMessage(messageParam);
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg border border-green-500/30 backdrop-blur-sm">
      {message}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#181622] light:bg-transparent">
      <Suspense fallback={null}>
        <MessageHandler />
      </Suspense>
      <section className="pt-28 pb-16 overflow-visible">
        <CarouselWrapper />
      </section>
    </main>
  );
}
