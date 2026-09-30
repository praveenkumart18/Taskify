import React from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
  size?: number | string;
  filled?: boolean;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = '',
  size,
  filled = false,
}) => {
  const style: React.CSSProperties = {};
  if (size) {
    style.fontSize = typeof size === 'number' ? `${size}px` : size;
  }
  if (filled) {
    style.fontVariationSettings = "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24";
  }

  return (
    <span
      className={`material-symbols-outlined select-none shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

export default MaterialIcon;
