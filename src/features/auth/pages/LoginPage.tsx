import { Navigate, useNavigate } from "react-router-dom";
import { Typography } from "antd";
import {
  LockOutlined,
  SafetyOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";

import logoRed from "@/assets/logo-s-red.png";
import logoWhite from "@/assets/logo-s-white.png";
import tripLogo from "@/assets/trip-logo.png";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { PATHS } from "@/constants/paths";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useSessionStore } from "@/hooks/useSessionStore";
import { useTheme } from "@/hooks/useTheme";
import { siteName } from "@/config";
import type { User } from "@/shared/types";

const { Title, Text } = Typography;

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useSessionStore((s) => s.setToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { theme } = useTheme();

  if (isAuthenticated) {
    return <Navigate to={PATHS.dashboard} replace />;
  }

  const handleSuccess = (user: User, authToken: string) => {
    setToken(authToken);
    setUser(user);
    void navigate(PATHS.dashboard);
  };

  const isDark = theme === "dark";
  const primaryLogo = isDark ? logoWhite : logoRed;

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex relative flex-col justify-between w-[45%] bg-[#09090b] overflow-hidden py-12 px-16 text-white login-hero">
        {/* Glow blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/25 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/15 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-[2] flex items-center gap-2">
          <img
            src={primaryLogo}
            alt="Ticollab"
            className="h-7 w-auto object-contain"
          />
          <div className="w-px h-6 bg-white/20" />
          <img
            src={tripLogo}
            alt="Trip"
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Headline */}
        <div className="relative z-[2] max-w-[440px] mb-[120px]">
          <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/10 border border-white/15 mb-6">
            <LockOutlined className="text-emerald-400 text-[14px]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-200">
              System Access
            </span>
          </div>

          <Title
            level={1}
            className="!text-white !text-4xl !leading-tight !m-0 !mb-4"
          >
            Your unified management workspace.
          </Title>
          <Text className="!text-base !text-zinc-400 !leading-relaxed">
            Connect to your workspace to analyze real-time performance, manage
            resources, and orchestrate daily operations.
          </Text>

          {/* Feature cards */}
          <div className="flex gap-4 mt-10">
            {[
              {
                icon: (
                  <SafetyOutlined className="text-emerald-400 text-[18px]" />
                ),
                label: "Protected",
                sub: "Secure Connection",
              },
              {
                icon: (
                  <CloudServerOutlined className="text-blue-400 text-[18px]" />
                ),
                label: "Online",
                sub: "System Status",
              },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="flex-1 py-4 px-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 mb-1">
                  {icon}
                  <span className="font-bold text-base">{label}</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-semibold tracking-widest uppercase">
                  {sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 bg-card relative">
        {/* Mobile logo */}
        <div className="mb-10 flex lg:hidden items-center gap-2 login-mobile-logo">
          <img
            src={primaryLogo}
            alt="Ticollab"
            className="h-7 object-contain"
          />
          <div className="w-px h-6 bg-border" />
          <img src={tripLogo} alt="Trip" className="h-8 object-contain" />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <Title level={2} className="!m-0 !mb-2">
              Login
            </Title>
            <Text type="secondary">
              Welcome back. Please enter your details to access your dashboard.
            </Text>
          </div>

          <LoginForm
            onSuccess={handleSuccess}
            submitLabel="Continue to Dashboard"
          />

          <div className="mt-8 text-center">
            <Text type="secondary" className="!text-[13px]">
              Provided by {siteName} Systems.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
