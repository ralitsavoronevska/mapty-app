<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'

const store = useWorkoutStore()

const type = ref<'running' | 'cycling'>('running')
const distance = ref('')
const duration = ref('')
const cadence = ref('')
const elevation = ref('')
const mapEvent = ref<any>(null)

const emit = defineEmits(['mapClick'])

defineExpose({
  showForm(e: any) {
    mapEvent.value = e
    isVisible.value = true
    distance.value = ''
    duration.value = ''
    cadence.value = ''
    elevation.value = ''
    setTimeout(() => (document.querySelector('input[placeholder="km"]') as HTMLElement)?.focus(), 100)
  },
  hideForm() {
    isVisible.value = false
  }
})

const isVisible = ref(false)

const showCadence = computed(() => type.value === 'running')
const showElevation = computed(() => type.value === 'cycling')

const isValid = computed(() => {
  const d = Number(distance.value)
  const du = Number(duration.value)
  const c = Number(cadence.value)
  const e = Number(elevation.value)

  if (!d || !du || d <= 0 || du <= 0) return false
  if (type.value === 'running' && (!c || c <= 0)) return false
  return true
})

const submit = () => {
  if (!isValid.value || !mapEvent.value) return

  const { lat, lng } = mapEvent.value.latlng
  const base = {
    id: Date.now().toString().slice(-10),
    coords: [lat, lng] as [number, number],
    distance: Number(distance.value),
    duration: Number(duration.value),
    date: new Date().toISOString(),
  }

  let workout: Workout

  if (type.value === 'running') {
    const cadenceVal = Number(cadence.value)
    const pace = base.duration / base.distance
    workout = {
      ...base,
      type: 'running',
      cadence: cadenceVal,
      pace: Number(pace.toFixed(2)),
      description: `Running on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    }
  } else {
    const elev = Number(elevation.value)
    const speed = base.distance / (base.duration / 60)
    workout = {
      ...base,
      type: 'cycling',
      elevationGain: elev,
      speed: Number(speed.toFixed(1)),
      description: `Cycling on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    }
  }

  store.addWorkout(workout)

  store.map?.closePopup()
  isVisible.value = false
}
</script>

<template>
  <form
    @submit.prevent="submit"
    class="bg-[#42484d] rounded-lg p-6 mb-6 transition-all duration-500"
    :class="{ 'opacity-0 h-0 p-0 mb-0 overflow-hidden': !isVisible }"
    style="grid-template-columns: 1fr 1fr; gap: 0.5rem 2.5rem; display: grid"
  >
    <div class="flex items-center gap-4">
      <label for="type" class="text-sm font-semibold w-15">Type</label>
      <select id="type" v-model="type" class="bg-[#d6dee0] text-gray-800 px-3 py-2 rounded text-sm w-25">
        <option value="running">Running</option>
        <option value="cycling">Cycling</option>
      </select>
    </div>

    <div class="flex items-center gap-4">
      <label for="distance" class="text-sm font-semibold w-15">Distance</label>
      <input
        id="distance"
        v-model="distance"
        type="number"
        placeholder="km"
        step="0.1"
        class="bg-[#d6dee0] text-gray-800 px-3 py-2 rounded text-sm w-25"
        required
      />
    </div>

    <div class="flex items-center gap-4">
      <label for="duration" class="text-sm font-semibold w-15">Duration</label>
      <input
        id="duration"
        v-model="duration"
        type="number"
        placeholder="min"
        class="bg-[#d6dee0] text-gray-800 px-3 py-2 rounded text-sm w-25"
        required
      />
    </div>

    <div class="flex items-center gap-4" v-show="showCadence">
      <label for="cadence" class="text-sm font-semibold w-15">Cadence</label>
      <input
        id="cadence"
        v-model="cadence"
        type="number"
        placeholder="step/min"
        class="bg-[#d6dee0] text-gray-800 px-3 py-2 rounded text-sm w-25"
      />
    </div>

    <div class="flex items-center gap-4" v-show="showElevation">
      <label for="elevation" class="text-sm font-semibold w-15">Elev. Gain</label>
      <input
        id="elevation"
        v-model="elevation"
        type="number"
        placeholder="meters"
        class="bg-[#d6dee0] text-gray-800 px-3 py-2 rounded text-sm w-25"
      />
    </div>

    <button
      type="submit"
      :disabled="!isValid"
      class="col-span-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
    >
      OK
    </button>
  </form>
</template>