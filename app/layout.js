import './globals.css'

export const metadata = {
  title: 'Gritted Teeth Lifestyle',
  description: 'Track your diet and build your fitness',
  // appleWebApp intentionally omitted — apple-mobile-web-app-capable forced iOS
  // into full standalone mode, which has a known soft-keyboard bug that no
  // amount of JS focus handling could work around. Manifest now uses
  // display:'minimal-ui' so iOS shows a thin URL bar but inputs work.
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
