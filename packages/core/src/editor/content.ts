import type { SermonInfo } from '../domain/sermon';

type JsonLike = Record<string, unknown>;

export function attachSermonInfo<T extends JsonLike>(contentJson: T | undefined, info: SermonInfo): T & JsonLike {
  const emptyDoc = { type: 'doc', content: [] as unknown[] } as JsonLike as T;
  const base = (contentJson ?? emptyDoc) as T & JsonLike;
  return {
    ...base,
    sermonInfo: {
      title: info.title,
      pastor: info.pastor,
      verse: info.verse,
      serviceType: info.serviceType,
    },
  } as T & JsonLike;
}

