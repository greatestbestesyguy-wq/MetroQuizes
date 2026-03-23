FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Force Puppeteer to use the pre-installed Chrome to save space
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
