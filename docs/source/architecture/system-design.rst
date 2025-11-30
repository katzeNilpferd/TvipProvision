Проектирование системы
======================

Компонентная архитектура
------------------------

Система состоит из трёх основных контейнеров, которые взаимодействуют друг с другом:

.. mermaid::

   graph TB
       TVIP[TVIP Приставки]
       NGINX[Nginx Reverse Proxy]
       BACKEND[Backend Service<br/>FastAPI + Uvicorn]
       DB[(PostgreSQL)]
       FRONTEND[Frontend<br/>React + Vite]
       
       TVIP -->|HTTP| NGINX
       FRONTEND -->|HTTP| NGINX
       NGINX -->|Proxy| BACKEND
       BACKEND -->|SQL| DB
       
       style BACKEND fill:#87CEEB
       style DB fill:#FFB6C1
       style FRONTEND fill:#FFD700
       style NGINX fill:#90EE90

Docker архитектура
------------------

Контейнеры
~~~~~~~~~~

**tvip_provision**
  * Образ: Python 3.9
  * Процессы: Uvicorn (FastAPI) + Nginx + Supervisord
  * Порт: 7373
  * Зависимости: PostgreSQL

**postgres**
  * Образ: PostgreSQL 15
  * Порт: 5432
  * Volumes: данные БД

**frontend** (опционально)
  * Образ: Node.js (build) + Nginx (runtime)
  * Порт: 80
  * Multi-stage build для оптимизации размера

Сетевое взаимодействие
~~~~~~~~~~~~~~~~~~~~~~

Все контейнеры находятся в одной Docker сети и обмениваются данными по внутренним hostname.

.. code-block:: yaml

   networks:
     default:
       name: tvip_provision_network

Слои приложения
---------------

Domain Layer (src/domain/)
~~~~~~~~~~~~~~~~~~~~~~~~~~

Ядро системы, содержит:

* **entities/** — доменные сущности (Device, ProvisionConfig)
* **value_objects/** — value objects для валидации (MacAddress, IpAddress, ConfigData)
* **repositories/** — интерфейсы репозиториев
* **services/** — доменные сервисы (XmlSerializer)

**Принципы:**

* Не зависит от внешних библиотек и фреймворков
* Содержит только бизнес-правила
* Определяет интерфейсы, но не реализацию

Application Layer (src/application/)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Содержит use cases — сценарии использования:

* **tvip_provision/** — обработка запросов от приставок
* **devices_management/** — управление устройствами
* **default_config_management/** — управление дефолтной конфигурацией

**Принципы:**

* Каждый use case — это один сценарий использования
* Оркеструет вызовы доменных объектов
* Не содержит технических деталей (БД, HTTP)

Infrastructure Layer (src/infrastructure/)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Технические детали реализации:

* **database/** — SQLAlchemy модели и подключение к БД
* **repositories/** — реализация репозиториев
* **di/** — конфигурация Dependency Injection
* **serializers/** — реализация сериализаторов (XmlToDictSerializer)
* **value_objects/** — конкретные реализации value objects (PydashConfigData)
* **factories/** — фабрики для создания объектов

Presentation Layer (src/presentation/)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

REST API endpoints:

* **provision.py** — endpoint для TVIP-приставок
* **devices_management.py** — API управления устройствами
* **default_config_management.py** — API управления дефолтной конфигурацией

Масштабирование
---------------

Горизонтальное масштабирование
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Backend может быть запущен в нескольких экземплярах
* Использовать load balancer (nginx upstream)
* Stateless архитектура — состояние хранится в БД

Вертикальное масштабирование
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Увеличение ресурсов БД (CPU, RAM)
* Настройка connection pooling в asyncpg
* Индексы на часто запрашиваемые поля (mac_address, ip_address)

Кэширование
~~~~~~~~~~~

Возможности для оптимизации:

* Кэширование дефолтной конфигурации (Redis)
* Кэширование конфигураций устройств с TTL
* HTTP кэширование через ETag/Last-Modified

Безопасность
------------

Текущая реализация
~~~~~~~~~~~~~~~~~~

* Нет встроенной аутентификации в API
* PostgreSQL доступна только внутри Docker сети
* CORS настроен на allow all для dev окружения

Рекомендации для production
~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Добавить аутентификацию через API keys или JWT
* Настроить HTTPS через nginx с сертификатами
* Ограничить CORS конкретными доменами
* Использовать секреты Docker для DATABASE_URL
* Настроить rate limiting на API endpoints
