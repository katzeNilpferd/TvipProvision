Компоненты системы
==================

Backend компоненты
------------------

FastAPI приложение
~~~~~~~~~~~~~~~~~~

Главный модуль приложения находится в ``src/main.py``.

.. code-block:: python

   app = FastAPI(title="TVIP Provisioning Service")

Включает:

* CORS middleware для frontend
* Регистрацию роутеров из presentation слоя
* Инициализацию БД при старте

Uvicorn сервер
~~~~~~~~~~~~~~

ASGI сервер для запуска FastAPI приложения. Конфигурация в ``supervisord.conf``:

.. code-block:: ini

   [program:uvicorn]
   command=uvicorn main:app --host 0.0.0.0 --port 8000
   directory=/app/src

PostgreSQL
~~~~~~~~~~

База данных для хранения:

* Устройств (devices)
* Конфигураций (provision_configs)

**Схема БД:**

.. code-block:: sql

   CREATE TABLE devices (
       id SERIAL PRIMARY KEY,
       mac_address VARCHAR(17) UNIQUE NOT NULL,
       ip_address VARCHAR(45),
       model VARCHAR(100),
       custom_config_id INTEGER,
       created_at TIMESTAMP DEFAULT NOW(),
       last_seen_at TIMESTAMP
   );
   
   CREATE TABLE provision_configs (
       id SERIAL PRIMARY KEY,
       config_type VARCHAR(20) NOT NULL,
       config_data JSONB NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP
   );

Nginx
~~~~~

Reverse proxy для:

* Проксирование запросов к FastAPI
* Установка заголовков X-Real-IP
* Отдача статических файлов (опционально)

Supervisord
~~~~~~~~~~~

Управление процессами внутри контейнера:

* uvicorn (FastAPI)
* nginx

Frontend компоненты
-------------------

React приложение
~~~~~~~~~~~~~~~~

SPA приложение для администрирования:

* **Layout** — общий layout с навигацией
* **DevicesList** — список устройств с фильтрацией
* **DeviceConfig** — редактирование конфигурации устройства
* **DefaultConfig** — управление дефолтной конфигурацией

Vite dev server
~~~~~~~~~~~~~~~

Development сервер с hot reload для разработки.

API клиент (Axios)
~~~~~~~~~~~~~~~~~~

Модуль ``services/api.js`` для взаимодействия с backend:

.. code-block:: javascript

   const api = axios.create({
     baseURL: API_BASE_URL,
     headers: { 'Content-Type': 'application/json' }
   });

Nginx (production)
~~~~~~~~~~~~~~~~~~

Для production используется отдельный nginx контейнер, отдающий собранные статические файлы.

Доменные компоненты
-------------------

Entities (Сущности)
~~~~~~~~~~~~~~~~~~~

**Device**

Представляет TVIP-приставку.

Атрибуты:

* ``mac_address: MacAddress`` — MAC-адрес устройства
* ``ip_address: Optional[IpAddress]`` — IP-адрес
* ``model: Optional[str]`` — модель приставки
* ``custom_config_id: Optional[int]`` — ID кастомной конфигурации
* ``created_at: datetime`` — время регистрации
* ``last_seen_at: Optional[datetime]`` — время последнего обращения

**ProvisionConfig**

Представляет конфигурацию.

Атрибуты:

* ``id: int`` — идентификатор
* ``config_type: ProvisionConfigType`` — тип (DEFAULT или CUSTOM)
* ``config_data: ConfigData`` — данные конфигурации
* ``created_at: datetime`` — время создания
* ``updated_at: Optional[datetime]`` — время обновления

Value Objects
~~~~~~~~~~~~~

**MacAddress**

Валидация и нормализация MAC-адресов.

.. code-block:: python

   mac = MacAddress("00:11:22:33:44:55")
   assert mac.value == "00:11:22:33:44:55"

**IpAddress**

Валидация IP-адресов (IPv4/IPv6).

**ConfigData**

Работа с конфигурацией в формате dot notation.

.. code-block:: python

   config = ConfigData({"provision.@reload": "3600"})
   config.set("provision.operator.@name", "MyOperator")
   xml = config.to_dict()  # Преобразование в иерархический dict

**ProvisionConfigType**

Enum для типа конфигурации (DEFAULT, CUSTOM).

Repositories (Репозитории)
~~~~~~~~~~~~~~~~~~~~~~~~~~

**DeviceRepository**

Интерфейс для работы с устройствами:

* ``get_by_mac(mac: str) -> Optional[Device]``
* ``create(device: Device) -> Device``
* ``update(device: Device) -> Device``
* ``get_all(filters) -> List[Device]``

