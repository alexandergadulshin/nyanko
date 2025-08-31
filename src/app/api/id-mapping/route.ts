import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { items, externalIdMappings } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// GET /api/id-mapping - Get internal item by external ID
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const externalService = searchParams.get("service"); // e.g., "myanimelist"
    const externalId = searchParams.get("external_id");
    const internalId = searchParams.get("internal_id");

    if (!externalService) {
      return NextResponse.json({ error: "Missing service parameter" }, { status: 400 });
    }

    if (externalId) {
      // Look up internal item by external ID
      const mapping = await db
        .select({
          internalId: externalIdMappings.internalId,
          externalId: externalIdMappings.externalId,
          externalData: externalIdMappings.externalData,
          lastSyncAt: externalIdMappings.lastSyncAt,
          item: {
            id: items.id,
            type: items.type,
            title: items.title,
            description: items.description,
            image: items.image,
            metadata: items.metadata,
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

      if (mapping.length === 0) {
        return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
      }

      return NextResponse.json({ mapping: mapping[0] });
    } else if (internalId) {
      // Look up external mappings by internal ID
      const mappings = await db
        .select({
          internalId: externalIdMappings.internalId,
          externalService: externalIdMappings.externalService,
          externalId: externalIdMappings.externalId,
          externalData: externalIdMappings.externalData,
          lastSyncAt: externalIdMappings.lastSyncAt,
        })
        .from(externalIdMappings)
        .where(
          and(
            eq(externalIdMappings.internalId, internalId),
            eq(externalIdMappings.externalService, externalService)
          )
        );

      return NextResponse.json({ mappings });
    } else {
      return NextResponse.json({ error: "Missing external_id or internal_id parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching ID mapping:", error);
    return NextResponse.json(
      { error: "Failed to fetch ID mapping" },
      { status: 500 }
    );
  }
}

// POST /api/id-mapping - Create new item with external ID mapping
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // Only allow authenticated users to create mappings (could be admin-only in production)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      type: string;
      title: string;
      description?: string;
      image?: string;
      metadata?: unknown;
      externalService: string;
      externalId: string;
      externalData?: unknown;
    };

    const {
      type,
      title,
      description,
      image,
      metadata,
      externalService,
      externalId,
      externalData,
    } = body;

    if (!type || !title || !externalService || !externalId) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, externalService, externalId" },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await db
      .select()
      .from(externalIdMappings)
      .where(
        and(
          eq(externalIdMappings.externalService, externalService),
          eq(externalIdMappings.externalId, externalId)
        )
      )
      .limit(1);

    if (existingMapping.length > 0) {
      return NextResponse.json(
        { error: "Mapping already exists for this external ID" },
        { status: 409 }
      );
    }

    // Create internal item
    const internalId = uuidv4();
    const newItem = await db
      .insert(items)
      .values({
        id: internalId,
        type,
        title,
        description: description || null,
        image: image || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    // Create external ID mapping
    const mappingId = uuidv4();
    const newMapping = await db
      .insert(externalIdMappings)
      .values({
        id: mappingId,
        internalId,
        externalService,
        externalId,
        externalData: externalData ? JSON.stringify(externalData) : null,
        lastSyncAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      item: newItem[0],
      mapping: newMapping[0],
    });
  } catch (error) {
    console.error("Error creating ID mapping:", error);
    return NextResponse.json(
      { error: "Failed to create ID mapping" },
      { status: 500 }
    );
  }
}

// PUT /api/id-mapping - Update existing mapping
export async function PUT(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      externalService: string;
      externalId: string;
      externalData?: unknown;
      itemUpdate?: {
        title?: string;
        description?: string;
        image?: string;
        metadata?: unknown;
      };
    };

    const { externalService, externalId, externalData, itemUpdate } = body;

    if (!externalService || !externalId) {
      return NextResponse.json(
        { error: "Missing required fields: externalService, externalId" },
        { status: 400 }
      );
    }

    // Find existing mapping
    const existingMapping = await db
      .select()
      .from(externalIdMappings)
      .where(
        and(
          eq(externalIdMappings.externalService, externalService),
          eq(externalIdMappings.externalId, externalId)
        )
      )
      .limit(1);

    if (existingMapping.length === 0) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }

    const mapping = existingMapping[0];

    // Update mapping
    const updatedMapping = await db
      .update(externalIdMappings)
      .set({
        externalData: externalData ? JSON.stringify(externalData) : mapping.externalData,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalIdMappings.id, mapping.id))
      .returning();

    // Update item if provided
    let updatedItem = null;
    if (itemUpdate) {
      updatedItem = await db
        .update(items)
        .set({
          title: itemUpdate.title || undefined,
          description: itemUpdate.description || undefined,
          image: itemUpdate.image || undefined,
          metadata: itemUpdate.metadata ? JSON.stringify(itemUpdate.metadata) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(items.id, mapping.internalId))
        .returning();
    }

    return NextResponse.json({
      success: true,
      mapping: updatedMapping[0],
      item: updatedItem?.[0],
    });
  } catch (error) {
    console.error("Error updating ID mapping:", error);
    return NextResponse.json(
      { error: "Failed to update ID mapping" },
      { status: 500 }
    );
  }
}