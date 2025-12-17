import 'leaflet'

declare global {
  interface Window {
    L: typeof import('leaflet')
  }
}

declare module 'leaflet' {
  interface MapOptions {
    // Example extension: allow an optional preferCanvas flag
    preferCanvas?: boolean
  }
}

// This makes L available globally in .ts files
declare const L: typeof import('leaflet')
export default L
