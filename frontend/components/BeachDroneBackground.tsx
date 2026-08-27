"use client";

import React from "react";

export default function BeachDroneBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-30 overflow-hidden pointer-events-none">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover scale-105"
      >
        <source src="/bg-user-video.mp4" type="video/mp4" />
        <source src="/beach-drone.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[#F7F5F0]/65 dark:bg-[#111614]/75 backdrop-blur-[3px]" />
    </div>
  );
}
