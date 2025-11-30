API Reference
=============

Документация REST API для управления TVIP Provisioning Service.

.. toctree::
   :maxdepth: 2

   provision
   devices
   default-config

Общая информация
-----------------

Base URL
~~~~~~~~

По умолчанию API доступно по адресу:

.. code-block:: text

   http://localhost:7373

Формат данных
~~~~~~~~~~~~~

* **Content-Type**: ``application/json``
* **Кодировка**: UTF-8
* **Формат конфигураций**: Dot notation (для PUT запросов)
* **Формат provision XML**: ``application/xml``

Аутентификация
~~~~~~~~~~~~~~

В текущей версии API не требует аутентификации.

.. warning::
   Для production окружения рекомендуется настроить аутентификацию через nginx или добавить API keys.

Коды статусов
~~~~~~~~~~~~~

Стандартные HTTP коды:

* **200 OK** — успешный запрос
* **201 Created** — ресурс создан
* **400 Bad Request** — неверные параметры запроса
* **404 Not Found** — ресурс не найден
* **422 Unprocessable Entity** — ошибка валидации
* **500 Internal Server Error** — внутренняя ошибка сервера

Формат ошибок
~~~~~~~~~~~~~

При ошибках возвращается JSON с описанием:

.. code-block:: json

   {
       "detail": "Device with MAC 00:11:22:33:44:55 not found"
   }

Pagination
~~~~~~~~~~

Для endpoints, возвращающих списки, поддерживается pagination через параметры:

* ``limit`` — количество записей (по умолчанию: без ограничения)
* ``offset`` — смещение (по умолчанию: 0)

Пример:

.. code-block:: bash

   GET /api/devices?limit=20&offset=40

Interactive API Documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

FastAPI автоматически генерирует интерактивную документацию:

* **Swagger UI**: http://localhost:7373/docs
* **ReDoc**: http://localhost:7373/redoc
