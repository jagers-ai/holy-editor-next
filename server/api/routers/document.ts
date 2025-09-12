import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 소유권 검사
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });

      if (!document || document.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '이 문서를 수정할 권한이 없습니다.',
        });
      }

      // Prisma 스키마에 존재하는 필드만 업데이트
      const allowedData: any = { updatedAt: new Date() };
      if (typeof input.data?.title === 'string') allowedData.title = input.data.title;
      if (typeof input.data?.isPublic === 'boolean') allowedData.isPublic = input.data.isPublic;
      if (input.data?.content !== undefined) allowedData.content = input.data.content as any;
      if (typeof (input.data as any)?.folderId === 'string') (allowedData as any).folderId = (input.data as any).folderId;

      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: allowedData,
      });

      return updated;
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
