import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkoutList from '@/components/WorkoutList.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutStore } from '@/stores/useWorkouts'

describe('WorkoutList', () => {
  it('renders workouts with correct type classes/borders', () => {
    setActivePinia(createPinia())
    const store = useWorkoutStore()
    store.workouts = [
      {
        id: '1',
        type: 'running',
        description: 'Running on',
        distance: 10,
        duration: 60,
        coords: [42, 23],
        cadence: 180,
        pace: 6,
        date: '',
      },
      {
        id: '2',
        type: 'cycling',
        description: 'Cycling on',
        distance: 20,
        duration: 30,
        coords: [42, 23],
        elevation: 100,
        speed: 40,
        date: '',
      },
    ]

    const wrapper = mount(WorkoutList)

    const items = wrapper.findAll('.workout-item')

    expect(items).toHaveLength(2)

    // Running — check for running CSS variable class
    expect(items[0]?.classes()).toContain('border-(--brand-2)')

    // Cycling — check for cycling CSS variable class
    expect(items[1]?.classes()).toContain('border-(--brand-1)')

    // Also check common border width
    expect(items[0]?.classes()).toContain('border-l-4')
    expect(items[1]?.classes()).toContain('border-l-4')
  })
})
