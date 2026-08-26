# sellerdata

Статический landing page для [eurekaecom.revelio.tech](https://eurekaecom.revelio.tech/).

## Структура

- `index.html`, `css/`, `js/`, `assets/` — содержимое публичного web-root;
- `tests/` — проверка локальных ссылок на статические ресурсы;
- `Makefile` — тестирование и раскатка на сервер;
- `.github/workflows/deploy.yml` — автоматическая раскатка каждого push в `main`.

## Команды

```bash
make test
make smoke
make deploy
```

`make deploy` проверяет сайт, сохраняет snapshot текущего web-root в
`/root/revelio-sellerdata-deploy-backups/<timestamp>`, синхронизирует публичные
файлы с `/home/web/revelio-sellerdata/` через `rsync --delete` и проверяет
публичные URL.

Для раскатки без snapshot:

```bash
make deploy-no-backup
```

## Автоматическая раскатка

Workflow запускается после каждого push в `main`. Для подключения к серверу
нужен GitHub Actions repository secret `DEPLOY_SSH_KEY`, содержащий приватный
SSH-ключ раскатки целиком.
