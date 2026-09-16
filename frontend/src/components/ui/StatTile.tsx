"use client";

import type { ReactNode } from "react";
import SkeletonBlock from "./SkeletonBlock";
import EyebrowLabel from "./EyebrowLabel";

// Stat tile glass: gom 5 block 17 dòng copy-paste trong dashboard/page.tsx (1226-1303),
// khác nhau chỉ icon + màu chip + value. value undefined → hiện skeleton
interface StatTileProps {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  chipTone?: "primary" | "secondary" | "tertiary";
  className?: string;
}

const chipToneMap: Record<
  NonNullable<StatTileProps["chipTone"]>,
  string
> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary-container/10 text-secondary",
  tertiary: "bg-tertiary-container/10 text-tertiary",
};

export function StatTile({
  icon,
  label,
  value,
  chipTone = "primary",
  className = "",
}: StatTileProps) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md p-6 rounded-2xl text-center border border-white/60 shadow-sm space-y-2 ${className}`}
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${chipToneMap[chipTone]}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-on-surface">
        {value === undefined || value === null ? (
          <SkeletonBlock className="h-6 w-12 mx-auto" />
        ) : (
          value
        )}
      </div>
      <EyebrowLabel as="span" size="9" className="block">
        {label}
      </EyebrowLabel>
    </div>
  );
}

export default StatTile;
