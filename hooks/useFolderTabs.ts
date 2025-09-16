import { useCallback, useEffect, useMemo, useState } from 'react';

export type FolderTab = {
  id: string;
  name: string;
  icon?: string | null;
  visible: boolean;
};

export type FolderPreference = {
  order: string[];
  hidden: string[];
};

const STORAGE_KEY = 'holy-editor-folder-tabs-v1';

const DEFAULT_TAB: FolderTab = {
  id: 'all',
  name: '전체',
  icon: '📁',
  visible: true,
};

const readPreference = (): FolderPreference | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FolderPreference;
    if (!Array.isArray(parsed.order) || !Array.isArray(parsed.hidden)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writePreference = (pref: FolderPreference) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
};

export const useFolderTabs = () => {
  const [tabs, setTabs] = useState<FolderTab[]>([DEFAULT_TAB]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [preference, setPreference] = useState<FolderPreference | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPreference(readPreference());
  }, []);

  const replaceFromFolders = useCallback(
    (folders: Array<{ id: string; name: string; icon?: string | null }>) => {
      setTabs((prevTabs) => {
        const pref = preference ?? readPreference();
        const baseOrder = ['all', ...folders.map((f) => f.id)];
        let order = baseOrder;
        let hiddenSet = new Set<string>();

        if (pref) {
          const dedup: string[] = [];
          pref.order.forEach((id) => {
            if (baseOrder.includes(id) && !dedup.includes(id)) {
              dedup.push(id);
            }
          });
          baseOrder.forEach((id) => {
            if (!dedup.includes(id)) {
              dedup.push(id);
            }
          });
          order = dedup;
          hiddenSet = new Set(pref.hidden.filter((id) => id !== 'all'));
        }

        const folderMap = new Map(folders.map((f) => [f.id, f]));
        const nextTabs: FolderTab[] = [];

        order.forEach((id) => {
          if (id === 'all') {
            nextTabs.push({ ...DEFAULT_TAB });
            return;
          }
          const folder = folderMap.get(id);
          if (!folder) return;
          nextTabs.push({
            id: folder.id,
            name: folder.name,
            icon: folder.icon,
            visible: !hiddenSet.has(folder.id),
          });
        });

        folders.forEach((folder) => {
          if (!nextTabs.some((tab) => tab.id === folder.id)) {
            nextTabs.push({
              id: folder.id,
              name: folder.name,
              icon: folder.icon,
              visible: true,
            });
          }
        });

        return nextTabs.map((tab) =>
          tab.id === 'all'
            ? { ...DEFAULT_TAB }
            : tab
        );
      });
    },
    [preference]
  );

  const persistTabs = useCallback(
    (nextTabs: FolderTab[]) => {
      const normalized = nextTabs.map((tab) =>
        tab.id === 'all'
          ? { ...DEFAULT_TAB }
          : { ...tab, visible: tab.visible !== false }
      );
      setTabs(normalized);

      const pref: FolderPreference = {
        order: normalized.map((tab) => tab.id),
        hidden: normalized
          .filter((tab) => !tab.visible && tab.id !== 'all')
          .map((tab) => tab.id),
      };
      writePreference(pref);
      setPreference(pref);
    },
    []
  );

  const visibleTabs = useMemo(() => tabs.filter((tab) => tab.visible), [tabs]);

  useEffect(() => {
    if (!tabs.length) return;
    const visible = tabs.filter((tab) => tab.visible);
    if (visible.some((tab) => tab.id === selectedTab)) return;

    const fallback = visible.find((tab) => tab.id === 'all') ?? visible[0] ?? tabs[0];
    if (fallback) {
      setSelectedTab(fallback.id);
    }
  }, [tabs, selectedTab]);

  return {
    tabs,
    visibleTabs,
    selectedTab,
    setSelectedTab,
    replaceFromFolders,
    persistTabs,
  };
};

