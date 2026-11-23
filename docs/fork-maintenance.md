# Repository maintenance

Rubio Enterprises maintains this public MPL-2.0 repository independently. It began as ActivityWatch/aw-webui, but we do not sync from upstream or limit local changes to keep the trees aligned. Renovate manages dependency updates through the organization preset.

## Vendored media

`media/` is committed as regular files so Repository Images can build without fetching a submodule. The initial source is [ActivityWatch/media at a45151442aa33ed13d4fff8163bbb9b9e7636cee](https://github.com/ActivityWatch/media/tree/a45151442aa33ed13d4fff8163bbb9b9e7636cee). Retain `media/LICENSE` and the attribution in `media/README.md` when updating these assets.

## Server pin and the two images

`aw-server-rust` consumes this repository at a reviewed gitlink, not its moving
head. Land UI changes here before proposing the corresponding server gitlink
update. Keep commits pinned by the server reachable.

The server's service image still builds the UI through recursive checkout. Its
Repository/CI image intentionally omits this organization-owned submodule because
Rust setup/tests do not need the UI. This repository's own Repository Image uses
its committed media files and `just setup`; `just package` invokes
`make build` and `make build-vite` inside the dev image, including their logo prebuild steps.

## Hook setup

Run `just build-dev`, then `just setup` before local hooks. Setup installs locked
project dependencies into named volumes and installs thin container-dispatch hooks.
The base image supplies the Checks; the repository supplies the locked ESLint that
its Lefthook jobs call. The central Standards Check and Test Gate run the same
Lifecycle Scripts in CI.

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
input. The task writes Jest's results through the `jest-junit` reporter (a carried
devDependency) to `reports/test/junit.xml`, the Test Gate's proof.
