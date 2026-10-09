import { http, json } from "@/shared/api/http";
import type { User, UserCreate, UserUpdate } from "./types";

export const usersApi = {
  list: () => http<User[]>("/users"),
  create: (data: UserCreate) => http<User>("/users", { method: "POST", body: json(data) }),
  update: (id: number, data: UserUpdate) => http<User>(`/users/${id}`, { method: "PATCH", body: json(data) }),
  setManager: (id: number, manager_id: number | null) =>
    http<User>(`/users/${id}/manager`, { method: "PUT", body: json({ manager_id }) }),
};
