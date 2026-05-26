"use client";
/**
 * HoverLink — a client-side <Link> wrapper that supports CSS-var-based hover styles.
 * Use instead of onMouseEnter/onMouseLeave on server components.
 *
 * Props:
 *   hoverStyle  — styles applied on mouseenter (default: color → var(--accent))
 *   baseStyle   — styles always applied (merged with className)
 */
import Link from "next/link";
import { type ComponentProps, useRef } from "react";

type Props = ComponentProps<typeof Link> & {
  hoverStyle?: Partial<CSSStyleDeclaration>;
  baseStyle?: React.CSSProperties;
};

export default function HoverLink({ hoverStyle, baseStyle, style, onMouseEnter, onMouseLeave, children, ...props }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const mergedStyle: React.CSSProperties = { ...baseStyle, ...style };

  function enter(e: React.MouseEvent<HTMLAnchorElement>) {
    if (ref.current && hoverStyle) {
      Object.entries(hoverStyle).forEach(([k, v]) => {
        (ref.current!.style as unknown as Record<string, string>)[k] = v as string;
      });
    }
    onMouseEnter?.(e);
  }

  function leave(e: React.MouseEvent<HTMLAnchorElement>) {
    if (ref.current && hoverStyle) {
      Object.entries(hoverStyle).forEach(([k]) => {
        (ref.current!.style as unknown as Record<string, string>)[k] = (mergedStyle as unknown as Record<string, string>)[k] ?? "";
      });
    }
    onMouseLeave?.(e);
  }

  return (
    <Link ref={ref} style={mergedStyle} onMouseEnter={enter} onMouseLeave={leave} {...props}>
      {children}
    </Link>
  );
}
