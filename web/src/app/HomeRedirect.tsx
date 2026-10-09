import { Navigate } from "react-router-dom";
import { useMe } from "@/features/auth";

/** La página de inicio de cada rol es su lista de trabajo. */
export function HomeRedirect() {
  const { data: me } = useMe();
  if (!me) return null;
  return <Navigate to={me.role === "usuario" ? "/mis-actividades" : "/bandeja"} replace />;
}
