<script setup lang="ts">
import { onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWorkoutStore } from '@/stores/useWorkouts'

const store = useWorkoutStore()

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emit = defineEmits<{
  showForm: [event: L.LeafletMouseEvent]
}>()

// RENDER MARKER — BLUE DEFAULT PIN FOR ALL WORKOUTS
const renderMarker = (workout: any) => {
  if (!store.map) return

  L.marker(workout.coords)
    .addTo(store.map as L.Map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`
      })
    )
    .setPopupContent(
      `${workout.type === 'running' ? 'Running' : 'Cycling'} ${workout.description}`
    )
    .openPopup()
}

// EXPOSE renderMarker SO FORM CAN CALL IT
defineExpose({ renderMarker })

onMounted(() => {
  const mapElement = document.getElementById('map')
  if (!mapElement) return

  const map = L.map('map').setView([42.6977, 23.3219], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  store.map = map

  // AUTO-LOCATE USER → BLUE DEFAULT PIN
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const userCoords: [number, number] = [latitude, longitude]
        map.setView(userCoords, 15, { animate: true })

        L.marker(userCoords)
          .addTo(map)
          .bindTooltip('You are here!', { permanent: true, direction: 'top' })
          .openTooltip()
      },
      () => {
        map.setView([42.6977, 23.3219], 13)
      }
    )
  }

  map.on('click', (e: L.LeafletMouseEvent) => emit('showForm', e))

  // RENDER ALL SAVED WORKOUTS ON LOAD — THIS WAS MISSING
  store.workouts.forEach(renderMarker)
})
</script>

<template>
  <div id="map" class="h-full w-full"></div>
</template>

<style scoped>
.running-popup .leaflet-popup-content-wrapper {
  border-left: 6px solid #10b981;
}
.cycling-popup .leaflet-popup-content-wrapper {
  border-left: 6px solid #f59e0b;
}
</style>