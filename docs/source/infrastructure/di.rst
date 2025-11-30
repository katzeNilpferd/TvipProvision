Dependency Injection
====================

Конфигурация DI для FastAPI.

.. automodule:: infrastructure.di.injection
   :members:
   :undoc-members:
   :show-inheritance:

Провайдеры
----------

Модуль содержит функции-провайдеры для всех use cases и зависимостей.

**Примеры:**

* ``get_device_repository()`` — провайдер репозитория устройств
* ``get_provision_repository()`` — провайдер репозитория конфигураций
* ``get_handle_provision_use_case()`` — провайдер use case
