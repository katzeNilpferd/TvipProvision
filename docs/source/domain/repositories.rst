Repositories
============

Интерфейсы репозиториев для доступа к данным.

DeviceRepository
----------------

.. automodule:: domain.repositories.device_repository
   :members:
   :undoc-members:
   :show-inheritance:

Интерфейс для работы с устройствами.

**Методы:**

* ``get_by_mac`` — получить устройство по MAC-адресу
* ``get_by_filters`` — получить список устройств с фильтрацией
* ``update_last_activity`` — обновить время последней активности устройства
* ``save`` — сохранить/изменить устройство
* ``delete`` — удалить устройство

ProvisionRepository
-------------------

.. automodule:: domain.repositories.provision_repository
   :members:
   :undoc-members:
   :show-inheritance:

Интерфейс для работы с конфигурациями.

**Методы:**

* ``get_by_id`` — получить конфигурацию по ID
* ``get_by_device`` — получить конфигурацию по устройству
* ``get_default_config`` — получить дефолтную конфигурацию
* ``save`` — сохранить/изменить конфигурацию
* ``delete`` — удалить конфигурацию
