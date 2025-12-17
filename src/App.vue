<template>
  <main>
    <aside>
      <img src="/assets/logo.png" class="logo" alt="Mapty" />
      <WorkoutForm ref="formRef" />
      <WorkoutList />
      <button v-if="store.workouts.length > 0" @click="store.clearAll" class="clear-all-workouts">
        Clear All Workouts
      </button>
    </aside>
    <div class="map-view-container">
      <MapView @show-form="handleMapClick" class="map-view-component" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import WorkoutForm from '@/components/WorkoutForm.vue'
import WorkoutList from '@/components/WorkoutList.vue'
import MapView from '@/components/MapView.vue'
import { useWorkoutStore } from '@/stores/useWorkouts'
import type { LeafletMouseEvent } from 'leaflet'

const store = useWorkoutStore()
type MapClickHandler = { showForm(e: LeafletMouseEvent): void }

const formRef = ref<MapClickHandler | null>(null)

const handleMapClick = (e: LeafletMouseEvent) => {
  formRef.value?.showForm(e)
}

onMounted(() => {
  // DELAY LOAD SO MAPVIEW CAN INITIALIZE FIRST
  setTimeout(() => store.loadFromStorage(), 500)
})
</script>
