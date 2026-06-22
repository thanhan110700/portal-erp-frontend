import { Spin } from "antd";

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spin size="large" />
    </div>
  );
}
