import { ImageResponse } from "next/og";

// Generated favicon / browser-tab icon: the BÆRA wordmark on the brand clay
// background (a filled colour so it stands out against white browser chrome).
// Uses next/og's default font, so no external asset dependency (matches the
// opengraph-image approach).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const CLAY = "#be7e5e";
const CREAM = "#f4efe6";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CLAY,
          color: CREAM,
          fontSize: 46,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        BÆRA
      </div>
    ),
    { ...size },
  );
}
