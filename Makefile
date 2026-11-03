.PHONY: env up down ps logs psql reset-db test-db

env:
	@test -f .env || (cp .env.example .env && echo "Creado .env desde .env.example")

up: env
	docker compose up -d --wait

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f db

psql: env
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

# Base aparte para los tests del backend (se vacía en cada corrida). No hace nada si ya existe.
test-db: up
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -lqt | cut -d"|" -f1 | grep -qw "$${POSTGRES_DB}_test" || createdb -U "$$POSTGRES_USER" "$${POSTGRES_DB}_test"'

# Borra el volumen: se pierden todos los datos locales.
reset-db:
	docker compose down -v
	$(MAKE) up
