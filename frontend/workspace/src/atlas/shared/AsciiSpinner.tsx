import { type JSX, Show } from "solid-js"
import { FONT_SANS } from "@/styles/tokens"

interface AsciiSpinnerProps {
  label?: string
  size?: number
  color?: string
  speed?: number
}

export function AsciiSpinner(props: AsciiSpinnerProps): JSX.Element {
  const size = () => props.size ?? 14
  const pxWidth = () => Math.max(14, Math.round(size() * 1.1))
  const pxHeight = () => Math.max(18, Math.round(size() * 1.5))
  const animDuration = () => (props.speed ? props.speed * 20 : 1600)

  return (
    <span
      class="biohelix-spinner"
      role="status"
      aria-label={props.label ?? "Loading"}
      style={{
        "font-family": FONT_SANS,
        display: "inline-flex",
        "align-items": "center",
        gap: "6px",
        "vertical-align": "middle",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          "align-items": "center",
          "justify-content": "center",
          width: `${pxWidth()}px`,
          height: `${pxHeight()}px`,
          perspective: "180px",
          "flex-shrink": 0,
        }}
      >
        <svg
          viewBox="0 0 140 220"
          style={{
            width: "100%",
            height: "100%",
            overflow: "visible",
            animation: `biohelix-dna-spin ${animDuration()}ms linear infinite, biohelix-dna-glow 2.5s ease-in-out infinite`,
            "transform-origin": "70px 115px",
          }}
          aria-hidden="true"
        >
          <line x1="38" y1="65" x2="102" y2="65" stroke="#818cf8" stroke-width="10" stroke-linecap="round" opacity="0.9" />
          <line x1="38" y1="165" x2="102" y2="165" stroke="#818cf8" stroke-width="10" stroke-linecap="round" opacity="0.9" />
          <path d="M 70,15 Q 20,65 70,115 T 70,215" stroke="#06b6d4" stroke-width="14" fill="none" stroke-linecap="round" />
          <path d="M 70,15 Q 120,65 70,115 T 70,215" stroke="#a855f7" stroke-width="14" fill="none" stroke-linecap="round" />
          <circle cx="70" cy="15" r="14" fill="#06b6d4" />
          <circle cx="70" cy="115" r="14" fill="#3b82f6" />
          <circle cx="70" cy="215" r="14" fill="#a855f7" />
        </svg>
      </span>
      <Show when={props.label}>
        <span
          style={{
            "font-size": `${size()}px`,
            "font-weight": 500,
            color: props.color ?? "var(--color-text, #1e1b4b)",
          }}
        >
          {props.label}
        </span>
      </Show>
    </span>
  )
}
