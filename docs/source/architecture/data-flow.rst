Потоки данных
=============

В этом разделе описаны основные потоки данных в системе.

Поток регистрации нового устройства
------------------------------------

Когда TVIP-приставка обращается к сервису впервые:

.. mermaid::

   sequenceDiagram
       participant Device as TVIP Приставка
       participant API as FastAPI Endpoint
       participant UC as HandleProvisionRequestUseCase
       participant DR as DeviceRepository
       participant PR as ProvisionRepository
       participant XS as XmlSerializer
       participant DB as PostgreSQL
       
       Device->>API: GET /prov/tvip_provision.xml<br/>Header: Mac-Address
       API->>UC: execute(mac, ip, model)
       UC->>DR: get_by_mac(mac)
       DR->>DB: SELECT FROM devices WHERE mac=?
       DB-->>DR: NULL (не найдено)
       DR-->>UC: None
       
       Note over UC: Устройство не существует,<br/>создаём новое
       
       UC->>DR: create(Device)
       DR->>DB: INSERT INTO devices
       DB-->>DR: Device ID
       DR-->>UC: Device
       
       UC->>PR: get_default_config()
       PR->>DB: SELECT FROM provision_configs<br/>WHERE type='DEFAULT'
       DB-->>PR: Config data (JSONB)
       PR-->>UC: ProvisionConfig
       
       UC->>XS: serialize(config_data)
       XS-->>UC: XML string
       UC-->>API: XML content
       API-->>Device: Response 200<br/>Content-Type: application/xml

**Шаги:**

1. Приставка отправляет запрос с MAC-адресом в заголовке
2. Use case проверяет наличие устройства в БД
3. Устройство не найдено → создаётся новая запись
4. Запрашивается дефолтная конфигурация
5. Конфигурация сериализуется в XML
6. XML возвращается приставке

Поток обновления конфигурации устройства
-----------------------------------------

Администратор изменяет конфигурацию конкретной приставки:

.. mermaid::

   sequenceDiagram
       participant Admin as Администратор
       participant API as FastAPI Endpoint
       participant UC as ReplaceDeviceConfigUseCase
       participant DR as DeviceRepository
       participant PR as ProvisionRepository
       participant DB as PostgreSQL
       
       Admin->>API: PUT /api/devices/{mac}/config/replace<br/>Body: {"provision.@reload": "3600"}
       API->>UC: execute(mac, new_config_dict)
       
       UC->>DR: get_by_mac(mac)
       DR->>DB: SELECT FROM devices WHERE mac=?
       DB-->>DR: Device record
       DR-->>UC: Device
       
       Note over UC: Проверка существования устройства
       
       alt Устройство имеет кастомную конфигурацию
           UC->>PR: get_by_id(custom_config_id)
           PR->>DB: SELECT FROM provision_configs WHERE id=?
           DB-->>PR: Existing config
           PR-->>UC: ProvisionConfig
           
           Note over UC: Обновляем существующую конфигурацию
           UC->>PR: update(config)
           PR->>DB: UPDATE provision_configs SET config_data=?
       else Устройство без кастомной конфигурации
           Note over UC: Создаём новую кастомную конфигурацию
           UC->>PR: create(new ProvisionConfig)
           PR->>DB: INSERT INTO provision_configs
           DB-->>PR: New config ID
           PR-->>UC: ProvisionConfig
           
           Note over UC: Обновляем ссылку на конфигурацию
           UC->>DR: update(device with custom_config_id)
           DR->>DB: UPDATE devices SET custom_config_id=?
       end
       
       DB-->>PR: Success
       PR-->>UC: Updated config
       UC-->>API: Success response
       API-->>Admin: 200 OK

**Шаги:**

1. Администратор отправляет новую конфигурацию
2. Use case проверяет существование устройства
3. Если у устройства уже есть кастомная конфигурация → обновляется
4. Если кастомной конфигурации нет → создаётся новая + обновляется ссылка в устройстве
5. Возвращается успешный ответ

Поток получения конфигурации существующим устройством
------------------------------------------------------

Приставка с кастомной конфигурацией запрашивает обновление:

