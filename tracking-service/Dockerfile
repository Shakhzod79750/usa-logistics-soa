FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4003
EXPOSE 4003
CMD ["node", "src/server.js"]
