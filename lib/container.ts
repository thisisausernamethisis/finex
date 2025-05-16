export class Container {
  private static map = new Map<string, unknown>();
  static set<T>(k: string, v: T) { this.map.set(k, v); }
  static get<T>(k: string): T {
    if (!this.map.has(k)) throw new Error(`Missing binding: ${k}`);
    return this.map.get(k) as T;
  }
}
export const TOKEN_PRISMA = 'PrismaClient';
