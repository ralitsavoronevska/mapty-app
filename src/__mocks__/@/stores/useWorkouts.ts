import { ref } from 'vue'
import type { Workout } from '@/stores/useWorkouts'

const workouts = ref<Workout[]>([])

export const useWorkoutStore = () => ({
  workouts: workouts.value,
  addWorkout: (workout: Workout) => workouts.value.unshift(workout),
  map: { closePopup: () => {} },
})

// Export for reset
export const __resetWorkouts = () => (workouts.value = [])
