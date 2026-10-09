import { useEffect, useState } from "react";

/** Hora actual que se actualiza cada `ms` milisegundos (para cronómetros). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** "2 d 4 h", "3 h 12 min" o "8 min 05 s". */
export function formatSpan(msLeft: number) {
  const s = Math.floor(Math.abs(msLeft) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d} d ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min ${String(s % 60).padStart(2, "0")} s`;
}
