SHELL := /bin/bash

SSH_HOST   ?= revelio
REMOTE_DIR ?= /home/web/revelio-sellerdata
BACKUP_DIR ?= /root/revelio-sellerdata-deploy-backups
SITE_URL   ?= https://eurekaecom.revelio.tech

.PHONY: test sync smoke deploy deploy-no-backup

test:
	node --test tests/*.test.cjs

sync:
	ssh $(SSH_HOST) 'mkdir -p "$(REMOTE_DIR)"'
	rsync -avz --delete --exclude-from=.deployignore ./ $(SSH_HOST):$(REMOTE_DIR)/

smoke:
	curl -fsS -o /dev/null $(SITE_URL)/
	curl -fsS -o /dev/null $(SITE_URL)/css/main.css
	curl -fsS -o /dev/null $(SITE_URL)/js/main.js
	@echo ">> Smoke check passed: $(SITE_URL)/"

deploy: test
	@echo ">> Saving remote snapshot outside /home/web…"
	ssh $(SSH_HOST) 'set -eu; mkdir -p "$(BACKUP_DIR)"; if [ -d "$(REMOTE_DIR)" ]; then snapshot="$(BACKUP_DIR)/$$(date +%Y%m%d-%H%M%S)"; cp -a "$(REMOTE_DIR)" "$$snapshot"; echo ">> Snapshot: $$snapshot"; fi'
	$(MAKE) sync
	$(MAKE) smoke

deploy-no-backup: test
	$(MAKE) sync
	$(MAKE) smoke
