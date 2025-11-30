Руководство разработчика
========================

Быстрый старт для разработчиков.

.. toctree::
   :maxdepth: 2

   getting-started
   contributing
   testing

Локальная разработка
---------------------

Требования
~~~~~~~~~~

* Python 3.9+
* PostgreSQL
* Node.js 18+ (для frontend)

Backend
~~~~~~~

.. code-block:: bash

   # Установить зависимости
   pip install -r requirements.txt
   
   # Запустить PostgreSQL
   docker-compose up -d postgres
   
   # Запустить сервер
   cd src
   uvicorn main:app --host 0.0.0.0 --port 7373

Frontend
~~~~~~~~

.. code-block:: bash

   cd frontend
   npm install
   npm run dev

Структура проекта
-----------------

.. code-block:: text

   src/
   ├── domain/          # Доменный слой
   ├── application/     # Use cases
   ├── infrastructure/  # Технические детали
   └── presentation/    # REST API

Архитектурные принципы
----------------------

* Clean Architecture
* Repository Pattern
* Dependency Injection
* Use Cases для бизнес-логики

Добавление нового endpoint
---------------------------

1. Создать use case в ``application/use_cases/``
2. Зарегистрировать DI provider в ``infrastructure/di/injection.py``
3. Создать endpoint в ``presentation/api/endpoints/``
4. Добавить роутер в ``main.py``
