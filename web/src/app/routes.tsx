import { createBrowserRouter, Navigate } from "react-router-dom";
import { AccessDeniedPage, LoginPage, RequireAuth } from "@/features/auth";
import { HomePage } from "@/features/home";
import { AreasPage } from "@/features/areas";
import { UsersPage } from "@/features/users";
import { AppShell } from "./AppShell";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/acceso-denegado", element: <AccessDeniedPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      ...[
        { path: "usuarios", page: <UsersPage /> },
        { path: "areas", page: <AreasPage /> },
      ].map(({ path, page }) => ({ path, element: <RequireAuth roles={["admin", "gestor"]}>{page}</RequireAuth> })),
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
