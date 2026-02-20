FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Write runtime env vars into .env.local so Vite picks them up
EXPOSE 3000
CMD sh -c 'echo "VITE_API_URL=${VITE_API_URL}" > .env.local && npm run dev'
