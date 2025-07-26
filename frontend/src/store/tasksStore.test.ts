import { renderHook, act } from '@testing-library/react'
import { useTasksStore } from './tasksStore'

describe('useTasksStore', () => {
  beforeEach(() => {
    useTasksStore.setState({ tasks: [] })
  })

  it('adds tasks', () => {
    const { result } = renderHook(() => useTasksStore())

    act(() => {
      result.current.addTask('First')
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('First')
  })

  it('toggles tasks', () => {
    const { result } = renderHook(() => useTasksStore())

    act(() => {
      result.current.addTask('Test')
    })

    const id = result.current.tasks[0].id

    act(() => {
      result.current.toggleTask(id)
    })

    expect(result.current.tasks[0].completed).toBe(true)
  })

  it('removes tasks', () => {
    const { result } = renderHook(() => useTasksStore())

    act(() => {
      result.current.addTask('Delete me')
    })

    const id = result.current.tasks[0].id

    act(() => {
      result.current.removeTask(id)
    })

    expect(result.current.tasks).toHaveLength(0)
  })

  it('sets tasks', () => {
    const { result } = renderHook(() => useTasksStore())

    act(() => {
      result.current.setTasks([
        { id: 1, title: 'A', completed: false },
        { id: 2, title: 'B', completed: true },
      ])
    })

    expect(result.current.tasks).toHaveLength(2)
    expect(result.current.tasks[1].completed).toBe(true)
  })
})
