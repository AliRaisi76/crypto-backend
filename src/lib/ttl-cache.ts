interface Entry<T> {
  value: T
  expiresAt: number
}

export class TtlCache<T> {
  private entries = new Map<string, Entry<T>>()
  private inFlight = new Map<string, Promise<T>>()

  constructor(private readonly ttlMs: number) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key)
    if (hit && hit.expiresAt > Date.now()) return hit.value

    // Another request is already loading this key: wait for it instead
    const pending = this.inFlight.get(key)
    if (pending) return pending

    const promise = load()
      .then((value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs })
        return value
      })
      .finally(() => this.inFlight.delete(key)) // failures are never stored

    this.inFlight.set(key, promise)
    return promise
  }
}
