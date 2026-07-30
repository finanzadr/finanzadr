---
name: ship
description: Verify build, then commit and push only the current change
---
1. Run `npm run build` and stop if it fails.
2. Run `git status --short` and `git diff` to identify ONLY files touched for the current task.
3. `git add` those exact paths (never `-A`). Exclude any pre-existing debug/console code.
4. Commit with a concise scoped message describing the increment.
5. `git push origin main` and report the commit SHA.
