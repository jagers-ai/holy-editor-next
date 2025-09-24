import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: '로그인 - 홀리해빗',
  description: '홀리해빗에 로그인하세요',
};

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8">
      <div className="w-full flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
