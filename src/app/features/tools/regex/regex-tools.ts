import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Mode = 'match' | 'replace';

interface MatchRow {
  index: number;
  start: number;
  end: number;
  text: string;
  groups: string[];
}

@Component({
  standalone: true,
  selector: 'app-regex-tool',
  imports: [CommonModule],
  templateUrl: './regex-tools.html',
  styleUrls: ['./regex-tools.scss'],
})
export class RegexTool {
  readonly mode = signal<Mode>('match');

  readonly pattern = signal<string>('');
  readonly flagsRaw = signal<string>('g');
  readonly text = signal<string>('');
  readonly replacement = signal<string>('$1');

  readonly copyMsg = signal<string>('');

  // Normalizamos flags: dejamos solo [gimsuy], sin duplicados
  readonly flags = computed(() => {
    const raw = (this.flagsRaw() || '').toLowerCase();
    const allowed = new Set(['g', 'i', 'm', 's', 'u', 'y']);
    const out: string[] = [];
    for (const ch of raw) {
      if (allowed.has(ch) && !out.includes(ch)) out.push(ch);
    }
    return out.join('');
  });

  readonly compiled = computed(() => {
    const p = this.pattern();
    if (!p.trim()) return { ok: false as const, kind: 'idle' as const };

    try {
      const re = new RegExp(p, this.flags());
      return { ok: true as const, re };
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Error al compilar la regex';
      return { ok: false as const, kind: 'err' as const, message: msg };
    }
  });

  readonly statusType = computed<'idle' | 'ok' | 'err'>(() => {
    if (!this.pattern().trim() && !this.text().trim()) return 'idle';
    const c = this.compiled();
    if (!c.ok) return c.kind === 'err' ? 'err' : 'idle';
    return 'ok';
  });

  readonly statusTitle = computed(() => {
    const t = this.statusType();
    if (t === 'idle') return 'Listo';
    if (t === 'err') return 'Regex inválida';
    return 'Regex compilada';
  });

  readonly statusDetail = computed(() => {
    const c = this.compiled();
    if (!c.ok && c.kind === 'err') return c.message;
    if (this.pattern().trim() && !this.text().trim()) return 'Introduce texto para evaluar.';
    if (!this.pattern().trim() && this.text().trim()) return 'Introduce un pattern para evaluar.';
    return '';
  });

  readonly matches = computed<MatchRow[]>(() => {
    const c = this.compiled();
    const txt = this.text();

    if (!c.ok) return [];
    if (!txt) return [];
    if (!this.pattern().trim()) return [];

    const re = c.re;

    // Para iterar matches de forma consistente, necesitamos global.
    // Si el usuario no puso 'g', creamos una copia con 'g' (preservando el resto).
    const flags = this.flags();
    const iterFlags = flags.includes('g') ? flags : flags + 'g';

    let iterRe: RegExp;
    try {
      iterRe = new RegExp(re.source, iterFlags);
    } catch {
      // por si algo raro con flags
      iterRe = re;
    }

    const rows: MatchRow[] = [];
    let m: RegExpExecArray | null;
    let safety = 0;

    while ((m = iterRe.exec(txt)) !== null) {
      const full = m[0] ?? '';
      const start = m.index ?? 0;
      const end = start + full.length;

      const groups: string[] = [];
      // Capturas numeradas: m[1..]
      for (let i = 1; i < m.length; i++) {
        groups.push(m[i] ?? '');
      }

      rows.push({
        index: rows.length,
        start,
        end,
        text: full,
        groups,
      });

      // Evitar bucle infinito con matches vacíos
      if (full.length === 0) {
        iterRe.lastIndex = start + 1;
      }

      // Safety
      safety++;
      if (safety > 5000) break;
    }

    return rows;
  });

  readonly highlightHtml = computed(() => {
    const txt = this.text();
    if (!txt) return '';

    const c = this.compiled();
    if (!c.ok) return '';

    const rows = this.matches();
    if (!rows.length) return '';

    // Escapamos HTML y luego insertamos <mark>
    const escaped = this.escapeHtml(txt);

    // El problema: al escapar, los índices cambian. Solución:
    // construir resaltado sobre el texto original, por segmentos, escapando cada segmento.
    const parts: string[] = [];
    let cursor = 0;

    for (const r of rows) {
      if (r.start < cursor) continue; // por seguridad
      parts.push(this.escapeHtml(txt.slice(cursor, r.start)));
      parts.push(`<mark class="mk">${this.escapeHtml(txt.slice(r.start, r.end))}</mark>`);
      cursor = r.end;
    }
    parts.push(this.escapeHtml(txt.slice(cursor)));

    // También mostramos saltos de línea preservados
    return `<pre class="pre">${parts.join('')}</pre>`;
  });

  readonly replaceResult = computed(() => {
    if (this.mode() !== 'replace') return '';

    const c = this.compiled();
    const txt = this.text();
    if (!c.ok || !txt) return '';
    if (!this.pattern().trim()) return '';

    try {
      return txt.replace(c.re, this.replacement());
    } catch {
      return '';
    }
  });

  readonly replaceResultBytes = computed(() => new Blob([this.replaceResult()]).size);

  setMode(m: Mode): void {
    this.mode.set(m);
  }

  clearAll(): void {
    this.pattern.set('');
    this.flagsRaw.set('g');
    this.text.set('');
    this.replacement.set('$1');
    this.copyMsg.set('');
    this.mode.set('match');
  }

  loadExample(): void {
    this.pattern.set('(\\w+)@(\\w+(?:\\.\\w+)+)');
    this.flagsRaw.set('gi');
    this.text.set(
      ['Contactos:', ' - dev@acme.com', ' - DEV@Example.org', ' - not-an-email', 'Fin.'].join('\n'),
    );
    this.replacement.set('[$1] at [$2]');
    this.copyMsg.set('');
  }

  async copyText(): Promise<void> {
    const t = this.text();
    if (!t.trim()) return;
    await this.copyToClipboard(t, 'Texto copiado');
  }

  async copyPattern(): Promise<void> {
    const p = this.pattern();
    if (!p.trim()) return;
    await this.copyToClipboard(p, 'Pattern copiado');
  }

  async copyResult(): Promise<void> {
    if (this.mode() === 'match') {
      // Copiamos un resumen de matches
      const rows = this.matches();
      if (!rows.length) return;
      const lines = rows.map((r) => `#${r.index} ${r.start}..${r.end}: ${r.text}`);
      await this.copyToClipboard(lines.join('\n'), 'Resumen de matches copiado');
    } else {
      const res = this.replaceResult();
      if (!res.trim()) return;
      await this.copyToClipboard(res, 'Resultado copiado');
    }
  }

  async copyHighlighted(): Promise<void> {
    const html = this.highlightHtml();
    if (!html) return;
    await this.copyToClipboard(html, 'HTML del resaltado copiado');
  }

  async pasteText(): Promise<void> {
    this.copyMsg.set('');
    try {
      const t = await navigator.clipboard.readText();
      if (typeof t === 'string') this.text.set(t);
    } catch {
      this.copyMsg.set('No se pudo leer del portapapeles (permiso denegado o no disponible).');
    }
  }

  trackByIndex(_: number, row: MatchRow): number {
    return row.index;
  }

  private escapeHtml(s: string): string {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
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
}
