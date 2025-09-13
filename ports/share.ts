export interface SharePort {
  share(input: { title?: string; url?: string; text?: string }): Promise<void>;
}

