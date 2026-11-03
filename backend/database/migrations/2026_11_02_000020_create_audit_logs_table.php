<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // «Entrar como este niño» y cambios sensibles. Solo inserción.
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('usuario_id')->nullable()->index()->constrained('usuarios')->restrictOnDelete();
            $table->foreignUlid('estudiante_id')->nullable()->index()->constrained('estudiantes')->restrictOnDelete();
            $table->string('accion', 60);
            $table->ipAddress('ip')->nullable();
            $table->jsonb('detalle')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_accion_no_vacia CHECK (btrim(accion) <> '')");
        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_con_responsable CHECK (usuario_id IS NOT NULL OR estudiante_id IS NOT NULL)');
        DB::unprepared(<<<'SQL'
            CREATE TRIGGER audit_logs_solo_insercion
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION impedir_cambios();
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
