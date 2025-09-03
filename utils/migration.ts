'use client';

/**
 * localStorage에서 Supabase로 데이터를 마이그레이션하는 유틸리티
 */
export interface LocalStorageDocument {
  id: string;
  title: string;
  content: any;
  sermonInfo?: {
    title?: string;
    pastor?: string;
    verse?: string;
    serviceType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const LOCALSTORAGE_KEY = 'holy-documents';
export const MIGRATION_FLAG_KEY = 'holy-documents-migrated';

/**
 * localStorage에서 문서 가져오기
 */
export function getLocalStorageDocuments(): LocalStorageDocument[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as LocalStorageDocument[];
  } catch (error) {
    console.error('Failed to parse localStorage documents:', error);
    return [];
  }
}

/**
 * 마이그레이션 완료 플래그 설정
 */
export function setMigrationComplete() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

/**
 * 마이그레이션이 이미 완료되었는지 확인
 */
export function isMigrationComplete(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * localStorage 데이터 백업 (안전을 위해)
 */
export function backupLocalStorage() {
  if (typeof window === 'undefined') return;
  
  const documents = getLocalStorageDocuments();
  if (documents.length > 0) {
    const backupKey = `${LOCALSTORAGE_KEY}-backup-${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(documents));
    console.log(`Backed up ${documents.length} documents to ${backupKey}`);
  }
}

/**
 * 마이그레이션 후 localStorage 정리 (선택적)
 */
export function clearLocalStorageDocuments(keepBackup = true) {
  if (typeof window === 'undefined') return;
  
  if (keepBackup) {
    backupLocalStorage();
  }
  
  localStorage.removeItem(LOCALSTORAGE_KEY);
  console.log('Cleared localStorage documents');
}