import WorkoutList from '@/components/WorkoutList.vue'
import { useWorkoutStore } from '@/stores/useWorkouts'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'

describe('WorkoutList render', () => {
  it('mounts and shows workouts', () => {
    setActivePinia(createPinia())
    const store = useWorkoutStore()
    store.workouts = [
      {
        id: '1',
        type: 'running',
        description: 'A',
        distance: 1,
        duration: 1,
        coords: [[0, 0]],
        date: '',
      },
      {
        id: '2',
        type: 'cycling',
        description: 'B',
        distance: 2,
        duration: 2,
        coords: [[0, 0]],
        date: '',
      },
    ]

    const wrapper = mount(WorkoutList)
    const items = wrapper.findAll('.workout-item')
    expect(items.length).toBe(2)
  })

  it('removes a workout when its delete button is clicked', async () => {
    setActivePinia(createPinia())
    const store = useWorkoutStore()
    store.workouts = [
      {
        id: '1',
        type: 'running',
        description: 'A',
        distance: 1,
        duration: 1,
        coords: [[0, 0]],
        date: '',
      },
      {
        id: '2',
        type: 'cycling',
        description: 'B',
        distance: 2,
        duration: 2,
        coords: [[0, 0]],
        date: '',
      },
    ]

    const wrapper = mount(WorkoutList)

    await wrapper.find('.delete-workout-btn').trigger('click')

    expect(store.workouts).toHaveLength(1)
    expect(store.workouts[0]?.id).toBe('2')
  })
})
