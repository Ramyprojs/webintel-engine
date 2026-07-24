# This will be populated in Phase 5
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

ENV VITE_API_TARGET=http://api:8000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
