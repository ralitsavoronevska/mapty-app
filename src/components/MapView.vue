<template>
  <div>
    <div ref="mapElement" class="map-view-content"></div>
    <!-- My Location Button -->
    <button @click="locateUser" class="my-location-btn" title="My location">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="my-location-svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'

const store = useWorkoutStore()
const mapElement = ref<HTMLElement | null>(null)

// Track rendered markers by ID to avoid duplicates/conflicts
const markers = ref<Map<string, L.Marker>>(new Map())

// Fix Leaflet default icon paths
// Cast prototype to unknown then to a minimal shape to avoid `any` lint rule
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emit = defineEmits<{ showForm: [e: L.LeafletMouseEvent] }>()

const locateUser = () => {
  if (!store.map) return

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const coords: [number, number] = [latitude, longitude]

        store.map!.setView(coords, 15, { animate: true })

        const userPopup = L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          className: 'permanent-workout-popup you-are-here-popup',
          offset: [0, -30],
        }).setLatLng(coords).setContent(`
            <div class="font-bold">
              📍 You are here!
            </div>
          `)

        store.map!.addLayer(userPopup)
      },
      (error) => {
        let message = 'Could not retrieve your location: '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Permission denied. Please allow location in browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            message += 'Location unavailable.'
            break
          case error.TIMEOUT:
            message += 'Timeout — try again in open area.'
            break
          default:
            message += 'Unknown error.'
        }
        console.error('Geolocation error:', error) // Check console!
        alert(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // 30s
        maximumAge: 0, // Fresh location
      },
    )
  } else {
    console.warn('Geolocation not supported')
  }
}

const renderMarker = (workout: Workout) => {
  if (!store.map || markers.value.has(workout.id)) return

  const marker = L.marker(workout.coords).addTo(store.map as L.Map)

  const popup = L.popup({
    maxWidth: 250,
    minWidth: 100,
    autoClose: false,
    closeOnClick: false,
    closeButton: false,
    className: `${workout.type}-popup permanent-workout-popup`,
    offset: [0, -30],
  })
    .setLatLng(workout.coords)
    .setContent(
      `<div class="font-semibold">
        ${workout.type === 'running' ? '🏃‍♂️ Running' : '🚴‍♀️ Cycling'} on ${(workout.description ?? '').split(' on ')[1] ?? ''}
        <br>
        <small>${workout.distance} km • ${workout.duration} min</small>
      </div>`,
    )

  // Add popup as independent layer
  store.map.addLayer(popup)

  // Click marker to pan to it (since popup is always visible)
  marker.on('click', () => {
    store.map?.panTo(workout.coords)
  })

  markers.value.set(workout.id, marker)
}

onMounted(async () => {
  await nextTick() // Wait for DOM sizes

  if (!mapElement.value) return

  const map = L.map(mapElement.value).setView([42.6977, 23.3219], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // Standard OSM (safer)
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  map.invalidateSize() // Forces redraw — fixes blank/white

  store.map = map

  map.on('click', (e: L.LeafletMouseEvent) => emit('showForm', e))

  // Render saved workouts on load — all popups open
  store.workouts.forEach(renderMarker)
})

// Watch for new workouts → render instantly with popup open
watch(
  () => store.workouts,
  (newWorkouts) => {
    setTimeout(() => {
      newWorkouts.forEach((workout: Workout) => {
        if (!markers.value.has(workout.id)) {
          renderMarker(workout)
        }
      })
    }, 100)
  },
  { deep: true },
)
</script>
