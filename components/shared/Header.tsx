import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { UserMenu } from './UserMenu';
import { HeaderClient } from './HeaderClient';

export default async function Header() {
  const session = await getSession();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-amber-800">
            ☕ 咖啡豆訂單系統
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-amber-600">
              商品
            </Link>
            <HeaderClient />
            {session ? (
              <UserMenu user={{ email: session.email, name: session.email.split('@')[0] }} />
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-amber-600">
                  登入
                </Link>
                <Link
                  href="/register"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  註冊
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

