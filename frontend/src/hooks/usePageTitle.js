import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    const baseTitle = 'Stiko';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
  }, [title]);
}
