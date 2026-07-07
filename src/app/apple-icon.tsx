import { ImageResponse } from "next/og";

// Home-screen icon (iOS/Android "add to home screen"): the BÆRA wordmark on the
// brand clay background. 180×180 is Apple's recommended touch-icon size; iOS
// rounds the corners automatically.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const CLAY = "#be7e5e";
const CREAM = "#f4efe6";

export default function AppleIcon() {
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
          fontSize: 44,
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
