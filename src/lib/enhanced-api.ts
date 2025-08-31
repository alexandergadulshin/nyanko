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
  /**
   * Get anime by internal ID or MAL ID, with automatic mapping creation
   */
  async getAnimeById(id: string | number): Promise<EnhancedAnimeItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let malData: AnimeItem | null = null;

      if (typeof id === "string" && id.length > 10) {
        // Looks like internal UUID
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            // Try to get fresh data from MAL
            try {
              malData = await jikanAPI.getAnimeById(parseInt(malMapping.externalId));
            } catch (err) {
              // Fallback to cached data
              malData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
            }
          }
        }
      } else {
        // MAL ID - fetch from MAL and create/update mapping
        const malId = typeof id === "string" ? parseInt(id) : id;
        malData = await jikanAPI.getAnimeById(malId);
        
        if (malData) {
          // Create or update internal mapping
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

  /**
   * Get character by internal ID or MAL ID, with automatic mapping creation
   */
  async getCharacterById(id: string | number): Promise<EnhancedCharacterItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let characterData: any = null;

      if (typeof id === "string" && id.length > 10) {
        // Internal UUID
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            characterData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
          }
        }
      } else {
        // MAL ID - fetch from external source and create mapping
        const malId = typeof id === "string" ? parseInt(id) : id;
        
        // Fetch character data from Jikan API
        try {
          const response = await fetch(`https://api.jikan.moe/v4/characters/${malId}/full`);
          if (response.ok) {
            const data = await response.json();
            characterData = data.data;
            
            // Create internal mapping
            const { itemData, externalMapping } = IdMappingService.malToInternal(
              characterData,
              "character"
            );
            
            internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
          }
        } catch (err) {
          console.error("Error fetching character from MAL:", err);
        }
      }

      if (!characterData || !internalItem) return null;

      const characterItem: CharacterItem = {
        id: characterData.mal_id,
        malId: characterData.mal_id,
        name: characterData.name,
        description: characterData.about || "No description available.",
        image: characterData.images?.jpg?.image_url || "",
        favorites: characterData.favorites || 0,
        about: characterData.about,
      };

      return {
        ...characterItem,
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

  /**
   * Get person by internal ID or MAL ID, with automatic mapping creation
   */
  async getPersonById(id: string | number): Promise<EnhancedPersonItem | null> {
    try {
      let internalItem: ItemWithMappings | null = null;
      let personData: any = null;

      if (typeof id === "string" && id.length > 10) {
        // Internal UUID
        internalItem = await IdMappingService.getByExternalId("myanimelist", id);
        if (internalItem) {
          const malMapping = internalItem.mappings.find(m => m.externalService === "myanimelist");
          if (malMapping) {
            personData = malMapping.externalData ? JSON.parse(malMapping.externalData) : null;
          }
        }
      } else {
        // MAL ID - fetch from external source and create mapping
        const malId = typeof id === "string" ? parseInt(id) : id;
        
        try {
          const response = await fetch(`https://api.jikan.moe/v4/people/${malId}/full`);
          if (response.ok) {
            const data = await response.json();
            personData = data.data;
            
            // Create internal mapping
            const { itemData, externalMapping } = IdMappingService.malToInternal(
              personData,
              "person"
            );
            
            internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
          }
        } catch (err) {
          console.error("Error fetching person from MAL:", err);
        }
      }

      if (!personData || !internalItem) return null;

      const personItem: PersonItem = {
        id: personData.mal_id,
        malId: personData.mal_id,
        name: personData.name,
        description: personData.about || "No description available.",
        image: personData.images?.jpg?.image_url || "",
        favorites: personData.favorites || 0,
        about: personData.about,
      };

      return {
        ...personItem,
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

  /**
   * Search with enhanced results that include internal IDs
   */
  async searchMultiCategory(
    query: string,
    category: "anime" | "characters" | "people" | "manga",
    limit: number = 25
  ): Promise<EnhancedSearchItem[]> {
    try {
      // Use existing search functionality
      const searchResults = await jikanAPI.searchMultiCategory(query, category, limit);
      
      // Enhance results with internal IDs (create mappings as needed)
      const enhancedResults: EnhancedSearchItem[] = [];
      
      for (const item of searchResults) {
        try {
          const { itemData, externalMapping } = IdMappingService.malToInternal(
            { mal_id: item.malId, ...item } as any,
            category.replace("people", "person") as "anime" | "manga" | "character" | "person"
          );
          
          const internalItem = await IdMappingService.createOrGetItem(itemData, externalMapping);
          
          enhancedResults.push({
            ...item,
            internalId: internalItem.id,
            externalMappings: internalItem.mappings.map(mapping => ({
              service: mapping.externalService,
              id: mapping.externalId,
              data: mapping.externalData ? JSON.parse(mapping.externalData) : undefined,
            })),
          });
        } catch (error) {
          console.error(`Error enhancing search result for ${item.malId}:`, error);
          // Include without enhancement
          enhancedResults.push(item as EnhancedSearchItem);
        }
      }
      
      return enhancedResults;
    } catch (error) {
      console.error("Error in enhanced search:", error);
      return [];
    }
  }

  /**
   * Get internal ID from MAL ID (without fetching external data)
   */
  async getInternalId(malId: number, type: "anime" | "manga" | "character" | "person"): Promise<string | null> {
    try {
      const mapping = await IdMappingService.getByExternalId("myanimelist", malId.toString());
      return mapping?.id || null;
    } catch (error) {
      console.error("Error getting internal ID:", error);
      return null;
    }
  }

  /**
   * Get MAL ID from internal ID
   */
  async getMalId(internalId: string): Promise<number | null> {
    try {
      const mappings = await IdMappingService.getMappingsForItem(internalId);
      const malMapping = mappings.find(m => m.externalService === "myanimelist");
      return malMapping ? parseInt(malMapping.externalId) : null;
    } catch (error) {
      console.error("Error getting MAL ID:", error);
      return null;
    }
  }
}

export const enhancedAPI = new EnhancedAPIService();