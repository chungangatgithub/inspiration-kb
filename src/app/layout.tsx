import "./globals.css";

export const metadata = {
  title: "Inspiration KB",
  description: "Knowledge base for creative inspiration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
