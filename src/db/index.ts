import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

// Helper to wrap client.query so we detect subsequent connection drops and evict client promptly
function wrapClientQuery(client: any, releaseFunc: any) {
  if (client._queryWrapped) return;
  client._queryWrapped = true;

  const originalClientQuery = client.query;

  client.query = function (this: any, ...qArgs: any[]) {
    const qLastArg = qArgs[qArgs.length - 1];
    if (typeof qLastArg === "function") {
      const originalCallback = qLastArg;
      qArgs[qArgs.length - 1] = function (err: any, res: any) {
        if (err) {
          const errMsg = err?.message || "";
          const isConnError =
            errMsg.includes("Connection terminated unexpectedly") ||
            errMsg.includes("closed") ||
            errMsg.includes("ETIMEDOUT") ||
            errMsg.includes("ECONNRESET") ||
            errMsg.includes("socket hang up") ||
            errMsg.includes("idle connection") ||
            errMsg.includes("terminating");
          if (isConnError) {
            console.log(`[DB Info] Stale client callback detected. Evicting connection.`);
            try {
              releaseFunc(err); // Tell pool to destroy the client socket on release
            } catch (e) {}
          }
        }
        originalCallback(err, res);
      };
      return originalClientQuery.apply(this, qArgs);
    }

    // Promise-based query execution on the client
    return originalClientQuery.apply(this, qArgs).catch((err: any) => {
      const errMsg = err?.message || "";
      const isConnError =
        errMsg.includes("Connection terminated unexpectedly") ||
        errMsg.includes("closed") ||
        errMsg.includes("ETIMEDOUT") ||
        errMsg.includes("ECONNRESET") ||
        errMsg.includes("socket hang up") ||
        errMsg.includes("idle connection") ||
        errMsg.includes("terminating");

      if (isConnError) {
        console.log(`[DB Info] Query socket closed. Evicting connection.`);
        try {
          releaseFunc(err); // Destroy connection in pool
        } catch (e) {}
      }
      throw err;
    });
  };
}

// Global query override to use validated connect checks and progressive retries
const originalPoolQuery = Pool.prototype.query;
Pool.prototype.query = function (this: any, ...args: any[]) {
  const lastArg = args[args.length - 1];
  if (typeof lastArg === "function") {
    // Treat callback queries normally (such as pool health checks)
    return originalPoolQuery.apply(this, args);
  }

  // Promise-based execution (using validated checkout & auto-retry) for drizzle queries
  const runWithRetry = async (retries: number): Promise<any> => {
    let client: any = null;
    try {
      client = await this.connect(); // This uses our robust, validated connect!
      const res = await client.query(...args);
      client.release();
      return res;
    } catch (err: any) {
      if (client) {
        try {
          client.release(err);
        } catch (e) {}
      }

      const errMsg = err?.message || "";
      const isConnError =
        errMsg.includes("Connection terminated unexpectedly") ||
        errMsg.includes("closed") ||
        errMsg.includes("ETIMEDOUT") ||
        errMsg.includes("ECONNRESET") ||
        errMsg.includes("socket hang up") ||
        errMsg.includes("idle connection") ||
        errMsg.includes("timeout") ||
        errMsg.includes("terminating");

      if (isConnError && retries > 1) {
        const nextDelay = 1000 + (12 - retries) * 1000; // Progressive delay
        console.log(
          `[DB Info] Retrying query in ${nextDelay}ms... (${retries - 1} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
        return runWithRetry(retries - 1);
      }
      throw err;
    }
  };

  return runWithRetry(10); // retry up to 9 times over a generous window
};

// Override Pool.prototype.connect to validate and auto-verify connections before returning them
const originalPoolConnect = Pool.prototype.connect;
Pool.prototype.connect = function (this: any, ...args: any[]) {
  const lastArg = args[args.length - 1];

  if (typeof lastArg === "function") {
    // Callback-based connect (used internally by some node-postgres extensions)
    const originalCallback = lastArg;
    args[args.length - 1] = function (err: any, client: any, release: any) {
      if (client) {
        wrapClientQuery(client, release);
      }
      originalCallback(err, client, release);
    };
    return originalPoolConnect.apply(this, args);
  }

  // Promise-based connect
  const runConnectWithRetry = async (retries: number): Promise<any> => {
    let client: any = null;
    try {
      client = await originalPoolConnect.apply(this, args);
    } catch (err: any) {
      const errMsg = err?.message || "";
      const isConnError =
        errMsg.includes("Connection terminated unexpectedly") ||
        errMsg.includes("closed") ||
        errMsg.includes("ETIMEDOUT") ||
        errMsg.includes("ECONNRESET") ||
        errMsg.includes("socket hang up") ||
        errMsg.includes("idle connection") ||
        errMsg.includes("timeout") ||
        errMsg.includes("Handshake") ||
        errMsg.includes("terminating");

      if (isConnError && retries > 1) {
        const nextDelay = 1000 + (14 - retries) * 1000;
        console.log(
          `[DB Info] Warming up connection in ${nextDelay}ms... (${retries - 1} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
        return runConnectWithRetry(retries - 1);
      }
      throw err;
    }

    if (client) {
      // Validate the checked-out client with a fast ping query
      try {
        await client.query("SELECT 1;");
        // Validation succeeded! Wrap the client for downstream query error trapping and return it
        wrapClientQuery(client, (releaseErr?: any) => client.release(releaseErr));
        return client;
      } catch (valErr: any) {
        console.log(`[DB Info] Connection validation checking. Evicting stale connection.`);
        try {
          client.release(valErr); // Discard this bad client connection from the pool
        } catch (e) {}
        
        // Re-try connection checkout with a progressive delay
        if (retries > 1) {
          const nextDelay = 500;
          await new Promise((resolve) => setTimeout(resolve, nextDelay));
          return runConnectWithRetry(retries - 1);
        }
        throw valErr;
      }
    }
  };

  return runConnectWithRetry(12); // Retry pool connect up to 11 times
};

export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 30000, // wait up to 30s to hand out client (generous for scale-to-zero boot)
    idleTimeoutMillis: 10000, // close idle connections after 10s to keep pool size clean
    max: 15, // standard stable pool size
    keepAlive: true, // enable TCP Keep-Alive
    keepAliveInitialDelayMillis: 10000, // actively probe connection health every 10s
    ssl: false,
  });
};

const pool = createPool();

pool.on("error", (err: any) => {
  const errMsg = err?.message || "";
  const isConnError =
    errMsg.includes("Connection terminated unexpectedly") ||
    errMsg.includes("closed") ||
    errMsg.includes("ETIMEDOUT") ||
    errMsg.includes("ECONNRESET") ||
    errMsg.includes("socket hang up");
  if (!isConnError) {
    console.log(`[DB Info] Pool client event notice: ${errMsg}`);
  }
});

export const db = drizzle(pool, { schema });
