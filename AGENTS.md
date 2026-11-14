# Agent context

## Commands

Run every project command through `just`, which runs it in this repository's dev image; the host carries no project toolchain.

In a fresh checkout: `just build`, then `just setup`. `just --list` shows the recipes.

Single Jest test: `just exec env TZ=UTC npx --no-install jest --runTestsByPath test/unit/BucketMerge.test.js`.
Tests write JUnit reports under `reports/test/`; both package builds write to `dist/`, with Vite last.
For setup prerequisites and deferred server-integration coverage, read [fork maintenance](docs/fork-maintenance.md).

## Architecture decisions

An ADR records why a rule exists. Before changing a decision, check
`docs/adr/` for an accepted ADR; reversing one needs a superseding ADR. Write one only if a
person approved it: in the session, or in an approved plan or `spec:agent` issue that
names the ADR. Otherwise the PR description is the record. Follow
[the format](docs/adr/0001-record-architecture-decisions.md), which states the ADR test.
