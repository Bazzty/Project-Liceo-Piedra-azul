<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerarCuentoRequest extends FormRequest
{
    /** Solo quien crea contenido ocupa el servidor de IA; el revisor solo valida cuentos. */
    public function authorize(): bool
    {
        return in_array($this->user()?->rol, ['docente', 'admin'], true);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'tema' => ['required', 'string', 'min:3', 'max:200'],
            'nivel' => ['required', Rule::in(['A', 'B'])],
            'paginas' => ['required', 'integer', 'between:3,8'],
            // Palabras para practicar: solo letras y espacios. Nunca viaja el nombre ni el id del niño.
            'palabras' => ['nullable', 'array', 'max:6'],
            'palabras.*' => ['string', 'min:2', 'max:30', 'regex:/^[\pL][\pL ]*$/uD'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'tema.required' => 'Cuéntame de qué trata el cuento.',
            'tema.min' => 'El tema es muy corto: escribe al menos :min letras.',
            'tema.max' => 'El tema es muy largo: máximo :max caracteres.',
            'paginas.between' => 'El cuento puede tener entre :min y :max páginas.',
            'palabras.max' => 'Puedes pedir hasta :max palabras para practicar.',
            'palabras.*.min' => 'Cada palabra para practicar necesita al menos :min letras.',
            'palabras.*.max' => 'Cada palabra para practicar puede tener hasta :max letras.',
            'palabras.*.regex' => 'Las palabras para practicar solo pueden tener letras.',
        ];
    }
}
