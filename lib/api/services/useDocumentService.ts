'use client';

import { useMemo } from 'react';
import { api } from '@/utils/api';
import type {
  DocumentCreateInput,
  DocumentListParams,
  DocumentListResult,
  DocumentService,
  DocumentUpdateInput,
} from 'core';

export function useDocumentService(): DocumentService {
  const utils = api.useUtils();
  const createMutation = api.document.create.useMutation();
  const updateMutation = api.document.update.useMutation();
  const deleteMutation = api.document.delete.useMutation();
  const restoreMutation = api.document.restoreFromRevision.useMutation();

  return useMemo(() => {
    const list: DocumentService['list'] = async (params?: DocumentListParams): Promise<DocumentListResult> => {
      const result = await utils.document.list.fetch(params ?? {});
      return {
        documents: result.documents,
        nextCursor: result.nextCursor,
      };
    };

    const getById: DocumentService['getById'] = async (id) => {
      return utils.document.getById.fetch({ id });
    };

    const create: DocumentService['create'] = async (input: DocumentCreateInput) => {
      return createMutation.mutateAsync(input);
    };

    const update: DocumentService['update'] = async (id, input: DocumentUpdateInput) => {
      const { expectedHash, ...data } = input;
      return updateMutation.mutateAsync({ id, data, expectedHash });
    };

    const remove: DocumentService['delete'] = async (id) => {
      await deleteMutation.mutateAsync({ id });
    };

    const getRevisions: DocumentService['getRevisions'] = async (documentId, limit) => {
      return utils.document.revisions.fetch({ documentId, limit });
    };

    const restoreFromRevision: DocumentService['restoreFromRevision'] = async (documentId, revisionId) => {
      return restoreMutation.mutateAsync({ documentId, revisionId });
    };

    return {
      list,
      getById,
      create,
      update,
      delete: remove,
      getRevisions,
      restoreFromRevision,
    };
  }, [createMutation, deleteMutation, restoreMutation, updateMutation, utils]);
}
