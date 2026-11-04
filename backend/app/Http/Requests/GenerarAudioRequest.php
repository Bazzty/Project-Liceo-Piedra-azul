<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerarAudioRequest extends FormRequest
{
    /** Solo quien crea contenido gasta cuota de voz; el revisor solo valida cuentos. */
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['texto' => ['required', 'string', 'max:'.config('services.tts.max_caracteres')]];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'texto.required' => 'Escribe el texto que quieres convertir en audio.',
            'texto.max' => 'El texto es muy largo: máximo :max caracteres por audio.',
        ];
    }
}
