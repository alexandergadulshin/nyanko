import { sql } from "drizzle-orm";
import { index, pgTableCreator, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `anime-web_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const user = createTable("user", (d) => ({
  id: d.text().primaryKey(),
  name: d.text().notNull(),
  email: d.text().notNull().unique(),
  emailVerified: d.boolean().notNull().default(false),
  image: d.text(),
  username: d.text().unique(),
  bio: d.text(),
  // Privacy settings
  profileVisibility: d.text().default("public"), // "public", "friends", "private"
  showWatchList: d.boolean().default(true),
  showFavorites: d.boolean().default(true),
  showStats: d.boolean().default(true),
  allowFriendRequests: d.boolean().default(true),
  // Rate limiting fields
  lastNameChange: d.timestamp({ withTimezone: true }),
  lastUsernameChange: d.timestamp({ withTimezone: true }),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}));

export const session = createTable("session", (d) => ({
  id: d.text().primaryKey(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  token: d.text().notNull().unique(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  ipAddress: d.text(),
  userAgent: d.text(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
}));

export const account = createTable("account", (d) => ({
  id: d.text().primaryKey(),
  accountId: d.text().notNull(),
  providerId: d.text().notNull(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: d.text(),
  refreshToken: d.text(),
  idToken: d.text(),
  accessTokenExpiresAt: d.timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: d.timestamp({ withTimezone: true }),
  scope: d.text(),
  password: d.text(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}));

export const verification = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}));

export const animeList = createTable("anime_list", (d) => ({
  id: d.text().primaryKey(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  animeId: d.integer().notNull(),
  animeTitle: d.text().notNull(),
  animeImage: d.text(),
  status: d.text().notNull(),
  score: d.integer(),
  episodesWatched: d.integer().default(0),
  totalEpisodes: d.integer(),
  startDate: d.timestamp({ withTimezone: true }),
  finishDate: d.timestamp({ withTimezone: true }),
  notes: d.text(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("user_anime_idx").on(t.userId, t.animeId),
  index("status_idx").on(t.status),
]);

export const favorites = createTable("favorites", (d) => ({
  id: d.text().primaryKey(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  type: d.text().notNull(),
  itemId: d.integer().notNull(),
  itemTitle: d.text().notNull(),
  itemImage: d.text(),
  itemData: d.text(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("user_favorites_idx").on(t.userId, t.type),
  index("user_item_idx").on(t.userId, t.itemId),
]);

// Internal items table - our own ID system
export const items = createTable("items", (d) => ({
  id: d.text().primaryKey(), // Internal UUID
  type: d.text().notNull(), // "anime", "manga", "character", "person"
  title: d.text().notNull(),
  description: d.text(),
  image: d.text(),
  metadata: d.text(), // JSON field for additional data
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("items_type_idx").on(t.type),
  index("items_title_idx").on(t.title),
]);

// Many-to-many mapping between our internal IDs and external service IDs
export const externalIdMappings = createTable("external_id_mappings", (d) => ({
  id: d.text().primaryKey(),
  internalId: d.text().notNull().references(() => items.id, { onDelete: "cascade" }),
  externalService: d.text().notNull(), // "myanimelist", "anilist", "kitsu", etc.
  externalId: d.text().notNull(), // External service's ID (as string to handle different formats)
  externalData: d.text(), // JSON field for cached external data
  lastSyncAt: d.timestamp({ withTimezone: true }),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("external_mappings_internal_idx").on(t.internalId),
  index("external_mappings_service_idx").on(t.externalService, t.externalId),
  index("external_mappings_lookup_idx").on(t.externalService, t.externalId, t.internalId),
]);

// Friend requests table
export const friendRequests = createTable("friend_requests", (d) => ({
  id: d.text().primaryKey(),
  fromUserId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  toUserId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  status: d.text().notNull().default("pending"), // "pending", "accepted", "declined"
  message: d.text(), // Optional message with friend request
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("friend_requests_to_user_idx").on(t.toUserId, t.status),
  index("friend_requests_from_user_idx").on(t.fromUserId, t.status),
  index("friend_requests_unique_idx").on(t.fromUserId, t.toUserId),
]);

// Friendships table (accepted friend requests become friendships)
export const friendships = createTable("friendships", (d) => ({
  id: d.text().primaryKey(),
  userId1: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  userId2: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}), (t) => [
  index("friendships_user1_idx").on(t.userId1),
  index("friendships_user2_idx").on(t.userId2),
  index("friendships_unique_idx").on(t.userId1, t.userId2),
]);
