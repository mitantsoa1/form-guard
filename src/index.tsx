import React, { useCallback, useEffect, useRef } from "react";

export type BotReason = "honeypot" | "too-fast";

export type FormGuardOptions = {
  /** Submit faster than this after mount = bot. Default 3000 ms. */
  minTime?: number;
  /** Custom input name for the honeypot field. Default "website_url". */
  fieldName?: string;
  /** Called when a bot is detected. The wrapped handler will NOT run. */
  onBot?: (reason: BotReason) => void;
};

export const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "-9999px",
  width: "1px",
  height: "1px",
  opacity: 0,
  pointerEvents: "none",
};

export function useFormGuard({
  minTime = 3000,
  fieldName = "website_url",
  onBot,
}: FormGuardOptions = {}) {
  const trap = useRef<HTMLInputElement>(null);
  const start = useRef<number>(0);

  // Initialize timestamp on client mount to remain SSR/SSG safe
  useEffect(() => {
    start.current = Date.now();
  }, []);

  /** Props ready to be spread directly onto a custom input element */
  const honeypotProps = {
    ref: trap,
    type: "text" as const,
    name: fieldName,
    tabIndex: -1,
    autoComplete: "off" as const,
    "aria-hidden": true as const,
    "data-lpignore": "true",
    "data-1p-ignore": "true",
    style: HONEYPOT_STYLE,
  };

  /** Render inside the <form>. Invisible to humans and password managers. */
  const Honeypot = useCallback(
    (props?: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input
        ref={trap}
        type="text"
        name={fieldName}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        data-lpignore="true"
        data-1p-ignore="true"
        style={HONEYPOT_STYLE}
        {...props}
      />
    ),
    [fieldName]
  );

  /** Wrap any submit handler (plain event handler, or react-hook-form handleSubmit). */
  const guard =
    <E extends { preventDefault(): void }, R>(handler: (e: E) => R) =>
    (e: E): R | undefined => {
      const elapsed = start.current === 0 ? 0 : Date.now() - start.current;
      const reason: BotReason | null = trap.current?.value
        ? "honeypot"
        : elapsed < minTime
        ? "too-fast"
        : null;

      if (!reason) return handler(e);
      e.preventDefault();
      onBot?.(reason);
    };

  return { Honeypot, honeypotProps, guard };
}
