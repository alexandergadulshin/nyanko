import { sql } from "drizzle-orm";
import { index, pgTableCreator, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

const TABLE_PREFIX = "anime-web_";
const DEFAULT_TIMESTAMP = sql`CURRENT_TIMESTAMP`;

export const createTable = pgTableCreator((name) => `${TABLE_PREFIX}${name}`);

const commonTimestamps = {
  createdAt: (d: any) => d.timestamp({ withTimezone: true }).default(DEFAULT_TIMESTAMP).notNull(),
  updatedAt: (d: any) => d.timestamp({ withTimezone: true }).default(DEFAULT_TIMESTAMP).notNull()
};

const updateTimestamp = (d: any) => d.timestamp({ withTimezone: true }).$onUpdate(() => new Date());

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: commonTimestamps.createdAt(d),
    updatedAt: updateTimestamp(d),
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
  profileVisibility: d.text().default("public"),
  showWatchList: d.boolean().default(true),
  showFavorites: d.boolean().default(true),
  showStats: d.boolean().default(true),
  allowFriendRequests: d.boolean().default(true),
  lastNameChange: d.timestamp({ withTimezone: true }),
  lastUsernameChange: d.timestamp({ withTimezone: true }),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
}));

const sessionFields = (d: any) => ({
  id: d.text().primaryKey(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  token: d.text().notNull().unique(),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
  ipAddress: d.text(),
  userAgent: d.text(),
});

export const session = createTable("session", (d) => ({
  ...sessionFields(d),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
}));

const accountFields = (d: any) => ({
  id: d.text().primaryKey(),
  accountId: d.text().notNull(),
  providerId: d.text().notNull(),
  accessToken: d.text(),
  refreshToken: d.text(),
  idToken: d.text(),
  accessTokenExpiresAt: d.timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: d.timestamp({ withTimezone: true }),
  scope: d.text(),
  password: d.text(),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
});

export const account = createTable("account", (d) => ({
  ...accountFields(d),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
}));

export const verification = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
}));

const baseAnimeFields = (d: any) => ({
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
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
});

export const animeList = createTable("anime_list", (d) => ({
  ...baseAnimeFields(d),
}), (t) => [
  index("user_anime_idx").on(t.userId, t.animeId),
  index("status_idx").on(t.status),
]);

const favoritesFields = (d: any) => ({
  id: d.text().primaryKey(),
  userId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  type: d.text().notNull(),
  itemId: d.integer().notNull(),
  itemTitle: d.text().notNull(),
  itemImage: d.text(),
  itemData: d.text(),
  createdAt: commonTimestamps.createdAt(d),
});

export const favorites = createTable("favorites", (d) => ({
  ...favoritesFields(d),
}), (t) => [
  index("user_favorites_idx").on(t.userId, t.type),
  index("user_item_idx").on(t.userId, t.itemId),
]);

const itemFields = (d: any) => ({
  id: d.text().primaryKey(),
  type: d.text().notNull(),
  title: d.text().notNull(),
  description: d.text(),
  image: d.text(),
  metadata: d.text(),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
});

export const items = createTable("items", (d) => ({
  ...itemFields(d),
}), (t) => [
  index("items_type_idx").on(t.type),
  index("items_title_idx").on(t.title),
]);

const externalMappingFields = (d: any) => ({
  id: d.text().primaryKey(),
  internalId: d.text().notNull().references(() => items.id, { onDelete: "cascade" }),
  externalService: d.text().notNull(),
  externalId: d.text().notNull(),
  externalData: d.text(),
  lastSyncAt: d.timestamp({ withTimezone: true }),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
});

export const externalIdMappings = createTable("external_id_mappings", (d) => ({
  ...externalMappingFields(d),
}), (t) => [
  index("external_mappings_internal_idx").on(t.internalId),
  index("external_mappings_service_idx").on(t.externalService, t.externalId),
  index("external_mappings_lookup_idx").on(t.externalService, t.externalId, t.internalId),
]);

const friendRequestFields = (d: any) => ({
  id: d.text().primaryKey(),
  fromUserId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  toUserId: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  status: d.text().notNull().default("pending"),
  message: d.text(),
  createdAt: commonTimestamps.createdAt(d),
  updatedAt: commonTimestamps.updatedAt(d),
});

export const friendRequests = createTable("friend_requests", (d) => ({
  ...friendRequestFields(d),
}), (t) => [
  index("friend_requests_to_user_idx").on(t.toUserId, t.status),
  index("friend_requests_from_user_idx").on(t.fromUserId, t.status),
  index("friend_requests_unique_idx").on(t.fromUserId, t.toUserId),
]);

export const friendships = createTable("friendships", (d) => ({
  id: d.text().primaryKey(),
  userId1: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  userId2: d.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: commonTimestamps.createdAt(d),
}), (t) => [
  index("friendships_user1_idx").on(t.userId1),
  index("friendships_user2_idx").on(t.userId2),
  index("friendships_unique_idx").on(t.userId1, t.userId2),
]);