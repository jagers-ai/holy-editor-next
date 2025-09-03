'use client';

/**
 * iOS / Safari / PWA 감지 유틸리티
 * 기능 감지 우선, UA는 보조로 사용
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  // iPhone|iPad|iPod (iPadOS 13+ 는 MacIntel + touch 로 판별)
  const iDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS13Up =
    !iDevice &&
    typeof navigator.platform === 'string' &&
    navigator.platform === 'MacIntel' &&
    (navigator as any).maxTouchPoints > 1;
  return iDevice || iPadOS13Up;
}

export function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/CriOS\//.test(ua) && !/FxiOS\//.test(ua);
  return isIOS() && isSafari;
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS: navigator.standalone, 다른 브라우저: display-mode
  const iosStandalone = (window as any).navigator?.standalone === true;
  const displayModePWA = window.matchMedia?.('(display-mode: standalone)').matches;
  return !!(iosStandalone || displayModePWA);
}

export function applyPlatformClasses() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isIOS()) root.classList.add('is-ios');
  if (isMobileSafari()) root.classList.add('is-mobile-safari');
  if (isStandalonePWA()) root.classList.add('is-standalone');
}

