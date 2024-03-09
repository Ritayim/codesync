import mariadb, { Pool, PoolConfig } from 'mariadb';
import { poolConfig } from './config/poolConfig';

export async function updateScriptBySysId(tableName: String, sysId: String, script: String) {
    let conn;
    try {
        const host = poolConfig.host;
        const user = poolConfig.user;
        const database = poolConfig.database as string;

        const pool = mariadb.createPool({
            host: host,
            user: user,
            database: database,
            connectionLimit: 10
        });

        conn = await pool.getConnection();
        if (!conn.isValid) {
            console.log("Unable to connect to the database.");
        }

        let query = `SELECT script FROM ${tableName} WHERE sys_id = '${sysId}'`;
        const recordScript = await conn.query(query);

        if (recordScript.length === 0) {
            console.log(`There is no script of ${tableName} with this sys_id ${sysId}`);

            return;
        }

        const escapedScript = script.replace(/['"]/g, '\\$&');
        query = `UPDATE ${tableName} SET script = "${escapedScript}" WHERE sys_id = "${sysId}"`;
        await conn.execute(query);

        return true;
    } catch (err) {
        console.log(err);
    } finally {
        conn?.end();
    }
}