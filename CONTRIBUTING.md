# Contributing to CRAVR

Thank you for your interest in contributing!

## Development Workflow

1. **Branching**
   - Use feature branches: `feature/xxx`, `fix/xxx`
   - Keep branches focused and small

2. **Commit Messages**
   - Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

3. **Code Style**
   - Run `pnpm lint` and `pnpm typecheck` before pushing
   - Use TypeScript strictly

4. **Pull Requests**
   - Link related issues
   - Include screenshots for UI changes
   - Request review from maintainers

## Project Structure

See `README.md` for the current layout.

## Testing

```bash
pnpm --filter api test
pnpm --filter web test
```

## Questions?

Open an issue or reach out to the maintainers.
