import { BottomNav } from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[480px] mx-auto bg-white shadow-2xl min-h-screen relative flex flex-col">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
