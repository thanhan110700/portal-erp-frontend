import { useState } from "react";
import { useRouteError } from "react-router-dom";
import { Button, Typography, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import { PATHS } from "@/constants/paths";

const { Title, Text } = Typography;

function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|unable to preload css/i.test(
    message,
  );
}

async function clearCachesAndReload(): Promise<void> {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } finally {
    window.location.reload();
  }
}

export function AppErrorPage() {
  const error = useRouteError();
  const [reloading, setReloading] = useState(false);
  const isOutdated = isChunkLoadError(error);

  const handleReload = () => {
    setReloading(true);
    void clearCachesAndReload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <ReloadOutlined className="text-[28px] text-primary" />
      </div>

      <Title level={2} className="!mb-2">
        {isOutdated ? "A new version is available" : "Something went wrong"}
      </Title>
      <Text type="secondary" className="max-w-[400px] block !mb-8">
        {isOutdated
          ? "The app has just been updated. Please reload the page to use the latest version."
          : "This page failed to load. Please reload the page, or try again in a few minutes if it persists."}
      </Text>

      <Space>
        <Button
          type="primary"
          size="large"
          icon={<ReloadOutlined spin={reloading} />}
          onClick={handleReload}
          disabled={reloading}
        >
          {reloading ? "Reloading…" : "Reload page"}
        </Button>
        {!isOutdated && (
          <Button
            size="large"
            onClick={() => {
              window.location.href = PATHS.dashboard;
            }}
            disabled={reloading}
          >
            Go to Dashboard
          </Button>
        )}
      </Space>
    </div>
  );
}
