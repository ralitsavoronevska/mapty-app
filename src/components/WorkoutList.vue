<script setup lang="ts">
import { useWorkoutStore } from '@/stores/useWorkouts'

const store = useWorkoutStore()

const moveToWorkout = (workout: any) => {
  // use flyTo which accepts a duration option in Leaflet's FlyToOptions
  store.map?.flyTo(workout.coords, 15, {
    animate: true,
    duration: 1
  })
}
</script>

<template>
  <ul class="workouts space-y-4 overflow-y-auto flex-1 pr-2">
    <li
      v-for="workout in store.workouts"
      :key="workout.id"
      @click="moveToWorkout(workout)"
      class="bg-[#42484d] rounded-lg p-5 cursor-pointer hover:bg-[#525960] transition"
      :class="workout.type === 'running' ? 'border-l-4 border-green-500' : 'border-l-4 border-orange-500'"
    >
      <h2 class="text-lg font-bold text-white mb-3">{{ workout.description }}</h2>
      
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex items-center gap-2">
          <span>{{ workout.type === 'running' ? 'Running' : 'Cycling' }}</span>
          <span class="font-bold">{{ workout.distance }} km</span>
        </div>
        <div class="flex items-center gap-2">
          <span>Clock</span>
          <span class="font-bold">{{ workout.duration }} min</span>
        </div>
        
        <div class="flex items-center gap-2" v-if="workout.type === 'running'">
          <span>Lightning</span>
          <span class="font-bold">{{ workout.pace }} min/km</span>
        </div>
        <div class="flex items-center gap-2" v-if="workout.type === 'cycling'">
          <span>Lightning</span>
          <span class="font-bold">{{ workout.speed }} km/h</span>
        </div>
        
        <div class="flex items-center gap-2" v-if="workout.cadence">
          <span>Footprints</span>
          <span class="font-bold">{{ workout.cadence }} spm</span>
        </div>
        <div class="flex items-center gap-2" v-if="workout.elevationGain">
          <span>Mountain</span>
          <span class="font-bold">{{ workout.elevationGain }} m</span>
        </div>
      </div>
    </li>
  </ul>
</template>