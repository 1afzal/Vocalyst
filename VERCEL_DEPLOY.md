# Vercel Deployment Guide

This project is configured to deploy on Vercel. Follow these steps:

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. MongoDB database (MongoDB Atlas recommended)
3. ElevenLabs API key

## Deployment Steps

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import project to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect the configuration

3. **Set Environment Variables in Vercel:**
   Go to Project Settings → Environment Variables and add:
   - `MONGODB_URI` - Your MongoDB connection string
   - `ELEVENLABS_API_KEY` - Your ElevenLabs API key
   - `NODE_ENV` - Set to `production`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your application

## Important Notes

### File Storage Limitations
- Vercel serverless functions use `/tmp` for temporary file storage
- Files in `/tmp` are **ephemeral** and will be deleted after the function execution
- For production use, consider:
  - Using cloud storage (AWS S3, Cloudinary, etc.) for output files
  - Returning signed URLs instead of serving files directly
  - Using a background job queue (Vercel Cron, external service) for long-running tasks

### Function Timeout Limits
- **Hobby Plan**: 10 seconds
- **Pro Plan**: 60 seconds (upgradeable to 300 seconds)
- **Enterprise**: Custom limits

Video processing may exceed these limits. Consider:
- Using Vercel Cron Jobs to poll for job status
- Using external queue services (BullMQ, AWS SQS, etc.)
- Processing files asynchronously with webhooks

### Current Implementation
The current setup processes dubbing jobs in the background (fire-and-forget). For production:
1. Store files in cloud storage (S3, etc.)
2. Use a proper job queue system
3. Implement webhooks or polling for job status updates

## Project Structure

```
/
├── api/              # Vercel serverless functions
│   ├── _utils/      # Shared utilities
│   ├── dub/         # Dubbing endpoints
│   └── job/         # Job management endpoints
├── frontend/        # React/Vite frontend
└── vercel.json      # Vercel configuration
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/dub/youtube` - Submit YouTube URL for dubbing
- `POST /api/dub/upload` - Upload file for dubbing
- `GET /api/job` - Get all jobs
- `GET /api/job/[jobId]` - Get job status
- `GET /api/job/[jobId]/download` - Download dubbed file

## Local Development

For local development, you can still use the original Express server:

```bash
cd backend
npm install
npm run dev
```

The frontend will use `http://localhost:6969/api` in development mode.

