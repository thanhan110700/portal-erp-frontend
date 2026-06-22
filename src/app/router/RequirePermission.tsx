import type { ReactNode } from "react";

export function RequirePermission({
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  // Tạm thời bỏ qua kiểm tra permission
  return <>{children}</>;
}
