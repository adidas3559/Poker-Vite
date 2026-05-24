Since this will be a node server at some point, here are some tips and useful things to know:



NODE SERVER REQUEST FLOW
When the BE is a Node/Express server, a player action flows like this:

  FE: user clicks "Call"
    → sends WebSocket event (or HTTP POST) to server

  Middleware layer (runs on every request, knows nothing about poker):
    → body parser   — parses incoming JSON
    → auth          — verifies the player is who they say they are
    → logger        — logs the request for debugging

  Router:
    → maps the event/route to the right controller function

  Controller (gameController.ts) — HTTP layer:
    → reads the action and gameId from the request
    → calls gameService
    → sends the response back to the client(s)

  Service (gameService.ts) — orchestration:
    → looks up the current GameState for this game room
    → calls the appropriate pure function from GameLogic.ts
    → saves the new GameState
    → returns it to the controller

  GameLogic.ts — pure business logic:
    → applyCall(state, playerIndex): GameState
    → knows nothing about HTTP, sockets, or databases

  FE: receives new GameState over WebSocket → re-renders


BUSINESS LOGIC vs MIDDLEWARE
  Business logic (domain logic): the rules specific to your app — poker rules.
    How blinds are posted, when a round ends, who wins a side pot.
    Lives in GameLogic.ts and is pure functions. Same in every environment.

  Middleware: infrastructure that runs before your route handler on every request.
    Auth checks, body parsing, CORS headers, logging, rate limiting.
    Has no idea what your app does — the same boilerplate appears in every Express app.
    Signature: (req, res, next) => void — calls next() to pass the request along.

  Rule of thumb: if you'd copy it unchanged into a completely different app, it's middleware.
  If it encodes a poker rule, it's business logic.



FUTURE: MULTI-REPO / SHARED TYPES STRATEGY
Currently using a monorepo where web FE, BE, and shared types all live together.
If this ever splits into separate repos (e.g. adding a React Native mobile app), two options:

Option 1 — Private npm package (@your-app/shared-types)
  Extract GameState.ts and any shared types into their own small repo/package.
  Publish to GitHub Packages (free) or npm private (~$7/mo).
  All repos install it as a dependency and import from it like any other package.
  When types change: bump version, publish, update the dependency in each repo.
  Best for: stable, infrequently-changing type contracts.

Option 2 — Zod schemas in the shared package
  Same as Option 1 but define schemas with Zod instead of plain TypeScript types.
  Types are inferred from the schema: type PlayerState = z.infer<typeof PlayerSchema>
  Benefit: the BE can use the same schema to validate incoming WebSocket/HTTP data at runtime,
  not just at compile time. Important for a networked game where clients send actions to the server.
  Best for: when you want runtime validation on top of compile-time safety.
