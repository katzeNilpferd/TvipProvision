Быстрый старт
=============

Запуск проекта за 5 минут.

Шаг 1: Клонировать репозиторий
-------------------------------

.. code-block:: bash

   git clone https://github.com/katzeNilpferd/TvipProvision.git
   cd TvipProvision

Шаг 2: Запустить через Docker Compose
--------------------------------------

.. code-block:: bash

   # Все сервисы (backend + frontend + database)
   docker-compose --profile frontend up -d

Шаг 3: Проверить работу
------------------------

.. code-block:: bash

   # Backend API docs
   open http://localhost:7373/docs
   
   # Frontend
   open http://localhost:80

Шаг 4: Настроить дефолтную конфигурацию
----------------------------------------

.. code-block:: bash

   curl -X PUT "http://localhost:7373/api/default/config/replace" \
        -H "Content-Type: application/json" \
        -d '{
          "provision.@reload": "86400",
          "provision.operator.@name": "MyOperator"
        }'

Шаг 5: Протестировать provision
--------------------------------

.. code-block:: bash

   curl -H "Mac-Address: 00:11:22:33:44:55" \
        http://localhost:7373/prov/tvip_provision.xml

Готово! Сервис запущен и готов к работе.
