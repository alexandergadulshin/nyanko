import { db } from "~/server/db";
import { items, externalIdMappings } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface InternalItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  image?: string | null;
  metadata?: string | null;
}

export interface ExternalMapping {
  id: string;
  internalId: string;
  externalService: string;
  externalId: string;
  externalData?: string | null;
  lastSyncAt?: Date | null;
}

export interface ItemWithMappings extends InternalItem {
  mappings: ExternalMapping[];
}

export class IdMappingService {
  /**
   * Get internal item by external ID
   */
  static async getByExternalId(
    externalService: string,
    externalId: string
  ): Promise<ItemWithMappings | null> {
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({
        item: {
          id: items.id,
          type: items.type,
          title: items.title,
          description: items.description,
          image: items.image,
          metadata: items.metadata,
        },
        mapping: {
          id: externalIdMappings.id,
          internalId: externalIdMappings.internalId,
          externalService: externalIdMappings.externalService,
          externalId: externalIdMappings.externalId,
          externalData: externalIdMappings.externalData,
          lastSyncAt: externalIdMappings.lastSyncAt,
        }
      })
      .from(externalIdMappings)
      .innerJoin(items, eq(externalIdMappings.internalId, items.id))
      .where(
        and(
          eq(externalIdMappings.externalService, externalService),
          eq(externalIdMappings.externalId, externalId)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const { item, mapping } = result[0]!;
    return {
      ...item,
      mappings: [mapping],
    };
  }

  /**
   * Get all external mappings for an internal item
   */
  static async getMappingsForItem(internalId: string): Promise<ExternalMapping[]> {
    if (!db) throw new Error("Database not available");

    const mappings = await db
      .select({
        id: externalIdMappings.id,
        internalId: externalIdMappings.internalId,
        externalService: externalIdMappings.externalService,
        externalId: externalIdMappings.externalId,
        externalData: externalIdMappings.externalData,
        lastSyncAt: externalIdMappings.lastSyncAt,
      })
      .from(externalIdMappings)
      .where(eq(externalIdMappings.internalId, internalId));

    return mappings;
  }

  /**
   * Create or get existing item with external mapping
   */
  static async createOrGetItem(
    itemData: {
      type: string;
      title: string;
      description?: string;
      image?: string;
      metadata?: unknown;
    },
    externalMapping: {
      service: string;
      id: string;
      data?: unknown;
    }
  ): Promise<ItemWithMappings> {
    if (!db) throw new Error("Database not available");

    // Check if mapping already exists
    const existing = await this.getByExternalId(
      externalMapping.service,
      externalMapping.id
    );

    if (existing) {
      // Update external data if provided
      if (externalMapping.data) {
        await db
          .update(externalIdMappings)
          .set({
            externalData: JSON.stringify(externalMapping.data),
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(externalIdMappings.externalService, externalMapping.service),
              eq(externalIdMappings.externalId, externalMapping.id)
            )
          );
      }
      return existing;
    }

    // Create new item and mapping
    const internalId = uuidv4();

    const newItem = await db
      .insert(items)
      .values({
        id: internalId,
        type: itemData.type,
        title: itemData.title,
        description: itemData.description || null,
        image: itemData.image || null,
        metadata: itemData.metadata ? JSON.stringify(itemData.metadata) : null,
      })
      .returning();

    const mappingId = uuidv4();
    const newMapping = await db
      .insert(externalIdMappings)
      .values({
        id: mappingId,
        internalId,
        externalService: externalMapping.service,
        externalId: externalMapping.id,
        externalData: externalMapping.data ? JSON.stringify(externalMapping.data) : null,
        lastSyncAt: new Date(),
      })
      .returning();

    return {
      ...newItem[0],
      mappings: [newMapping[0]],
    };
  }

  /**
   * Add external mapping to existing internal item
   */
  static async addMapping(
    internalId: string,
    externalMapping: {
      service: string;
      id: string;
      data?: unknown;
    }
  ): Promise<ExternalMapping> {
    if (!db) throw new Error("Database not available");

    // Check if mapping already exists
    const existing = await db
      .select()
      .from(externalIdMappings)
      .where(
        and(
          eq(externalIdMappings.internalId, internalId),
          eq(externalIdMappings.externalService, externalMapping.service),
          eq(externalIdMappings.externalId, externalMapping.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing mapping
      const updated = await db
        .update(externalIdMappings)
        .set({
          externalData: externalMapping.data ? JSON.stringify(externalMapping.data) : null,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(externalIdMappings.id, existing[0].id))
        .returning();

      return updated[0];
    }

    // Create new mapping
    const mappingId = uuidv4();
    const newMapping = await db
      .insert(externalIdMappings)
      .values({
        id: mappingId,
        internalId,
        externalService: externalMapping.service,
        externalId: externalMapping.id,
        externalData: externalMapping.data ? JSON.stringify(externalMapping.data) : null,
        lastSyncAt: new Date(),
      })
      .returning();

    return newMapping[0];
  }

  /**
   * Update item data
   */
  static async updateItem(
    internalId: string,
    updates: {
      title?: string;
      description?: string;
      image?: string;
      metadata?: unknown;
    }
  ): Promise<InternalItem> {
    if (!db) throw new Error("Database not available");

    const updated = await db
      .update(items)
      .set({
        ...updates,
        metadata: updates.metadata ? JSON.stringify(updates.metadata) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(items.id, internalId))
      .returning();

    return updated[0];
  }

  /**
   * Helper: Convert MyAnimeList data to internal format
   */
  static malToInternal(malData: {
    mal_id: number;
    title?: string;
    name?: string;
    synopsis?: string;
    about?: string;
    images?: { jpg?: { image_url?: string } };
    type?: string;
    [key: string]: unknown;
  }, itemType: "anime" | "manga" | "character" | "person"): {
    itemData: {
      type: string;
      title: string;
      description?: string;
      image?: string;
      metadata: unknown;
    };
    externalMapping: {
      service: string;
      id: string;
      data: unknown;
    };
  } {
    return {
      itemData: {
        type: itemType,
        title: malData.title || malData.name || "Unknown Title",
        description: malData.synopsis || malData.about || undefined,
        image: malData.images?.jpg?.image_url || undefined,
        metadata: malData,
      },
      externalMapping: {
        service: "myanimelist",
        id: malData.mal_id.toString(),
        data: malData,
      },
    };
  }
}