# Order Notification Mini-System (Vendor Portal)

A high-performance, event-driven full-stack system designed for instant vendor order alerts, preparation time adjustments, and fault-tolerant communication between micro-services and mobile/web clients.

Built with **Spring Boot 3.2 (Java 21)**, **React 18 (TypeScript + Vite + Zustand)**, and **Capacitor Android (Manifest V3 + FCM)** using strict Onion Architecture principles.

---

## 🌟 Key Features

### 1. Real-Time Order Delivery
- **WebSocket STOMP Protocol**: Live push delivery to vendor-specific topics (`/topic/vendor/{vendorId}/orders`) via Spring WebSocket and SockJS fallback.
- **Instant Audio Feedback**: Built-in Web Audio API tone synthesizer providing instant audio alerts upon new pending order arrival without relying on external media assets.
- **Interactive Simulator**: Built-in testing drawer allowing staff and developers to simulate multi-item customer orders directly against `POST /orders`.

### 2. Architectural Integrity & Domain Events
- **Strict Onion Architecture**: Complete isolation between Transport/API (`api/`), Business Logic (`domain/`), and Infrastructure (`infrastructure/`).
- **Pure Domain Records**: Domain entities (`Order`, `OrderItem`, `User`) are implemented as immutable Java 21 `record`s with zero behavioral leakage.
- **Decoupled Event Bus**: Solves classic circular service dependencies (`OrderService` ↔ `NotificationService`) by publishing immutable Spring Domain Events (`OrderCreatedEvent`, `OrderStatusUpdatedEvent`) via `ApplicationEventPublisher`.

### 3. Self-Healing & Resilience Systems
- **Silent 401 Token Refresh & Request Queueing**:
  - Backend enforces a short 2-minute token expiration (`jwt.expiry-minutes: 2`).
  - Frontend Axios interceptors automatically catch 401 Unauthorized responses, pause concurrent API calls in a pending promise queue, silently renew credentials against `POST /auth/refresh`, and transparently replay all queued calls without logging out the vendor.
- **Auto-Reconnecting WebSocket Client**:
  - `@stomp/stompjs` client configured with a 3000ms reconnect backoff.
  - Automatically handles network drops, backend restarts, and recovers topic subscriptions upon re-establishing connection.
- **Network State Detection**: Real-time browser and device online/offline listeners showing sticky status alert banners.
- **Telemetry & Remote Logging Pipeline**: Captures client lifecycle events (WS drops, auth refreshes, app state changes) and streams them to the server via `POST /client-logs`.

### 4. Cross-Platform Mobile Support (Capacitor Android)
- Configured with package ID `com.test.ordernotification` and `usesCleartextTraffic="true"` for local backend communication.
- Background/foreground app state transitions monitored via `@capacitor/app`.
- Firebase Cloud Messaging (FCM) push notification integration for native mobile alerts.

---

## 🏛️ System Architecture

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 FRONTEND (React + TS)                   │
                  │  Zustand Stores | Axios 401 Queueing | STOMP (SockJS)   │
                  └────────────▲──────────────────────────────▲─────────────┘
                               │ HTTP REST                    │ STOMP WS (/ws)
                               │ (Bearer JWT)                 │ (/topic/vendor/{id}/orders)
                               ▼                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             INFRASTRUCTURE LAYER (Spring Boot)          │
                  │  AuthController | OrderController | ClientLogController │
                  │  JwtAuthFilter  | SecurityConfig  | WebSocketDispatcher │
                  │  InMemoryOrderRepo (ConcurrentHashMap) | FirebaseAdmin  │
                  └────────────▲──────────────────────────────▲─────────────┘
                               │                              │
                               │ Implements                   │ Listens To
                               ▼                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                    API LAYER (Facades)                  │
                  │  OrderFacade | AuthFacade | ClientLogFacade | DTOs      │
                  └────────────▲────────────────────────────────────────────┘
                               │ Transforms DTO ↔ Domain
                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                   DOMAIN LAYER (Core)                   │
                  │  OrderService | AuthService | NotificationService (Intf)│
                  │  Order (record) | OrderItem (record) | User (record)    │
                  │  Events: OrderCreatedEvent, OrderStatusUpdatedEvent     │
                  └─────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
├── backend/                                # Spring Boot 3.2.5 + Java 21 Backend
│   ├── src/main/java/com/test/ordernotification/
│   │   ├── api/                            # DTOs and API Facades
│   │   ├── domain/                         # Core Models (Records), Services, Events
│   │   └── infrastructure/                 # Controllers, Persistence, Security, WS
│   ├── src/test/java/                      # JUnit 5 & MockMvc Test Suite (13 tests)
│   ├── src/main/resources/application.yml  # Application properties
│   └── pom.xml                             # Maven configuration
│
├── frontend/                               # React 18 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/                     # UI components (OrderCard, Navbar, etc.)
│   │   ├── hooks/                          # Custom hooks (useAuth, useWebSocket, etc.)
│   │   ├── services/                       # Axios API interceptor & STOMP WS client
│   │   ├── stores/                         # Zustand state stores
│   │   └── utils/                          # Remote logger & Audio synthesizer
│   ├── android/                            # Capacitor Android native project
│   ├── capacitor.config.ts                 # Capacitor configuration
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java**: JDK 21 LTS
- **Node.js**: Node 18+ (Node 20+ recommended) & npm

---

### 1. Run Backend Server

```bash
cd backend

# Option A: Run with default configuration (Windows)
.\mvnw.cmd spring-boot:run

# Option B: Run with custom JWT expiry (Linux / macOS)
JWT_EXPIRY_MINUTES=2 ./mvnw spring-boot:run

# Option C: Run test suite
.\mvnw.cmd test
```

The backend server will start on `http://localhost:8080`.

#### Default Seeded Credentials:
| Email | Password | Assigned Vendor ID |
| :--- | :--- | :--- |
| `vendor@test.com` | `test123` | `vendor-123` |
| `vendor2@test.com` | `test123` | `vendor-456` |

---

### 2. Run Frontend Web App

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Build for Capacitor Android

```bash
cd frontend

# 1. Build production web bundle
npm run build

# 2. Sync web assets with Capacitor Android native project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | None | Authenticates vendor credentials (`email`, `password`) -> returns JWT token & `vendorId` |
| `POST` | `/auth/refresh` | Bearer | Refreshes current or recently expired JWT token |
| `POST` | `/orders` | None | Customer order endpoint -> creates order & broadcasts via WebSocket STOMP |
| `GET` | `/vendor/orders` | Bearer | Fetches order history for authenticated vendor |
| `PUT` | `/vendor/orders/{id}/accept` | Bearer | Accepts pending order |
| `PUT` | `/vendor/orders/{id}/accept?delayMinutes=15` | Bearer | Accepts order with specified preparation delay |
| `PUT` | `/vendor/orders/{id}/reject` | Bearer | Rejects order |
| `POST` | `/client-logs` | None | Receives client telemetry & logs to server console |
| `WS` | `/ws` | None | STOMP WebSocket broker endpoint (`/topic/vendor/{vendorId}/orders`) |

---

## 🧪 Testing & Verification

The test suite covers full domain integrity, controllers, security filters, and event emission:

- **`DomainIntegrityTest`**: Asserts reflection checks ensure all domain models are immutable records with zero custom methods.
- **`OrderServiceTest`**: Verifies domain event publishing on order creation, acceptance with delay, and rejection.
- **`AuthControllerTest`**: Validates login authentication, invalid credential handling, and JWT refresh lifecycle.
- **`OrderControllerTest`**: End-to-end MockMvc testing of order creation, vendor order security, and state mutations.
