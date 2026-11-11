import { z } from "zod";
import {
  lockSchema,
  secretSchema,
  photoSchema,
  photoAssetSchema,
  DEFAULT_VAULT_FOLDER,
} from "@signalsafe/simulator-core/apps/contracts";
import {
  isRegionalPreferences,
  type RegionalPreferences,
} from "@signalsafe/simulator-react/apps/settings/regionalFormats";

export const homePageIds = ["settings", "vault", "photos"] as const;
export type HomePageId = (typeof homePageIds)[number];
export const homeSettingsSchema = z.object({
  lock: lockSchema.optional(),
  appearance: z
    .object({
      background: z.string().regex(/^#[0-9a-f]{6}$/i),
      accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    })
    .optional(),
  regional: z.custom<RegionalPreferences>(isRegionalPreferences).optional(),
});
export const homeContentSchema = z.object({
  settings: homeSettingsSchema.default({}),
  vault: z
    .object({
      folders: z.array(z.string().trim().min(1).max(200)).max(1000),
      items: z.array(z.object({ ...secretSchema.shape, title: z.string().max(200) })).max(1000),
    })
    .default({ folders: [DEFAULT_VAULT_FOLDER], items: [] }),
  photos: z
    .object({
      items: z
        .array(
          z.object({
            ...photoSchema.shape,
            title: z.string().max(200),
            asset: z.union([
              photoAssetSchema,
              z.object({ name: z.string(), mime: z.literal("image/png"), data: z.literal("") }),
            ]),
          }),
        )
        .max(500),
    })
    .default({ items: [] }),
});
export type HomeContent = z.infer<typeof homeContentSchema>;
/** Persisted authoring data uses the same entry contracts as the device apps. */
export function readHomeContent(value: unknown): HomeContent {
  return homeContentSchema.parse(value ?? {});
}

export function homeContentComplete(value: unknown): boolean {
  const parsed = homeContentSchema.safeParse(value);
  return (
    parsed.success &&
    parsed.data.vault.items.every((item) => secretSchema.safeParse(item).success) &&
    parsed.data.photos.items.every((item) => photoSchema.safeParse(item).success)
  );
}

/** Folder operations preserve entries; empty deletions need no recovery folder. */
export function changeVaultFolder(
  value: HomeContent["vault"],
  from: string | null,
  to: string | null,
  destination: string,
): HomeContent["vault"] {
  const target = to ?? destination;
  const hasEntries = value.items.some((item) => item.folder === from);
  return {
    folders: [
      ...new Set([
        ...value.folders.filter((folder) => folder !== from),
        ...(to !== null || hasEntries ? [target] : []),
      ]),
    ],
    items: value.items.map((item) => (item.folder === from ? { ...item, folder: target } : item)),
  };
}
