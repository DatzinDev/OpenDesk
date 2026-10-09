import { createBrowserRouter, Navigate } from "react-router-dom";
import { AccessDeniedPage, LoginPage, RequireAuth } from "@/features/auth";
import { HomePage } from "@/features/home";
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
      {
        path: "usuarios",
        element: (
          <RequireAuth roles={["admin", "gestor"]}>
            <UsersPage />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
