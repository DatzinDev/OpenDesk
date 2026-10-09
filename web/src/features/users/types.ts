export type Role = "admin" | "gestor" | "usuario";

export type User = {
  id: number;
  email: string;
  name: string;
  picture: string | null;
  role: Role;
  is_active: boolean;
  is_root: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type UserCreate = { email: string; name: string; role: Role };
export type UserUpdate = Partial<Pick<User, "name" | "role" | "is_active">>;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  usuario: "Usuario",
};
