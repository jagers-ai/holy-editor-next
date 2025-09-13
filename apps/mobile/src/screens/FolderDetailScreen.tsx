import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { extractPlainTextFromTiptap } from '@core/domain/preview';

type Props = NativeStackScreenProps<RootStackParamList, 'FolderDetail'>;

export default function FolderDetailScreen({ route, navigation }: Props) {
  const { folderId } = route.params;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['folderDocs', folderId],
    queryFn: () => trpc.folder.getDocuments.query({ folderId }),
  });

  const documents = data?.documents ?? [];
  return (
    <View style={s.container}>
      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const preview = extractPlainTextFromTiptap(item.content, { limit: 100 });
          return (
            <TouchableOpacity style={s.item} onPress={() => navigation.navigate('Document', { id: item.id })}>
              <Text style={s.title}>{(item.content as any)?.sermonInfo?.title || item.title || '제목 없음'}</Text>
              {!!preview && <Text style={s.preview} numberOfLines={2}>{preview}</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>문서가 없습니다</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', gap: 6 },
  title: { fontSize: 16, fontWeight: '600' },
  preview: { color: '#666' },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
});

