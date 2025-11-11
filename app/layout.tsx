// app/layout.tsx
// ▼これだと見つからない
// import "./globals.css";

// ▼こう直す（プロジェクト直下の styles/globals.css を参照）
import "../styles/globals.css";

export const metadata = {
  title: "Tiara Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
