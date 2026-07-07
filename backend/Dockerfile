# PetGroom backend - Node.js/Express
FROM node:20-alpine

WORKDIR /app

# Πρώτα τα dependencies (κάνουν cache αν δεν αλλάξει το package.json)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

EXPOSE 3000
CMD ["node", "src/server.js"]
