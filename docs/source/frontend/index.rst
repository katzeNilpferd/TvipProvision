Frontend
========

React веб-интерфейс для управления.

Компоненты
----------

**Layout**
  Общий layout с навигацией и темой

**DevicesList**
  Список устройств с фильтрацией и поиском

**DeviceConfig**
  Редактирование конфигурации конкретного устройства

**DefaultConfig**
  Управление дефолтной конфигурацией

API клиент
----------

Модуль ``services/api.js`` предоставляет функции для взаимодействия с backend:

* ``getDevices(params)`` — список устройств
* ``getDeviceConfig(mac)`` — конфигурация устройства
* ``replaceDeviceConfig(mac, config)`` — замена конфигурации
* ``resetDeviceConfig(mac)`` — сброс к дефолту
* ``getDefaultConfig()`` — дефолтная конфигурация
* ``replaceDefaultConfig(config)`` — замена дефолта

Развертывание
-------------

Development
~~~~~~~~~~~

.. code-block:: bash

   cd frontend
   npm install
   npm run dev

Production
~~~~~~~~~~

.. code-block:: bash

   cd frontend
   docker-compose up frontend -d
