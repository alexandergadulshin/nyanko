interface BasicMalItem {
  mal_id: number;
  name: string;
}

export interface JikanAnimeData {
  mal_id: number;
  images: { jpg: { large_image_url: string; image_url: string } };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  favorites: number | null;
  synopsis: string | null;
  year: number | null;
  season: string | null;
  broadcast?: { day: string | null; time: string | null; timezone: string | null };
  producers: BasicMalItem[];
  studios: BasicMalItem[];
  genres: BasicMalItem[];
  themes: BasicMalItem[];
  demographics: BasicMalItem[];
  duration: string | null;
  rating: string | null;
  aired: { from: string | null; to: string | null };
}

export interface JikanResponse {
  data: JikanAnimeData[];
}

export interface JikanSingleResponse {
  data: JikanAnimeData;
}

export interface DetailedAnimeItem extends AnimeItem {
  titleJapanese: string | null;
  episodes: number | null;
  type: string;
  score: number | null;
  scoredBy: number | null;
  rank: number | null;
  popularity: number | null;
  year: number | null;
  season: string | null;
  broadcast: string | null;
  producers: string[];
  studios: string[];
  genres: string[];
  themes: string[];
  demographics: string[];
  duration: string | null;
  ageRating: string | null;
  aired: { from: string | null; to: string | null };
}

export interface GenreItem {
  mal_id: number;
  name: string;
  count: number;
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
  episodes?: number | null;
}

export interface CharacterItem {
  id: number;
  malId: number;
  name: string;
  description: string;
  image: string;
  favorites: number;
  about?: string;
}

export interface PersonItem {
  id: number;
  malId: number;
  name: string;
  description: string;
  image: string;
  favorites: number;
  about?: string;
}

export interface MangaItem {
  id: number;
  malId: number;
  title: string;
  description: string;
  image: string;
  status: "Publishing" | "Finished" | "Not yet published" | "Discontinued";
  favorites: number;
  rating: number;
  chapters?: number | null;
  volumes?: number | null;
}

export type SearchCategory = "anime" | "characters" | "people" | "manga";
export type SearchItem = AnimeItem | CharacterItem | PersonItem | MangaItem;

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const CACHE_EXPIRY = 600000;
const RATE_LIMIT_DELAY = 5000;
const RETRY_DELAY = 10000;
const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 20;

const STATUS_MAP = {
  'Not yet aired': 'Scheduled',
  'Movie': 'Movie',
  'Finished': 'Finished'
} as const;

const MANGA_STATUS_MAP = {
  'Not yet published': 'Not yet published',
  'Discontinued': 'Discontinued',
  'Finished': 'Finished',
  'Publishing': 'Publishing'
} as const;

const FALLBACK_GENRES: GenreItem[] = [
  { mal_id: 1, name: "Action", count: 0 },
  { mal_id: 2, name: "Adventure", count: 0 },
  { mal_id: 4, name: "Comedy", count: 0 },
  { mal_id: 8, name: "Drama", count: 0 },
  { mal_id: 10, name: "Fantasy", count: 0 },
  { mal_id: 14, name: "Horror", count: 0 },
  { mal_id: 16, name: "Magic", count: 0 },
  { mal_id: 18, name: "Mecha", count: 0 },
  { mal_id: 19, name: "Music", count: 0 },
  { mal_id: 22, name: "Romance", count: 0 },
  { mal_id: 23, name: "School", count: 0 },
  { mal_id: 24, name: "Sci-Fi", count: 0 },
  { mal_id: 27, name: "Shounen", count: 0 },
  { mal_id: 29, name: "Space", count: 0 },
  { mal_id: 30, name: "Sports", count: 0 },
  { mal_id: 31, name: "Super Power", count: 0 },
  { mal_id: 37, name: "Supernatural", count: 0 },
  { mal_id: 38, name: "Military", count: 0 },
  { mal_id: 39, name: "Police", count: 0 },
  { mal_id: 40, name: "Psychological", count: 0 }
];

class JikanAPIService {
  private cache = new Map<string, { data: JikanResponse | JikanSingleResponse; timestamp: number }>();
  private lastRequestTime = 0;

  private async makeRequest(endpoint: string): Promise<JikanResponse> {
    const cached = this.cache.get(endpoint);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
      return cached.data as JikanResponse;
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }

