import "./globals.css";

export const metadata = {
  title: "灵感知识库",
  description: "Inspiration knowledge base",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
