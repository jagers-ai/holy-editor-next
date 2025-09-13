export type ServiceType =
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
  const allowed: ServiceType[] = ['주일설교', '수요예배', '금요예배', '새벽예배', '청년예배', '큐티', '기타'];
  const map: Record<string, ServiceType> = {
    '���ϼ���': '주일설교',
    '�����⵵': '수요예배',
    '�ݿ�⵵': '금요예배',
    '����⵵': '새벽예배',
    '����ȸ': '청년예배',
    '��Ÿ': '기타',
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

