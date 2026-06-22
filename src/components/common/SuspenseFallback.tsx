import { Spin } from "antd";

export function SuspenseFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

export default SuspenseFallback;
