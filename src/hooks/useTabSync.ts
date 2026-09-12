import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const useTabSync = <T extends string>(
  defaultTab: T,
  validTabs: readonly T[]
): [T, (tab: T) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();

  const param = searchParams.get('tab') as T | null;
  const activeTab: T = param && validTabs.includes(param) ? param : defaultTab;

  const setActiveTab = useCallback(
    (tab: T) => {
      const next = new URLSearchParams(searchParams);
      if (tab === defaultTab) {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      if (next.toString() === searchParams.toString()) return;
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, defaultTab]
  );

  return [activeTab, setActiveTab];
};

export default useTabSync;
