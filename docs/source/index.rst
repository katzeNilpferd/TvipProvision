Документация TVIP Provisioning Service
========================================

Добро пожаловать в документацию сервиса автоматической выдачи конфигурационных файлов для TVIP-приставок.

Обзор
-----

TVIP Provisioning Service предоставляет автоматическую выдачу конфигурационных файлов ``tvip_provision.xml`` для TVIP-приставок. 
Сервис сохраняет устройства в базе данных, возвращает дефолтные и индивидуальные конфигурации, а также предоставляет REST API 
и опциональный веб-интерфейс для администрирования.

Ключевые возможности
--------------------

* **Автоматическая регистрация устройств** при первом обращении
* **Управление конфигурациями** через REST API или веб-интерфейс
* **Гибкая настройка** дефолтных и индивидуальных параметров
* **Архитектура на базе Docker** для простого развертывания
* **Clean Architecture** с чёткым разделением слоёв

Компоненты системы
------------------

Система состоит из трёх контейнеров:

* **tvip_provision** — backend-сервис (Python/FastAPI)
* **postgres** — база данных (PostgreSQL)
* **frontend** *(опционально)* — веб-интерфейс управления (React)

Содержание документации
------------------------

.. toctree::
   :maxdepth: 2
   :caption: Начало работы

   overview
   developer-guide/index

.. toctree::
   :maxdepth: 2
   :caption: Архитектура

   architecture/index

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api/index

.. toctree::
   :maxdepth: 2
   :caption: Доменный слой

   domain/index

.. toctree::
   :maxdepth: 2
   :caption: Прикладной слой

   application/index

.. toctree::
   :maxdepth: 2
   :caption: Инфраструктурный слой

   infrastructure/index

.. toctree::
   :maxdepth: 2
   :caption: Развертывание

   deployment/index

.. toctree::
   :maxdepth: 2
   :caption: Интеграция

   integration/index

.. toctree::
   :maxdepth: 2
   :caption: Frontend

   frontend/index

Индексы и таблицы
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
