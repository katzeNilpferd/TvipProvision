Entities (Сущности)
====================

Доменные сущности системы.

Device
------

.. automodule:: domain.entities.device
   :members:
   :undoc-members:
   :show-inheritance:

Представляет TVIP-приставку в системе.

**Атрибуты:**

* ``id`` — уникальный идентификатор
* ``mac_address`` — уникальный MAC-адрес
* ``ip_address`` — IP-адрес устройства
* ``model`` — модель приставки
* ``config_id`` — ID кастомной конфигурации
* ``last_activity`` — время последнего обращения

ProvisionConfig
---------------

.. automodule:: domain.entities.provision_config
   :members:
   :undoc-members:
   :show-inheritance:

Представляет конфигурацию (дефолтную или кастомную).

**Атрибуты:**

* ``id`` — уникальный идентификатор
* ``config_type`` — тип конфигурации (DEFAULT/CUSTOM)
* ``config_data`` — данные конфигурации
* ``description`` — описание конфигурации
