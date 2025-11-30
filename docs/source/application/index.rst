Прикладной слой
===============

Use Cases — сценарии использования системы.

.. toctree::
   :maxdepth: 2

   use-cases

Обзор
-----

Прикладной слой содержит бизнес-логику в виде use cases, которые оркеструют работу доменных объектов.

Use Cases
---------

**Provision**

.. automodule:: application.use_cases.tvip_provision.handle_provision_request
   :members:
   :undoc-members:
   :show-inheritance:

**Device Management**

.. automodule:: application.use_cases.devices_management.get_devices_list
   :members:
   :undoc-members:

.. automodule:: application.use_cases.devices_management.get_device_config
   :members:
   :undoc-members:

.. automodule:: application.use_cases.devices_management.update_device_config
   :members:
   :undoc-members:

.. automodule:: application.use_cases.devices_management.replace_device_config
   :members:
   :undoc-members:

.. automodule:: application.use_cases.devices_management.reset_device_config
   :members:
   :undoc-members:

**Default Config Management**

.. automodule:: application.use_cases.default_config_management.get_default_config
   :members:
   :undoc-members:

.. automodule:: application.use_cases.default_config_management.update_default_config
   :members:
   :undoc-members:

.. automodule:: application.use_cases.default_config_management.replace_default_config
   :members:
   :undoc-members:
