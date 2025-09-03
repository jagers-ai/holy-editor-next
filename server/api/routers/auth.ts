import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';

export const authRouter = createTRPCRouter({
  // 현재 사용자 정보 조회
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    // TODO: Supabase Auth에서 사용자 정보 가져오기
    return ctx.user || null;
  }),

  // 로그인 (Supabase Auth 연동 예정)
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Supabase Auth 로그인 구현
      return {
        success: true,
        message: 'Auth not implemented yet',
      };
    }),

  // 회원가입 (Supabase Auth 연동 예정)
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Supabase Auth 회원가입 구현
      return {
        success: true,
        message: 'Auth not implemented yet',
      };
    }),

  // 로그아웃 (Supabase Auth 연동 예정)
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Supabase Auth 로그아웃 구현
    return {
      success: true,
      message: 'Auth not implemented yet',
    };
  }),
});