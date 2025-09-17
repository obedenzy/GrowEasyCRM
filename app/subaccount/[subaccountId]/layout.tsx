import { notFound, redirect } from 'next/navigation';
import { getCurrentUser, hasSubaccountAccess } from '@/lib/session';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default async function SubaccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { subaccountId: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Verify user has access to this subaccount
  const hasAccess = await hasSubaccountAccess(params.subaccountId);
  if (!hasAccess) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user.role} subaccountId={params.subaccountId} />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}