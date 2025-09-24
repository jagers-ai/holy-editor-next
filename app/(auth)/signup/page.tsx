import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: '회원가입 - 홀리해빗',
  description: '홀리해빗 계정을 만드세요',
};

export default function SignupPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8">
      <div className="w-full flex items-center justify-center">
        <SignupForm />
      </div>
    </div>
  );
}
