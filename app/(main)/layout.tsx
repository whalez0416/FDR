export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[480px] mx-auto bg-white shadow-2xl min-h-screen relative">
      {children}
    </div>
  );
}
