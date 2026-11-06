import { eq } from "drizzle-orm";
import { siteSetting } from "@/database/drizzle/schema";
import { createDrizzleDb } from "@/database/drizzle";

export type PublicSiteSettings = {
  name: string;
  subtitle: string | null;
  siteUrl: string | null;
  logo: string | null;
  logoIcon: string | null;
  notice: string | null;
  supportContact: string | null;
  footerText: string | null;
  orderNotice: string | null;
};

type SiteSettingRecord = typeof siteSetting.$inferSelect;

type CacheEntry = {
  value: SiteSettingRecord;
  expiresAt: number;
};

const CACHE_TTL_MS = 60_000;
let settingsCache: CacheEntry | null = null;

export const DEFAULT_FOOTER_TEXT = "";
export const DEFAULT_SUPPORT_CONTACT = "";

const defaultSettings: SiteSettingRecord = {
  id: 1,
  siteName: "CFFK-Shop",
  siteUrl: null,
  siteSubtitle: null,
  logo: null,
  logoIcon: null,
  notice: null,
  supportContact: null,
  footerText: null,
  orderNotice: null,
  headCode: null,
  footerCode: null,
  registrationEnabled: false,
  timezone: "Asia/Shanghai",
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

async function querySettings(database: D1Database) {
  const db = createDrizzleDb(database);
  const [record] = await db.select().from(siteSetting).where(eq(siteSetting.id, 1)).limit(1);
  return record ?? defaultSettings;
}

export async function getSiteSettings(database: D1Database) {
  if (settingsCache && settingsCache.expiresAt > Date.now()) return settingsCache.value;

  const value = await querySettings(database);
  settingsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export function invalidateSiteSettings(_database?: D1Database) {
  settingsCache = null;
}

export function toPublicSiteSettings(record: SiteSettingRecord): PublicSiteSettings {
  let footer = record.footerText?.trim() || null;
  if (footer && (footer === "© 2026 CFFK 基于 GitHub 开源" || footer.includes("© 2026 CFFK 基于 GitHub 开源"))) {
    footer = footer.replace("© 2026 CFFK 基于 GitHub 开源", "").trim() || null;
  }

  let support = record.supportContact?.trim() || null;
  if (support) {
    const lines = support
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => Boolean(line) && line !== "TG互助群|https://t.me/edgeKeyGroup");
    support = lines.length ? lines.join("\n") : null;
  }

  return {
    name: record.siteName,
    subtitle: record.siteSubtitle,
    siteUrl: record.siteUrl,
    logo: record.logo,
    logoIcon: record.logoIcon || record.logo,
    notice: record.notice,
    supportContact: support || (DEFAULT_SUPPORT_CONTACT || null),
    footerText: footer || (DEFAULT_FOOTER_TEXT || null),
    orderNotice: record.orderNotice,
  };
}
