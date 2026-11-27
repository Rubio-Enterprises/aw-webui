FROM ghcr.io/rubio-enterprises/base:main@sha256:273f3fcaeaca36f6b60aaddaa96a710fb8de122533a13e6c49b153075809c1f7 AS dev

USER root
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends make libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libglib2.0-0t64 libpango-1.0-0 libcairo2 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
# Mise 2026.11.1 reads the system config's lock at /etc/mise/mise.lock
# Native dependency sidecars under image/.mise/ are part of the lock
COPY image/ /etc/mise/
RUN --mount=type=secret,id=GITHUB_TOKEN /opt/standards/image/install.sh

FROM dev AS ci
COPY --link --from=ghcr.io/rubio-enterprises/runner:main@sha256:44b3f58d3ad97a08b550c96042ce2a6505dec684ec119c62362a2beb6b9766ca --chown=1000:1000 /home/runner /opt/actions-runner
WORKDIR /opt/actions-runner

# Same home and cache paths as the eventual runner, not root's throwaway caches
COPY --chown=1000:1000 . /workspaces/warmup
RUN /opt/standards/image/warmup.sh
USER vscode
