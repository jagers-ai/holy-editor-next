'use client';

/**
 * Android 및 Android Chrome 감지 유틸리티
 * User Agent 기반 감지 + 기능 감지 조합
 */

/**
 * Android 기기 감지
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

/**
 * Android Chrome 브라우저 감지
 */
export function isAndroidChrome(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  // Android이면서 Chrome인 경우 (Samsung Internet 등 제외)
  return /android/.test(ua) && /chrome/.test(ua) && !/samsungbrowser/.test(ua);
}

/**
 * Android에서 키보드가 열렸는지 감지
 * viewport 높이 변화를 기준으로 판단
 */
export function isAndroidKeyboardOpen(initialHeight: number): boolean {
  if (!isAndroid()) return false;
  if (typeof window === 'undefined') return false;
  
  // Android에서는 키보드가 열리면 window.innerHeight가 감소
  // 일반적으로 100px 이상 차이나면 키보드가 열린 것으로 판단
  const currentHeight = window.innerHeight;
  const heightDiff = initialHeight - currentHeight;
  
  return heightDiff > 100;
}

/**
 * Android 플랫폼별 클래스 적용
 */
export function applyAndroidClasses() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isAndroid()) {
    root.classList.add('is-android');
    if (isAndroidChrome()) {
      root.classList.add('is-android-chrome');
    }
  }
}

/**
 * Android에서 viewport 높이 가져오기
 * VisualViewport가 불안정한 경우 window.innerHeight 사용
 */
export function getAndroidViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  
  // Android Chrome에서 visualViewport가 있어도 불안정할 수 있음
  if (isAndroidChrome() && window.visualViewport) {
    // visualViewport.height가 0이거나 너무 작으면 fallback
    const vvHeight = window.visualViewport.height;
    if (vvHeight > 100) {
      return vvHeight;
    }
  }
  
  // fallback to window.innerHeight
  return window.innerHeight;
}