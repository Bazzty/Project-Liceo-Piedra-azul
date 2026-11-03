<?php

namespace App\Providers;

use App\Voz\ElevenLabsProvider;
use App\Voz\PiperProvider;
use App\Voz\ServicioDeAudio;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ServicioDeAudio::class, function () {
            $piper = new PiperProvider(config('services.piper.binario'), config('services.piper.voz'));

            if (config('services.tts.driver') === 'piper') {
                return new ServicioDeAudio($piper, null, Storage::disk('audios'));
            }

            return new ServicioDeAudio(new ElevenLabsProvider(config('services.elevenlabs')), $piper, Storage::disk('audios'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
