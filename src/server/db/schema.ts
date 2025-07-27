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
