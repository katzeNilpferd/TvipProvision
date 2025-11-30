Default Configuration API
==========================

API для управления дефолтной конфигурацией, которая применяется ко всем устройствам без кастомных настроек.

GET /api/default/config
-----------------------

Получить текущую дефолтную конфигурацию.

**URL:** ``/api/default/config``

**Метод:** ``GET``

**Теги:** ``Default-config``

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Объект конфигурации в формате dot notation

Пример ответа:

.. code-block:: json

   {
       "provision.@reload": "86400",
       "provision.operator.@name": "DefaultOperator",
       "provision.logo.@url": "http://example.com/default_logo.png",
       "provision.time.@tz": "Europe/Moscow",
       "provision.time.@ntp": "pool.ntp.org",
       "provision.features.mediaplayer.@enabled": "true",
       "provision.features.dvr.@enabled": "false",
       "provision.features.cctv.@enabled": "false",
       "provision.features.vod.@enabled": "false",
       "provision.tv_stream.@type": "multicast",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://default-portal.example.com",
       "provision.preferences.pref_network_config.@value": "DHCP",
       "provision.preferences.pref_tv.pref_tv_streamtype.@visible": "false",
       "provision.preferences.pref_tv.pref_tv_udpxyaddress.@visible": "false",
       "provision.preferences.pref_tv.pref_tv_middleware.@disabled": "true"
   }

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl http://localhost:7373/api/default/config

**Python пример:**

.. code-block:: python

   import requests
   
   response = requests.get("http://localhost:7373/api/default/config")
   default_config = response.json()
   
   print(f"Default reload interval: {default_config['provision.@reload']}")
   print(f"Default operator: {default_config['provision.operator.@name']}")

**JavaScript (Frontend) пример:**

.. code-block:: javascript

   const response = await fetch('http://localhost:7373/api/default/config');
   const config = await response.json();
   
   console.log('Default timezone:', config['provision.time.@tz']);

---

PUT /api/default/config/update
-------------------------------

Частичное обновление дефолтной конфигурации (merge с существующей).

**URL:** ``/api/default/config/update``

**Метод:** ``PUT``

**Теги:** ``Default-config``

Request Body
~~~~~~~~~~~~

**Content-Type:** ``application/json``

Объект с обновлениями в формате dot notation. Обновляются только указанные поля, остальные сохраняются.

.. code-block:: json

   {
       "provision.@reload": "3600",
       "provision.time.@tz": "Europe/London",
       "provision.operator.@name": "NewDefaultOperator"
   }

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Обновлённая дефолтная конфигурация (полная)

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

**Изменить интервал обновления:**

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/default/config/update" \
        -H "Content-Type: application/json" \
        -d '{
          "provision.@reload": "3600"
        }'

**Изменить часовой пояс и сервер NTP:**

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/default/config/update" \
        -H "Content-Type: application/json" \
        -d '{
          "provision.time.@tz": "America/New_York",
          "provision.time.@ntp": "time.google.com"
        }'

**Изменить сервер портала:**

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/default/config/update" \
        -H "Content-Type: application/json" \
        -d '{
          "provision.tv_protocols.protocol.@server": "http://new-portal.example.com"
        }'

**Python пример:**

.. code-block:: python

   import requests
   
   updates = {
       "provision.@reload": "7200",
       "provision.operator.@name": "MyCompany",
       "provision.logo.@url": "http://mycompany.com/logo.png"
   }
   
   response = requests.put(
       "http://localhost:7373/api/default/config/update",
       json=updates
   )
   
   updated_config = response.json()
   print(f"Updated reload: {updated_config['provision.@reload']}")

**JavaScript (Frontend) пример:**

.. code-block:: javascript

   const updates = {
       'provision.time.@tz': 'Europe/Berlin',
       'provision.features.vod.@enabled': 'true'
   };
   
   const response = await fetch('http://localhost:7373/api/default/config/update', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(updates)
   });
   
   const updatedConfig = await response.json();

Влияние на устройства
~~~~~~~~~~~~~~~~~~~~~

После обновления дефолтной конфигурации:

* **Устройства без кастомной конфигурации** немедленно начнут получать новые параметры при следующем запросе
* **Устройства с кастомной конфигурацией** продолжат использовать свои индивидуальные настройки
* Изменения применяются без перезагрузки сервиса


PUT /api/default/config/replace
--------------------------------

Полная замена дефолтной конфигурации.

**URL:** ``/api/default/config/replace``

**Метод:** ``PUT``

**Теги:** ``Default-config``

.. warning::
   Этот endpoint **полностью заменяет** дефолтную конфигурацию. Все предыдущие настройки будут удалены и заменены на новые.

Request Body
~~~~~~~~~~~~

**Content-Type:** ``application/json``

Полная новая конфигурация в формате dot notation:

.. code-block:: json

   {
       "provision.@reload": "86400",
       "provision.operator.@name": "NewOperator",
       "provision.logo.@url": "http://newcompany.com/logo.png",
       "provision.time.@tz": "Europe/Moscow",
       "provision.time.@ntp": "pool.ntp.org",
       "provision.features.mediaplayer.@enabled": "true",
       "provision.features.dvr.@enabled": "false",
       "provision.features.cctv.@enabled": "false",
       "provision.features.vod.@enabled": "true",
       "provision.tv_stream.@type": "unicast",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://newportal.example.com",
       "provision.preferences.pref_network_config.@value": "DHCP"
   }

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/json``

