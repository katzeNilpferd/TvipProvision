Provision API
=============

Endpoint для получения конфигурации TVIP-приставками.

GET /prov/tvip_provision.xml
-----------------------------

Возвращает XML конфигурацию для TVIP-приставки. Этот endpoint вызывается автоматически приставками при загрузке.

**URL:** ``/prov/tvip_provision.xml``

**Метод:** ``GET``

**Теги:** ``Provision.xml``

Headers
~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 20 15 65

   * - Параметр
     - Обязательный
     - Описание
   * - ``Mac-Address``
     - Да
     - MAC-адрес устройства в формате ``XX:XX:XX:XX:XX:XX``
   * - ``tvip-model``
     - Нет
     - Модель TVIP-приставки (например, ``TVIP S-Box v.605``)
   * - ``X-Real-IP``
     - Нет
     - Реальный IP-адрес клиента (устанавливается nginx)

Логика работы
~~~~~~~~~~~~~

1. Извлекается MAC-адрес из заголовка ``Mac-Address``
2. Определяется IP-адрес клиента (приоритет: ``X-Real-IP`` → ``request.client.host``)
3. Проверяется наличие устройства в базе данных

   * **Устройство не найдено**: создаётся новая запись, возвращается дефолтная конфигурация
   * **Устройство существует**: обновляются метаданные (IP, модель, время), возвращается кастомная или дефолтная конфигурация

4. Конфигурация сериализуется в XML и возвращается с ``Content-Type: application/xml``

Response
~~~~~~~~

**Status Code:** ``200 OK``

**Content-Type:** ``application/xml``

**Body:** XML конфигурация

Пример ответа:

.. code-block:: xml

   <?xml version="1.0" encoding="UTF-8"?>
   <provision reload="86400">
       <operator name="MyOperator"/>
       <logo url="http://example.com/logo.png"/>
       <time tz="Europe/Moscow" ntp="pool.ntp.org"/>
       <features>
           <mediaplayer enabled="true"/>
           <dvr enabled="false"/>
           <cctv enabled="false"/>
           <vod enabled="false"/>
       </features>
       <tv_stream type="multicast"/>
       <tv_protocols default="stalker">
           <protocol type="stalker" server="http://portal.example.com"/>
       </tv_protocols>
       <preferences>
           <pref_network_config value="DHCP"/>
           <pref_tv>
               <pref_tv_streamtype visible="false"/>
               <pref_tv_udpxyaddress visible="false"/>
               <pref_tv_middleware disabled="true"/>
           </pref_tv>
       </preferences>
   </provision>

Примеры использования
~~~~~~~~~~~~~~~~~~~~~

**cURL запрос (имитация TVIP-приставки):**

.. code-block:: bash

   curl -H "Mac-Address: 00:11:22:33:44:55" \
        -H "tvip-model: TVIP S-Box v.605" \
        http://localhost:7373/prov/tvip_provision.xml

**Запрос через nginx с X-Real-IP:**

.. code-block:: bash

   curl -H "Mac-Address: 00:11:22:33:44:55" \
        -H "X-Real-IP: 192.168.1.100" \
        http://localhost:7373/prov/tvip_provision.xml

**Python пример:**

.. code-block:: python

   import requests
   
   headers = {
       "Mac-Address": "00:11:22:33:44:55",
       "tvip-model": "TVIP S-Box v.605"
   }
   
   response = requests.get(
       "http://localhost:7373/prov/tvip_provision.xml",
       headers=headers
   )
   
   if response.status_code == 200:
       xml_config = response.text
       print(xml_config)

Ошибки
~~~~~~

**400 Bad Request**

Отсутствует обязательный заголовок ``Mac-Address``:

.. code-block:: json

   {
       "detail": [
           {
               "type": "missing",
               "loc": ["header", "Mac-Address"],
               "msg": "Field required"
           }
       ]
   }

**422 Unprocessable Entity**

Невалидный формат MAC-адреса:

.. code-block:: json

   {
       "detail": "Invalid MAC address format"
   }

Автоматическая документация
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Полная автодокументация endpoint:

.. automodule:: presentation.api.endpoints.provision
   :members:
   :undoc-members:
   :show-inheritance:

Настройка TVIP-приставок
~~~~~~~~~~~~~~~~~~~~~~~~~

Чтобы TVIP-приставки обращались к вашему серверу, необходимо:

1. **Вариант 1: DNS замена**
   
   Настроить DNS сервер для перенаправления ``tvipupdate.net`` на IP вашего сервера.

2. **Вариант 2: Hosts файл**
   
   Если есть доступ к файловой системе приставки, изменить ``/etc/hosts``:
   
   .. code-block:: text
   
      192.168.1.10  tvipupdate.net

3. **Вариант 3: Nginx**
   
   Развернуть через nginx прокси ``tvipupdate.net``.

После настройки приставка будет обращаться на ``https://tvipupdate.net/prov/tvip_provision.xml``, что перенаправится на ваш сервер.

Периодичность обращений
~~~~~~~~~~~~~~~~~~~~~~~

Частота обновления конфигурации определяется параметром ``reload`` в XML (в секундах):

.. code-block:: xml

   <provision reload="86400">
       <!-- 86400 секунд = 24 часа -->
   </provision>

* **3600** — каждый час
* **86400** — раз в сутки
* **1800** — каждые 30 минут

Приставка автоматически запрашивает конфигурацию с указанной периодичностью.

Мониторинг обращений
~~~~~~~~~~~~~~~~~~~~~

Время последнего обращения каждого устройства сохраняется в поле ``last_activity``. 
Это позволяет отслеживать активность приставок через API ``GET /api/devices``.
