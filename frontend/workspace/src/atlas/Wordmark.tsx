import { type JSX, Show } from "solid-js"
import { FONT_SANS } from "@/styles/tokens"
import { ProviderIcon } from "@synsci/ui/provider-icon"

interface WordmarkProps {
  size?: "sm" | "md" | "lg"
  /** Label only (no logo) for tight spaces. */
  textOnly?: boolean
  onClick?: () => void
}

export function Wordmark(props: WordmarkProps): JSX.Element {
  const size = () => props.size ?? "md"
  const px = () =>
    size() === "lg" ? { logo: 30, text: 28 } : size() === "sm" ? { logo: 20, text: 14.5 } : { logo: 26, text: 22 }
  const weight = () => (size() === "sm" ? "var(--font-weight-emphasis)" : "var(--font-weight-regular)")
  const rootStyle = (): JSX.CSSProperties => ({
    all: "unset",
    cursor: props.onClick ? "pointer" : "default",
    display: "inline-flex",
    "align-items": "center",
    gap: size() === "sm" ? "7px" : "10px",
  })
  const content = () => (
    <>
      <Show when={!props.textOnly}>
        <svg
          viewBox="0 0 140 220"
          aria-hidden="true"
          style={{
            width: `${px().logo}px`,
            height: `${px().logo}px`,
            "flex-shrink": 0,
          }}
        >
          <path d="M 70,15 Q 20,65 70,115 T 70,215" stroke="#06b6d4" stroke-width="14" fill="none" stroke-linecap="round" />
          <path d="M 70,15 Q 120,65 70,115 T 70,215" stroke="#a855f7" stroke-width="14" fill="none" stroke-linecap="round" />
          <line x1="38" y1="65" x2="102" y2="65" stroke="#94a3b8" stroke-width="9" stroke-linecap="round" />
          <line x1="38" y1="165" x2="102" y2="165" stroke="#94a3b8" stroke-width="9" stroke-linecap="round" />
          <circle cx="70" cy="15" r="14" fill="#06b6d4" />
          <circle cx="70" cy="115" r="14" fill="#3b82f6" />
          <circle cx="70" cy="215" r="14" fill="#a855f7" />
        </svg>
      </Show>
      <span
        aria-hidden="true"
        style={{
          "font-family": FONT_SANS,
          "font-size": `${px().text}px`,
          "font-weight": weight(),
          "letter-spacing": "-0.02em",
          color: "var(--color-text)",
          "white-space": "nowrap",
        }}
      >
        BioHelix
      </span>
      <span
        style={{
          "font-size": "10px",
          "font-family": "monospace",
          "font-weight": "bold",
          color: "#6366f1",
          background: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.28)",
          padding: "2px 6px",
          "border-radius": "4px",
          "margin-left": "4px",
        }}
      >
        by Tomcu
      </span>
    </>
  )
  return (
    <Show
      when={props.onClick}
      fallback={
        <span class="atlas-wordmark" role="img" aria-label="BioHelix by Tomcu" style={rootStyle()}>
          {content()}
        </span>
      }
    >
      <button type="button" class="atlas-wordmark" aria-label="BioHelix by Tomcu" onClick={props.onClick} style={rootStyle()}>
        {content()}
      </button>
    </Show>
  )
}
