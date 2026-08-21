import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f87171",
          borderRadius: 7,
          fontWeight: 900,
          fontFamily: "serif",
          border: "1px solid #3f3f46",
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
