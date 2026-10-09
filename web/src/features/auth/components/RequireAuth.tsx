import { Center, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/features/users";
import { useMe } from "../hooks";

type Props = { roles?: Role[]; children: ReactNode };

export function RequireAuth({ roles, children }: Props) {
  const { data: me, isLoading } = useMe();
  if (isLoading)
    return (
      <Center h="100vh">
        <Loader color="navy" />
      </Center>
    );
  if (!me) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(me.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
