export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Tactico - The Ultimate Football Universe Simulator" />
        <title>Tactico - Football Manager</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
