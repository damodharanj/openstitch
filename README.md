# OpenStitch

The open source alternative to Google Stitch. Create UI mockups like Figma using AI, powered by HTML+Tailwind.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Docker (optional, for easy deployment)

### Local Development

1.  **Install Dependencies**
    ```bash
    npm install
    ```
    This will install dependencies for both the root (server) and the client.

2.  **Environment Setup**
    - Copy `.env.example` (if available) or create `.env` in the root.
    - Set up required environment variables (MONGO_URI, CLERK_keys, AI_KEYS).

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    This starts both the backend (port 5000) and frontend (port 5173).

## Hosting / Deployment

The easiest way to host OpenStitch is using Docker. This creates a single container that serves both the frontend and backend.

### Using Docker Compose (Recommended for testing)

1.  **Build and Run**
    ```bash
    docker compose up --build
    ```
2.  Open [http://localhost:5000](http://localhost:5000).

### Manual Docker Build

1.  **Build the Image**
    ```bash
    docker build -t open-stitch .
    ```

2.  **Run the Container**
    ```bash
    docker run -p 5000:5000 --env-file .env open-stitch
    ```
    Make sure your `.env` file contains the necessary production environment variables.

### Environment Variables for Production
Ensure the following variables are set in your deployment environment:
- `NODE_ENV=production`
- `MONGO_URI`: Connection string for your MongoDB.
- `CLERK_PUBLISHABLE_KEY`: Clerk Public Key.
- `CLERK_SECRET_KEY`: Clerk Secret Key.
- `OPENAI_API_KEY` (and other AI provider keys as needed).
