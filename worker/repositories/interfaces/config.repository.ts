export interface ConfigRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