.. mermaid::

   sequenceDiagram
       participant Device as TVIP Приставка
       participant API as FastAPI Endpoint
       participant UC as HandleProvisionRequestUseCase
       participant DR as DeviceRepository
       participant PR as ProvisionRepository
       participant XS as XmlSerializer
       participant DB as PostgreSQL
       
       Device->>API: GET /prov/tvip_provision.xml<br/>Header: Mac-Address
       API->>UC: execute(mac, ip, model)
       
       UC->>DR: get_by_mac(mac)
       DR->>DB: SELECT FROM devices WHERE mac=?
       DB-->>DR: Device record (с custom_config_id)
       DR-->>UC: Device
       
       Note over UC: Устройство существует,<br/>обновляем метаданные
       
       UC->>DR: update(device) [ip, model, last_seen_at]
       DR->>DB: UPDATE devices SET ip=?, model=?, last_seen_at=?
       DB-->>DR: Success
       
       alt Устройство имеет кастомную конфигурацию
           UC->>PR: get_by_id(custom_config_id)
           PR->>DB: SELECT FROM provision_configs WHERE id=?
           DB-->>PR: Custom config data
           PR-->>UC: ProvisionConfig (CUSTOM)
       else Устройство без кастомной конфигурации
           UC->>PR: get_default_config()
           PR->>DB: SELECT FROM provision_configs<br/>WHERE type='DEFAULT'
           DB-->>PR: Default config data
           PR-->>UC: ProvisionConfig (DEFAULT)
       end
       
       UC->>XS: serialize(config_data)
       XS-->>UC: XML string
       UC-->>API: XML content
       API-->>Device: Response 200<br/>Content-Type: application/xml

**Шаги:**

1. Приставка отправляет запрос с MAC-адресом
2. Use case находит устройство в БД
3. Обновляются метаданные (IP, модель, время последнего обращения)
4. Если у устройства есть кастомная конфигурация → используется она
5. Иначе используется дефолтная конфигурация
6. Конфигурация сериализуется в XML и возвращается

Поток сброса конфигурации
--------------------------

Администратор сбрасывает кастомную конфигурацию устройства:

.. mermaid::

   sequenceDiagram
       participant Admin as Администратор
       participant API as FastAPI Endpoint
       participant UC as ResetDeviceConfigUseCase
       participant DR as DeviceRepository
       participant DB as PostgreSQL
       
       Admin->>API: POST /api/devices/{mac}/config/reset
       API->>UC: execute(mac)
       
       UC->>DR: get_by_mac(mac)
       DR->>DB: SELECT FROM devices WHERE mac=?
       DB-->>DR: Device record
       DR-->>UC: Device
       
       Note over UC: Проверка наличия кастомной конфигурации
       
       alt Устройство имеет custom_config_id
           Note over UC: Удаляем ссылку на кастомную конфигурацию
           UC->>DR: update(device with custom_config_id=NULL)
           DR->>DB: UPDATE devices SET custom_config_id=NULL
           DB-->>DR: Success
           DR-->>UC: Updated device
           UC-->>API: Success message
       else Устройство без custom_config_id
           UC-->>API: Info: уже использует дефолт
       end
       
       API-->>Admin: 200 OK

**Шаги:**

1. Администратор запрашивает сброс конфигурации
2. Use case находит устройство
3. Если у устройства есть ссылка на кастомную конфигурацию → удаляется
4. Теперь устройство будет получать дефолтную конфигурацию

Поток обновления дефолтной конфигурации
----------------------------------------

Администратор обновляет конфигурацию по умолчанию:

.. mermaid::

   sequenceDiagram
       participant Admin as Администратор
       participant API as FastAPI Endpoint
       participant UC as UpdateDefaultConfigUseCase
       participant PR as ProvisionRepository
       participant DB as PostgreSQL
       
       Admin->>API: PUT /api/default/config/update<br/>Body: {"provision.time.@tz": "Europe/London"}
       API->>UC: execute(updates_dict)
       
       UC->>PR: get_default_config()
       PR->>DB: SELECT FROM provision_configs<br/>WHERE type='DEFAULT'
       DB-->>PR: Current default config
       PR-->>UC: ProvisionConfig
       
       Note over UC: Объединяем текущую конфигурацию<br/>с обновлениями (merge)
       
       UC->>PR: update(merged_config)
       PR->>DB: UPDATE provision_configs<br/>SET config_data=?, updated_at=NOW()
       DB-->>PR: Success
       PR-->>UC: Updated config
       UC-->>API: Updated config
       API-->>Admin: 200 OK

