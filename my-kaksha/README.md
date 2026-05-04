# My Kaksha - Collaborative Study Platform

A real-time collaborative study platform built with React, Node.js, Socket.io, and MongoDB. Create study rooms, track progress with Pomodoro timers, chat with fellow students, and analyze your study patterns.

## ✨ Features

- 🏠 **Study Rooms**: Create public/private rooms with real-time presence
- ⏰ **Pomodoro Timer**: Personal and group synchronized timers
- 💬 **Live Chat**: Real-time messaging with typing indicators
- 📊 **Analytics**: Visual progress tracking and study insights
- 📋 **Project Tracker**: Manage and track your projects
- 🔥 **Trending Rooms**: Discover active study communities
- 📱 **Responsive Design**: Works on all devices
- 🔒 **Secure**: JWT authentication with rate limiting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-kaksha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=4000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
   MONGODB_DB=MyKaksha
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   SESSION_SECRET=your_session_secret
   ```

4. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev:all
   
   # Or separately:
   npm run server  # Backend only (http://localhost:4000)
   npm run dev     # Frontend only (http://localhost:5173)
   ```

## 🏗️ Architecture

### Frontend (React + Vite)
- **React 19**: Modern React with hooks and context
- **React Router 7**: Client-side routing
- **Socket.io Client**: Real-time communication
- **Custom CSS**: Responsive design system

### Backend (Node.js + Express)
- **Express 5**: Web framework with middleware
- **Socket.io**: Real-time bidirectional communication
- **MongoDB + Mongoose**: Database with ODM
- **JWT + Cookies**: Secure authentication
- **Rate Limiting**: API protection

## 📁 Project Structure

```
my-kaksha/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── StudyGroup/    # Study room components
│   │   └── Analytics/     # Analytics components
│   ├── api/               # API client functions
│   ├── auth/              # Authentication context
│   └── hooks/             # Custom React hooks
├── server/                # Backend Node.js application
│   ├── controllers/       # Route handlers
│   ├── models/           # MongoDB schemas
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start frontend dev server
npm run server       # Start backend server
npm run dev:all      # Start both frontend and backend

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once

# Production
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🌐 Main API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Study Rooms
- `GET /api/rooms` - List all rooms with trending data
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join room by ID
- `POST /api/rooms/join/:code` - Join room by code
- `POST /api/rooms/:id/leave` - Leave room
- `GET /api/rooms/:id/study-times` - Get study statistics
- `POST /api/rooms/:id/session-complete` - Track Pomodoro completion

### Study Data
- `GET /api/study-data` - Get user's study data
- `PUT /api/study-data` - Update study data

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `PATCH /api/projects/:id/status` - Update project status
- `DELETE /api/projects/:id` - Delete project

### Analytics
- `GET /api/analytics/weekly-summary` - Get weekly study summary
- `GET /api/analytics/room-contribution` - Get room contribution data

### Real-time Events (Socket.io)
- `lobby-join/leave` - Lobby presence tracking
- `join-room/leave-room` - Room presence
- `send-message` - Chat messages
- `timer-sync` - Group timer synchronization
- `study-time-update` - Progress updates
- `user-status-update` - Status changes (focusing/break/online)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API abuse prevention (100 req/15min general, 5 req/15min auth)
- **Input Sanitization**: XSS protection for chat messages
- **HttpOnly Cookies**: Session security
- **CORS Configuration**: Cross-origin protection
- **Password Hashing**: Bcrypt encryption

## 📊 Performance Optimizations

- **Caching**: Trending data cached for 5 minutes
- **Database Indexing**: Optimized MongoDB queries
- **Efficient Updates**: Minimal real-time data transfer
- **Fallback Storage**: JSON files when MongoDB unavailable

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret
```

### Build and Deploy
```bash
npm run build        # Build frontend
npm run server       # Start production server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Backend Concepts Covered

- **Client-server architecture** with Vite frontend and Express backend
- **REST-style routing** with GET, POST, PUT, PATCH, and DELETE
- **Middleware**: CORS, express.json, cookie-parser, auth protection, validation, error handling
- **Async programming** with fetch, fs/promises, Mongoose, bcrypt, JWT, and Socket.io
- **Real-time communication** with Socket.io for chat, presence, and timer sync
- **Database integration** with MongoDB + Mongoose and JSON fallback
- **Authentication** with JWT + HttpOnly cookies + session tracking
- **Protected routes** on both backend and frontend
- **Modular backend structure** with routes, controllers, services, middleware, and models
- **Rate limiting** and security best practices
- **Testing** with Vitest and React Testing Library

---

Built with ❤️ for students, by students.
