import { ApiError, http } from "@/shared/api/http";
import type { User } from "@/features/users";

export const authApi = {
  me: () =>
    http<User>("/me").catch((e) => {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }),
  logout: () => http<void>("/auth/logout", { method: "POST" }),
};
