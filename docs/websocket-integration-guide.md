# WebSocket Real-Time Notification System - Integration Guide

## 🎯 Overview

The WebSocket Real-Time Notification System provides instant, bidirectional communication between the frontend and backend, enabling real-time task updates, collaboration features, and ADHD-optimized notification delivery.

## 🏗️ Architecture

### Backend Components
- **NotificationsGateway** (`/backend/src/notifications/notifications.gateway.ts`)
  - WebSocket server running on port 8001
  - JWT authentication integration
  - User session management
  - Offline message queueing

### Frontend Components
- **WebSocketContext** (`/frontend/src/contexts/WebSocketContext.tsx`)
  - React context for WebSocket management
  - Auto-reconnection with exponential backoff
  - ADHD-friendly notification handling

## 🚀 Production Deployment

### Docker Configuration
The system is configured for production deployment with:
- Backend WebSocket port 8001 exposed
- Environment variables for WebSocket configuration
- Health checks and monitoring

### Kubernetes Deployment
- WebSocket port exposed in backend deployment
- Service configuration updated
- Resource limits and health checks configured

## 🧪 Testing Instructions

### Manual Testing
1. Start both servers:
   ```bash
   # Backend
   cd backend && pnpm run start:dev
   
   # Frontend  
   cd frontend && pnpm run dev
   ```

2. Navigate to test page: `http://localhost:3001/app/test/websocket`

3. Test scenarios:
   - Connection status indicator shows "Connected"
   - Send test message and verify round-trip
   - Test auto-reconnection by stopping/starting backend
   - Verify task update notifications work
   - Check notification batching for ADHD optimization

### Automated Testing
```bash
# Run WebSocket integration tests
cd backend && npm test -- websocket
cd frontend && npm test -- websocket
```

## 🔧 Configuration

### Environment Variables
```env
# Backend
WEBSOCKET_PORT=8001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-jwt-secret

# Frontend
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001
```

### ADHD-Friendly Features
- **Notification Batching**: Groups notifications to prevent overwhelm
- **Focus Mode**: Respects user's concentration periods
- **Gentle Alerts**: Non-intrusive notification delivery
- **Progress Celebrations**: Positive reinforcement for achievements

## 📊 Monitoring

### Health Checks
- Connection status monitoring
- Message delivery confirmation
- Performance metrics tracking

### Logging
- Connection lifecycle events
- Message routing and delivery
- Error conditions and recovery

## 🐛 Troubleshooting

### Common Issues
1. **Connection Failed**: Check if backend is running on port 8001
2. **Authentication Error**: Verify JWT token is valid
3. **Message Not Received**: Check network connectivity and CORS settings

### Debug Mode
Enable debug logging:
```env
DEBUG=websocket:*
```

## ✅ Validation Checklist

- [ ] Backend WebSocket gateway running on port 8001
- [ ] Frontend connects successfully to WebSocket server
- [ ] JWT authentication working
- [ ] Real-time task updates delivered
- [ ] Auto-reconnection functioning
- [ ] ADHD optimizations active
- [ ] Production configurations updated
- [ ] Docker/Kubernetes deployments ready
- [ ] Monitoring and logging configured
- [ ] Error handling comprehensive

## 🎉 Success Metrics

- Connection establishment < 2 seconds
- Message delivery < 100ms
- Auto-reconnection within 5 seconds
- Zero message loss during normal operation
- ADHD-friendly notification timing respected

---

**Status**: ✅ Production Ready
**Last Updated**: August 1, 2025
**Version**: 1.0.0
