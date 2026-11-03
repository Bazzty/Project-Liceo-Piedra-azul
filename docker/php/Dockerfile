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

# Piper: voz local de respaldo cuando ElevenLabs falla o se acaba la cuota (ver README, sección Voz).
# Versión y modelo fijos (revisión del repositorio de voces + sha256) para que todos los equipos
# generen exactamente el mismo audio. lame pasa el WAV de Piper a MP3, el formato que guarda la app.
ARG PIPER_VERSION=1.8.0
ARG PIPER_VOICES_REV=e7229f7d33a10e145e109b886d661984201ac3c4
ARG PIPER_VOICE=es_MX-claude-high
ARG PIPER_VOICE_PATH=es/es_MX/claude/high
ARG PIPER_VOICE_SHA256=3ef40a71ea63852cd8ab7e6fa7d2ecdcfa67a0b47c9c48e3f10e02ee02083ea0
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv lame curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/piper \
    && /opt/piper/bin/pip install --no-cache-dir "piper-tts==${PIPER_VERSION}" \
    && mkdir -p /opt/piper/voces \
    && base="https://huggingface.co/rhasspy/piper-voices/resolve/${PIPER_VOICES_REV}/${PIPER_VOICE_PATH}/${PIPER_VOICE}" \
    && curl -fsSL -o "/opt/piper/voces/${PIPER_VOICE}.onnx" "${base}.onnx" \
    && curl -fsSL -o "/opt/piper/voces/${PIPER_VOICE}.onnx.json" "${base}.onnx.json" \
    && echo "${PIPER_VOICE_SHA256}  /opt/piper/voces/${PIPER_VOICE}.onnx" | sha256sum -c -

ENV PIPER_BINARIO=/opt/piper/bin/piper \
    PIPER_VOZ=/opt/piper/voces/${PIPER_VOICE}.onnx

RUN groupmod -o -g "${HOST_GID}" www-data \
    && usermod -o -u "${HOST_UID}" -g "${HOST_GID}" www-data

WORKDIR /var/www/html
