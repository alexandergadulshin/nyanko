import { CarouselWrapper } from "~/components/anime/carousel-wrapper";
import "~/components/anime/styles.css";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#181622] light:bg-transparent">
      <section className="pt-28 pb-16 overflow-visible">
        <CarouselWrapper />
      </section>
    </main>
  );
}
