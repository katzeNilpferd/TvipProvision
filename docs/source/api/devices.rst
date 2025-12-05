Devices Management API
======================

API для управления зарегистрированными TVIP-приставками.

GET /api/devices
----------------

Получить список зарегистрированных устройств с возможностью фильтрации.

**URL:** ``/api/devices``

**Метод:** ``GET``

**Теги:** ``Devices-config``

Query Parameters
~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 20 15 15 50

   * - Параметр
     - Тип
     - Обязательный
     - Описание
   * - ``ip``
     - string
     - Нет
     - Фильтр по IP-адресу (точное совпадение)
   * - ``model``
     - string
     - Нет
     - Фильтр по модели приставки (точное совпадение)
   * - ``last_activity_after``
     - string
     - Нет
     - Фильтр: активность после указанной даты (ISO 8601)
   * - ``last_activity_before``
     - string
     - Нет
     - Фильтр: активность до указанной даты (ISO 8601)
   * - ``sort_by_last_activity``
     - string
     - Нет
     - Сортировка по возрастанию/убыванию (по умолчанию: descending)
   * - ``limit``
     - integer
     - Нет
     - Максимальное количество записей
   * - ``offset``
     - integer
     - Нет
     - Смещение для pagination (по умолчанию: 0)

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Массив объектов устройств

Структура объекта Device:

.. code-block:: json

   [
      {
         "id": "e97df4c1-191e-4c6f-bd6c-837c175763f0",
         "mac_address": "10:27:be:28:e1:65",
         "model": "s530",
         "ip_address": "192.168.1.237",
         "last_activity": "2025-11-29T12:15:42.271447"
      }
   ]

Поля ответа:

* ``id`` — уникальный идентификатор устройства (``UUID``)
* ``mac_address`` — MAC-адрес устройства (уникальный идентификатор)
* ``model`` — модель TVIP-приставки (может быть ``null``)
* ``ip_address`` — последний известный IP-адрес (может быть ``null``)
* ``last_activity`` — время последнего обращения (может быть ``null``)

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

**Получить все устройства:**

.. code-block:: bash

   curl http://localhost:7373/api/devices

**Фильтр по IP-адресу:**

.. code-block:: bash

   curl "http://localhost:7373/api/devices?ip=192.168.1.111"

**Фильтр по модели:**

.. code-block:: bash

   curl "http://localhost:7373/api/devices?model=s530"

**Фильтр по дате последней активности:**

.. code-block:: bash

   curl "http://localhost:7373/api/devices?last_activity_after=2025-01-01T00:00:00"

**Pagination (20 записей, начиная с 40):**

.. code-block:: bash

   curl "http://localhost:7373/api/devices?limit=20&offset=40"

**Комбинированные фильтры:**

.. code-block:: bash

   curl "http://localhost:7373/api/devices?ip=192.168.1.111&model=s530&limit=10"

**Python пример:**

.. code-block:: python

   import requests
   
   params = {
       "model": "s530",
       "limit": 50,
       "offset": 0
   }
   
   response = requests.get("http://localhost:7373/api/devices", params=params)
   devices = response.json()
   
   for device in devices:
       print(f"{device['mac_address']}: {device['ip_address']}")

---

GET /api/devices/{mac_address}/config
--------------------------------------

Получить конфигурацию конкретного устройства по MAC-адресу.

**URL:** ``/api/devices/{mac_address}/config``

**Метод:** ``GET``

**Теги:** ``Devices-config``

Path Parameters
~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Параметр
     - Тип
     - Описание
   * - ``mac_address``
     - string
     - MAC-адрес устройства (формат: ``XX:XX:XX:XX:XX:XX``)

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Объект конфигурации в формате dot notation

Пример ответа:

.. code-block:: json

   {
       "provision.@reload": "86400",
       "provision.operator.@name": "MyOperator",
       "provision.logo.@url": "http://example.com/logo.png",
       "provision.time.@tz": "Europe/Moscow",
       "provision.time.@ntp": "pool.ntp.org",
       "provision.features.mediaplayer.@enabled": "true",
       "provision.features.dvr.@enabled": "false",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://portal.example.com"
   }

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl http://localhost:7373/api/devices/00:11:22:33:44:55/config

**Python пример:**

.. code-block:: python

   import requests
   
   mac = "00:11:22:33:44:55"
   response = requests.get(f"http://localhost:7373/api/devices/{mac}/config")
   config = response.json()
   
   print(f"Reload interval: {config['provision.@reload']}")
   print(f"Operator: {config['provision.operator.@name']}")

