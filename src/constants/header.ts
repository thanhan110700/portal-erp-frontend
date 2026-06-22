import { PATHS } from "@/constants/paths";
import { DashboardOutlined } from "@ant-design/icons";
import type { FC } from "react";

export type NavSubItem = {
  name: string;
  href: string;
  icon?: FC;
  requiredPermission?: string;
  adminOnly?: boolean;
  mainSystemOnly?: boolean;
};

export type NavItem = {
  name: string;
  href?: string;
  icon?: FC;
  items?: NavSubItem[];
  navSection?: string;
};

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: "Dashboard", href: PATHS.dashboard, icon: DashboardOutlined },
];
