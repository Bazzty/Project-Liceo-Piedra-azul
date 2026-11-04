<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AutenticacionController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);

        $usuario = User::where('email', mb_strtolower(trim($datos['email'])))->first();

        // Un solo cálculo de hash en ambos caminos: así tampoco el tiempo de respuesta delata qué correos tienen cuenta.
        // Se hashea un valor fijo: bcrypt rechaza la clave recibida si trae un NUL y ese error también lo delataría.
        $claveCorrecta = false;
        if ($usuario instanceof User) {
            $claveCorrecta = Hash::check($datos['password'], $usuario->password);
        } else {
            Hash::make('correo-sin-cuenta');
        }

        // Mismo mensaje para correo desconocido, clave errónea o cuenta inactiva: no se revela cuál fue.
        if (! $usuario || ! $usuario->activo || ! $claveCorrecta) {
            return response()->json(['message' => 'Correo o contraseña incorrectos.'], 401);
        }

        // Cada ingreso crea un token de 12 h: los vencidos de esta docente se borran aquí en vez de acumularse.
        $usuario->tokens()->where('expires_at', '<', now())->delete();

        return response()->json([
            'token' => $usuario->createToken('panel-docente', expiresAt: now()->addHours(12))->plainTextToken,
            'usuario' => ['id' => $usuario->id, 'nombre' => $usuario->nombre, 'email' => $usuario->email, 'rol' => $usuario->rol],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()->delete();

        return response()->json(status: 204);
    }
}
