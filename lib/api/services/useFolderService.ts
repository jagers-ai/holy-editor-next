'use client';

import { useMemo } from 'react';
import { api } from '@/utils/api';
import type {
  FolderCreateInput,
  FolderService,
  FolderUpdateInput,
  MoveDocumentsInput,
  MoveDocumentsResult,
  NormalizeResult,
} from 'core';

export function useFolderService(): FolderService {
  const utils = api.useUtils();
  const createMutation = api.folder.create.useMutation();
  const updateMutation = api.folder.update.useMutation();
  const deleteMutation = api.folder.delete.useMutation();
  const moveMutation = api.folder.moveDocuments.useMutation();
  const normalizeMutation = api.folder.normalizeUncategorized.useMutation();

  return useMemo(() => {
    const list: FolderService['list'] = async () => {
      return utils.folder.list.fetch();
    };

    const getById: FolderService['getById'] = async (id) => {
      return utils.folder.getById.fetch({ id });
    };

    const getDocuments: FolderService['getDocuments'] = async (folderId) => {
      const result = await utils.folder.getDocuments.fetch({ folderId });
      return result.documents;
    };

    const create: FolderService['create'] = async (input: FolderCreateInput) => {
      return createMutation.mutateAsync(input);
    };

    const update: FolderService['update'] = async (input: FolderUpdateInput) => {
      return updateMutation.mutateAsync(input);
    };

    const remove: FolderService['delete'] = async (id) => {
      await deleteMutation.mutateAsync({ id });
    };

    const moveDocuments: FolderService['moveDocuments'] = async (input: MoveDocumentsInput): Promise<MoveDocumentsResult> => {
      return moveMutation.mutateAsync(input);
    };

    const normalizeUncategorized: FolderService['normalizeUncategorized'] = async (): Promise<NormalizeResult> => {
      return normalizeMutation.mutateAsync();
    };

    return {
      list,
      getById,
      getDocuments,
      create,
      update,
      delete: remove,
      moveDocuments,
      normalizeUncategorized,
    };
  }, [createMutation, deleteMutation, moveMutation, normalizeMutation, updateMutation, utils]);
}
