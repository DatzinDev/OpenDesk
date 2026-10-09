export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    // Con FormData el navegador define el Content-Type multipart con su boundary.
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      "X-Requested-With": "opendesk",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : "No se pudo completar la acción. Intenta de nuevo.";
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const json = (body: unknown) => JSON.stringify(body);

/** Cuerpo multipart: un campo `data` en JSON y los archivos adjuntos. */
export const multipart = (body: unknown, files: File[] = []) => {
  const form = new FormData();
  form.append("data", JSON.stringify(body));
  files.forEach((f) => form.append("files", f));
  return form;
};
