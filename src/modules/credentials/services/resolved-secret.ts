const REDACTED = '[REDACTED ResolvedSecret]';

/**
 * Request-scoped, in-memory holder for a decrypted credential secret
 * (ADR-0037). The plaintext is kept in a Buffer so it can be wiped, is exposed
 * only through a single-shot {@link use} accessor that zeroes the buffer right
 * after the consumer runs, and is never serialized, logged or stringified
 * (`toJSON`/`toString` redact). The secret must never be persisted, cached or
 * returned to a caller — only handed to the just-in-time dispatch consumer.
 */
export class ResolvedSecret {
  private buffer: Buffer | null;

  private constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  static fromBuffer(buffer: Buffer): ResolvedSecret {
    return new ResolvedSecret(buffer);
  }

  /**
   * Exposes the plaintext to `consumer` exactly once, then zeroes the backing
   * buffer. Throws if the secret has already been used or disposed.
   */
  use<T>(consumer: (secret: string) => T): T {
    if (!this.buffer) {
      throw new Error('Resolved secret has already been used or disposed.');
    }

    const plaintext = this.buffer.toString('utf8');
    try {
      return consumer(plaintext);
    } finally {
      this.zeroize();
    }
  }

  /** Wipes the backing buffer and marks the secret disposed. Idempotent. */
  zeroize(): void {
    if (this.buffer) {
      this.buffer.fill(0);
      this.buffer = null;
    }
  }

  get disposed(): boolean {
    return this.buffer === null;
  }

  toJSON(): string {
    return REDACTED;
  }

  toString(): string {
    return REDACTED;
  }
}
