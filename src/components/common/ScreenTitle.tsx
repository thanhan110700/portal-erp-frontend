import { memo } from "react";
import { useMatches } from "react-router-dom";
import { Typography, Divider } from "antd";

type RouteTitleHandle = { title?: string };

function ScreenTitleInner() {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const title =
    (leaf?.handle as RouteTitleHandle | undefined)?.title?.trim() ?? "";

  if (!title) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 pb-3">
        <div
          className="w-[3px] h-5 rounded-[2px] bg-primary shrink-0"
          aria-hidden
        />
        <Typography.Title level={3} className="!m-0">
          {title}
        </Typography.Title>
      </div>
      <Divider className="!m-0" />
    </div>
  );
}

export const ScreenTitle = memo(ScreenTitleInner);
