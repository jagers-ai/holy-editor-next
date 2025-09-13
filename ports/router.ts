export interface RouterPort {
  push: (path: string) => void;
  replace: (path: string) => void;
  prefetch?: (path: string) => void;
}

