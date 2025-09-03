/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/server/routers
 * @see https://trpc.io/docs/server/procedures
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '@/server/db';
import { type User } from '@prisma/client';
import { GlobalErrorHandler } from '@/lib/errors/global-handler';
import { logger, logApiRequest } from '@/lib/logger';
import { ErrorCategory, ErrorSeverity } from '@/lib/errors/types';

/**
 * 1. CONTEXT
 * This section defines the "contexts" that are available in the backend API
 */
interface CreateContextOptions {
  user?: User | null;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    prisma,
  };
};

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // 나중에 여기서 Supabase Auth를 통해 사용자 정보를 가져올 예정
  const user = null; // TODO: Get user from Supabase Auth
  
  return createInnerTRPCContext({
    user,
  });
};

/**
 * 2. INITIALIZATION
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    const isDev = process.env.NODE_ENV === 'development';
    
    // 에러 로깅
    logger.error('tRPC Error:', {
      code: error.code,
      message: error.message,
      path: shape.data.path,
      userId: ctx?.user?.id
    });
    
    // 글로벌 에러 핸들러로 전송 (서버 사이드)
    if (typeof window === 'undefined') {
      GlobalErrorHandler.handleError(
        GlobalErrorHandler.createAppError(
          error.message,
          ErrorCategory.API,
          error.code === 'INTERNAL_SERVER_ERROR' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
          getUserFriendlyMessage(error.code)
        ),
        'tRPC',
        ctx?.user?.id
      );
    }
    
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        // 개발 환경에서만 상세 정보 노출
        ...(isDev && {
          stack: error.stack,
          cause: error.cause
        })
      },
    };
  },
});

/**
 * 사용자 친화적 에러 메시지 변환
 */
function getUserFriendlyMessage(code: string): string {
  const messages: Record<string, string> = {
    'BAD_REQUEST': '잘못된 요청입니다.',
    'UNAUTHORIZED': '로그인이 필요합니다.',
    'FORBIDDEN': '접근 권한이 없습니다.',
    'NOT_FOUND': '요청한 리소스를 찾을 수 없습니다.',
    'TIMEOUT': '요청 시간이 초과되었습니다.',
    'CONFLICT': '중복된 데이터입니다.',
    'PRECONDITION_FAILED': '사전 조건을 충족하지 못했습니다.',
    'PAYLOAD_TOO_LARGE': '요청 데이터가 너무 큽니다.',
    'METHOD_NOT_SUPPORTED': '지원하지 않는 메서드입니다.',
    'UNPROCESSABLE_CONTENT': '처리할 수 없는 내용입니다.',
    'TOO_MANY_REQUESTS': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    'CLIENT_CLOSED_REQUEST': '요청이 취소되었습니다.',
    'INTERNAL_SERVER_ERROR': '서버 오류가 발생했습니다.',
  };
  
  return messages[code] || '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러 처리 미들웨어
 */
const errorHandlingMiddleware = t.middleware(async ({ next, ctx, path, type }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    
    // 성공 로깅
    const duration = Date.now() - start;
    logApiRequest(
      type.toUpperCase(),
      path,
      result.ok ? 200 : 500,
      duration
    );
    
    return result;
  } catch (error) {
    // 에러 로깅
    const duration = Date.now() - start;
    logApiRequest(
      type.toUpperCase(),
      path,
      500,
      duration
    );
    
    // 에러 다시 던지기
    throw error;
  }
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(errorHandlingMiddleware);

/**
 * Protected (authenticated) procedure
 * 
 * This procedure requires the user to be authenticated.
 * If you want a query or mutation to ONLY be accessible to logged in users, use this.
 */
export const protectedProcedure = t.procedure
  .use(errorHandlingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED',
        message: '로그인이 필요한 서비스입니다.'
      });
    }
    
    return next({
      ctx: {
        ...ctx,
        // infers that `user` is non-nullable
        user: ctx.user,
      },
    });
  });