
export interface JikanAnimeData {
  mal_id: number;
  images: { jpg: { large_image_url: string; image_url: string } };
  title: string;
  title_english: string | null;
  type: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  score: number | null;
  favorites: number | null;
  synopsis: string | null;
  year: number | null;
}

export interface JikanResponse {
  data: JikanAnimeData[];
}

export interface AnimeItem {
  id: number;
  malId: number;
  title: string;
  description: string;
  image: string;
  status: "Airing Now" | "Scheduled" | "Movie" | "Finished";
  favorites: number;
  rating: number;
}

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

class JikanAPIService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheExpiry = 300000;

  private async makeRequest(endpoint: string): Promise<JikanResponse> {
    const cached = this.cache.get(endpoint);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    const response = await fetch(`${JIKAN_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    this.cache.set(endpoint, { data, timestamp: now });
    return data;
  }

  private removeDuplicates(animeList: AnimeItem[]): AnimeItem[] {
    const seen = new Set<number>();
    return animeList.filter(anime => !seen.has(anime.malId) && seen.add(anime.malId));
  }

  private transformAnimeData(anime: JikanAnimeData): AnimeItem {
    const status = anime.airing ? 'Airing Now' : 
                   anime.status === 'Not yet aired' ? 'Scheduled' :
                   anime.type === 'Movie' ? 'Movie' : 'Finished';

    return {
      id: anime.mal_id,
      malId: anime.mal_id,
      title: anime.title_english || anime.title,
      description: anime.synopsis || 'No description available.',
      image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
      status,
      favorites: anime.favorites || 0,
      rating: anime.score || 0,
    };
  }

  private async fetchAnime(endpoint: string, limit = 20): Promise<AnimeItem[]> {
    const response = await this.makeRequest(`${endpoint}?limit=${Math.min(limit * 2, 25)}`);
    const transformed = response.data.map(anime => this.transformAnimeData(anime));
    return this.removeDuplicates(transformed).slice(0, limit);
  }

  getCurrentlyAiring(limit = 20) { return this.fetchAnime('/seasons/now', limit); }
  getTopAnime(limit = 20) { return this.fetchAnime('/top/anime', limit); }
  getUpcomingAnime(limit = 20) { return this.fetchAnime('/seasons/upcoming', limit); }
  
  getAnimeByGenre(genreId: number, limit = 20) {
    return this.fetchAnime(`/anime?genres=${genreId}&order_by=score&sort=desc`, limit);
  }
  
  getAnimeByStatus(status: 'airing' | 'complete' | 'upcoming', limit = 20) {
    return this.fetchAnime(`/anime?status=${status}&order_by=score&sort=desc`, limit);
  }
  
  searchAnime(query: string, limit = 20) {
    return this.fetchAnime(`/anime?q=${encodeURIComponent(query)}&order_by=score&sort=desc`, limit);
  }
}

export const jikanAPI = new JikanAPIService();

