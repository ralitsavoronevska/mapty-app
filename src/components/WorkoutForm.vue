<template>
  <form
    @submit.prevent="submit"
    :class="[
      !isVisible
        ? 'opacity-0 h-0 p-0 mb-0 hidden overflow-hidden scale-95'
        : 'opacity-100 scale-100',
      'grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-35 lg:gap-x-5 gap-y-2',
    ]"
  >
    <div class="form-field">
      <label for="type">Type</label>
      <select id="type" v-model="type">
        <option value="running">Running</option>
        <option value="cycling">Cycling</option>
      </select>
    </div>

    <div class="form-field">
      <label for="distance">Distance</label>
      <input id="distance" v-model="distance" type="number" placeholder="km" step="0.1" required />
    </div>

    <div class="form-field">
      <label for="duration">Duration</label>
      <input id="duration" v-model="duration" type="number" placeholder="min" required />
    </div>

    <div class="form-field" v-show="showCadence">
      <label for="cadence">Cadence</label>
      <input id="cadence" v-model="cadence" type="number" placeholder="step/min" />
    </div>

    <div class="form-field" v-show="showElevation">
      <label for="elevation">Elevation</label>
      <input id="elevation" v-model="elevation" type="number" placeholder="meters" />
    </div>

    <button type="submit" :disabled="!isValid" class="submit-btn">OK</button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkoutStore, type Workout } from '@/stores/useWorkouts'

const store = useWorkoutStore()

const type = ref<'running' | 'cycling'>('running')
const distance = ref('')
const duration = ref('')
const cadence = ref('')
const elevation = ref('')
const mapEvent = ref<{ latlng: { lat: number; lng: number } } | null>(null)

// defineEmits not used in this component; removed to satisfy lint rules

defineExpose({
  showForm(e: { latlng: { lat: number; lng: number } }) {
    mapEvent.value = e
    isVisible.value = true
    distance.value = ''
    duration.value = ''
    cadence.value = ''
    elevation.value = ''
    setTimeout(
      () => (document.querySelector('input[placeholder="km"]') as HTMLElement)?.focus(),
      100,
    )
  },
  hideForm() {
    isVisible.value = false
  },
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
  if (type.value === 'cycling' && (!e || e <= 0)) return false
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
      elevation: elev,
      speed: Number(speed.toFixed(1)),
      description: `Cycling on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    }
  }

  store.addWorkout(workout)

  store.map?.closePopup()
  isVisible.value = false
}
</script>
