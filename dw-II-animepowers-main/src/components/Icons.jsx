/**
 * Ícones em traço, desenhados no mesmo grid de 24px do resto do sistema.
 * Substituem emojis e evitam dependência de biblioteca de ícones.
 */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false'
};

export function ArrowUpRight({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function ArrowLeft({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function ArrowRight({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function Star({ size = 16, filled = false, ...rest }) {
  return (
    <svg {...base} width={size} height={size} fill={filled ? 'currentColor' : 'none'} {...rest}>
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </svg>
  );
}

export function Close({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Check({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  );
}

export function Plus({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function Trash({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7v13h12V7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function Search({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

export function Swords({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4 4h4l12 12-4 4L4 8z" />
      <path d="M20 4h-4L4 16l4 4L20 8z" />
      <path d="m7 17-3 3M17 17l3 3" />
    </svg>
  );
}

export function Bolt({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}

export function Book({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    </svg>
  );
}

export function Spark({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

export function AlertTriangle({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function Info({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
