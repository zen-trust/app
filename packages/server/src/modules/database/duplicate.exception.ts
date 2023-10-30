import type { DatabaseError } from 'pg'

export class DuplicateException extends Error {
  public constructor(
    public readonly message: string,
    public readonly databaseError: DatabaseError,
  ) {
    super()
  }
}
