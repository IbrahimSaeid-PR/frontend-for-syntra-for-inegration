# SYNTRA Frontend

SYNTRA is a React single-page application for evidence-grounded cybersecurity investigations.

## Stack

- React 19 and TypeScript
- Vite 7
- React Router 7
- Tailwind CSS 4
- CSS keyframes and transitions for animation

Small interface primitives and SVG icons are implemented locally in React and CSS. Runtime dependencies are limited to React, React DOM, React Router, Tailwind CSS, and the Tailwind Vite adapter. React's Vite plugin and type packages are build-time dependencies.

## Development

From this directory:

```sh
bun install
bun run dev
bun run build
bun run lint
bun x vitest run
```

The app is also available through the repository-level npm scripts.

## Routes

- `/` landing page
- `/auth` sign-in, signup, and OTP verification
- `/investigate` protected investigation workspace
- `/history` protected conversation history
- `/about` protected product information

## Configuration

Set `VITE_API_BASE_URL` to the backend origin to use the remote FastAPI API. If it is empty, the frontend uses its local demo path. `VITE_WELCOME_WEBHOOK_URL` is an optional best-effort signup notification endpoint. Never place private credentials in frontend environment variables.