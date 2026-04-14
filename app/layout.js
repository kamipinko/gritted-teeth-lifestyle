import './globals.css'

export const metadata = {
  title: 'Gritted Teeth Lifestyle',
  description: 'Track your diet and build your fitness',
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
