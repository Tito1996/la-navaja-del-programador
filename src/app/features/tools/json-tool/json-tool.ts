import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type JsonMode = 'pretty' | 'minify';

@Component({
  standalone: true,
  selector: 'app-json-tool',
  imports: [CommonModule],
  templateUrl: './json-tool.html',
  styleUrls: ['./json-tool.scss'],
})
export class JsonTool {
  readonly input = signal<string>('');
  readonly output = signal<string>('');
  readonly lastMode = signal<JsonMode | ''>('');
  readonly copyMsg = signal<string>('');

  // Estado de validación
  readonly parsedOk = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly errorPosition = signal<number | null>(null);

  readonly inputBytes = computed(() => new Blob([this.input()]).size);
  readonly outputBytes = computed(() => new Blob([this.output()]).size);

  readonly statusType = computed<'idle' | 'ok' | 'err'>(() => {
    if (!this.input().trim()) return 'idle';
    return this.parsedOk() ? 'ok' : 'err';
  });

  readonly statusTitle = computed(() => {
    const t = this.statusType();
    if (t === 'idle') return 'Listo';
    return t === 'ok' ? 'JSON válido' : 'JSON inválido';
  });

  readonly statusDetail = computed(() => {
    if (!this.input().trim()) return 'Pega un JSON para validar o transformar.';
    if (this.parsedOk()) return '';
    const pos = this.errorPosition();
    if (pos === null) return this.errorMessage();
    return `${this.errorMessage()} (posición aproximada: ${pos})`;
  });

  onQueryInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.setInput(input?.value ?? '');
  }

  setInput(v: string): void {
    this.input.set(v);
    this.validateOnly(v);
    // Mantener salida si el usuario edita; no la borramos automáticamente
  }

  clearInput(): void {
    this.input.set('');
    this.validateOnly('');
  }

  clearAll(): void {
    this.input.set('');
    this.output.set('');
    this.lastMode.set('');
    this.copyMsg.set('');
    this.validateOnly('');
  }

  run(mode: JsonMode): void {
    const raw = this.input();
    this.copyMsg.set('');

    const parsed = this.tryParse(raw);
    if (!parsed.ok) {
      this.output.set('');
      this.lastMode.set('');
      return;
    }

    const value = parsed.value;

    if (mode === 'pretty') {
      this.output.set(JSON.stringify(value, null, 2));
      this.lastMode.set('pretty');
    } else {
      this.output.set(JSON.stringify(value));
      this.lastMode.set('minify');
    }
  }

  async copyOutput(): Promise<void> {
    const text = this.output();
    if (!text.trim()) return;
    await this.copyToClipboard(text, 'Resultado copiado');
  }

  async copyInput(): Promise<void> {
    const text = this.input();
    if (!text.trim()) return;
    await this.copyToClipboard(text, 'Entrada copiada');
  }

  async pasteInput(): Promise<void> {
    this.copyMsg.set('');
    try {
      const text = await navigator.clipboard.readText();
      if (typeof text === 'string') {
        this.setInput(text);
      }
    } catch {
      this.copyMsg.set('No se pudo leer del portapapeles (permiso denegado o no disponible).');
    }
  }

  private async copyToClipboard(text: string, okMsg: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copyMsg.set(okMsg);
      window.setTimeout(() => this.copyMsg.set(''), 1500);
    } catch {
      this.copyMsg.set('No se pudo copiar al portapapeles (permiso denegado o no disponible).');
    }
  }

  private validateOnly(raw: string): void {
    if (!raw.trim()) {
      this.parsedOk.set(false);
      this.errorMessage.set('');
      this.errorPosition.set(null);
      return;
    }

    const parsed = this.tryParse(raw);
    this.parsedOk.set(parsed.ok);
  }

  private tryParse(raw: string): { ok: true; value: unknown } | { ok: false } {
    try {
      const value = JSON.parse(raw);
      this.errorMessage.set('');
      this.errorPosition.set(null);
      this.parsedOk.set(true);
      return { ok: true, value };
    } catch (e: Error | unknown) {
      if (e instanceof Error) {
        const msg = e.message;
        this.errorMessage.set(msg);
        this.errorPosition.set(this.extractPosition(msg));
      } else {
        this.errorMessage.set('Unknown error parsing JSON');
      }
      this.parsedOk.set(false);
      return { ok: false };
    }
  }

  private extractPosition(message: string): number | null {
    // Mensajes típicos: "Unexpected token ... in JSON at position 10"
    const m = message.match(/position\s+(\d+)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
}
