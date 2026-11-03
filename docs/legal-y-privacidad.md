# Derechos de autor y privacidad: criterios del proyecto

> Documento de trabajo del equipo. **No es asesoría legal**: antes de pasar el prototipo a producción, debe revisarlo un abogado o el encargado de datos del Liceo.

"Leer para Todos" trabaja con **niñas y niños** (muchos con TEA) en un colegio. Eso exige más cuidado que una app común, tanto con los materiales que usamos como con los datos que guardamos.

## 1. Recursos y licencias

| Recurso | Licencia / origen | Qué debemos hacer |
|---|---|---|
| Pictogramas ARASAAC | CC BY-NC-SA 4.0. Autor: Sergio Palao. Propiedad del Gobierno de Aragón | Citar siempre la fuente (visible en la app), **uso no comercial** y compartir igual cualquier obra derivada. Un uso comercial requiere autorización |
| Tipografías Nunito e Inter | SIL Open Font License | Uso libre, incluida la redistribución con la app |
| Íconos (lucide) | ISC | Uso libre |
| Audios generados con IA (fonemas, palabras, narración, voz del personaje) | ElevenLabs, voz "Playful, High-pitched Friend" (voz de un tercero en la biblioteca) | Guardar los términos del plan y de **esa voz**; comprobar que permiten uso en un producto educativo (y si fuera comercial). Ver `docs/audios-interfaz.md` |
| Voz clonada de la docente | Retirada del proyecto (PLPA-97) | No se usa. Si se retomara, requiere **consentimiento escrito** de la docente |
| Osito guía | Trabajo de otro integrante del equipo | Confirmar por escrito que es **creación propia** (o que existe cesión de derechos) y no deriva de un personaje ajeno |

## 2. Personajes y avatares

**Regla: solo personajes propios, encargados con cesión de derechos, o con licencia que permita expresamente este uso.**

- **No** usar personajes comerciales: superhéroes, princesas de marcas, futbolistas, personajes de series, ni imágenes sacadas de internet o de tiendas.
- **No** usar fotos de producto ni capturas, aunque sean "solo para la demo". Una imagen de demostración también infringe derechos y queda en el historial de git.
- Si se ofrece elegir personaje, que sean **originales** (p. ej. variantes del osito: osito con gorro, con bufanda, etc.) y solo después de resolver la autoría.
- Los nombres de personajes también pueden ser marcas registradas: evitarlos como etiquetas.

**Estado actual del prototipo:** ningún alumno tiene personaje elegible ni foto. Todos usan el osito del proyecto (`personajeId: 'oso'`).

> **Aviso:** el prototipo incluía una foto de una figura de Superman (producto con marca registrada de un tercero) como avatar de demostración. Ya se eliminó del código, pero **sigue en el historial de git** de las ramas anteriores. Si el repositorio es o será público, hay que decidir con el equipo si se reescribe el historial.

## 3. Datos personales de menores

Marco legal de referencia (verificar con asesoría): Ley 19.628 sobre protección de la vida privada, la **Ley 21.719** de protección de datos personales (con entrada en vigencia diferida; verificar la fecha vigente) y la Ley 21.545 (inclusión de personas con TEA). Los datos de menores y los de salud/neurodiversidad reciben protección reforzada.

Criterios para el diseño:

1. **Minimizar.** Guardar solo lo necesario: nombre de pila, curso, código de tarjeta y avance de lectura. Evitar apellidos, RUT, fechas de nacimiento y diagnósticos.
2. **Sin fotos de los niños.** Perfil con inicial o pictograma (como pide el diseño).
3. **Nada de datos en pantallas del niño** que identifiquen más de lo necesario: solo el nombre de pila.
4. **La tarjeta de acceso solo lleva un código corto**, sin nombre completo ni datos adicionales que permitan identificar al niño si se pierde.
5. **Consentimiento informado** de apoderados (o del colegio, según corresponda) antes de registrar a un niño, indicando finalidad, qué se guarda y por cuánto tiempo.
6. **Acceso restringido:** solo docentes y revisores autorizados ven el avance de cada niño.
7. **Sin analítica ni servicios de terceros** que reciban datos de los niños (publicidad, rastreo, fuentes remotas).
8. **Retención y borrado:** definir cuánto se guarda el avance y cómo se elimina a petición del apoderado.
9. **Seguridad:** al pasar a un backend real, cifrado en tránsito y reposo, contraseñas con hash y registro de accesos.

**Estado actual del prototipo:** todo ocurre en el navegador (datos ficticios en IndexedDB), no se envía nada a servidores y no hay analítica. Las voces del navegador se usan solo para leer texto en voz alta. Las imágenes de pictogramas que faltan se piden a ARASAAC (solo la palabra, sin datos del niño).

## 4. Pendientes antes de producción

- [ ] Confirmar autoría o cesión de derechos del osito.
- [ ] Documentar la licencia de la herramienta de audios IA.
- [ ] Obtener consentimiento de la docente para su voz clonada (o dejar de usarla).
- [ ] Decidir si se reescribe el historial de git por la imagen eliminada.
- [ ] Redactar aviso de privacidad y formulario de consentimiento para apoderados.
- [ ] Definir política de retención y borrado de datos.
- [ ] Revisión final por un abogado o el encargado de datos del Liceo.

## Resultados de juegos, tareas e informe para la familia

- El prototipo guarda, por niño, cuántos juegos resolvió sin ayuda y en qué palabras la pidió. Es información sobre el desempeño de un menor: solo debe verla la docente y los revisores, nunca otros niños ni adultos ajenos al curso.
- El informe imprimible puede incluir las observaciones de la docente solo si ella lo marca. Lleva la advertencia de entregarlo únicamente al apoderado.
- Los criterios de «necesita apoyo» (días sin entrar, % de juegos sin ayuda, tareas vencidas) están en `frontend/src/features/docente/components/umbrales.ts` y son provisionales: deben validarlos las docentes. Las alertas orientan, no diagnostican.
- Con backend, estos datos deben guardarse con acceso por rol y por curso, y con el consentimiento de las familias para el uso de datos de sus hijos.
