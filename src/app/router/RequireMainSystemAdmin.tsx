import type { ReactNode } from "react";

export function RequireMainSystemAdmin({ children }: { children: ReactNode }) {
  // Tạm thời bỏ qua check role admin hệ thống chính
  return <>{children}</>;
}