Ошибки
~~~~~~

**404 Not Found**

Устройство с указанным MAC-адресом не найдено:

.. code-block:: json

   {
       "detail": "Device not found"
   }

---

PUT /api/devices/{mac_address}/config/update
---------------------------------------------

Частичное обновление конфигурации устройства (merge).

**URL:** ``/api/devices/{mac_address}/config/update``

**Метод:** ``PUT``

**Теги:** ``Devices-config``

Path Parameters
~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Параметр
     - Тип
     - Описание
   * - ``mac_address``
     - string
     - MAC-адрес устройства

Request Body
~~~~~~~~~~~~

**Content-Type:** ``application/json``

Объект с обновлениями в формате dot notation. Будут обновлены только указанные поля, остальные сохранятся.

.. code-block:: json

   {
       "provision.time.@tz": "Europe/London",
       "provision.operator.@name": "NewOperator"
   }

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Обновлённая конфигурация (полная)

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/devices/00:11:22:33:44:55/config/update" \
        -H "Content-Type: application/json" \
        -d '{
          "provision.time.@tz": "Europe/London",
          "provision.operator.@name": "NewOperator"
        }'

**Python пример:**

.. code-block:: python

   import requests
   
   mac = "00:11:22:33:44:55"
   updates = {
       "provision.time.@tz": "Europe/London",
       "provision.features.vod.@enabled": "true"
   }
   
   response = requests.put(
       f"http://localhost:7373/api/devices/{mac}/config/update",
       json=updates
   )
   
   updated_config = response.json()

Ошибки
~~~~~~

**404 Not Found** — устройство не найдено

**422 Unprocessable Entity** — неверный формат данных

---

PUT /api/devices/{mac_address}/config/replace
----------------------------------------------

Полная замена конфигурации устройства.

**URL:** ``/api/devices/{mac_address}/config/replace``

**Метод:** ``PUT``

**Теги:** ``Devices-config``

.. warning::
   Этот endpoint **полностью заменяет** конфигурацию устройства. Все предыдущие настройки будут удалены.

Path Parameters
~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Параметр
     - Тип
     - Описание
   * - ``mac_address``
     - string
     - MAC-адрес устройства

Request Body
~~~~~~~~~~~~

**Content-Type:** ``application/json``

Полная конфигурация в формате dot notation:

.. code-block:: json

   {
       "provision.@reload": "3600",
       "provision.operator.@name": "MyOperator",
       "provision.time.@tz": "Europe/Moscow",
       "provision.time.@ntp": "pool.ntp.org",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://portal.example.com"
   }

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Новая конфигурация

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/devices/00:11:22:33:44:55/config/replace" \
        -H "Content-Type: application/json" \
        -d @new_config.json

**Python пример:**

.. code-block:: python

   import requests
   
   mac = "00:11:22:33:44:55"
   new_config = {
       "provision.@reload": "3600",
       "provision.operator.@name": "CustomOperator",
       "provision.time.@tz": "America/New_York"
   }
   
   response = requests.put(
       f"http://localhost:7373/api/devices/{mac}/config/replace",
       json=new_config
   )

---

POST /api/devices/{mac_address}/config/reset
---------------------------------------------

Сбросить конфигурацию устройства к дефолтной.

**URL:** ``/api/devices/{mac_address}/config/reset``

**Метод:** ``POST``

**Теги:** ``Devices-config``

Path Parameters
~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Параметр
     - Тип
     - Описание
   * - ``mac_address``
     - string
     - MAC-адрес устройства

Request Body
~~~~~~~~~~~~

Не требуется.

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Сообщение об успешном сбросе

.. code-block:: json

   {
       "message": "Device configuration reset to default"
   }

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl -X POST "http://localhost:7373/api/devices/00:11:22:33:44:55/config/reset"

**Python пример:**

.. code-block:: python

   import requests
   
   mac = "00:11:22:33:44:55"
   response = requests.post(
       f"http://localhost:7373/api/devices/{mac}/config/reset"
   )
   
   print(response.json()["message"])

Логика работы
~~~~~~~~~~~~~

После сброса:

1. Кастомная конфигурация устройства удаляется (``custom_config_id`` → ``NULL``)
2. При следующем запросе ``/prov/tvip_provision.xml`` устройство получит дефолтную конфигурацию
3. Метаданные устройства (MAC, IP, модель, время регистрации) сохраняются

---

Автоматическая документация
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Полная автодокументация endpoints:

.. automodule:: presentation.api.endpoints.devices_management
   :members:
   :undoc-members:
   :show-inheritance:
