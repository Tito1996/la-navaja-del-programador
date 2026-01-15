import { Injectable } from '@angular/core';

const STORAGE_KEY = 'la-navaja:favorites:v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private favorites = new Set<string>(this.load());

  isFavorite(toolId: string): boolean {
    return this.favorites.has(toolId);
  }

  toggle(toolId: string): void {
    if (this.favorites.has(toolId)) this.favorites.delete(toolId);
    else this.favorites.add(toolId);

    this.save();
  }

  getAllIds(): string[] {
    return Array.from(this.favorites);
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getAllIds()));
  }
}
