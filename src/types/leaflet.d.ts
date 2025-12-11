import 'leaflet'

declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}

declare module 'leaflet' {
  interface MapOptions {
    // Add any custom options if needed
  }
}

// This makes L available globally in .ts files
declare const L: typeof import('leaflet')
export default L