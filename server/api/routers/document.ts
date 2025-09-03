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
});

export const documentRouter = createTRPCRouter({
  // 문서 생성 (인증 필요 없음 - 나중에 protectedProcedure로 변경)
  create: publicProcedure
    .input(documentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.create({
        data: {
          title: input.title,
          content: input.content,
          isPublic: input.isPublic,
          // userId는 인증 구현 후 추가
          // userId: ctx.user?.id,
        },
      });

      return document;
    }),

  // 문서 목록 조회 (현재는 모든 문서, 나중에 사용자별 필터링)
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      
      const documents = await ctx.prisma.document.findMany({
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

  // 특정 문서 조회
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: {
          id: input.id,
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

  // 문서 업데이트
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: documentInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 나중에 소유권 검사 추가
      // const document = await ctx.prisma.document.findUnique({
      //   where: { id: input.id },
      // });
      
      // if (document?.userId !== ctx.user?.id) {
      //   throw new TRPCError({
      //     code: 'FORBIDDEN',
      //     message: '이 문서를 수정할 권한이 없습니다.',
      //   });
      // }

      const updated = await ctx.prisma.document.update({
        where: {
          id: input.id,
        },
        data: {
          ...input.data,
          updatedAt: new Date(),
        },
      });

      return updated;
    }),

  // 문서 삭제
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 나중에 소유권 검사 추가
      await ctx.prisma.document.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  // localStorage 데이터 임포트 (마이그레이션용)
  importFromLocalStorage: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          content: z.any(),
          sermonInfo: z.object({
            title: z.string().optional(),
            pastor: z.string().optional(),
            verse: z.string().optional(),
            serviceType: z.string().optional(),
          }).optional(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.map(async (doc) => {
          // 이미 존재하는지 확인
          const existing = await ctx.prisma.document.findFirst({
            where: {
              title: doc.title,
              createdAt: {
                gte: new Date(new Date(doc.createdAt).getTime() - 1000),
                lte: new Date(new Date(doc.createdAt).getTime() + 1000),
              },
            },
          });

          if (existing) {
            return { skipped: true, id: existing.id };
          }

          const created = await ctx.prisma.document.create({
            data: {
              title: doc.title || '제목 없음',
              content: doc.content,
              createdAt: new Date(doc.createdAt),
              updatedAt: new Date(doc.updatedAt),
            },
          });

          return { created: true, id: created.id };
        })
      );

      const imported = results.filter(
        (r) => r.status === 'fulfilled' && r.value.created
      ).length;
      const skipped = results.filter(
        (r) => r.status === 'fulfilled' && r.value.skipped
      ).length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        imported,
        skipped,
        failed,
        total: input.length,
      };
    }),
});