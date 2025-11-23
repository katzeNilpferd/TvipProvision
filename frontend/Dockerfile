FROM node:18-alpine AS builder
WORKDIR /app

# Копируем файлы зависимостей
COPY .env ./
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Копируем исходный код и собираем приложение
COPY . .
RUN npm run build

FROM nginx:alpine AS runner

# Очищаем дефолтные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение из builder-этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг nginx
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
