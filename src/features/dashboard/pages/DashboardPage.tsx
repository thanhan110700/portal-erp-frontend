import { Card, Typography } from "antd";
import { RocketOutlined } from "@ant-design/icons";

import { useAuthStore } from "@/hooks/useAuthStore";

const { Title, Text } = Typography;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-6">
      <Card
        className="bg-gradient-to-br from-[#09090b] to-[#1a1a2e] !border-none !rounded-2xl overflow-hidden relative"
        classNames={{ body: "!p-10 md:!p-12" }}
      >
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-[60px] -left-[60px] w-[320px] h-[320px] rounded-full bg-emerald-500/12 blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/8 border border-white/12 mb-5">
            <RocketOutlined className="text-emerald-400 text-[13px]" />
            <span className="text-[11px] font-semibold text-zinc-200 tracking-wider uppercase">
              Live Dashboard
            </span>
          </div>

          <Title
            level={1}
            className="!text-white !m-0 !mb-3 !text-[clamp(28px,4vw,44px)]"
          >
            Welcome, {user?.name || "User"}!
          </Title>
          <Text className="!text-zinc-400 !text-base max-w-[560px] block !leading-relaxed">
            Welcome to your new project base template. You can start adding
            features here.
          </Text>
        </div>
      </Card>
    </div>
  );
}