**Шаги:**

1. Администратор отправляет частичные обновления в формате dot notation
2. Use case получает текущую дефолтную конфигурацию
3. Обновления объединяются с текущей конфигурацией (merge)
4. Обновлённая конфигурация сохраняется в БД
5. Все устройства без кастомной конфигурации будут получать обновлённый дефолт

Поток получения списка устройств
---------------------------------

Администратор просматривает список зарегистрированных приставок:

.. mermaid::

   sequenceDiagram
       participant Admin as Администратор/Frontend
       participant API as FastAPI Endpoint
       participant UC as GetDevicesListUseCase
       participant DR as DeviceRepository
       participant DB as PostgreSQL
       
       Admin->>API: GET /api/devices?ip=192.168.1.100&limit=20
       API->>UC: execute(filters)
       
       UC->>DR: get_all(filters)
       DR->>DB: SELECT FROM devices<br/>WHERE ip LIKE ?<br/>LIMIT ? OFFSET ?
       DB-->>DR: List of device records
       DR-->>UC: List[Device]
       
       UC-->>API: Serialized devices list
       API-->>Admin: 200 OK<br/>JSON array

**Шаги:**

1. Администратор/Frontend запрашивает список устройств с фильтрами
2. Use case передаёт фильтры в репозиторий
3. Репозиторий выполняет SQL запрос с WHERE и LIMIT
4. Список устройств возвращается в JSON формате

Преобразование форматов данных
-------------------------------

Dot notation → Hierarchical dict → XML
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Входные данные (dot notation)
   {
       "provision.@reload": "3600",
       "provision.operator.@name": "MyOperator"
   }
   
   # Преобразование через PydashConfigData
   config_data = PydashConfigData(input_dict)
   hierarchical = config_data.to_dict()
   
   # Иерархический dict
   {
       "provision": {
           "@reload": "3600",
           "operator": {
               "@name": "MyOperator"
           }
       }
   }
   
   # Сериализация в XML через xmltodict
   xml_string = xmltodict.unparse(hierarchical)
   
   # XML output
   """
   <?xml version="1.0" encoding="UTF-8"?>
   <provision reload="3600">
       <operator name="MyOperator"/>
   </provision>
   """

Хранение в PostgreSQL
~~~~~~~~~~~~~~~~~~~~~

Конфигурации хранятся в JSON. B поле, в иерархическом формате:

.. code-block:: sql

   SELECT config_data FROM provision_configs WHERE id=1;
   
   -- Результат (JSONB):
   {
     "provision": {
       "@reload": "3600",
       "operator": {
         "@name": "MyOperator"
       }
     }
   }

Это позволяет:

* Выполнять JSON операции в SQL
* Индексировать отдельные поля
* Эффективно хранить вложенные структуры

Кэширование и оптимизация
--------------------------

Возможности для будущей оптимизации
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Кэширование дефолтной конфигурации**

Дефолтная конфигурация меняется редко, её можно кэшировать в памяти:

.. code-block:: python

   from functools import lru_cache
   
   @lru_cache(maxsize=1)
   async def get_cached_default_config():
       return await provision_repo.get_default_config()

**Кэширование XML для устройств**

XML конфигурация для каждого устройства может кэшироваться с TTL:

.. code-block:: python

   # Redis cache
   cache_key = f"device:{mac}:xml"
   xml = redis.get(cache_key)
   if not xml:
       xml = generate_xml(device)
       redis.setex(cache_key, ttl=3600, value=xml)
   return xml

**Пакетная обработка**

При массовых запросах устройств можно оптимизировать через batch loading:

.. code-block:: python

   # Вместо N запросов
   for mac in macs:
       device = await repo.get_by_mac(mac)
   
   # Один запрос
   devices = await repo.get_by_macs(macs)
