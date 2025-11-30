Архитектура системы
===================

В этом разделе описана архитектура TVIP Provisioning Service, включая общую структуру, слои приложения и взаимодействие компонентов.

.. toctree::
   :maxdepth: 2

   system-design
   components
   data-flow

Обзор
-----

Система построена на принципах **Clean Architecture** с чётким разделением ответственности между слоями. 
Это обеспечивает:

* Независимость бизнес-логики от деталей реализации
* Лёгкую тестируемость
* Гибкость при изменении инфраструктуры
* Понятную структуру кода

Слои архитектуры
----------------

**Domain Layer (Доменный слой)**
  Содержит бизнес-логику и правила предметной области. Не зависит от других слоёв.

**Application Layer (Прикладной слой)**
  Содержит use cases — сценарии использования системы. Оркеструет работу доменных объектов.

**Infrastructure Layer (Инфраструктурный слой)**
  Содержит технические детали: БД, DI, внешние сервисы, сериализаторы.

**Presentation Layer (Слой представления)**
  REST API endpoints для взаимодействия с внешним миром.

Диаграмма зависимостей
-----------------------

.. mermaid::

   graph TB
       P[Presentation Layer<br/>API Endpoints]
       A[Application Layer<br/>Use Cases]
       D[Domain Layer<br/>Entities, Repositories]
       I[Infrastructure Layer<br/>DB, DI, Serializers]
       
       P --> A
       A --> D
       I --> D
       P -.-> I
       A -.-> I
       
       style D fill:#90EE90
       style A fill:#87CEEB
       style I fill:#FFB6C1
       style P fill:#FFD700
