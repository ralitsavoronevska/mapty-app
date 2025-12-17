import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutStore } from '@/stores/useWorkouts'
import { describe, it, expect, beforeEach } from 'vitest'

describe('useWorkoutStore', () => {
  let store: ReturnType<typeof useWorkoutStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWorkoutStore()
    localStorage.clear() // Clean storage
    store.workouts.length = 0
  })

  it('adds a running workout and saves to localStorage', () => {
    const workout = {
      id: '123',
      type: 'running' as const,
      coords: [42.6977, 23.3219] as [number, number],
      distance: 10,
      duration: 60,
      cadence: 180,
      pace: 6,
      date: '2025-12-17',
      description: 'Running on December 17',
    }

    store.addWorkout(workout)

    expect(store.workouts).toHaveLength(1)
    expect(store.workouts[0]).toEqual(workout)
    expect(JSON.parse(localStorage.getItem('workouts') || '[]')).toEqual([workout])
  })

  it('adds a cycling workout and saves to localStorage', () => {
    const workout = {
      id: '124',
      type: 'cycling' as const,
      coords: [42.6977, 23.3219] as [number, number],
      distance: 20,
      duration: 30,
      elevation: 100,
      speed: 40,
      date: '2025-12-17',
      description: 'Cycling on December 17',
    }

    store.addWorkout(workout)

    expect(store.workouts).toHaveLength(1)
    expect(store.workouts[0]).toEqual(workout)
    expect(JSON.parse(localStorage.getItem('workouts') || '[]')).toEqual([workout])
  })

  it('loads workouts from localStorage', () => {
    const saved = [
      {
        id: '1',
        type: 'cycling',
        coords: [42, 23] as [number, number],
        distance: 20,
        duration: 30,
        elevationGain: 100,
        speed: 40,
        date: '2025-12-15',
        description: 'Test',
      },
    ]
    localStorage.setItem('workouts', JSON.stringify(saved))

    store.loadFromStorage()

    expect(store.workouts).toEqual(saved)
  })

  it('clears all workouts and localStorage', () => {
    store.addWorkout({
      id: '1',
      type: 'running',
      coords: [0, 0] as [number, number],
      distance: 5,
      duration: 30,
      cadence: 170,
      pace: 6,
      date: '',
      description: '',
    })
    store.clearAll()

    expect(store.workouts).toHaveLength(0)
    expect(localStorage.getItem('workouts')).toBeNull()
  })
})
