import { useWorkoutStore } from '@/stores/useWorkouts'
import { ref } from 'vue'

export function useTracking() {
  const store = useWorkoutStore()
  const watchId = ref<number | null>(null)

  function startTracking(type: 'running' | 'cycling' = 'running') {
    store.startTracking(type)

    // Skip real GPS when we are in simulation mode
    if (store.isSimulating) {
      console.log('Simulation mode – real geolocation disabled')
      return
    }

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not available')
      return
    }

    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        console.log('New position:', position)
        store.addPosition(position)
      },
      (error) => {
        console.error('Tracking error:', error)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    ) as unknown as number
  }

  function stopTracking(meta?: { type?: 'running' | 'cycling'; description?: string }) {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
    store.stopTracking(meta)
    store.isSimulating = false
  }

  function cancelTracking() {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
    store.cancelTracking()
    store.isSimulating = false
  }

  return {
    startTracking,
    stopTracking,
    cancelTracking,
    isTracking: store.isTracking,
  }
}
