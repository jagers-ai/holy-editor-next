export type ServiceType =
  | '감사일기'
  | '주일설교'
  | '수요예배'
  | '금요예배'
  | '새벽예배'
  | '청년예배'
  | '큐티'
  | '기타';

export interface SermonInfo {
  title: string;
  pastor: string;
  verse: string;
  serviceType: ServiceType;
}

export function normalizeServiceType(raw?: string): ServiceType {
  if (!raw || typeof raw !== 'string') return '주일설교';
  const allowed: ServiceType[] = ['감사일기', '주일설교', '수요예배', '금요예배', '새벽예배', '청년예배', '큐티', '기타'];
  const map: Record<string, ServiceType> = {
    감사일기: '감사일기',
    주일설교: '주일설교',
    수요예배: '수요예배',
    금요예배: '금요예배',
    새벽예배: '새벽예배',
    청년예배: '청년예배',
    큐티: '큐티',
    기타: '기타',
  };
  if (map[raw]) return map[raw];
  if ((allowed as readonly string[]).includes(raw)) return raw as ServiceType;
  return '기타';
}

export function normalizeSermonInfo(input: Partial<SermonInfo>): SermonInfo {
  return {
    title: input.title ?? '',
    pastor: input.pastor ?? '',
    verse: input.verse ?? '',
    serviceType: normalizeServiceType(input.serviceType),
  };
}
