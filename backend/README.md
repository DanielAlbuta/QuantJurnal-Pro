# QuantJournal Backend API

Backend API for the QuantJournal Trading App built with Node.js, Express, and MongoDB.

## Prerequisites

- **Node.js** v18+ 
- **MongoDB** (local installation or MongoDB Atlas)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quantjournal
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** - update `MONGODB_URI` with your connection string.

### 4. Run the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start at `http://localhost:5000`

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/profile` | ✅ | Update user profile |

### Trades

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trades` | ✅ | Get all trades |
| POST | `/api/trades` | ✅ | Create trade |
| PUT | `/api/trades/:id` | ✅ | Update trade |
| DELETE | `/api/trades/:id` | ✅ | Delete trade |
| DELETE | `/api/trades` | ✅ | Delete all trades |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | API health check |

---

## cURL Examples

### Register New User

```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Current User (Protected)

```powershell
curl -X GET http://localhost:5000/api/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Trade (Protected)

```powershell
curl -X POST http://localhost:5000/api/trades `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{
    "symbol": "EURUSD",
    "direction": "LONG",
    "entryDate": 1707350400000,
    "entryPrice": 1.0850,
    "exitPrice": 1.0900,
    "size": 0.1,
    "netPnL": 50,
    "status": "CLOSED"
  }'
```

### Get All Trades (Protected)

```powershell
curl -X GET http://localhost:5000/api/trades `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Trade (Protected)

```powershell
curl -X PUT http://localhost:5000/api/trades/TRADE_ID_HERE `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{"notes":"Updated notes for this trade"}'
```

### Delete Trade (Protected)

```powershell
curl -X DELETE http://localhost:5000/api/trades/TRADE_ID_HERE `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Delete All Trades (Protected)

```powershell
curl -X DELETE http://localhost:5000/api/trades `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token_here"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - No access to resource |
| 404 | Not Found |
| 500 | Server Error |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   ├── profileController.js
│   │   └── tradesController.js
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Trade.js           # Trade schema
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   └── trades.js
│   └── server.js              # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
