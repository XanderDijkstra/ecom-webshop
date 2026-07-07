import { ImageResponse } from "next/og";

// Branded 1200x630 social card. Generated at build time (statically optimized).
// Uses next/og's default font so it carries no external asset dependency.
export const alt =
  "BÆRA Bæreslyngen - ergonomisk bæresele i pustende bomull, fra nyfødt til 25 kg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#f4efe6";
const INK = "#2a2622";
const CLAY = "#be7e5e";
const MUTED = "#55504a";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          color: INK,
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: CLAY,
            marginBottom: 28,
          }}
        >
          Ergonomisk bæreslynge
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: 1,
          }}
        >
          BÆRA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            color: MUTED,
            marginTop: 36,
            maxWidth: 880,
            lineHeight: 1.3,
          }}
        >
          Hold den lille tett inntil deg. Fra nyfødt til 25 kg.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: INK,
            marginTop: 44,
            borderTop: `2px solid ${CLAY}`,
            paddingTop: 24,
          }}
        >
          Pustende bomull · Fri frakt over 500 kr
        </div>
      </div>
    ),
    { ...size },
  );
}