**Body:** Новая дефолтная конфигурация

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/default/config/replace" \
        -H "Content-Type: application/json" \
        -d @complete_default_config.json

**Python пример с загрузкой из файла:**

.. code-block:: python

   import requests
   import json
   
   # Загрузить конфигурацию из файла
   with open('new_default_config.json', 'r') as f:
       new_config = json.load(f)
   
   response = requests.put(
       "http://localhost:7373/api/default/config/replace",
       json=new_config
   )
   
   if response.status_code == 200:
       print("Default configuration replaced successfully")
   else:
       print(f"Error: {response.status_code}")

**Python пример с созданием конфигурации:**

.. code-block:: python

   import requests
   
   new_default = {
       "provision.@reload": "86400",
       "provision.operator.@name": "MyISP",
       "provision.time.@tz": "Europe/Moscow",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://iptv.myisp.com"
   }
   
   response = requests.put(
       "http://localhost:7373/api/default/config/replace",
       json=new_default
   )
   
   replaced_config = response.json()

Рекомендации
~~~~~~~~~~~~

**Когда использовать update vs replace:**

* **update** — когда нужно изменить несколько конкретных параметров, сохранив остальные
* **replace** — когда нужна полная переконфигурация или миграция на новую схему

**Backup перед заменой:**

Перед полной заменой рекомендуется сохранить текущую конфигурацию:

.. code-block:: python

   import requests
   import json
   from datetime import datetime
   
   # Получить текущую конфигурацию
   response = requests.get("http://localhost:7373/api/default/config")
   current_config = response.json()
   
   # Сохранить в файл с timestamp
   timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
   filename = f"backup_default_config_{timestamp}.json"
   
   with open(filename, 'w') as f:
       json.dump(current_config, f, indent=2)
   
   print(f"Backup saved to {filename}")
   
   # Теперь можно безопасно заменить
   # ...

Валидация конфигурации
~~~~~~~~~~~~~~~~~~~~~~

Базовая валидация формата:

.. code-block:: python

   def validate_config(config):
       """Проверка базовых требований к конфигурации"""
       required_keys = [
           "provision.@reload",
           "provision.operator.@name",
           "provision.tv_protocols.@default"
       ]
       
       for key in required_keys:
           if key not in config:
               raise ValueError(f"Missing required key: {key}")
       
       # Проверка reload
       reload_value = int(config["provision.@reload"])
       if reload_value < 60 or reload_value > 86400:
           raise ValueError("Reload must be between 60 and 86400 seconds")
       
       return True
   
   # Использование
   try:
       validate_config(new_config)
       # Отправить на сервер
   except ValueError as e:
       print(f"Configuration error: {e}")

---

Автоматическая документация
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Полная автодокументация endpoints:

.. automodule:: presentation.api.endpoints.default_config_management
   :members:
   :undoc-members:
   :show-inheritance:

Формат конфигурации
-------------------

Dot notation
~~~~~~~~~~~~

Конфигурации используют формат **dot notation** для представления иерархической XML структуры в плоском виде.

Правила:

* Точка (``.``) разделяет уровни вложенности
* Префикс ``@`` обозначает атрибут XML элемента
* Элементы без ``@`` — это вложенные теги

Пример преобразования:

**Dot notation:**

.. code-block:: json

   {
       "provision.operator.@name": "MyOperator",
       "provision.time.@tz": "Europe/Moscow"
   }

**Эквивалентный XML:**

.. code-block:: xml

   <provision>
       <operator name="MyOperator"/>
       <time tz="Europe/Moscow"/>
   </provision>

**Сложный пример:**

.. code-block:: json

   {
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://portal.com"
   }

**XML:**

.. code-block:: xml

   <provision>
       <tv_protocols default="stalker">
           <protocol type="stalker" server="http://portal.com"/>
       </tv_protocols>
   </provision>

Типичные параметры
~~~~~~~~~~~~~~~~~~

**Базовые параметры:**

* ``provision.@reload`` — интервал обновления в секундах (3600, 86400)
* ``provision.operator.@name`` — название оператора

**Время и локализация:**

* ``provision.time.@tz`` — часовой пояс (Europe/Moscow, America/New_York)
* ``provision.time.@ntp`` — NTP сервер (pool.ntp.org, time.google.com)

**Функции:**

* ``provision.features.mediaplayer.@enabled`` — медиаплеер (true/false)
* ``provision.features.dvr.@enabled`` — DVR (true/false)
* ``provision.features.vod.@enabled`` — VoD (true/false)
* ``provision.features.cctv.@enabled`` — CCTV (true/false)

**TV протоколы:**

* ``provision.tv_protocols.@default`` — дефолтный протокол (stalker, ministra)
* ``provision.tv_protocols.protocol.@type`` — тип протокола
* ``provision.tv_protocols.protocol.@server`` — URL портала

**Сеть:**

* ``provision.preferences.pref_network_config.@value`` — DHCP или Static

**UI настройки:**

* ``provision.preferences.pref_tv.pref_tv_streamtype.@visible`` — видимость настройки
* ``provision.preferences.pref_tv.pref_tv_middleware.@disabled`` — отключение опции
