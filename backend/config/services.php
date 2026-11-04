<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Voz local de respaldo. El binario y el modelo vienen en la imagen de Docker (docker/php/Dockerfile).
    'piper' => [
        'binario' => env('PIPER_BINARIO', '/opt/piper/bin/piper'),
        'voz' => env('PIPER_VOZ', '/opt/piper/voces/es_MX-claude-high.onnx'),
    ],

    // Voz del proyecto. TTS_DRIVER=piper usa solo la voz local; con elevenlabs, Piper queda de respaldo.
    'tts' => [
        'driver' => env('TTS_DRIVER', 'elevenlabs'),
        // Tope por audio: protege la cuota mensual de la API.
        'max_caracteres' => (int) env('TTS_MAX_CARACTERES', 600),
    ],

    // Cuenta de la docente de demostración (solo local; ver DocenteDemoSeeder).
    'demo_docente' => ['clave' => env('DEMO_DOCENTE_CLAVE')],

    'elevenlabs' => [
        'clave' => env('ELEVENLABS_API_KEY'),
        'voz' => env('ELEVENLABS_VOICE_ID'),
        'modelo' => env('ELEVENLABS_MODEL', 'eleven_turbo_v2_5'),
        // Sin esto una palabra suelta puede leerse como inglés. Solo lo aceptan los modelos turbo, flash y v3:
        // si el .env aún fija un multilingual_v2, no se manda por defecto (la API respondería 400).
        'idioma' => env('ELEVENLABS_IDIOMA', str_contains((string) env('ELEVENLABS_MODEL'), 'multilingual') ? null : 'es'),
        'estabilidad' => (float) env('VOZ_ESTABILIDAD', 0.3),
        'similitud' => (float) env('VOZ_SIMILITUD', 1),
        'velocidad' => (float) env('VOZ_VELOCIDAD', 1),
    ],

    // IA que redacta el borrador del cuento (la docente lo revisa). Modelo abierto en Ollama: sin costo por uso.
    // OLLAMA_URL apunta al contenedor `ollama` o a un servidor remoto; sin URL, el botón avisa que no está activada.
    'ollama' => [
        'url' => env('OLLAMA_URL'),
        'clave' => env('OLLAMA_API_KEY'),
        'modelo' => env('OLLAMA_MODEL', 'qwen2.5:3b'),
        'espera' => (int) env('OLLAMA_ESPERA', 90),
        // Hilos de CPU para el modelo. Vacío = que Ollama elija (valor medido como mejor por defecto).
        'hilos' => env('OLLAMA_HILOS') ? (int) env('OLLAMA_HILOS') : null,
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
