import Link from 'next/link';

import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/');
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/orders" className="text-xl font-bold text-coffee-800">
              後台管理
            </Link>
            <div className="flex gap-4">
              <Link
                href="/admin/orders"
                className="text-gray-700 hover:text-coffee-600"
              >
                訂單管理
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-700 hover:text-coffee-600"
              >
                商品管理
              </Link>
              <Link
                href="/"
                className="text-gray-700 hover:text-coffee-600"
              >
                返回前台
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

