# dobropalm.tech

[![Проверки сайта](https://github.com/kevinscott66/kevinscott66.github.io/actions/workflows/site-checks.yml/badge.svg)](https://github.com/kevinscott66/kevinscott66.github.io/actions/workflows/site-checks.yml) · [MIT](LICENSE) · [English](README.md)

Портфолио Александра Павловича: AI-помощники, приложения, сервисы и инженерные кейсы.

**[Сайт на русском](https://dobropalm.tech/ru/)** · [English](https://dobropalm.tech) · [GitHub-профиль](https://github.com/kevinscott66)

## Содержание

- Главная и три кейса на русском и английском: Agent, AirChat, KOM17.
- Скриншоты продуктов, два видео с субтитрами и архитектурные схемы.
- PDF-профиль на двух языках, ссылки на исходники и ограничения проектов.

Видео Agent показывает настоящий интерфейс с подписанными демонстрационными данными и отключённым выполнением действий. Видео DeLabs записано на публичном сайте. Мобильные скриншоты предоставлены автором и одобрены им для публикации.

## Локальный запуск

```bash
git clone https://github.com/kevinscott66/kevinscott66.github.io.git
cd kevinscott66.github.io
python3 tools/check_site.py
python3 -m http.server 8000 --bind 127.0.0.1
# Открыть http://127.0.0.1:8000/ru/
```

Сборка, фреймворк, установка пакетов и JavaScript в браузере не нужны. Для шрифтов Google Fonts предусмотрены системные замены.

## Редактирование

Страницы лежат в `index.html`, `ru/index.html`, `case-studies/` и `ru/case-studies/`. Общие стили — `assets/site.css`, медиа — `assets/media/`, PDF и Open Graph — `assets/`.

После изменения CSS:

```bash
python3 tools/sync_assets.py
python3 tools/check_site.py
python3 tools/test_site.py
```

Первая команда обновляет версию CSS во всех страницах, чтобы браузер не использовал старую вёрстку из кеша. Для мобильных скриншотов используйте `class="portrait"` и исходные атрибуты ширины/высоты. Сохраняйте соответствие языковых версий, ссылок переключения языка и подписей к медиа.

## Публикация

GitHub Pages публикует ветку `main`. Перед публикацией выполните проверки, проверьте страницы на компьютере и телефоне. После публикации проверьте GitHub Actions, публичные страницы и загрузку медиа.

[Архитектура и правила контента](docs/architecture.md) · [Изменения](CHANGELOG.md) · [Безопасность](SECURITY.md)

Даты проектов не являются датами трудоустройства. Часть репозиториев — публичные снимки исходников. Релизы портфолио относятся к сайту, а не к готовности представленных приложений.

## Лицензия

MIT — [LICENSE](LICENSE). У представленных проектов собственные лицензии. Права на сторонние товарные знаки сохраняются за их владельцами.
