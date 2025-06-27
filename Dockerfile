# Базовый образ Python
FROM python:3.9-alpine

# Устанавливаем Nginx и Supervisor
RUN apk add --no-cache \
    nginx \
    supervisor && \
    mkdir -p /etc/supervisor.d

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем приложение
COPY ./app ./app

# Копируем конфиг Nginx
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем конфиг Supervisor
COPY supervisord.conf /etc/supervisor.d/supervisord.ini

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]