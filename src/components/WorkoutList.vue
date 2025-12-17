<template>
  <ul class="workouts-list scrollbar-custom" :class="{ 'pr-2': showPr4 }">
    <li
      v-for="workout in store.workouts"
      :key="workout.id"
      @click="moveToWorkout(workout)"
      class="workout-item"
      :class="
        workout.type === 'running'
          ? 'border-l-4 border-(--brand-2)'
          : 'border-l-4 border-(--brand-1)'
      "
    >
      <h2 class="text-sm md:text-lg font-bold text-white mb-3">{{ workout.description }}</h2>

      <div class="flex justify-between text-xs md:text-sm">
        <div class="flex items-center gap-2">
          <span>{{ workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }}</span>
          <span class="font-bold">{{ workout.distance }} km</span>
        </div>
        <div class="flex items-center gap-2">
          <span>⏱</span>
          <span class="font-bold">{{ workout.duration }} min</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.type === 'running'">
          <span>⚡️</span>
          <span class="font-bold">{{ workout.pace }} min/km</span>
        </div>
        <div class="flex items-center gap-2" v-if="workout.type === 'cycling'">
          <span>⚡️</span>
          <span class="font-bold">{{ workout.speed }} km/h</span>
        </div>

        <div class="flex items-center gap-2" v-if="workout.cadence">
          <span>🦶🏼</span>
          <span class="font-bold">{{ workout.cadence }} spm</span>
        </div>
        <div class="flex items-center gap-2" v-if="workout.elevation">
          <span>⛰</span>
          <span class="font-bold">{{ workout.elevation }} m</span>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'

const store = useWorkoutStore()

const moveToWorkout = (workout: Workout) => {
  // use flyTo which accepts a duration option in Leaflet's FlyToOptions
  store.map?.flyTo(workout.coords, 15, {
    animate: true,
    duration: 1,
  })
}

const showPr4 = computed(() => {
  return (
    (store.workouts.length > 1 && typeof window !== 'undefined' && window.innerWidth < 1280) ||
    (store.workouts.length > 5 && typeof window !== 'undefined' && window.innerWidth >= 1280)
  )
})
</script>