    const url = `${JIKAN_BASE_URL}${endpoint}`;
    this.lastRequestTime = Date.now();
    
    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json() as JikanResponse;
      this.cache.set(endpoint, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      throw error;
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    const response = await fetch(url);
    
    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      this.lastRequestTime = Date.now();
      const retryResponse = await fetch(url);
      if (!retryResponse.ok) {
        throw new Error(`API rate limited: ${retryResponse.status}`);
      }
      return retryResponse;
    }
    
    if (response.status >= 500) {
      throw new Error(`Server error: The API is currently experiencing issues.`);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response;
  }

  private removeDuplicates<T extends { malId: number }>(items: T[]): T[] {
    const seen = new Set<number>();
    return items.filter(item => {
      if (seen.has(item.malId)) return false;
      seen.add(item.malId);
      return true;
    });
  }

  private transformAnimeData(anime: JikanAnimeData): AnimeItem {
    const status = anime.airing ? 'Airing Now' : 
                   STATUS_MAP[anime.status as keyof typeof STATUS_MAP] ?? 
                   (anime.type === 'Movie' ? 'Movie' : 'Finished');

    return {
      id: anime.mal_id,
      malId: anime.mal_id,
      title: anime.title_english ?? anime.title,
      description: anime.synopsis ?? 'No description available.',
      image: anime.images.jpg.large_image_url ?? anime.images.jpg.image_url,
      status,
      favorites: anime.favorites ?? 0,
      rating: anime.score ?? 0,
      episodes: anime.episodes,
    };
  }

  private transformDetailedAnimeData(anime: JikanAnimeData): DetailedAnimeItem {
    const basicData = this.transformAnimeData(anime);
    
    return {
      ...basicData,
      titleJapanese: anime.title_japanese,
      episodes: anime.episodes,
      type: anime.type,
      score: anime.score,
      scoredBy: anime.scored_by,
      rank: anime.rank,
      popularity: anime.popularity,
      year: anime.year,
      season: anime.season,
      broadcast: anime.broadcast?.day && anime.broadcast?.time ? 
        `${anime.broadcast.day}s at ${anime.broadcast.time}` : null,
      producers: anime.producers?.map(p => p.name) ?? [],
      studios: anime.studios?.map(s => s.name) ?? [],
      genres: anime.genres?.map(g => g.name) ?? [],
      themes: anime.themes?.map(t => t.name) ?? [],
      demographics: anime.demographics?.map(d => d.name) ?? [],
      duration: anime.duration,
      ageRating: anime.rating,
      aired: anime.aired,
    };
  }

  private transformCharacterData(character: any): CharacterItem {
    return {
      id: character.mal_id,
      malId: character.mal_id,
      name: character.name,
      description: character.about || 'No description available.',
      image: character.images?.jpg?.image_url || character.images?.webp?.image_url || '',
      favorites: character.favorites ?? 0,
      about: character.about,
    };
  }

  private transformPersonData(person: any): PersonItem {
    return {
      id: person.mal_id,
      malId: person.mal_id,
      name: person.name,
      description: person.about || 'No description available.',
      image: person.images?.jpg?.image_url || '',
      favorites: person.favorites ?? 0,
      about: person.about,
    };
  }

  private transformMangaData(manga: any): MangaItem {
    const status = manga.publishing ? 'Publishing' : 
                   MANGA_STATUS_MAP[manga.status as keyof typeof MANGA_STATUS_MAP] ?? 'Finished';

    return {
      id: manga.mal_id,
      malId: manga.mal_id,
      title: manga.title_english ?? manga.title,
      description: manga.synopsis ?? 'No description available.',
      image: manga.images?.jpg?.large_image_url ?? manga.images?.jpg?.image_url,
      status,
      favorites: manga.favorites ?? 0,
      rating: manga.score ?? 0,
      chapters: manga.chapters,
      volumes: manga.volumes,
    };
  }

  private async fetchAnime(endpoint: string, limit = DEFAULT_LIMIT, searchQuery?: string): Promise<AnimeItem[]> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const apiLimit = Math.min(limit, MAX_LIMIT);
    const response = await this.makeRequest(`${endpoint}${separator}limit=${apiLimit}`);
    let transformed = response.data.map(anime => this.transformAnimeData(anime));
    transformed = this.removeDuplicates(transformed);
    
    if (searchQuery?.trim()) {
      transformed = this.sortByRelevance(transformed, searchQuery.trim());
    }
    
