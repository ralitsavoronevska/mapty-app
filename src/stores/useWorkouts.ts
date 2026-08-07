import L from 'leaflet'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const markers = ref<Map<string, L.Marker>>(new Map())
const popups = ref<Map<string, L.Popup>>(new Map())
const polylines = ref<Map<string, L.Polyline>>(new Map())
const isSimulating = ref(false)

export interface Workout {
  id: string
  type: 'running' | 'cycling'
  date: string
  description: string
  coords: [number, number][]
  distance: number
  duration: number
  pace?: number
  speed?: number
  cadence?: number
  elevation?: number
}

export const useWorkoutStore = defineStore('workout', () => {
  const workouts = ref<Workout[]>([])
  const map = ref<L.Map | null>(null)
  const isTracking = ref(false)
  const currentPath = ref<L.LatLng[]>([])
  const totalDistance = ref(0)
  const currentSpeed = ref(0)
  const activeType = ref<'running' | 'cycling'>('running')
  const startTimestamp = ref<number | null>(null)

  function startTracking(type: 'running' | 'cycling') {
    isTracking.value = true
    currentPath.value = []
    totalDistance.value = 0
    currentSpeed.value = 0
    activeType.value = type
    startTimestamp.value = Date.now()
  }

  function haversineDistance(coord1: L.LatLng, coord2: L.LatLng) {
    const R = 6371 // km
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180
    const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function addPosition(position: GeolocationPosition) {
    const { latitude, longitude, speed } = position.coords
    const latLng = L.latLng(latitude, longitude)

    currentPath.value.push(latLng)

    // Ignore tiny jitter under 2 meters
    if (currentPath.value.length > 1) {
      const prev = currentPath.value[currentPath.value.length - 2]
      if (prev) {
        const dist = haversineDistance(prev, latLng)
        if (dist >= 0.002) {
          totalDistance.value += dist
        }
      }
    }

    // Instantaneous speed (m/s → km/h)
    currentSpeed.value = speed ? speed * 3.6 : 0
  }

  function stopTracking(meta?: { type?: 'running' | 'cycling'; description?: string }) {
    isTracking.value = false
    const start = startTimestamp.value ?? Date.now()
    const duration = (Date.now() - start) / 60000 // minutes

    const workoutType = meta?.type ?? activeType.value ?? 'running'
    const description = meta?.description ?? `${new Date().toLocaleDateString()} - ${workoutType}`

    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      type: workoutType,
      coords: currentPath.value.map((p) => [p.lat, p.lng]),
      distance: totalDistance.value,
      duration,
      pace:
        workoutType === 'running' && totalDistance.value > 0
          ? duration / totalDistance.value
          : undefined,
      speed:
        workoutType === 'cycling' && duration > 0
          ? totalDistance.value / (duration / 60) // average km/h
          : currentSpeed.value,
      date: new Date().toISOString(),
      description,
    }

    workouts.value.unshift(newWorkout)
    saveToStorage()

    // Reset tracking state
    currentPath.value = []
    totalDistance.value = 0
    currentSpeed.value = 0
    activeType.value = 'running'
    startTimestamp.value = null

    return newWorkout
  }

  /** Cancel tracking without saving a workout */
  function cancelTracking() {
    isTracking.value = false
    currentPath.value = []
    totalDistance.value = 0
    currentSpeed.value = 0
    activeType.value = 'running'
    startTimestamp.value = null
  }

  const loadFromStorage = () => {
    const data = localStorage.getItem('workouts')
    if (data) workouts.value = JSON.parse(data)
  }

  const saveToStorage = () => {
    localStorage.setItem('workouts', JSON.stringify(workouts.value))
  }

  const addWorkout = (workout: Workout) => {
    workouts.value.unshift(workout)
    saveToStorage()
  }

  const clearAll = () => {
    workouts.value = []
    markers.value.forEach((marker) => marker.remove())
    markers.value.clear()
    popups.value.forEach((popup) => popup.remove())
    popups.value.clear()
    polylines.value.forEach((polyline) => polyline.remove())
    polylines.value.clear()
    localStorage.removeItem('workouts')
    location.reload()
  }

  const removeWorkout = (id: string) => {
    workouts.value = workouts.value.filter((workout) => workout.id !== id)

    const marker = markers.value.get(id)
    if (marker) {
      marker.remove()
      markers.value.delete(id)
    }

    const popup = popups.value.get(id)
    if (popup) {
      popup.remove()
      popups.value.delete(id)
    }

    const polyline = polylines.value.get(id)
    if (polyline) {
      polyline.remove()
      polylines.value.delete(id)
    }

    saveToStorage()
  }

  return {
    workouts,
    map,
    markers,
    popups,
    polylines,
    isSimulating,
    loadFromStorage,
    addWorkout,
    clearAll,
    removeWorkout,
    startTimestamp,
    isTracking,
    currentPath,
    totalDistance,
    currentSpeed,
    startTracking,
    addPosition,
    stopTracking,
    cancelTracking,
  }
})
