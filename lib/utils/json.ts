export function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeJson(item));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const result: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      result[key] = canonicalizeJson(val);
    }
    return result;
  }

  return value;
}

export function fingerprintJson(value: unknown): string {
  try {
    const normalized = canonicalizeJson(value);
    const serialized = JSON.stringify(normalized);
    let hash = 5381;
    for (let i = 0; i < serialized.length; i++) {
      hash = ((hash << 5) + hash) ^ serialized.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  } catch {
    return Math.random().toString(36).slice(2, 8);
  }
}
