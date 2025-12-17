import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkoutForm from '@/components/WorkoutForm.vue'
import { useWorkoutStore } from '@/stores/useWorkouts'
import { setActivePinia, createPinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'

type Workout = {
  type: string
  distance: number
  duration: number
  cadence?: number
  pace?: number
  coords: number[]
  description?: string
  elevationGain?: number
  speed?: number
}

interface WorkoutFormPublic {
  showForm(arg: { latlng: { lat: number; lng: number } }): void
  submit(): Promise<void>
}

vi.mock('@/stores/useWorkouts', () => {
  const workouts: Workout[] = []

  return {
    useWorkoutStore: () => ({
      workouts,
      addWorkout: vi.fn((workout: Workout) => {
        workouts.unshift(workout) // Push to the beginning of the array
      }),
      map: { closePopup: vi.fn() },
    }),
  }
})

describe('WorkoutForm', () => {
  let wrapper: ReturnType<typeof mount> & { vm: WorkoutFormPublic }

  beforeEach(() => {
    setActivePinia(createPinia())
    // Ensure the mocked store is cleared between tests
    useWorkoutStore().workouts.length = 0

    wrapper = mount(WorkoutForm) as unknown as ReturnType<typeof mount> & { vm: WorkoutFormPublic }
  })

  it('shows form on showForm call', async () => {
    wrapper.vm.showForm({ latlng: { lat: 42, lng: 23 } })
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('opacity-100')
    expect(wrapper.classes()).toContain('scale-100')
  })

  it('validates required fields for running', async () => {
    wrapper.vm.showForm({ latlng: { lat: 42, lng: 23 } })
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined() // Disabled initially

    await wrapper.find('input[placeholder="km"]').setValue('10')
    await wrapper.find('input[placeholder="min"]').setValue('60')
    await wrapper.find('input[placeholder="step/min"]').setValue('180')

    await wrapper.vm.$nextTick()
    expect(button.attributes('disabled')).toBeUndefined() // Enabled now
  })

  describe('submit running workout', () => {
    beforeEach(() => {
      wrapper = mount(WorkoutForm) as unknown as ReturnType<typeof mount> & {
        vm: WorkoutFormPublic
      }
    })

    it('submits running workout correctly', async () => {
      const store = useWorkoutStore()

      wrapper.vm.showForm({ latlng: { lat: 42, lng: 23 } })
      await flushPromises()

      await wrapper.find('input[placeholder="km"]').setValue('10')
      await wrapper.find('input[placeholder="min"]').setValue('60')
      await wrapper.find('input[placeholder="step/min"]').setValue('180')

      await flushPromises()

      const initialLength = store.workouts.length

      await wrapper.vm.submit()

      expect(store.workouts.length).toBe(initialLength + 1)

      const newWorkout = store.workouts[store.workouts.length - 1]
      expect(newWorkout).toBeDefined()
      expect(newWorkout).toMatchObject({
        type: 'running',
        distance: 10,
        duration: 60,
        cadence: 180,
        pace: 6,
        coords: [42, 23] as [number, number],
      })
      expect(newWorkout?.description).toContain('Running on')
    })
  })

  it('validates required fields for cycling', async () => {
    wrapper.vm.showForm({ latlng: { lat: 42, lng: 23 } })
    await wrapper.vm.$nextTick()

    // Switch to cycling
    await wrapper.find('select').setValue('cycling')
    await wrapper.vm.$nextTick()

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined() // Disabled initially

    await wrapper.find('input[placeholder="km"]').setValue('20')
    await wrapper.find('input[placeholder="min"]').setValue('45')
    await wrapper.find('input[placeholder="meters"]').setValue('200')

    await wrapper.vm.$nextTick()
    expect(button.attributes('disabled')).toBeUndefined() // Enabled now
  })

  describe('submit cycling workout', () => {
    beforeEach(() => {
      wrapper = mount(WorkoutForm) as unknown as ReturnType<typeof mount> & {
        vm: WorkoutFormPublic
      }
    })

    it('submits cycling workout correctly', async () => {
      const store = useWorkoutStore()

      wrapper.vm.showForm({ latlng: { lat: 42, lng: 23 } })
      await flushPromises()

      await wrapper.find('select').setValue('cycling')
      await flushPromises()

      await wrapper.find('input[placeholder="km"]').setValue('20')
      await wrapper.find('input[placeholder="min"]').setValue('45')
      await wrapper.find('input[placeholder="meters"]').setValue('200')

      await flushPromises()

      const initialLength = store.workouts.length

      await wrapper.vm.submit()

      expect(store.workouts.length).toBe(initialLength + 1)

      const newWorkout = store.workouts[store.workouts.length - 1]
      expect(newWorkout).toBeDefined()
      expect(newWorkout).toMatchObject({
        type: 'cycling',
        distance: 20,
        duration: 45,
        elevation: 200,
        speed: expect.closeTo(26.7, 1),
        coords: [42, 23] as [number, number],
      })
      expect(newWorkout?.description).toContain('Cycling on')
    })
  })
})
