import { Injectable } from '@angular/core';
import { ToolCategory, ToolDefinition } from '../models/tool-definition';

@Injectable({ providedIn: 'root' })
export class ToolRegistryService {
  private readonly tools: ToolDefinition[] = [
    {
      id: 'json',
      name: 'JSON Tools',
      description: 'Validar, formatear/minificar y utilidades de JSON.',
      category: 'Datos',
      route: '/tools/json',
      icon: 'data_object',
      keywords: ['json', 'pretty', 'minify', 'jsonpath', 'schema'],
      isNew: true,
    },
    {
      id: 'regex',
      name: 'Regex Playground',
      description: 'Probar expresiones regulares y reemplazos.',
      category: 'Texto',
      route: '/tools/regex',
      icon: 'regular_expression',
      keywords: ['regex', 'replace', 'match', 'groups'],
    },
    {
      id: 'encode',
      name: 'Encode/Decode',
      description: 'Base64, URL encode/decode y HTML entities.',
      category: 'Texto',
      route: '/tools/encode',
      icon: 'code',
      keywords: ['base64', 'urlencode', 'urldecode', 'html entities'],
    },
    {
      id: 'jwt',
      name: 'JWT Decoder',
      description: 'Decodifica header/payload y muestra expiración.',
      category: 'Seguridad',
      route: '/tools/jwt',
      icon: 'key',
      keywords: ['jwt', 'token', 'claims', 'exp'],
      isBeta: true,
    },
    {
      id: 'css',
      name: 'CSS Tools',
      description: 'Sombras, gradientes, clamp() y convertidores.',
      category: 'CSS/UI',
      route: '/tools/css',
      icon: 'palette',
      keywords: ['css', 'shadow', 'gradient', 'clamp', 'rem'],
    },
    {
      id: 'contrast',
      name: 'Contraste & Colores',
      description: 'Conversión de color y contraste WCAG.',
      category: 'CSS/UI',
      route: '/tools/contrast',
      icon: 'contrast',
      keywords: ['wcag', 'contrast', 'hex', 'rgb', 'hsl'],
    },
    {
      id: 'http',
      name: 'HTTP Client',
      description: 'Construye requests con headers/params y guarda colecciones.',
      category: 'API',
      route: '/tools/http',
      icon: 'http',
      keywords: ['http', 'fetch', 'headers', 'api', 'request'],
      isBeta: true,
    },
    {
      id: 'git',
      name: 'Git Helpers',
      description: 'Conventional Commits, plantillas y cheatsheets.',
      category: 'Utilidades',
      route: '/tools/git',
      icon: 'merge',
      keywords: ['git', 'commits', 'conventional commits', 'pr'],
    },
    {
      id: 'dates',
      name: 'Timestamp & Dates',
      description: 'Unix ms/s ⇄ fecha, ISO y diffs.',
      category: 'Fechas',
      route: '/tools/dates',
      icon: 'schedule',
      keywords: ['timestamp', 'unix', 'iso', 'timezone', 'date diff'],
    },
    {
      id: 'linter',
      name: 'Formatter/Linter Runner',
      description: 'Formato rápido para snippets (Prettier/ESLint).',
      category: 'Utilidades',
      route: '/tools/linter',
      icon: 'format_align_left',
      keywords: ['prettier', 'eslint', 'format', 'lint'],
      isBeta: true,
    },
  ];

  getAll(): ToolDefinition[] {
    return [...this.tools];
  }

  getById(id: string): ToolDefinition | undefined {
    return this.tools.find(t => t.id === id);
  }

  getByCategory(category: ToolCategory): ToolDefinition[] {
    return this.tools.filter(t => t.category === category);
  }

  search(term: string): ToolDefinition[] {
    const q = term.trim().toLowerCase();
    if (!q) return this.getAll();

    return this.tools.filter(t => {
      const haystack = [
        t.name,
        t.description,
        t.category,
        ...(t.keywords ?? []),
        t.id,
        t.route,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }
}
