export type Role = "admin" | "gestor" | "usuario";

export type User = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: Role;
  area_id: string | null;
  level: number | null; // nivel de escalamiento; 1 = primer contacto
  is_active: boolean;
  is_root: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type UserCreate = { email: string; name: string; role: Role; area_id: string | null };
export type UserUpdate = Partial<Pick<User, "email" | "name" | "role" | "area_id" | "level" | "is_active">>;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  usuario: "Usuario",
};
