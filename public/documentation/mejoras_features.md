# Mejoras para los componentes de `features`

Fecha de revision: 2026-09-12

## Objetivo

Restablecer la compilacion, unificar la navegacion de herramientas y dejar los componentes de `features` preparados para crecer con estado reactivo, pruebas significativas y una experiencia accesible.

## Diagnostico verificado

La revision incluyo los componentes, plantillas, estilos y pruebas de `src/app/features`, sus rutas y los servicios que consumen. `npm run build` y `npm run lint` no finalizan correctamente en el estado actual.

| Prioridad | Hallazgo                                                                   | Impacto                                                  |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| P0        | La aplicacion no compila por la plantilla y la ruta de Regex.              | Las rutas de herramientas no se pueden distribuir.       |
| P0        | `/tools` carga el placeholder `ToolsHome`.                                 | La navegacion principal conduce a una pantalla vacia.    |
| P0        | Favoritos no propaga cambios de forma reactiva.                            | El listado y el contador lateral quedan desactualizados. |
| P1        | Los estados vacios se declaran como `ng-template`, pero no se renderizan.  | No hay feedback al no encontrar resultados.              |
| P1        | Favoritos, historial y ajustes siguen siendo placeholders.                 | Hay rutas visibles sin funcionalidad.                    |
| P1        | Los tests no cubren comportamiento y el spec de JSON apunta a Regex.       | Las regresiones pasan sin deteccion.                     |
| P2        | Plantillas y accesibilidad son inconsistentes.                             | El lint falla y la navegacion asistida pierde contexto.  |
| P2        | La ejecucion de regex puede bloquear la interfaz con entradas patologicas. | Una herramienta local puede congelar la pestana.         |

## Fase 1: recuperar una aplicacion compilable

### 1. Corregir la carga de la herramienta Regex

**Archivos:** `src/app/features/tools/tools.routes.ts`, `src/app/features/tools/regex/regex-tools.ts`

La ruta `/tools/regex` carga `RegexTools`, pero la clase que se exporta es `RegexTool`. Hay que hacer coincidir ambos nombres; se recomienda conservar `RegexTool`, que ya coincide con el selector `app-regex-tool`.

**Implementacion**

1. Cambiar el `then(m => m.RegexTools)` de la ruta por `then(m => m.RegexTool)`.
2. Corregir `regex-tools.spec.ts` para importar y crear `RegexTool`.
3. Corregir `json-tool.spec.ts`: actualmente importa `./regex-tools`, que no existe en su directorio. Debe importar `JsonTool` desde `./json-tool` y describir ese componente.

**Criterio de aceptacion:** `npm run build` no informa de `TS2551` y la ruta `/tools/regex` carga el componente.

### 2. Eliminar casts incompatibles de las plantillas Angular

**Archivos:** `src/app/features/tools/regex/regex-tools.html`, `src/app/features/tools/regex/regex-tools.ts`

Las expresiones `(input)` contienen `as string`. Las plantillas Angular no admiten ese cast de TypeScript, por lo que el compilador devuelve `NG5002`.

**Implementacion**

1. Añadir en el componente manejadores tipados: `onPatternInput`, `onFlagsInput`, `onTextInput` y `onReplacementInput`.
2. En cada manejador, convertir `event.target` a `HTMLInputElement | HTMLTextAreaElement | null` y actualizar la signal correspondiente usando `target?.value ?? ''`.
3. Cambiar los cuatro bindings de la plantilla a `(input)="on...Input($event)"`.
4. Sustituir el `catch (e: any)` de `compiled` por `catch (error: unknown)` y extraer el mensaje con `error instanceof Error`.
5. Eliminar la variable `escaped` de `highlightHtml`, que se calcula pero no se usa.

**Criterio de aceptacion:** desaparecen los errores `NG5002`, `no-explicit-any` y `no-unused-vars` de Regex.

## Fase 2: unificar la navegacion y el estado

### 3. Definir una unica pagina de catalogo de herramientas

**Archivos:** `src/app/app.routes.ts`, `src/app/features/tools/tools.routes.ts`, `src/app/features/home/*`, `src/app/features/tools/tools-home/*`, `src/app/features/tools/tools-shell/*`

La pagina raiz carga `Home`, mientras que `/tools` monta `ToolsShell` y su hijo `ToolsHome`; este ultimo solo muestra `tools-home works!`. El menu lateral dirige a `/tools`, por tanto no lleva al catalogo funcional.

