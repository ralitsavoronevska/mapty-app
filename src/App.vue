<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
import MapView from '@/components/MapView.vue'
import WorkoutForm from '@/components/WorkoutForm.vue'
import WorkoutList from '@/components/WorkoutList.vue'
import { useWorkoutStore } from '@/stores/useWorkouts'

const store = useWorkoutStore()
const formRef = ref<any>(null)

// THIS IS THE KEY
const mapViewRef = ref<any>(null)
provide('mapViewRef', mapViewRef)  // ← makes it available to WorkoutForm

const handleMapClick = (e: any) => {
  formRef.value?.showForm(e)
}

onMounted(() => {
  store.loadFromStorage()
})
</script>

<template>
  <div class="flex h-screen bg-gray-900 text-white">
    <aside class="w-200 bg-[#2d3439] p-8 flex flex-col overflow-hidden">
      <img src="/logo.png" alt="Mapty" class="h-14 mx-auto mb-8" />
      <WorkoutForm ref="formRef" />
      <WorkoutList />
      <button @click="store.clearAll" class="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">
        Clear All Workouts
      </button>
    </aside>

    <MapView ref="mapViewRef" @show-form="handleMapClick" class="flex-1" />
  </div>
</template>