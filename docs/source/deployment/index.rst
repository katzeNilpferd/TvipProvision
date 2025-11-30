Развертывание
=============

Инструкции по развертыванию TVIP Provisioning Service.

Docker Deployment
-----------------

Полное развертывание (все сервисы)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # В корне проекта
   docker-compose --profile frontend up -d

Сервисы будут доступны:

* Backend: http://localhost:7373
* Frontend: http://localhost:80
* PostgreSQL: localhost:5432

Только backend
~~~~~~~~~~~~~~

.. code-block:: bash

   docker-compose up -d

Frontend отдельно
~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Создать .env в frontend/
   echo "VITE_API_BACKEND_URL=http://your-backend-url:7373" > frontend/.env
   
   # Запустить
   docker-compose up frontend -d

Остановка
~~~~~~~~~

.. code-block:: bash

   docker-compose down

Просмотр логов
~~~~~~~~~~~~~~

.. code-block:: bash

   docker-compose logs -f tvip_provision
   docker-compose logs -f frontend

Конфигурация
------------

Environment Variables
~~~~~~~~~~~~~~~~~~~~~

**Backend (опционально):**

* ``DATABASE_URL`` — строка подключения к PostgreSQL
* ``PORT`` — порт uvicorn (по умолчанию 8000)

**Frontend:**

* ``VITE_API_BACKEND_URL`` — адрес backend API

Docker Compose
~~~~~~~~~~~~~~

Основные параметры в ``docker-compose.yml``:

.. code-block:: yaml

   services:
     tvip_provision:
       ports:
         - "7373:7373"
       depends_on:
         - postgres
     
     postgres:
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     frontend:
       profiles: ["frontend"]
       ports:
         - "80:80"

Production рекомендации
-----------------------

HTTPS через nginx
~~~~~~~~~~~~~~~~~

Настроить nginx как reverse proxy с SSL сертификатом:

.. code-block:: nginx

   server {
       listen 443 ssl http2;
       server_name tvipupdate.net;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:7373;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

Масштабирование
~~~~~~~~~~~~~~~

Для высоких нагрузок:

* Несколько экземпляров backend за load balancer
* Отдельный сервер PostgreSQL с репликацией
* Redis для кэширования конфигураций

Backup базы данных
~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Создать backup
   docker-compose exec postgres pg_dump -U postgres tvip_provision > backup.sql
   
   # Восстановить
   docker-compose exec -T postgres psql -U postgres tvip_provision < backup.sql

Мониторинг
----------

Health check
~~~~~~~~~~~~

.. code-block:: bash

   curl http://localhost:7373/docs

Проверка БД
~~~~~~~~~~~

.. code-block:: bash

   docker-compose exec postgres psql -U postgres -d tvip_provision -c "SELECT COUNT(*) FROM devices;"

Логирование
~~~~~~~~~~~

Логи доступны через Docker:

.. code-block:: bash

   docker-compose logs --tail=100 -f tvip_provision
