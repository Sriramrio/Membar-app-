import React from 'react';
import { SETHU_LOGO_DATA_URI } from '@/components/brand/SethuLogo';

export interface LotusIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  alt?: string;
}

export function LotusIcon({
  className = 'size-8',
  alt = 'SETHU Logo',
  ...props
}: LotusIconProps) {
  return (
    <img
      src={SETHU_LOGO_DATA_URI}
      alt={alt}
      className={`inline-block select-none object-contain shrink-0 rounded-full ${className}`}
      loading="eager"
      decoding="async"
      draggable={false}
      {...props}
    />
  );
}
