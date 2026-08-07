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

    <!-- Main tracking controls -->
    <div class="map-controls">
      <select id="workout-type" v-model="selectedType" title="Workout type">
        <option value="running">Running</option>
        <option value="cycling">Cycling</option>
      </select>

      <button
        :disabled="!hasLocated"
        @click="startTracking(selectedType)"
        class="start-tracking-btn"
      >
        Start Tracking
      </button>

      <button @click="stopTrackingPrompt" class="stop-tracking-btn">End Tracking</button>
    </div>

    <!-- Simulation controls (for indoor testing) -->
    <div class="simulation-controls">
      <button
        @click="initSimulatedPosition"
        class="sim-btn"
        title="Set simulated start to map center"
      >
        Set Simulation Start
      </button>

      <button
        @click="toggleAutoSim"
        class="sim-btn"
        :class="{ active: autoSim }"
        title="Toggle auto simulation"
      >
        Auto: {{ autoSim ? 'On' : 'Off' }}
      </button>
    </div>

    <p
      v-if="isTracking"
      style="
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 14px;
      "
    >
      Distance: {{ store.totalDistance.toFixed(2) }} km • Speed:
      {{ store.currentSpeed.toFixed(1) }} km/h • Elapsed: {{ elapsedMinutes.toFixed(1) }} min
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTracking } from '@/composables/useTracking'
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nextTick, onMounted, ref, watch } from 'vue'

const { startTracking, stopTracking, cancelTracking, isTracking } = useTracking()

const store = useWorkoutStore()
const mapElement = ref<HTMLElement | null>(null)
const selectedType = ref<'running' | 'cycling'>('running')
const hasLocated = ref(false)

// Last Clicked Position & Rendered permanent polylines
const lastClickedPos = ref<[number, number] | null>(null)
const polylines = store.polylines

// Live tracking visuals
const livePolyline = ref<L.Polyline | null>(null)
const liveMarker = ref<L.Marker | null>(null)

const elapsedMinutes = ref(0)

// ---------- Simulation helpers ----------
const simulatedPos = ref<[number, number] | null>(null)
const autoSim = ref(false)
let autoSimInterval: number | null = null

function initSimulatedPosition() {
  if (!store.map) return

  // Prefer the last place the user clicked, otherwise fall back to map center
  if (lastClickedPos.value) {
    simulatedPos.value = [...lastClickedPos.value]
  } else {
    const center = store.map.getCenter()
    simulatedPos.value = [center.lat, center.lng]
  }

  hasLocated.value = true // allow Start Tracking during simulation

  alert(
    `Simulated start set to ${simulatedPos.value[0].toFixed(5)}, ${simulatedPos.value[1].toFixed(5)}`,
  )

  store.isSimulating = true
}

function simulateStep() {
  // Safety – only work while tracking
  if (!store.isTracking) {
    console.warn('Start Tracking first, then turn Auto on')
    return
  }

  if (!simulatedPos.value) {
    initSimulatedPosition()
    if (!simulatedPos.value) return
  }

  // Tiny move east/north
  simulatedPos.value = [simulatedPos.value[0] + 0.00005, simulatedPos.value[1] + 0.0001]

  const fake = {
    coords: {
      latitude: simulatedPos.value[0],
      longitude: simulatedPos.value[1],
      speed: 1.5, // m/s
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition

  store.addPosition(fake)
}

function toggleAutoSim() {
  if (!store.isTracking && !autoSim.value) {
    alert('Click “Start Tracking” first, then turn Auto on.')
    return
  }

  autoSim.value = !autoSim.value

  store.isSimulating = true

  if (autoSim.value) {
    autoSimInterval = window.setInterval(() => simulateStep(), 1000) as unknown as number
  } else {
    if (autoSimInterval) {
      clearInterval(autoSimInterval)
      autoSimInterval = null
    }
  }
}

// ---------- Leaflet icon fix ----------
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emit = defineEmits<{ showForm: [e: L.LeafletMouseEvent] }>()

// ---------- Locate user ----------
const locateUser = () => {
  if (!store.map) return

  if (!('geolocation' in navigator)) {
    console.warn('Geolocation not supported')
    return
  }

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
      })
        .setLatLng(coords)
        .setContent(`<div class="font-bold">📍 You are here!</div>`)

      store.map!.addLayer(userPopup)
      hasLocated.value = true
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
          message += 'Timeout — try again in an open area.'
          break
        default:
          message += 'Unknown error.'
      }
      console.error('Geolocation error:', error)
      alert(message)
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    },
  )
}

// ---------- Render permanent workout ----------
const renderMarker = (workout: Workout) => {
  if (!store.map || store.markers.has(workout.id)) return
  if (!Array.isArray(workout.coords) || workout.coords.length === 0) return

  const coordsArray = workout.coords as L.LatLngExpression[]

  // Polyline
  if (!polylines.has(workout.id)) {
    const pl = L.polyline(coordsArray, {
      color: workout.type === 'running' ? '#0ea5e9' : '#10b981',
      weight: 4,
    }).addTo(store.map as L.Map)
    polylines.set(workout.id, pl)
  }

  // Marker at the last point
  const last = coordsArray[coordsArray.length - 1]
  if (!last) return

  const marker = L.marker(last as [number, number]).addTo(store.map as L.Map)

  store.markers.set(workout.id, marker)

  const popup = L.popup({
    maxWidth: 250,
    minWidth: 100,
    autoClose: false,
    closeOnClick: false,
    closeButton: false,
    className: `${workout.type}-popup permanent-workout-popup`,
    offset: [0, -30],
  }).setLatLng(last).setContent(`
      <div class="font-semibold">
        ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}
        <br>
        <small>${workout.distance.toFixed(2)} km • ${workout.duration.toFixed(1)} min</small>
      </div>
    `)

  store.map.addLayer(popup)
  store.popups.set(workout.id, popup)

  marker.on('click', () => {
    store.map?.panTo(last)
  })

  store.markers.set(workout.id, marker)
}

