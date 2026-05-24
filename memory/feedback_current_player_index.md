---
name: Keep players[currentPlayerIndex] pattern
description: User prefers explicit players[game.currentPlayerIndex] indexing over extracting a currentPlayer variable
type: feedback
---

Don't extract `const currentPlayer = players[game.currentPlayerIndex]` as a local variable shortcut. User finds the repeated index access easier to follow than the abstraction.

**Why:** User said it's harder to follow when a local alias hides where the data comes from.

**How to apply:** In poker game handlers (raiseHandler, callHandler, foldHandler, allInHandler, etc.), always write `players[game.currentPlayerIndex].chips` etc. directly rather than aliasing to a local var.
