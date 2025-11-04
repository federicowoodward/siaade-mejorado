import { Injectable, effect, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { PermissionService } from "../auth/permission.service";
import { ROLE, ROLE_IDS, VisibleRole } from "../auth/roles";

export interface Notice {
  id: number;
  title: string;
  content: string;
  visibleFor: VisibleRole;
  createdBy: string;
  createdAt: Date;
}

@Injectable({ providedIn: "root" })
export class NoticesService {
  constructor(private api: ApiService, private permissions: PermissionService) {
    effect(() => {
      const role = this.permissions.currentRole();
      this.loadForRole(role);
    });
  }

  private readonly _notices = signal<Notice[]>([]);
  readonly notices = this._notices.asReadonly();

  async loadForRole(role: ROLE | null) {
    try {
      if (role === ROLE.STUDENT || role === ROLE.TEACHER) {
        const audience = role;
        const data = await this.api
          .request<any[]>("GET", "notices", undefined, { audience })
          .toPromise();
        this._notices.set(this.mapFromApiList(data ?? [], role));
      } else {
        const [a, b] = await Promise.all([
          this.api
            .request<any[]>("GET", "notices", undefined, { audience: "student" })
            .toPromise(),
          this.api
            .request<any[]>("GET", "notices", undefined, { audience: "teacher" })
            .toPromise(),
        ]);
        const merged = this.mergeById([...(a ?? []), ...(b ?? [])]);
        this._notices.set(this.mapFromApiList(merged, ROLE.STUDENT));
      }
    } catch (e) {
      console.error("[Notices] loadForRole error:", e);
      this._notices.set([]);
    }
  }

  async create(input: { title?: string; content: string; visibleFor?: VisibleRole | "all" }) {
    // Validación: el editor puede enviar <p><br></p> u HTML vacío; normalizamos
    const isEmptyHtml = (html: string | undefined | null) => {
      if (!html) return true;
      const text = String(html)
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;|\s|\n|\r/g, "")
        .trim();
      return text.length === 0;
    };

    if (isEmptyHtml(input.content)) {
      throw new Error("El contenido no puede estar vacío.");
    }

      const body: any = {
        title: input.title?.trim() || '',
        content: input.content,
      };
    if (input.visibleFor) body.visibleFor = input.visibleFor;

    try {
      const created = await this.api
        .request<any>("POST", "notices", body)
        .toPromise();
      const role = this.permissions.currentRole();
      await this.loadForRole(role);
      const fallback: VisibleRole = role === ROLE.TEACHER ? ROLE.TEACHER : ROLE.STUDENT;
      return this.mapFromApi(created, fallback, input.title);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || "No se pudo crear el aviso.";
      throw new Error(Array.isArray(msg) ? msg.join("\n") : String(msg));
    }
  }

  async remove(id: number) {
    await this.api.request("DELETE", `notices/${id}`).toPromise();
    this._notices.update((curr) => curr.filter((n) => n.id !== id));
  }

  private mergeById(list: any[]): any[] {
    const map = new Map<number, any>();
    for (const it of list) {
      if (!map.has(it.id)) map.set(it.id, it);
    }
    return Array.from(map.values());
  }

  private mapFromApiList(rows: any[], fallbackRole: VisibleRole): Notice[] {
    return rows.map((r) => this.mapFromApi(r, fallbackRole));
  }

  private mapFromApi(r: any, fallbackRole: VisibleRole, clientTitle?: string): Notice {
    let visibleFor: VisibleRole = fallbackRole;
    if (typeof r.visibleFor === "string") {
      const val = String(r.visibleFor).toLowerCase();
      if (val === ROLE.TEACHER) visibleFor = ROLE.TEACHER;
      else if (val === ROLE.STUDENT) visibleFor = ROLE.STUDENT;
    } else if (typeof r.visibleRoleId === "number") {
      visibleFor = r.visibleRoleId === ROLE_IDS[ROLE.TEACHER] ? ROLE.TEACHER : ROLE.STUDENT;
    }
    const fallbackTitleFromContent = (() => {
      const text = String(r.content ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return text.substring(0, 60) || "Aviso";
    })();
    return {
      id: Number(r.id),
  title: (clientTitle ?? String(r.title ?? "")) || fallbackTitleFromContent,
      content: String(r.content ?? ""),
      visibleFor,
      createdBy: String(r.createdBy ?? "Secretaria"),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    };
  }
}
