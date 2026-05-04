import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RoomLobby from '../components/StudyGroup/RoomLobby'
import { useAuth } from '../auth/useAuth'

// Mock the auth hook
vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock the API calls
vi.mock('../api/rooms', () => ({
  fetchRoomsList: vi.fn(),
  createRoomApi: vi.fn(),
  joinRoomByCodeApi: vi.fn(),
  joinRoomByIdApi: vi.fn()
}))

// Mock the room hook
vi.mock('../hooks/useRoom', () => ({
  rememberRoom: vi.fn(),
  syncMyRooms: vi.fn()
}))

// Mock socket.io
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false
  }))
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('RoomLobby', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: { id: 'test-user', name: 'Test User' }
    })
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    })
  })

  it('renders the lobby header correctly', () => {
    renderWithRouter(<RoomLobby />)
    
    expect(screen.getByText('Study Rooms')).toBeInTheDocument()
    expect(screen.getByText('Find your focus. Study with others.')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    renderWithRouter(<RoomLobby />)
    
    expect(screen.getByText('Loading rooms…')).toBeInTheDocument()
  })

  it('displays trending section with proper structure', async () => {
    const { fetchRoomsList } = await import('../api/rooms')
    fetchRoomsList.mockResolvedValue({
      rooms: [],
      trending: [
        { id: '1', name: 'Test Room', weeklyHours: 5, memberCount: 3 }
      ],
      mostActiveToday: [],
      globalStudyingApprox: 10,
      myTodayMinutes: 30
    })

    renderWithRouter(<RoomLobby />)

    await waitFor(() => {
      expect(screen.getByText('Trending This Week')).toBeInTheDocument()
    })
  })
})