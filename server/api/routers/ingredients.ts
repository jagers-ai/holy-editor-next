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
      quantity: item.quantity ? 
        ((item.quantity as any)?.toNumber?.() ?? Number(item.quantity)) : null,
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
        quantity: item.quantity ? 
          ((item.quantity as any)?.toNumber?.() ?? Number(item.quantity)) : null,
      };
    }),

  // 재료 생성
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1, "재료명은 필수입니다"),
      unit: z.string().min(1, "단위는 필수입니다"),
      pricePerUnit: z.number().positive("단가는 0보다 커야 합니다"),
      // 새 필드 추가 (optional)
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      quantity: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { quantity, ...otherData } = input;
      const created = await ctx.prisma.ingredient.create({
        data: {
          ...otherData,
          pricePerUnit: new Decimal(input.pricePerUnit),
          quantity: quantity ? new Decimal(quantity) : null,
        },
      });
      
      // ⚡ 응답도 number로 변환
      return {
        ...created,
        pricePerUnit: (created.pricePerUnit as any)?.toNumber?.() 
          ?? Number(created.pricePerUnit),
        quantity: created.quantity ? 
          ((created.quantity as any)?.toNumber?.() ?? Number(created.quantity)) : null,
      };
    }),

  // 재료 수정
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "재료명은 필수입니다"),
      unit: z.string().min(1, "단위는 필수입니다"),
      pricePerUnit: z.number().positive("단가는 0보다 커야 합니다"),
      // 새 필드 추가 (optional)
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      quantity: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, quantity, ...data } = input;
      const updated = await ctx.prisma.ingredient.update({
        where: { id },
        data: {
          ...data,
          pricePerUnit: new Decimal(data.pricePerUnit),
          quantity: quantity ? new Decimal(quantity) : null,
        },
      });
      
      return {
        ...updated,
        pricePerUnit: (updated.pricePerUnit as any)?.toNumber?.() 
          ?? Number(updated.pricePerUnit),
        quantity: updated.quantity ? 
          ((updated.quantity as any)?.toNumber?.() ?? Number(updated.quantity)) : null,
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