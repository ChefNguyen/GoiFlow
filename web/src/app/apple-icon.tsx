import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 105,
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f87171",
          borderRadius: 36,
          fontWeight: 900,
          fontFamily: "serif",
          border: "2px solid #3f3f46",
        }}
      >
        語
      </div>
    ),
    {
      ...size,
    }
  );
}
