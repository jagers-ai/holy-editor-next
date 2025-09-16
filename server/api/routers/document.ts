import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

const FRESH_REVISION_LIFETIME_DAYS = 7;

const fingerprint = (obj: unknown) => {
  try {
    const s = JSON.stringify(obj);
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) ^ s.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  } catch {
    return Math.random().toString(36).slice(2, 8);
  }
};

const hasMeaningfulContent = (content: unknown): boolean => {
  if (!content || typeof content !== 'object') return false;
  const maybeDoc = content as { content?: unknown };
  const search = (node: unknown): boolean => {
    if (!node) return false;
    if (Array.isArray(node)) {
      return node.some(search);
    }
    if (typeof node !== 'object') return false;

    const obj = node as Record<string, unknown>;
    const type = typeof obj.type === 'string' ? obj.type : undefined;
    const text = obj.text;
    if (typeof text === 'string' && text.trim().length > 0) {
      return true;
    }

    const attrs = (obj.attrs ?? {}) as Record<string, unknown>;
    const mediaTypes = new Set(['image', 'video', 'audio', 'iframe', 'embed', 'file']);
    if (type && mediaTypes.has(type)) {
      const src = attrs.src as string | undefined;
      const href = attrs.href as string | undefined;
      if ((src && src.trim().length > 0) || (href && href.trim().length > 0)) {
        return true;
      }
    }

    if (Array.isArray(obj.content) && obj.content.some(search)) {
      return true;
    }

    return false;
  };

  if (Array.isArray((maybeDoc as any).content)) {
    return search((maybeDoc as any).content);
  }
  return false;
};

const pruneOldRevisions = async (prisma: any, documentId: string) => {
  const threshold = new Date(Date.now() - FRESH_REVISION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  await prisma.documentRevision.deleteMany({
    where: {
      documentId,
      createdAt: { lt: threshold },
    },
  });
};

const toRevisionContent = (value: Prisma.JsonValue | null | undefined): Prisma.JsonNull | Prisma.InputJsonValue => {
  if (value === null || value === undefined) {
    return Prisma.JsonNull.instance;
  }
  return value as unknown as Prisma.InputJsonValue;
};

// Document 입력 스키마
const documentInputSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.any(), // Tiptap JSON content
  sermonInfo: z.object({
    title: z.string().optional(),
    pastor: z.string().optional(),
    verse: z.string().optional(),
    serviceType: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
  isPublic: z.boolean().default(false),
  folderId: z.string().optional(),
});

export const documentRouter = createTRPCRouter({
  // 문서 생성 (인증 필요)
  create: protectedProcedure
    .input(documentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.create({
        data: {
          title: input.title,
          content: input.content,
          isPublic: input.isPublic,
          folderId: input.folderId,
          userId: ctx.user.id, // 인증된 사용자의 ID
        },
      });

      await ctx.prisma.documentRevision.create({
        data: {
          documentId: document.id,
          userId: ctx.user.id,
          content: toRevisionContent(document.content),
        },
      });
      await pruneOldRevisions(ctx.prisma, document.id);

      return document;
    }),

  // 문서 목록 조회 (사용자별 필터링)
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
      folderId: z.string().optional(), // 폴더별 필터링 추가
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      
      const documents = await ctx.prisma.document.findMany({
        where: {
          userId: ctx.user.id, // 현재 사용자의 문서만 조회
          folderId: input?.folderId, // 폴더 필터링
        },
        take: limit + 1,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
          content: true, // 목록에서도 content 포함 (미리보기용)
        },
      });

      let nextCursor: string | undefined = undefined;
      if (documents.length > limit) {
        const nextItem = documents.pop();
        nextCursor = nextItem!.id;
      }

      return {
        documents,
        nextCursor,
      };
    }),

  // 특정 문서 조회 (자신의 문서만)
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id, // 자신의 문서만 조회
        },
        include: {
          bibleReferences: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '문서를 찾을 수 없습니다.',
        });
      }

      return document;
    }),

  // 문서 업데이트 (소유권 검증 포함)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: documentInputSchema.partial(),
        expectedHash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });

      if (!document || document.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '이 문서를 수정할 권한이 없습니다.',
        });
      }

      const currentHash = fingerprint(document.content);
      if (input.expectedHash && input.expectedHash !== currentHash) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '문서가 다른 기기에서 우선 저장되었습니다. 새로고침 후 다시 시도해주세요.',
        });
      }

      const allowedData: Record<string, unknown> = {};
      if (typeof input.data?.title === 'string') allowedData.title = input.data.title;
      if (typeof input.data?.isPublic === 'boolean') allowedData.isPublic = input.data.isPublic;
      if (typeof (input.data as any)?.folderId === 'string') allowedData.folderId = (input.data as any).folderId;

      let contentChanged = false;
      if (input.data?.content !== undefined) {
        const incomingContent = input.data.content as unknown;
        const incomingHash = fingerprint(incomingContent);
        contentChanged = incomingHash !== currentHash;

        const incomingHasBody = hasMeaningfulContent(incomingContent);
        const hadPrevious = hasMeaningfulContent(document.content as unknown);
        if (!incomingHasBody && hadPrevious) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '내용이 비어 있어 기존 문서를 덮어쓸 수 없습니다.',
          });
        }

        if (contentChanged) {
          allowedData.content = incomingContent as any;
        }
      }

      if (!Object.keys(allowedData).length) {
        return document;
      }

      if (contentChanged) {
        await ctx.prisma.documentRevision.create({
          data: {
            documentId: document.id,
            userId: ctx.user.id,
            content: toRevisionContent(document.content),
          },
        });
        await pruneOldRevisions(ctx.prisma, document.id);
      }

      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: allowedData,
      });

      return updated;
    }),

  revisions: protectedProcedure
    .input(z.object({ documentId: z.string(), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        select: { userId: true },
      });

      if (!document || document.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '이 문서의 리비전을 조회할 권한이 없습니다.',
        });
      }

      const revisions = await ctx.prisma.documentRevision.findMany({
        where: { documentId: input.documentId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });

      return revisions;
    }),

  restoreFromRevision: protectedProcedure
    .input(z.object({ documentId: z.string(), revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
      });

      if (!document || document.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '이 문서를 복구할 권한이 없습니다.',
        });
      }

      const revision = await ctx.prisma.documentRevision.findUnique({
        where: { id: input.revisionId },
      });

      if (!revision || revision.documentId !== input.documentId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '리비전을 찾을 수 없습니다.',
        });
      }

      await ctx.prisma.documentRevision.create({
        data: {
          documentId: document.id,
          userId: ctx.user.id,
          content: toRevisionContent(document.content),
        },
      });
      await pruneOldRevisions(ctx.prisma, document.id);

      const restored = await ctx.prisma.document.update({
        where: { id: input.documentId },
        data: {
          content: revision.content,
        },
      });

      return restored;
    }),

  // 문서 삭제 (소유권 검증 포함)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 소유권 검사
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });
      
      if (!document || document.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '이 문서를 삭제할 권한이 없습니다.',
        });
      }
      
      await ctx.prisma.document.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
