# Browser fixtures

The browser test uses responses recorded from a fresh, isolated aw-server-rust
0.14.0.post4 container, seeded with one empty window bucket. It exercises the
built UI, not server interoperability. The server-backed Jest suite and live
server coverage remain separate work in [#4 Run the server-backed tests in CI again with pinned tooling](https://github.com/Rubio-Enterprises/aw-webui/issues/4).

To re-record, use a disposable server with no personal data. The pinned image is
amd64, so Apple silicon needs emulation. From the repository root:

```sh
docker run --rm -d --platform linux/amd64 --name aw-fixture -p 127.0.0.1:15600:5600 \
  ghcr.io/rubio-enterprises/aw-server-rust@sha256:08c11399a75f2824938783c63bc82c284780830c91b929cc7cda235f6569242a
curl -fsS -X POST -H 'Content-Type: application/json' \
  -d '{"client":"aw-watcher-window","type":"currentwindow","hostname":"fixture-host"}' \
  http://127.0.0.1:15600/api/0/buckets/aw-watcher-window_fixture-host
curl -fsS http://127.0.0.1:15600/api/0/info > fork/e2e/fixtures/info.json
curl -fsS http://127.0.0.1:15600/api/0/settings > fork/e2e/fixtures/settings.json
curl -fsS http://127.0.0.1:15600/api/0/buckets > fork/e2e/fixtures/buckets.json
curl -fsS http://127.0.0.1:15600/api/0/buckets/aw-watcher-window_fixture-host > fork/e2e/fixtures/bucket.json
curl -fsS http://127.0.0.1:15600/api/0/buckets/aw-watcher-window_fixture-host/events > fork/e2e/fixtures/events.json
curl -fsS http://127.0.0.1:15600/api/0/buckets/aw-watcher-window_fixture-host/events/count > fork/e2e/fixtures/count.json
docker stop aw-fixture
```

Wait for the server to start before sending requests. Review the responses for
personal data before committing. Run `just test-e2e` to check the new recording.
