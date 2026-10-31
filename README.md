# OrchestrAI

OrchestrAI is an intelligent multi-agent AI workspace. It provides a React
frontend and a Node.js microservice backend for conversation, web search,
coding assistance, document generation, image understanding, chat history,
authentication, and payments.

## Features

- AI chat with Markdown and code rendering.
- Automatic request routing through a supervisor agent.
- Specialized agents for:
  - General conversation and explanations.
  - Web search and current information.
  - Coding, debugging, architecture, and API design.
  - PDF/document generation.
  - PowerPoint presentation generation.
  - Image generation and vision tasks.
  - PDF question answering with retrieval-augmented generation.
  - Image analysis.
- Reviewer agent that checks generated responses and can request retries.
- File uploads for PDF and image workflows.
- Conversation creation, history, message persistence, and conversation updates.
- Firebase-based authentication.
- Credit plans and Razorpay payment verification.
- MongoDB persistence, Redis connectivity, Supabase storage, and Qdrant
  vector search integration.
- GitHub Actions deployment workflow for the backend.

## Architecture

```text
React/Vite frontend
        |
        v
API Gateway (auth, CORS, cookies, service proxy)
        |
        +--> Auth service ------> MongoDB / Redis / Firebase Admin
        +--> Chat service ------> MongoDB
        +--> Agent service -----> LLMs / Tavily / Qdrant / Supabase
        +--> Billing service ---> MongoDB / Razorpay
                                      |
                                      +--> Redis
```

The gateway is the public backend entry point. Protected requests are
authenticated at the gateway and forwarded to the appropriate internal
service. The agent service uses a LangGraph workflow:

```text
Request -> Supervisor -> Specialized agent -> Reviewer
                         ^                    |
                         +---- retry --------+
```

PDF and image uploads are routed directly to their corresponding analysis
workflow. Other requests are classified as chat, search, coding, PDF, PPT, or
vision tasks.

## Repository structure

```text
.
├── backend/
│   ├── gateway/              # Public API gateway and authentication proxy
│   ├── services/
│   │   ├── agent/            # LangGraph workflow and AI agents
│   │   ├── auth/             # Login, logout, credits, and user plans
│   │   ├── billing/          # Razorpay order creation and verification
│   │   └── chat/             # Conversations and message persistence
│   ├── shared/redis/         # Shared Redis client
│   └── docker-compose.yml    # Local Redis container
├── frontend/                 # React 19 + Vite client
├── .github/workflows/        # Deployment automation
└── .gitignore
```

## Technology stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- Tailwind CSS
- Axios
- Firebase client SDK
- Monaco Editor
- React Markdown and syntax highlighting

### Backend

- Node.js with ES modules
- Express
- MongoDB with Mongoose
- Redis with ioredis
- LangChain and LangGraph
- Groq and Google Gemini models
- Tavily search
- Qdrant vector database
- Supabase Storage
- Firebase Admin
- Razorpay
- Multer, PDFKit, PDF parsing, and PptxGenJS

## API routes

All routes below are exposed through the gateway. The gateway prefixes each
service with `/api`.

| Area | Method | Endpoint | Purpose |
|---|---:|---|---|
| Gateway | GET | `/` | Gateway health response |
| Auth | POST | `/api/auth/login` | Create or authenticate a user |
| Auth | GET | `/api/auth/logout` | Log out the current user |
| Auth | POST | `/api/auth/update-plan` | Update the user's plan and credits |
| Auth | POST | `/api/auth/deduct-credits` | Deduct credits for an agent action |
| User | GET | `/api/me` | Get the authenticated user |
| Chat | GET | `/api/chat/create-conversation` | Create a conversation |
| Chat | GET | `/api/chat/get-conversations` | List conversations |
| Chat | POST | `/api/chat/update-conversation` | Update conversation details |
| Chat | POST | `/api/chat/save-message` | Save a message |
| Chat | GET | `/api/chat/get-messages/:conversationId` | Get conversation messages |
| Agent | POST | `/api/agent/chat` | Send a prompt and optional file |
| Billing | POST | `/api/billing/create` | Create a Razorpay order |
| Billing | POST | `/api/billing/verify` | Verify a Razorpay payment |

