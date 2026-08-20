FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=4001
EXPOSE 4001
CMD ["node", "src/server.js"]
