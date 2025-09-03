import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: '회원가입 - HolyEditor',
  description: 'Holy Editor 계정을 만드세요',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SignupForm />
    </div>
  );
}