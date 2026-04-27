import './globals.css'
import { IOSPWAKeyboardFix } from './ios-pwa-keyboard-fix'

export const metadata = {
  title: 'Gritted Teeth Lifestyle',
  description: 'Track your diet and build your fitness',
  appleWebApp: {
    capable: true,
    title: 'GTL',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <IOSPWAKeyboardFix />
      </body>
    </html>
  )
}
