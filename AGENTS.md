React + Redux Toolkit + TypeScript frontend, Cloudflare Workers + Hono + D1 backend.

Run `make` before running any commands.

Client source is in `src/`, worker source is in `worker/`.

Detroit-style tests: assert on observable behaviour, mock only at the boundary (MSW for client, D1 for worker).
