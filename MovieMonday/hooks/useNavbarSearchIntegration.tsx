'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

/**
 * Hook to integrate the Navbar search with the Discovery page
 * When on /discover page, this will enhance the navbar search
 * to send search events to the discovery page
 */
export function useNavbarSearchIntegration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDiscoveryPage, setIsDiscoveryPage] = useState(false);

  // Check if we're on the discovery page
  useEffect(() => {
    setIsDiscoveryPage(pathname === '/discover');
  }, [pathname]);

  // Function to handle search
  const handleSearch = (query: string) => {
    if (!isDiscoveryPage) {
      // If not on discovery page, navigate to it with search param
      if (query.trim()) {
        router.push(`/discover?search=${encodeURIComponent(query.trim())}`);
      }
    } else {
      // If already on discovery page, dispatch a custom event
      // that the discovery page will listen for
      const searchEvent = new CustomEvent('navbarSearch', {
        detail: { query },
        bubbles: true,
      });
      window.dispatchEvent(searchEvent);
      
      // Update URL with search parameter
      if (query.trim()) {
        router.push(`/discover?search=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/discover');
      }
    }
  };

  // Get initial search query from URL
  const getInitialSearchQuery = () => {
    return searchParams.get('search') || '';
  };

  return {
    isDiscoveryPage,
    handleSearch,
    getInitialSearchQuery
  };
}