# Спецификация формата module.json

## Обзор

Файл `module.json` содержит всю необходимую информацию об образовательном модуле платформы ИНФОТЕКА. Каждый репозиторий `mod_*` должен содержать этот файл в корневой директории.

## Структура файла

### Основные разделы:

1. **Базовая информация**: `schema_version`, `name`, `title`, `description`, `version`, `type`
2. **Конфигурация развертывания**: `deployment`
3. **Настройки Hugo**: `hugo_config`
4. **Метаданные**: `metadata`
5. **URL-адреса**: `urls`
6. **Статус**: `status`

## Детальное описание полей

### Базовая информация

#### `schema_version` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"1.0"`
- **Описание**: Версия схемы module.json

#### `name` (обязательно)
- **Тип**: string
- **Формат**: kebab-case (только строчные буквы, цифры и дефисы)
- **Длина**: 2-50 символов
- **Пример**: `"linux-base"`
- **Описание**: Уникальный идентификатор модуля

#### `title` (обязательно)
- **Тип**: string
- **Длина**: 5-100 символов
- **Пример**: `"Основы Linux"`
- **Описание**: Человекочитаемое название модуля

#### `description` (обязательно)
- **Тип**: string
- **Длина**: 20-500 символов
- **Пример**: `"Полный курс для начинающих пользователей Linux"`
- **Описание**: Подробное описание модуля

#### `version` (обязательно)
- **Тип**: string
- **Формат**: Semantic Versioning (semver)
- **Пример**: `"1.0.0"`
- **Описание**: Версия модуля

#### `type` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"educational"`, `"academic"`, `"corporate"`, `"documentation"`, `"tutorial"`
- **Пример**: `"educational"`
- **Описание**: Тип образовательного модуля

### Конфигурация развертывания (deployment)

#### `subdomain` (обязательно)
- **Тип**: string
- **Формат**: kebab-case
- **Длина**: 2-50 символов
- **Пример**: `"linux-base"`
- **Описание**: Поддомен для развертывания (linux-base.infotecha.ru)

#### `repository` (обязательно)
- **Тип**: string
- **Формат**: `mod_` + snake_case
- **Пример**: `"mod_linux_base"`
- **Описание**: Имя GitHub репозитория

#### `build_system` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"hugo-base"`, `"hugo-templates"`
- **Пример**: `"hugo-base"`
- **Описание**: Система сборки модуля

### Настройки Hugo (hugo_config)

#### `template` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"default"`, `"minimal"`, `"academic"`, `"enterprise"`
- **Пример**: `"default"`
- **Описание**: Шаблон Hugo для использования

#### `theme` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"compose"`, `"academic"`, `"corporate"`
- **Пример**: `"compose"`
- **Описание**: Тема Hugo

#### `components` (обязательно)
- **Тип**: array of strings
- **Допустимые значения элементов**: `"quiz-engine"`, `"analytics"`, `"auth"`, `"citations"`, `"terminal"`
- **Пример**: `["quiz-engine"]`
- **Описание**: Список компонентов для включения

#### `hugo_version` (обязательно)
- **Тип**: string
- **Формат**: X.Y.Z
- **Пример**: `"0.148.0"`
- **Описание**: Требуемая версия Hugo

### Метаданные (metadata)

#### `author` (обязательно)
- **Тип**: string
- **Длина**: 2-100 символов
- **Пример**: `"InfoTech.io Team"`
- **Описание**: Автор или организация

#### `maintainer` (опционально)
- **Тип**: string
- **Пример**: `"info-tech-io"`
- **Описание**: Текущий сопровождающий

#### `license` (опционально)
- **Тип**: string
- **Допустимые значения**: `"MIT"`, `"Apache-2.0"`, `"GPL-3.0"`, `"BSD-3-Clause"`, `"CC-BY-4.0"`, `"CC-BY-SA-4.0"`
- **Пример**: `"MIT"`

#### `difficulty` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"`
- **Пример**: `"beginner"`
- **Описание**: Уровень сложности

#### `estimated_time` (обязательно)
- **Тип**: string
- **Формат**: "N час/часов/день/дней/неделя/недель"
- **Пример**: `"40 hours"`
- **Описание**: Оценочное время изучения

#### `language` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"ru"`, `"en"`, `"es"`, `"fr"`, `"de"`, `"zh"`
- **Пример**: `"ru"`
- **Описание**: Основной язык модуля

#### `tags` (обязательно)
- **Тип**: array of strings
- **Количество**: 1-10 тегов
- **Формат тега**: kebab-case, 2-30 символов
- **Пример**: `["linux", "command-line", "system-administration"]`
- **Описание**: Описательные теги

