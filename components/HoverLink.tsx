"use client";
/**
 * HoverLink — a "use client" wrapper so it can receive children from server components.
 * Uses CSS classes only — no event handlers passed as props.
 * The actual hover styling is done via CSS utility classes in globals.css.
 */
import Link from "next/link";
import { type ComponentProps } from "react";

type Props = ComponentProps<typeof Link>;

export default function HoverLink(props: Props) {
  return <Link {...props} />;
}
