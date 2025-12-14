/**
 * Memoization Utilities
 * Helper functions for optimizing React components
 */

import { useMemo, useCallback } from 'react';

/**
 * Memoize filtered array
 */
export function useFilteredArray<T>(
  array: T[],
  filterFn: (item: T) => boolean,
  dependencies: any[] = []
): T[] {
  return useMemo(() => {
    return array.filter(filterFn);
  }, [array, ...dependencies]);
}

/**
 * Memoize sorted array
 */
export function useSortedArray<T>(
  array: T[],
  sortFn: (a: T, b: T) => number,
  dependencies: any[] = []
): T[] {
  return useMemo(() => {
    return [...array].sort(sortFn);
  }, [array, ...dependencies]);
}

/**
 * Memoize debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  dependencies: any[] = []
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      const timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }) as T,
    [callback, delay, ...dependencies]
  );
}

/**
 * Memoize computed stats
 */
export function useComputedStats<T>(
  data: T[],
  computeFn: (data: T[]) => Record<string, number>,
  dependencies: any[] = []
): Record<string, number> {
  return useMemo(() => {
    return computeFn(data);
  }, [data, ...dependencies]);
}

