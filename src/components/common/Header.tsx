import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Dropdown, Avatar, Switch, Button } from "antd";
import {
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

import { PATHS } from "@/constants/paths";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTheme } from "@/hooks/useTheme";
import { useSessionStore } from "@/hooks/useSessionStore";
import { loginApi } from "@/features/auth/api";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Header = React.memo(function Header({
  collapsed,
  onToggleCollapse,
}: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = React.useCallback(async () => {
    try {
      await loginApi.logout();
    } catch {
      // token expired — proceed anyway
    }
    clearSession();
    logout();
    void navigate(PATHS.login);
  }, [clearSession, logout, navigate]);

  const isDark = theme === "dark";

  const userDropdownItems = [
    {
      key: "user-info",
      label: (
        <div className="py-1 min-w-[180px]">
          <div className="font-semibold text-sm">{user?.name}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
      danger: true,
      onClick: () => void handleLogout(),
    },
  ];

  return (
    <AntHeader className="flex items-center justify-between px-6 sticky top-0 z-[100] w-full h-16 border-b border-border/50 bg-card">
      {/* Sider collapse trigger */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
        className="!text-[16px] !w-10 !h-10 !flex !items-center !justify-center"
      />

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Dark mode toggle */}
        <Switch
          checked={isDark}
          onChange={toggleTheme}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />

        {/* User avatar + dropdown */}
        <Dropdown
          menu={{ items: userDropdownItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            src={user?.avatar_url}
            icon={!user?.avatar_url ? <UserOutlined /> : undefined}
            className="cursor-pointer border border-border"
          >
            {!user?.avatar_url
              ? user?.name?.charAt(0)?.toUpperCase()
              : undefined}
          </Avatar>
        </Dropdown>
      </div>
    </AntHeader>
  );
});
