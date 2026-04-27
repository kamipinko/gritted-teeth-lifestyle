export default function manifest() {
  return {
    name: 'Gritted Teeth Lifestyle',
    short_name: 'GTL',
    description: 'Track your diet and build your fitness',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
