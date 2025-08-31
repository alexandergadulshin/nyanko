
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
  producers: Array<{ mal_id: number; name: string }>;
  studios: Array<{ mal_id: number; name: string }>;
  genres: Array<{ mal_id: number; name: string }>;
  themes: Array<{ mal_id: number; name: string }>;
  demographics: Array<{ mal_id: number; name: string }>;
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

class JikanAPIService {
  private cache = new Map<string, { data: JikanResponse | JikanSingleResponse; timestamp: number }>();
  private readonly cacheExpiry = 600000; // Increased to 10 minutes
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 5000; // Increased to 5 seconds

  private async makeRequest(endpoint: string): Promise<JikanResponse> {
    const cached = this.cache.get(endpoint);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      console.log("Using cached data for:", endpoint);
      return cached.data as JikanResponse;
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${delay}ms before request`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const url = `${JIKAN_BASE_URL}${endpoint}`;
    console.log("Making API request to:", url);
    
    this.lastRequestTime = Date.now();
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limited on ${url}, waiting 10 seconds before retry`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          this.lastRequestTime = Date.now();
          const retryResponse = await fetch(url);
          if (!retryResponse.ok) {
            console.warn(`Retry also rate limited: ${retryResponse.status} for ${url}`);
            throw new Error(`API rate limited: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json() as JikanResponse;
          this.cache.set(endpoint, { data: retryData, timestamp: Date.now() });
          return retryData;
        }
        
        if (response.status >= 500) {
          console.warn(`Server error: ${response.status} for URL: ${url} - API temporarily unavailable`);
          throw new Error(`Server error: The API is currently experiencing issues. Please try again later.`);
        }
        
        console.error(`API error: ${response.status} for URL: ${url}`);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json() as JikanResponse;
      console.log("API response received, data length:", data.data?.length || 0);
      this.cache.set(endpoint, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Server error')) {
        console.warn('API request failed due to server error:', error.message);
      } else {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  private removeDuplicates(animeList: AnimeItem[]): AnimeItem[] {
    const seen = new Set<number>();
    return animeList.filter(anime => {
      if (seen.has(anime.malId)) {
        return false;
      }
      seen.add(anime.malId);
      return true;
    });
  }

  private transformAnimeData(anime: JikanAnimeData): AnimeItem {
    const status = anime.airing ? 'Airing Now' : 
                   anime.status === 'Not yet aired' ? 'Scheduled' :
                   anime.type === 'Movie' ? 'Movie' : 'Finished';

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
    
    const formatBroadcast = (broadcast: typeof anime.broadcast) => {
      if (!broadcast?.day || !broadcast?.time) return null;
      return `${broadcast.day}s at ${broadcast.time}`;
    };

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
      broadcast: formatBroadcast(anime.broadcast),
      producers: anime.producers?.map(p => p.name) || [],
      studios: anime.studios?.map(s => s.name) || [],
      genres: anime.genres?.map(g => g.name) || [],
      themes: anime.themes?.map(t => t.name) || [],
      demographics: anime.demographics?.map(d => d.name) || [],
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
                   manga.status === 'Not yet published' ? 'Not yet published' :
                   manga.status === 'Discontinued' ? 'Discontinued' : 'Finished';

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

  private async fetchAnime(endpoint: string, limit = 20, searchQuery?: string): Promise<AnimeItem[]> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const apiLimit = Math.min(limit, 25);
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
    
    // Pre-compute scores to avoid recalculation during sort
    const scoredItems = animeList.map(anime => {
      const titleLower = anime.title.toLowerCase();
      const descLower = anime.description.toLowerCase();
      
      const relevanceScore = this.calculateRelevanceScore(titleLower, descLower, queryLower);
      const popularityScore = this.calculatePopularityScore(anime);
      const totalScore = (popularityScore * 5) + (relevanceScore * 0.3);
      
      return { anime, relevanceScore, totalScore };
    });
    
    // Sort by precomputed scores
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
      score += isShortQuery ? 800 : 500; // Higher score for short queries
    }
    else if (title.includes(` ${query} `) || title.includes(` ${query}`) || title.includes(`${query} `)) {
      score += isShortQuery ? 600 : 300;
    }
    else if (title.includes(query)) {
      score += isShortQuery ? 400 : 200; // Much higher for short queries
    }
    
    if (description.includes(query)) {
      const matches = (description.match(new RegExp(query, 'g')) || []).length;
      score += matches * 5; // Reduced from 10 to 5
    }
    
    if (title.length < 50 && title.includes(query)) {
      score += isShortQuery ? 100 : 50; // Higher bonus for short queries
    }
    
    const queryWords = query.split(' ').filter(word => word.length > 2);
    for (const word of queryWords) {
      if (title.includes(word)) {
        score += 25;
      }
      if (description.includes(word)) {
        score += 2; // Reduced from 5 to 2
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
      score += 2000; // Mega popular (like Naruto, AoT)
    } else if (anime.favorites >= 50000) {
      score += 1500; // Very popular
    } else if (anime.favorites >= 10000) {
      score += 1000; // Popular
    } else if (anime.favorites >= 5000) {
      score += 500;  // Well-known
    } else if (anime.favorites >= 1000) {
      score += 200;  // Moderately known
    }
    
    if (anime.rating >= 9.0) {
      score += 500; // Masterpiece tier
    } else if (anime.rating >= 8.5) {
      score += 300; // Excellent
    } else if (anime.rating >= 8.0) {
      score += 200; // Very good
    }
    
    return score;
  }

  getCurrentlyAiring(limit = 20) { return this.fetchAnime('/seasons/now', limit); }
  getTopAnime(limit = 20) { return this.fetchAnime('/top/anime', limit); }
  getUpcomingAnime(limit = 20) { return this.fetchAnime('/seasons/upcoming', limit); }
  
  async getTopManga(limit = 20): Promise<MangaItem[]> {
    const separator = '?';
    const apiLimit = Math.min(limit, 25);
    const response = await this.makeRequest(`/top/manga${separator}limit=${apiLimit}`);
    let transformed = response.data.map((manga: any) => this.transformMangaData(manga));
    const seen = new Set<number>();
    transformed = transformed.filter(manga => !seen.has(manga.malId) && seen.add(manga.malId));
    return transformed.slice(0, limit);
  }
  
  getAnimeByGenre(genreId: number, limit = 20) {
    return this.fetchAnime(`/anime?genres=${genreId}&order_by=score&sort=desc`, limit);
  }
  
  getAnimeByStatus(status: 'airing' | 'complete' | 'upcoming', limit = 20) {
    return this.fetchAnime(`/anime?status=${status}&order_by=score&sort=desc`, limit);
  }
  
  searchAnime(query: string, limit = 20) {
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
    return this.fetchAnime(endpoint, params.limit || 24, params.query);
  }

  async getAnimeById(malId: number): Promise<DetailedAnimeItem> {
    const cached = this.cache.get(`/anime/${malId}`);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return this.transformDetailedAnimeData((cached.data as JikanSingleResponse).data);
    }

    const response = await fetch(`${JIKAN_BASE_URL}/anime/${malId}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json() as JikanSingleResponse;
    this.cache.set(`/anime/${malId}`, { data, timestamp: now });
    return this.transformDetailedAnimeData(data.data);
  }

  async getGenres(): Promise<GenreItem[]> {
    const cached = this.cache.get('/genres/anime');
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      console.log("Using cached data for: /genres/anime");
      return (cached.data as any).data;
    }

    // Apply rate limiting
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`Rate limiting genres: waiting ${delay}ms before request`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const url = `${JIKAN_BASE_URL}/genres/anime`;
    console.log("Making API request to:", url);
    
    this.lastRequestTime = Date.now();
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limited on ${url}, waiting 10 seconds before retry`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          this.lastRequestTime = Date.now();
          const retryResponse = await fetch(url);
          if (!retryResponse.ok) {
            console.warn(`Retry also rate limited: ${retryResponse.status} for ${url}`);
            // Return fallback genres instead of throwing error
            return this.getFallbackGenres();
          }
          const retryData = await retryResponse.json();
          this.cache.set('/genres/anime', { data: retryData, timestamp: Date.now() });
          return retryData.data;
        }
        
        if (response.status >= 500) {
          console.warn(`Server error: ${response.status} for URL: ${url} - API temporarily unavailable`);
          return this.getFallbackGenres();
        }
        
        console.error(`API error: ${response.status} for URL: ${url}`);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response received for genres");
      this.cache.set('/genres/anime', { data, timestamp: Date.now() });
      return data.data;
    } catch (error) {
      if (error instanceof Error && (error.message.includes('Server error') || error.message.includes('rate limited'))) {
        console.warn('Genres API request failed, using fallback data:', error.message);
        return this.getFallbackGenres();
      } else {
        console.error('Genres API request failed:', error);
        throw error;
      }
    }
  }

  private getFallbackGenres(): GenreItem[] {
    // Common anime genres as fallback when API is unavailable
    return [
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
      { mal_id: 40, name: "Psychological", count: 0 },
    ];
  }

  async searchCharacters(query: string, limit = 20): Promise<CharacterItem[]> {
    try {
      if (query.trim().length < 2) {
        return [];
      }
      
      const separator = '?';
      const endpoint = `/characters${separator}q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format for characters search:', response);
        return [];
      }
      
      let transformed = response.data.map((character: any) => this.transformCharacterData(character));
      
      transformed = transformed.sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
      
      return transformed.slice(0, limit);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Server error')) {
        console.warn('Character search temporarily unavailable due to API server error');
      } else {
        console.error('Error searching characters:', error);
      }
      return [];
    }
  }

  async searchPeople(query: string, limit = 20): Promise<PersonItem[]> {
    try {
      if (query.trim().length < 2) {
        return [];
      }
      
      const separator = '?';
      const endpoint = `/people${separator}q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format for people search:', response);
        return [];
      }
      
      let transformed = response.data.map((person: any) => this.transformPersonData(person));
      
      transformed = transformed.sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
      
      return transformed.slice(0, limit);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Server error')) {
        console.warn('People search temporarily unavailable due to API server error');
      } else {
        console.error('Error searching people:', error);
      }
      return [];
    }
  }

  async searchManga(query: string, limit = 20): Promise<MangaItem[]> {
    try {
      if (query.trim().length < 2) {
        return [];
      }
      
      const separator = '?';
      const endpoint = `/manga${separator}q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}`;
      const response = await this.makeRequest(endpoint);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format for manga search:', response);
        return [];
      }
      
      let transformed = response.data.map((manga: any) => this.transformMangaData(manga));
      
      transformed = transformed.sort((a, b) => {
        const scoreA = (a.rating || 0) + Math.sqrt(a.favorites || 0) * 0.1;
        const scoreB = (b.rating || 0) + Math.sqrt(b.favorites || 0) * 0.1;
        return scoreB - scoreA;
      });
      
      return transformed.slice(0, limit);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Server error')) {
        console.warn('Manga search temporarily unavailable due to API server error');
      } else {
        console.error('Error searching manga:', error);
      }
      return [];
    }
  }

  async searchMultiCategory(query: string, category: SearchCategory, limit = 20): Promise<SearchItem[]> {
    switch (category) {
      case 'anime':
        return this.searchAnime(query, limit);
      case 'characters':
        return this.searchCharacters(query, limit);
      case 'people':
        return this.searchPeople(query, limit);
      case 'manga':
        return this.searchManga(query, limit);
      default:
        return this.searchAnime(query, limit);
    }
  }
}

export const jikanAPI = new JikanAPIService();

