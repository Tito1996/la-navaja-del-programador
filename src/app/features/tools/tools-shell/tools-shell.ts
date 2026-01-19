import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ToolRegistryService } from '../../../core/services/tool-registry.service';
import { ToolCategory, ToolDefinition } from '../../../core/models/tool-definition';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  standalone: true,
  selector: 'app-tools-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './tools-shell.html',
  styleUrls: ['./tools-shell.scss'],
})
export class ToolsShell {
  private readonly registry = inject(ToolRegistryService);
  private readonly favs = inject(FavoritesService);

  readonly sidebarOpen = signal(false);

  readonly query = signal('');
  readonly category = signal<ToolCategory | 'all'>('all');

  private readonly allTools = this.registry.getAll();
  readonly allCount = this.allTools.length;

  readonly categories: ToolCategory[] = Array.from(
    new Set(this.allTools.map((t) => t.category)),
  ) as ToolCategory[];

  readonly favoritesCount = signal(0);

  readonly filteredTools = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();

    return this.allTools
      .filter((t) => (cat === 'all' ? true : t.category === cat))
      .filter((t) => {
        if (!q) return true;
        const haystack = [t.name, t.description, t.category, t.id, t.route, ...(t.keywords ?? [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
  });

  readonly filteredCount = computed(() => this.filteredTools().length);

  // Preview en sidebar (para no meter 50 items)
  readonly filteredPreview = computed(() => this.filteredTools().slice(0, 8));

  constructor() {
    this.refreshFavCount();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeSidebarOnMobile(): void {
    // Simple: cerramos siempre al click sobre content; en desktop no molesta
    if (this.sidebarOpen()) this.sidebarOpen.set(false);
  }

  onQueryInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.setQuery(input?.value ?? '');
  }

  setQuery(v: string): void {
    this.query.set(v);
  }

  setCategory(v: ToolCategory | 'all'): void {
    this.category.set(v);
  }

  resetFilters(): void {
    this.query.set('');
    this.category.set('all');
  }

  refreshFavCount(): void {
    this.favoritesCount.set(this.favs.getAllIds().length);
  }

  trackById(_: number, t: ToolDefinition): string {
    return t.id;
  }
}
