# Сервис Provisioning для TVIP приставок

[English](README.md) | **Русский**

Сервис предоставляет автоматическую выдачу конфигурационных файлов
`tvip_provision.xml` для TVIP-приставок. Он сохраняет устройства в базе
данных, возвращает дефолтные и индивидуальные конфиги. Также
предоставляет ручки REST API и опциональный frontend для администрирования.

## Архитектура

Система состоит из трёх контейнеров:

-   **tvip_provision** --- backend-сервис (Python)
-   **postgres** --- база данных (PostgreSQL)
-   **frontend** *(опционально)* --- веб-интерфейс управления (React)

TVIP‑приставки обращаются по адресу:

    https://tvipupdate.net/prov/tvip_provision.xml

Для работы сервиса необходимо заменить DNS домена `tvipupdate.net` на IP
вашего сервера. После подмены запросы будут перенаправляться на:

    http://<server_ip>:7373/prov/tvip_provision.xml

## Принцип работы

1.  Приставка делает запрос `/prov/tvip_provision.xml`
2.  Backend проверяет, есть ли устройство в базе
3.  Если устройства нет --- оно создаётся и получает дефолтный конфиг
4.  Если есть, возвращается дефолтный/кастомный конфиг
5.  Через API или Frontend можно обновлять дефолтный или индивидуальный
    конфиг

## Диаграмма взаимодействия

``` mermaid
sequenceDiagram
    participant T as TVIP Приставка
    participant P as Provision Service
    participant D as PostgreSQL
    participant F as Frontend

    Note over T: Первое обращение
    T->>P: GET /prov/tvip_provision.xml
    P->>D: Проверка устройства
    D-->>P: Не найдено
    P->>D: Создание записи
    P->>D: Получение дефолтного конфига
    D-->>P: XML конфигурация
    P-->>T: Возврат дефолтного конфига

    Note over T: Последующие запросы
    T->>P: GET /prov/tvip_provision.xml
    P->>D: Поиск конфигурации
    D-->>P: Кастомный/дефолтный конфиг
    P-->>T: Возврат конфига

    Note over F: Администрирование
    F->>P: GET /api/devices
    P-->>F: Список устройств
    F->>P: PUT /api/default/config/replace
    P->>D: Обновление дефолтного конфига
    F->>P: PUT /api/devices/{mac}/config/replace
    P->>D: Обновление конфига устройства
    F->>P: POST /api/devices/{mac}/config/reset
    P->>D: Сброс конфига к дефолту
```

## Запуск

Поднять сразу все сервисы:

1.  Создать `.env` в директории `.frontend/`

    - Переменное окружение можно содать на основе примера,
		либо оставить его пустым.

2.  Развернуть docker-compose, выполнив в корне команду:

    ``` bash
    docker-compose --profile frontend up
    ```

3.  Сервисы будут сразу доступны на стандартных портах указанных в docker-compose.

    - Backend: `http://localhost:7373`
    - Postgres: `http://localhost:5432`
    - Frontend: `http://localhost:80`


При необходимости сервисы можно поднимать раздельно:
 - Только backend: `docker-compose up`,
 - Только frontend: `docker-compose up frontend`
  (Требует обязательного указания адреса backend'а в `.env`),
 - Все: `docker-compose --profile frontend up`

## Проверка

Частично имитируем запрос приставки:

``` bash
curl -H "Mac-Address: 00:11:22:33:44:55" http://127.0.0.1:8000/prov/tvip_provision.xml
```

Изменение базовой конфигурации:

``` bash
curl -X PUT "http://localhost:7373/api/default/config/replace'" \
  -H "Content-Type: application/json" \
  -d '{
    "provision.@reload": "1800",
    "provision.provision_server.@name": "http://new-server.com/",
    "provision.operator.@name": "NEW_OPERATOR"
  }'
```

### Важное уточнение

Установка, либо изменение параметоров конфигурации устройства,
или дефолтной конфигурации производится в `PUT` запросе,
и данные должны быть в формате `dot notation`.

Пример тела запроса:

``` json
{
"provision.@reload": "86400",
"provision.operator.@name": "xxxxx",
"provision.logo.@url": "xxxxxx",
"provision.time.@tz": "Europe/Moscow",
"provision.time.@ntp": "xxxxx",
"provision.features.mediaplayer.@enabled": "true",
"provision.features.dvr.@enabled": "false",
"provision.features.cctv.@enabled": "false",
"provision.features.vod.@enabled": "false",
"provision.tv_stream.@type": "multicast",
"provision.tv_protocols.@default": "stalker",
"provision.tv_protocols.protocol.@type": "stalker",
"provision.tv_protocols.protocol.@server": "xxxxxx",
"provision.preferences.pref_network_config.@value": "DHCP",
"provision.preferences.pref_tv.pref_tv_streamtype.@visible": "false",
"provision.preferences.pref_tv.pref_tv_udpxyaddress.@visible": "false",
"provision.preferences.pref_tv.pref_tv_middleware.@disabled": "true"
}
```
