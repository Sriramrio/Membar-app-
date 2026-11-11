export const SETHU_LOGO_DATA_URI = '/brand/sethu-logo.jpeg';

import type { ImgHTMLAttributes } from "react";
import { useSystemBranding } from "@/services/brandingService";

export interface SethuLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  className?: string;
  alt?: string;
  ignoreSystemSize?: boolean;
}

export function SethuLogo({
  className = "size-9",
  alt = "SETHU Logo",
  style,
  loading = "eager",
  decoding = "async",
  ignoreSystemSize = false,
  ...props
}: SethuLogoProps) {
  const branding = useSystemBranding();
  const dynamicSize = !ignoreSystemSize && branding.sethuSize ? `${branding.sethuSize}px` : undefined;

  return (
    <img
      {...props}
      src={branding.sidebarLogo || "/brand/sethu-logo.jpeg"}
      alt={alt}
      loading={loading}
      decoding={decoding}
      draggable={false}
      className={[
        "sethu-logo-image",
        "inline-block",
        "shrink-0",
        "select-none",
        "rounded-full",
        "object-contain",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        display: "block",
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        objectPosition: "center",
        width: dynamicSize || style?.width,
        height: dynamicSize || style?.height,
        transition: 'width 0.15s ease, height 0.15s ease',
        ...style,
      }}
    />
  );
}

export default SethuLogo;
