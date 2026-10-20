import React, { useState } from 'react';
import { Play, Star, Volume2 } from 'lucide-react';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { THEMES_CONFIG } from '@/shared/config/themes';
import { useThemeStore, type ThemeId } from '@/shared/store/useThemeStore';
import { Badge, Button, Card, OptionButton, ProgressBar, SectionTitle } from '@/shared/ui';

const COLORES = [
  { token: 'app', clase: 'bg-app', nota: 'Fondo de la app' },
  { token: 'surface', clase: 'bg-surface', nota: 'Tarjetas' },
  { token: 'primary', clase: 'bg-primary', nota: 'Texto principal' },
  { token: 'secondary', clase: 'bg-secondary', nota: 'Texto secundario' },
  { token: 'brand', clase: 'bg-brand', nota: 'Marca y acción principal' },
  { token: 'accent', clase: 'bg-accent', nota: 'Estrellas y celebración' },
  { token: 'statusOk', clase: 'bg-statusOk', nota: 'Correcto' },
  { token: 'statusWarn', clase: 'bg-statusWarn', nota: 'Atención' },
  { token: 'statusDanger', clase: 'bg-statusDanger', nota: 'Error' },
  { token: 'statusInfo', clase: 'bg-statusInfo', nota: 'Información' },
];

const PICTOGRAMAS = [
  { archivo: 'agua', nombre: 'Agua' },
  { archivo: 'bano', nombre: 'Baño' },
  { archivo: 'comer', nombre: 'Comer' },
  { archivo: 'dormir', nombre: 'Dormir' },
  { archivo: 'feliz', nombre: 'Feliz' },
  { archivo: 'triste', nombre: 'Triste' },
  { archivo: 'mama', nombre: 'Mamá' },
  { archivo: 'colegio', nombre: 'Colegio' },
];

const Seccion: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="flex flex-col gap-4" aria-labelledby={`sec-${titulo}`}>
    <div id={`sec-${titulo}`}>
      <SectionTitle>{titulo}</SectionTitle>
    </div>
    {children}
  </section>
);

