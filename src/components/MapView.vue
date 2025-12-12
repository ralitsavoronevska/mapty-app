<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWorkoutStore } from '@/stores/useWorkouts'

const store = useWorkoutStore()
const mapElement = ref<HTMLElement | null>(null)

// Track rendered markers by ID to avoid duplicates/conflicts
const markers = ref<Map<string, L.Marker>>(new Map())

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emit = defineEmits<{ showForm: [e: L.LeafletMouseEvent] }>()

const renderMarker = (workout: any) => {
  if (!store.map || markers.value.has(workout.id)) return

  const marker = L.marker(workout.coords).addTo(store.map as L.Map)

  const popup = L.popup({
    maxWidth: 250,
    minWidth: 100,
    autoClose: false,
    closeOnClick: false,
    closeButton: true,    
    className: `${workout.type}-popup permanent-workout-popup`,
    offset: [0, -30]
  })
    .setLatLng(workout.coords)
    .setContent(
      `<div class="font-semibold">
        ${workout.type === 'running' ? '🏃‍♂️ Running' : '🚴‍♀️ Cycling'} on ${workout.description.split(' on ')[1]}
        <br>
        <small>${workout.distance} km • ${workout.duration} min</small>
      </div>`
    )

  // THIS IS THE MAGIC: Add popup as independent layer
  store.map.addLayer(popup)

  // Optional: Click marker to pan to it (since popup is always visible)
  marker.on('click', () => {
    store.map?.panTo(workout.coords)
  })

  markers.value.set(workout.id, marker)
}

onMounted(() => {
  if (!mapElement.value) return

  const map = L.map(mapElement.value).setView([42.6977, 23.3219], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  store.map = map

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const coords: [number, number] = [latitude, longitude]
        map.setView(coords, 15, { animate: true })

        // "You are here!" as permanent popup — matches workout style exactly
        const userMarker = L.marker(coords).addTo(map)

        const userPopup = L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          className: 'permanent-workout-popup you-are-here-popup',
          offset: [0, -30]
        })
          .setLatLng(coords)
          .setContent(`
            <div class="font-bold">
              📍 You are here!
            </div>
          `)

        map.addLayer(userPopup)  // Permanent independent popup
      },
      () => {
        map.setView([42.6977, 23.3219], 13)
      }
    )
  }

  map.on('click', (e: L.LeafletMouseEvent) => emit('showForm', e))

  // Render saved workouts on load — all popups open
  store.workouts.forEach(renderMarker)
})

// Watch for new workouts → render instantly with popup open
watch(
  () => store.workouts,
  (newWorkouts) => {
    setTimeout(() => {
      newWorkouts.forEach((workout: any) => {
        if (!markers.value.has(workout.id)) {
          renderMarker(workout)
        }
      })
    }, 100)
  },
  { deep: true }
)
</script>

<template>
  <div ref="mapElement" class="h-full w-full"></div>
</template>

<style>
/* NOT scoped — this reaches Leaflet popups */
.permanent-workout-popup .leaflet-popup-content-wrapper {
  background: #42484d !important;
  color: white !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.permanent-workout-popup .leaflet-popup-tip {
  background: #42484d !important;
  color: white !important;
}

/* Type-specific borders */
.running-popup .leaflet-popup-content-wrapper {
  border-left: 6px solid #10b981 !important;
}

.cycling-popup .leaflet-popup-content-wrapper {
  border-left: 6px solid #f59e0b !important;
}

/* "You are here!" popup — now matches perfectly */
.you-are-here-popup .leaflet-popup-content-wrapper {
  background: #42484d !important;
  color: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4) !important;
  border-left: 6px solid #3b82f6 !important; /* Blue border */
}

.you-are-here-popup .leaflet-popup-tip {
  background: #42484d !important;
  color: white !important;
}

.you-are-here-popup .leaflet-popup-content {
  font-weight: bold !important;
  color: white !important;
  text-align: center !important;
}
</style>