<template>
  <main>
    <aside>
      <img src="/assets/logo.png" class="logo" alt="Mapty" />
      <WorkoutList />
      <button v-if="store.workouts.length > 0" @click="store.clearAll" class="clear-all-workouts">
        Clear All Workouts
      </button>
    </aside>
    <div class="map-view-container">
      <MapView class="map-view-component" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WorkoutList from '@/components/WorkoutList.vue'
import MapView from '@/components/MapView.vue'
import { useWorkoutStore } from '@/stores/useWorkouts'
import type { LeafletMouseEvent } from 'leaflet'

const store = useWorkoutStore()

onMounted(() => {
  // DELAY LOAD SO MAPVIEW CAN INITIALIZE FIRST
  setTimeout(() => store.loadFromStorage(), 500)
})
</script>