/** Página de muestra: todos los componentes y tokens del sistema de diseño, para revisar cada paleta. */
export const MuestraComponentes: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const [nivel, setNivel] = useState('A');
  const [cargando, setCargando] = useState(false);

  const probarCarga = () => {
    setCargando(true);
    setTimeout(() => setCargando(false), 1500);
  };

  return (
    <MainLayout allowScroll>
      <div className="flex flex-col gap-10 pb-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black text-primary">Sistema de diseño</h1>
          <p className="text-base font-semibold text-secondary">
            Cambia la paleta y mira cómo responden todos los componentes.
          </p>
        </header>

        <Seccion titulo="Paleta de colores">
          <div role="radiogroup" aria-label="Paleta de colores" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {THEMES_CONFIG.map((tema) => (
              <OptionButton
                key={tema.id}
                selected={currentTheme === tema.id}
                onClick={() => setTheme(tema.id as ThemeId)}
                className="flex items-center gap-3 px-4 py-3 font-extrabold text-left"
              >
                <span
                  className="w-6 h-6 rounded-full border-2 border-borderStrong shrink-0"
                  style={{ backgroundColor: tema.colorPreviewHex }}
                  aria-hidden
                />
                {tema.nombre}
              </OptionButton>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Colores">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {COLORES.map((c) => (
              <Card key={c.token} padding="sm" className="flex flex-col gap-2">
                <div className={`h-14 rounded-control border-2 border-borderStrong ${c.clase}`} aria-hidden />
                <p className="text-sm font-extrabold text-primary">{c.token}</p>
                <p className="text-xs font-semibold text-secondary">{c.nota}</p>
              </Card>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tipografía">
          <Card padding="lg" className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-secondary">Estudiante · Nunito</p>
              <p className="text-4xl font-black text-primary">Leemos un cuento juntos</p>
              <p className="text-xl font-bold text-primary">Elige el cuento que más te gusta.</p>
              <p className="text-base font-semibold text-secondary">Texto de apoyo con buen contraste y tamaño cómodo.</p>
            </div>
            <div className="border-t-2 border-borderCustom pt-4" style={{ fontFamily: "'Inter Variable', system-ui, sans-serif" }}>
              <p className="text-xs font-extrabold uppercase tracking-wide text-secondary">Docente · Inter</p>
              <p className="text-2xl font-bold text-primary">Resumen del curso</p>
              <p className="text-sm font-medium text-secondary">8 estudiantes activos · 24 cuentos leídos esta semana</p>
            </div>
          </Card>
        </Seccion>

        <Seccion titulo="Botones">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Principal</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="accent">
                <Star className="w-5 h-5" aria-hidden /> Destacado
              </Button>
              <Button variant="danger">Eliminar</Button>
              <Button variant="ghost">Cancelar</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Pequeño (48 px)</Button>
              <Button size="md">Mediano</Button>
              <Button size="lg">
                <Volume2 className="w-5 h-5" aria-hidden /> Escuchar
              </Button>
              <Button size="xl">
                <Play className="w-6 h-6" aria-hidden /> Leer
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Deshabilitado</Button>
              <Button loading={cargando} onClick={probarCarga}>
                {cargando ? 'Guardando…' : 'Probar carga'}
              </Button>
            </div>
            <p className="text-sm font-semibold text-secondary">
              Todos los botones miden al menos 48 px de alto. Usa Tab para ver el foco.
            </p>
          </Card>
        </Seccion>

        <Seccion titulo="Selección de nivel">
          <div role="radiogroup" aria-label="Nivel lector" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['A', 'B', 'C', 'D'].map((n) => (
              <OptionButton
                key={n}
                selected={nivel === n}
                onClick={() => setNivel(n)}
                className="px-4 py-4 text-xl font-black"
              >
                Nivel {n}
              </OptionButton>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Estados e indicadores">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone="ok">✓ Validado</Badge>
              <Badge tone="warn">● En revisión</Badge>
              <Badge tone="danger">! Devuelto</Badge>
              <Badge tone="info">i Borrador</Badge>
              <Badge>Nivel A</Badge>
            </div>
            <div className="flex flex-col gap-3 max-w-md">
              <div>
                <p className="text-sm font-bold text-primary mb-1">Progreso del cuento · 60%</p>
                <ProgressBar value={60} label="Progreso del cuento" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary mb-1">Nivel A · 25%</p>
                <ProgressBar value={25} label="Progreso del nivel A" />
              </div>
            </div>
            <p className="text-sm font-semibold text-secondary">
              Los estados siempre llevan texto o símbolo, nunca solo color.
            </p>
          </Card>
        </Seccion>

        <Seccion titulo="Tarjetas">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="lg" className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-primary">Tarjeta principal</h3>
              <p className="text-base font-semibold text-secondary">Agrupa una idea o una acción.</p>
              <Card tone="inset" padding="md">
                <p className="text-sm font-semibold text-secondary">Bloque secundario dentro de una tarjeta.</p>
              </Card>
            </Card>
            <Card padding="lg" className="flex flex-col gap-3">
              <h3 className="text-xl font-black text-primary">Instrucción corta</h3>
              <p className="text-lg font-bold text-primary">Toca el pictograma para escucharlo.</p>
              <Button size="lg" className="self-start">
                <Volume2 className="w-5 h-5" aria-hidden /> Escuchar
              </Button>
            </Card>
          </div>
        </Seccion>

        <Seccion titulo="Pictogramas ARASAAC">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {PICTOGRAMAS.map((p) => (
              <Card key={p.archivo} padding="sm" className="flex flex-col items-center gap-2">
                <img
                  src={`/pictogramas/arasaac/${p.archivo}.png`}
                  alt={`Pictograma de ${p.nombre.toLowerCase()}`}
                  className="w-full aspect-square object-contain bg-white rounded-control"
                />
                <p className="text-base font-extrabold text-primary">{p.nombre}</p>
              </Card>
            ))}
          </div>
        </Seccion>
      </div>
    </MainLayout>
  );
};
