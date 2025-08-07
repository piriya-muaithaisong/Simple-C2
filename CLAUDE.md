# CLAUDE.md – Chat System Requirements

## ✅ Goal
Build a **chat system** where:
- **Admin** uses a **web interface** to manage and chat with clients.
- **Clients** use a **CLI tool** to chat with admin.

---

## 📦 System Components
1. **Admin Server**
   - Provides:
     - **Beatiful Web Chat Interface** for the admin.
     - **API / WebSocket** for real-time communication.
   - Stores chat history in **SQLite** (file-based DB).

2. **Client CLI**
   - Lightweight command-line tool.
   - Connects to the admin server via **API/WebSocket**.
   - Supports real-time send/receive of messages.

---

## 🔗 Workflow
1. **Client starts CLI** → connects to server.
2. **Server registers client session** and opens communication channel.
3. **Admin sees client on web interface** → starts chat.
4. **Both exchange messages in real-time**.

---

## 🛠 Technical Requirements
- **Backend:** Node.js (Express) or Python (FastAPI).
- **Frontend:** React.
- **Real-Time:** Use **WebSocket**.
- **Database:** SQLite (single file).
- **Deployment:** Use **Docker + docker-compose** for easy CI/CD.

---

## ✅ Features
- **Admin Dashboard**:
  - View connected clients.
  - Start/end chat sessions.
- **Client CLI**:
  - Start session and chat.
  - Display incoming messages in real-time.
- **Chat History** stored in SQLite.

---

## ⚡ Quick Start
```bash
# Run all services
docker-compose up

# Admin web interface
http://localhost:8080

# Client connects via CLI
./chat-cli connect ws://localhost:8080