**Implementacion recomendada**

1. Usar el shell de herramientas como contenedor del catalogo: sustituir el hijo vacio de `TOOLS_ROUTES` por `Home`, o mover `Home` a `features/tools/tools-home` y ajustar sus imports/rutas.
2. Hacer que la ruta raiz redirija a `/tools`, para que exista una URL canonica.
3. Eliminar el componente placeholder que deje de utilizarse, incluidos su HTML, SCSS y spec.
4. Extraer `query` y `category` a un `ToolFiltersService` con signals. Tanto `ToolsShell` como el catalogo deben consumir el mismo servicio, de modo que la busqueda y las categorias del lateral filtren los resultados que el usuario ve.

**Criterio de aceptacion:** abrir `/`, `/tools` o pulsar “Todas las herramientas” muestra el mismo catalogo dentro del shell; cambiar un filtro lateral actualiza la cuadricula.

### 4. Hacer reactivo el servicio de favoritos

**Archivos:** `src/app/core/services/favorites.service.ts`, `src/app/features/home/home.ts`, `src/app/features/tools/tools-shell/tools-shell.ts`

`FavoritesService` almacena un `Set` normal. Después de `toggle`, `Home` intenta recalcular `filteredTools` con `this.query.set(this.query())`; una signal no notifica cuando recibe el mismo valor. `ToolsShell` inicializa su contador una vez y nunca vuelve a actualizarlo.

**Implementacion**

1. Sustituir el campo mutable por una `signal<ReadonlySet<string>>` inicializada desde `load()`.
2. En `toggle`, crear un `Set` nuevo, modificarlo, guardarlo y publicarlo mediante `set`.
3. Exponer `favoriteIds` como signal de solo lectura o un `computed` con el listado de ids; mantener `isFavorite` como utilidad si simplifica las plantillas.
4. Convertir en `computed` los favoritos filtrados de `Home` y el contador de `ToolsShell` para que dependan de la signal del servicio.
5. Borrar `refreshFavCount` y el comentario/truco de reasignar `query`.
6. En `save`, capturar errores de `localStorage` para no interrumpir la interfaz cuando el almacenamiento no este disponible.

**Criterio de aceptacion:** al marcar o quitar una tarjeta como favorita, el filtro “Favoritos” y el contador lateral cambian de inmediato, sin recargar la pagina.

### 5. Renderizar estados vacios reales

**Archivos:** `src/app/features/home/home.html`, `src/app/features/tools/tools-shell/tools-shell.html`

En ambos componentes, la rama de ausencia de resultados contiene un `ng-template` sin `ngTemplateOutlet` ni una referencia `else`; por tanto el DOM queda vacio.

**Implementacion**

1. En `Home`, dejar la rama como `@else` y colocar directamente el bloque `.empty` en su interior.
2. En `ToolsShell`, reemplazar la rama `@else` por el elemento `.hint__muted` directamente.
3. Simplificar condiciones redundantes: tras un `@if (filteredTools().length > 0)`, no hace falta comprobar explícitamente que la longitud es cero en la alternativa.

**Criterio de aceptacion:** una busqueda sin coincidencias muestra un mensaje y permite restablecer filtros.

## Fase 3: completar las rutas visibles

### 6. Implementar favoritos y decidir el alcance de historial y ajustes

**Archivos:** `src/app/features/favorites/*`, `src/app/features/history/*`, `src/app/features/settings/*`

Las tres rutas se muestran en la navegacion, pero sus plantillas contienen solo texto generado por Angular CLI.

**Implementacion de favoritos**

1. Inyectar `FavoritesService` y `ToolRegistryService`.
2. Derivar con un `computed` las definiciones del registro cuyo id este en favoritos.
3. Reutilizar `ToolCard` para mantener las acciones y el aspecto del catalogo.
4. Mostrar un estado vacio con enlace o accion que lleve al catalogo.

**Decision de producto para historial y ajustes**

- Historial: crear `HistoryService` con una signal persistida y registrar cada apertura de herramienta desde la tarjeta o mediante eventos de navegacion. Mostrar fecha, herramienta y accion para limpiar el historial.
- Ajustes: definir preferencias que realmente se consuman, por ejemplo el limite del historial o la persistencia local. Guardarlas en un servicio reactivo y aplicarlas desde los componentes.
- Si esas funcionalidades no entran en el proximo incremento, ocultar temporalmente los enlaces y rutas en vez de publicar placeholders.

