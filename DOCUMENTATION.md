# Документация

Проект имеет полную документацию на Sphinx с автогенерацией из кода.

## Быстрый просмотр

Собранная HTML документация находится в `docs/build/html/`

Открыть:
```bash
open docs/build/html/index.html
```

## Сборка документации

```bash
cd docs
make html
```

Подробная инструкция: [docs/README.md](docs/README.md)

## Содержание документации

- **Обзор системы** — архитектура, принципы работы
- **API Reference** — полная документация REST API
- **Доменный слой** — сущности, value objects, репозитории
- **Прикладной слой** — use cases
- **Инфраструктурный слой** — БД, DI, сериализаторы
- **Развертывание** — Docker, конфигурация, мониторинг
- **Интеграция с TVIP** — настройка приставок
- **Frontend** — React компоненты
- **Руководство разработчика** — быстрый старт, contributing

## Online документация

Документация доступна онлайн (если настроено):
- Swagger UI: http://localhost:7373/docs
- ReDoc: http://localhost:7373/redoc
- Sphinx: [\[ссылка на Read the Docs\]](https://tvipprovision.readthedocs.io/ru/latest/)
