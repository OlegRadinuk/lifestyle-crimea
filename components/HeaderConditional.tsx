'use client';

import { usePathname } from 'next/navigation';
import HeaderWrapper from './HeaderWrapper';

export default function HeaderConditional() {
  const pathname = usePathname();
  
  // Не показываем хедер на страницах админки
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <HeaderWrapper />;
}