#!/bin/bash
# Block non-bun package managers and enforce make targets where they exist.

command=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // empty')

# Block npm, npx, yarn, pnpm entirely
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*(npm|npx|yarn|pnpm|pnpx)\b'; then
  echo "BLOCKED: Use bun/bunx instead of npm/npx/yarn/pnpm. Prefer make targets when available."
  exit 2
fi

# Block bun run test variants — use make test/test-client/test-worker
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*bun\s+(run\s+)?(test|client:test|worker:test)\b'; then
  echo "BLOCKED: Use 'make test', 'make test/client', or 'make test/worker' instead of bun test."
  exit 2
fi

# Block bun run lint variants — use make lint
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*bun\s+(run\s+)?(lint|client:lint|worker:lint|typecheck)\b'; then
  echo "BLOCKED: Use 'make lint', 'make lint/client', 'make lint/worker', or 'make typecheck' instead."
  exit 2
fi

# Block bun run fmt/prettier variants — use make fmt
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*bun\s+(run\s+)?(client:fmt|worker:fmt)\b'; then
  echo "BLOCKED: Use 'make fmt', 'make fmt/client', or 'make fmt/worker' instead."
  exit 2
fi

# Block bun install — use make deps
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*bun\s+install\b'; then
  echo "BLOCKED: Use 'make deps' instead of bun install."
  exit 2
fi

# Block bun run dev/build/deploy/ship — use make targets
if echo "$command" | grep -qE '(^|\s|&&|\|\||;)\s*bun\s+run\s+(dev|build|preview|deploy|ship)\b'; then
  echo "BLOCKED: Use 'make dev', 'make build', 'make preview', 'make deploy', or 'make ship' instead."
  exit 2
fi

exit 0
