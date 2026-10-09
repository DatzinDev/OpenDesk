import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AccessDeniedPage, LoginPage, RequireAuth } from "@/features/auth";
import { AreasPage } from "@/features/areas";
import { SurveyPage } from "@/features/surveys";
import { InboxPage, MyTicketsPage, TicketPage } from "@/features/tickets";
import { UsersPage } from "@/features/users";
import { HomeRedirect } from "./HomeRedirect";
import { AppShell } from "./AppShell";

// Analítica incluye la librería de gráficas: se descarga solo al abrir la sección.
const AnalyticsPage = lazy(() => import("@/features/analytics").then((m) => ({ default: m.AnalyticsPage })));

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/acceso-denegado", element: <AccessDeniedPage /> },
  { path: "/encuesta/:token", element: <SurveyPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "tickets/:id", element: <TicketPage /> },
      { path: "analitica", element: <Suspense fallback={null}><AnalyticsPage /></Suspense> },
      { path: "mis-actividades", element: <RequireAuth roles={["usuario"]}><MyTicketsPage /></RequireAuth> },
      ...[
        { path: "usuarios", page: <UsersPage /> },
        { path: "areas", page: <AreasPage /> },
        { path: "bandeja", page: <InboxPage /> },
      ].map(({ path, page }) => ({ path, element: <RequireAuth roles={["admin", "gestor"]}>{page}</RequireAuth> })),
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