// ---------- Stop / Cancel ----------
function stopTrackingPrompt() {
  console.log('End Tracking clicked')
  console.log('isTracking:', store.isTracking)
  console.log('path length:', store.currentPath.length)
  console.log('selectedType:', selectedType.value)

  if (!store.isTracking) {
    console.warn('Not tracking – ignoring')
    return
  }

  if (store.currentPath.length < 2) {
    console.warn('Too few points – cancelling')
    cancelTracking()
    return
  }

  console.log('Calling stopTracking…')
  stopTracking({ type: selectedType.value })
}

// ---------- Elapsed timer ----------
let elapsedInterval: number | null = null
watch(
  () => store.isTracking,
  (running) => {
    if (running) {
      elapsedInterval = window.setInterval(() => {
        const start = store.startTimestamp ?? Date.now()
        elapsedMinutes.value = Math.round(((Date.now() - start) / 60000) * 10) / 10
      }, 1000) as unknown as number
    } else {
      if (elapsedInterval) {
        clearInterval(elapsedInterval)
        elapsedInterval = null
      }
      elapsedMinutes.value = 0
    }
  },
)

// ---------- Map init ----------
onMounted(async () => {
  await nextTick()
  if (!mapElement.value) return

  // Initialize Leaflet map with default view (will be updated on locate)
  const map = L.map(mapElement.value).setView([42.6977, 23.3219], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  map.invalidateSize()
  store.map = map

  store.loadFromStorage()

  // Render any already-saved workouts
  store.workouts.forEach(renderMarker)

  // Prepare empty live polyline
  livePolyline.value = L.polyline([], { color: 'red', weight: 4 })

  map.on('click', (e: L.LeafletMouseEvent) => {
    lastClickedPos.value = [e.latlng.lat, e.latlng.lng]
    emit('showForm', e)
  })
})

// ---------- Live path watcher ----------
watch(
  () => store.currentPath,
  (coordsArray) => {
    if (!store.map) return

    const coords = coordsArray?.map((ll) => [ll.lat, ll.lng] as [number, number]) ?? []

    // Update / create live polyline
    if (livePolyline.value) {
      livePolyline.value.setLatLngs(coords)
      if (!store.map.hasLayer(livePolyline.value as L.Polyline)) {
        livePolyline.value.addTo(store.map as L.Map)
      }
    } else if (coords.length) {
      livePolyline.value = L.polyline(coords, { color: 'red', weight: 4 }).addTo(store.map as L.Map)
    }

    // Moving marker
    if (coords.length) {
      const last = coords[coords.length - 1]
      if (liveMarker.value) {
        liveMarker.value.setLatLng(last as [number, number])
      } else {
        const icon = L.divIcon({
          className: 'live-user-marker',
          html: '<div style="width:12px;height:12px;border-radius:50%;background:#f87171;border:2px solid white"></div>',
          iconSize: [12, 12],
        })
        liveMarker.value = L.marker(last as [number, number], { icon }).addTo(store.map as L.Map)
      }
    } else {
      // Path empty → remove live visuals
      if (liveMarker.value && store.map.hasLayer(liveMarker.value as L.Marker)) {
        store.map.removeLayer(liveMarker.value as L.Marker)
        liveMarker.value = null
      }
      if (livePolyline.value && store.map.hasLayer(livePolyline.value as L.Polyline)) {
        store.map.removeLayer(livePolyline.value as L.Polyline)
      }
    }
  },
  { deep: true },
)

// ---------- When tracking stops ----------
watch(
  () => store.isTracking,
  (running) => {
    if (running) return

    // Force-remove any leftover live visuals
    if (livePolyline.value && store.map?.hasLayer(livePolyline.value as L.Polyline)) {
      store.map.removeLayer(livePolyline.value as L.Polyline)
    }
    if (liveMarker.value && store.map?.hasLayer(liveMarker.value as L.Marker)) {
      store.map.removeLayer(liveMarker.value as L.Marker)
      liveMarker.value = null
    }

    // Re-render permanent workouts
    store.loadFromStorage()
    store.workouts.forEach(renderMarker)

    // Pan to the newest workout
    const last = store.workouts[0]
    if (last?.coords?.length && store.map) {
      store.map.panTo(last.coords[0] as [number, number], { animate: true })
    }
  },
)

// ---------- Watch for brand-new workouts ----------
watch(
  () => store.workouts,
  (newWorkouts) => {
    setTimeout(() => {
      newWorkouts.forEach((workout) => {
        if (!store.markers.has(workout.id)) {
          renderMarker(workout)
        }
      })
    }, 100)
  },
  { deep: true },
)
</script>
