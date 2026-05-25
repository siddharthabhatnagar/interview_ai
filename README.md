# IntervuAI - Autonomous AI Technical Interview Platform

An MVP platform that leverages AI to conduct two-way, dynamic technical interviews. The system uses advanced speech recognition, natural language processing, and text-to-speech to create an authentic interview experience.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React.js + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **AI/Audio**:
  - GPT-4o-mini (Interview Logic)
  - Deepgram Nova-2 (Speech-to-Text)
  - ElevenLabs (Text-to-Speech)
- **Payments**: Razorpay

## 📁 Project Structure

```
IntervuAI/
├── backend/                 # Node.js/Express server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/       # Business logic (GPT, Deepgram, ElevenLabs)
│   │   ├── models/         # MongoDB schemas
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── .env.example
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── package.json            # Root workspace config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- API Keys for: OpenAI, Deepgram, ElevenLabs, Razorpay

### Installation

1. **Clone & Install Dependencies**
   ```bash
   cd IntervuAI
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Development Servers**
   ```bash
   # Run both backend and frontend concurrently
   npm run dev

   # Or run separately
   npm run dev:backend    # Starts on http://localhost:3000
   npm run dev:frontend   # Starts on http://localhost:5173
   ```

## 📋 Development Phases

### Phase 1: Brain & Ears ✓ (Current)
- [ ] Set up Node/Express backend
- [ ] MongoDB connection & user models
- [ ] GPT-4o-mini integration for dynamic questions
- [ ] Deepgram Nova-2 integration for speech-to-text
- [ ] Basic API structure

### Phase 2: Voice
- [ ] ElevenLabs text-to-speech integration
- [ ] Audio streaming pipeline
- [ ] WebSocket support for real-time audio

### Phase 3: Frontend
- [ ] React/Vite UI setup
- [ ] Interview room interface
- [ ] Microphone access & audio capture
- [ ] Real-time transcription display

### Phase 4: Money
- [ ] Razorpay payment integration
- [ ] Subscription management (Free, Starter $99/mo, Growth $299/mo)
- [ ] Pay-per-interview model (₹500)

### Phase 5: Deployment
- [ ] Docker configuration
- [ ] Production deployment scripts
- [ ] Environment-specific configs

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/intervuai
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRE=7d
```

## 📦 Available Scripts

```bash
npm run dev              # Start both backend & frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run build            # Build both projects
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
npm start                # Production start
npm run lint             # Lint all projects
npm run test             # Test all projects
```

## 🔗 API Endpoints (Phase 1)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/interview/start` - Start interview
- `POST /api/interview/process-audio` - Process candidate audio
- `GET /api/interview/:id` - Get interview details

## 📚 Documentation

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README.md)
- [API Documentation](./backend/API.md)

## 🤖 AI Integration Details

### Cerebras
- Realtime interview agent uses `llama3.1-8b`
- Backend evaluation and summary pipeline uses `gpt-oss-120b`
- Handles question generation, scoring, summaries, and roadmap generation

### Deepgram
- Provides real-time speech-to-text and text-to-speech for live interviews
- Main variable cost driver in the live interview flow
- Used directly by the self-hosted Python LiveKit agent

### LiveKit
- Provides realtime room and media transport infrastructure
- Used for browser-based live interview sessions
- Works with the self-hosted interview agent rather than LiveKit hosted agents

## 💳 Current Pricing Model

| Plan | Price | Credits | Notes |
|---|---:|---:|---|
| Starter | INR 499 | 15 | Good entry plan for light usage |
| Growth | INR 999 | 35 | Best fit for repeat practice |
| Pro | INR 1999 | 80 | Highest value for heavy users |

Current credit pricing:

- Quick interview: 1 credit
- Standard interview: 2 credits
- Deep interview: 3 credits
- Detailed analysis add-on: 1 credit
- Premium analysis add-on: 2 credits

For full vendor pricing, unit economics, and market benchmarking, see [MARKET_COSTING_REPORT.md](./MARKET_COSTING_REPORT.md).

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### MongoDB Connection Failed
- Ensure MongoDB is running locally or update `MONGODB_URI`
- Check connection string format

### API Key Issues
- Verify all keys in `.env` are correct
- Check API key permissions on respective platforms

## 📝 License

MIT

## ✉️ Contact

Project maintained by IntervuAI Team
