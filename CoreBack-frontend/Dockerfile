# Etapa 1: Build
FROM node:20-alpine as build-stage

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código
COPY . .

# Construimos la app (Genera carpeta 'dist')
RUN npm run build

# Etapa 2: Nginx
FROM nginx:alpine

# Copiamos desde 'dist' (Confirmado por tu captura)
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]