import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const folderRouter = createTRPCRouter({
  // 폴더 수정 (이름/아이콘/색상)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, '폴더명은 필수입니다').optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!folder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '폴더를 찾을 수 없습니다' });
      }

      // 이름 중복 검사 (동일 사용자 내)
      if (input.name && input.name !== folder.name) {
        const dup = await ctx.prisma.folder.findFirst({
          where: { userId: ctx.user.id, name: input.name, NOT: { id: input.id } },
        });
        if (dup) {
          throw new TRPCError({ code: 'CONFLICT', message: '같은 이름의 폴더가 이미 존재합니다' });
        }
      }

      const updated = await ctx.prisma.folder.update({
        where: { id: input.id },
        data: {
          name: input.name ?? folder.name,
          icon: input.icon ?? folder.icon,
          color: input.color ?? folder.color,
        },
      });

      return updated;
    }),
  // 미분류 폴더 생성 보장 및 폴더 미지정 문서 일괄 이동
  normalizeUncategorized: protectedProcedure
    .mutation(async ({ ctx }) => {
      const UNCATEGORIZED_NAME = '미분류';

      // 미분류 폴더 찾거나 생성
      let uncategorized = await ctx.prisma.folder.findFirst({
        where: { userId: ctx.user.id, name: UNCATEGORIZED_NAME },
      });

      if (!uncategorized) {
        uncategorized = await ctx.prisma.folder.create({
          data: {
            name: UNCATEGORIZED_NAME,
            icon: '📂',
            userId: ctx.user.id,
          },
        });
      }

      // 폴더 미지정 문서 이동
      const result = await ctx.prisma.document.updateMany({
        where: {
          userId: ctx.user.id,
          OR: [{ folderId: null }, { folderId: undefined as any }],
        },
        data: {
          folderId: uncategorized.id,
        },
      });

      return { folderId: uncategorized.id, movedCount: result.count };
    }),
  // 폴더 생성
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, '폴더명은 필수입니다'),
      icon: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 중복 검사
      const existing = await ctx.prisma.folder.findFirst({
        where: {
          userId: ctx.user.id,
          name: input.name,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '같은 이름의 폴더가 이미 존재합니다',
        });
      }

      const folder = await ctx.prisma.folder.create({
        data: {
          name: input.name,
          icon: input.icon || '📁',
          color: input.color,
          userId: ctx.user.id,
        },
      });

      return folder;
    }),

  // 폴더 목록 조회 (문서 개수 포함)
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const selectFolders = async () =>
        ctx.prisma.folder.findMany({
          where: { userId: ctx.user.id },
          include: { _count: { select: { documents: true } } },
          orderBy: { createdAt: 'asc' },
        });

      let folders = await selectFolders();

      // 멱등 처리: 폴더가 하나도 없으면 기본 폴더 자동 생성 후 재조회
      if (folders.length === 0) {
        const defaults = [
          { name: '설교노트', icon: '📖' },
          { name: '감사일기', icon: '🙏' },
        ];
        try {
          await ctx.prisma.folder.createMany({
            data: defaults.map((d) => ({ ...d, userId: ctx.user.id })),
            skipDuplicates: true,
          });
          folders = await selectFolders();
        } catch {
          // 동시성 경합은 무시하고 재조회
          folders = await selectFolders();
        }
      }

      return folders.map((folder) => ({
        ...folder,
        documentCount: folder._count.documents,
      }));
    }),

  // 특정 폴더의 문서 목록 조회
  getDocuments: protectedProcedure
    .input(z.object({
      folderId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const documents = await ctx.prisma.document.findMany({
        where: {
          userId: ctx.user.id,
          folderId: input.folderId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return { documents };
    }),

  // 폴더 정보 조회
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '폴더를 찾을 수 없습니다',
        });
      }

      return folder;
    }),

  // 문서를 다른 폴더로 이동
  moveDocuments: protectedProcedure
    .input(z.object({
      documentIds: z.array(z.string()),
      targetFolderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 대상 폴더 확인
      const targetFolder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.targetFolderId,
          userId: ctx.user.id,
        },
      });

      if (!targetFolder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '대상 폴더를 찾을 수 없습니다',
        });
      }

      // 문서들 이동
      const result = await ctx.prisma.document.updateMany({
        where: {
          id: { in: input.documentIds },
          userId: ctx.user.id,
        },
        data: {
          folderId: input.targetFolderId,
        },
      });

      return {
        movedCount: result.count,
        targetFolder: targetFolder.name,
      };
    }),

  // 폴더 삭제 (빈 폴더만)
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 문서 개수 확인
      const folder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '폴더를 찾을 수 없습니다',
        });
      }

      if (folder._count.documents > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '문서가 있는 폴더는 삭제할 수 없습니다',
        });
      }

      await ctx.prisma.folder.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  // 기본 폴더 생성 (최초 사용자용)
  createDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      const existingFolders = await ctx.prisma.folder.count({
        where: {
          userId: ctx.user.id,
        },
      });

      if (existingFolders > 0) {
        return { created: false, message: '이미 폴더가 존재합니다' };
      }

      const defaultFolders = [
        { name: '설교노트', icon: '📖' },
        { name: '감사일기', icon: '🙏' },
      ];

      await ctx.prisma.folder.createMany({
        data: defaultFolders.map(folder => ({
          ...folder,
          userId: ctx.user.id,
        })),
      });

      return { created: true, message: '기본 폴더가 생성되었습니다' };
    }),
});
