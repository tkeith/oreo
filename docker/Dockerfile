FROM debian:12

WORKDIR /app

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes curl wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes nodejs && \
    DEBIAN_FRONTEND=noninteractive apt-get install --yes wget build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev vim less iputils-ping sudo libsecret-1-0 command-not-found rsync man-db netcat-openbsd dnsutils procps lsof tini && \
    DEBIAN_FRONTEND=noninteractive apt-get update

RUN npm install -g pnpm
RUN pnpm set store-dir /app/node_modules/.pnpm-store

# Install Playwright for browser automation
ENV SHELL=/bin/bash
RUN bash -c "pnpm setup && \
    source /root/.bashrc && \
    npx playwright install --with-deps chromium"
ENV SHELL=/bin/sh
