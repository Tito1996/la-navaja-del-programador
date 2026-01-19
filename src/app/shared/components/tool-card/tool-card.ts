import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToolDefinition } from '../../../core/models/tool-definition';

@Component({
  standalone: true,
  selector: 'app-tool-card',
  imports: [CommonModule, RouterLink],
  template: `
    <article class="card" [class.card--beta]="tool.isBeta" [class.card--new]="tool.isNew">
      <a class="card__main" [routerLink]="tool.route" [attr.aria-label]="tool.name">
        <div class="card__header">
          <div class="card__icon" aria-hidden="true">
            {{ tool.icon || '🛠️' }}
          </div>

          <div class="card__titleWrap">
            <h3 class="card__title">{{ tool.name }}</h3>
            <div class="card__meta">
              <span class="chip">{{ tool.category }}</span>
              @if (tool.isBeta) {
                <span class="chip chip--beta">BETA</span>
              }
              @if (tool.isNew) {
                <span class="chip chip--new">NUEVO</span>
              }
            </div>
          </div>
        </div>

        <p class="card__desc">{{ tool.description }}</p>
      </a>

      <div class="card__actions">
        <button
          type="button"
          class="iconBtn"
          (click)="onToggleFavorite($event)"
          [attr.aria-pressed]="isFavorite"
          [attr.aria-label]="isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'"
          title="Favorito"
        >
          <span aria-hidden="true">{{ isFavorite ? '★' : '☆' }}</span>
        </button>

        <a class="linkBtn" [routerLink]="tool.route">Abrir</a>
      </div>
    </article>
  `,
  styleUrls: ['./tool-card.scss'],
})
export class ToolCard {
  @Input({ required: true }) tool!: ToolDefinition;
  @Input() isFavorite = false;

  @Output() toggleFavorite = new EventEmitter<string>();

  onToggleFavorite(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.toggleFavorite.emit(this.tool.id);
  }
}
