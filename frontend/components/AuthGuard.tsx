'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { getUserProfile } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/auth') || pathname.startsWith('/register') || pathname.startsWith('/admin')) {
      setAuthorized(true);
      return;
    }

    getUserProfile()
      .then((user) => {
        if (user && !user.guest) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
        }
      })
      .catch(() => {
        setAuthorized(false);
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      });
  }, [pathname, router]);

  if (!authorized && !pathname.startsWith('/auth') && !pathname.startsWith('/register') && !pathname.startsWith('/admin')) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading authentication...</div>;
  }

  return <>{children}</>;
}
