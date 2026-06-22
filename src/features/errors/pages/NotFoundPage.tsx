import { useNavigate } from "react-router-dom";
import { Button, Typography, Space } from "antd";
import { PATHS } from "@/constants/paths";

const { Title, Text } = Typography;

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Big 404 */}
      <div className="relative select-none mb-4">
        <span
          aria-hidden="true"
          className="text-[clamp(8rem,20vw,14rem)] font-black leading-none text-foreground/[0.04]"
        >
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-[clamp(3rem,8vw,6rem)] font-black">
          404
        </span>
      </div>

      <div className="w-20 h-px bg-border mx-auto mb-8" />

      <Title level={2} className="!mb-2">
        Page not found
      </Title>
      <Text type="secondary" className="max-w-[380px] block !mb-10">
        The page you are looking for doesn&apos;t exist or has been moved. Check
        the URL or navigate back to safety.
      </Text>

      <Space>
        <Button
          type="primary"
          size="large"
          onClick={() => void navigate(PATHS.dashboard)}
        >
          Go to Dashboard
        </Button>
        <Button size="large" onClick={() => void navigate(-1)}>
          Go Back
        </Button>
      </Space>
    </div>
  );
}
