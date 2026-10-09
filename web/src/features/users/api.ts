import { http, json } from "@/shared/api/http";
import type { User, UserCreate, UserUpdate } from "./types";

export const usersApi = {
  list: () => http<User[]>("/users"),
  create: (data: UserCreate) => http<User>("/users", { method: "POST", body: json(data) }),
  update: (id: string, data: UserUpdate) => http<User>(`/users/${id}`, { method: "PATCH", body: json(data) }),
};