Protected routes require the authentication cookie and are handled by the
gateway middleware.

## Requirements

- Node.js 18+ recommended.
- npm.
- MongoDB.
- Redis.
- Firebase project and Admin SDK service account.
- API credentials for the providers used by your chosen workflows.

## Installation

Clone the repository and install dependencies for each workspace:

```bash
git clone https://github.com/anujmahore/Minor-Project.git
cd Minor-Project

cd frontend
npm install

cd ../backend/gateway
npm install

cd ../services/agent
npm install

cd ../auth
npm install

cd ../billing
npm install

cd ../chat
npm install
```

Start Redis locally with Docker:

```bash
cd backend
docker compose up -d redis
```

## Environment variables

Environment files are intentionally ignored by Git. Create the following
files locally and fill them with your own credentials.

### `backend/gateway/.env`

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE=http://localhost:4001
CHAT_SERVICE=http://localhost:4002
AGENT_SERVICE=http://localhost:4003
BILLING_SERVICE=http://localhost:4004
REDIS_URL=redis://localhost:6379
```

### `backend/services/auth/.env`

```env
PORT=4001
MONGODB_URI=
REDIS_URL=redis://localhost:6379
```

### `backend/services/chat/.env`

```env
PORT=4002
MONGODB_URI=
```

### `backend/services/agent/.env`

```env
PORT=4003
MONGODB_URI=
REDIS_URL=redis://localhost:6379
AUTH_SERVICE=http://localhost:4001
CHAT_SERVICE=http://localhost:4002
GROQ_API_KEY=
GOOGLE_API_KEY=
OPENROUTER_API_KEY=
TAVILY_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET_NAME=
MAX_REVIEW_RETRIES=2
```

### `backend/services/billing/.env`

```env
PORT=4004
MONGODB_URI=
AUTH_SERVICE=http://localhost:4001
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### `frontend/.env`

```env
VITE_SERVER_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=
VITE_RAZORPAY_KEY_ID=
```

The auth service also expects
`backend/services/auth/serviceAccountKey.json` for Firebase Admin. This file
must remain local and must never be committed.

## Running locally

Run each service in a separate terminal:

```bash
# Terminal 1
cd backend/gateway
npm run dev

# Terminal 2
cd backend/services/auth
npm run dev

# Terminal 3
cd backend/services/chat
npm run dev

# Terminal 4
cd backend/services/agent
npm run dev

# Terminal 5
cd backend/services/billing
npm run dev

# Terminal 6
cd frontend
npm run dev
```

The frontend is served by Vite, normally at `http://localhost:5173`. The
gateway is the frontend's backend URL and normally runs at
`http://localhost:4000` when using the example configuration.

## Frontend commands

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Run ESLint
```

## Backend commands

Each backend service supports:

```bash
npm run dev       # Start with Nodemon
npm start         # Start with Node.js
```

## Security notes

- Never commit `.env` files, Firebase service account JSON, API keys, payment
  secrets, or uploaded user files.
- Use separate development and production credentials.
- Configure GitHub Actions secrets for deployment instead of putting cloud
  credentials in workflow source.
- Rotate any credential immediately if it is accidentally exposed.

## Deployment

The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and
contains the backend deployment automation. Configure all referenced AWS
secrets in the repository's GitHub Actions settings before enabling a
production deployment. Provider credentials and runtime environment variables
must be supplied through the deployment platform's secret management.

## Current status

This project is under active development. Service-level automated tests are
not currently configured; use the frontend lint/build commands and verify the
gateway and service health responses when validating a local setup.

## License

No project license has been specified yet.
