# La' Musica

Local music generation app powered by [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5).

Generate music from text descriptions, create song lyrics in multiple languages, and manage your generation history — all running locally on your GPU.

## Architecture

| Service    | Tech                    | Port  | Description                              |
|------------|-------------------------|-------|------------------------------------------|
| frontend   | React + Vite + Tailwind | 3000  | Web UI for music generation              |
| backend    | Python FastAPI          | 8000  | API middleware, business logic            |
| acestep    | ACE-Step 1.5 API        | 8001  | Music generation (GPU)                   |
| ollama     | Ollama + Qwen2.5-7B     | 11434 | Song lyrics generation (CPU)             |
| postgres   | PostgreSQL 16           | 5432  | Generation history storage               |

## Models (optimized for 16 GB VRAM)

- **DiT**: `acestep-v15-turbo` — 8 inference steps, very high quality
- **LM**: `acestep-5Hz-lm-1.7B` — vLLM backend, great for 12-16 GB GPU
- **Lyrics**: `qwen2.5:7b` — multilingual (EN/RU/BY), runs on CPU via Ollama

## Quick Start

### Prerequisites

- Docker + Docker Compose v2
- NVIDIA GPU with 16 GB VRAM
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

### Launch

```bash
# 1. Clone the repo
git clone https://github.com/W1neSkin/ACE-Step-Music.git
cd ACE-Step-Music

# 2. Copy and edit env config
cp .env.example .env
# (Optional) edit .env to customize DB password, model settings, etc.

# 3. Start all services
docker compose up --build

# 4. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
```

First launch will take 10-20 minutes to download models (cached for subsequent runs).

### Development (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Features

- **Music Generation** — describe a style, write lyrics, set BPM/key/duration, generate multiple variants
- **Lyrics AI** — generate song lyrics in English, Russian, or Belarusian using Qwen 2.5
- **Audio Player** — waveform visualization, variant switching, download
- **History** — browse and replay past generations
- **Dark theme** — modern UI inspired by Suno/Spotify aesthetic

## API Endpoints

| Method | Path                         | Description                |
|--------|------------------------------|----------------------------|
| POST   | /api/music/generate          | Submit generation task     |
| GET    | /api/music/status/{task_id}  | Poll task status           |
| GET    | /api/music/audio?path=...    | Download generated audio   |
| GET    | /api/music/models            | List available models      |
| POST   | /api/lyrics/generate         | Generate song lyrics       |
| GET    | /api/history                 | List generation history    |
| GET    | /api/history/{id}            | Get generation details     |
| DELETE | /api/history/{id}            | Delete a generation        |
| GET    | /api/health                  | Health check               |

## License

MIT
