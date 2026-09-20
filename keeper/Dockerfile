FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json* ./

RUN npm install --omit=dev --ignore-scripts || true

COPY src ./src

CMD ["npm", "run", "start"]