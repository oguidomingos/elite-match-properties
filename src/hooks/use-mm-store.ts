import { useEffect, useState } from "react";

/** Re-renders when the local prototype store changes (and after hydration). */
export function useMmStore<T>(selector: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const sync = () => setValue(selector());
    sync();
    window.addEventListener("mm:update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mm:update", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
