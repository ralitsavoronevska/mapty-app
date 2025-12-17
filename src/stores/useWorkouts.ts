import { defineStore } from 'pinia'
import { ref } from 'vue'
import L from 'leaflet'

export interface Workout {
  id: string
  type: 'running' | 'cycling'
  coords: [number, number]
  distance: number
  duration: number
  cadence?: number
  elevation?: number
  date: string
  description: string
  pace?: number
  speed?: number
}

export const useWorkoutStore = defineStore('workout', () => {
  const workouts = ref<Workout[]>([])
  const map = ref<L.Map | null>(null)

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
    localStorage.removeItem('workouts')
    location.reload()
  }

  return { workouts, map, loadFromStorage, addWorkout, clearAll }
})