### URL-адреса (urls)

#### `production` (обязательно)
- **Тип**: string (URI)
- **Формат**: https://subdomain.infotecha.ru
- **Пример**: `"https://linux-base.infotecha.ru"`
- **Описание**: URL в production

#### `repository` (обязательно)
- **Тип**: string (URI)
- **Формат**: https://github.com/info-tech-io/mod_*
- **Пример**: `"https://github.com/info-tech-io/mod_linux_base"`
- **Описание**: URL GitHub репозитория

#### `issues` (опционально)
- **Тип**: string (URI)
- **Описание**: URL трекера задач

#### `documentation` (опционально)
- **Тип**: string (URI)
- **Описание**: URL документации

### Статус (status)

#### `lifecycle` (обязательно)
- **Тип**: string
- **Допустимые значения**: `"development"`, `"beta"`, `"stable"`, `"maintenance"`, `"deprecated"`
- **Пример**: `"stable"`
- **Описание**: Стадия жизненного цикла

#### `last_updated` (обязательно)
- **Тип**: string (date)
- **Формат**: YYYY-MM-DD
- **Пример**: `"2025-09-20"`
- **Описание**: Дата последнего обновления

#### `content_complete` (опционально)
- **Тип**: boolean
- **Описание**: Завершена ли разработка контента

#### `testing_complete` (опционально)
- **Тип**: boolean
- **Описание**: Завершено ли тестирование

#### `review_complete` (опционально)
- **Тип**: boolean
- **Описание**: Завершен ли процесс ревью

## Пример полного файла

```json
{
  "schema_version": "1.0",
  "name": "linux-base",
  "title": "Основы Linux",
  "description": "Полный курс для начинающих пользователей Linux",
  "version": "1.0.0",
  "type": "educational",

  "deployment": {
    "subdomain": "linux-base",
    "repository": "mod_linux_base",
    "build_system": "hugo-base"
  },

  "hugo_config": {
    "template": "default",
    "theme": "compose",
    "components": ["quiz-engine"],
    "hugo_version": "0.148.0"
  },

  "metadata": {
    "author": "InfoTech.io Team",
    "maintainer": "info-tech-io",
    "license": "MIT",
    "difficulty": "beginner",
    "estimated_time": "40 hours",
    "language": "ru",
    "tags": ["linux", "command-line", "system-administration"]
  },

  "urls": {
    "production": "https://linux-base.infotecha.ru",
    "repository": "https://github.com/info-tech-io/mod_linux_base",
    "issues": "https://github.com/info-tech-io/mod_linux_base/issues"
  },

  "status": {
    "lifecycle": "stable",
    "last_updated": "2025-09-20",
    "content_complete": true,
    "testing_complete": true,
    "review_complete": true
  }
}
```

## Валидация

Для валидации module.json используйте:

```bash
# Из репозитория infotecha
node scripts/validate-module.js path/to/module.json

# Валидация удаленного модуля
node scripts/validate-module.js --url https://raw.githubusercontent.com/info-tech-io/mod_linux_base/main/module.json
```

## Миграция с центрального modules.json

При миграции с центрального `modules.json` используйте следующее соответствие полей:

| Центральный modules.json | module.json |
|-------------------------|-------------|
| `name` | `name` |
| `title` | `title` |
| `description` | `description` |
| `subdomain` | `deployment.subdomain` |
| `repository` | `deployment.repository` |
| `url` | `urls.production` |

## Обработка ошибок

### Типичные ошибки валидации:

1. **Неверный формат name**: Используйте только строчные буквы, цифры и дефисы
2. **Несоответствие subdomain и name**: Обычно должны совпадать
3. **Неверная версия Hugo**: Используйте формат X.Y.Z
4. **Пустой массив components**: Укажите хотя бы один компонент или пустой массив
5. **Неверная дата**: Используйте формат YYYY-MM-DD

### Предупреждения:

1. **Отсутствие license**: Рекомендуется указать лицензию
2. **Старая версия Hugo**: Рекомендуется использовать актуальную версию
3. **Слишком мало тегов**: Рекомендуется 3-5 тегов для лучшей категоризации

## Автоматизация

Файл `module.json` автоматически обрабатывается системой:

1. **При изменении**: Автоматическая валидация и обновление каталога
2. **При создании**: Автоматическая регистрация нового модуля
3. **При ошибках**: Уведомления в GitHub Issues

Это обеспечивает актуальность и консистентность информации о всех модулях платформы.