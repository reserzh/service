import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useDebouncedSearch(
  basePath: string,
  initialQuery: string = "",
  delay: number = 300
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const applySearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value.trim());
        params.delete("page");
      } else {
        params.delete("search");
      }
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  const handleChange = useCallback(
    (value: string) => {
      setSearch(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        applySearch(value);
      }, delay);
    },
    [applySearch, delay]
  );

  const clearSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setSearch("");
    applySearch("");
  }, [applySearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { search, handleChange, clearSearch, applySearch };
}
