export interface AutoSaveOptions<Payload = unknown, Content = unknown> {
  onSave: (payload: Payload) => Promise<void>;
  isDirty: () => boolean;
  getHash: (json: Content) => string;
  build?: () => Payload;
  intervalMs?: number;
}

export function createAutoSave<Payload = unknown, Content = unknown>(opts: AutoSaveOptions<Payload, Content>) {
  const interval = opts.intervalMs ?? 5_000;
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastHash: string | undefined;
  let running = false;

  const tick = async () => {
    if (!running) return;
    if (!opts.isDirty()) return;
    try {
      const payload = opts.build ? opts.build() : (undefined as unknown as Payload);
      const contentForHash = (payload as unknown as { content?: Content })?.content as Content | undefined;
      const hash = opts.getHash(contentForHash as Content);
      if (lastHash === hash) return;
      await opts.onSave(payload);
      lastHash = hash;
    } catch {
      // swallow
    }
  };

  return {
    start() {
      if (timer) return;
      running = true;
      timer = setInterval(tick, interval);
    },
    stop() {
      running = false;
      if (timer) clearInterval(timer);
      timer = undefined;
    },
    markDirty() {
      // noop: 외부 dirtyRef로 관리, 확장 포인트
    },
  };
}
