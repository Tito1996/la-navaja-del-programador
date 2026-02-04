import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToolCategory, ToolDefinition } from '../../core/models/tool-definition';
import { ToolCard } from '../../shared/components/tool-card/tool-card';

type FilterMode = 'all' | 'favorites';

@Component({
  standalone: true,
  selector: 'app-tools-home',
  imports: [CommonModule, ToolCard],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  private readonly registry = inject(ToolRegistryService);
  private readonly favs = inject(FavoritesService);

  // UI state
  readonly query = signal('');
  readonly category = signal<ToolCategory | 'all'>('all');
  readonly mode = signal<FilterMode>('all');

  // Data
  private readonly allTools = this.registry.getAll();

  // Derivados
  readonly filteredTools = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    const mode = this.mode();

    const favIds = new Set(this.favs.getAllIds());

    return this.allTools
      .filter((t) => (cat === 'all' ? true : t.category === cat))
      .filter((t) => (mode === 'favorites' ? favIds.has(t.id) : true))
      .filter((t) => {
        if (!q) return true;
        const haystack = [t.name, t.description, t.category, t.id, t.route, ...(t.keywords ?? [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
  });

  // Categorías (derivadas del registro)
  readonly categories: ToolCategory[] = Array.from(
    new Set(this.allTools.map((t) => t.category)),
  ) as ToolCategory[];

  setQuery(v: string): void {
    this.query.set(v);
  }

  onQueryInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.setQuery(input?.value ?? '');
  }

  setCategory(v: ToolCategory | 'all'): void {
    this.category.set(v);
  }

  setMode(v: FilterMode): void {
    this.mode.set(v);
  }

  reset(): void {
    this.query.set('');
    this.category.set('all');
    this.mode.set('all');
  }

  isFav(id: string): boolean {
    return this.favs.isFavorite(id);
  }

  toggleFav(id: string): void {
    this.favs.toggle(id);
    // Forzar recompute: la signal no cambia, pero el storage sí.
    // Trucos simples: re-setear el mismo valor de query para que compute se dispare.
    this.query.set(this.query());
  }

  trackById(_: number, t: ToolDefinition): string {
    return t.id;
  }
}
