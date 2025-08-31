import { jikanAPI, type AnimeItem, type CharacterItem, type PersonItem, type MangaItem } from "~/utils/api";
import { IdMappingService, type ItemWithMappings } from "./id-mapping";

export interface EnhancedAnimeItem extends AnimeItem {
  internalId?: string;
  externalMappings?: Array<{
    service: string;
    id: string;
    data?: unknown;
  }>;
}

export interface EnhancedCharacterItem extends CharacterItem {
  internalId?: string;
  externalMappings?: Array<{
    service: string;
    id: string;
    data?: unknown;
  }>;
}

export interface EnhancedPersonItem extends PersonItem {
  internalId?: string;
  externalMappings?: Array<{
    service: string;
    id: string;
    data?: unknown;
  }>;
}

export interface EnhancedMangaItem extends MangaItem {
  internalId?: string;
  externalMappings?: Array<{
    service: string;
    id: string;
    data?: unknown;
  }>;
}

export type EnhancedSearchItem = EnhancedAnimeItem | EnhancedCharacterItem | EnhancedPersonItem | EnhancedMangaItem;

class EnhancedAPIService {
  async getAnimeById(id: string | number): Promise<EnhancedAnimeItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let malData: AnimeItem | null = null;

      if (typeof id === "string" && id.length > 10) {
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            try {
              malData = await jikanAPI.getAnimeById(parseInt(malMapping.externalId));
            } catch (err) {
              malData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
            }
          }
        }
      } else {
        const malId = typeof id === "string" ? parseInt(id) : id;
        malData = await jikanAPI.getAnimeById(malId);
        
        if (malData) {
          const { itemData, externalMapping } = IdMappingService.malToInternal(
            { mal_id: malId, ...malData } as any,
            "anime"
          );
          
          internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
        }
      }

      if (!malData || !internalItem) return null;

      return {
        ...malData,
        internalId: internalItem.id,
        externalMappings: internalItem.mappings.map(mapping => ({
          service: mapping.externalService,
          id: mapping.externalId,
          data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
        })),
      };
    } catch (error) {
      console.error("Error in getAnimeById:", error);
      return null;
    }
  }

  async getCharacterById(id: string | number): Promise<EnhancedCharacterItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let characterData: CharacterItem | null = null;

      if (typeof id === "string" && id.length > 10) {
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            characterData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
          }
        }
      } else {
        const malId = typeof id === "string" ? parseInt(id) : id;
        
        const response = await fetch(`https://api.jikan.moe/v4/characters/${malId}/full`);
        if (!response.ok) return null;
        
        const data = await response.json();
        characterData = data.data;
        
        if (characterData) {
          const { itemData, externalMapping } = IdMappingService.malToInternal(
            { mal_id: malId, ...characterData } as any,
            "character"
          );
          
          internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
        }
      }

      if (!characterData || !internalItem) return null;

      return {
        ...characterData,
        internalId: internalItem.id,
        externalMappings: internalItem.mappings.map(mapping => ({
          service: mapping.externalService,
          id: mapping.externalId,
          data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
        })),
      };
    } catch (error) {
      console.error("Error in getCharacterById:", error);
      return null;
    }
  }

  async getPersonById(id: string | number): Promise<EnhancedPersonItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let personData: PersonItem | null = null;

      if (typeof id === "string" && id.length > 10) {
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            personData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
          }
        }
      } else {
        const malId = typeof id === "string" ? parseInt(id) : id;
        
        const response = await fetch(`https://api.jikan.moe/v4/people/${malId}/full`);
        if (!response.ok) return null;
        
        const data = await response.json();
        personData = data.data;
        
        if (personData) {
          const { itemData, externalMapping } = IdMappingService.malToInternal(
            { mal_id: malId, ...personData } as any,
            "person"
          );
          
          internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
        }
      }

      if (!personData || !internalItem) return null;

      return {
        ...personData,
        internalId: internalItem.id,
        externalMappings: internalItem.mappings.map(mapping => ({
          service: mapping.externalService,
          id: mapping.externalId,
          data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
        })),
      };
    } catch (error) {
      console.error("Error in getPersonById:", error);
      return null;
    }
  }

  async searchAnime(query: string, limit = 20): Promise<EnhancedAnimeItem[]> {
    try {
      const results = await jikanAPI.searchAnime(query, limit);
      
      const enhancedResults = await Promise.all(
        results.map(async (anime) => {
          try {
            const { itemData, externalMapping } = IdMappingService.malToInternal(anime, "anime");
            const internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
            
            return {
              ...anime,
              internalId: internalItem.id,
              externalMappings: internalItem.mappings.map(mapping => ({
                service: mapping.externalService,
                id: mapping.externalId,
                data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
              })),
            };
          } catch (error) {
            console.error("Error enhancing anime result:", error);
            return anime;
          }
        })
      );

      return enhancedResults;
    } catch (error) {
      console.error("Error in searchAnime:", error);
      return [];
    }
  }

  async searchCharacters(query: string, limit = 20): Promise<EnhancedCharacterItem[]> {
    try {
      const results = await jikanAPI.searchCharacters(query, limit);
      
      const enhancedResults = await Promise.all(
        results.map(async (character) => {
          try {
            const { itemData, externalMapping } = IdMappingService.malToInternal(character, "character");
            const internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
            
            return {
              ...character,
              internalId: internalItem.id,
              externalMappings: internalItem.mappings.map(mapping => ({
                service: mapping.externalService,
                id: mapping.externalId,
                data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
              })),
            };
          } catch (error) {
            console.error("Error enhancing character result:", error);
            return character;
          }
        })
      );

      return enhancedResults;
    } catch (error) {
      console.error("Error in searchCharacters:", error);
      return [];
    }
  }

  async searchPeople(query: string, limit = 20): Promise<EnhancedPersonItem[]> {
    try {
      const results = await jikanAPI.searchPeople(query, limit);
      
      const enhancedResults = await Promise.all(
        results.map(async (person) => {
          try {
            const { itemData, externalMapping } = IdMappingService.malToInternal(person, "person");
            const internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
            
            return {
              ...person,
              internalId: internalItem.id,
              externalMappings: internalItem.mappings.map(mapping => ({
                service: mapping.externalService,
                id: mapping.externalId,
                data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
              })),
            };
          } catch (error) {
            console.error("Error enhancing person result:", error);
            return person;
          }
        })
      );

      return enhancedResults;
    } catch (error) {
      console.error("Error in searchPeople:", error);
      return [];
    }
  }

  async searchManga(query: string, limit = 20): Promise<EnhancedMangaItem[]> {
    try {
      const results = await jikanAPI.searchManga(query, limit);
      
      const enhancedResults = await Promise.all(
        results.map(async (manga) => {
          try {
            const { itemData, externalMapping } = IdMappingService.malToInternal(manga, "manga");
            const internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
            
            return {
              ...manga,
              internalId: internalItem.id,
              externalMappings: internalItem.mappings.map(mapping => ({
                service: mapping.externalService,
                id: mapping.externalId,
                data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
              })),
            };
          } catch (error) {
            console.error("Error enhancing manga result:", error);
            return manga;
          }
        })
      );

      return enhancedResults;
    } catch (error) {
      console.error("Error in searchManga:", error);
      return [];
    }
  }

  async unifiedSearch(query: string, limit = 20): Promise<EnhancedSearchItem[]> {
    try {
      const [animeResults, characterResults, personResults, mangaResults] = await Promise.all([
        this.searchAnime(query, Math.ceil(limit / 4)),
        this.searchCharacters(query, Math.ceil(limit / 4)),
        this.searchPeople(query, Math.ceil(limit / 4)),
        this.searchManga(query, Math.ceil(limit / 4)),
      ]);

      const allResults: EnhancedSearchItem[] = [
        ...animeResults,
        ...characterResults,
        ...personResults,
        ...mangaResults,
      ];

      return allResults.slice(0, limit);
    } catch (error) {
      console.error("Error in unifiedSearch:", error);
      return [];
    }
  }
}

export const enhancedAPI = new EnhancedAPIService();