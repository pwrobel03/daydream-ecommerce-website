import { ImageResponse } from "next/og";

export const alt = "Daydream — handcrafted granola & breakfast bars";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generowany w czasie budowania, więc podgląd linku nie zależy od pliku
// wrzuconego ręcznie do public/ ani od dostępności bazy.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#faf7f2",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Daydream
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 36,
            opacity: 0.6,
            maxWidth: 900,
          }}
        >
          Handcrafted granola, muesli and breakfast bars — small batch, whole
          ingredients.
        </div>
      </div>
    ),
    size
  );
}
