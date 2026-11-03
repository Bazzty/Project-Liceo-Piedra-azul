.PHONY: env up setup down ps logs psql shell reset-db test-db test test-api test-web fresh

# Los archivos que crea el contenedor quedan a nombre de tu usuario.
export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

env:
	@test -f .env || (cp .env.example .env && echo "Creado .env desde .env.example")
	@test -f backend/.env || (cp backend/.env.example backend/.env && echo "Creado backend/.env desde backend/.env.example")

up: env
	docker compose up -d --wait --build

# Primera vez: construye la imagen, instala las dependencias de PHP, genera la clave y crea las tablas.
setup: env
	docker compose build
	docker compose run --rm --user www-data app composer install
	docker compose run --rm --user www-data app sh -c "grep -q '^APP_KEY=base64' .env || php artisan key:generate"
	$(MAKE) up
	docker compose exec --user www-data app php artisan migrate --force

down:
	docker compose down

ps:
	docker compose ps

# make logs (todos) o make logs s=worker (uno solo)
logs:
	docker compose logs -f $(s)

psql: env
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

# Terminal dentro del contenedor de PHP: php artisan ..., composer ...
shell: env
	docker compose exec --user www-data app bash

# Base aparte para los tests del backend (se vacía en cada corrida). No hace nada si ya existe.
test-db: up
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -lqt | cut -d"|" -f1 | grep -qw "$${POSTGRES_DB}_test" || createdb -U "$$POSTGRES_USER" "$${POSTGRES_DB}_test"'

# Todos los tests: backend (en la base _test, nunca en la de desarrollo) y frontend.
test: test-api test-web

test-api: test-db
	docker compose exec --user www-data app php artisan test

test-web: up
	docker compose exec vite npm test

# Borra y recrea todas las tablas de desarrollo: se pierden los datos locales. Los seeders llegan con PLPA-56.
fresh: up
	docker compose exec --user www-data app php artisan migrate:fresh --force

# Borra el volumen: se pierden todos los datos locales.
reset-db:
	docker compose down -v
	$(MAKE) up
