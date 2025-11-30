Интеграция с TVIP
==================

Настройка TVIP-приставок для работы с provisioning сервером.

Подмена DNS
-----------

TVIP-приставки обращаются на ``tvipupdate.net``. Необходимо перенаправить этот домен на ваш сервер.

**Вариант 1: Локальный DNS сервер**

Настроить DNS сервер (например, dnsmasq):

.. code-block:: text

   # /etc/dnsmasq.conf
   address=/tvipupdate.net/192.168.1.10

**Вариант 2: Hosts файл на приставке**

Если есть доступ к файловой системе приставки:

.. code-block:: text

   # /etc/hosts
   192.168.1.10  tvipupdate.net

**Вариант 3: Роутер с кастомной прошивкой**

На роутерах с OpenWRT/DD-WRT добавить DNS override.

Формат конфигурации
-------------------

Полное описание формата dot notation и XML см. в :doc:`../api/default-config`.

Примеры конфигураций
--------------------

Базовая конфигурация
~~~~~~~~~~~~~~~~~~~~

.. code-block:: json

   {
       "provision.@reload": "86400",
       "provision.operator.@name": "MyISP",
       "provision.time.@tz": "Europe/Moscow",
       "provision.tv_protocols.@default": "stalker",
       "provision.tv_protocols.protocol.@type": "stalker",
       "provision.tv_protocols.protocol.@server": "http://portal.myisp.com"
   }

Конфигурация с VOD
~~~~~~~~~~~~~~~~~~

.. code-block:: json

   {
       "provision.features.vod.@enabled": "true",
       "provision.features.mediaplayer.@enabled": "true"
   }
