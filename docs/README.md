# Документация TVIP Provisioning Service

Эта директория содержит полную документацию проекта на Sphinx.

## Требования

Установить зависимости для документации:

```bash
pip install -r ../requirements.txt
```

Или только зависимости для Sphinx:

```bash
pip install sphinx sphinx-rtd-theme sphinxcontrib-mermaid sphinx-copybutton myst-parser
```

## Сборка документации

### HTML (рекомендуется)

```bash
make html
```

Результат будет в `build/html/index.html`

Открыть в браузере:

```bash
open build/html/index.html  # macOS
xdg-open build/html/index.html  # Linux
start build/html/index.html  # Windows
```

### PDF (требует LaTeX)

```bash
make latexpdf
```

Результат будет в `build/latex/tvipprovisioning.pdf`

### Другие форматы

```bash
make epub      # ePub
make man       # Man pages
make text      # Plain text
```

## Очистка

```bash
make clean
```

## Автоматическая пересборка при изменениях

Установить `sphinx-autobuild`:

```bash
pip install sphinx-autobuild
```

Запустить:

```bash
sphinx-autobuild source build/html
```

Откроется браузер с документацией, которая автоматически обновляется при изменении файлов.

## Структура документации

```
source/
├── index.rst                    # Главная страница
├── overview.rst                 # Обзор системы
├── architecture/                # Архитектура
│   ├── index.rst
│   ├── system-design.rst
│   ├── components.rst
│   └── data-flow.rst
├── api/                         # REST API
│   ├── index.rst
│   ├── provision.rst
│   ├── devices.rst
│   └── default-config.rst
├── domain/                      # Доменный слой
├── application/                 # Прикладной слой
├── infrastructure/              # Инфраструктурный слой
├── deployment/                  # Развертывание
├── integration/                 # Интеграция с TVIP
├── frontend/                    # Frontend
└── developer-guide/             # Руководство разработчика
```

## Конфигурация

Основные настройки в `source/conf.py`:

- Язык: русский
- Тема: Read the Docs
- Расширения: autodoc, napoleon, mermaid, copybutton, myst_parser
- Автодокументация из Python docstrings

## Автодокументация

Документация автоматически генерируется из docstrings Python кода. 
Используется формат Google Style Docstrings.

Пример:

```python
def my_function(param1: str, param2: int) -> bool:
    """
    Краткое описание функции.
    
    Подробное описание функции с объяснением логики работы.
    
    Args:
        param1: Описание первого параметра
        param2: Описание второго параметра
    
    Returns:
        Описание возвращаемого значения
    
    Raises:
        ValueError: Когда возникает эта ошибка
    
    Example:
        >>> my_function("test", 42)
        True
    """
    return True
```

## Публикация

### GitHub Pages (не используется)

```bash
# Собрать документацию
make html

# Скопировать в ветку gh-pages
git checkout gh-pages
cp -r build/html/* .
git add .
git commit -m "Update documentation"
git push origin gh-pages
```

### Read the Docs

1. Подключить репозиторий на https://readthedocs.org
2. RTD автоматически соберёт документацию из `docs/` на основе `.readthedocs.yaml`
3. Документация будет доступна на `https://<project>.readthedocs.io`

## Проверка ссылок

```bash
make linkcheck
```

## Помощь

Список всех доступных команд:

```bash
make help
```

## Лицензия

См. LICENSE файл в корне проекта.
