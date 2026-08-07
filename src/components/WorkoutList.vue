<template>
  <ul class="workouts-list scrollbar-custom" :class="{ 'pr-2': showPr4 }">
    <li
      v-for="workout in store.workouts"
      :key="workout.id"
      @click="moveToWorkout(workout)"
      class="workout-item"
      :class="workout.type === 'running' ? 'running-border' : 'cycling-border'"
    >
      <button
        class="delete-workout-btn"
        type="button"
        aria-label="Delete workout"
        @click.stop.prevent="deleteWorkout(workout)"
        title="Delete workout"
      >
        ×
      </button>

      <h2 class="text-sm md:text-lg font-bold text-white mb-3 pr-6">
        {{ workout.description }}
      </h2>

      <div class="flex justify-between text-xs md:text-sm">
        <div class="flex items-center gap-2">
          <span>{{ workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }}</span>
          <span class="font-bold">{{ workout.distance.toFixed(2) }} km</span>
        </div>

        <div class="flex items-center gap-2">
          <span>⏱</span>
          <span class="font-bold">{{ workout.duration.toFixed(1) }} min</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.type === 'running'">
          <span>⚡️</span>
          <span class="font-bold">{{ workout.pace?.toFixed(2) }} min/km</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.type === 'cycling'">
          <span>⚡️</span>
          <span class="font-bold">{{ workout.speed?.toFixed(1) }} km/h</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.cadence">
          <span> fen</span>
          <span class="font-bold">{{ workout.cadence.toFixed(0) }} spm</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.elevation">
          <span>⛰</span>
          <span class="font-bold">{{ workout.elevation.toFixed(0) }} m</span>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'
import { computed } from 'vue'

const store = useWorkoutStore()

const moveToWorkout = (workout: Workout) => {
  if (!workout.coords?.length || !store.map) return

  store.map.flyTo(workout.coords[0] as [number, number], 15, {
    animate: true,
    duration: 1,
  })

  // Raise the popup (this is what you actually see)
  const popup = store.popups.get(workout.id)
  if (popup) {
    popup.bringToFront()
  }

  // Optional: also raise the marker icon
  const marker = store.markers.get(workout.id)
  if (marker) {
    marker.setZIndexOffset(2000)
  }
}

const deleteWorkout = (workout: Workout) => {
  store.removeWorkout(workout.id)
}

const showPr4 = computed(() => {
  return (
    (store.workouts.length > 1 && typeof window !== 'undefined' && window.innerWidth < 1280) ||
    (store.workouts.length > 5 && typeof window !== 'undefined' && window.innerWidth >= 1280)
  )
})
</script>
