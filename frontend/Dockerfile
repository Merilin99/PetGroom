# PetGroom frontend - build με Vite, σερβίρισμα με nginx

# Στάδιο 1: build των στατικών αρχείων
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Στάδιο 2: μόνο ο nginx με το αποτέλεσμα του build (μικρό τελικό image)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
