"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldWarning } from "@phosphor-icons/react";
import { Card, EmptyState, Spinner } from "@/components/ui";

function InvalidContent() {
  const searchParams = useSearchParams();
  const reason =
    searchParams.get("reason") ||
    searchParams.get("message") ||
    "Bạn không có quyền truy cập vào nội dung này.";

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <Card
        tone="glass"
        p="8"
        shadow="shadow-lg"
        className="max-w-md w-full rounded-3xl text-center space-y-6"
      >
        <EmptyState
          tone="error"
          icon={<ShieldWarning size={36} weight="duotone" />}
          title="Truy Cập Không Hợp Lệ"
          body={reason}
          action={{ label: "Quay về trang chủ", href: "/" }}
        />
      </Card>
    </div>
  );
}

export default function InvalidPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Spinner size="md" />
        </div>
      }
    >
      <InvalidContent />
    </Suspense>
  );
}
