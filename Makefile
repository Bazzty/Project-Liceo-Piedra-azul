.PHONY: env up down ps logs psql reset-db

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

# Borra el volumen: se pierden todos los datos locales.
reset-db:
	docker compose down -v
	$(MAKE) up
