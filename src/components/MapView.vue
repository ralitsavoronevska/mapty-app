<script setup lang="ts">
import { onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useWorkoutStore } from '@/stores/useWorkouts'

const store = useWorkoutStore()
const mapElement = ref<HTMLElement | null>(null)

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emit = defineEmits<{ showForm: [e: L.LeafletMouseEvent] }>()

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
    .setPopupContent(`${workout.type === 'running' ? 'Running' : 'Cycling'} ${workout.description}`)
    .openPopup()
}

defineExpose({ renderMarker })

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
        L.marker(coords)
          .addTo(map)
          .bindTooltip('You are here!', { permanent: true, direction: 'top', className: 'leaflet-tooltip-top' })
          .openTooltip()
      },
      () => map.setView([42.6977, 23.3219], 13)
    )
  }

  map.on('click', (e: L.LeafletMouseEvent) => emit('showForm', e))

  // RENDER SAVED WORKOUTS — NOW AFTER LOAD DELAY IN APP.VUE
  setTimeout(() => store.workouts.forEach(renderMarker), 600)
})
</script>

<template>
  <div ref="mapElement" class="h-full w-full"></div>
</template>

<style scoped>
.running-popup .leaflet-popup-content-wrapper { border-left: 6px solid #10b981; }
.cycling-popup .leaflet-popup-content-wrapper { border-left: 6px solid #f59e0b; }
.leaflet-tooltip-pane .leaflet-tooltip.leaflet-tooltip-top#leaflet-tooltip-59 {
  margin-top: -15px !important;
  margin-left: -15px !important;
}
</style>