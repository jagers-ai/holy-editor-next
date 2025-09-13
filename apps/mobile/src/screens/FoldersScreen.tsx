import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';

type Props = NativeStackScreenProps<RootStackParamList, 'Folders'>;

export default function FoldersScreen({ navigation }: Props) {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['folders'],
    queryFn: () => trpc.folder.list.query(),
  });

  const folders = data ?? [];

  return (
    <View style={s.container}>
      <FlatList
        data={folders}
        keyExtractor={(f) => f.id}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.item} onPress={() => navigation.navigate('FolderDetail', { folderId: item.id })}>
            <Text style={s.icon}>{item.icon ?? '📁'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.meta}>{item.documentCount ?? 0}개 문서</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>폴더가 없습니다</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', gap: 12 },
  icon: { fontSize: 20 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 24, color: '#666' },
});