**ProvisionRepository**

Интерфейс для работы с конфигурациями:

* ``get_default_config() -> ProvisionConfig``
* ``get_by_id(id: int) -> Optional[ProvisionConfig]``
* ``update(config: ProvisionConfig) -> ProvisionConfig``
* ``create(config: ProvisionConfig) -> ProvisionConfig``

Services (Доменные сервисы)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

**XmlSerializer**

Интерфейс для сериализации конфигураций в XML:

* ``serialize(data: dict) -> str`` — преобразование dict в XML строку

**DefaultConfigService**

Сервис для работы с дефолтной конфигурацией:

* ``get_default_config()`` — получение дефолтной конфигурации
* ``ensure_default_exists()`` — создание дефолтной конфигурации при отсутствии

Прикладные компоненты
---------------------

Use Cases
~~~~~~~~~

**HandleProvisionRequestUseCase**

Обработка запроса от TVIP-приставки:

1. Проверка существования устройства
2. Создание нового устройства при необходимости
3. Обновление метаданных (IP, модель, время)
4. Получение конфигурации (кастомной или дефолтной)
5. Сериализация в XML

**GetDevicesListUseCase**

Получение списка устройств с фильтрацией по:

* IP-адресу
* Модели
* Времени последней активности
* Pagination (limit/offset)

**UpdateDeviceConfigUseCase**

Частичное обновление конфигурации устройства через dot notation.

**ReplaceDeviceConfigUseCase**

Полная замена конфигурации устройства.

**ResetDeviceConfigUseCase**

Сброс конфигурации устройства к дефолтной (удаление кастомной конфигурации).

**UpdateDefaultConfigUseCase**

Частичное обновление дефолтной конфигурации.

**ReplaceDefaultConfigUseCase**

Полная замена дефолтной конфигурации.

**GetDefaultConfigUseCase**

Получение дефолтной конфигурации.

Инфраструктурные компоненты
---------------------------

SQLAlchemy модели
~~~~~~~~~~~~~~~~~

**DeviceModel**

ORM модель для таблицы ``devices``.

**ProvisionConfigModel**

ORM модель для таблицы ``provision_configs``. Использует JSONB для хранения конфигурации.

Репозитории
~~~~~~~~~~~

**SQLDeviceRepository**

Реализация ``DeviceRepository`` через SQLAlchemy.

**SQLProvisionRepository**

Реализация ``ProvisionRepository`` через SQLAlchemy.

Сериализаторы
~~~~~~~~~~~~~

**XmlToDictSerializer**

Реализация ``XmlSerializer`` через библиотеку ``xmltodict``.

Value Objects
~~~~~~~~~~~~~

**PydashConfigData**

Реализация ``ConfigData`` через библиотеку ``pydash`` для работы с dot notation.

Dependency Injection
~~~~~~~~~~~~~~~~~~~~

Модуль ``infrastructure/di/injection.py`` содержит провайдеры для всех use cases:

.. code-block:: python

   def get_handle_provision_use_case(
       device_repo: DeviceRepository = Depends(get_device_repository),
       provision_repo: ProvisionRepository = Depends(get_provision_repository),
       serializer: XmlSerializer = Depends(get_xml_serializer)
   ) -> HandleProvisionRequestUseCase:
       return HandleProvisionRequestUseCase(device_repo, provision_repo, serializer)

Фабрики
~~~~~~~

**ConfigDataFactory**

Создание экземпляров ``ConfigData`` (использует ``PydashConfigData``).

Взаимодействие компонентов
---------------------------

Поток запроса от TVIP
~~~~~~~~~~~~~~~~~~~~~

1. **Nginx** получает запрос от приставки
2. **Nginx** устанавливает заголовок ``X-Real-IP`` и проксирует в **FastAPI**
3. **Endpoint** (``provision.py``) извлекает ``Mac-Address`` из заголовков
4. **Use Case** (``HandleProvisionRequestUseCase``) выполняет бизнес-логику:
   
   * Запрашивает устройство через **DeviceRepository**
   * Создаёт новое устройство при отсутствии
   * Получает конфигурацию через **ProvisionRepository**
   * Сериализует в XML через **XmlSerializer**

5. **Endpoint** возвращает XML с ``Content-Type: application/xml``

Поток API запроса
~~~~~~~~~~~~~~~~~

1. **Frontend** отправляет запрос через **Axios**
2. **Nginx** проксирует в **FastAPI**
3. **Endpoint** (``devices_management.py``) вызывает соответствующий **Use Case**
4. **Use Case** работает с репозиториями
5. **Repository** выполняет SQL запрос через **SQLAlchemy**
6. Результат возвращается обратно через слои