**Criterio de aceptacion:** no hay enlaces de navegacion que terminen en texto placeholder.

## Fase 4: calidad, pruebas y accesibilidad

### 7. Sustituir tests de creacion por pruebas de comportamiento

**Archivos:** todos los `*.spec.ts` en `src/app/features`

Actualmente los specs, salvo los imports incorrectos indicados antes, solo verifican que la instancia se crea. La cobertura no protege la lógica que usan los usuarios.

**Casos minimos**

| Componente o servicio | Casos a probar                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `FavoritesService`    | Carga valida e invalida de `localStorage`, alta/baja, persistencia y actualizacion reactiva.                                 |
| `Home`                | Texto, categoria y modo de favoritos; restablecimiento y estado sin resultados.                                              |
| `ToolsShell`          | Busqueda/categoria compartidas, contador reactivo y apertura/cierre del menu movil.                                          |
| `JsonTool`            | JSON valido, JSON invalido, formateo, minificado, limpiar y fallo de portapapeles.                                           |
| `RegexTool`           | Flags normalizados, regex invalida, coincidencias vacias, coincidencias de longitud cero, reemplazo y fallo de portapapeles. |
| `Favorites`           | Lista derivada y estado vacio.                                                                                               |

Mockear `navigator.clipboard` y `localStorage` en los specs. Ejecutar los tests en CI con un navegador sin interfaz configurado para evitar que dependan de una sesion local.

### 8. Cumplir las reglas de plantilla y mejorar la semantica

**Archivos:** `json-tool.html`, `regex-tools.html`, `home.html`, `tools-shell.html` y sus SCSS

1. Migrar los `*ngIf` y `*ngFor` de JSON y Regex a `@if` y `@for`, que es el estandar exigido por `@angular-eslint/template/prefer-control-flow`.
2. Usar identidades estables: `track t.id` para herramientas y `track c` para categorias. En el preview del shell usar `track t.id` en lugar de `$index`.
3. Añadir `[attr.aria-pressed]` a los selectores de modo/categoria y una etiqueta de grupo que explique cada conjunto de botones.
4. Asociar los mensajes de estado de los editores con `aria-describedby`; usar `aria-live="polite"` para resultado de copiar, validar y errores.
5. Definir `:focus-visible` para enlaces, botones, inputs y textareas. No retirar el foco nativo sin proporcionar uno equivalente.
6. El `main` de `ToolsShell` no debe tener `role="button"`, `tabindex` ni manejadores de teclado: no es un control interactivo. Mantener solo el cierre del menu si la decision de UX lo requiere.

### 9. Aislar ejecuciones de regex costosas

**Archivo:** `src/app/features/tools/regex/regex-tools.ts`

Los limites de 5.000 coincidencias evitan un bucle de resultados infinito, pero no evitan el backtracking catastrófico de una expresión regular al ejecutar `exec` o `replace`.

Mover la evaluacion de matches y reemplazos a un Web Worker. El componente enviaria `{ pattern, flags, text, replacement, mode }` y recibiria el resultado con un limite de tiempo; si se supera, mostraria una advertencia y conservaria la interfaz utilizable. No basar la proteccion en expresiones heuristicas simples, porque producen muchos falsos positivos y no cubren todos los patrones costosos.

## Nota sobre el resaltado HTML

`RegexTool` escapa el texto antes de insertarlo en `highlightHtml`, y Angular vuelve a sanitizar bindings `[innerHTML]` por defecto. No hay evidencia de un XSS explotable con el codigo actual. Aun asi, conviene mantener `escapeHtml` con tests que incluyan `<`, `>`, comillas y `&`; no usar `bypassSecurityTrustHtml` para este caso.

## Orden de ejecucion y validacion

1. Aplicar las fases 1 y 2 en un mismo incremento: restauran la compilacion y el flujo principal.
2. Ejecutar `npm run build` y `npm run lint` hasta que finalicen sin errores.
3. Implementar los tests prioritarios de servicios, catalogo, JSON y Regex; ejecutar `npm test -- --watch=false --browsers=ChromeHeadless` o el equivalente configurado para CI.
4. Completar favoritos y decidir/ocultar historial y ajustes antes de exponerlos en navegacion.
5. Aplicar la fase de accesibilidad y comprobar el recorrido completo con teclado: menu, busqueda, filtros, tarjetas, editores y mensajes de estado.
