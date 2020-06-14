import * as SQLite from 'expo-sqlite';
import {createContext} from 'react';

export type EpisodeMeta = {
  url: string;
  showUrl: string;
  favourite: number;
  localFile?: string;
  playPosition: number;
  playDate?: string;
};

export class Database {
  private db: SQLite.Database;

  static async open(): Promise<Database> {
    const db = new Database(SQLite.openDatabase('db'));
    await db.maybeInit();
    return db;
  }

  private constructor(db: SQLite.Database) {
    this.db = db;
  }

  tx(
    stmt: string,
    args?: Array<string | number | undefined>,
  ): Promise<SQLite.SQLResultSet> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(stmt, args, (_tx, results) => {
          resolve(results);
        });
      }, reject);
    });
  }

  async maybeInit() {
    try {
      const meta = await this.tx('SELECT * FROM Meta;');
      console.log('opened database version', meta.rows.item(0).version);
    } catch (e) {
      await this.init();
    }
  }

  async init() {
    console.log('creating database');
    await this.tx('CREATE TABLE Meta (version INT);');
    await this.tx('INSERT INTO Meta (version) VALUES (1);');

    await this.tx(
      'CREATE TABLE EpisodeMeta (url TEXT PRIMARY KEY, showUrl TEXT, favourite INT DEFAULT FALSE, localFile TEXT, playPosition INT DEFAULT 0, playDate TEXT)',
    );
  }

  async fetchEpisodeMeta(showUrl: string): Promise<Map<string, EpisodeMeta>> {
    const res = await this.tx('SELECT * FROM EpisodeMeta WHERE showUrl = ?;', [
      showUrl,
    ]);
    const info = new Map();
    for (let i = 0; i < res.rows.length; i++) {
      const item = res.rows.item(i);
      info.set(item.url, item as EpisodeMeta);
    }

    return info;
  }

  async updateEpisodePlayPosition(
    url: string,
    showUrl: string,
    position: number,
  ): Promise<void> {
    await this.tx(
      `
      INSERT INTO EpisodeMeta (url, showUrl, playPosition)
        VALUES (?, ?, ?)
        ON CONFLICT(url) DO UPDATE SET playPosition=?;
      `,
      [url, showUrl, position, position],
    );
  }

  async updateEpisodePlayDate(
    url: string,
    showUrl: string,
    date?: string,
  ): Promise<void> {
    await this.tx(
      `
        INSERT INTO EpisodeMeta (url, showUrl, playDate)
          VALUES (?, ?, ?)
          ON CONFLICT(url) DO UPDATE SET playDate=?;
        `,
      [url, showUrl, date, date],
    );
  }
}

export const DatabaseContext = createContext<Database>({} as Database);
