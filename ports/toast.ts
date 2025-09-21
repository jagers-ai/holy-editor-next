export interface ToastPort {
  success(message: string): void;
  error(message: string): void;
  info?(message: string): void;
  warning?(message: string): void;
}
