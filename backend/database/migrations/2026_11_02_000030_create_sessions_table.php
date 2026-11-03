<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sesiones web de Laravel (SESSION_DRIVER=database). Antes venía con la migración de users.
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            // Al borrar a un usuario se cierran sus sesiones abiertas.
            $table->foreignUlid('user_id')->nullable()->index()->constrained('usuarios')->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
