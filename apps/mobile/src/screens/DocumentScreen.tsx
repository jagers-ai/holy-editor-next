import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';

type Props = NativeStackScreenProps<RootStackParamList, 'Document'>;

const renderContent = (content: any) => {
  // 매우 단순한 TipTap JSON 렌더러(본문 텍스트만)
  try {
    const lines: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (typeof node.text === 'string') lines.push(node.text);
      if (Array.isArray(node.content)) node.content.forEach(walk);
    };
    walk(content);
    return lines.join(' ');
  } catch { return ''; }
};

export default function DocumentScreen({ route }: Props) {
  const { id } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['doc', id],
    queryFn: () => trpc.document.getById.query({ id }),
  });

  if (isLoading) return <View style={s.container}><Text>로딩 중...</Text></View>;
  if (!data) return <View style={s.container}><Text>문서를 찾을 수 없습니다</Text></View>;

  const title = (data.content as any)?.sermonInfo?.title || data.title || '제목 없음';
  const body = renderContent(data.content);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{body}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22 },
});

