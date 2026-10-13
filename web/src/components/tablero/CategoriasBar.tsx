import React from 'react';
import { Heart, Smile, Users, Activity, Package } from 'lucide-react';
import { useSAACStore, type SAACCategoria } from '../../store/useSAACStore';

interface CategoriaOption {
  id: SAACCategoria;
  nombre: string;
  icon: React.ElementType;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

const CATEGORIAS: CategoriaOption[] = [
  {
    id: 'necesidades',
    nombre: 'Necesidades',
    icon: Heart,
    colorBg: 'bg-rose-500/10',
    colorBorder: 'border-rose-500',
    colorText: 'text-rose-700',
  },
  {
    id: 'emociones',
    nombre: 'Emociones',
    icon: Smile,
    colorBg: 'bg-amber-500/10',
    colorBorder: 'border-amber-500',
    colorText: 'text-amber-700',
  },
  {
    id: 'personas',
    nombre: 'Personas',
    icon: Users,
    colorBg: 'bg-sky-500/10',
    colorBorder: 'border-sky-500',
    colorText: 'text-sky-700',
  },
  {
    id: 'acciones',
    nombre: 'Acciones',
    icon: Activity,
    colorBg: 'bg-emerald-500/10',
    colorBorder: 'border-emerald-500',
    colorText: 'text-emerald-700',
  },
  {
    id: 'objetos',
    nombre: 'Objetos',
    icon: Package,
    colorBg: 'bg-indigo-500/10',
    colorBorder: 'border-indigo-500',
    colorText: 'text-indigo-700',
  },
];

export const CategoriasBar: React.FC = () => {
  const { categoriaActiva, setCategoriaActiva } = useSAACStore();

  return (
    <div className="flex items-center gap-3 overflow-x-auto w-full py-2 px-1 no-scrollbar">
      {CATEGORIAS.map((cat) => {
        const Icon = cat.icon;
        const isActive = categoriaActiva === cat.id;
        
        return (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-4 font-black text-xs sm:text-sm transition-all shrink-0 cursor-pointer shadow ${
              isActive
                ? `${cat.colorBg} ${cat.colorBorder}${cat.colorText} ring-2 ring-brand scale-105`
                : 'bg-surface border-borderCustom text-primary hover:border-brand'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{cat.nombre.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
};