# Agent context

First command in a fresh checkout: `just build`.
Never install toolchains on the host — all project commands run in the dev image through `just`.

```bash
just build
just setup
just check
just fmt
just check-pr
just typecheck
just test
just package
just setup-deps
just shell
just exec <cmd...>
```

Single test: `just exec uv run pytest path::test` (Python); otherwise prefix the underlying runner with `just exec`.

Repo-specific context (in-progress migrations, gotchas, agent guidance):

<!-- Fill in below as needed. -->
