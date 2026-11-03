FROM php:8.4-fpm

# UID y GID del usuario del equipo: así los archivos que crea el contenedor (logs, caché, vendor)
# no quedan como root ni como otro usuario dentro de la carpeta del proyecto.
ARG HOST_UID=1000
ARG HOST_GID=1000

COPY --from=ghcr.io/mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# pcntl lo usa el worker de colas; gd y zip, el manejo de imágenes y el PDF de tarjetas.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/* \
    && install-php-extensions pdo_pgsql pgsql pcntl intl zip gd opcache

RUN groupmod -o -g "${HOST_GID}" www-data \
    && usermod -o -u "${HOST_UID}" -g "${HOST_GID}" www-data

WORKDIR /var/www/html
