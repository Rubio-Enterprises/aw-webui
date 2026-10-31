# Fork maintenance

This public MPL-2.0 fork tracks ActivityWatch/aw-webui `master` through the
organization's central shared-history sync controller. Land syncs with true
merge commits, not squash or rebase. See the
[central review contract](https://github.com/Rubio-Enterprises/standards/blob/main/docs/sync-pr-review.md).

## Carried changes

- Organization standards/configuration, canonical Jest test gate, image caller,
  ESLint hook integration and the `mise` task interface. Upstream application
  code, ESLint configuration, package versions and build implementation remain
  upstream-owned. Keep inherited dependency bots and publishing workflows
  removed; Renovate is centrally managed.
- `media` is intentionally vendored, not a submodule. The owner approved this
  divergence so Repository Images contain committed inputs without fetching a
  third-party gitlink. The initial source is
  [ActivityWatch/media at a45151442aa33ed13d4fff8163bbb9b9e7636cee](https://github.com/ActivityWatch/media/tree/a45151442aa33ed13d4fff8163bbb9b9e7636cee).
  All 16 files (about 1.1 MB) are included byte-for-byte, including the upstream
  MPL-2.0 `media/LICENSE` and attribution in `media/README.md`. No third media
  fork or fetch wrapper is maintained.

## Updating vendored media during a sync

Ordinary upstream changes that do not touch the media gitlink preserve the
vendored directory. When upstream advances that gitlink or changes `.gitmodules`,
expect a file/directory or modify/delete conflict requiring review. The controller
never merges and does not auto-resolve these non-standards paths.

Read the proposed upstream gitlink SHA, inspect that commit's media tree and
license, and refresh `media/` from exactly that source commit. Retain the upstream
LICENSE and attribution; update the source link above. Remove any reintroduced
media gitlink and its `.gitmodules` entry rather than accepting the upstream
submodule representation. Keep unrelated upstream submodules/entries for separate
review, never blanket-resolve the entire file. Verify tracked media blobs match
that source tree, run setup/tests/typecheck/build, and confirm `git ls-files
--stage media` lists regular files rather than mode `160000`.

## Server pin and the two images

`aw-server-rust` consumes this fork at its own reviewed gitlink, not this
repository's moving head. Sync this repository first before landing a server sync
that needs a newer UI commit. Keep the requested commit reachable in this fork;
never replace a pinned server gitlink with an automatic `--remote` update.

The server's service image still builds the UI through recursive checkout. Its
Repository/CI image intentionally omits this organization-owned submodule because
Rust setup/tests do not need the UI. This repository's own Repository Image uses
its committed media files and `npm ci`; `mise run build` invokes upstream's
`make build` and `make build-vite`, including their logo prebuild steps.

## Onboarding validation limitation

The owner explicitly deferred the legacy upstream server-integration/TestCafe
matrix during onboarding. Canonical gates currently cover Jest without external
servers, locales, TypeScript, ESLint and both Webpack/Vite builds. The 30
server-backed Jest tests remain skipped without `AW_QUERY_TEST_SERVER_URL`;
TestCafe's browser/server matrix is not run. These are known coverage gaps, not
proof of server interoperability. Porting that matrix is follow-up work using
supported pinned actions/tools and reproducible server fixtures, not restoration
of upstream's mutable actions, nightly downloads or global pip installs.

The canonical Jest task sets `TZ=UTC`, matching Linux CI and upstream's February
month-boundary fixture. A non-UTC local run crosses January for that fixed UTC
input. The task records Jest's positive test count without adding a reporter
package or changing/skipping tests.