    return transformed.slice(0, limit);
  }

  private sortByRelevance(animeList: AnimeItem[], query: string): AnimeItem[] {
    const queryLower = query.toLowerCase();
    
    const scoredItems = animeList.map(anime => {
      const titleLower = anime.title.toLowerCase();
      const descLower = anime.description.toLowerCase();
      
      const relevanceScore = this.calculateRelevanceScore(titleLower, descLower, queryLower);
      const popularityScore = this.calculatePopularityScore(anime);
      const totalScore = (popularityScore * 5) + (relevanceScore * 0.3);
      
      return { anime, relevanceScore, totalScore };
    });
    
    return scoredItems
      .sort((a, b) => {
        if (a.relevanceScore === 0 && b.relevanceScore > 0) return 1;
        if (b.relevanceScore === 0 && a.relevanceScore > 0) return -1;
        return b.totalScore - a.totalScore;
      })
      .map(item => item.anime);
  }

  private calculateRelevanceScore(title: string, description: string, query: string): number {
    let score = 0;
    
    const isShortQuery = query.length <= 4;
    
    if (title === query) {
      score += 1000;
    }
    else if (title.startsWith(query)) {
      score += isShortQuery ? 800 : 500;
    }
    else if (title.includes(` ${query} `) || title.includes(` ${query}`) || title.includes(`${query} `)) {
      score += isShortQuery ? 600 : 300;
    }
    else if (title.includes(query)) {
      score += isShortQuery ? 400 : 200;
    }
    
    if (description.includes(query)) {
      const matches = (description.match(new RegExp(query, 'g')) || []).length;
      score += matches * 5;
    }
    
    if (title.length < 50 && title.includes(query)) {
      score += isShortQuery ? 100 : 50;
    }
    
    const queryWords = query.split(' ').filter(word => word.length > 2);
    for (const word of queryWords) {
      if (title.includes(word)) {
        score += 25;
      }
      if (description.includes(word)) {
        score += 2;
      }
    }
    
    return score;
  }

  private calculatePopularityScore(anime: AnimeItem): number {
    let score = 0;
    
    if (anime.rating > 0) {
      score += anime.rating * 150;
    }
    
    if (anime.favorites > 0) {
      score += Math.sqrt(anime.favorites) * 50;
    }
    
    if (anime.favorites >= 100000) {
      score += 2000;
    } else if (anime.favorites >= 50000) {
      score += 1500;
    } else if (anime.favorites >= 10000) {
      score += 1000;
    } else if (anime.favorites >= 5000) {
      score += 500;
    } else if (anime.favorites >= 1000) {
      score += 200;
    }
    
    if (anime.rating >= 9.0) {
      score += 500;
    } else if (anime.rating >= 8.5) {
      score += 300;
    } else if (anime.rating >= 8.0) {
      score += 200;
    }
    
    return score;
  }

  getCurrentlyAiring(limit = DEFAULT_LIMIT) { return this.fetchAnime('/seasons/now', limit); }
  getTopAnime(limit = DEFAULT_LIMIT) { return this.fetchAnime('/top/anime', limit); }
  getUpcomingAnime(limit = DEFAULT_LIMIT) { return this.fetchAnime('/seasons/upcoming', limit); }
  
  async getTopManga(limit = DEFAULT_LIMIT): Promise<MangaItem[]> {
    const apiLimit = Math.min(limit, MAX_LIMIT);
    const response = await this.makeRequest(`/top/manga?limit=${apiLimit}`);
    let transformed = response.data.map((manga: any) => this.transformMangaData(manga));
    transformed = this.removeDuplicates(transformed);
    return transformed.slice(0, limit);
  }
  
  getAnimeByGenre(genreId: number, limit = DEFAULT_LIMIT) {
    return this.fetchAnime(`/anime?genres=${genreId}&order_by=score&sort=desc`, limit);
  }
  
  getAnimeByStatus(status: 'airing' | 'complete' | 'upcoming', limit = DEFAULT_LIMIT) {
    return this.fetchAnime(`/anime?status=${status}&order_by=score&sort=desc`, limit);
  }
  
  searchAnime(query: string, limit = DEFAULT_LIMIT) {
    return this.fetchAnime(`/anime?q=${encodeURIComponent(query)}`, limit, query);
  }

  async advancedSearch(params: {
    query?: string;
    type?: string;
    status?: string;
    rating?: string;
    genres?: number[];
    excludeGenres?: number[];
    minScore?: number;
    maxScore?: number;
    orderBy?: string;
    sort?: 'asc' | 'desc';
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params.query?.trim()) {
      searchParams.set('q', params.query.trim());
    }
    if (params.type) {
      searchParams.set('type', params.type);
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.rating) {
      searchParams.set('rating', params.rating);
    }
    if (params.genres?.length) {
      searchParams.set('genres', params.genres.join(','));
    }
    if (params.excludeGenres?.length) {
      searchParams.set('genres_exclude', params.excludeGenres.join(','));
    }
    if (params.minScore !== undefined && params.maxScore !== undefined) {
      const minScore = Math.min(params.minScore, params.maxScore);
      const maxScore = Math.max(params.minScore, params.maxScore);
      
      if (minScore > 0) {
        searchParams.set('min_score', minScore.toString());
      }
      if (maxScore < 10) {
        searchParams.set('max_score', maxScore.toString());
      }
    } else {
      if (params.minScore && params.minScore > 0) {
        searchParams.set('min_score', params.minScore.toString());
      }
      if (params.maxScore && params.maxScore < 10) {
        searchParams.set('max_score', params.maxScore.toString());
      }
    }
    if (params.orderBy) {
      searchParams.set('order_by', params.orderBy);
    }
    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    const endpoint = `/anime?${searchParams.toString()}`;
    return this.fetchAnime(endpoint, params.limit ?? 24, params.query);
  }

  async getAnimeById(malId: number): Promise<DetailedAnimeItem> {
    const cached = this.cache.get(`/anime/${malId}`);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
      return this.transformDetailedAnimeData((cached.data as JikanSingleResponse).data);
    }

    const response = await this.fetchWithRetry(`${JIKAN_BASE_URL}/anime/${malId}`);
    const data = await response.json() as JikanSingleResponse;
    this.cache.set(`/anime/${malId}`, { data, timestamp: now });
    return this.transformDetailedAnimeData(data.data);
  }

  async getGenres(): Promise<GenreItem[]> {
    const cached = this.cache.get('/genres/anime');
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
      return (cached.data as any).data;
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }

    const url = `${JIKAN_BASE_URL}/genres/anime`;
    this.lastRequestTime = Date.now();
    
    try {
      const response = await this.fetchWithRetry(url);
      const data = await response.json();
      this.cache.set('/genres/anime', { data, timestamp: Date.now() });
      return data.data;
    } catch (error) {
      return this.getFallbackGenres();
    }
  }

  private getFallbackGenres(): GenreItem[] {
    return FALLBACK_GENRES;
  }

  async searchCharacters(query: string, limit = DEFAULT_LIMIT): Promise<CharacterItem[]> {
    try {
      if (query.trim().length < 2) return [];
      
      const endpoint = `/characters?q=${encodeURIComponent(query)}&limit=${Math.min(limit, MAX_LIMIT)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) return [];
      
      const transformed = response.data
        .map((character: any) => this.transformCharacterData(character))
        .sort((a, b) => (b.favorites ?? 0) - (a.favorites ?? 0));
      
      return transformed.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async searchPeople(query: string, limit = DEFAULT_LIMIT): Promise<PersonItem[]> {
    try {
      if (query.trim().length < 2) return [];
      
      const endpoint = `/people?q=${encodeURIComponent(query)}&limit=${Math.min(limit, MAX_LIMIT)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) return [];
      
      const transformed = response.data
        .map((person: any) => this.transformPersonData(person))
        .sort((a, b) => (b.favorites ?? 0) - (a.favorites ?? 0));
      
      return transformed.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async searchManga(query: string, limit = DEFAULT_LIMIT): Promise<MangaItem[]> {
    try {
      if (query.trim().length < 2) return [];
      
      const endpoint = `/manga?q=${encodeURIComponent(query)}&limit=${Math.min(limit, MAX_LIMIT)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) return [];
      
      const transformed = response.data
        .map((manga: any) => this.transformMangaData(manga))
        .sort((a, b) => {
          const scoreA = (a.rating ?? 0) + Math.sqrt(a.favorites ?? 0) * 0.1;
          const scoreB = (b.rating ?? 0) + Math.sqrt(b.favorites ?? 0) * 0.1;
          return scoreB - scoreA;
        });
      
      return transformed.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  async searchMultiCategory(query: string, category: SearchCategory, limit = DEFAULT_LIMIT): Promise<SearchItem[]> {
    const searchMethods = {
      anime: () => this.searchAnime(query, limit),
      characters: () => this.searchCharacters(query, limit),
      people: () => this.searchPeople(query, limit),
      manga: () => this.searchManga(query, limit)
    };
    
    return searchMethods[category]?.() ?? this.searchAnime(query, limit);
  }
}

export const jikanAPI = new JikanAPIService();