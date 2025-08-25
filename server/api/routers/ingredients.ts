import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { Decimal } from 'decimal.js';

export const ingredientsRouter = router({
  // 모든 재료 조회
  list: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
    
    // ⚡ Decimal을 number로 변환 (8가지 필수 수정사항 #7)
    return items.map((item) => ({
      ...item,
      pricePerUnit: (item.pricePerUnit as any)?.toNumber?.() 
        ?? Number(item.pricePerUnit),
    }));
  }),

  // ID로 재료 조회
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.ingredient.findUnique({
        where: { id: input },
      });
      
      if (!item) return null;
      
      return {
        ...item,
        pricePerUnit: (item.pricePerUnit as any)?.toNumber?.() 
          ?? Number(item.pricePerUnit),
      };
    }),

  // 재료 생성
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1, "재료명은 필수입니다"),
      unit: z.string().min(1, "단위는 필수입니다"),
      pricePerUnit: z.number().positive("단가는 0보다 커야 합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.ingredient.create({
        data: {
          ...input,
          pricePerUnit: new Decimal(input.pricePerUnit),
        },
      });
      
      // ⚡ 응답도 number로 변환
      return {
        ...created,
        pricePerUnit: (created.pricePerUnit as any)?.toNumber?.() 
          ?? Number(created.pricePerUnit),
      };
    }),

  // 재료 수정
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "재료명은 필수입니다"),
      unit: z.string().min(1, "단위는 필수입니다"),
      pricePerUnit: z.number().positive("단가는 0보다 커야 합니다"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.ingredient.update({
        where: { id },
        data: {
          ...data,
          pricePerUnit: new Decimal(data.pricePerUnit),
        },
      });
      
      return {
        ...updated,
        pricePerUnit: (updated.pricePerUnit as any)?.toNumber?.() 
          ?? Number(updated.pricePerUnit),
      };
    }),

  // 재료 삭제
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.ingredient.delete({
        where: { id: input },
      });
      return { success: true };
    }),
});