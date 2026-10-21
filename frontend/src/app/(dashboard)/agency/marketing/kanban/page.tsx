"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketingKanbanRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agency/marketing");
  }, [router]);

  return null;
}
