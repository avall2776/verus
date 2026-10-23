"use client";

import React from "react";
import TacticalGeoMap from "@/components/dashboard/TacticalGeoMap";

export default function TacticalMapPage() {
  return (
    <div className="w-full h-[calc(100vh-80px)] -m-2.5 sm:-m-4 md:-m-8 overflow-hidden">
      <TacticalGeoMap />
    </div>
  );
}
