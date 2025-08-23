You can scrape the web or perform other browser actions using Playwright.

Make sure the Dockerfile includes:

```
RUN npm install -g pnpm
ENV SHELL=/bin/bash
RUN bash -c "pnpm setup && \
    source /root/.bashrc && \
    pnpm install -g playwright@^1.54.1 && \
    playwright install --with-deps"
ENV SHELL=/bin/sh
```

Make sure `package.json` also includes `playwright` version `^1.54.1`.

Then, you can use it as expected.
