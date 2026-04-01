'use client';

import { cn } from "@/lib/utils";

interface GradientBlurBgProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'purple-grid' | 'top-fade-grid';
}

export const GradientBlurBg = ({ className, children, variant = 'purple-grid' }: GradientBlurBgProps) => {
  if (variant === 'top-fade-grid') {
    return (
      <div className={cn("min-h-screen w-full bg-[#f8fafc] relative", className)}>
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen w-full bg-white relative", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f0f0f0 1px, transparent 1px),
            linear-gradient(to bottom, #f0f0f0 1px, transparent 1px),
            radial-gradient(circle 800px at 100% 200px, #d5c5ff, transparent)
          `,
          backgroundSize: "96px 64px, 96px 64px, 100% 100%",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
