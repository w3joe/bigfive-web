'use client';

import { isRtlLang } from 'rtl-detect';
import { useLocale } from 'next-intl';

/** Client-only: resolves direction when `locale` may be omitted. */
export default function useTextDirection(locale?: string) {
  const defaultLocale = useLocale();
  const resolved = locale || defaultLocale;
  return isRtlLang(resolved) ? 'rtl' : 'ltr';
}
