import * as db from 'zapatos/db'
import { Pool } from 'pg'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Connection } from './connection.js'

type DatabaseUrl = `postgresql://${string}:${string}@${string}:${string}/${string}`

@Injectable()
export class DatabaseService {
  private _connection: Connection = new Connection(this.pool)

  public constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  private _pool: Pool | undefined = undefined

  public get pool() {
    if (!this._pool) {
      this._pool = this.createPool()
    }

    return this._pool
  }

  public get db() {
    return db
  }

  public get self() {
    return db.self
  }

  public get sql() {
    return db.sql
  }

  public get param() {
    return db.param
  }

  get selectOne() {
    return this._connection.selectOne.bind(this._connection)
  }

  get selectExactlyOne() {
    return this._connection.selectExactlyOne.bind(this._connection)
  }

  get select() {
    return this._connection.select.bind(this._connection)
  }

  get insert() {
    return this._connection.insert.bind(this._connection)
  }

  get update() {
    return this._connection.update.bind(this._connection)
  }

  get delete() {
    return this._connection.delete.bind(this._connection)
  }

  get count() {
    return this._connection.count.bind(this._connection)
  }

  public serializableTransaction<R>(handler: (context: Connection) => Promise<R>): Promise<R> {
    return db.serializable(this.pool, (transaction) => handler(new Connection(transaction)))
  }

  private createPool() {
    const connectionString = this.configService.get<DatabaseUrl>('DATABASE_URL')
    const pool = new Pool({
      connectionString,
    })
    pool.on('error', (error) => {
      console.error(error)
    })

    return pool
  }
}
