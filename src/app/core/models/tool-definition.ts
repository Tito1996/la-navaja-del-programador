export type ToolCategory =
  | 'Datos'
  | 'Texto'
  | 'Seguridad'
  | 'CSS/UI'
  | 'Fechas'
  | 'API'
  | 'Utilidades';

export interface ToolDefinition {
  /** Identificador estable */
  id: string;

  /** Nombre mostrado en UI */
  name: string;

  /** Descripción corta */
  description: string;

  /** Categoría para filtros */
  category: ToolCategory;

  /** Ruta absoluta de navegación */
  route: `/${string}`;

  /** Opcional: nombre de icono */
  icon?: string;

  /** Búsqueda: keywords adicionales */
  keywords?: string[];

  /** Estado/flags opcionales */
  isBeta?: boolean;
  isNew?: boolean;
}
