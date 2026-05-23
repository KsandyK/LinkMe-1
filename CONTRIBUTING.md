# Contributing

Quick guidelines:

- Use `pnpm` for dependency management and workspace commands.
- Run typechecks and builds before opening PRs:

```bash
pnpm install
pnpm run build
```

- Keep `artifacts/` contents out of commits unless intentionally updating demo configs.
- Follow the existing TypeScript and formatting rules. Run `pnpm` scripts for linting if available.

If you're proposing structural changes (moving sources out of `artifacts/`), open an RFC-style PR describing the migration plan and rollback steps.
