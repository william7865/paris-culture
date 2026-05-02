import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Paris Culture` : 'Paris Culture';
    return () => { document.title = 'Paris Culture'; };
  }, [title]);
}
