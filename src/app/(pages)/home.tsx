import { AnimeCarousel } from "~/components/anime/anime-carousel";
import "~/components/anime/anime-carousel.css";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#181622]">
      <section className="py-16">
        <AnimeCarousel />
      </section>
    </main>
  );
}