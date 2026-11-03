<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('palabra_silabas', function (Blueprint $table) {
            $table->foreignUlid('palabra_id')->constrained('pagina_palabras')->cascadeOnDelete();
            $table->smallInteger('orden');
            $table->foreignUlid('silaba_id')->index()->constrained('silabas')->restrictOnDelete();

            $table->primary(['palabra_id', 'orden']);
        });

        DB::statement('ALTER TABLE palabra_silabas ADD CONSTRAINT palabra_silabas_orden_positivo CHECK (orden > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('palabra_silabas');
    }
};
