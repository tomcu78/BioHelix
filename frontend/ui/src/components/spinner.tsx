import { type ComponentProps } from "solid-js"

export function Spinner(props: {
  class?: string
  classList?: ComponentProps<"div">["classList"]
  style?: ComponentProps<"div">["style"]
}) {
  return (
    <span
      {...props}
      data-component="spinner"
      classList={{
        ...(props.classList ?? {}),
        [props.class ?? ""]: !!props.class,
      }}
      style={{
        display: "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        perspective: "180px",
        "vertical-align": "middle",
        width: "18px",
        height: "22px",
        ...(typeof props.style === "object" ? props.style : {}),
      }}
    >
      <svg
        viewBox="0 0 140 220"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          animation: "biohelix-dna-spin 1600ms linear infinite, biohelix-dna-glow 2.5s ease-in-out infinite",
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
  )
}
