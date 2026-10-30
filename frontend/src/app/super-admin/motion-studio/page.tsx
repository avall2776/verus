"use client";

import React from "react";
import MotionStudioView from "@/components/motion-studio/MotionStudioView";

export default function SuperAdminMotionStudioPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full">
      <MotionStudioView />
    </div>
  );
}

