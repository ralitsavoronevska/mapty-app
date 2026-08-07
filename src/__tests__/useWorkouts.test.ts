import { useWorkoutStore } from '@/stores/useWorkouts'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('useWorkoutStore basic persistence', () => {
  let store: ReturnType<typeof useWorkoutStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWorkoutStore()
    localStorage.clear()
    store.workouts.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and loads workouts via localStorage', () => {
    const w = {
      id: 'abc',
      type: 'running' as const,
      coords: [[1, 2]] as [number, number][],
      distance: 1,
      duration: 1,
      date: '2028-08-03',
      description: 'Test workout',
    }
    store.addWorkout(w)
    expect(store.workouts[0]).toEqual(w)

    // Clear in-memory and reload
    store.workouts.length = 0
    store.loadFromStorage()
    expect(store.workouts[0]).toEqual(w)
  })

  it('starts tracking, records position data, and resets after stopping', () => {
    store.startTracking('running')

    const firstPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 1.5,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition

    const secondPosition = {
      coords: {
        latitude: 0.01,
        longitude: 0.01,
        speed: 2,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now() + 1000,
    } as GeolocationPosition

    store.addPosition(firstPosition)
    store.addPosition(secondPosition)

    expect(store.currentPath).toHaveLength(2)
    expect(store.totalDistance).toBeGreaterThan(0)
    expect(store.currentSpeed).toBe(7.2)

    const workout = store.stopTracking({ type: 'running' })

    expect(workout.type).toBe('running')
    expect(workout.description).toContain('running')
    expect(workout.pace).toBeDefined()
    expect(store.workouts[0]).toEqual(workout)
    expect(store.currentPath).toHaveLength(0)
    expect(store.totalDistance).toBe(0)
    expect(store.currentSpeed).toBe(0)
    expect(store.isTracking).toBe(false)
  })

  it('ignores tiny position jitter when distance is below the threshold', () => {
    store.startTracking('running')

    const firstPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition

    const tinyShift = {
      coords: {
        latitude: 0.000001,
        longitude: 0.000001,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now() + 1000,
    } as GeolocationPosition

    store.addPosition(firstPosition)
    store.addPosition(tinyShift)

    expect(store.currentPath).toHaveLength(2)
    expect(store.totalDistance).toBe(0)
    expect(store.currentSpeed).toBe(0)
  })

  it('uses the active tracking type when stopTracking is called without metadata', () => {
    store.startTracking('cycling')

    const firstPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition

    const secondPosition = {
      coords: {
        latitude: 0.01,
        longitude: 0.01,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now() + 1000,
    } as GeolocationPosition

    store.addPosition(firstPosition)
    store.addPosition(secondPosition)

    const workout = store.stopTracking()

    expect(workout.type).toBe('cycling')
    expect(workout.description).toContain('cycling')
    expect(workout.speed).toBeDefined()
    expect(store.workouts).toHaveLength(1)
  })

  it('creates a cycling workout with speed data and no pace', () => {
    store.startTracking('cycling')

    const firstPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition

    const secondPosition = {
      coords: {
        latitude: 0.01,
        longitude: 0.01,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now() + 1000,
    } as GeolocationPosition

    store.addPosition(firstPosition)
    store.addPosition(secondPosition)

    const workout = store.stopTracking({ type: 'cycling' })

    expect(workout.type).toBe('cycling')
    expect(workout.speed).toBeDefined()
    expect(workout.pace).toBeUndefined()
    expect(store.workouts).toHaveLength(1)
  })

  it('keeps the existing active type when stopTracking is called without explicit metadata', () => {
    store.startTracking('running')

    const firstPosition = {
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition

    const secondPosition = {
      coords: {
        latitude: 0.01,
        longitude: 0.01,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now() + 1000,
    } as GeolocationPosition

    store.addPosition(firstPosition)
    store.addPosition(secondPosition)

    const workout = store.stopTracking()

    expect(workout.type).toBe('running')
    expect(workout.description).toContain('running')
    expect(workout.pace).toBeDefined()
  })

  it('cancels tracking without saving a workout', () => {
    store.startTracking('running')
    store.addPosition({
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition)

    store.cancelTracking()

    expect(store.isTracking).toBe(false)
    expect(store.currentPath).toHaveLength(0)
    expect(store.totalDistance).toBe(0)
    expect(store.currentSpeed).toBe(0)
    expect(store.workouts).toHaveLength(0)
  })

  it('removes a single workout and its map overlays', () => {
    const workout = {
      id: 'remove-me',
      type: 'running' as const,
      coords: [[1, 2]] as [number, number][],
      distance: 1,
      duration: 1,
      date: '2026-08-03',
      description: 'Test workout',
    }

    store.workouts = [workout]
    const marker = { remove: vi.fn() } as unknown as L.Marker
    const popup = { remove: vi.fn() } as unknown as L.Popup
    const polyline = { remove: vi.fn() } as unknown as L.Polyline

    store.markers.set(workout.id, marker as unknown as L.Marker)
    store.popups.set(workout.id, popup)
    store.polylines.set(workout.id, polyline)

    store.removeWorkout(workout.id)

    expect(store.workouts).toHaveLength(0)
    expect(marker.remove).toHaveBeenCalledTimes(1)
    expect(popup.remove).toHaveBeenCalledTimes(1)
    expect(polyline.remove).toHaveBeenCalledTimes(1)
    expect(store.markers.has(workout.id)).toBe(false)
    expect(store.popups.has(workout.id)).toBe(false)
    expect(store.polylines.has(workout.id)).toBe(false)
  })

  it('clears all workouts and releases stored overlays', () => {
    const reloadMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadMock })

    const workout = {
      id: 'clear-me',
      type: 'running' as const,
      coords: [[1, 2]] as [number, number][],
      distance: 1,
      duration: 1,
      date: '2026-08-03',
      description: 'Test workout',
    }

    store.workouts = [workout]
    store.markers.set(workout.id, { remove: vi.fn() } as unknown as L.Marker)
    store.popups.set(workout.id, { remove: vi.fn() } as unknown as L.Popup)
    store.polylines.set(workout.id, { remove: vi.fn() } as unknown as L.Polyline)

    store.clearAll()

    expect(store.workouts).toHaveLength(0)
    expect(store.markers.size).toBe(0)
    expect(store.popups.size).toBe(0)
    expect(store.polylines.size).toBe(0)
    expect(localStorage.getItem('workouts')).toBeNull()
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
