/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
const scriptUtil_1 = __webpack_require__(2);
const xmlUtil_1 = __webpack_require__(107);
const fieldConstants_1 = __webpack_require__(120);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('codesync.sync', () => {
        vscode.window.showInformationMessage("Codesync is activated!");
    }));
}
exports.activate = activate;
vscode.workspace.onDidSaveTextDocument((document) => {
    syncDocument(document);
});
async function syncDocument(document) {
    if (document.languageId !== 'xml' || document.isDirty) {
        return;
    }
    const xmlObject = (0, xmlUtil_1.parseXMLtoJSON)(document.fileName);
    const sysIdKeyValue = (0, xmlUtil_1.findKeyAndValue)(xmlObject, fieldConstants_1.SYS_ID);
    const sysClassNameKeyValue = (0, xmlUtil_1.findKeyAndValue)(xmlObject, fieldConstants_1.SYS_CLASS_NAME);
    const scriptKeyValue = (0, xmlUtil_1.findKeyAndValue)(xmlObject, fieldConstants_1.SCRIPT);
    if (sysIdKeyValue === undefined || sysClassNameKeyValue === undefined || scriptKeyValue === undefined) {
        console.log(`${fieldConstants_1.SYS_CLASS_NAME} or ${fieldConstants_1.SYS_ID} or ${fieldConstants_1.SCRIPT} is not defined in the xml`);
        return;
    }
    const updateResult = await (0, scriptUtil_1.updateScriptBySysId)(sysClassNameKeyValue?.value, sysIdKeyValue?.value, scriptKeyValue?.value);
    if (updateResult) {
        vscode.window.showInformationMessage("Your code is synced to your instance.");
    }
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateScriptBySysId = void 0;
const mariadb_1 = __importDefault(__webpack_require__(3));
const poolConfig_1 = __webpack_require__(106);
async function updateScriptBySysId(tableName, sysId, script) {
    let conn;
    try {
        const host = poolConfig_1.poolConfig.host;
        const user = poolConfig_1.poolConfig.user;
        const database = poolConfig_1.poolConfig.database;
        const pool = mariadb_1.default.createPool({
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
    }
    catch (err) {
        console.log(err);
    }
    finally {
        conn?.end();
    }
}
exports.updateScriptBySysId = updateScriptBySysId;


/***/ }),
/* 3 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



__webpack_require__(4);

const Connection = __webpack_require__(6);
const ConnectionPromise = __webpack_require__(96);
const PoolPromise = __webpack_require__(98);
const Cluster = __webpack_require__(100);

const ConnOptions = __webpack_require__(52);
const PoolOptions = __webpack_require__(102);
const ClusterOptions = __webpack_require__(101);
const CommandParameter = __webpack_require__(87);

module.exports.version = __webpack_require__(5).version;
module.exports.SqlError = __webpack_require__(13).SqlError;

module.exports.defaultOptions = function defaultOptions(opts) {
  const connOpts = new ConnOptions(opts);
  const res = {};
  for (const [key, value] of Object.entries(connOpts)) {
    if (!key.startsWith('_')) {
      res[key] = value;
    }
  }
  return res;
};

module.exports.createConnection = function createConnection(opts) {
  try {
    const options = new ConnOptions(opts);
    const conn = new Connection(options);
    const connPromise = new ConnectionPromise(conn);

    return conn.connect().then(() => Promise.resolve(connPromise));
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports.createPool = function createPool(opts) {
  const options = new PoolOptions(opts);
  const pool = new PoolPromise(options);
  // adding a default error handler to avoid exiting application on connection error.
  pool.on('error', (err) => {});
  return pool;
};

module.exports.createPoolCluster = function createPoolCluster(opts) {
  const options = new ClusterOptions(opts);
  return new Cluster(options);
};

module.exports.importFile = function importFile(opts) {
  try {
    const options = new ConnOptions(opts);
    const conn = new Connection(options);

    return conn
      .connect()
      .then(() => {
        return new Promise(conn.importFile.bind(conn, Object.assign({ skipDbCheck: true }, opts)));
      })
      .finally(() => {
        new Promise(conn.end.bind(conn, new CommandParameter())).catch(console.log);
      });
  } catch (err) {
    return Promise.reject(err);
  }
};


/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const hasMinVersion = function (nodeVersionStr, connectorRequirement) {
  const versNode = nodeVersionStr.split('.');
  const versReq = connectorRequirement.split('.');

  const majorNode = Number(versNode[0]);
  const majorReq = Number(versReq[0]);
  if (majorNode > majorReq) return true;
  if (majorNode < majorReq) return false;

  if (versReq.length === 1) return true;

  const minorNode = Number(versNode[1]);
  const minorReq = Number(versReq[1]);
  if (minorNode > minorReq) return true;
  if (minorNode < minorReq) return false;

  return true;
};

module.exports.hasMinVersion = hasMinVersion;

const requirement = (__webpack_require__(5).engines.node);
const connectorRequirement = requirement.replace('>=', '').trim();
const currentNodeVersion = process.version.replace('v', '');
if (!hasMinVersion(currentNodeVersion, connectorRequirement)) {
  console.error(`please upgrade node: mariadb requires at least version ${connectorRequirement}`);
  process.exit(1);
}


/***/ }),
/* 5 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"_from":"mariadb","_id":"mariadb@3.2.3","_inBundle":false,"_integrity":"sha512-Hyc1ehdUJwzvvzcLU2juZS528wJ6oE8pUlpgY0BAOdpKWcdN1motuugi5lC3jkpCkFpyNknHG7Yg66KASl3aPg==","_location":"/mariadb","_phantomChildren":{},"_requested":{"type":"tag","registry":true,"raw":"mariadb","name":"mariadb","escapedName":"mariadb","rawSpec":"","saveSpec":null,"fetchSpec":"latest"},"_requiredBy":["#USER","/"],"_resolved":"https://artifact.devsnc.com/repository/npm-all/mariadb/-/mariadb-3.2.3.tgz","_shasum":"29ae69e678a25b355f4af0605b99b112c5ba7c5b","_spec":"mariadb","_where":"/Users/pichsorita.yim/git/snc/codesync/codesync","author":{"name":"Diego Dupin","email":"diego.dupin@mariadb.com"},"bugs":{"url":"https://jira.mariadb.org/projects/CONJS/"},"bundleDependencies":false,"dependencies":{"@types/geojson":"^7946.0.10","@types/node":"^17.0.45","denque":"^2.1.0","iconv-lite":"^0.6.3","lru-cache":"^10.0.1"},"deprecated":false,"description":"fast mariadb or mysql connector.","devDependencies":{"@typescript-eslint/eslint-plugin":"^6.6.0","@typescript-eslint/parser":"^6.6.0","benchmark":"^2.1.4","chai":"^4.3.8","chalk":"^4.1.2","dom-parser":"^0.1.6","error-stack-parser":"^2.1.4","eslint":"^8.48.0","eslint-config-prettier":"^9.0.0","eslint-plugin-markdown":"^3.0.1","eslint-plugin-prettier":"^5.0.0","mocha":"^10.2.0","mocha-lcov-reporter":"^1.3.0","nyc":"^15.1.0","prettier":"^3.0.3","typescript":"^4.9.5","winston":"^3.10.0"},"directories":{"lib":"lib","test":"test"},"engines":{"node":">= 12"},"files":["lib","types/index.d.ts","promise.js","check-node.js","callback.js"],"homepage":"https://github.com/mariadb-corporation/mariadb-connector-nodejs#readme","keywords":["mariadb","mysql","client","driver","connector"],"license":"LGPL-2.1-or-later","main":"promise.js","name":"mariadb","private":false,"repository":{"type":"git","url":"git+https://github.com/mariadb-corporation/mariadb-connector-nodejs.git"},"scripts":{"benchmark":"node benchmarks/benchmarks-all.js","coverage":"npm run coverage:test && npm run coverage:create && npm run coverage:send","coverage:create":"nyc report --reporter=text-lcov > coverage.lcov","coverage:report":"npm run coverage:create && npm run coverage:send","coverage:send":"./codecov --disable=gcov","coverage:test":"nyc mocha --no-parallel --timeout 5000 \\"test/**/*.js\\"","generate":"node ./tools/generate-mariadb.js","test":"npm run test:types-prettier && npm run test:prettier && npm run test:types && npm run test:lint && npm run test:base","test:base":"mocha --no-parallel --timeout 5000 \\"test/**/*.js\\" ","test:lint":"eslint \\"*.js\\" \\"{lib,test}/**/*.js\\" ","test:prettier":"prettier --write \\"*.js\\" \\"{tools,lib,test,benchmarks}/**/*.js\\"","test:types":"eslint \\"types/*.ts\\" ","test:types-prettier":"prettier --write \\"types/*.ts\\""},"types":"types/index.d.ts","version":"3.2.3"}');

/***/ }),
/* 6 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const EventEmitter = __webpack_require__(7);
const Queue = __webpack_require__(8);
const Net = __webpack_require__(9);
const PacketInputStream = __webpack_require__(10);
const PacketOutputStream = __webpack_require__(44);
const CompressionInputStream = __webpack_require__(45);
const CompressionOutputStream = __webpack_require__(47);
const ServerStatus = __webpack_require__(48);
const ConnectionInformation = __webpack_require__(49);
const tls = __webpack_require__(50);
const Errors = __webpack_require__(13);
const Utils = __webpack_require__(42);
const Capabilities = __webpack_require__(51);
const ConnectionOptions = __webpack_require__(52);

/*commands*/
const Authentication = __webpack_require__(53);
const Quit = __webpack_require__(70);
const Ping = __webpack_require__(71);
const Reset = __webpack_require__(72);
const Query = __webpack_require__(73);
const Prepare = __webpack_require__(82);
const OkPacket = __webpack_require__(81);
const Execute = __webpack_require__(89);
const ClosePrepare = __webpack_require__(90);
const BatchBulk = __webpack_require__(91);
const ChangeUser = __webpack_require__(92);
const { Status } = __webpack_require__(93);
const CommandParameter = __webpack_require__(87);
const LruPrepareCache = __webpack_require__(94);
const fsPromises = (__webpack_require__(68).promises);
const Parse = __webpack_require__(78);
const Collations = __webpack_require__(41);
const ConnOptions = __webpack_require__(52);

const convertFixedTime = function (tz, conn) {
  if (tz === 'UTC' || tz === 'Etc/UTC' || tz === 'Z' || tz === 'Etc/GMT') {
    return '+00:00';
  } else if (tz.startsWith('Etc/GMT') || tz.startsWith('GMT')) {
    let tzdiff;
    let negate;

    // strangely Etc/GMT+8 = GMT-08:00 = offset -8
    if (tz.startsWith('Etc/GMT')) {
      tzdiff = tz.substring(7);
      negate = !tzdiff.startsWith('-');
    } else {
      tzdiff = tz.substring(3);
      negate = tzdiff.startsWith('-');
    }
    let diff = parseInt(tzdiff.substring(1));
    if (isNaN(diff)) {
      throw Errors.createFatalError(
        `Automatic timezone setting fails. wrong Server timezone '${tz}' conversion to +/-HH:00 conversion.`,
        Errors.ER_WRONG_AUTO_TIMEZONE,
        conn.info
      );
    }
    return (negate ? '-' : '+') + (diff >= 10 ? diff : '0' + diff) + ':00';
  }
  return tz;
};
const redirectUrlFormat = /(mariadb|mysql):\/\/(([^/@:]+)?(:([^/]+))?@)?(([^/:]+)(:([0-9]+))?)(\/([^?]+)(\?(.*))?)?$/;

/**
 * New Connection instance.
 *
 * @param options    connection options
 * @returns Connection instance
 * @constructor
 * @fires Connection#connect
 * @fires Connection#end
 * @fires Connection#error
 *
 */
class Connection extends EventEmitter {
  opts;
  sendQueue = new Queue();
  receiveQueue = new Queue();
  waitingAuthenticationQueue = new Queue();
  status = Status.NOT_CONNECTED;
  socket = null;
  timeout = null;
  addCommand;
  streamOut;
  streamIn;
  info;
  prepareCache;

  constructor(options) {
    super();

    this.opts = Object.assign(new EventEmitter(), options);
    this.info = new ConnectionInformation(this.opts, this.redirect.bind(this));
    this.prepareCache =
      this.opts.prepareCacheLength > 0 ? new LruPrepareCache(this.info, this.opts.prepareCacheLength) : null;
    this.addCommand = this.addCommandQueue;
    this.streamOut = new PacketOutputStream(this.opts, this.info);
    this.streamIn = new PacketInputStream(
      this.unexpectedPacket.bind(this),
      this.receiveQueue,
      this.streamOut,
      this.opts,
      this.info
    );

    this.on('close_prepare', this._closePrepare.bind(this));
    this.escape = Utils.escape.bind(this, this.opts, this.info);
    this.escapeId = Utils.escapeId.bind(this, this.opts, this.info);
  }

  //*****************************************************************
  // public methods
  //*****************************************************************

  /**
   * Connect event
   *
   * @returns {Promise} promise
   */
  connect() {
    const conn = this;
    this.status = Status.CONNECTING;
    const authenticationParam = new CommandParameter(null, null, this.opts, null);
    return new Promise(function (resolve, reject) {
      conn.connectRejectFct = reject;
      conn.connectResolveFct = resolve;
      // add a handshake to msg queue
      const authentication = new Authentication(
        authenticationParam,
        conn.authSucceedHandler.bind(conn),
        conn.authFailHandler.bind(conn),
        conn.createSecureContext.bind(conn),
        conn.getSocket.bind(conn)
      );
      Error.captureStackTrace(authentication);

      authentication.once('end', () => {
        conn.receiveQueue.shift();
        // conn.info.collation might not be initialized
        // in case of handshake throwing error
        if (!conn.opts.collation && conn.info.collation) {
          conn.opts.emit('collation', conn.info.collation);
        }
        process.nextTick(conn.nextSendCmd.bind(conn));
      });

      conn.receiveQueue.push(authentication);
      conn.streamInitSocket.call(conn);
    });
  }

  executePromise(cmdParam, prepare, resolve, reject) {
    const cmd = new Execute(resolve, this._logAndReject.bind(this, reject), this.opts, cmdParam, prepare);
    this.addCommand(cmd);
  }

  batch(cmdParam) {
    if (!cmdParam.sql) {
      const err = Errors.createError(
        'sql parameter is mandatory',
        Errors.ER_UNDEFINED_SQL,
        this.info,
        'HY000',
        null,
        false,
        cmdParam.stack
      );
      if (this.opts.logger.error) this.opts.logger.error(err);
      return Promise.reject(err);
    }
    if (!cmdParam.values) {
      const err = Errors.createError(
        'Batch must have values set',
        Errors.ER_BATCH_WITH_NO_VALUES,
        this.info,
        'HY000',
        cmdParam.sql.length > this.opts.debugLen ? cmdParam.sql.substring(0, this.opts.debugLen) + '...' : cmdParam.sql,
        false,
        cmdParam.stack
      );
      if (this.opts.logger.error) this.opts.logger.error(err);
      return Promise.reject(err);
    }

    return new Promise(this.prepare.bind(this, cmdParam)).then((prepare) => {
      const usePlaceHolder = (cmdParam.opts && cmdParam.opts.namedPlaceholders) || this.opts.namedPlaceholders;
      let vals;
      if (Array.isArray(cmdParam.values)) {
        if (usePlaceHolder) {
          vals = cmdParam.values;
        } else if (Array.isArray(cmdParam.values[0])) {
          vals = cmdParam.values;
        } else if (prepare.parameterCount === 1) {
          vals = [];
          for (let i = 0; i < cmdParam.values.length; i++) {
            vals.push([cmdParam.values[i]]);
          }
        } else {
          vals = [cmdParam.values];
        }
      } else {
        vals = [[cmdParam.values]];
      }
      cmdParam.values = vals;
      let useBulk = this._canUseBulk(vals, cmdParam.opts);
      if (useBulk) {
        return new Promise(this.executeBulkPromise.bind(this, cmdParam, prepare, this.opts));
      } else {
        const executes = [];
        const cmdOpt = Object.assign({}, this.opts, cmdParam.opts);
        for (let i = 0; i < vals.length; i++) {
          executes.push(prepare.execute(vals[i], cmdParam.opts, null, cmdParam.stack));
        }
        return Promise.all(executes)
          .then(
            function (res) {
              if (cmdParam.opts && cmdParam.opts.fullResult) {
                return Promise.resolve(res);
              } else {
                // aggregate results
                let firstResult = res[0];
                if (cmdOpt.metaAsArray) firstResult = firstResult[0];
                if (firstResult instanceof OkPacket) {
                  let affectedRows = 0;
                  const insertId = firstResult.insertId;
                  const warningStatus = firstResult.warningStatus;
                  if (cmdOpt.metaAsArray) {
                    for (let i = 0; i < res.length; i++) {
                      affectedRows += res[i][0].affectedRows;
                    }
                    return Promise.resolve([new OkPacket(affectedRows, insertId, warningStatus), []]);
                  } else {
                    for (let i = 0; i < res.length; i++) {
                      affectedRows += res[i].affectedRows;
                    }
                    return Promise.resolve(new OkPacket(affectedRows, insertId, warningStatus));
                  }
                } else {
                  // results have result-set. example :'INSERT ... RETURNING'
                  // aggregate results
                  if (cmdOpt.metaAsArray) {
                    const rs = [];
                    res.forEach((row) => {
                      rs.push(...row[0]);
                    });
                    return Promise.resolve([rs, res[0][1]]);
                  } else {
                    const rs = [];
                    res.forEach((row) => {
                      rs.push(...row);
                    });
                    Object.defineProperty(rs, 'meta', {
                      value: res[0].meta,
                      writable: true,
                      enumerable: this.opts.metaEnumerable
                    });
                    return Promise.resolve(rs);
                  }
                }
              }
            }.bind(this)
          )
          .finally(() => prepare.close());
      }
    });
  }

  executeBulkPromise(cmdParam, prepare, opts, resolve, reject) {
    const cmd = new BatchBulk(
      (res) => {
        prepare.close();
        return resolve(res);
      },
      function (err) {
        prepare.close();
        if (opts.logger.error) opts.logger.error(err);
        reject(err);
      },
      opts,
      prepare,
      cmdParam
    );
    this.addCommand(cmd);
  }

  /**
   * Send an empty MySQL packet to ensure connection is active, and reset @@wait_timeout
   * @param cmdParam command context
   * @param resolve success function
   * @param reject rejection function
   */
  ping(cmdParam, resolve, reject) {
    if (cmdParam.opts && cmdParam.opts.timeout) {
      if (cmdParam.opts.timeout < 0) {
        const err = Errors.createError(
          'Ping cannot have negative timeout value',
          Errors.ER_BAD_PARAMETER_VALUE,
          this.info,
          '0A000'
        );
        if (this.opts.logger.error) this.opts.logger.error(err);
        reject(err);
        return;
      }
      let tOut = setTimeout(
        function () {
          tOut = undefined;
          const err = Errors.createFatalError('Ping timeout', Errors.ER_PING_TIMEOUT, this.info, '0A000');
          if (this.opts.logger.error) this.opts.logger.error(err);
          // close connection
          this.addCommand = this.addCommandDisabled;
          clearTimeout(this.timeout);
          if (this.status !== Status.CLOSING && this.status !== Status.CLOSED) {
            this.sendQueue.clear();
            this.status = Status.CLOSED;
            this.socket.destroy();
          }
          this.clear();
          reject(err);
        }.bind(this),
        cmdParam.opts.timeout
      );
      this.addCommand(
        new Ping(
          cmdParam,
          () => {
            if (tOut) {
              clearTimeout(tOut);
              resolve();
            }
          },
          (err) => {
            if (this.opts.logger.error) this.opts.logger.error(err);
            clearTimeout(tOut);
            reject(err);
          }
        )
      );
      return;
    }
    this.addCommand(new Ping(cmdParam, resolve, reject));
  }

  /**
   * Send a reset command that will
   * - rollback any open transaction
   * - reset transaction isolation level
   * - reset session variables
   * - delete user variables
   * - remove temporary tables
   * - remove all PREPARE statement
   */
  reset(cmdParam, resolve, reject) {
    if (
      (this.info.isMariaDB() && this.info.hasMinVersion(10, 2, 4)) ||
      (!this.info.isMariaDB() && this.info.hasMinVersion(5, 7, 3))
    ) {
      const conn = this;
      const resetCmd = new Reset(
        cmdParam,
        () => {
          conn.prepareCache.reset();
          let prom = Promise.resolve();
          // re-execute init query / session query timeout
          prom
            .then(conn.handleCharset.bind(conn))
            .then(conn.handleTimezone.bind(conn))
            .then(conn.executeInitQuery.bind(conn))
            .then(conn.executeSessionTimeout.bind(conn))
            .then(resolve)
            .catch(reject);
        },
        reject
      );
      this.addCommand(resetCmd);
      return;
    }

    const err = new Error(
      `Reset command not permitted for server ${this.info.serverVersion.raw} (requires server MariaDB version 10.2.4+ or MySQL 5.7.3+)`
    );
    err.stack = cmdParam.stack;
    if (this.opts.logger.error) this.opts.logger.error(err);
    reject(err);
  }

  /**
   * Indicates the state of the connection as the driver knows it
   * @returns {boolean}
   */
  isValid() {
    return this.status === Status.CONNECTED;
  }

  /**
   * Terminate connection gracefully.
   */
  end(cmdParam, resolve, reject) {
    this.addCommand = this.addCommandDisabled;
    clearTimeout(this.timeout);

    if (this.status < Status.CLOSING && this.status !== Status.NOT_CONNECTED) {
      this.status = Status.CLOSING;
      const ended = () => {
        this.status = Status.CLOSED;
        this.socket.destroy();
        this.socket.unref();
        this.clear();
        this.receiveQueue.clear();
        resolve();
      };
      const quitCmd = new Quit(cmdParam, ended, ended);
      this.sendQueue.push(quitCmd);
      this.receiveQueue.push(quitCmd);
      if (this.sendQueue.length === 1) {
        process.nextTick(this.nextSendCmd.bind(this));
      }
    } else resolve();
  }

  /**
   * Force connection termination by closing the underlying socket and killing server process if any.
   */
  destroy() {
    this.addCommand = this.addCommandDisabled;
    clearTimeout(this.timeout);
    if (this.status < Status.CLOSING) {
      this.status = Status.CLOSING;
      this.sendQueue.clear();
      if (this.receiveQueue.length > 0) {
        //socket is closed, but server may still be processing a huge select
        //only possibility is to kill process by another thread
        //TODO reuse a pool connection to avoid connection creation
        const self = this;

        // relying on IP in place of DNS to ensure using same server
        const remoteAddress = this.socket.remoteAddress;
        const connOption = remoteAddress ? Object.assign({}, this.opts, { host: remoteAddress }) : this.opts;

        const killCon = new Connection(connOption);
        killCon
          .connect()
          .then(() => {
            //*************************************************
            //kill connection
            //*************************************************
            new Promise(killCon.query.bind(killCon, { sql: `KILL ${self.info.threadId}` })).finally((err) => {
              const destroyError = Errors.createFatalError(
                'Connection destroyed, command was killed',
                Errors.ER_CMD_NOT_EXECUTED_DESTROYED,
                self.info
              );
              if (self.opts.logger.error) self.opts.logger.error(destroyError);
              self.socketErrorDispatchToQueries(destroyError);
              if (self.socket) {
                const sok = self.socket;
                process.nextTick(() => {
                  sok.destroy();
                });
              }
              self.status = Status.CLOSED;
              self.clear();
              new Promise(killCon.end.bind(killCon)).catch(() => {});
            });
          })
          .catch(() => {
            //*************************************************
            //failing to create a kill connection, end normally
            //*************************************************
            const ended = () => {
              let sock = self.socket;
              self.clear();
              self.status = Status.CLOSED;
              sock.destroy();
              self.receiveQueue.clear();
            };
            const quitCmd = new Quit(ended, ended);
            self.sendQueue.push(quitCmd);
            self.receiveQueue.push(quitCmd);
            if (self.sendQueue.length === 1) {
              process.nextTick(self.nextSendCmd.bind(self));
            }
          });
      } else {
        this.status = Status.CLOSED;
        this.socket.destroy();
        this.clear();
      }
    }
  }

  pause() {
    this.socket.pause();
  }

  resume() {
    this.socket.resume();
  }

  format(sql, values) {
    const err = Errors.createError(
      '"Connection.format intentionally not implemented. please use Connection.query(sql, values), it will be more secure and faster',
      Errors.ER_NOT_IMPLEMENTED_FORMAT,
      this.info,
      '0A000'
    );
    if (this.opts.logger.error) this.opts.logger.error(err);
    throw err;
  }

  //*****************************************************************
  // additional public methods
  //*****************************************************************

  /**
   * return current connected server version information.
   *
   * @returns {*}
   */
  serverVersion() {
    if (!this.info.serverVersion) {
      const err = new Error('cannot know if server information until connection is established');
      if (this.opts.logger.error) this.opts.logger.error(err);
      throw err;
    }

    return this.info.serverVersion.raw;
  }

  /**
   * Change option "debug" during connection.
   * @param val   debug value
   */
  debug(val) {
    if (typeof val === 'boolean') {
      if (val && !this.opts.logger.network) this.opts.logger.network = console.log;
    } else if (typeof val === 'function') {
      this.opts.logger.network = val;
    }
    this.opts.emit('debug', val);
  }

  debugCompress(val) {
    if (val) {
      if (typeof val === 'boolean') {
        this.opts.debugCompress = val;
        if (val && !this.opts.logger.network) this.opts.logger.network = console.log;
      } else if (typeof val === 'function') {
        this.opts.debugCompress = true;
        this.opts.logger.network = val;
      }
    } else this.opts.debugCompress = false;
  }

  //*****************************************************************
  // internal public testing methods
  //*****************************************************************

  get __tests() {
    return new TestMethods(this.info.collation, this.socket);
  }

  //*****************************************************************
  // internal methods
  //*****************************************************************

  /**
   * Use multiple COM_STMT_EXECUTE or COM_STMT_BULK_EXECUTE
   *
   * @param values current batch values
   * @param _options batch option
   * @return {boolean} indicating if can use bulk command
   */
  _canUseBulk(values, _options) {
    if (_options && _options.fullResult) return false;
    // not using info.isMariaDB() directly in case of callback use,
    // without connection being completely finished.
    const bulkEnable =
      _options === undefined || _options === null
        ? this.opts.bulk
        : _options.bulk !== undefined && _options.bulk !== null
        ? _options.bulk
        : this.opts.bulk;
    if (
      this.info.serverVersion &&
      this.info.serverVersion.mariaDb &&
      this.info.hasMinVersion(10, 2, 7) &&
      bulkEnable &&
      (this.info.serverCapabilities & Capabilities.MARIADB_CLIENT_STMT_BULK_OPERATIONS) > 0n
    ) {
      //ensure that there is no stream object
      if (values !== undefined) {
        if (!this.opts.namedPlaceholders) {
          //ensure that all parameters have same length
          //single array is considered as an array of single element.
          const paramLen = Array.isArray(values[0]) ? values[0].length : values[0] ? 1 : 0;
          if (paramLen === 0) return false;
          for (let r = 0; r < values.length; r++) {
            let row = values[r];
            if (!Array.isArray(row)) row = [row];
            if (paramLen !== row.length) {
              return false;
            }
            // streaming data not permitted
            for (let j = 0; j < paramLen; j++) {
              const val = row[j];
              if (
                val != null &&
                typeof val === 'object' &&
                typeof val.pipe === 'function' &&
                typeof val.read === 'function'
              ) {
                return false;
              }
            }
          }
        } else {
          for (let r = 0; r < values.length; r++) {
            let row = values[r];
            const keys = Object.keys(row);
            for (let j = 0; j < keys.length; j++) {
              const val = row[keys[j]];
              if (
                val != null &&
                typeof val === 'object' &&
                typeof val.pipe === 'function' &&
                typeof val.read === 'function'
              ) {
                return false;
              }
            }
          }
        }
      }
      return true;
    }
    return false;
  }

  executeSessionVariableQuery() {
    if (this.opts.sessionVariables) {
      const values = [];
      let sessionQuery = 'set ';
      let keys = Object.keys(this.opts.sessionVariables);
      if (keys.length > 0) {
        for (let k = 0; k < keys.length; ++k) {
          sessionQuery += (k !== 0 ? ',' : '') + '@@' + keys[k].replace(/[^a-z0-9_]/gi, '') + '=?';
          values.push(this.opts.sessionVariables[keys[k]]);
        }

        return new Promise(this.query.bind(this, new CommandParameter(sessionQuery, values))).catch((initialErr) => {
          const err = Errors.createFatalError(
            `Error setting session variable (value ${JSON.stringify(this.opts.sessionVariables)}). Error: ${
              initialErr.message
            }`,
            Errors.ER_SETTING_SESSION_ERROR,
            this.info,
            '08S01',
            sessionQuery
          );
          if (this.opts.logger.error) this.opts.logger.error(err);
          return Promise.reject(err);
        });
      }
    }
    return Promise.resolve();
  }

  /**
   * set charset to utf8
   * @returns {Promise<void>}
   * @private
   */
  handleCharset() {
    if (this.opts.collation) {
      if (this.opts.collation.index < 255) return Promise.resolve();
      const charset =
        this.opts.collation.charset === 'utf8' && this.opts.collation.maxLength === 4
          ? 'utf8mb4'
          : this.opts.collation.charset;
      return new Promise(
        this.query.bind(this, new CommandParameter(`SET NAMES ${charset} COLLATE ${this.opts.collation.name}`))
      );
    }

    // MXS-4635: server can some information directly on first Ok_Packet, like not truncated collation
    // in this case, avoid useless SET NAMES utf8mb4 command
    if (!this.opts.charset && this.info.collation.charset === 'utf8' && this.info.collation.maxLength === 4) {
      return Promise.resolve();
    }

    return new Promise(
      this.query.bind(this, new CommandParameter(`SET NAMES ${this.opts.charset ? this.opts.charset : 'utf8mb4'}`))
    );
  }

  /**
   * Asking server timezone if not set in case of 'auto'
   * @returns {Promise<void>}
   * @private
   */
  handleTimezone() {
    const conn = this;
    if (this.opts.timezone === 'local') this.opts.timezone = undefined;
    if (this.opts.timezone === 'auto') {
      return new Promise(
        this.query.bind(this, new CommandParameter('SELECT @@system_time_zone stz, @@time_zone tz'))
      ).then((res) => {
        const serverTimezone = res[0].tz === 'SYSTEM' ? res[0].stz : res[0].tz;
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (serverTimezone === localTz || convertFixedTime(serverTimezone, conn) === convertFixedTime(localTz, conn)) {
          //server timezone is identical to client tz, skipping setting
          this.opts.timezone = localTz;
          return Promise.resolve();
        }
        return this._setSessionTimezone(convertFixedTime(localTz, conn));
      });
    }

    if (this.opts.timezone) {
      return this._setSessionTimezone(convertFixedTime(this.opts.timezone, conn));
    }
    return Promise.resolve();
  }

  _setSessionTimezone(tz) {
    return new Promise(this.query.bind(this, new CommandParameter('SET time_zone=?', [tz]))).catch((err) => {
      const er = Errors.createFatalError(
        `setting timezone '${tz}' fails on server.\n look at https://mariadb.com/kb/en/mysql_tzinfo_to_sql/ to load IANA timezone. `,
        Errors.ER_WRONG_IANA_TIMEZONE,
        this.info
      );
      if (this.opts.logger.error) this.opts.logger.error(er);
      return Promise.reject(er);
    });
  }

  checkServerVersion() {
    if (!this.opts.forceVersionCheck) {
      return Promise.resolve();
    }
    return new Promise(this.query.bind(this, new CommandParameter('SELECT @@VERSION AS v'))).then(
      function (res) {
        this.info.serverVersion.raw = res[0].v;
        this.info.serverVersion.mariaDb = this.info.serverVersion.raw.includes('MariaDB');
        ConnectionInformation.parseVersionString(this.info);
        return Promise.resolve();
      }.bind(this)
    );
  }

  executeInitQuery() {
    if (this.opts.initSql) {
      const initialArr = Array.isArray(this.opts.initSql) ? this.opts.initSql : [this.opts.initSql];
      const initialPromises = [];
      initialArr.forEach((sql) => {
        initialPromises.push(new Promise(this.query.bind(this, new CommandParameter(sql))));
      });

      return Promise.all(initialPromises).catch((initialErr) => {
        const err = Errors.createFatalError(
          `Error executing initial sql command: ${initialErr.message}`,
          Errors.ER_INITIAL_SQL_ERROR,
          this.info
        );
        if (this.opts.logger.error) this.opts.logger.error(err);
        return Promise.reject(err);
      });
    }
    return Promise.resolve();
  }

  executeSessionTimeout() {
    if (this.opts.queryTimeout) {
      if (this.info.isMariaDB() && this.info.hasMinVersion(10, 1, 2)) {
        const query = `SET max_statement_time=${this.opts.queryTimeout / 1000}`;
        new Promise(this.query.bind(this, new CommandParameter(query))).catch(
          function (initialErr) {
            const err = Errors.createFatalError(
              `Error setting session queryTimeout: ${initialErr.message}`,
              Errors.ER_INITIAL_TIMEOUT_ERROR,
              this.info,
              '08S01',
              query
            );
            if (this.opts.logger.error) this.opts.logger.error(err);
            return Promise.reject(err);
          }.bind(this)
        );
      } else {
        const err = Errors.createError(
          `Can only use queryTimeout for MariaDB server after 10.1.1. queryTimeout value: ${this.opts.queryTimeout}`,
          Errors.ER_TIMEOUT_NOT_SUPPORTED,
          this.info,
          'HY000',
          this.opts.queryTimeout
        );
        if (this.opts.logger.error) this.opts.logger.error(err);
        return Promise.reject(err);
      }
    }
    return Promise.resolve();
  }

  getSocket() {
    return this.socket;
  }

  /**
   * Initialize socket and associate events.
   * @private
   */
  streamInitSocket() {
    if (this.opts.connectTimeout) {
      this.timeout = setTimeout(this.connectTimeoutReached.bind(this), this.opts.connectTimeout, Date.now());
    }
    if (this.opts.socketPath) {
      this.socket = Net.connect(this.opts.socketPath);
    } else if (this.opts.stream) {
      if (typeof this.opts.stream === 'function') {
        const tmpSocket = this.opts.stream(
          function (err, stream) {
            if (err) {
              this.authFailHandler(err);
              return;
            }
            this.socket = stream ? stream : Net.connect(this.opts.port, this.opts.host);
            this.socketInit();
          }.bind(this)
        );
        if (tmpSocket) {
          this.socket = tmpSocket;
          this.socketInit();
        }
      } else {
        this.authFailHandler(
          Errors.createError(
            'stream option is not a function. stream must be a function with (error, callback) parameter',
            Errors.ER_BAD_PARAMETER_VALUE,
            this.info
          )
        );
      }
      return;
    } else {
      this.socket = Net.connect(this.opts.port, this.opts.host);
      this.socket.setNoDelay(true);
    }
    this.socketInit();
  }

  socketInit() {
    this.socket.on('data', this.streamIn.onData.bind(this.streamIn));
    this.socket.on('error', this.socketErrorHandler.bind(this));
    this.socket.on('end', this.socketErrorHandler.bind(this));
    this.socket.on(
      'connect',
      function () {
        if (this.status === Status.CONNECTING) {
          this.status = Status.AUTHENTICATING;
          this.socket.setTimeout(this.opts.socketTimeout, this.socketTimeoutReached.bind(this));
          this.socket.setNoDelay(true);

          // keep alive for socket. This won't reset server wait_timeout use pool option idleTimeout for that
          if (this.opts.keepAliveDelay) {
            this.socket.setKeepAlive(true, this.opts.keepAliveDelay);
          }
        }
      }.bind(this)
    );

    this.socket.writeBuf = (buf) => this.socket.write(buf);
    this.socket.flush = () => {};
    this.streamOut.setStream(this.socket);
  }

  /**
   * Authentication success result handler.
   *
   * @private
   */
  authSucceedHandler() {
    //enable packet compression according to option
    if (this.opts.compress) {
      if (this.info.serverCapabilities & Capabilities.COMPRESS) {
        this.streamOut.setStream(new CompressionOutputStream(this.socket, this.opts, this.info));
        this.streamIn = new CompressionInputStream(this.streamIn, this.receiveQueue, this.opts, this.info);
        this.socket.removeAllListeners('data');
        this.socket.on('data', this.streamIn.onData.bind(this.streamIn));
      } else if (this.opts.logger.error) {
        this.opts.logger.error(
          Errors.createError(
            "connection is configured to use packet compression, but the server doesn't have this capability",
            Errors.ER_COMPRESSION_NOT_SUPPORTED,
            this.info
          )
        );
      }
    }

    this.addCommand = this.opts.pipelining ? this.addCommandEnablePipeline : this.addCommandEnable;
    const conn = this;
    this.status = Status.INIT_CMD;
    this.executeSessionVariableQuery()
      .then(conn.handleCharset.bind(conn))
      .then(this.handleTimezone.bind(this))
      .then(this.checkServerVersion.bind(this))
      .then(this.executeInitQuery.bind(this))
      .then(this.executeSessionTimeout.bind(this))
      .then(() => {
        clearTimeout(this.timeout);
        conn.status = Status.CONNECTED;
        process.nextTick(conn.connectResolveFct, conn);

        const commands = conn.waitingAuthenticationQueue.toArray();
        commands.forEach((cmd) => {
          conn.addCommand(cmd);
        });
        conn.waitingAuthenticationQueue = null;

        conn.connectRejectFct = null;
        conn.connectResolveFct = null;
      })
      .catch((err) => {
        if (!err.fatal) {
          const res = () => {
            conn.authFailHandler.call(conn, err);
          };
          conn.end(res, res);
        } else {
          conn.authFailHandler.call(conn, err);
        }
        return Promise.reject(err);
      });
  }

  /**
   * Authentication failed result handler.
   *
   * @private
   */
  authFailHandler(err) {
    clearTimeout(this.timeout);
    if (this.connectRejectFct) {
      if (this.opts.logger.error) this.opts.logger.error(err);
      //remove handshake command
      this.receiveQueue.shift();
      this.fatalError(err, true);

      process.nextTick(this.connectRejectFct, err);
      this.connectRejectFct = null;
    }
  }

  /**
   * Create TLS socket and associate events.
   *
   * @param callback  callback function when done
   * @private
   */
  createSecureContext(callback) {
    const sslOption = Object.assign({}, this.opts.ssl, {
      servername: this.opts.host,
      socket: this.socket
    });

    try {
      const secureSocket = tls.connect(sslOption, callback);

      secureSocket.on('data', this.streamIn.onData.bind(this.streamIn));
      secureSocket.on('error', this.socketErrorHandler.bind(this));
      secureSocket.on('end', this.socketErrorHandler.bind(this));
      secureSocket.writeBuf = (buf) => secureSocket.write(buf);
      secureSocket.flush = () => {};

      this.socket.removeAllListeners('data');
      this.socket = secureSocket;

      this.streamOut.setStream(secureSocket);
    } catch (err) {
      this.socketErrorHandler(err);
    }
  }

  /**
   * Handle packet when no packet is expected.
   * (there can be an ERROR packet send by server/proxy to inform that connection is ending).
   *
   * @param packet  packet
   * @private
   */
  unexpectedPacket(packet) {
    if (packet && packet.peek() === 0xff) {
      //can receive unexpected error packet from server/proxy
      //to inform that connection is closed (usually by timeout)
      let err = packet.readError(this.info);
      if (err.fatal && this.status < Status.CLOSING) {
        this.emit('error', err);
        if (this.opts.logger.error) this.opts.logger.error(err);
        this.end(
          () => {},
          () => {}
        );
      }
    } else if (this.status < Status.CLOSING) {
      const err = Errors.createFatalError(
        `receiving packet from server without active commands\nconn:${this.info.threadId ? this.info.threadId : -1}(${
          packet.pos
        },${packet.end})\n${Utils.log(this.opts, packet.buf, packet.pos, packet.end)}`,
        Errors.ER_UNEXPECTED_PACKET,
        this.info
      );
      if (this.opts.logger.error) this.opts.logger.error(err);
      this.emit('error', err);
      this.destroy();
    }
  }

  /**
   * Handle connection timeout.
   *
   * @private
   */
  connectTimeoutReached(initialConnectionTime) {
    this.timeout = null;
    const handshake = this.receiveQueue.peekFront();
    const err = Errors.createFatalError(
      `Connection timeout: failed to create socket after ${Date.now() - initialConnectionTime}ms`,
      Errors.ER_CONNECTION_TIMEOUT,
      this.info,
      '08S01',
      null,
      handshake ? handshake.stack : null
    );
    if (this.opts.logger.error) this.opts.logger.error(err);
    this.authFailHandler(err);
  }

  /**
   * Handle socket timeout.
   *
   * @private
   */
  socketTimeoutReached() {
    const err = Errors.createFatalError('socket timeout', Errors.ER_SOCKET_TIMEOUT, this.info);
    if (this.opts.logger.error) this.opts.logger.error(err);
    this.fatalError(err, true);
  }

  /**
   * Add command to waiting queue until authentication.
   *
   * @param cmd         command
   * @private
   */
  addCommandQueue(cmd) {
    this.waitingAuthenticationQueue.push(cmd);
  }

  /**
   * Add command to command sending and receiving queue.
   *
   * @param cmd         command
   * @private
   */
  addCommandEnable(cmd) {
    cmd.once('end', this._sendNextCmdImmediate.bind(this));

    //send immediately only if no current active receiver
    if (this.sendQueue.isEmpty() && this.receiveQueue.isEmpty()) {
      this.receiveQueue.push(cmd);
      cmd.start(this.streamOut, this.opts, this.info);
    } else {
      this.receiveQueue.push(cmd);
      this.sendQueue.push(cmd);
    }
  }

  /**
   * Add command to command sending and receiving queue using pipelining
   *
   * @param cmd         command
   * @private
   */
  addCommandEnablePipeline(cmd) {
    cmd.once('send_end', this._sendNextCmdImmediate.bind(this));

    this.receiveQueue.push(cmd);
    if (this.sendQueue.isEmpty()) {
      cmd.start(this.streamOut, this.opts, this.info);
      if (cmd.sending) {
        this.sendQueue.push(cmd);
        cmd.prependOnceListener('send_end', this.sendQueue.shift.bind(this.sendQueue));
      }
    } else {
      this.sendQueue.push(cmd);
    }
  }

  /**
   * Replacing command when connection is closing or closed to send a proper error message.
   *
   * @param cmd         command
   * @private
   */
  addCommandDisabled(cmd) {
    const err = cmd.throwNewError(
      'Cannot execute new commands: connection closed',
      true,
      this.info,
      '08S01',
      Errors.ER_CMD_CONNECTION_CLOSED
    );
    if (this.opts.logger.error) this.opts.logger.error(err);
  }

  /**
   * Handle socket error.
   *
   * @param err               socket error
   * @private
   */
  socketErrorHandler(err) {
    if (this.status >= Status.CLOSING) return;
    if (this.socket) {
      this.socket.writeBuf = () => {};
      this.socket.flush = () => {};
    }

    //socket has been ended without error
    if (!err) {
      err = Errors.createFatalError(
        'socket has unexpectedly been closed',
        Errors.ER_SOCKET_UNEXPECTED_CLOSE,
        this.info
      );
    } else {
      err.fatal = true;
      err.sqlState = 'HY000';
    }

    switch (this.status) {
      case Status.CONNECTING:
      case Status.AUTHENTICATING:
        const currentCmd = this.receiveQueue.peekFront();
        if (currentCmd && currentCmd.stack && err) {
          err.stack += '\n From event:\n' + currentCmd.stack.substring(currentCmd.stack.indexOf('\n') + 1);
        }
        this.authFailHandler(err);
        break;

      default:
        this.fatalError(err, false);
    }
  }

  /**
   * Fatal unexpected error : closing connection, and throw exception.
   */
  fatalError(err, avoidThrowError) {
    if (this.status >= Status.CLOSING) {
      this.socketErrorDispatchToQueries(err);
      return;
    }
    const mustThrowError = this.status !== Status.CONNECTING;
    this.status = Status.CLOSING;

    //prevent executing new commands
    this.addCommand = this.addCommandDisabled;

    if (this.socket) {
      this.socket.removeAllListeners('error');
      this.socket.removeAllListeners('timeout');
      this.socket.removeAllListeners('close');
      this.socket.removeAllListeners('data');
      if (!this.socket.destroyed) this.socket.destroy();
      this.socket = undefined;
    }
    this.status = Status.CLOSED;

    const errorThrownByCmd = this.socketErrorDispatchToQueries(err);
    if (mustThrowError) {
      if (this.opts.logger.error) this.opts.logger.error(err);
      if (this.listenerCount('error') > 0) {
        this.emit('error', err);
        this.emit('end');
        this.clear();
      } else {
        this.emit('end');
        this.clear();
        //error will be thrown if no error listener and no command did throw the exception
        if (!avoidThrowError && !errorThrownByCmd) throw err;
      }
    } else {
      this.clear();
    }
  }

  /**
   * Dispatch fatal error to current running queries.
   *
   * @param err        the fatal error
   * @return {boolean} return if error has been relayed to queries
   */
  socketErrorDispatchToQueries(err) {
    let receiveCmd;
    let errorThrownByCmd = false;
    while ((receiveCmd = this.receiveQueue.shift())) {
      if (receiveCmd && receiveCmd.onPacketReceive) {
        errorThrownByCmd = true;
        setImmediate(receiveCmd.throwError.bind(receiveCmd, err, this.info));
      }
    }
    return errorThrownByCmd;
  }

  /**
   * Will send next command in queue if any.
   *
   * @private
   */
  nextSendCmd() {
    let sendCmd;
    if ((sendCmd = this.sendQueue.shift())) {
      if (sendCmd.sending) {
        this.sendQueue.unshift(sendCmd);
      } else {
        sendCmd.start(this.streamOut, this.opts, this.info);
        if (sendCmd.sending) {
          this.sendQueue.unshift(sendCmd);
          sendCmd.prependOnceListener('send_end', this.sendQueue.shift.bind(this.sendQueue));
        }
      }
    }
  }

  /**
   * Change transaction state.
   *
   * @param cmdParam command parameter
   * @param resolve success function to call
   * @param reject error function to call
   * @private
   */
  changeTransaction(cmdParam, resolve, reject) {
    //if command in progress, driver cannot rely on status and must execute query
    if (this.status >= Status.CLOSING) {
      const err = Errors.createFatalError(
        'Cannot execute new commands: connection closed',
        Errors.ER_CMD_CONNECTION_CLOSED,
        this.info,
        '08S01',
        cmdParam.sql
      );
      if (this.opts.logger.error) this.opts.logger.error(err);
      reject(err);
      return;
    }

    //Command in progress => must execute query
    //or if no command in progress, can rely on status to know if query is needed
    if (this.receiveQueue.peekFront() || this.info.status & ServerStatus.STATUS_IN_TRANS) {
      const cmd = new Query(
        resolve,
        (err) => {
          if (this.opts.logger.error) this.opts.logger.error(err);
          reject(err);
        },
        this.opts,
        cmdParam
      );
      this.addCommand(cmd);
    } else resolve();
  }

  changeUser(cmdParam, resolve, reject) {
    if (!this.info.isMariaDB()) {
      const err = Errors.createError(
        'method changeUser not available for MySQL server due to Bug #83472',
        Errors.ER_MYSQL_CHANGE_USER_BUG,
        this.info,
        '0A000'
      );
      if (this.opts.logger.error) this.opts.logger.error(err);
      reject(err);
      return;
    }
    if (this.status < Status.CLOSING) {
      this.addCommand = this.addCommandEnable;
    }
    let conn = this;
    if (cmdParam.opts && cmdParam.opts.collation && typeof cmdParam.opts.collation === 'string') {
      const val = cmdParam.opts.collation.toUpperCase();
      cmdParam.opts.collation = Collations.fromName(cmdParam.opts.collation.toUpperCase());
      if (cmdParam.opts.collation === undefined) return reject(new RangeError(`Unknown collation '${val}'`));
    }

    this.addCommand(
      new ChangeUser(
        cmdParam,
        this.opts,
        (res) => {
          if (conn.status < Status.CLOSING && conn.opts.pipelining) conn.addCommand = conn.addCommandEnablePipeline;
          if (cmdParam.opts && cmdParam.opts.collation) conn.opts.collation = cmdParam.opts.collation;
          conn
            .handleCharset()
            .then(() => {
              if (cmdParam.opts && cmdParam.opts.collation) {
                conn.info.collation = cmdParam.opts.collation;
                conn.opts.emit('collation', cmdParam.opts.collation);
              }
              resolve(res);
            })
            .catch((err) => {
              const res = () => conn.authFailHandler.call(conn, err);
              if (!err.fatal) {
                conn.end(res, res);
              } else {
                res();
              }
              reject(err);
            });
        },
        this.authFailHandler.bind(this, reject),
        this.getSocket.bind(this)
      )
    );
  }

  query(cmdParam, resolve, reject) {
    if (!cmdParam.sql)
      return reject(
        Errors.createError(
          'sql parameter is mandatory',
          Errors.ER_UNDEFINED_SQL,
          this.info,
          'HY000',
          null,
          false,
          cmdParam.stack
        )
      );
    const cmd = new Query(
      resolve,
      (err) => {
        if (this.opts.logger.error) this.opts.logger.error(err);
        reject(err);
      },
      this.opts,
      cmdParam
    );
    this.addCommand(cmd);
  }

  prepare(cmdParam, resolve, reject) {
    if (!cmdParam.sql)
      return reject(Errors.createError('sql parameter is mandatory', Errors.ER_UNDEFINED_SQL, this.info, 'HY000'));
    if (this.prepareCache && (this.sendQueue.isEmpty() || !this.receiveQueue.peekFront())) {
      // no command in queue, database is then considered ok, and cache can be search right now
      const cachedPrepare = this.prepareCache.get(cmdParam.sql);
      if (cachedPrepare) {
        return resolve(cachedPrepare);
      }
    }

    const cmd = new Prepare(
      resolve,
      (err) => {
        if (this.opts.logger.error) this.opts.logger.error(err);
        reject(err);
      },
      this.opts,
      cmdParam,
      this
    );
    this.addCommand(cmd);
  }

  importFile(cmdParam, resolve, reject) {
    const conn = this;
    if (!cmdParam || !cmdParam.file) {
      return reject(
        Errors.createError(
          'SQL file parameter is mandatory',
          Errors.ER_MISSING_SQL_PARAMETER,
          conn.info,
          'HY000',
          null,
          false,
          cmdParam.stack
        )
      );
    }

    const prevAddCommand = this.addCommand.bind(conn);

    this.waitingAuthenticationQueue = new Queue();
    this.addCommand = this.addCommandQueue;
    const tmpQuery = function (sql, resolve, reject) {
      const cmd = new Query(
        resolve,
        (err) => {
          if (conn.opts.logger.error) conn.opts.logger.error(err);
          reject(err);
        },
        conn.opts,
        new CommandParameter(sql, null, {})
      );
      prevAddCommand(cmd);
    };

    let prevDatabase = null;
    return (
      cmdParam.skipDbCheck ? Promise.resolve() : new Promise(tmpQuery.bind(conn, 'SELECT DATABASE() as db'))
    ).then((res) => {
      prevDatabase = res ? res[0].db : null;
      if (
        (cmdParam.skipDbCheck && !conn.opts.database) ||
        (!cmdParam.skipDbCheck && !cmdParam.database && !prevDatabase)
      ) {
        return reject(
          Errors.createError(
            'Database parameter is not set and no database is selected',
            Errors.ER_MISSING_DATABASE_PARAMETER,
            conn.info,
            'HY000',
            null,
            false,
            cmdParam.stack
          )
        );
      }
      const searchDbPromise = cmdParam.database
        ? new Promise(tmpQuery.bind(conn, `USE \`${cmdParam.database.replace(/`/gi, '``')}\``))
        : Promise.resolve();
      return searchDbPromise.then(() => {
        const endingFunction = () => {
          if (conn.status < Status.CLOSING) {
            conn.addCommand = conn.addCommandEnable.bind(conn);
            if (conn.status < Status.CLOSING && conn.opts.pipelining) {
              conn.addCommand = conn.addCommandEnablePipeline.bind(conn);
            }
            const commands = conn.waitingAuthenticationQueue.toArray();
            commands.forEach((cmd) => conn.addCommand(cmd));
            conn.waitingAuthenticationQueue = null;
          }
        };
        return fsPromises
          .open(cmdParam.file, 'r')
          .then(async (fd) => {
            const buf = {
              buffer: Buffer.allocUnsafe(16384),
              offset: 0,
              end: 0
            };

            const queryPromises = [];
            let cmdError = null;
            while (!cmdError) {
              try {
                const res = await fd.read(buf.buffer, buf.end, buf.buffer.length - buf.end, null);
                if (res.bytesRead == 0) {
                  // end of file reached.
                  fd.close().catch(() => {});
                  if (cmdError) {
                    endingFunction();
                    reject(cmdError);
                    return;
                  }
                  await Promise.allSettled(queryPromises)
                    .then(() => {
                      if (!cmdParam.skipDbCheck && cmdParam.database && cmdParam.database != prevDatabase) {
                        return new Promise(tmpQuery.bind(conn, `USE \`${prevDatabase.replace(/`/gi, '``')}\``));
                      }
                      return Promise.resolve();
                    })
                    .then(() => {
                      endingFunction();
                      if (cmdError) {
                        reject(cmdError);
                      }
                      resolve();
                    })
                    .catch((err) => {
                      endingFunction();
                      reject(err);
                    });
                  return;
                } else {
                  buf.end += res.bytesRead;
                  const queries = Parse.parseQueries(buf);
                  const queryIntermediatePromise = queries.flatMap((element) => {
                    return new Promise(tmpQuery.bind(conn, element)).catch((err) => {
                      cmdError = err;
                    });
                  });

                  queryPromises.push(...queryIntermediatePromise);
                  if (buf.offset == buf.end) {
                    buf.offset = 0;
                    buf.end = 0;
                  } else {
                    // ensure that buffer can at least read 8k bytes,
                    // either by copying remaining data on used part or growing buffer
                    if (buf.offset > 8192) {
                      // reuse buffer, copying remaining data begin of buffer
                      buf.buffer.copy(buf.buffer, 0, buf.offset, buf.end);
                      buf.end -= buf.offset;
                      buf.offset = 0;
                    } else if (buf.buffer.length - buf.end < 8192) {
                      // grow buffer
                      const tmpBuf = Buffer.allocUnsafe(buf.buffer.length << 1);
                      buf.buffer.copy(tmpBuf, 0, buf.offset, buf.end);
                      buf.buffer = tmpBuf;
                      buf.end -= buf.offset;
                      buf.offset = 0;
                    }
                  }
                }
              } catch (e) {
                fd.close().catch(() => {});
                endingFunction();
                Promise.allSettled(queryPromises).catch(() => {});
                return reject(
                  Errors.createError(
                    e.message,
                    Errors.ER_SQL_FILE_ERROR,
                    conn.info,
                    'HY000',
                    null,
                    false,
                    cmdParam.stack
                  )
                );
              }
            }
            if (cmdError) {
              endingFunction();
              reject(cmdError);
            }
          })
          .catch((err) => {
            endingFunction();
            if (err.code === 'ENOENT') {
              return reject(
                Errors.createError(
                  `SQL file parameter '${cmdParam.file}' doesn't exists`,
                  Errors.ER_MISSING_SQL_FILE,
                  conn.info,
                  'HY000',
                  null,
                  false,
                  cmdParam.stack
                )
              );
            }
            return reject(
              Errors.createError(err.message, Errors.ER_SQL_FILE_ERROR, conn.info, 'HY000', null, false, cmdParam.stack)
            );
          });
      });
    });
  }

  /**
   * Clearing connection variables when ending.
   *
   * @private
   */
  clear() {
    this.sendQueue.clear();
    this.opts.removeAllListeners();
    this.streamOut = undefined;
    this.socket = undefined;
  }

  /**
   * Redirecting connection to server indicated value.
   * @param value server host string
   * @param resolve promise result when done
   */
  redirect(value, resolve) {
    if (this.opts.permitRedirect && value) {
      // redirect only if :
      // * when pipelining, having received all waiting responses.
      // * not in a transaction
      if (this.receiveQueue.length <= 1 && (this.info.status & ServerStatus.STATUS_IN_TRANS) === 0) {
        this.info.redirectRequest = null;
        const matchResults = value.match(redirectUrlFormat);
        if (!matchResults) {
          if (this.opts.logger.error)
            this.opts.logger.error(
              new Error(
                `error parsing redirection string '${value}'. format must be 'mariadb/mysql://[<user>[:<password>]@]<host>[:<port>]/[<db>[?<opt1>=<value1>[&<opt2>=<value2>]]]'`
              )
            );
          return resolve();
        }

        const options = {
          host: matchResults[7] ? decodeURIComponent(matchResults[7]) : matchResults[6],
          port: matchResults[9] ? parseInt(matchResults[9]) : 3306
        };

        // actually only options accepted are user and password
        // there might be additional possible options in the future
        if (matchResults[3]) options.user = matchResults[3];
        if (matchResults[5]) options.password = matchResults[5];

        const redirectOpts = ConnectionOptions.parseOptionDataType(options);

        const finalRedirectOptions = new ConnOptions(Object.assign({}, this.opts, redirectOpts));
        const conn = new Connection(finalRedirectOptions);
        conn
          .connect()
          .then(
            async function () {
              const cmdParam = new CommandParameter();
              await new Promise(this.end.bind(this, cmdParam));
              this.status = Status.CONNECTED;
              this.info = conn.info;
              this.opts = conn.opts;
              this.socket = conn.socket;
              if (this.prepareCache) this.prepareCache.reset();
              this.streamOut = conn.streamOut;
              this.streamIn = conn.streamIn;
              resolve();
            }.bind(this)
          )
          .catch(
            function (e) {
              if (this.opts.logger.error) {
                const err = new Error(`fail to redirect to '${value}'`);
                err.cause = e;
                this.opts.logger.error(err);
              }
              resolve();
            }.bind(this)
          );
      } else {
        this.info.redirectRequest = value;
        resolve();
      }
    } else {
      this.info.redirectRequest = null;
      resolve();
    }
  }

  get threadId() {
    return this.info ? this.info.threadId : null;
  }

  _sendNextCmdImmediate() {
    if (!this.sendQueue.isEmpty()) {
      setImmediate(this.nextSendCmd.bind(this));
    }
  }

  _closePrepare(prepareResultPacket) {
    this.addCommand(
      new ClosePrepare(
        new CommandParameter(null, null, null, null),
        () => {},
        () => {},
        prepareResultPacket
      )
    );
  }

  _logAndReject(reject, err) {
    if (this.opts.logger.error) this.opts.logger.error(err);
    reject(err);
  }
}

class TestMethods {
  #collation;
  #socket;

  constructor(collation, socket) {
    this.#collation = collation;
    this.#socket = socket;
  }

  getCollation() {
    return this.#collation;
  }

  getSocket() {
    return this.#socket;
  }
}

module.exports = Connection;


/***/ }),
/* 7 */
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";


/**
 * Custom implementation of a double ended queue.
 */
function Denque(array, options) {
  var options = options || {};
  this._capacity = options.capacity;

  this._head = 0;
  this._tail = 0;

  if (Array.isArray(array)) {
    this._fromArray(array);
  } else {
    this._capacityMask = 0x3;
    this._list = new Array(4);
  }
}

/**
 * --------------
 *  PUBLIC API
 * -------------
 */

/**
 * Returns the item at the specified index from the list.
 * 0 is the first element, 1 is the second, and so on...
 * Elements at negative values are that many from the end: -1 is one before the end
 * (the last element), -2 is two before the end (one before last), etc.
 * @param index
 * @returns {*}
 */
Denque.prototype.peekAt = function peekAt(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var len = this.size();
  if (i >= len || i < -len) return undefined;
  if (i < 0) i += len;
  i = (this._head + i) & this._capacityMask;
  return this._list[i];
};

/**
 * Alias for peekAt()
 * @param i
 * @returns {*}
 */
Denque.prototype.get = function get(i) {
  return this.peekAt(i);
};

/**
 * Returns the first item in the list without removing it.
 * @returns {*}
 */
Denque.prototype.peek = function peek() {
  if (this._head === this._tail) return undefined;
  return this._list[this._head];
};

/**
 * Alias for peek()
 * @returns {*}
 */
Denque.prototype.peekFront = function peekFront() {
  return this.peek();
};

/**
 * Returns the item that is at the back of the queue without removing it.
 * Uses peekAt(-1)
 */
Denque.prototype.peekBack = function peekBack() {
  return this.peekAt(-1);
};

/**
 * Returns the current length of the queue
 * @return {Number}
 */
Object.defineProperty(Denque.prototype, 'length', {
  get: function length() {
    return this.size();
  }
});

/**
 * Return the number of items on the list, or 0 if empty.
 * @returns {number}
 */
Denque.prototype.size = function size() {
  if (this._head === this._tail) return 0;
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Add an item at the beginning of the list.
 * @param item
 */
Denque.prototype.unshift = function unshift(item) {
  if (arguments.length === 0) return this.size();
  var len = this._list.length;
  this._head = (this._head - 1 + len) & this._capacityMask;
  this._list[this._head] = item;
  if (this._tail === this._head) this._growArray();
  if (this._capacity && this.size() > this._capacity) this.pop();
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the first item on the list,
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.shift = function shift() {
  var head = this._head;
  if (head === this._tail) return undefined;
  var item = this._list[head];
  this._list[head] = undefined;
  this._head = (head + 1) & this._capacityMask;
  if (head < 2 && this._tail > 10000 && this._tail <= this._list.length >>> 2) this._shrinkArray();
  return item;
};

/**
 * Add an item to the bottom of the list.
 * @param item
 */
Denque.prototype.push = function push(item) {
  if (arguments.length === 0) return this.size();
  var tail = this._tail;
  this._list[tail] = item;
  this._tail = (tail + 1) & this._capacityMask;
  if (this._tail === this._head) {
    this._growArray();
  }
  if (this._capacity && this.size() > this._capacity) {
    this.shift();
  }
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the last item on the list.
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.pop = function pop() {
  var tail = this._tail;
  if (tail === this._head) return undefined;
  var len = this._list.length;
  this._tail = (tail - 1 + len) & this._capacityMask;
  var item = this._list[this._tail];
  this._list[this._tail] = undefined;
  if (this._head < 2 && tail > 10000 && tail <= len >>> 2) this._shrinkArray();
  return item;
};

/**
 * Remove and return the item at the specified index from the list.
 * Returns undefined if the list is empty.
 * @param index
 * @returns {*}
 */
Denque.prototype.removeOne = function removeOne(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size) return void 0;
  if (i < 0) i += size;
  i = (this._head + i) & this._capacityMask;
  var item = this._list[i];
  var k;
  if (index < size / 2) {
    for (k = index; k > 0; k--) {
      this._list[i] = this._list[i = (i - 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._head = (this._head + 1 + len) & this._capacityMask;
  } else {
    for (k = size - 1 - index; k > 0; k--) {
      this._list[i] = this._list[i = (i + 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._tail = (this._tail - 1 + len) & this._capacityMask;
  }
  return item;
};

/**
 * Remove number of items from the specified index from the list.
 * Returns array of removed items.
 * Returns undefined if the list is empty.
 * @param index
 * @param count
 * @returns {array}
 */
Denque.prototype.remove = function remove(index, count) {
  var i = index;
  var removed;
  var del_count = count;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size || count < 1) return void 0;
  if (i < 0) i += size;
  if (count === 1 || !count) {
    removed = new Array(1);
    removed[0] = this.removeOne(i);
    return removed;
  }
  if (i === 0 && i + count >= size) {
    removed = this.toArray();
    this.clear();
    return removed;
  }
  if (i + count > size) count = size - i;
  var k;
  removed = new Array(count);
  for (k = 0; k < count; k++) {
    removed[k] = this._list[(this._head + i + k) & this._capacityMask];
  }
  i = (this._head + i) & this._capacityMask;
  if (index + count === size) {
    this._tail = (this._tail - count + len) & this._capacityMask;
    for (k = count; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (index === 0) {
    this._head = (this._head + count + len) & this._capacityMask;
    for (k = count - 1; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (i < size / 2) {
    this._head = (this._head + index + count + len) & this._capacityMask;
    for (k = index; k > 0; k--) {
      this.unshift(this._list[i = (i - 1 + len) & this._capacityMask]);
    }
    i = (this._head - 1 + len) & this._capacityMask;
    while (del_count > 0) {
      this._list[i = (i - 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
    if (index < 0) this._tail = i;
  } else {
    this._tail = i;
    i = (i + count + len) & this._capacityMask;
    for (k = size - (count + index); k > 0; k--) {
      this.push(this._list[i++]);
    }
    i = this._tail;
    while (del_count > 0) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
  }
  if (this._head < 2 && this._tail > 10000 && this._tail <= len >>> 2) this._shrinkArray();
  return removed;
};

/**
 * Native splice implementation.
 * Remove number of items from the specified index from the list and/or add new elements.
 * Returns array of removed items or empty array if count == 0.
 * Returns undefined if the list is empty.
 *
 * @param index
 * @param count
 * @param {...*} [elements]
 * @returns {array}
 */
Denque.prototype.splice = function splice(index, count) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var size = this.size();
  if (i < 0) i += size;
  if (i > size) return void 0;
  if (arguments.length > 2) {
    var k;
    var temp;
    var removed;
    var arg_len = arguments.length;
    var len = this._list.length;
    var arguments_index = 2;
    if (!size || i < size / 2) {
      temp = new Array(i);
      for (k = 0; k < i; k++) {
        temp[k] = this._list[(this._head + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i > 0) {
          this._head = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._head = (this._head + i + len) & this._capacityMask;
      }
      while (arg_len > arguments_index) {
        this.unshift(arguments[--arg_len]);
      }
      for (k = i; k > 0; k--) {
        this.unshift(temp[k - 1]);
      }
    } else {
      temp = new Array(size - (i + count));
      var leng = temp.length;
      for (k = 0; k < leng; k++) {
        temp[k] = this._list[(this._head + i + count + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i != size) {
          this._tail = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._tail = (this._tail - leng + len) & this._capacityMask;
      }
      while (arguments_index < arg_len) {
        this.push(arguments[arguments_index++]);
      }
      for (k = 0; k < leng; k++) {
        this.push(temp[k]);
      }
    }
    return removed;
  } else {
    return this.remove(i, count);
  }
};

/**
 * Soft clear - does not reset capacity.
 */
Denque.prototype.clear = function clear() {
  this._list = new Array(this._list.length);
  this._head = 0;
  this._tail = 0;
};

/**
 * Returns true or false whether the list is empty.
 * @returns {boolean}
 */
Denque.prototype.isEmpty = function isEmpty() {
  return this._head === this._tail;
};

/**
 * Returns an array of all queue items.
 * @returns {Array}
 */
Denque.prototype.toArray = function toArray() {
  return this._copyArray(false);
};

/**
 * -------------
 *   INTERNALS
 * -------------
 */

/**
 * Fills the queue with items from an array
 * For use in the constructor
 * @param array
 * @private
 */
Denque.prototype._fromArray = function _fromArray(array) {
  var length = array.length;
  var capacity = this._nextPowerOf2(length);

  this._list = new Array(capacity);
  this._capacityMask = capacity - 1;
  this._tail = length;

  for (var i = 0; i < length; i++) this._list[i] = array[i];
};

/**
 *
 * @param fullCopy
 * @param size Initialize the array with a specific size. Will default to the current list size
 * @returns {Array}
 * @private
 */
Denque.prototype._copyArray = function _copyArray(fullCopy, size) {
  var src = this._list;
  var capacity = src.length;
  var length = this.length;
  size = size | length;

  // No prealloc requested and the buffer is contiguous
  if (size == length && this._head < this._tail) {
    // Simply do a fast slice copy
    return this._list.slice(this._head, this._tail);
  }

  var dest = new Array(size);

  var k = 0;
  var i;
  if (fullCopy || this._head > this._tail) {
    for (i = this._head; i < capacity; i++) dest[k++] = src[i];
    for (i = 0; i < this._tail; i++) dest[k++] = src[i];
  } else {
    for (i = this._head; i < this._tail; i++) dest[k++] = src[i];
  }

  return dest;
}

/**
 * Grows the internal list array.
 * @private
 */
Denque.prototype._growArray = function _growArray() {
  if (this._head != 0) {
    // double array size and copy existing data, head to end, then beginning to tail.
    var newList = this._copyArray(true, this._list.length << 1);

    this._tail = this._list.length;
    this._head = 0;

    this._list = newList;
  } else {
    this._tail = this._list.length;
    this._list.length <<= 1;
  }

  this._capacityMask = (this._capacityMask << 1) | 1;
};

/**
 * Shrinks the internal list array.
 * @private
 */
Denque.prototype._shrinkArray = function _shrinkArray() {
  this._list.length >>>= 1;
  this._capacityMask >>>= 1;
};

/**
 * Find the next power of 2, at least 4
 * @private
 * @param {number} num 
 * @returns {number}
 */
Denque.prototype._nextPowerOf2 = function _nextPowerOf2(num) {
  var log2 = Math.log(num) / Math.log(2);
  var nextPow2 = 1 << (log2 + 1);

  return Math.max(nextPow2, 4);
}

module.exports = Denque;


/***/ }),
/* 9 */
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),
/* 10 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const PacketNodeEncoded = __webpack_require__(11);
const PacketIconvEncoded = __webpack_require__(15);
const Collations = __webpack_require__(41);
const Utils = __webpack_require__(42);

/**
 * MySQL packet parser
 * see : https://mariadb.com/kb/en/library/0-packet/
 */
class PacketInputStream {
  constructor(unexpectedPacket, receiveQueue, out, opts, info) {
    this.unexpectedPacket = unexpectedPacket;
    this.opts = opts;
    this.receiveQueue = receiveQueue;
    this.info = info;
    this.out = out;

    //in case packet is not complete
    this.header = Buffer.allocUnsafe(4);
    this.headerLen = 0;
    this.packetLen = null;
    this.remainingLen = null;

    this.parts = null;
    this.partsTotalLen = 0;
    this.changeEncoding(this.opts.collation ? this.opts.collation : Collations.fromIndex(224));
    this.changeDebug(this.opts.debug);
    this.opts.on('collation', this.changeEncoding.bind(this));
    this.opts.on('debug', this.changeDebug.bind(this));
  }

  changeEncoding(collation) {
    this.encoding = collation.charset;
    this.packet = Buffer.isEncoding(this.encoding)
      ? new PacketNodeEncoded(this.encoding)
      : new PacketIconvEncoded(this.encoding);
  }

  changeDebug(debug) {
    this.receivePacket = debug ? this.receivePacketDebug : this.receivePacketBasic;
  }

  receivePacketDebug(packet) {
    let cmd = this.currentCmd();
    this.header[0] = this.packetLen & 0xff;
    this.header[1] = (this.packetLen >> 8) & 0xff;
    this.header[2] = (this.packetLen >> 16) & 0xff;
    this.header[3] = this.sequenceNo;
    if (packet) {
      this.opts.logger.network(
        `<== conn:${this.info.threadId ? this.info.threadId : -1} ${
          cmd
            ? cmd.onPacketReceive
              ? cmd.constructor.name + '.' + cmd.onPacketReceive.name
              : cmd.constructor.name
            : 'no command'
        } (${packet.pos},${packet.end})\n${Utils.log(this.opts, packet.buf, packet.pos, packet.end, this.header)}`
      );
    }

    if (!cmd) {
      this.unexpectedPacket(packet);
      return;
    }

    cmd.sequenceNo = this.sequenceNo;
    cmd.onPacketReceive(packet, this.out, this.opts, this.info);
    if (!cmd.onPacketReceive) {
      this.receiveQueue.shift();
    }
  }

  receivePacketBasic(packet) {
    let cmd = this.currentCmd();
    if (!cmd) {
      this.unexpectedPacket(packet);
      return;
    }
    cmd.sequenceNo = this.sequenceNo;
    cmd.onPacketReceive(packet, this.out, this.opts, this.info);
    if (!cmd.onPacketReceive) this.receiveQueue.shift();
  }

  resetHeader() {
    this.remainingLen = null;
    this.headerLen = 0;
  }

  currentCmd() {
    let cmd;
    while ((cmd = this.receiveQueue.peek())) {
      if (cmd.onPacketReceive) return cmd;
      this.receiveQueue.shift();
    }
    return null;
  }

  onData(chunk) {
    let pos = 0;
    let length;
    const chunkLen = chunk.length;

    do {
      //read header
      if (this.remainingLen) {
        length = this.remainingLen;
      } else if (this.headerLen === 0 && chunkLen - pos >= 4) {
        this.packetLen = chunk[pos] + (chunk[pos + 1] << 8) + (chunk[pos + 2] << 16);
        this.sequenceNo = chunk[pos + 3];
        pos += 4;
        length = this.packetLen;
      } else {
        length = null;
        while (chunkLen - pos > 0) {
          this.header[this.headerLen++] = chunk[pos++];
          if (this.headerLen === 4) {
            this.packetLen = this.header[0] + (this.header[1] << 8) + (this.header[2] << 16);
            this.sequenceNo = this.header[3];
            length = this.packetLen;
            break;
          }
        }
      }

      if (length) {
        if (chunkLen - pos >= length) {
          pos += length;
          if (!this.parts) {
            if (this.packetLen < 0xffffff) {
              this.receivePacket(this.packet.update(chunk, pos - length, pos));
              // fast path, knowing there is no parts
              // loop can be simplified until reaching the end of the packet.
              while (pos + 4 < chunkLen) {
                this.packetLen = chunk[pos] + (chunk[pos + 1] << 8) + (chunk[pos + 2] << 16);
                this.sequenceNo = chunk[pos + 3];
                pos += 4;
                if (chunkLen - pos >= this.packetLen) {
                  pos += this.packetLen;
                  if (this.packetLen < 0xffffff) {
                    this.receivePacket(this.packet.update(chunk, pos - this.packetLen, pos));
                  } else {
                    this.parts = [chunk.subarray(pos - this.packetLen, pos)];
                    this.partsTotalLen = this.packetLen;
                    break;
                  }
                } else {
                  const buf = chunk.subarray(pos, chunkLen);
                  if (!this.parts) {
                    this.parts = [buf];
                    this.partsTotalLen = chunkLen - pos;
                  } else {
                    this.parts.push(buf);
                    this.partsTotalLen += chunkLen - pos;
                  }
                  this.remainingLen = this.packetLen - (chunkLen - pos);
                  return;
                }
              }
            } else {
              this.parts = [chunk.subarray(pos - length, pos)];
              this.partsTotalLen = length;
            }
          } else {
            this.parts.push(chunk.subarray(pos - length, pos));
            this.partsTotalLen += length;

            if (this.packetLen < 0xffffff) {
              let buf = Buffer.concat(this.parts, this.partsTotalLen);
              this.parts = null;
              this.receivePacket(this.packet.update(buf, 0, this.partsTotalLen));
            }
          }
          this.resetHeader();
        } else {
          const buf = chunk.subarray(pos, chunkLen);
          if (!this.parts) {
            this.parts = [buf];
            this.partsTotalLen = chunkLen - pos;
          } else {
            this.parts.push(buf);
            this.partsTotalLen += chunkLen - pos;
          }
          this.remainingLen = length - (chunkLen - pos);
          return;
        }
      }
    } while (pos < chunkLen);
  }
}

module.exports = PacketInputStream;


/***/ }),
/* 11 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Packet = __webpack_require__(12);

class PacketNodeEncoded extends Packet {
  constructor(encoding) {
    super();
    // using undefined for utf8 permit to avoid node.js searching
    // for charset, using directly utf8 default one.
    this.encoding = encoding === 'utf8' ? undefined : encoding;
  }

  readStringLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;

    this.pos += len;
    return this.buf.toString(this.encoding, this.pos - len, this.pos);
  }

  readString(buf, beg, len) {
    return buf.toString(this.encoding, beg, beg + len);
  }

  subPacketLengthEncoded(len) {
    this.skip(len);
    return new PacketNodeEncoded(this.encoding).update(this.buf, this.pos - len, this.pos);
  }

  readStringRemaining() {
    const str = this.buf.toString(this.encoding, this.pos, this.end);
    this.pos = this.end;
    return str;
  }
}

module.exports = PacketNodeEncoded;


/***/ }),
/* 12 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Errors = __webpack_require__(13);

/**
 * Object to easily parse buffer.
 * Packet are MUTABLE (buffer are changed, to avoid massive packet object creation).
 * Use clone() in case immutability is required
 *
 */
class Packet {
  update(buf, pos, end) {
    this.buf = buf;
    this.pos = pos;
    this.end = end;
    return this;
  }

  skip(n) {
    this.pos += n;
  }

  readGeometry(defaultVal) {
    const geoBuf = this.readBufferLengthEncoded();
    if (geoBuf === null || geoBuf.length === 0) {
      return defaultVal;
    }
    let geoPos = 4;
    return readGeometryObject(false);

    function parseCoordinates(byteOrder) {
      geoPos += 16;
      const x = byteOrder ? geoBuf.readDoubleLE(geoPos - 16) : geoBuf.readDoubleBE(geoPos - 16);
      const y = byteOrder ? geoBuf.readDoubleLE(geoPos - 8) : geoBuf.readDoubleBE(geoPos - 8);
      return [x, y];
    }

    function readGeometryObject(inner) {
      const byteOrder = geoBuf[geoPos++];
      const wkbType = byteOrder ? geoBuf.readInt32LE(geoPos) : geoBuf.readInt32BE(geoPos);
      geoPos += 4;
      switch (wkbType) {
        case 1: //wkbPoint
          const coords = parseCoordinates(byteOrder);

          if (inner) return coords;
          return {
            type: 'Point',
            coordinates: coords
          };

        case 2: //wkbLineString
          const pointNumber = byteOrder ? geoBuf.readInt32LE(geoPos) : geoBuf.readInt32BE(geoPos);
          geoPos += 4;
          let coordinates = [];
          for (let i = 0; i < pointNumber; i++) {
            coordinates.push(parseCoordinates(byteOrder));
          }
          if (inner) return coordinates;
          return {
            type: 'LineString',
            coordinates: coordinates
          };

        case 3: //wkbPolygon
          let polygonCoordinates = [];
          const numRings = byteOrder ? geoBuf.readInt32LE(geoPos) : geoBuf.readInt32BE(geoPos);
          geoPos += 4;
          for (let ring = 0; ring < numRings; ring++) {
            const pointNumber = byteOrder ? geoBuf.readInt32LE(geoPos) : geoBuf.readInt32BE(geoPos);
            geoPos += 4;
            let linesCoordinates = [];
            for (let i = 0; i < pointNumber; i++) {
              linesCoordinates.push(parseCoordinates(byteOrder));
            }
            polygonCoordinates.push(linesCoordinates);
          }

          if (inner) return polygonCoordinates;
          return {
            type: 'Polygon',
            coordinates: polygonCoordinates
          };

        case 4: //wkbMultiPoint
          return {
            type: 'MultiPoint',
            coordinates: parseGeomArray(byteOrder, true)
          };

        case 5: //wkbMultiLineString
          return {
            type: 'MultiLineString',
            coordinates: parseGeomArray(byteOrder, true)
          };
        case 6: //wkbMultiPolygon
          return {
            type: 'MultiPolygon',
            coordinates: parseGeomArray(byteOrder, true)
          };
        case 7: //wkbGeometryCollection
          return {
            type: 'GeometryCollection',
            geometries: parseGeomArray(byteOrder, false)
          };
      }
      return null;
    }

    function parseGeomArray(byteOrder, inner) {
      let coordinates = [];
      const number = byteOrder ? geoBuf.readInt32LE(geoPos) : geoBuf.readInt32BE(geoPos);
      geoPos += 4;
      for (let i = 0; i < number; i++) {
        coordinates.push(readGeometryObject(inner));
      }
      return coordinates;
    }
  }

  peek() {
    return this.buf[this.pos];
  }

  remaining() {
    return this.end - this.pos > 0;
  }

  readInt8() {
    const val = this.buf[this.pos++];
    return val | ((val & (2 ** 7)) * 0x1fffffe);
  }

  readUInt8() {
    return this.buf[this.pos++];
  }

  readInt16() {
    const first = this.buf[this.pos++];
    const last = this.buf[this.pos++];
    const val = first + last * 2 ** 8;
    return val | ((val & (2 ** 15)) * 0x1fffe);
  }

  readUInt16() {
    return this.buf[this.pos++] + this.buf[this.pos++] * 2 ** 8;
  }

  readInt24() {
    const first = this.buf[this.pos];
    const last = this.buf[this.pos + 2];
    const val = first + this.buf[this.pos + 1] * 2 ** 8 + last * 2 ** 16;
    this.pos += 3;
    return val | ((val & (2 ** 23)) * 0x1fe);
  }

  readUInt24() {
    return this.buf[this.pos++] + this.buf[this.pos++] * 2 ** 8 + this.buf[this.pos++] * 2 ** 16;
  }

  readUInt32() {
    return (
      this.buf[this.pos++] +
      this.buf[this.pos++] * 2 ** 8 +
      this.buf[this.pos++] * 2 ** 16 +
      this.buf[this.pos++] * 2 ** 24
    );
  }

  readInt32() {
    return (
      this.buf[this.pos++] +
      this.buf[this.pos++] * 2 ** 8 +
      this.buf[this.pos++] * 2 ** 16 +
      (this.buf[this.pos++] << 24)
    );
  }

  readBigInt64() {
    const val = this.buf.readBigInt64LE(this.pos);
    this.pos += 8;
    return val;
  }

  readBigUInt64() {
    const val = this.buf.readBigUInt64LE(this.pos);
    this.pos += 8;
    return val;
  }

  /**
   * Metadata are length encoded, but cannot have length > 256, so simplified readUnsignedLength
   * @returns {number}
   */
  readMetadataLength() {
    const type = this.buf[this.pos++] & 0xff;
    if (type < 0xfb) return type;
    return this.readUInt16();
  }

  readUnsignedLength() {
    const type = this.buf[this.pos++] & 0xff;
    if (type < 0xfb) return type;
    switch (type) {
      case 0xfb:
        return null;
      case 0xfc:
        return this.readUInt16();
      case 0xfd:
        return this.readUInt24();
      case 0xfe:
        // limitation to BigInt signed value
        return Number(this.readBigInt64());
    }
  }

  readBuffer(len) {
    this.pos += len;
    return this.buf.subarray(this.pos - len, this.pos);
  }

  readBufferRemaining() {
    let b = this.buf.subarray(this.pos, this.end);
    this.pos = this.end;
    return b;
  }

  readBufferLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    this.pos += len;
    return this.buf.subarray(this.pos - len, this.pos);
  }

  readStringNullEnded() {
    let initialPosition = this.pos;
    let cnt = 0;
    while (this.remaining() > 0 && this.buf[this.pos++] !== 0) {
      cnt++;
    }
    return this.buf.toString(undefined, initialPosition, initialPosition + cnt);
  }

  readSignedLengthBigInt() {
    const type = this.buf[this.pos++];
    switch (type) {
      // null test is not used for now, since only used for reading insertId
      // case 0xfb:
      //   return null;
      case 0xfc:
        return BigInt(this.readUInt16());
      case 0xfd:
        return BigInt(this.readUInt24());
      case 0xfe:
        return this.readBigInt64();
      default:
        return BigInt(type);
    }
  }

  readAsciiStringLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    this.pos += len;
    return this.buf.toString('ascii', this.pos - len, this.pos);
  }

  readStringLengthEncoded() {
    throw new Error('code is normally superseded by Node encoder or Iconv depending on charset used');
  }

  readBigIntLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    return this.readBigIntFromLen(len);
  }

  readBigIntFromLen(len) {
    // fast-path: if length encoded is < to 16, value is in safe integer range
    // atoi
    if (len < 16) {
      return BigInt(this._atoi(len));
    }

    // atoll
    let result = 0n;
    let negate = false;
    let begin = this.pos;

    if (len > 0 && this.buf[begin] === 45) {
      //minus sign
      negate = true;
      begin++;
    }
    for (; begin < this.pos + len; begin++) {
      result = result * 10n + BigInt(this.buf[begin] - 48);
    }
    this.pos += len;
    return negate ? -1n * result : result;
  }

  readDecimalLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    this.pos += len;
    return this.buf.toString('ascii', this.pos - len, this.pos);
  }

  readDate() {
    const len = this.readUnsignedLength();
    if (len === null) return null;

    let res = [];
    let value = 0;
    let initPos = this.pos;
    this.pos += len;
    while (initPos < this.pos) {
      const char = this.buf[initPos++];
      if (char === 45) {
        //minus separator
        res.push(value);
        value = 0;
      } else {
        value = value * 10 + char - 48;
      }
    }
    res.push(value);

    //handle zero-date as null
    if (res[0] === 0 && res[1] === 0 && res[2] === 0) return null;

    return new Date(res[0], res[1] - 1, res[2]);
  }

  readBinaryDate(opts) {
    const len = this.buf[this.pos++];
    let year = 0;
    let month = 0;
    let day = 0;
    if (len > 0) {
      year = this.readInt16();
      if (len > 2) {
        month = this.readUInt8() - 1;
        if (len > 3) {
          day = this.readUInt8();
        }
      }
    }
    if (year === 0 && month === 0 && day === 0) return opts.dateStrings ? '0000-00-00' : null;
    if (opts.dateStrings) {
      return `${appendZero(year, 4)}-${appendZero(month + 1, 2)}-${appendZero(day, 2)}`;
    }
    //handle zero-date as null
    return new Date(year, month, day);
  }

  readDateTime() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    this.pos += len;
    const str = this.buf.toString('ascii', this.pos - len, this.pos);
    if (str.startsWith('0000-00-00 00:00:00')) return null;
    return new Date(str);
  }

  readBinaryDateTime() {
    const len = this.buf[this.pos++];
    let year = 0;
    let month = 0;
    let day = 0;
    let hour = 0;
    let min = 0;
    let sec = 0;
    let microSec = 0;

    if (len > 0) {
      year = this.readInt16();
      if (len > 2) {
        month = this.readUInt8();
        if (len > 3) {
          day = this.readUInt8();
          if (len > 4) {
            hour = this.readUInt8();
            min = this.readUInt8();
            sec = this.readUInt8();
            if (len > 7) {
              microSec = this.readUInt32();
            }
          }
        }
      }
    }

    //handle zero-date as null
    if (year === 0 && month === 0 && day === 0 && hour === 0 && min === 0 && sec === 0 && microSec === 0) return null;
    return new Date(year, month - 1, day, hour, min, sec, microSec / 1000);
  }

  readBinaryDateTimeAsString(scale) {
    const len = this.buf[this.pos++];
    let year = 0;
    let month = 0;
    let day = 0;
    let hour = 0;
    let min = 0;
    let sec = 0;
    let microSec = 0;

    if (len > 0) {
      year = this.readInt16();
      if (len > 2) {
        month = this.readUInt8();
        if (len > 3) {
          day = this.readUInt8();
          if (len > 4) {
            hour = this.readUInt8();
            min = this.readUInt8();
            sec = this.readUInt8();
            if (len > 7) {
              microSec = this.readUInt32();
            }
          }
        }
      }
    }

    //handle zero-date as null
    if (year === 0 && month === 0 && day === 0 && hour === 0 && min === 0 && sec === 0 && microSec === 0)
      return '0000-00-00 00:00:00' + (scale > 0 ? '.000000'.substring(0, scale + 1) : '');

    return (
      appendZero(year, 4) +
      '-' +
      appendZero(month, 2) +
      '-' +
      appendZero(day, 2) +
      ' ' +
      appendZero(hour, 2) +
      ':' +
      appendZero(min, 2) +
      ':' +
      appendZero(sec, 2) +
      (microSec > 0
        ? scale > 0
          ? '.' + appendZero(microSec, 6).substring(0, scale)
          : '.' + appendZero(microSec, 6)
        : scale > 0
        ? '.' + appendZero(microSec, 6).substring(0, scale)
        : '')
    );
  }

  readBinaryTime() {
    const len = this.buf[this.pos++];
    let negate = false;
    let hour = 0;
    let min = 0;
    let sec = 0;
    let microSec = 0;

    if (len > 0) {
      negate = this.buf[this.pos++] === 1;
      hour = this.readUInt32() * 24 + this.readUInt8();
      min = this.readUInt8();
      sec = this.readUInt8();
      if (len > 8) {
        microSec = this.readUInt32();
      }
    }
    let val = appendZero(hour, 2) + ':' + appendZero(min, 2) + ':' + appendZero(sec, 2);
    if (microSec > 0) {
      val += '.' + appendZero(microSec, 6);
    }
    if (negate) return '-' + val;
    return val;
  }

  readFloat() {
    const val = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return val;
  }

  readDouble() {
    const val = this.buf.readDoubleLE(this.pos);
    this.pos += 8;
    return val;
  }

  readIntLengthEncoded() {
    const len = this.buf[this.pos++] & 0xff;
    if (len < 0xfb) return this._atoi(len);
    switch (len) {
      case 0xfb:
        return null;
      case 0xfc:
        return this._atoi(this.readUInt16());
      case 0xfd:
        return this._atoi(this.readUInt24());
      case 0xfe:
        // limitation to BigInt signed value
        return this._atoi(Number(this.readBigInt64()));
    }
  }

  _atoi(len) {
    let result = 0;
    let negate = false;
    let begin = this.pos;

    if (len > 0 && this.buf[begin] === 45) {
      //minus sign
      negate = true;
      begin++;
    }
    for (; begin < this.pos + len; begin++) {
      result = result * 10 + (this.buf[begin] - 48);
    }
    this.pos += len;
    return negate ? -1 * result : result;
  }

  readFloatLengthCoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;
    this.pos += len;
    return +this.buf.toString('ascii', this.pos - len, this.pos);
  }

  skipLengthCodedNumber() {
    const type = this.buf[this.pos++] & 0xff;
    switch (type) {
      case 251:
        return;
      case 252:
        this.pos += 2 + (0xffff & ((this.buf[this.pos] & 0xff) + ((this.buf[this.pos + 1] & 0xff) << 8)));
        return;
      case 253:
        this.pos +=
          3 +
          (0xffffff &
            ((this.buf[this.pos] & 0xff) +
              ((this.buf[this.pos + 1] & 0xff) << 8) +
              ((this.buf[this.pos + 2] & 0xff) << 16)));
        return;
      case 254:
        this.pos += 8 + Number(this.buf.readBigUInt64LE(this.pos));
        return;
      default:
        this.pos += type;
        return;
    }
  }

  length() {
    return this.end - this.pos;
  }

  subPacketLengthEncoded(len) {}

  /**
   * Parse ERR_Packet : https://mariadb.com/kb/en/library/err_packet/
   *
   * @param info              current connection info
   * @param sql               command sql
   * @param stack             additional stack trace
   * @returns {Error}
   */
  readError(info, sql, stack) {
    this.skip(1);
    let errno = this.readUInt16();
    let sqlState;
    let msg;
    // check '#'
    if (this.peek() === 0x23) {
      // skip '#'
      this.skip(6);
      sqlState = this.buf.toString(undefined, this.pos - 5, this.pos);
      msg = this.readStringNullEnded();
    } else {
      // pre 4.1 format
      sqlState = 'HY000';
      msg = this.buf.toString(undefined, this.pos, this.end);
    }
    let fatal = sqlState.startsWith('08') || sqlState === '70100';
    return Errors.createError(msg, errno, info, sqlState, sql, fatal, stack);
  }
}

const appendZero = (val, len) => {
  let st = val.toString();
  while (st.length < len) {
    st = '0' + st;
  }
  return st;
};

module.exports = Packet;


/***/ }),
/* 13 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const ErrorCodes = __webpack_require__(14);

class SqlError extends Error {
  constructor(msg, sql, fatal, info, sqlState, errno, additionalStack, addHeader = undefined) {
    super(
      (addHeader === undefined || addHeader
        ? `(conn=${info ? (info.threadId ? info.threadId : -1) : -1}, no: ${errno ? errno : -1}, SQLState: ${
            sqlState ? sqlState : 'HY000'
          }) `
        : '') +
        msg +
        (sql ? '\nsql: ' + sql : '')
    );
    this.name = 'SqlError';
    this.sqlMessage = msg;
    this.sql = sql;
    this.fatal = fatal;
    this.errno = errno;
    this.sqlState = sqlState;
    if (errno > 45000 && errno < 46000) {
      //driver error
      this.code = errByNo[errno] || 'UNKNOWN';
    } else {
      this.code = ErrorCodes.codes[this.errno] || 'UNKNOWN';
    }
    if (additionalStack) {
      //adding caller stack, removing initial "Error:\n"
      this.stack += '\n From event:\n' + additionalStack.substring(additionalStack.indexOf('\n') + 1);
    }
  }

  get text() {
    return this.sqlMessage;
  }
}

/**
 * Error factory, so error get connection information.
 *
 * @param msg               current error message
 * @param errno             error number
 * @param info              connection information
 * @param sqlState          sql state
 * @param sql               sql command
 * @param fatal             is error fatal
 * @param additionalStack   additional stack trace to see
 * @param addHeader         add connection information
 * @returns {Error} the error
 */
module.exports.createError = function (
  msg,
  errno,
  info = null,
  sqlState = 'HY000',
  sql = null,
  fatal = false,
  additionalStack = undefined,
  addHeader = undefined
) {
  return new SqlError(msg, sql, fatal, info, sqlState, errno, additionalStack, addHeader);
};

/**
 * Fatal error factory, so error get connection information.
 *
 * @param msg               current error message
 * @param errno             error number
 * @param info              connection information
 * @param sqlState          sql state
 * @param sql               sql command
 * @param additionalStack   additional stack trace to see
 * @param addHeader         add connection information
 * @returns {Error} the error
 */
module.exports.createFatalError = function (
  msg,
  errno,
  info = null,
  sqlState = '08S01',
  sql = null,
  additionalStack = undefined,
  addHeader = undefined
) {
  return new SqlError(msg, sql, true, info, sqlState, errno, additionalStack, addHeader);
};

/********************************************************************************
 * Driver specific errors
 ********************************************************************************/

module.exports.ER_CONNECTION_ALREADY_CLOSED = 45001;
module.exports.ER_MYSQL_CHANGE_USER_BUG = 45003;
module.exports.ER_CMD_NOT_EXECUTED_DESTROYED = 45004;
module.exports.ER_NULL_CHAR_ESCAPEID = 45005;
module.exports.ER_NULL_ESCAPEID = 45006;
module.exports.ER_NOT_IMPLEMENTED_FORMAT = 45007;
module.exports.ER_NODE_NOT_SUPPORTED_TLS = 45008;
module.exports.ER_SOCKET_UNEXPECTED_CLOSE = 45009;
module.exports.ER_UNEXPECTED_PACKET = 45011;
module.exports.ER_CONNECTION_TIMEOUT = 45012;
module.exports.ER_CMD_CONNECTION_CLOSED = 45013;
module.exports.ER_CHANGE_USER_BAD_PACKET = 45014;
module.exports.ER_PING_BAD_PACKET = 45015;
module.exports.ER_MISSING_PARAMETER = 45016;
module.exports.ER_PARAMETER_UNDEFINED = 45017;
module.exports.ER_PLACEHOLDER_UNDEFINED = 45018;
module.exports.ER_SOCKET = 45019;
module.exports.ER_EOF_EXPECTED = 45020;
module.exports.ER_LOCAL_INFILE_DISABLED = 45021;
module.exports.ER_LOCAL_INFILE_NOT_READABLE = 45022;
module.exports.ER_SERVER_SSL_DISABLED = 45023;
module.exports.ER_AUTHENTICATION_BAD_PACKET = 45024;
module.exports.ER_AUTHENTICATION_PLUGIN_NOT_SUPPORTED = 45025;
module.exports.ER_SOCKET_TIMEOUT = 45026;
module.exports.ER_POOL_ALREADY_CLOSED = 45027;
module.exports.ER_GET_CONNECTION_TIMEOUT = 45028;
module.exports.ER_SETTING_SESSION_ERROR = 45029;
module.exports.ER_INITIAL_SQL_ERROR = 45030;
module.exports.ER_BATCH_WITH_NO_VALUES = 45031;
module.exports.ER_RESET_BAD_PACKET = 45032;
module.exports.ER_WRONG_IANA_TIMEZONE = 45033;
module.exports.ER_LOCAL_INFILE_WRONG_FILENAME = 45034;
module.exports.ER_ADD_CONNECTION_CLOSED_POOL = 45035;
module.exports.ER_WRONG_AUTO_TIMEZONE = 45036;
module.exports.ER_CLOSING_POOL = 45037;
module.exports.ER_TIMEOUT_NOT_SUPPORTED = 45038;
module.exports.ER_INITIAL_TIMEOUT_ERROR = 45039;
module.exports.ER_DUPLICATE_FIELD = 45040;
module.exports.ER_PING_TIMEOUT = 45042;
module.exports.ER_BAD_PARAMETER_VALUE = 45043;
module.exports.ER_CANNOT_RETRIEVE_RSA_KEY = 45044;
module.exports.ER_MINIMUM_NODE_VERSION_REQUIRED = 45045;
module.exports.ER_MAX_ALLOWED_PACKET = 45046;
module.exports.ER_NOT_SUPPORTED_AUTH_PLUGIN = 45047;
module.exports.ER_COMPRESSION_NOT_SUPPORTED = 45048;
module.exports.ER_UNDEFINED_SQL = 45049;
module.exports.ER_PARSING_PRECISION = 45050;
module.exports.ER_PREPARE_CLOSED = 45051;
module.exports.ER_MISSING_SQL_PARAMETER = 45052;
module.exports.ER_MISSING_SQL_FILE = 45053;
module.exports.ER_SQL_FILE_ERROR = 45054;
module.exports.ER_MISSING_DATABASE_PARAMETER = 45055;

const keys = Object.keys(module.exports);
const errByNo = {};
for (let i = 0; i < keys.length; i++) {
  const keyName = keys[i];
  if (keyName !== 'createError') {
    errByNo[module.exports[keyName]] = keyName;
  }
}

module.exports.SqlError = SqlError;


/***/ }),
/* 14 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



/**
 * File generated using test/tools/generate-mariadb.js
 * from MariaDB 10.9
 *
 * !!!!!! DO NOT CHANGE MANUALLY !!!!!!
 */

let codes = {};
codes[120] = 'HA_ERR_KEY_NOT_FOUND';
codes[121] = 'HA_ERR_FOUND_DUPP_KEY';
codes[122] = 'HA_ERR_INTERNAL_ERROR';
codes[123] = 'HA_ERR_RECORD_CHANGED';
codes[124] = 'HA_ERR_WRONG_INDEX';
codes[126] = 'HA_ERR_CRASHED';
codes[127] = 'HA_ERR_WRONG_IN_RECORD';
codes[128] = 'HA_ERR_OUT_OF_MEM';
codes[130] = 'HA_ERR_NOT_A_TABLE';
codes[131] = 'HA_ERR_WRONG_COMMAND';
codes[132] = 'HA_ERR_OLD_FILE';
codes[133] = 'HA_ERR_NO_ACTIVE_RECORD';
codes[134] = 'HA_ERR_RECORD_DELETED';
codes[135] = 'HA_ERR_RECORD_FILE_FULL';
codes[136] = 'HA_ERR_INDEX_FILE_FULL';
codes[137] = 'HA_ERR_END_OF_FILE';
codes[138] = 'HA_ERR_UNSUPPORTED';
codes[139] = 'HA_ERR_TO_BIG_ROW';
codes[140] = 'HA_WRONG_CREATE_OPTION';
codes[141] = 'HA_ERR_FOUND_DUPP_UNIQUE';
codes[142] = 'HA_ERR_UNKNOWN_CHARSET';
codes[143] = 'HA_ERR_WRONG_MRG_TABLE_DEF';
codes[144] = 'HA_ERR_CRASHED_ON_REPAIR';
codes[145] = 'HA_ERR_CRASHED_ON_USAGE';
codes[146] = 'HA_ERR_LOCK_WAIT_TIMEOUT';
codes[147] = 'HA_ERR_LOCK_TABLE_FULL';
codes[148] = 'HA_ERR_READ_ONLY_TRANSACTION';
codes[149] = 'HA_ERR_LOCK_DEADLOCK';
codes[150] = 'HA_ERR_CANNOT_ADD_FOREIGN';
codes[151] = 'HA_ERR_NO_REFERENCED_ROW';
codes[152] = 'HA_ERR_ROW_IS_REFERENCED';
codes[153] = 'HA_ERR_NO_SAVEPOINT';
codes[154] = 'HA_ERR_NON_UNIQUE_BLOCK_SIZE';
codes[155] = 'HA_ERR_NO_SUCH_TABLE';
codes[156] = 'HA_ERR_TABLE_EXIST';
codes[157] = 'HA_ERR_NO_CONNECTION';
codes[158] = 'HA_ERR_NULL_IN_SPATIAL';
codes[159] = 'HA_ERR_TABLE_DEF_CHANGED';
codes[160] = 'HA_ERR_NO_PARTITION_FOUND';
codes[161] = 'HA_ERR_RBR_LOGGING_FAILED';
codes[162] = 'HA_ERR_DROP_INDEX_FK';
codes[163] = 'HA_ERR_FOREIGN_DUPLICATE_KEY';
codes[164] = 'HA_ERR_TABLE_NEEDS_UPGRADE';
codes[165] = 'HA_ERR_TABLE_READONLY';
codes[166] = 'HA_ERR_AUTOINC_READ_FAILED';
codes[167] = 'HA_ERR_AUTOINC_ERANGE';
codes[168] = 'HA_ERR_GENERIC';
codes[169] = 'HA_ERR_RECORD_IS_THE_SAME';
codes[170] = 'HA_ERR_LOGGING_IMPOSSIBLE';
codes[171] = 'HA_ERR_CORRUPT_EVENT';
codes[172] = 'HA_ERR_NEW_FILE';
codes[173] = 'HA_ERR_ROWS_EVENT_APPLY';
codes[174] = 'HA_ERR_INITIALIZATION';
codes[175] = 'HA_ERR_FILE_TOO_SHORT';
codes[176] = 'HA_ERR_WRONG_CRC';
codes[177] = 'HA_ERR_TOO_MANY_CONCURRENT_TRXS';
codes[178] = 'HA_ERR_NOT_IN_LOCK_PARTITIONS';
codes[179] = 'HA_ERR_INDEX_COL_TOO_LONG';
codes[180] = 'HA_ERR_INDEX_CORRUPT';
codes[181] = 'HA_ERR_UNDO_REC_TOO_BIG';
codes[182] = 'HA_FTS_INVALID_DOCID';
codes[184] = 'HA_ERR_TABLESPACE_EXISTS';
codes[185] = 'HA_ERR_TOO_MANY_FIELDS';
codes[186] = 'HA_ERR_ROW_IN_WRONG_PARTITION';
codes[187] = 'HA_ERR_ROW_NOT_VISIBLE';
codes[188] = 'HA_ERR_ABORTED_BY_USER';
codes[189] = 'HA_ERR_DISK_FULL';
codes[190] = 'HA_ERR_INCOMPATIBLE_DEFINITION';
codes[191] = 'HA_ERR_FTS_TOO_MANY_WORDS_IN_PHRASE';
codes[192] = 'HA_ERR_DECRYPTION_FAILED';
codes[193] = 'HA_ERR_FK_DEPTH_EXCEEDED';
codes[194] = 'HA_ERR_TABLESPACE_MISSING';
codes[195] = 'HA_ERR_SEQUENCE_INVALID_DATA';
codes[196] = 'HA_ERR_SEQUENCE_RUN_OUT';
codes[197] = 'HA_ERR_COMMIT_ERROR';
codes[198] = 'HA_ERR_PARTITION_LIST';
codes[1000] = 'ER_HASHCHK';
codes[1001] = 'ER_NISAMCHK';
codes[1002] = 'ER_NO';
codes[1003] = 'ER_YES';
codes[1004] = 'ER_CANT_CREATE_FILE';
codes[1005] = 'ER_CANT_CREATE_TABLE';
codes[1006] = 'ER_CANT_CREATE_DB';
codes[1007] = 'ER_DB_CREATE_EXISTS';
codes[1008] = 'ER_DB_DROP_EXISTS';
codes[1009] = 'ER_DB_DROP_DELETE';
codes[1010] = 'ER_DB_DROP_RMDIR';
codes[1011] = 'ER_CANT_DELETE_FILE';
codes[1012] = 'ER_CANT_FIND_SYSTEM_REC';
codes[1013] = 'ER_CANT_GET_STAT';
codes[1014] = 'ER_CANT_GET_WD';
codes[1015] = 'ER_CANT_LOCK';
codes[1016] = 'ER_CANT_OPEN_FILE';
codes[1017] = 'ER_FILE_NOT_FOUND';
codes[1018] = 'ER_CANT_READ_DIR';
codes[1019] = 'ER_CANT_SET_WD';
codes[1020] = 'ER_CHECKREAD';
codes[1021] = 'ER_DISK_FULL';
codes[1022] = 'ER_DUP_KEY';
codes[1023] = 'ER_ERROR_ON_CLOSE';
codes[1024] = 'ER_ERROR_ON_READ';
codes[1025] = 'ER_ERROR_ON_RENAME';
codes[1026] = 'ER_ERROR_ON_WRITE';
codes[1027] = 'ER_FILE_USED';
codes[1028] = 'ER_FILSORT_ABORT';
codes[1029] = 'ER_FORM_NOT_FOUND';
codes[1030] = 'ER_GET_ERRNO';
codes[1031] = 'ER_ILLEGAL_HA';
codes[1032] = 'ER_KEY_NOT_FOUND';
codes[1033] = 'ER_NOT_FORM_FILE';
codes[1034] = 'ER_NOT_KEYFILE';
codes[1035] = 'ER_OLD_KEYFILE';
codes[1036] = 'ER_OPEN_AS_READONLY';
codes[1037] = 'ER_OUTOFMEMORY';
codes[1038] = 'ER_OUT_OF_SORTMEMORY';
codes[1039] = 'ER_UNEXPECTED_EOF';
codes[1040] = 'ER_CON_COUNT_ERROR';
codes[1041] = 'ER_OUT_OF_RESOURCES';
codes[1042] = 'ER_BAD_HOST_ERROR';
codes[1043] = 'ER_HANDSHAKE_ERROR';
codes[1044] = 'ER_DBACCESS_DENIED_ERROR';
codes[1045] = 'ER_ACCESS_DENIED_ERROR';
codes[1046] = 'ER_NO_DB_ERROR';
codes[1047] = 'ER_UNKNOWN_COM_ERROR';
codes[1048] = 'ER_BAD_NULL_ERROR';
codes[1049] = 'ER_BAD_DB_ERROR';
codes[1050] = 'ER_TABLE_EXISTS_ERROR';
codes[1051] = 'ER_BAD_TABLE_ERROR';
codes[1052] = 'ER_NON_UNIQ_ERROR';
codes[1053] = 'ER_SERVER_SHUTDOWN';
codes[1054] = 'ER_BAD_FIELD_ERROR';
codes[1055] = 'ER_WRONG_FIELD_WITH_GROUP';
codes[1056] = 'ER_WRONG_GROUP_FIELD';
codes[1057] = 'ER_WRONG_SUM_SELECT';
codes[1058] = 'ER_WRONG_VALUE_COUNT';
codes[1059] = 'ER_TOO_LONG_IDENT';
codes[1060] = 'ER_DUP_FIELDNAME';
codes[1061] = 'ER_DUP_KEYNAME';
codes[1062] = 'ER_DUP_ENTRY';
codes[1063] = 'ER_WRONG_FIELD_SPEC';
codes[1064] = 'ER_PARSE_ERROR';
codes[1065] = 'ER_EMPTY_QUERY';
codes[1066] = 'ER_NONUNIQ_TABLE';
codes[1067] = 'ER_INVALID_DEFAULT';
codes[1068] = 'ER_MULTIPLE_PRI_KEY';
codes[1069] = 'ER_TOO_MANY_KEYS';
codes[1070] = 'ER_TOO_MANY_KEY_PARTS';
codes[1071] = 'ER_TOO_LONG_KEY';
codes[1072] = 'ER_KEY_COLUMN_DOES_NOT_EXIST';
codes[1073] = 'ER_BLOB_USED_AS_KEY';
codes[1074] = 'ER_TOO_BIG_FIELDLENGTH';
codes[1075] = 'ER_WRONG_AUTO_KEY';
codes[1076] = 'ER_BINLOG_CANT_DELETE_GTID_DOMAIN';
codes[1077] = 'ER_NORMAL_SHUTDOWN';
codes[1078] = 'ER_GOT_SIGNAL';
codes[1079] = 'ER_SHUTDOWN_COMPLETE';
codes[1080] = 'ER_FORCING_CLOSE';
codes[1081] = 'ER_IPSOCK_ERROR';
codes[1082] = 'ER_NO_SUCH_INDEX';
codes[1083] = 'ER_WRONG_FIELD_TERMINATORS';
codes[1084] = 'ER_BLOBS_AND_NO_TERMINATED';
codes[1085] = 'ER_TEXTFILE_NOT_READABLE';
codes[1086] = 'ER_FILE_EXISTS_ERROR';
codes[1087] = 'ER_LOAD_INFO';
codes[1088] = 'ER_ALTER_INFO';
codes[1089] = 'ER_WRONG_SUB_KEY';
codes[1090] = 'ER_CANT_REMOVE_ALL_FIELDS';
codes[1091] = 'ER_CANT_DROP_FIELD_OR_KEY';
codes[1092] = 'ER_INSERT_INFO';
codes[1093] = 'ER_UPDATE_TABLE_USED';
codes[1094] = 'ER_NO_SUCH_THREAD';
codes[1095] = 'ER_KILL_DENIED_ERROR';
codes[1096] = 'ER_NO_TABLES_USED';
codes[1097] = 'ER_TOO_BIG_SET';
codes[1098] = 'ER_NO_UNIQUE_LOGFILE';
codes[1099] = 'ER_TABLE_NOT_LOCKED_FOR_WRITE';
codes[1100] = 'ER_TABLE_NOT_LOCKED';
codes[1101] = 'ER_UNUSED_17';
codes[1102] = 'ER_WRONG_DB_NAME';
codes[1103] = 'ER_WRONG_TABLE_NAME';
codes[1104] = 'ER_TOO_BIG_SELECT';
codes[1105] = 'ER_UNKNOWN_ERROR';
codes[1106] = 'ER_UNKNOWN_PROCEDURE';
codes[1107] = 'ER_WRONG_PARAMCOUNT_TO_PROCEDURE';
codes[1108] = 'ER_WRONG_PARAMETERS_TO_PROCEDURE';
codes[1109] = 'ER_UNKNOWN_TABLE';
codes[1110] = 'ER_FIELD_SPECIFIED_TWICE';
codes[1111] = 'ER_INVALID_GROUP_FUNC_USE';
codes[1112] = 'ER_UNSUPPORTED_EXTENSION';
codes[1113] = 'ER_TABLE_MUST_HAVE_COLUMNS';
codes[1114] = 'ER_RECORD_FILE_FULL';
codes[1115] = 'ER_UNKNOWN_CHARACTER_SET';
codes[1116] = 'ER_TOO_MANY_TABLES';
codes[1117] = 'ER_TOO_MANY_FIELDS';
codes[1118] = 'ER_TOO_BIG_ROWSIZE';
codes[1119] = 'ER_STACK_OVERRUN';
codes[1120] = 'ER_WRONG_OUTER_JOIN';
codes[1121] = 'ER_NULL_COLUMN_IN_INDEX';
codes[1122] = 'ER_CANT_FIND_UDF';
codes[1123] = 'ER_CANT_INITIALIZE_UDF';
codes[1124] = 'ER_UDF_NO_PATHS';
codes[1125] = 'ER_UDF_EXISTS';
codes[1126] = 'ER_CANT_OPEN_LIBRARY';
codes[1127] = 'ER_CANT_FIND_DL_ENTRY';
codes[1128] = 'ER_FUNCTION_NOT_DEFINED';
codes[1129] = 'ER_HOST_IS_BLOCKED';
codes[1130] = 'ER_HOST_NOT_PRIVILEGED';
codes[1131] = 'ER_PASSWORD_ANONYMOUS_USER';
codes[1132] = 'ER_PASSWORD_NOT_ALLOWED';
codes[1133] = 'ER_PASSWORD_NO_MATCH';
codes[1134] = 'ER_UPDATE_INFO';
codes[1135] = 'ER_CANT_CREATE_THREAD';
codes[1136] = 'ER_WRONG_VALUE_COUNT_ON_ROW';
codes[1137] = 'ER_CANT_REOPEN_TABLE';
codes[1138] = 'ER_INVALID_USE_OF_NULL';
codes[1139] = 'ER_REGEXP_ERROR';
codes[1140] = 'ER_MIX_OF_GROUP_FUNC_AND_FIELDS';
codes[1141] = 'ER_NONEXISTING_GRANT';
codes[1142] = 'ER_TABLEACCESS_DENIED_ERROR';
codes[1143] = 'ER_COLUMNACCESS_DENIED_ERROR';
codes[1144] = 'ER_ILLEGAL_GRANT_FOR_TABLE';
codes[1145] = 'ER_GRANT_WRONG_HOST_OR_USER';
codes[1146] = 'ER_NO_SUCH_TABLE';
codes[1147] = 'ER_NONEXISTING_TABLE_GRANT';
codes[1148] = 'ER_NOT_ALLOWED_COMMAND';
codes[1149] = 'ER_SYNTAX_ERROR';
codes[1150] = 'ER_DELAYED_CANT_CHANGE_LOCK';
codes[1151] = 'ER_TOO_MANY_DELAYED_THREADS';
codes[1152] = 'ER_ABORTING_CONNECTION';
codes[1153] = 'ER_NET_PACKET_TOO_LARGE';
codes[1154] = 'ER_NET_READ_ERROR_FROM_PIPE';
codes[1155] = 'ER_NET_FCNTL_ERROR';
codes[1156] = 'ER_NET_PACKETS_OUT_OF_ORDER';
codes[1157] = 'ER_NET_UNCOMPRESS_ERROR';
codes[1158] = 'ER_NET_READ_ERROR';
codes[1159] = 'ER_NET_READ_INTERRUPTED';
codes[1160] = 'ER_NET_ERROR_ON_WRITE';
codes[1161] = 'ER_NET_WRITE_INTERRUPTED';
codes[1162] = 'ER_TOO_LONG_STRING';
codes[1163] = 'ER_TABLE_CANT_HANDLE_BLOB';
codes[1164] = 'ER_TABLE_CANT_HANDLE_AUTO_INCREMENT';
codes[1165] = 'ER_DELAYED_INSERT_TABLE_LOCKED';
codes[1166] = 'ER_WRONG_COLUMN_NAME';
codes[1167] = 'ER_WRONG_KEY_COLUMN';
codes[1168] = 'ER_WRONG_MRG_TABLE';
codes[1169] = 'ER_DUP_UNIQUE';
codes[1170] = 'ER_BLOB_KEY_WITHOUT_LENGTH';
codes[1171] = 'ER_PRIMARY_CANT_HAVE_NULL';
codes[1172] = 'ER_TOO_MANY_ROWS';
codes[1173] = 'ER_REQUIRES_PRIMARY_KEY';
codes[1174] = 'ER_NO_RAID_COMPILED';
codes[1175] = 'ER_UPDATE_WITHOUT_KEY_IN_SAFE_MODE';
codes[1176] = 'ER_KEY_DOES_NOT_EXISTS';
codes[1177] = 'ER_CHECK_NO_SUCH_TABLE';
codes[1178] = 'ER_CHECK_NOT_IMPLEMENTED';
codes[1179] = 'ER_CANT_DO_THIS_DURING_AN_TRANSACTION';
codes[1180] = 'ER_ERROR_DURING_COMMIT';
codes[1181] = 'ER_ERROR_DURING_ROLLBACK';
codes[1182] = 'ER_ERROR_DURING_FLUSH_LOGS';
codes[1183] = 'ER_ERROR_DURING_CHECKPOINT';
codes[1184] = 'ER_NEW_ABORTING_CONNECTION';
codes[1185] = 'ER_UNUSED_10';
codes[1186] = 'ER_FLUSH_MASTER_BINLOG_CLOSED';
codes[1187] = 'ER_INDEX_REBUILD';
codes[1188] = 'ER_MASTER';
codes[1189] = 'ER_MASTER_NET_READ';
codes[1190] = 'ER_MASTER_NET_WRITE';
codes[1191] = 'ER_FT_MATCHING_KEY_NOT_FOUND';
codes[1192] = 'ER_LOCK_OR_ACTIVE_TRANSACTION';
codes[1193] = 'ER_UNKNOWN_SYSTEM_VARIABLE';
codes[1194] = 'ER_CRASHED_ON_USAGE';
codes[1195] = 'ER_CRASHED_ON_REPAIR';
codes[1196] = 'ER_WARNING_NOT_COMPLETE_ROLLBACK';
codes[1197] = 'ER_TRANS_CACHE_FULL';
codes[1198] = 'ER_SLAVE_MUST_STOP';
codes[1199] = 'ER_SLAVE_NOT_RUNNING';
codes[1200] = 'ER_BAD_SLAVE';
codes[1201] = 'ER_MASTER_INFO';
codes[1202] = 'ER_SLAVE_THREAD';
codes[1203] = 'ER_TOO_MANY_USER_CONNECTIONS';
codes[1204] = 'ER_SET_CONSTANTS_ONLY';
codes[1205] = 'ER_LOCK_WAIT_TIMEOUT';
codes[1206] = 'ER_LOCK_TABLE_FULL';
codes[1207] = 'ER_READ_ONLY_TRANSACTION';
codes[1208] = 'ER_DROP_DB_WITH_READ_LOCK';
codes[1209] = 'ER_CREATE_DB_WITH_READ_LOCK';
codes[1210] = 'ER_WRONG_ARGUMENTS';
codes[1211] = 'ER_NO_PERMISSION_TO_CREATE_USER';
codes[1212] = 'ER_UNION_TABLES_IN_DIFFERENT_DIR';
codes[1213] = 'ER_LOCK_DEADLOCK';
codes[1214] = 'ER_TABLE_CANT_HANDLE_FT';
codes[1215] = 'ER_CANNOT_ADD_FOREIGN';
codes[1216] = 'ER_NO_REFERENCED_ROW';
codes[1217] = 'ER_ROW_IS_REFERENCED';
codes[1218] = 'ER_CONNECT_TO_MASTER';
codes[1219] = 'ER_QUERY_ON_MASTER';
codes[1220] = 'ER_ERROR_WHEN_EXECUTING_COMMAND';
codes[1221] = 'ER_WRONG_USAGE';
codes[1222] = 'ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT';
codes[1223] = 'ER_CANT_UPDATE_WITH_READLOCK';
codes[1224] = 'ER_MIXING_NOT_ALLOWED';
codes[1225] = 'ER_DUP_ARGUMENT';
codes[1226] = 'ER_USER_LIMIT_REACHED';
codes[1227] = 'ER_SPECIFIC_ACCESS_DENIED_ERROR';
codes[1228] = 'ER_LOCAL_VARIABLE';
codes[1229] = 'ER_GLOBAL_VARIABLE';
codes[1230] = 'ER_NO_DEFAULT';
codes[1231] = 'ER_WRONG_VALUE_FOR_VAR';
codes[1232] = 'ER_WRONG_TYPE_FOR_VAR';
codes[1233] = 'ER_VAR_CANT_BE_READ';
codes[1234] = 'ER_CANT_USE_OPTION_HERE';
codes[1235] = 'ER_NOT_SUPPORTED_YET';
codes[1236] = 'ER_MASTER_FATAL_ERROR_READING_BINLOG';
codes[1237] = 'ER_SLAVE_IGNORED_TABLE';
codes[1238] = 'ER_INCORRECT_GLOBAL_LOCAL_VAR';
codes[1239] = 'ER_WRONG_FK_DEF';
codes[1240] = 'ER_KEY_REF_DO_NOT_MATCH_TABLE_REF';
codes[1241] = 'ER_OPERAND_COLUMNS';
codes[1242] = 'ER_SUBQUERY_NO_1_ROW';
codes[1243] = 'ER_UNKNOWN_STMT_HANDLER';
codes[1244] = 'ER_CORRUPT_HELP_DB';
codes[1245] = 'ER_CYCLIC_REFERENCE';
codes[1246] = 'ER_AUTO_CONVERT';
codes[1247] = 'ER_ILLEGAL_REFERENCE';
codes[1248] = 'ER_DERIVED_MUST_HAVE_ALIAS';
codes[1249] = 'ER_SELECT_REDUCED';
codes[1250] = 'ER_TABLENAME_NOT_ALLOWED_HERE';
codes[1251] = 'ER_NOT_SUPPORTED_AUTH_MODE';
codes[1252] = 'ER_SPATIAL_CANT_HAVE_NULL';
codes[1253] = 'ER_COLLATION_CHARSET_MISMATCH';
codes[1254] = 'ER_SLAVE_WAS_RUNNING';
codes[1255] = 'ER_SLAVE_WAS_NOT_RUNNING';
codes[1256] = 'ER_TOO_BIG_FOR_UNCOMPRESS';
codes[1257] = 'ER_ZLIB_Z_MEM_ERROR';
codes[1258] = 'ER_ZLIB_Z_BUF_ERROR';
codes[1259] = 'ER_ZLIB_Z_DATA_ERROR';
codes[1260] = 'ER_CUT_VALUE_GROUP_CONCAT';
codes[1261] = 'ER_WARN_TOO_FEW_RECORDS';
codes[1262] = 'ER_WARN_TOO_MANY_RECORDS';
codes[1263] = 'ER_WARN_NULL_TO_NOTNULL';
codes[1264] = 'ER_WARN_DATA_OUT_OF_RANGE';
codes[1265] = 'WARN_DATA_TRUNCATED';
codes[1266] = 'ER_WARN_USING_OTHER_HANDLER';
codes[1267] = 'ER_CANT_AGGREGATE_2COLLATIONS';
codes[1268] = 'ER_DROP_USER';
codes[1269] = 'ER_REVOKE_GRANTS';
codes[1270] = 'ER_CANT_AGGREGATE_3COLLATIONS';
codes[1271] = 'ER_CANT_AGGREGATE_NCOLLATIONS';
codes[1272] = 'ER_VARIABLE_IS_NOT_STRUCT';
codes[1273] = 'ER_UNKNOWN_COLLATION';
codes[1274] = 'ER_SLAVE_IGNORED_SSL_PARAMS';
codes[1275] = 'ER_SERVER_IS_IN_SECURE_AUTH_MODE';
codes[1276] = 'ER_WARN_FIELD_RESOLVED';
codes[1277] = 'ER_BAD_SLAVE_UNTIL_COND';
codes[1278] = 'ER_MISSING_SKIP_SLAVE';
codes[1279] = 'ER_UNTIL_COND_IGNORED';
codes[1280] = 'ER_WRONG_NAME_FOR_INDEX';
codes[1281] = 'ER_WRONG_NAME_FOR_CATALOG';
codes[1282] = 'ER_WARN_QC_RESIZE';
codes[1283] = 'ER_BAD_FT_COLUMN';
codes[1284] = 'ER_UNKNOWN_KEY_CACHE';
codes[1285] = 'ER_WARN_HOSTNAME_WONT_WORK';
codes[1286] = 'ER_UNKNOWN_STORAGE_ENGINE';
codes[1287] = 'ER_WARN_DEPRECATED_SYNTAX';
codes[1288] = 'ER_NON_UPDATABLE_TABLE';
codes[1289] = 'ER_FEATURE_DISABLED';
codes[1290] = 'ER_OPTION_PREVENTS_STATEMENT';
codes[1291] = 'ER_DUPLICATED_VALUE_IN_TYPE';
codes[1292] = 'ER_TRUNCATED_WRONG_VALUE';
codes[1293] = 'ER_TOO_MUCH_AUTO_TIMESTAMP_COLS';
codes[1294] = 'ER_INVALID_ON_UPDATE';
codes[1295] = 'ER_UNSUPPORTED_PS';
codes[1296] = 'ER_GET_ERRMSG';
codes[1297] = 'ER_GET_TEMPORARY_ERRMSG';
codes[1298] = 'ER_UNKNOWN_TIME_ZONE';
codes[1299] = 'ER_WARN_INVALID_TIMESTAMP';
codes[1300] = 'ER_INVALID_CHARACTER_STRING';
codes[1301] = 'ER_WARN_ALLOWED_PACKET_OVERFLOWED';
codes[1302] = 'ER_CONFLICTING_DECLARATIONS';
codes[1303] = 'ER_SP_NO_RECURSIVE_CREATE';
codes[1304] = 'ER_SP_ALREADY_EXISTS';
codes[1305] = 'ER_SP_DOES_NOT_EXIST';
codes[1306] = 'ER_SP_DROP_FAILED';
codes[1307] = 'ER_SP_STORE_FAILED';
codes[1308] = 'ER_SP_LILABEL_MISMATCH';
codes[1309] = 'ER_SP_LABEL_REDEFINE';
codes[1310] = 'ER_SP_LABEL_MISMATCH';
codes[1311] = 'ER_SP_UNINIT_VAR';
codes[1312] = 'ER_SP_BADSELECT';
codes[1313] = 'ER_SP_BADRETURN';
codes[1314] = 'ER_SP_BADSTATEMENT';
codes[1315] = 'ER_UPDATE_LOG_DEPRECATED_IGNORED';
codes[1316] = 'ER_UPDATE_LOG_DEPRECATED_TRANSLATED';
codes[1317] = 'ER_QUERY_INTERRUPTED';
codes[1318] = 'ER_SP_WRONG_NO_OF_ARGS';
codes[1319] = 'ER_SP_COND_MISMATCH';
codes[1320] = 'ER_SP_NORETURN';
codes[1321] = 'ER_SP_NORETURNEND';
codes[1322] = 'ER_SP_BAD_CURSOR_QUERY';
codes[1323] = 'ER_SP_BAD_CURSOR_SELECT';
codes[1324] = 'ER_SP_CURSOR_MISMATCH';
codes[1325] = 'ER_SP_CURSOR_ALREADY_OPEN';
codes[1326] = 'ER_SP_CURSOR_NOT_OPEN';
codes[1327] = 'ER_SP_UNDECLARED_VAR';
codes[1328] = 'ER_SP_WRONG_NO_OF_FETCH_ARGS';
codes[1329] = 'ER_SP_FETCH_NO_DATA';
codes[1330] = 'ER_SP_DUP_PARAM';
codes[1331] = 'ER_SP_DUP_VAR';
codes[1332] = 'ER_SP_DUP_COND';
codes[1333] = 'ER_SP_DUP_CURS';
codes[1334] = 'ER_SP_CANT_ALTER';
codes[1335] = 'ER_SP_SUBSELECT_NYI';
codes[1336] = 'ER_STMT_NOT_ALLOWED_IN_SF_OR_TRG';
codes[1337] = 'ER_SP_VARCOND_AFTER_CURSHNDLR';
codes[1338] = 'ER_SP_CURSOR_AFTER_HANDLER';
codes[1339] = 'ER_SP_CASE_NOT_FOUND';
codes[1340] = 'ER_FPARSER_TOO_BIG_FILE';
codes[1341] = 'ER_FPARSER_BAD_HEADER';
codes[1342] = 'ER_FPARSER_EOF_IN_COMMENT';
codes[1343] = 'ER_FPARSER_ERROR_IN_PARAMETER';
codes[1344] = 'ER_FPARSER_EOF_IN_UNKNOWN_PARAMETER';
codes[1345] = 'ER_VIEW_NO_EXPLAIN';
codes[1346] = 'ER_FRM_UNKNOWN_TYPE';
codes[1347] = 'ER_WRONG_OBJECT';
codes[1348] = 'ER_NONUPDATEABLE_COLUMN';
codes[1349] = 'ER_VIEW_SELECT_DERIVED';
codes[1350] = 'ER_VIEW_SELECT_CLAUSE';
codes[1351] = 'ER_VIEW_SELECT_VARIABLE';
codes[1352] = 'ER_VIEW_SELECT_TMPTABLE';
codes[1353] = 'ER_VIEW_WRONG_LIST';
codes[1354] = 'ER_WARN_VIEW_MERGE';
codes[1355] = 'ER_WARN_VIEW_WITHOUT_KEY';
codes[1356] = 'ER_VIEW_INVALID';
codes[1357] = 'ER_SP_NO_DROP_SP';
codes[1358] = 'ER_SP_GOTO_IN_HNDLR';
codes[1359] = 'ER_TRG_ALREADY_EXISTS';
codes[1360] = 'ER_TRG_DOES_NOT_EXIST';
codes[1361] = 'ER_TRG_ON_VIEW_OR_TEMP_TABLE';
codes[1362] = 'ER_TRG_CANT_CHANGE_ROW';
codes[1363] = 'ER_TRG_NO_SUCH_ROW_IN_TRG';
codes[1364] = 'ER_NO_DEFAULT_FOR_FIELD';
codes[1365] = 'ER_DIVISION_BY_ZERO';
codes[1366] = 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD';
codes[1367] = 'ER_ILLEGAL_VALUE_FOR_TYPE';
codes[1368] = 'ER_VIEW_NONUPD_CHECK';
codes[1369] = 'ER_VIEW_CHECK_FAILED';
codes[1370] = 'ER_PROCACCESS_DENIED_ERROR';
codes[1371] = 'ER_RELAY_LOG_FAIL';
codes[1372] = 'ER_PASSWD_LENGTH';
codes[1373] = 'ER_UNKNOWN_TARGET_BINLOG';
codes[1374] = 'ER_IO_ERR_LOG_INDEX_READ';
codes[1375] = 'ER_BINLOG_PURGE_PROHIBITED';
codes[1376] = 'ER_FSEEK_FAIL';
codes[1377] = 'ER_BINLOG_PURGE_FATAL_ERR';
codes[1378] = 'ER_LOG_IN_USE';
codes[1379] = 'ER_LOG_PURGE_UNKNOWN_ERR';
codes[1380] = 'ER_RELAY_LOG_INIT';
codes[1381] = 'ER_NO_BINARY_LOGGING';
codes[1382] = 'ER_RESERVED_SYNTAX';
codes[1383] = 'ER_WSAS_FAILED';
codes[1384] = 'ER_DIFF_GROUPS_PROC';
codes[1385] = 'ER_NO_GROUP_FOR_PROC';
codes[1386] = 'ER_ORDER_WITH_PROC';
codes[1387] = 'ER_LOGGING_PROHIBIT_CHANGING_OF';
codes[1388] = 'ER_NO_FILE_MAPPING';
codes[1389] = 'ER_WRONG_MAGIC';
codes[1390] = 'ER_PS_MANY_PARAM';
codes[1391] = 'ER_KEY_PART_0';
codes[1392] = 'ER_VIEW_CHECKSUM';
codes[1393] = 'ER_VIEW_MULTIUPDATE';
codes[1394] = 'ER_VIEW_NO_INSERT_FIELD_LIST';
codes[1395] = 'ER_VIEW_DELETE_MERGE_VIEW';
codes[1396] = 'ER_CANNOT_USER';
codes[1397] = 'ER_XAER_NOTA';
codes[1398] = 'ER_XAER_INVAL';
codes[1399] = 'ER_XAER_RMFAIL';
codes[1400] = 'ER_XAER_OUTSIDE';
codes[1401] = 'ER_XAER_RMERR';
codes[1402] = 'ER_XA_RBROLLBACK';
codes[1403] = 'ER_NONEXISTING_PROC_GRANT';
codes[1404] = 'ER_PROC_AUTO_GRANT_FAIL';
codes[1405] = 'ER_PROC_AUTO_REVOKE_FAIL';
codes[1406] = 'ER_DATA_TOO_LONG';
codes[1407] = 'ER_SP_BAD_SQLSTATE';
codes[1408] = 'ER_STARTUP';
codes[1409] = 'ER_LOAD_FROM_FIXED_SIZE_ROWS_TO_VAR';
codes[1410] = 'ER_CANT_CREATE_USER_WITH_GRANT';
codes[1411] = 'ER_WRONG_VALUE_FOR_TYPE';
codes[1412] = 'ER_TABLE_DEF_CHANGED';
codes[1413] = 'ER_SP_DUP_HANDLER';
codes[1414] = 'ER_SP_NOT_VAR_ARG';
codes[1415] = 'ER_SP_NO_RETSET';
codes[1416] = 'ER_CANT_CREATE_GEOMETRY_OBJECT';
codes[1417] = 'ER_FAILED_ROUTINE_BREAK_BINLOG';
codes[1418] = 'ER_BINLOG_UNSAFE_ROUTINE';
codes[1419] = 'ER_BINLOG_CREATE_ROUTINE_NEED_SUPER';
codes[1420] = 'ER_EXEC_STMT_WITH_OPEN_CURSOR';
codes[1421] = 'ER_STMT_HAS_NO_OPEN_CURSOR';
codes[1422] = 'ER_COMMIT_NOT_ALLOWED_IN_SF_OR_TRG';
codes[1423] = 'ER_NO_DEFAULT_FOR_VIEW_FIELD';
codes[1424] = 'ER_SP_NO_RECURSION';
codes[1425] = 'ER_TOO_BIG_SCALE';
codes[1426] = 'ER_TOO_BIG_PRECISION';
codes[1427] = 'ER_M_BIGGER_THAN_D';
codes[1428] = 'ER_WRONG_LOCK_OF_SYSTEM_TABLE';
codes[1429] = 'ER_CONNECT_TO_FOREIGN_DATA_SOURCE';
codes[1430] = 'ER_QUERY_ON_FOREIGN_DATA_SOURCE';
codes[1431] = 'ER_FOREIGN_DATA_SOURCE_DOESNT_EXIST';
codes[1432] = 'ER_FOREIGN_DATA_STRING_INVALID_CANT_CREATE';
codes[1433] = 'ER_FOREIGN_DATA_STRING_INVALID';
codes[1434] = 'ER_CANT_CREATE_FEDERATED_TABLE';
codes[1435] = 'ER_TRG_IN_WRONG_SCHEMA';
codes[1436] = 'ER_STACK_OVERRUN_NEED_MORE';
codes[1437] = 'ER_TOO_LONG_BODY';
codes[1438] = 'ER_WARN_CANT_DROP_DEFAULT_KEYCACHE';
codes[1439] = 'ER_TOO_BIG_DISPLAYWIDTH';
codes[1440] = 'ER_XAER_DUPID';
codes[1441] = 'ER_DATETIME_FUNCTION_OVERFLOW';
codes[1442] = 'ER_CANT_UPDATE_USED_TABLE_IN_SF_OR_TRG';
codes[1443] = 'ER_VIEW_PREVENT_UPDATE';
codes[1444] = 'ER_PS_NO_RECURSION';
codes[1445] = 'ER_SP_CANT_SET_AUTOCOMMIT';
codes[1446] = 'ER_MALFORMED_DEFINER';
codes[1447] = 'ER_VIEW_FRM_NO_USER';
codes[1448] = 'ER_VIEW_OTHER_USER';
codes[1449] = 'ER_NO_SUCH_USER';
codes[1450] = 'ER_FORBID_SCHEMA_CHANGE';
codes[1451] = 'ER_ROW_IS_REFERENCED_2';
codes[1452] = 'ER_NO_REFERENCED_ROW_2';
codes[1453] = 'ER_SP_BAD_VAR_SHADOW';
codes[1454] = 'ER_TRG_NO_DEFINER';
codes[1455] = 'ER_OLD_FILE_FORMAT';
codes[1456] = 'ER_SP_RECURSION_LIMIT';
codes[1457] = 'ER_SP_PROC_TABLE_CORRUPT';
codes[1458] = 'ER_SP_WRONG_NAME';
codes[1459] = 'ER_TABLE_NEEDS_UPGRADE';
codes[1460] = 'ER_SP_NO_AGGREGATE';
codes[1461] = 'ER_MAX_PREPARED_STMT_COUNT_REACHED';
codes[1462] = 'ER_VIEW_RECURSIVE';
codes[1463] = 'ER_NON_GROUPING_FIELD_USED';
codes[1464] = 'ER_TABLE_CANT_HANDLE_SPKEYS';
codes[1465] = 'ER_NO_TRIGGERS_ON_SYSTEM_SCHEMA';
codes[1466] = 'ER_REMOVED_SPACES';
codes[1467] = 'ER_AUTOINC_READ_FAILED';
codes[1468] = 'ER_USERNAME';
codes[1469] = 'ER_HOSTNAME';
codes[1470] = 'ER_WRONG_STRING_LENGTH';
codes[1471] = 'ER_NON_INSERTABLE_TABLE';
codes[1472] = 'ER_ADMIN_WRONG_MRG_TABLE';
codes[1473] = 'ER_TOO_HIGH_LEVEL_OF_NESTING_FOR_SELECT';
codes[1474] = 'ER_NAME_BECOMES_EMPTY';
codes[1475] = 'ER_AMBIGUOUS_FIELD_TERM';
codes[1476] = 'ER_FOREIGN_SERVER_EXISTS';
codes[1477] = 'ER_FOREIGN_SERVER_DOESNT_EXIST';
codes[1478] = 'ER_ILLEGAL_HA_CREATE_OPTION';
codes[1479] = 'ER_PARTITION_REQUIRES_VALUES_ERROR';
codes[1480] = 'ER_PARTITION_WRONG_VALUES_ERROR';
codes[1481] = 'ER_PARTITION_MAXVALUE_ERROR';
codes[1482] = 'ER_PARTITION_SUBPARTITION_ERROR';
codes[1483] = 'ER_PARTITION_SUBPART_MIX_ERROR';
codes[1484] = 'ER_PARTITION_WRONG_NO_PART_ERROR';
codes[1485] = 'ER_PARTITION_WRONG_NO_SUBPART_ERROR';
codes[1486] = 'ER_WRONG_EXPR_IN_PARTITION_FUNC_ERROR';
codes[1487] = 'ER_NOT_CONSTANT_EXPRESSION';
codes[1488] = 'ER_FIELD_NOT_FOUND_PART_ERROR';
codes[1489] = 'ER_LIST_OF_FIELDS_ONLY_IN_HASH_ERROR';
codes[1490] = 'ER_INCONSISTENT_PARTITION_INFO_ERROR';
codes[1491] = 'ER_PARTITION_FUNC_NOT_ALLOWED_ERROR';
codes[1492] = 'ER_PARTITIONS_MUST_BE_DEFINED_ERROR';
codes[1493] = 'ER_RANGE_NOT_INCREASING_ERROR';
codes[1494] = 'ER_INCONSISTENT_TYPE_OF_FUNCTIONS_ERROR';
codes[1495] = 'ER_MULTIPLE_DEF_CONST_IN_LIST_PART_ERROR';
codes[1496] = 'ER_PARTITION_ENTRY_ERROR';
codes[1497] = 'ER_MIX_HANDLER_ERROR';
codes[1498] = 'ER_PARTITION_NOT_DEFINED_ERROR';
codes[1499] = 'ER_TOO_MANY_PARTITIONS_ERROR';
codes[1500] = 'ER_SUBPARTITION_ERROR';
codes[1501] = 'ER_CANT_CREATE_HANDLER_FILE';
codes[1502] = 'ER_BLOB_FIELD_IN_PART_FUNC_ERROR';
codes[1503] = 'ER_UNIQUE_KEY_NEED_ALL_FIELDS_IN_PF';
codes[1504] = 'ER_NO_PARTS_ERROR';
codes[1505] = 'ER_PARTITION_MGMT_ON_NONPARTITIONED';
codes[1506] = 'ER_FEATURE_NOT_SUPPORTED_WITH_PARTITIONING';
codes[1507] = 'ER_PARTITION_DOES_NOT_EXIST';
codes[1508] = 'ER_DROP_LAST_PARTITION';
codes[1509] = 'ER_COALESCE_ONLY_ON_HASH_PARTITION';
codes[1510] = 'ER_REORG_HASH_ONLY_ON_SAME_NO';
codes[1511] = 'ER_REORG_NO_PARAM_ERROR';
codes[1512] = 'ER_ONLY_ON_RANGE_LIST_PARTITION';
codes[1513] = 'ER_ADD_PARTITION_SUBPART_ERROR';
codes[1514] = 'ER_ADD_PARTITION_NO_NEW_PARTITION';
codes[1515] = 'ER_COALESCE_PARTITION_NO_PARTITION';
codes[1516] = 'ER_REORG_PARTITION_NOT_EXIST';
codes[1517] = 'ER_SAME_NAME_PARTITION';
codes[1518] = 'ER_NO_BINLOG_ERROR';
codes[1519] = 'ER_CONSECUTIVE_REORG_PARTITIONS';
codes[1520] = 'ER_REORG_OUTSIDE_RANGE';
codes[1521] = 'ER_PARTITION_FUNCTION_FAILURE';
codes[1522] = 'ER_PART_STATE_ERROR';
codes[1523] = 'ER_LIMITED_PART_RANGE';
codes[1524] = 'ER_PLUGIN_IS_NOT_LOADED';
codes[1525] = 'ER_WRONG_VALUE';
codes[1526] = 'ER_NO_PARTITION_FOR_GIVEN_VALUE';
codes[1527] = 'ER_FILEGROUP_OPTION_ONLY_ONCE';
codes[1528] = 'ER_CREATE_FILEGROUP_FAILED';
codes[1529] = 'ER_DROP_FILEGROUP_FAILED';
codes[1530] = 'ER_TABLESPACE_AUTO_EXTEND_ERROR';
codes[1531] = 'ER_WRONG_SIZE_NUMBER';
codes[1532] = 'ER_SIZE_OVERFLOW_ERROR';
codes[1533] = 'ER_ALTER_FILEGROUP_FAILED';
codes[1534] = 'ER_BINLOG_ROW_LOGGING_FAILED';
codes[1535] = 'ER_BINLOG_ROW_WRONG_TABLE_DEF';
codes[1536] = 'ER_BINLOG_ROW_RBR_TO_SBR';
codes[1537] = 'ER_EVENT_ALREADY_EXISTS';
codes[1538] = 'ER_EVENT_STORE_FAILED';
codes[1539] = 'ER_EVENT_DOES_NOT_EXIST';
codes[1540] = 'ER_EVENT_CANT_ALTER';
codes[1541] = 'ER_EVENT_DROP_FAILED';
codes[1542] = 'ER_EVENT_INTERVAL_NOT_POSITIVE_OR_TOO_BIG';
codes[1543] = 'ER_EVENT_ENDS_BEFORE_STARTS';
codes[1544] = 'ER_EVENT_EXEC_TIME_IN_THE_PAST';
codes[1545] = 'ER_EVENT_OPEN_TABLE_FAILED';
codes[1546] = 'ER_EVENT_NEITHER_M_EXPR_NOR_M_AT';
codes[1547] = 'ER_UNUSED_2';
codes[1548] = 'ER_UNUSED_3';
codes[1549] = 'ER_EVENT_CANNOT_DELETE';
codes[1550] = 'ER_EVENT_COMPILE_ERROR';
codes[1551] = 'ER_EVENT_SAME_NAME';
codes[1552] = 'ER_EVENT_DATA_TOO_LONG';
codes[1553] = 'ER_DROP_INDEX_FK';
codes[1554] = 'ER_WARN_DEPRECATED_SYNTAX_WITH_VER';
codes[1555] = 'ER_CANT_WRITE_LOCK_LOG_TABLE';
codes[1556] = 'ER_CANT_LOCK_LOG_TABLE';
codes[1557] = 'ER_UNUSED_4';
codes[1558] = 'ER_COL_COUNT_DOESNT_MATCH_PLEASE_UPDATE';
codes[1559] = 'ER_TEMP_TABLE_PREVENTS_SWITCH_OUT_OF_RBR';
codes[1560] = 'ER_STORED_FUNCTION_PREVENTS_SWITCH_BINLOG_FORMAT';
codes[1561] = 'ER_UNUSED_13';
codes[1562] = 'ER_PARTITION_NO_TEMPORARY';
codes[1563] = 'ER_PARTITION_CONST_DOMAIN_ERROR';
codes[1564] = 'ER_PARTITION_FUNCTION_IS_NOT_ALLOWED';
codes[1565] = 'ER_DDL_LOG_ERROR';
codes[1566] = 'ER_NULL_IN_VALUES_LESS_THAN';
codes[1567] = 'ER_WRONG_PARTITION_NAME';
codes[1568] = 'ER_CANT_CHANGE_TX_CHARACTERISTICS';
codes[1569] = 'ER_DUP_ENTRY_AUTOINCREMENT_CASE';
codes[1570] = 'ER_EVENT_MODIFY_QUEUE_ERROR';
codes[1571] = 'ER_EVENT_SET_VAR_ERROR';
codes[1572] = 'ER_PARTITION_MERGE_ERROR';
codes[1573] = 'ER_CANT_ACTIVATE_LOG';
codes[1574] = 'ER_RBR_NOT_AVAILABLE';
codes[1575] = 'ER_BASE64_DECODE_ERROR';
codes[1576] = 'ER_EVENT_RECURSION_FORBIDDEN';
codes[1577] = 'ER_EVENTS_DB_ERROR';
codes[1578] = 'ER_ONLY_INTEGERS_ALLOWED';
codes[1579] = 'ER_UNSUPORTED_LOG_ENGINE';
codes[1580] = 'ER_BAD_LOG_STATEMENT';
codes[1581] = 'ER_CANT_RENAME_LOG_TABLE';
codes[1582] = 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT';
codes[1583] = 'ER_WRONG_PARAMETERS_TO_NATIVE_FCT';
codes[1584] = 'ER_WRONG_PARAMETERS_TO_STORED_FCT';
codes[1585] = 'ER_NATIVE_FCT_NAME_COLLISION';
codes[1586] = 'ER_DUP_ENTRY_WITH_KEY_NAME';
codes[1587] = 'ER_BINLOG_PURGE_EMFILE';
codes[1588] = 'ER_EVENT_CANNOT_CREATE_IN_THE_PAST';
codes[1589] = 'ER_EVENT_CANNOT_ALTER_IN_THE_PAST';
codes[1590] = 'ER_SLAVE_INCIDENT';
codes[1591] = 'ER_NO_PARTITION_FOR_GIVEN_VALUE_SILENT';
codes[1592] = 'ER_BINLOG_UNSAFE_STATEMENT';
codes[1593] = 'ER_SLAVE_FATAL_ERROR';
codes[1594] = 'ER_SLAVE_RELAY_LOG_READ_FAILURE';
codes[1595] = 'ER_SLAVE_RELAY_LOG_WRITE_FAILURE';
codes[1596] = 'ER_SLAVE_CREATE_EVENT_FAILURE';
codes[1597] = 'ER_SLAVE_MASTER_COM_FAILURE';
codes[1598] = 'ER_BINLOG_LOGGING_IMPOSSIBLE';
codes[1599] = 'ER_VIEW_NO_CREATION_CTX';
codes[1600] = 'ER_VIEW_INVALID_CREATION_CTX';
codes[1601] = 'ER_SR_INVALID_CREATION_CTX';
codes[1602] = 'ER_TRG_CORRUPTED_FILE';
codes[1603] = 'ER_TRG_NO_CREATION_CTX';
codes[1604] = 'ER_TRG_INVALID_CREATION_CTX';
codes[1605] = 'ER_EVENT_INVALID_CREATION_CTX';
codes[1606] = 'ER_TRG_CANT_OPEN_TABLE';
codes[1607] = 'ER_CANT_CREATE_SROUTINE';
codes[1608] = 'ER_UNUSED_11';
codes[1609] = 'ER_NO_FORMAT_DESCRIPTION_EVENT_BEFORE_BINLOG_STATEMENT';
codes[1610] = 'ER_SLAVE_CORRUPT_EVENT';
codes[1611] = 'ER_LOAD_DATA_INVALID_COLUMN';
codes[1612] = 'ER_LOG_PURGE_NO_FILE';
codes[1613] = 'ER_XA_RBTIMEOUT';
codes[1614] = 'ER_XA_RBDEADLOCK';
codes[1615] = 'ER_NEED_REPREPARE';
codes[1616] = 'ER_DELAYED_NOT_SUPPORTED';
codes[1617] = 'WARN_NO_MASTER_INFO';
codes[1618] = 'WARN_OPTION_IGNORED';
codes[1619] = 'ER_PLUGIN_DELETE_BUILTIN';
codes[1620] = 'WARN_PLUGIN_BUSY';
codes[1621] = 'ER_VARIABLE_IS_READONLY';
codes[1622] = 'ER_WARN_ENGINE_TRANSACTION_ROLLBACK';
codes[1623] = 'ER_SLAVE_HEARTBEAT_FAILURE';
codes[1624] = 'ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE';
codes[1625] = 'ER_UNUSED_14';
codes[1626] = 'ER_CONFLICT_FN_PARSE_ERROR';
codes[1627] = 'ER_EXCEPTIONS_WRITE_ERROR';
codes[1628] = 'ER_TOO_LONG_TABLE_COMMENT';
codes[1629] = 'ER_TOO_LONG_FIELD_COMMENT';
codes[1630] = 'ER_FUNC_INEXISTENT_NAME_COLLISION';
codes[1631] = 'ER_DATABASE_NAME';
codes[1632] = 'ER_TABLE_NAME';
codes[1633] = 'ER_PARTITION_NAME';
codes[1634] = 'ER_SUBPARTITION_NAME';
codes[1635] = 'ER_TEMPORARY_NAME';
codes[1636] = 'ER_RENAMED_NAME';
codes[1637] = 'ER_TOO_MANY_CONCURRENT_TRXS';
codes[1638] = 'WARN_NON_ASCII_SEPARATOR_NOT_IMPLEMENTED';
codes[1639] = 'ER_DEBUG_SYNC_TIMEOUT';
codes[1640] = 'ER_DEBUG_SYNC_HIT_LIMIT';
codes[1641] = 'ER_DUP_SIGNAL_SET';
codes[1642] = 'ER_SIGNAL_WARN';
codes[1643] = 'ER_SIGNAL_NOT_FOUND';
codes[1644] = 'ER_SIGNAL_EXCEPTION';
codes[1645] = 'ER_RESIGNAL_WITHOUT_ACTIVE_HANDLER';
codes[1646] = 'ER_SIGNAL_BAD_CONDITION_TYPE';
codes[1647] = 'WARN_COND_ITEM_TRUNCATED';
codes[1648] = 'ER_COND_ITEM_TOO_LONG';
codes[1649] = 'ER_UNKNOWN_LOCALE';
codes[1650] = 'ER_SLAVE_IGNORE_SERVER_IDS';
codes[1651] = 'ER_QUERY_CACHE_DISABLED';
codes[1652] = 'ER_SAME_NAME_PARTITION_FIELD';
codes[1653] = 'ER_PARTITION_COLUMN_LIST_ERROR';
codes[1654] = 'ER_WRONG_TYPE_COLUMN_VALUE_ERROR';
codes[1655] = 'ER_TOO_MANY_PARTITION_FUNC_FIELDS_ERROR';
codes[1656] = 'ER_MAXVALUE_IN_VALUES_IN';
codes[1657] = 'ER_TOO_MANY_VALUES_ERROR';
codes[1658] = 'ER_ROW_SINGLE_PARTITION_FIELD_ERROR';
codes[1659] = 'ER_FIELD_TYPE_NOT_ALLOWED_AS_PARTITION_FIELD';
codes[1660] = 'ER_PARTITION_FIELDS_TOO_LONG';
codes[1661] = 'ER_BINLOG_ROW_ENGINE_AND_STMT_ENGINE';
codes[1662] = 'ER_BINLOG_ROW_MODE_AND_STMT_ENGINE';
codes[1663] = 'ER_BINLOG_UNSAFE_AND_STMT_ENGINE';
codes[1664] = 'ER_BINLOG_ROW_INJECTION_AND_STMT_ENGINE';
codes[1665] = 'ER_BINLOG_STMT_MODE_AND_ROW_ENGINE';
codes[1666] = 'ER_BINLOG_ROW_INJECTION_AND_STMT_MODE';
codes[1667] = 'ER_BINLOG_MULTIPLE_ENGINES_AND_SELF_LOGGING_ENGINE';
codes[1668] = 'ER_BINLOG_UNSAFE_LIMIT';
codes[1669] = 'ER_BINLOG_UNSAFE_INSERT_DELAYED';
codes[1670] = 'ER_BINLOG_UNSAFE_SYSTEM_TABLE';
codes[1671] = 'ER_BINLOG_UNSAFE_AUTOINC_COLUMNS';
codes[1672] = 'ER_BINLOG_UNSAFE_UDF';
codes[1673] = 'ER_BINLOG_UNSAFE_SYSTEM_VARIABLE';
codes[1674] = 'ER_BINLOG_UNSAFE_SYSTEM_FUNCTION';
codes[1675] = 'ER_BINLOG_UNSAFE_NONTRANS_AFTER_TRANS';
codes[1676] = 'ER_MESSAGE_AND_STATEMENT';
codes[1677] = 'ER_SLAVE_CONVERSION_FAILED';
codes[1678] = 'ER_SLAVE_CANT_CREATE_CONVERSION';
codes[1679] = 'ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_BINLOG_FORMAT';
codes[1680] = 'ER_PATH_LENGTH';
codes[1681] = 'ER_WARN_DEPRECATED_SYNTAX_NO_REPLACEMENT';
codes[1682] = 'ER_WRONG_NATIVE_TABLE_STRUCTURE';
codes[1683] = 'ER_WRONG_PERFSCHEMA_USAGE';
codes[1684] = 'ER_WARN_I_S_SKIPPED_TABLE';
codes[1685] = 'ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_BINLOG_DIRECT';
codes[1686] = 'ER_STORED_FUNCTION_PREVENTS_SWITCH_BINLOG_DIRECT';
codes[1687] = 'ER_SPATIAL_MUST_HAVE_GEOM_COL';
codes[1688] = 'ER_TOO_LONG_INDEX_COMMENT';
codes[1689] = 'ER_LOCK_ABORTED';
codes[1690] = 'ER_DATA_OUT_OF_RANGE';
codes[1691] = 'ER_WRONG_SPVAR_TYPE_IN_LIMIT';
codes[1692] = 'ER_BINLOG_UNSAFE_MULTIPLE_ENGINES_AND_SELF_LOGGING_ENGINE';
codes[1693] = 'ER_BINLOG_UNSAFE_MIXED_STATEMENT';
codes[1694] = 'ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_SQL_LOG_BIN';
codes[1695] = 'ER_STORED_FUNCTION_PREVENTS_SWITCH_SQL_LOG_BIN';
codes[1696] = 'ER_FAILED_READ_FROM_PAR_FILE';
codes[1697] = 'ER_VALUES_IS_NOT_INT_TYPE_ERROR';
codes[1698] = 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR';
codes[1699] = 'ER_SET_PASSWORD_AUTH_PLUGIN';
codes[1700] = 'ER_GRANT_PLUGIN_USER_EXISTS';
codes[1701] = 'ER_TRUNCATE_ILLEGAL_FK';
codes[1702] = 'ER_PLUGIN_IS_PERMANENT';
codes[1703] = 'ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE_MIN';
codes[1704] = 'ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE_MAX';
codes[1705] = 'ER_STMT_CACHE_FULL';
codes[1706] = 'ER_MULTI_UPDATE_KEY_CONFLICT';
codes[1707] = 'ER_TABLE_NEEDS_REBUILD';
codes[1708] = 'WARN_OPTION_BELOW_LIMIT';
codes[1709] = 'ER_INDEX_COLUMN_TOO_LONG';
codes[1710] = 'ER_ERROR_IN_TRIGGER_BODY';
codes[1711] = 'ER_ERROR_IN_UNKNOWN_TRIGGER_BODY';
codes[1712] = 'ER_INDEX_CORRUPT';
codes[1713] = 'ER_UNDO_RECORD_TOO_BIG';
codes[1714] = 'ER_BINLOG_UNSAFE_INSERT_IGNORE_SELECT';
codes[1715] = 'ER_BINLOG_UNSAFE_INSERT_SELECT_UPDATE';
codes[1716] = 'ER_BINLOG_UNSAFE_REPLACE_SELECT';
codes[1717] = 'ER_BINLOG_UNSAFE_CREATE_IGNORE_SELECT';
codes[1718] = 'ER_BINLOG_UNSAFE_CREATE_REPLACE_SELECT';
codes[1719] = 'ER_BINLOG_UNSAFE_UPDATE_IGNORE';
codes[1720] = 'ER_UNUSED_15';
codes[1721] = 'ER_UNUSED_16';
codes[1722] = 'ER_BINLOG_UNSAFE_WRITE_AUTOINC_SELECT';
codes[1723] = 'ER_BINLOG_UNSAFE_CREATE_SELECT_AUTOINC';
codes[1724] = 'ER_BINLOG_UNSAFE_INSERT_TWO_KEYS';
codes[1725] = 'ER_UNUSED_28';
codes[1726] = 'ER_VERS_NOT_ALLOWED';
codes[1727] = 'ER_BINLOG_UNSAFE_AUTOINC_NOT_FIRST';
codes[1728] = 'ER_CANNOT_LOAD_FROM_TABLE_V2';
codes[1729] = 'ER_MASTER_DELAY_VALUE_OUT_OF_RANGE';
codes[1730] = 'ER_ONLY_FD_AND_RBR_EVENTS_ALLOWED_IN_BINLOG_STATEMENT';
codes[1731] = 'ER_PARTITION_EXCHANGE_DIFFERENT_OPTION';
codes[1732] = 'ER_PARTITION_EXCHANGE_PART_TABLE';
codes[1733] = 'ER_PARTITION_EXCHANGE_TEMP_TABLE';
codes[1734] = 'ER_PARTITION_INSTEAD_OF_SUBPARTITION';
codes[1735] = 'ER_UNKNOWN_PARTITION';
codes[1736] = 'ER_TABLES_DIFFERENT_METADATA';
codes[1737] = 'ER_ROW_DOES_NOT_MATCH_PARTITION';
codes[1738] = 'ER_BINLOG_CACHE_SIZE_GREATER_THAN_MAX';
codes[1739] = 'ER_WARN_INDEX_NOT_APPLICABLE';
codes[1740] = 'ER_PARTITION_EXCHANGE_FOREIGN_KEY';
codes[1741] = 'ER_NO_SUCH_KEY_VALUE';
codes[1742] = 'ER_VALUE_TOO_LONG';
codes[1743] = 'ER_NETWORK_READ_EVENT_CHECKSUM_FAILURE';
codes[1744] = 'ER_BINLOG_READ_EVENT_CHECKSUM_FAILURE';
codes[1745] = 'ER_BINLOG_STMT_CACHE_SIZE_GREATER_THAN_MAX';
codes[1746] = 'ER_CANT_UPDATE_TABLE_IN_CREATE_TABLE_SELECT';
codes[1747] = 'ER_PARTITION_CLAUSE_ON_NONPARTITIONED';
codes[1748] = 'ER_ROW_DOES_NOT_MATCH_GIVEN_PARTITION_SET';
codes[1749] = 'ER_UNUSED_5';
codes[1750] = 'ER_CHANGE_RPL_INFO_REPOSITORY_FAILURE';
codes[1751] = 'ER_WARNING_NOT_COMPLETE_ROLLBACK_WITH_CREATED_TEMP_TABLE';
codes[1752] = 'ER_WARNING_NOT_COMPLETE_ROLLBACK_WITH_DROPPED_TEMP_TABLE';
codes[1753] = 'ER_MTS_FEATURE_IS_NOT_SUPPORTED';
codes[1754] = 'ER_MTS_UPDATED_DBS_GREATER_MAX';
codes[1755] = 'ER_MTS_CANT_PARALLEL';
codes[1756] = 'ER_MTS_INCONSISTENT_DATA';
codes[1757] = 'ER_FULLTEXT_NOT_SUPPORTED_WITH_PARTITIONING';
codes[1758] = 'ER_DA_INVALID_CONDITION_NUMBER';
codes[1759] = 'ER_INSECURE_PLAIN_TEXT';
codes[1760] = 'ER_INSECURE_CHANGE_MASTER';
codes[1761] = 'ER_FOREIGN_DUPLICATE_KEY_WITH_CHILD_INFO';
codes[1762] = 'ER_FOREIGN_DUPLICATE_KEY_WITHOUT_CHILD_INFO';
codes[1763] = 'ER_SQLTHREAD_WITH_SECURE_SLAVE';
codes[1764] = 'ER_TABLE_HAS_NO_FT';
codes[1765] = 'ER_VARIABLE_NOT_SETTABLE_IN_SF_OR_TRIGGER';
codes[1766] = 'ER_VARIABLE_NOT_SETTABLE_IN_TRANSACTION';
codes[1767] = 'ER_GTID_NEXT_IS_NOT_IN_GTID_NEXT_LIST';
codes[1768] = 'ER_CANT_CHANGE_GTID_NEXT_IN_TRANSACTION_WHEN_GTID_NEXT_LIST_IS_NULL';
codes[1769] = 'ER_SET_STATEMENT_CANNOT_INVOKE_FUNCTION';
codes[1770] = 'ER_GTID_NEXT_CANT_BE_AUTOMATIC_IF_GTID_NEXT_LIST_IS_NON_NULL';
codes[1771] = 'ER_SKIPPING_LOGGED_TRANSACTION';
codes[1772] = 'ER_MALFORMED_GTID_SET_SPECIFICATION';
codes[1773] = 'ER_MALFORMED_GTID_SET_ENCODING';
codes[1774] = 'ER_MALFORMED_GTID_SPECIFICATION';
codes[1775] = 'ER_GNO_EXHAUSTED';
codes[1776] = 'ER_BAD_SLAVE_AUTO_POSITION';
codes[1777] = 'ER_AUTO_POSITION_REQUIRES_GTID_MODE_ON';
codes[1778] = 'ER_CANT_DO_IMPLICIT_COMMIT_IN_TRX_WHEN_GTID_NEXT_IS_SET';
codes[1779] = 'ER_GTID_MODE_2_OR_3_REQUIRES_ENFORCE_GTID_CONSISTENCY_ON';
codes[1780] = 'ER_GTID_MODE_REQUIRES_BINLOG';
codes[1781] = 'ER_CANT_SET_GTID_NEXT_TO_GTID_WHEN_GTID_MODE_IS_OFF';
codes[1782] = 'ER_CANT_SET_GTID_NEXT_TO_ANONYMOUS_WHEN_GTID_MODE_IS_ON';
codes[1783] = 'ER_CANT_SET_GTID_NEXT_LIST_TO_NON_NULL_WHEN_GTID_MODE_IS_OFF';
codes[1784] = 'ER_FOUND_GTID_EVENT_WHEN_GTID_MODE_IS_OFF';
codes[1785] = 'ER_GTID_UNSAFE_NON_TRANSACTIONAL_TABLE';
codes[1786] = 'ER_GTID_UNSAFE_CREATE_SELECT';
codes[1787] = 'ER_GTID_UNSAFE_CREATE_DROP_TEMPORARY_TABLE_IN_TRANSACTION';
codes[1788] = 'ER_GTID_MODE_CAN_ONLY_CHANGE_ONE_STEP_AT_A_TIME';
codes[1789] = 'ER_MASTER_HAS_PURGED_REQUIRED_GTIDS';
codes[1790] = 'ER_CANT_SET_GTID_NEXT_WHEN_OWNING_GTID';
codes[1791] = 'ER_UNKNOWN_EXPLAIN_FORMAT';
codes[1792] = 'ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION';
codes[1793] = 'ER_TOO_LONG_TABLE_PARTITION_COMMENT';
codes[1794] = 'ER_SLAVE_CONFIGURATION';
codes[1795] = 'ER_INNODB_FT_LIMIT';
codes[1796] = 'ER_INNODB_NO_FT_TEMP_TABLE';
codes[1797] = 'ER_INNODB_FT_WRONG_DOCID_COLUMN';
codes[1798] = 'ER_INNODB_FT_WRONG_DOCID_INDEX';
codes[1799] = 'ER_INNODB_ONLINE_LOG_TOO_BIG';
codes[1800] = 'ER_UNKNOWN_ALTER_ALGORITHM';
codes[1801] = 'ER_UNKNOWN_ALTER_LOCK';
codes[1802] = 'ER_MTS_CHANGE_MASTER_CANT_RUN_WITH_GAPS';
codes[1803] = 'ER_MTS_RECOVERY_FAILURE';
codes[1804] = 'ER_MTS_RESET_WORKERS';
codes[1805] = 'ER_COL_COUNT_DOESNT_MATCH_CORRUPTED_V2';
codes[1806] = 'ER_SLAVE_SILENT_RETRY_TRANSACTION';
codes[1807] = 'ER_UNUSED_22';
codes[1808] = 'ER_TABLE_SCHEMA_MISMATCH';
codes[1809] = 'ER_TABLE_IN_SYSTEM_TABLESPACE';
codes[1810] = 'ER_IO_READ_ERROR';
codes[1811] = 'ER_IO_WRITE_ERROR';
codes[1812] = 'ER_TABLESPACE_MISSING';
codes[1813] = 'ER_TABLESPACE_EXISTS';
codes[1814] = 'ER_TABLESPACE_DISCARDED';
codes[1815] = 'ER_INTERNAL_ERROR';
codes[1816] = 'ER_INNODB_IMPORT_ERROR';
codes[1817] = 'ER_INNODB_INDEX_CORRUPT';
codes[1818] = 'ER_INVALID_YEAR_COLUMN_LENGTH';
codes[1819] = 'ER_NOT_VALID_PASSWORD';
codes[1820] = 'ER_MUST_CHANGE_PASSWORD';
codes[1821] = 'ER_FK_NO_INDEX_CHILD';
codes[1822] = 'ER_FK_NO_INDEX_PARENT';
codes[1823] = 'ER_FK_FAIL_ADD_SYSTEM';
codes[1824] = 'ER_FK_CANNOT_OPEN_PARENT';
codes[1825] = 'ER_FK_INCORRECT_OPTION';
codes[1826] = 'ER_DUP_CONSTRAINT_NAME';
codes[1827] = 'ER_PASSWORD_FORMAT';
codes[1828] = 'ER_FK_COLUMN_CANNOT_DROP';
codes[1829] = 'ER_FK_COLUMN_CANNOT_DROP_CHILD';
codes[1830] = 'ER_FK_COLUMN_NOT_NULL';
codes[1831] = 'ER_DUP_INDEX';
codes[1832] = 'ER_FK_COLUMN_CANNOT_CHANGE';
codes[1833] = 'ER_FK_COLUMN_CANNOT_CHANGE_CHILD';
codes[1834] = 'ER_FK_CANNOT_DELETE_PARENT';
codes[1835] = 'ER_MALFORMED_PACKET';
codes[1836] = 'ER_READ_ONLY_MODE';
codes[1837] = 'ER_GTID_NEXT_TYPE_UNDEFINED_GROUP';
codes[1838] = 'ER_VARIABLE_NOT_SETTABLE_IN_SP';
codes[1839] = 'ER_CANT_SET_GTID_PURGED_WHEN_GTID_MODE_IS_OFF';
codes[1840] = 'ER_CANT_SET_GTID_PURGED_WHEN_GTID_EXECUTED_IS_NOT_EMPTY';
codes[1841] = 'ER_CANT_SET_GTID_PURGED_WHEN_OWNED_GTIDS_IS_NOT_EMPTY';
codes[1842] = 'ER_GTID_PURGED_WAS_CHANGED';
codes[1843] = 'ER_GTID_EXECUTED_WAS_CHANGED';
codes[1844] = 'ER_BINLOG_STMT_MODE_AND_NO_REPL_TABLES';
codes[1845] = 'ER_ALTER_OPERATION_NOT_SUPPORTED';
codes[1846] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON';
codes[1847] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_COPY';
codes[1848] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_PARTITION';
codes[1849] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FK_RENAME';
codes[1850] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_COLUMN_TYPE';
codes[1851] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FK_CHECK';
codes[1852] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_IGNORE';
codes[1853] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_NOPK';
codes[1854] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_AUTOINC';
codes[1855] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_HIDDEN_FTS';
codes[1856] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_CHANGE_FTS';
codes[1857] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FTS';
codes[1858] = 'ER_SQL_SLAVE_SKIP_COUNTER_NOT_SETTABLE_IN_GTID_MODE';
codes[1859] = 'ER_DUP_UNKNOWN_IN_INDEX';
codes[1860] = 'ER_IDENT_CAUSES_TOO_LONG_PATH';
codes[1861] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_NOT_NULL';
codes[1862] = 'ER_MUST_CHANGE_PASSWORD_LOGIN';
codes[1863] = 'ER_ROW_IN_WRONG_PARTITION';
codes[1864] = 'ER_MTS_EVENT_BIGGER_PENDING_JOBS_SIZE_MAX';
codes[1865] = 'ER_INNODB_NO_FT_USES_PARSER';
codes[1866] = 'ER_BINLOG_LOGICAL_CORRUPTION';
codes[1867] = 'ER_WARN_PURGE_LOG_IN_USE';
codes[1868] = 'ER_WARN_PURGE_LOG_IS_ACTIVE';
codes[1869] = 'ER_AUTO_INCREMENT_CONFLICT';
codes[1870] = 'WARN_ON_BLOCKHOLE_IN_RBR';
codes[1871] = 'ER_SLAVE_MI_INIT_REPOSITORY';
codes[1872] = 'ER_SLAVE_RLI_INIT_REPOSITORY';
codes[1873] = 'ER_ACCESS_DENIED_CHANGE_USER_ERROR';
codes[1874] = 'ER_INNODB_READ_ONLY';
codes[1875] = 'ER_STOP_SLAVE_SQL_THREAD_TIMEOUT';
codes[1876] = 'ER_STOP_SLAVE_IO_THREAD_TIMEOUT';
codes[1877] = 'ER_TABLE_CORRUPT';
codes[1878] = 'ER_TEMP_FILE_WRITE_FAILURE';
codes[1879] = 'ER_INNODB_FT_AUX_NOT_HEX_ID';
codes[1880] = 'ER_LAST_MYSQL_ERROR_MESSAGE';
codes[1900] = 'ER_UNUSED_18';
codes[1901] = 'ER_GENERATED_COLUMN_FUNCTION_IS_NOT_ALLOWED';
codes[1902] = 'ER_UNUSED_19';
codes[1903] = 'ER_PRIMARY_KEY_BASED_ON_GENERATED_COLUMN';
codes[1904] = 'ER_KEY_BASED_ON_GENERATED_VIRTUAL_COLUMN';
codes[1905] = 'ER_WRONG_FK_OPTION_FOR_GENERATED_COLUMN';
codes[1906] = 'ER_WARNING_NON_DEFAULT_VALUE_FOR_GENERATED_COLUMN';
codes[1907] = 'ER_UNSUPPORTED_ACTION_ON_GENERATED_COLUMN';
codes[1908] = 'ER_UNUSED_20';
codes[1909] = 'ER_UNUSED_21';
codes[1910] = 'ER_UNSUPPORTED_ENGINE_FOR_GENERATED_COLUMNS';
codes[1911] = 'ER_UNKNOWN_OPTION';
codes[1912] = 'ER_BAD_OPTION_VALUE';
codes[1913] = 'ER_UNUSED_6';
codes[1914] = 'ER_UNUSED_7';
codes[1915] = 'ER_UNUSED_8';
codes[1916] = 'ER_DATA_OVERFLOW';
codes[1917] = 'ER_DATA_TRUNCATED';
codes[1918] = 'ER_BAD_DATA';
codes[1919] = 'ER_DYN_COL_WRONG_FORMAT';
codes[1920] = 'ER_DYN_COL_IMPLEMENTATION_LIMIT';
codes[1921] = 'ER_DYN_COL_DATA';
codes[1922] = 'ER_DYN_COL_WRONG_CHARSET';
codes[1923] = 'ER_ILLEGAL_SUBQUERY_OPTIMIZER_SWITCHES';
codes[1924] = 'ER_QUERY_CACHE_IS_DISABLED';
codes[1925] = 'ER_QUERY_CACHE_IS_GLOBALY_DISABLED';
codes[1926] = 'ER_VIEW_ORDERBY_IGNORED';
codes[1927] = 'ER_CONNECTION_KILLED';
codes[1928] = 'ER_UNUSED_12';
codes[1929] = 'ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_SKIP_REPLICATION';
codes[1930] = 'ER_STORED_FUNCTION_PREVENTS_SWITCH_SKIP_REPLICATION';
codes[1931] = 'ER_QUERY_EXCEEDED_ROWS_EXAMINED_LIMIT';
codes[1932] = 'ER_NO_SUCH_TABLE_IN_ENGINE';
codes[1933] = 'ER_TARGET_NOT_EXPLAINABLE';
codes[1934] = 'ER_CONNECTION_ALREADY_EXISTS';
codes[1935] = 'ER_MASTER_LOG_PREFIX';
codes[1936] = 'ER_CANT_START_STOP_SLAVE';
codes[1937] = 'ER_SLAVE_STARTED';
codes[1938] = 'ER_SLAVE_STOPPED';
codes[1939] = 'ER_SQL_DISCOVER_ERROR';
codes[1940] = 'ER_FAILED_GTID_STATE_INIT';
codes[1941] = 'ER_INCORRECT_GTID_STATE';
codes[1942] = 'ER_CANNOT_UPDATE_GTID_STATE';
codes[1943] = 'ER_DUPLICATE_GTID_DOMAIN';
codes[1944] = 'ER_GTID_OPEN_TABLE_FAILED';
codes[1945] = 'ER_GTID_POSITION_NOT_FOUND_IN_BINLOG';
codes[1946] = 'ER_CANNOT_LOAD_SLAVE_GTID_STATE';
codes[1947] = 'ER_MASTER_GTID_POS_CONFLICTS_WITH_BINLOG';
codes[1948] = 'ER_MASTER_GTID_POS_MISSING_DOMAIN';
codes[1949] = 'ER_UNTIL_REQUIRES_USING_GTID';
codes[1950] = 'ER_GTID_STRICT_OUT_OF_ORDER';
codes[1951] = 'ER_GTID_START_FROM_BINLOG_HOLE';
codes[1952] = 'ER_SLAVE_UNEXPECTED_MASTER_SWITCH';
codes[1953] = 'ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_GTID_DOMAIN_ID_SEQ_NO';
codes[1954] = 'ER_STORED_FUNCTION_PREVENTS_SWITCH_GTID_DOMAIN_ID_SEQ_NO';
codes[1955] = 'ER_GTID_POSITION_NOT_FOUND_IN_BINLOG2';
codes[1956] = 'ER_BINLOG_MUST_BE_EMPTY';
codes[1957] = 'ER_NO_SUCH_QUERY';
codes[1958] = 'ER_BAD_BASE64_DATA';
codes[1959] = 'ER_INVALID_ROLE';
codes[1960] = 'ER_INVALID_CURRENT_USER';
codes[1961] = 'ER_CANNOT_GRANT_ROLE';
codes[1962] = 'ER_CANNOT_REVOKE_ROLE';
codes[1963] = 'ER_CHANGE_SLAVE_PARALLEL_THREADS_ACTIVE';
codes[1964] = 'ER_PRIOR_COMMIT_FAILED';
codes[1965] = 'ER_IT_IS_A_VIEW';
codes[1966] = 'ER_SLAVE_SKIP_NOT_IN_GTID';
codes[1967] = 'ER_TABLE_DEFINITION_TOO_BIG';
codes[1968] = 'ER_PLUGIN_INSTALLED';
codes[1969] = 'ER_STATEMENT_TIMEOUT';
codes[1970] = 'ER_SUBQUERIES_NOT_SUPPORTED';
codes[1971] = 'ER_SET_STATEMENT_NOT_SUPPORTED';
codes[1972] = 'ER_UNUSED_9';
codes[1973] = 'ER_USER_CREATE_EXISTS';
codes[1974] = 'ER_USER_DROP_EXISTS';
codes[1975] = 'ER_ROLE_CREATE_EXISTS';
codes[1976] = 'ER_ROLE_DROP_EXISTS';
codes[1977] = 'ER_CANNOT_CONVERT_CHARACTER';
codes[1978] = 'ER_INVALID_DEFAULT_VALUE_FOR_FIELD';
codes[1979] = 'ER_KILL_QUERY_DENIED_ERROR';
codes[1980] = 'ER_NO_EIS_FOR_FIELD';
codes[1981] = 'ER_WARN_AGGFUNC_DEPENDENCE';
codes[1982] = 'WARN_INNODB_PARTITION_OPTION_IGNORED';
codes[3000] = 'ER_FILE_CORRUPT';
codes[3001] = 'ER_ERROR_ON_MASTER';
codes[3002] = 'ER_INCONSISTENT_ERROR';
codes[3003] = 'ER_STORAGE_ENGINE_NOT_LOADED';
codes[3004] = 'ER_GET_STACKED_DA_WITHOUT_ACTIVE_HANDLER';
codes[3005] = 'ER_WARN_LEGACY_SYNTAX_CONVERTED';
codes[3006] = 'ER_BINLOG_UNSAFE_FULLTEXT_PLUGIN';
codes[3007] = 'ER_CANNOT_DISCARD_TEMPORARY_TABLE';
codes[3008] = 'ER_FK_DEPTH_EXCEEDED';
codes[3009] = 'ER_COL_COUNT_DOESNT_MATCH_PLEASE_UPDATE_V2';
codes[3010] = 'ER_WARN_TRIGGER_DOESNT_HAVE_CREATED';
codes[3011] = 'ER_REFERENCED_TRG_DOES_NOT_EXIST_MYSQL';
codes[3012] = 'ER_EXPLAIN_NOT_SUPPORTED';
codes[3013] = 'ER_INVALID_FIELD_SIZE';
codes[3014] = 'ER_MISSING_HA_CREATE_OPTION';
codes[3015] = 'ER_ENGINE_OUT_OF_MEMORY';
codes[3016] = 'ER_PASSWORD_EXPIRE_ANONYMOUS_USER';
codes[3017] = 'ER_SLAVE_SQL_THREAD_MUST_STOP';
codes[3018] = 'ER_NO_FT_MATERIALIZED_SUBQUERY';
codes[3019] = 'ER_INNODB_UNDO_LOG_FULL';
codes[3020] = 'ER_INVALID_ARGUMENT_FOR_LOGARITHM';
codes[3021] = 'ER_SLAVE_CHANNEL_IO_THREAD_MUST_STOP';
codes[3022] = 'ER_WARN_OPEN_TEMP_TABLES_MUST_BE_ZERO';
codes[3023] = 'ER_WARN_ONLY_MASTER_LOG_FILE_NO_POS';
codes[3024] = 'ER_QUERY_TIMEOUT';
codes[3025] = 'ER_NON_RO_SELECT_DISABLE_TIMER';
codes[3026] = 'ER_DUP_LIST_ENTRY';
codes[3027] = 'ER_SQL_MODE_NO_EFFECT';
codes[3028] = 'ER_AGGREGATE_ORDER_FOR_UNION';
codes[3029] = 'ER_AGGREGATE_ORDER_NON_AGG_QUERY';
codes[3030] = 'ER_SLAVE_WORKER_STOPPED_PREVIOUS_THD_ERROR';
codes[3031] = 'ER_DONT_SUPPORT_SLAVE_PRESERVE_COMMIT_ORDER';
codes[3032] = 'ER_SERVER_OFFLINE_MODE';
codes[3033] = 'ER_GIS_DIFFERENT_SRIDS';
codes[3034] = 'ER_GIS_UNSUPPORTED_ARGUMENT';
codes[3035] = 'ER_GIS_UNKNOWN_ERROR';
codes[3036] = 'ER_GIS_UNKNOWN_EXCEPTION';
codes[3037] = 'ER_GIS_INVALID_DATA';
codes[3038] = 'ER_BOOST_GEOMETRY_EMPTY_INPUT_EXCEPTION';
codes[3039] = 'ER_BOOST_GEOMETRY_CENTROID_EXCEPTION';
codes[3040] = 'ER_BOOST_GEOMETRY_OVERLAY_INVALID_INPUT_EXCEPTION';
codes[3041] = 'ER_BOOST_GEOMETRY_TURN_INFO_EXCEPTION';
codes[3042] = 'ER_BOOST_GEOMETRY_SELF_INTERSECTION_POINT_EXCEPTION';
codes[3043] = 'ER_BOOST_GEOMETRY_UNKNOWN_EXCEPTION';
codes[3044] = 'ER_STD_BAD_ALLOC_ERROR';
codes[3045] = 'ER_STD_DOMAIN_ERROR';
codes[3046] = 'ER_STD_LENGTH_ERROR';
codes[3047] = 'ER_STD_INVALID_ARGUMENT';
codes[3048] = 'ER_STD_OUT_OF_RANGE_ERROR';
codes[3049] = 'ER_STD_OVERFLOW_ERROR';
codes[3050] = 'ER_STD_RANGE_ERROR';
codes[3051] = 'ER_STD_UNDERFLOW_ERROR';
codes[3052] = 'ER_STD_LOGIC_ERROR';
codes[3053] = 'ER_STD_RUNTIME_ERROR';
codes[3054] = 'ER_STD_UNKNOWN_EXCEPTION';
codes[3055] = 'ER_GIS_DATA_WRONG_ENDIANESS';
codes[3056] = 'ER_CHANGE_MASTER_PASSWORD_LENGTH';
codes[3057] = 'ER_USER_LOCK_WRONG_NAME';
codes[3058] = 'ER_USER_LOCK_DEADLOCK';
codes[3059] = 'ER_REPLACE_INACCESSIBLE_ROWS';
codes[3060] = 'ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_GIS';
codes[4000] = 'ER_UNUSED_26';
codes[4001] = 'ER_UNUSED_27';
codes[4002] = 'ER_WITH_COL_WRONG_LIST';
codes[4003] = 'ER_TOO_MANY_DEFINITIONS_IN_WITH_CLAUSE';
codes[4004] = 'ER_DUP_QUERY_NAME';
codes[4005] = 'ER_RECURSIVE_WITHOUT_ANCHORS';
codes[4006] = 'ER_UNACCEPTABLE_MUTUAL_RECURSION';
codes[4007] = 'ER_REF_TO_RECURSIVE_WITH_TABLE_IN_DERIVED';
codes[4008] = 'ER_NOT_STANDARD_COMPLIANT_RECURSIVE';
codes[4009] = 'ER_WRONG_WINDOW_SPEC_NAME';
codes[4010] = 'ER_DUP_WINDOW_NAME';
codes[4011] = 'ER_PARTITION_LIST_IN_REFERENCING_WINDOW_SPEC';
codes[4012] = 'ER_ORDER_LIST_IN_REFERENCING_WINDOW_SPEC';
codes[4013] = 'ER_WINDOW_FRAME_IN_REFERENCED_WINDOW_SPEC';
codes[4014] = 'ER_BAD_COMBINATION_OF_WINDOW_FRAME_BOUND_SPECS';
codes[4015] = 'ER_WRONG_PLACEMENT_OF_WINDOW_FUNCTION';
codes[4016] = 'ER_WINDOW_FUNCTION_IN_WINDOW_SPEC';
codes[4017] = 'ER_NOT_ALLOWED_WINDOW_FRAME';
codes[4018] = 'ER_NO_ORDER_LIST_IN_WINDOW_SPEC';
codes[4019] = 'ER_RANGE_FRAME_NEEDS_SIMPLE_ORDERBY';
codes[4020] = 'ER_WRONG_TYPE_FOR_ROWS_FRAME';
codes[4021] = 'ER_WRONG_TYPE_FOR_RANGE_FRAME';
codes[4022] = 'ER_FRAME_EXCLUSION_NOT_SUPPORTED';
codes[4023] = 'ER_WINDOW_FUNCTION_DONT_HAVE_FRAME';
codes[4024] = 'ER_INVALID_NTILE_ARGUMENT';
codes[4025] = 'ER_CONSTRAINT_FAILED';
codes[4026] = 'ER_EXPRESSION_IS_TOO_BIG';
codes[4027] = 'ER_ERROR_EVALUATING_EXPRESSION';
codes[4028] = 'ER_CALCULATING_DEFAULT_VALUE';
codes[4029] = 'ER_EXPRESSION_REFERS_TO_UNINIT_FIELD';
codes[4030] = 'ER_PARTITION_DEFAULT_ERROR';
codes[4031] = 'ER_REFERENCED_TRG_DOES_NOT_EXIST';
codes[4032] = 'ER_INVALID_DEFAULT_PARAM';
codes[4033] = 'ER_BINLOG_NON_SUPPORTED_BULK';
codes[4034] = 'ER_BINLOG_UNCOMPRESS_ERROR';
codes[4035] = 'ER_JSON_BAD_CHR';
codes[4036] = 'ER_JSON_NOT_JSON_CHR';
codes[4037] = 'ER_JSON_EOS';
codes[4038] = 'ER_JSON_SYNTAX';
codes[4039] = 'ER_JSON_ESCAPING';
codes[4040] = 'ER_JSON_DEPTH';
codes[4041] = 'ER_JSON_PATH_EOS';
codes[4042] = 'ER_JSON_PATH_SYNTAX';
codes[4043] = 'ER_JSON_PATH_DEPTH';
codes[4044] = 'ER_JSON_PATH_NO_WILDCARD';
codes[4045] = 'ER_JSON_PATH_ARRAY';
codes[4046] = 'ER_JSON_ONE_OR_ALL';
codes[4047] = 'ER_UNSUPPORTED_COMPRESSED_TABLE';
codes[4048] = 'ER_GEOJSON_INCORRECT';
codes[4049] = 'ER_GEOJSON_TOO_FEW_POINTS';
codes[4050] = 'ER_GEOJSON_NOT_CLOSED';
codes[4051] = 'ER_JSON_PATH_EMPTY';
codes[4052] = 'ER_SLAVE_SAME_ID';
codes[4053] = 'ER_FLASHBACK_NOT_SUPPORTED';
codes[4054] = 'ER_KEYS_OUT_OF_ORDER';
codes[4055] = 'ER_OVERLAPPING_KEYS';
codes[4056] = 'ER_REQUIRE_ROW_BINLOG_FORMAT';
codes[4057] = 'ER_ISOLATION_MODE_NOT_SUPPORTED';
codes[4058] = 'ER_ON_DUPLICATE_DISABLED';
codes[4059] = 'ER_UPDATES_WITH_CONSISTENT_SNAPSHOT';
codes[4060] = 'ER_ROLLBACK_ONLY';
codes[4061] = 'ER_ROLLBACK_TO_SAVEPOINT';
codes[4062] = 'ER_ISOLATION_LEVEL_WITH_CONSISTENT_SNAPSHOT';
codes[4063] = 'ER_UNSUPPORTED_COLLATION';
codes[4064] = 'ER_METADATA_INCONSISTENCY';
codes[4065] = 'ER_CF_DIFFERENT';
codes[4066] = 'ER_RDB_TTL_DURATION_FORMAT';
codes[4067] = 'ER_RDB_STATUS_GENERAL';
codes[4068] = 'ER_RDB_STATUS_MSG';
codes[4069] = 'ER_RDB_TTL_UNSUPPORTED';
codes[4070] = 'ER_RDB_TTL_COL_FORMAT';
codes[4071] = 'ER_PER_INDEX_CF_DEPRECATED';
codes[4072] = 'ER_KEY_CREATE_DURING_ALTER';
codes[4073] = 'ER_SK_POPULATE_DURING_ALTER';
codes[4074] = 'ER_SUM_FUNC_WITH_WINDOW_FUNC_AS_ARG';
codes[4075] = 'ER_NET_OK_PACKET_TOO_LARGE';
codes[4076] = 'ER_GEOJSON_EMPTY_COORDINATES';
codes[4077] = 'ER_MYROCKS_CANT_NOPAD_COLLATION';
codes[4078] = 'ER_ILLEGAL_PARAMETER_DATA_TYPES2_FOR_OPERATION';
codes[4079] = 'ER_ILLEGAL_PARAMETER_DATA_TYPE_FOR_OPERATION';
codes[4080] = 'ER_WRONG_PARAMCOUNT_TO_CURSOR';
codes[4081] = 'ER_UNKNOWN_STRUCTURED_VARIABLE';
codes[4082] = 'ER_ROW_VARIABLE_DOES_NOT_HAVE_FIELD';
codes[4083] = 'ER_END_IDENTIFIER_DOES_NOT_MATCH';
codes[4084] = 'ER_SEQUENCE_RUN_OUT';
codes[4085] = 'ER_SEQUENCE_INVALID_DATA';
codes[4086] = 'ER_SEQUENCE_INVALID_TABLE_STRUCTURE';
codes[4087] = 'ER_SEQUENCE_ACCESS_ERROR';
codes[4088] = 'ER_SEQUENCE_BINLOG_FORMAT';
codes[4089] = 'ER_NOT_SEQUENCE';
codes[4090] = 'ER_NOT_SEQUENCE2';
codes[4091] = 'ER_UNKNOWN_SEQUENCES';
codes[4092] = 'ER_UNKNOWN_VIEW';
codes[4093] = 'ER_WRONG_INSERT_INTO_SEQUENCE';
codes[4094] = 'ER_SP_STACK_TRACE';
codes[4095] = 'ER_PACKAGE_ROUTINE_IN_SPEC_NOT_DEFINED_IN_BODY';
codes[4096] = 'ER_PACKAGE_ROUTINE_FORWARD_DECLARATION_NOT_DEFINED';
codes[4097] = 'ER_COMPRESSED_COLUMN_USED_AS_KEY';
codes[4098] = 'ER_UNKNOWN_COMPRESSION_METHOD';
codes[4099] = 'ER_WRONG_NUMBER_OF_VALUES_IN_TVC';
codes[4100] = 'ER_FIELD_REFERENCE_IN_TVC';
codes[4101] = 'ER_WRONG_TYPE_FOR_PERCENTILE_FUNC';
codes[4102] = 'ER_ARGUMENT_NOT_CONSTANT';
codes[4103] = 'ER_ARGUMENT_OUT_OF_RANGE';
codes[4104] = 'ER_WRONG_TYPE_OF_ARGUMENT';
codes[4105] = 'ER_NOT_AGGREGATE_FUNCTION';
codes[4106] = 'ER_INVALID_AGGREGATE_FUNCTION';
codes[4107] = 'ER_INVALID_VALUE_TO_LIMIT';
codes[4108] = 'ER_INVISIBLE_NOT_NULL_WITHOUT_DEFAULT';
codes[4109] = 'ER_UPDATE_INFO_WITH_SYSTEM_VERSIONING';
codes[4110] = 'ER_VERS_FIELD_WRONG_TYPE';
codes[4111] = 'ER_VERS_ENGINE_UNSUPPORTED';
codes[4112] = 'ER_UNUSED_23';
codes[4113] = 'ER_PARTITION_WRONG_TYPE';
codes[4114] = 'WARN_VERS_PART_FULL';
codes[4115] = 'WARN_VERS_PARAMETERS';
codes[4116] = 'ER_VERS_DROP_PARTITION_INTERVAL';
codes[4117] = 'ER_UNUSED_25';
codes[4118] = 'WARN_VERS_PART_NON_HISTORICAL';
codes[4119] = 'ER_VERS_ALTER_NOT_ALLOWED';
codes[4120] = 'ER_VERS_ALTER_ENGINE_PROHIBITED';
codes[4121] = 'ER_VERS_RANGE_PROHIBITED';
codes[4122] = 'ER_CONFLICTING_FOR_SYSTEM_TIME';
codes[4123] = 'ER_VERS_TABLE_MUST_HAVE_COLUMNS';
codes[4124] = 'ER_VERS_NOT_VERSIONED';
codes[4125] = 'ER_MISSING';
codes[4126] = 'ER_VERS_PERIOD_COLUMNS';
codes[4127] = 'ER_PART_WRONG_VALUE';
codes[4128] = 'ER_VERS_WRONG_PARTS';
codes[4129] = 'ER_VERS_NO_TRX_ID';
codes[4130] = 'ER_VERS_ALTER_SYSTEM_FIELD';
codes[4131] = 'ER_DROP_VERSIONING_SYSTEM_TIME_PARTITION';
codes[4132] = 'ER_VERS_DB_NOT_SUPPORTED';
codes[4133] = 'ER_VERS_TRT_IS_DISABLED';
codes[4134] = 'ER_VERS_DUPLICATE_ROW_START_END';
codes[4135] = 'ER_VERS_ALREADY_VERSIONED';
codes[4136] = 'ER_UNUSED_24';
codes[4137] = 'ER_VERS_NOT_SUPPORTED';
codes[4138] = 'ER_VERS_TRX_PART_HISTORIC_ROW_NOT_SUPPORTED';
codes[4139] = 'ER_INDEX_FILE_FULL';
codes[4140] = 'ER_UPDATED_COLUMN_ONLY_ONCE';
codes[4141] = 'ER_EMPTY_ROW_IN_TVC';
codes[4142] = 'ER_VERS_QUERY_IN_PARTITION';
codes[4143] = 'ER_KEY_DOESNT_SUPPORT';
codes[4144] = 'ER_ALTER_OPERATION_TABLE_OPTIONS_NEED_REBUILD';
codes[4145] = 'ER_BACKUP_LOCK_IS_ACTIVE';
codes[4146] = 'ER_BACKUP_NOT_RUNNING';
codes[4147] = 'ER_BACKUP_WRONG_STAGE';
codes[4148] = 'ER_BACKUP_STAGE_FAILED';
codes[4149] = 'ER_BACKUP_UNKNOWN_STAGE';
codes[4150] = 'ER_USER_IS_BLOCKED';
codes[4151] = 'ER_ACCOUNT_HAS_BEEN_LOCKED';
codes[4152] = 'ER_PERIOD_TEMPORARY_NOT_ALLOWED';
codes[4153] = 'ER_PERIOD_TYPES_MISMATCH';
codes[4154] = 'ER_MORE_THAN_ONE_PERIOD';
codes[4155] = 'ER_PERIOD_FIELD_WRONG_ATTRIBUTES';
codes[4156] = 'ER_PERIOD_NOT_FOUND';
codes[4157] = 'ER_PERIOD_COLUMNS_UPDATED';
codes[4158] = 'ER_PERIOD_CONSTRAINT_DROP';
codes[4159] = 'ER_TOO_LONG_KEYPART';
codes[4160] = 'ER_TOO_LONG_DATABASE_COMMENT';
codes[4161] = 'ER_UNKNOWN_DATA_TYPE';
codes[4162] = 'ER_UNKNOWN_OPERATOR';
codes[4163] = 'ER_WARN_HISTORY_ROW_START_TIME';
codes[4164] = 'ER_PART_STARTS_BEYOND_INTERVAL';
codes[4165] = 'ER_GALERA_REPLICATION_NOT_SUPPORTED';
codes[4166] = 'ER_LOAD_INFILE_CAPABILITY_DISABLED';
codes[4167] = 'ER_NO_SECURE_TRANSPORTS_CONFIGURED';
codes[4168] = 'ER_SLAVE_IGNORED_SHARED_TABLE';
codes[4169] = 'ER_NO_AUTOINCREMENT_WITH_UNIQUE';
codes[4170] = 'ER_KEY_CONTAINS_PERIOD_FIELDS';
codes[4171] = 'ER_KEY_CANT_HAVE_WITHOUT_OVERLAPS';
codes[4172] = 'ER_NOT_ALLOWED_IN_THIS_CONTEXT';
codes[4173] = 'ER_DATA_WAS_COMMITED_UNDER_ROLLBACK';
codes[4174] = 'ER_PK_INDEX_CANT_BE_IGNORED';
codes[4175] = 'ER_BINLOG_UNSAFE_SKIP_LOCKED';
codes[4176] = 'ER_JSON_TABLE_ERROR_ON_FIELD';
codes[4177] = 'ER_JSON_TABLE_ALIAS_REQUIRED';
codes[4178] = 'ER_JSON_TABLE_SCALAR_EXPECTED';
codes[4179] = 'ER_JSON_TABLE_MULTIPLE_MATCHES';
codes[4180] = 'ER_WITH_TIES_NEEDS_ORDER';
codes[4181] = 'ER_REMOVED_ORPHAN_TRIGGER';
codes[4182] = 'ER_STORAGE_ENGINE_DISABLED';
codes[4183] = 'WARN_SFORMAT_ERROR';
codes[4184] = 'ER_PARTITION_CONVERT_SUBPARTITIONED';
codes[4185] = 'ER_PROVIDER_NOT_LOADED';
codes[4186] = 'ER_JSON_HISTOGRAM_PARSE_FAILED';
codes[4187] = 'ER_SF_OUT_INOUT_ARG_NOT_ALLOWED';
codes[4188] = 'ER_INCONSISTENT_SLAVE_TEMP_TABLE';
codes[4189] = 'ER_VERS_HIST_PART_FAILED';

module.exports.codes = codes;


/***/ }),
/* 15 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Packet = __webpack_require__(12);
const Iconv = __webpack_require__(16);

class PacketIconvEncoded extends Packet {
  constructor(encoding) {
    super();
    this.encoding = encoding;
  }

  readStringLengthEncoded() {
    const len = this.readUnsignedLength();
    if (len === null) return null;

    this.pos += len;
    return Iconv.decode(this.buf.subarray(this.pos - len, this.pos), this.encoding);
  }

  readString(buf, beg, len) {
    return Iconv.decode(buf.subarray(beg, beg + len), this.encoding);
  }

  subPacketLengthEncoded(len) {
    this.skip(len);
    return new PacketIconvEncoded(this.encoding).update(this.buf, this.pos - len, this.pos);
  }

  readStringRemaining() {
    const str = Iconv.decode(this.buf.subarray(this.pos, this.end), this.encoding);
    this.pos = this.end;
    return str;
  }
}

module.exports = PacketIconvEncoded;


/***/ }),
/* 16 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Buffer = (__webpack_require__(17).Buffer);

var bomHandling = __webpack_require__(19),
    iconv = module.exports;

// All codecs and aliases are kept here, keyed by encoding name/alias.
// They are lazy loaded in `iconv.getCodec` from `encodings/index.js`.
iconv.encodings = null;

// Characters emitted in case of error.
iconv.defaultCharUnicode = '�';
iconv.defaultCharSingleByte = '?';

// Public API.
iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || ""); // Ensure string.

    var encoder = iconv.getEncoder(encoding, options);

    var res = encoder.write(str);
    var trail = encoder.end();
    
    return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
}

iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === 'string') {
        if (!iconv.skipDecodeWarning) {
            console.error('Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding');
            iconv.skipDecodeWarning = true;
        }

        buf = Buffer.from("" + (buf || ""), "binary"); // Ensure buffer.
    }

    var decoder = iconv.getDecoder(encoding, options);

    var res = decoder.write(buf);
    var trail = decoder.end();

    return trail ? (res + trail) : res;
}

iconv.encodingExists = function encodingExists(enc) {
    try {
        iconv.getCodec(enc);
        return true;
    } catch (e) {
        return false;
    }
}

// Legacy aliases to convert functions
iconv.toEncoding = iconv.encode;
iconv.fromEncoding = iconv.decode;

// Search for a codec in iconv.encodings. Cache codec data in iconv._codecDataCache.
iconv._codecDataCache = {};
iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
        iconv.encodings = __webpack_require__(20); // Lazy load all encoding definitions.
    
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    var enc = iconv._canonicalizeEncoding(encoding);

    // Traverse iconv.encodings to find actual codec.
    var codecOptions = {};
    while (true) {
        var codec = iconv._codecDataCache[enc];
        if (codec)
            return codec;

        var codecDef = iconv.encodings[enc];

        switch (typeof codecDef) {
            case "string": // Direct alias to other encoding.
                enc = codecDef;
                break;

            case "object": // Alias with options. Can be layered.
                for (var key in codecDef)
                    codecOptions[key] = codecDef[key];

                if (!codecOptions.encodingName)
                    codecOptions.encodingName = enc;
                
                enc = codecDef.type;
                break;

            case "function": // Codec itself.
                if (!codecOptions.encodingName)
                    codecOptions.encodingName = enc;

                // The codec function must load all tables and return object with .encoder and .decoder methods.
                // It'll be called only once (for each different options object).
                codec = new codecDef(codecOptions, iconv);

                iconv._codecDataCache[codecOptions.encodingName] = codec; // Save it to be reused later.
                return codec;

            default:
                throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '"+enc+"')");
        }
    }
}

iconv._canonicalizeEncoding = function(encoding) {
    // Canonicalize encoding name: strip all non-alphanumeric chars and appended year.
    return (''+encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
}

iconv.getEncoder = function getEncoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        encoder = new codec.encoder(options, codec);

    if (codec.bomAware && options && options.addBOM)
        encoder = new bomHandling.PrependBOM(encoder, options);

    return encoder;
}

iconv.getDecoder = function getDecoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        decoder = new codec.decoder(options, codec);

    if (codec.bomAware && !(options && options.stripBOM === false))
        decoder = new bomHandling.StripBOM(decoder, options);

    return decoder;
}

// Streaming API
// NOTE: Streaming API naturally depends on 'stream' module from Node.js. Unfortunately in browser environments this module can add
// up to 100Kb to the output bundle. To avoid unnecessary code bloat, we don't enable Streaming API in browser by default.
// If you would like to enable it explicitly, please add the following code to your app:
// > iconv.enableStreamingAPI(require('stream'));
iconv.enableStreamingAPI = function enableStreamingAPI(stream_module) {
    if (iconv.supportsStreams)
        return;

    // Dependency-inject stream module to create IconvLite stream classes.
    var streams = __webpack_require__(39)(stream_module);

    // Not public API yet, but expose the stream classes.
    iconv.IconvLiteEncoderStream = streams.IconvLiteEncoderStream;
    iconv.IconvLiteDecoderStream = streams.IconvLiteDecoderStream;

    // Streaming API.
    iconv.encodeStream = function encodeStream(encoding, options) {
        return new iconv.IconvLiteEncoderStream(iconv.getEncoder(encoding, options), options);
    }

    iconv.decodeStream = function decodeStream(encoding, options) {
        return new iconv.IconvLiteDecoderStream(iconv.getDecoder(encoding, options), options);
    }

    iconv.supportsStreams = true;
}

// Enable Streaming API automatically if 'stream' module is available and non-empty (the majority of environments).
var stream_module;
try {
    stream_module = __webpack_require__(40);
} catch (e) {}

if (stream_module && stream_module.Transform) {
    iconv.enableStreamingAPI(stream_module);

} else {
    // In rare cases where 'stream' module is not available by default, throw a helpful exception.
    iconv.encodeStream = iconv.decodeStream = function() {
        throw new Error("iconv-lite Streaming API is not enabled. Use iconv.enableStreamingAPI(require('stream')); to enable it.");
    };
}

if (false) {}


/***/ }),
/* 17 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint-disable node/no-deprecated-api */



var buffer = __webpack_require__(18)
var Buffer = buffer.Buffer

var safer = {}

var key

for (key in buffer) {
  if (!buffer.hasOwnProperty(key)) continue
  if (key === 'SlowBuffer' || key === 'Buffer') continue
  safer[key] = buffer[key]
}

var Safer = safer.Buffer = {}
for (key in Buffer) {
  if (!Buffer.hasOwnProperty(key)) continue
  if (key === 'allocUnsafe' || key === 'allocUnsafeSlow') continue
  Safer[key] = Buffer[key]
}

safer.Buffer.prototype = Buffer.prototype

if (!Safer.from || Safer.from === Uint8Array.from) {
  Safer.from = function (value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value)
    }
    if (value && typeof value.length === 'undefined') {
      throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' + typeof value)
    }
    return Buffer(value, encodingOrOffset, length)
  }
}

if (!Safer.alloc) {
  Safer.alloc = function (size, fill, encoding) {
    if (typeof size !== 'number') {
      throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size)
    }
    if (size < 0 || size >= 2 * (1 << 30)) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"')
    }
    var buf = Buffer(size)
    if (!fill || fill.length === 0) {
      buf.fill(0)
    } else if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
    return buf
  }
}

if (!safer.kStringMaxLength) {
  try {
    safer.kStringMaxLength = process.binding('buffer').kStringMaxLength
  } catch (e) {
    // we can't determine kStringMaxLength in environments where process.binding
    // is unsupported, so let's not set it
  }
}

if (!safer.constants) {
  safer.constants = {
    MAX_LENGTH: safer.kMaxLength
  }
  if (safer.kStringMaxLength) {
    safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength
  }
}

module.exports = safer


/***/ }),
/* 18 */
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var BOMChar = '\uFEFF';

exports.PrependBOM = PrependBOMWrapper
function PrependBOMWrapper(encoder, options) {
    this.encoder = encoder;
    this.addBOM = true;
}

PrependBOMWrapper.prototype.write = function(str) {
    if (this.addBOM) {
        str = BOMChar + str;
        this.addBOM = false;
    }

    return this.encoder.write(str);
}

PrependBOMWrapper.prototype.end = function() {
    return this.encoder.end();
}


//------------------------------------------------------------------------------

exports.StripBOM = StripBOMWrapper;
function StripBOMWrapper(decoder, options) {
    this.decoder = decoder;
    this.pass = false;
    this.options = options || {};
}

StripBOMWrapper.prototype.write = function(buf) {
    var res = this.decoder.write(buf);
    if (this.pass || !res)
        return res;

    if (res[0] === BOMChar) {
        res = res.slice(1);
        if (typeof this.options.stripBOM === 'function')
            this.options.stripBOM();
    }

    this.pass = true;
    return res;
}

StripBOMWrapper.prototype.end = function() {
    return this.decoder.end();
}



/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


// Update this array if you add/rename/remove files in this directory.
// We support Browserify by skipping automatic module discovery and requiring modules directly.
var modules = [
    __webpack_require__(21),
    __webpack_require__(23),
    __webpack_require__(24),
    __webpack_require__(25),
    __webpack_require__(26),
    __webpack_require__(27),
    __webpack_require__(28),
    __webpack_require__(29),
    __webpack_require__(30),
];

// Put all encoding/alias/codec definitions to single object and export it.
for (var i = 0; i < modules.length; i++) {
    var module = modules[i];
    for (var enc in module)
        if (Object.prototype.hasOwnProperty.call(module, enc))
            exports[enc] = module[enc];
}


/***/ }),
/* 21 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var Buffer = (__webpack_require__(17).Buffer);

// Export Node.js internal encodings.

module.exports = {
    // Encodings
    utf8:   { type: "_internal", bomAware: true},
    cesu8:  { type: "_internal", bomAware: true},
    unicode11utf8: "utf8",

    ucs2:   { type: "_internal", bomAware: true},
    utf16le: "ucs2",

    binary: { type: "_internal" },
    base64: { type: "_internal" },
    hex:    { type: "_internal" },

    // Codec.
    _internal: InternalCodec,
};

//------------------------------------------------------------------------------

function InternalCodec(codecOptions, iconv) {
    this.enc = codecOptions.encodingName;
    this.bomAware = codecOptions.bomAware;

    if (this.enc === "base64")
        this.encoder = InternalEncoderBase64;
    else if (this.enc === "cesu8") {
        this.enc = "utf8"; // Use utf8 for decoding.
        this.encoder = InternalEncoderCesu8;

        // Add decoder for versions of Node not supporting CESU-8
        if (Buffer.from('eda0bdedb2a9', 'hex').toString() !== '💩') {
            this.decoder = InternalDecoderCesu8;
            this.defaultCharUnicode = iconv.defaultCharUnicode;
        }
    }
}

InternalCodec.prototype.encoder = InternalEncoder;
InternalCodec.prototype.decoder = InternalDecoder;

//------------------------------------------------------------------------------

// We use node.js internal decoder. Its signature is the same as ours.
var StringDecoder = (__webpack_require__(22).StringDecoder);

if (!StringDecoder.prototype.end) // Node v0.8 doesn't have this method.
    StringDecoder.prototype.end = function() {};


function InternalDecoder(options, codec) {
    this.decoder = new StringDecoder(codec.enc);
}

InternalDecoder.prototype.write = function(buf) {
    if (!Buffer.isBuffer(buf)) {
        buf = Buffer.from(buf);
    }

    return this.decoder.write(buf);
}

InternalDecoder.prototype.end = function() {
    return this.decoder.end();
}


//------------------------------------------------------------------------------
// Encoder is mostly trivial

function InternalEncoder(options, codec) {
    this.enc = codec.enc;
}

InternalEncoder.prototype.write = function(str) {
    return Buffer.from(str, this.enc);
}

InternalEncoder.prototype.end = function() {
}


//------------------------------------------------------------------------------
// Except base64 encoder, which must keep its state.

function InternalEncoderBase64(options, codec) {
    this.prevStr = '';
}

InternalEncoderBase64.prototype.write = function(str) {
    str = this.prevStr + str;
    var completeQuads = str.length - (str.length % 4);
    this.prevStr = str.slice(completeQuads);
    str = str.slice(0, completeQuads);

    return Buffer.from(str, "base64");
}

InternalEncoderBase64.prototype.end = function() {
    return Buffer.from(this.prevStr, "base64");
}


//------------------------------------------------------------------------------
// CESU-8 encoder is also special.

function InternalEncoderCesu8(options, codec) {
}

InternalEncoderCesu8.prototype.write = function(str) {
    var buf = Buffer.alloc(str.length * 3), bufIdx = 0;
    for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        // Naive implementation, but it works because CESU-8 is especially easy
        // to convert from UTF-16 (which all JS strings are encoded in).
        if (charCode < 0x80)
            buf[bufIdx++] = charCode;
        else if (charCode < 0x800) {
            buf[bufIdx++] = 0xC0 + (charCode >>> 6);
            buf[bufIdx++] = 0x80 + (charCode & 0x3f);
        }
        else { // charCode will always be < 0x10000 in javascript.
            buf[bufIdx++] = 0xE0 + (charCode >>> 12);
            buf[bufIdx++] = 0x80 + ((charCode >>> 6) & 0x3f);
            buf[bufIdx++] = 0x80 + (charCode & 0x3f);
        }
    }
    return buf.slice(0, bufIdx);
}

InternalEncoderCesu8.prototype.end = function() {
}

//------------------------------------------------------------------------------
// CESU-8 decoder is not implemented in Node v4.0+

function InternalDecoderCesu8(options, codec) {
    this.acc = 0;
    this.contBytes = 0;
    this.accBytes = 0;
    this.defaultCharUnicode = codec.defaultCharUnicode;
}

InternalDecoderCesu8.prototype.write = function(buf) {
    var acc = this.acc, contBytes = this.contBytes, accBytes = this.accBytes, 
        res = '';
    for (var i = 0; i < buf.length; i++) {
        var curByte = buf[i];
        if ((curByte & 0xC0) !== 0x80) { // Leading byte
            if (contBytes > 0) { // Previous code is invalid
                res += this.defaultCharUnicode;
                contBytes = 0;
            }

            if (curByte < 0x80) { // Single-byte code
                res += String.fromCharCode(curByte);
            } else if (curByte < 0xE0) { // Two-byte code
                acc = curByte & 0x1F;
                contBytes = 1; accBytes = 1;
            } else if (curByte < 0xF0) { // Three-byte code
                acc = curByte & 0x0F;
                contBytes = 2; accBytes = 1;
            } else { // Four or more are not supported for CESU-8.
                res += this.defaultCharUnicode;
            }
        } else { // Continuation byte
            if (contBytes > 0) { // We're waiting for it.
                acc = (acc << 6) | (curByte & 0x3f);
                contBytes--; accBytes++;
                if (contBytes === 0) {
                    // Check for overlong encoding, but support Modified UTF-8 (encoding NULL as C0 80)
                    if (accBytes === 2 && acc < 0x80 && acc > 0)
                        res += this.defaultCharUnicode;
                    else if (accBytes === 3 && acc < 0x800)
                        res += this.defaultCharUnicode;
                    else
                        // Actually add character.
                        res += String.fromCharCode(acc);
                }
            } else { // Unexpected continuation byte
                res += this.defaultCharUnicode;
            }
        }
    }
    this.acc = acc; this.contBytes = contBytes; this.accBytes = accBytes;
    return res;
}

InternalDecoderCesu8.prototype.end = function() {
    var res = 0;
    if (this.contBytes > 0)
        res += this.defaultCharUnicode;
    return res;
}


/***/ }),
/* 22 */
/***/ ((module) => {

"use strict";
module.exports = require("string_decoder");

/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var Buffer = (__webpack_require__(17).Buffer);

// == UTF32-LE/BE codec. ==========================================================

exports._utf32 = Utf32Codec;

function Utf32Codec(codecOptions, iconv) {
    this.iconv = iconv;
    this.bomAware = true;
    this.isLE = codecOptions.isLE;
}

exports.utf32le = { type: '_utf32', isLE: true };
exports.utf32be = { type: '_utf32', isLE: false };

// Aliases
exports.ucs4le = 'utf32le';
exports.ucs4be = 'utf32be';

Utf32Codec.prototype.encoder = Utf32Encoder;
Utf32Codec.prototype.decoder = Utf32Decoder;

// -- Encoding

function Utf32Encoder(options, codec) {
    this.isLE = codec.isLE;
    this.highSurrogate = 0;
}

Utf32Encoder.prototype.write = function(str) {
    var src = Buffer.from(str, 'ucs2');
    var dst = Buffer.alloc(src.length * 2);
    var write32 = this.isLE ? dst.writeUInt32LE : dst.writeUInt32BE;
    var offset = 0;

    for (var i = 0; i < src.length; i += 2) {
        var code = src.readUInt16LE(i);
        var isHighSurrogate = (0xD800 <= code && code < 0xDC00);
        var isLowSurrogate = (0xDC00 <= code && code < 0xE000);

        if (this.highSurrogate) {
            if (isHighSurrogate || !isLowSurrogate) {
                // There shouldn't be two high surrogates in a row, nor a high surrogate which isn't followed by a low
                // surrogate. If this happens, keep the pending high surrogate as a stand-alone semi-invalid character
                // (technically wrong, but expected by some applications, like Windows file names).
                write32.call(dst, this.highSurrogate, offset);
                offset += 4;
            }
            else {
                // Create 32-bit value from high and low surrogates;
                var codepoint = (((this.highSurrogate - 0xD800) << 10) | (code - 0xDC00)) + 0x10000;

                write32.call(dst, codepoint, offset);
                offset += 4;
                this.highSurrogate = 0;

                continue;
            }
        }

        if (isHighSurrogate)
            this.highSurrogate = code;
        else {
            // Even if the current character is a low surrogate, with no previous high surrogate, we'll
            // encode it as a semi-invalid stand-alone character for the same reasons expressed above for
            // unpaired high surrogates.
            write32.call(dst, code, offset);
            offset += 4;
            this.highSurrogate = 0;
        }
    }

    if (offset < dst.length)
        dst = dst.slice(0, offset);

    return dst;
};

Utf32Encoder.prototype.end = function() {
    // Treat any leftover high surrogate as a semi-valid independent character.
    if (!this.highSurrogate)
        return;

    var buf = Buffer.alloc(4);

    if (this.isLE)
        buf.writeUInt32LE(this.highSurrogate, 0);
    else
        buf.writeUInt32BE(this.highSurrogate, 0);

    this.highSurrogate = 0;

    return buf;
};

// -- Decoding

function Utf32Decoder(options, codec) {
    this.isLE = codec.isLE;
    this.badChar = codec.iconv.defaultCharUnicode.charCodeAt(0);
    this.overflow = [];
}

Utf32Decoder.prototype.write = function(src) {
    if (src.length === 0)
        return '';

    var i = 0;
    var codepoint = 0;
    var dst = Buffer.alloc(src.length + 4);
    var offset = 0;
    var isLE = this.isLE;
    var overflow = this.overflow;
    var badChar = this.badChar;

    if (overflow.length > 0) {
        for (; i < src.length && overflow.length < 4; i++)
            overflow.push(src[i]);
        
        if (overflow.length === 4) {
            // NOTE: codepoint is a signed int32 and can be negative.
            // NOTE: We copied this block from below to help V8 optimize it (it works with array, not buffer).
            if (isLE) {
                codepoint = overflow[i] | (overflow[i+1] << 8) | (overflow[i+2] << 16) | (overflow[i+3] << 24);
            } else {
                codepoint = overflow[i+3] | (overflow[i+2] << 8) | (overflow[i+1] << 16) | (overflow[i] << 24);
            }
            overflow.length = 0;

            offset = _writeCodepoint(dst, offset, codepoint, badChar);
        }
    }

    // Main loop. Should be as optimized as possible.
    for (; i < src.length - 3; i += 4) {
        // NOTE: codepoint is a signed int32 and can be negative.
        if (isLE) {
            codepoint = src[i] | (src[i+1] << 8) | (src[i+2] << 16) | (src[i+3] << 24);
        } else {
            codepoint = src[i+3] | (src[i+2] << 8) | (src[i+1] << 16) | (src[i] << 24);
        }
        offset = _writeCodepoint(dst, offset, codepoint, badChar);
    }

    // Keep overflowing bytes.
    for (; i < src.length; i++) {
        overflow.push(src[i]);
    }

    return dst.slice(0, offset).toString('ucs2');
};

function _writeCodepoint(dst, offset, codepoint, badChar) {
    // NOTE: codepoint is signed int32 and can be negative. We keep it that way to help V8 with optimizations.
    if (codepoint < 0 || codepoint > 0x10FFFF) {
        // Not a valid Unicode codepoint
        codepoint = badChar;
    } 

    // Ephemeral Planes: Write high surrogate.
    if (codepoint >= 0x10000) {
        codepoint -= 0x10000;

        var high = 0xD800 | (codepoint >> 10);
        dst[offset++] = high & 0xff;
        dst[offset++] = high >> 8;

        // Low surrogate is written below.
        var codepoint = 0xDC00 | (codepoint & 0x3FF);
    }

    // Write BMP char or low surrogate.
    dst[offset++] = codepoint & 0xff;
    dst[offset++] = codepoint >> 8;

    return offset;
};

Utf32Decoder.prototype.end = function() {
    this.overflow.length = 0;
};

// == UTF-32 Auto codec =============================================================
// Decoder chooses automatically from UTF-32LE and UTF-32BE using BOM and space-based heuristic.
// Defaults to UTF-32LE. http://en.wikipedia.org/wiki/UTF-32
// Encoder/decoder default can be changed: iconv.decode(buf, 'utf32', {defaultEncoding: 'utf-32be'});

// Encoder prepends BOM (which can be overridden with (addBOM: false}).

exports.utf32 = Utf32AutoCodec;
exports.ucs4 = 'utf32';

function Utf32AutoCodec(options, iconv) {
    this.iconv = iconv;
}

Utf32AutoCodec.prototype.encoder = Utf32AutoEncoder;
Utf32AutoCodec.prototype.decoder = Utf32AutoDecoder;

// -- Encoding

function Utf32AutoEncoder(options, codec) {
    options = options || {};

    if (options.addBOM === undefined)
        options.addBOM = true;

    this.encoder = codec.iconv.getEncoder(options.defaultEncoding || 'utf-32le', options);
}

Utf32AutoEncoder.prototype.write = function(str) {
    return this.encoder.write(str);
};

Utf32AutoEncoder.prototype.end = function() {
    return this.encoder.end();
};

// -- Decoding

function Utf32AutoDecoder(options, codec) {
    this.decoder = null;
    this.initialBufs = [];
    this.initialBufsLen = 0;
    this.options = options || {};
    this.iconv = codec.iconv;
}

Utf32AutoDecoder.prototype.write = function(buf) {
    if (!this.decoder) { 
        // Codec is not chosen yet. Accumulate initial bytes.
        this.initialBufs.push(buf);
        this.initialBufsLen += buf.length;

        if (this.initialBufsLen < 32) // We need more bytes to use space heuristic (see below)
            return '';

        // We have enough bytes -> detect endianness.
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        var resStr = '';
        for (var i = 0; i < this.initialBufs.length; i++)
            resStr += this.decoder.write(this.initialBufs[i]);

        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
    }

    return this.decoder.write(buf);
};

Utf32AutoDecoder.prototype.end = function() {
    if (!this.decoder) {
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        var resStr = '';
        for (var i = 0; i < this.initialBufs.length; i++)
            resStr += this.decoder.write(this.initialBufs[i]);

        var trail = this.decoder.end();
        if (trail)
            resStr += trail;

        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
    }

    return this.decoder.end();
};

function detectEncoding(bufs, defaultEncoding) {
    var b = [];
    var charsProcessed = 0;
    var invalidLE = 0, invalidBE = 0;   // Number of invalid chars when decoded as LE or BE.
    var bmpCharsLE = 0, bmpCharsBE = 0; // Number of BMP chars when decoded as LE or BE.

    outer_loop:
    for (var i = 0; i < bufs.length; i++) {
        var buf = bufs[i];
        for (var j = 0; j < buf.length; j++) {
            b.push(buf[j]);
            if (b.length === 4) {
                if (charsProcessed === 0) {
                    // Check BOM first.
                    if (b[0] === 0xFF && b[1] === 0xFE && b[2] === 0 && b[3] === 0) {
                        return 'utf-32le';
                    }
                    if (b[0] === 0 && b[1] === 0 && b[2] === 0xFE && b[3] === 0xFF) {
                        return 'utf-32be';
                    }
                }

                if (b[0] !== 0 || b[1] > 0x10) invalidBE++;
                if (b[3] !== 0 || b[2] > 0x10) invalidLE++;

                if (b[0] === 0 && b[1] === 0 && (b[2] !== 0 || b[3] !== 0)) bmpCharsBE++;
                if ((b[0] !== 0 || b[1] !== 0) && b[2] === 0 && b[3] === 0) bmpCharsLE++;

                b.length = 0;
                charsProcessed++;

                if (charsProcessed >= 100) {
                    break outer_loop;
                }
            }
        }
    }

    // Make decisions.
    if (bmpCharsBE - invalidBE > bmpCharsLE - invalidLE)  return 'utf-32be';
    if (bmpCharsBE - invalidBE < bmpCharsLE - invalidLE)  return 'utf-32le';

    // Couldn't decide (likely all zeros or not enough data).
    return defaultEncoding || 'utf-32le';
}


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

var Buffer = (__webpack_require__(17).Buffer);

// Note: UTF16-LE (or UCS2) codec is Node.js native. See encodings/internal.js

// == UTF16-BE codec. ==========================================================

exports.utf16be = Utf16BECodec;
function Utf16BECodec() {
}

Utf16BECodec.prototype.encoder = Utf16BEEncoder;
Utf16BECodec.prototype.decoder = Utf16BEDecoder;
Utf16BECodec.prototype.bomAware = true;


// -- Encoding

function Utf16BEEncoder() {
}

Utf16BEEncoder.prototype.write = function(str) {
    var buf = Buffer.from(str, 'ucs2');
    for (var i = 0; i < buf.length; i += 2) {
        var tmp = buf[i]; buf[i] = buf[i+1]; buf[i+1] = tmp;
    }
    return buf;
}

Utf16BEEncoder.prototype.end = function() {
}


// -- Decoding

function Utf16BEDecoder() {
    this.overflowByte = -1;
}

Utf16BEDecoder.prototype.write = function(buf) {
    if (buf.length == 0)
        return '';

    var buf2 = Buffer.alloc(buf.length + 1),
        i = 0, j = 0;

    if (this.overflowByte !== -1) {
        buf2[0] = buf[0];
        buf2[1] = this.overflowByte;
        i = 1; j = 2;
    }

    for (; i < buf.length-1; i += 2, j+= 2) {
        buf2[j] = buf[i+1];
        buf2[j+1] = buf[i];
    }

    this.overflowByte = (i == buf.length-1) ? buf[buf.length-1] : -1;

    return buf2.slice(0, j).toString('ucs2');
}

Utf16BEDecoder.prototype.end = function() {
    this.overflowByte = -1;
}


// == UTF-16 codec =============================================================
// Decoder chooses automatically from UTF-16LE and UTF-16BE using BOM and space-based heuristic.
// Defaults to UTF-16LE, as it's prevalent and default in Node.
// http://en.wikipedia.org/wiki/UTF-16 and http://encoding.spec.whatwg.org/#utf-16le
// Decoder default can be changed: iconv.decode(buf, 'utf16', {defaultEncoding: 'utf-16be'});

// Encoder uses UTF-16LE and prepends BOM (which can be overridden with addBOM: false).

exports.utf16 = Utf16Codec;
function Utf16Codec(codecOptions, iconv) {
    this.iconv = iconv;
}

Utf16Codec.prototype.encoder = Utf16Encoder;
Utf16Codec.prototype.decoder = Utf16Decoder;


// -- Encoding (pass-through)

function Utf16Encoder(options, codec) {
    options = options || {};
    if (options.addBOM === undefined)
        options.addBOM = true;
    this.encoder = codec.iconv.getEncoder('utf-16le', options);
}

Utf16Encoder.prototype.write = function(str) {
    return this.encoder.write(str);
}

Utf16Encoder.prototype.end = function() {
    return this.encoder.end();
}


// -- Decoding

function Utf16Decoder(options, codec) {
    this.decoder = null;
    this.initialBufs = [];
    this.initialBufsLen = 0;

    this.options = options || {};
    this.iconv = codec.iconv;
}

Utf16Decoder.prototype.write = function(buf) {
    if (!this.decoder) {
        // Codec is not chosen yet. Accumulate initial bytes.
        this.initialBufs.push(buf);
        this.initialBufsLen += buf.length;
        
        if (this.initialBufsLen < 16) // We need more bytes to use space heuristic (see below)
            return '';

        // We have enough bytes -> detect endianness.
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        var resStr = '';
        for (var i = 0; i < this.initialBufs.length; i++)
            resStr += this.decoder.write(this.initialBufs[i]);

        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
    }

    return this.decoder.write(buf);
}

Utf16Decoder.prototype.end = function() {
    if (!this.decoder) {
        var encoding = detectEncoding(this.initialBufs, this.options.defaultEncoding);
        this.decoder = this.iconv.getDecoder(encoding, this.options);

        var resStr = '';
        for (var i = 0; i < this.initialBufs.length; i++)
            resStr += this.decoder.write(this.initialBufs[i]);

        var trail = this.decoder.end();
        if (trail)
            resStr += trail;

        this.initialBufs.length = this.initialBufsLen = 0;
        return resStr;
    }
    return this.decoder.end();
}

function detectEncoding(bufs, defaultEncoding) {
    var b = [];
    var charsProcessed = 0;
    var asciiCharsLE = 0, asciiCharsBE = 0; // Number of ASCII chars when decoded as LE or BE.

    outer_loop:
    for (var i = 0; i < bufs.length; i++) {
        var buf = bufs[i];
        for (var j = 0; j < buf.length; j++) {
            b.push(buf[j]);
            if (b.length === 2) {
                if (charsProcessed === 0) {
                    // Check BOM first.
                    if (b[0] === 0xFF && b[1] === 0xFE) return 'utf-16le';
                    if (b[0] === 0xFE && b[1] === 0xFF) return 'utf-16be';
                }

                if (b[0] === 0 && b[1] !== 0) asciiCharsBE++;
                if (b[0] !== 0 && b[1] === 0) asciiCharsLE++;

                b.length = 0;
                charsProcessed++;

                if (charsProcessed >= 100) {
                    break outer_loop;
                }
            }
        }
    }

    // Make decisions.
    // Most of the time, the content has ASCII chars (U+00**), but the opposite (U+**00) is uncommon.
    // So, we count ASCII as if it was LE or BE, and decide from that.
    if (asciiCharsBE > asciiCharsLE) return 'utf-16be';
    if (asciiCharsBE < asciiCharsLE) return 'utf-16le';

    // Couldn't decide (likely all zeros or not enough data).
    return defaultEncoding || 'utf-16le';
}




/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

var Buffer = (__webpack_require__(17).Buffer);

// UTF-7 codec, according to https://tools.ietf.org/html/rfc2152
// See also below a UTF-7-IMAP codec, according to http://tools.ietf.org/html/rfc3501#section-5.1.3

exports.utf7 = Utf7Codec;
exports.unicode11utf7 = 'utf7'; // Alias UNICODE-1-1-UTF-7
function Utf7Codec(codecOptions, iconv) {
    this.iconv = iconv;
};

Utf7Codec.prototype.encoder = Utf7Encoder;
Utf7Codec.prototype.decoder = Utf7Decoder;
Utf7Codec.prototype.bomAware = true;


// -- Encoding

var nonDirectChars = /[^A-Za-z0-9'\(\),-\.\/:\? \n\r\t]+/g;

function Utf7Encoder(options, codec) {
    this.iconv = codec.iconv;
}

Utf7Encoder.prototype.write = function(str) {
    // Naive implementation.
    // Non-direct chars are encoded as "+<base64>-"; single "+" char is encoded as "+-".
    return Buffer.from(str.replace(nonDirectChars, function(chunk) {
        return "+" + (chunk === '+' ? '' : 
            this.iconv.encode(chunk, 'utf16-be').toString('base64').replace(/=+$/, '')) 
            + "-";
    }.bind(this)));
}

Utf7Encoder.prototype.end = function() {
}


// -- Decoding

function Utf7Decoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = '';
}

var base64Regex = /[A-Za-z0-9\/+]/;
var base64Chars = [];
for (var i = 0; i < 256; i++)
    base64Chars[i] = base64Regex.test(String.fromCharCode(i));

var plusChar = '+'.charCodeAt(0), 
    minusChar = '-'.charCodeAt(0),
    andChar = '&'.charCodeAt(0);

Utf7Decoder.prototype.write = function(buf) {
    var res = "", lastI = 0,
        inBase64 = this.inBase64,
        base64Accum = this.base64Accum;

    // The decoder is more involved as we must handle chunks in stream.

    for (var i = 0; i < buf.length; i++) {
        if (!inBase64) { // We're in direct mode.
            // Write direct chars until '+'
            if (buf[i] == plusChar) {
                res += this.iconv.decode(buf.slice(lastI, i), "ascii"); // Write direct chars.
                lastI = i+1;
                inBase64 = true;
            }
        } else { // We decode base64.
            if (!base64Chars[buf[i]]) { // Base64 ended.
                if (i == lastI && buf[i] == minusChar) {// "+-" -> "+"
                    res += "+";
                } else {
                    var b64str = base64Accum + this.iconv.decode(buf.slice(lastI, i), "ascii");
                    res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
                }

                if (buf[i] != minusChar) // Minus is absorbed after base64.
                    i--;

                lastI = i+1;
                inBase64 = false;
                base64Accum = '';
            }
        }
    }

    if (!inBase64) {
        res += this.iconv.decode(buf.slice(lastI), "ascii"); // Write direct chars.
    } else {
        var b64str = base64Accum + this.iconv.decode(buf.slice(lastI), "ascii");

        var canBeDecoded = b64str.length - (b64str.length % 8); // Minimal chunk: 2 quads -> 2x3 bytes -> 3 chars.
        base64Accum = b64str.slice(canBeDecoded); // The rest will be decoded in future.
        b64str = b64str.slice(0, canBeDecoded);

        res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
    }

    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;

    return res;
}

Utf7Decoder.prototype.end = function() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
        res = this.iconv.decode(Buffer.from(this.base64Accum, 'base64'), "utf16-be");

    this.inBase64 = false;
    this.base64Accum = '';
    return res;
}


// UTF-7-IMAP codec.
// RFC3501 Sec. 5.1.3 Modified UTF-7 (http://tools.ietf.org/html/rfc3501#section-5.1.3)
// Differences:
//  * Base64 part is started by "&" instead of "+"
//  * Direct characters are 0x20-0x7E, except "&" (0x26)
//  * In Base64, "," is used instead of "/"
//  * Base64 must not be used to represent direct characters.
//  * No implicit shift back from Base64 (should always end with '-')
//  * String must end in non-shifted position.
//  * "-&" while in base64 is not allowed.


exports.utf7imap = Utf7IMAPCodec;
function Utf7IMAPCodec(codecOptions, iconv) {
    this.iconv = iconv;
};

Utf7IMAPCodec.prototype.encoder = Utf7IMAPEncoder;
Utf7IMAPCodec.prototype.decoder = Utf7IMAPDecoder;
Utf7IMAPCodec.prototype.bomAware = true;


// -- Encoding

function Utf7IMAPEncoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = Buffer.alloc(6);
    this.base64AccumIdx = 0;
}

Utf7IMAPEncoder.prototype.write = function(str) {
    var inBase64 = this.inBase64,
        base64Accum = this.base64Accum,
        base64AccumIdx = this.base64AccumIdx,
        buf = Buffer.alloc(str.length*5 + 10), bufIdx = 0;

    for (var i = 0; i < str.length; i++) {
        var uChar = str.charCodeAt(i);
        if (0x20 <= uChar && uChar <= 0x7E) { // Direct character or '&'.
            if (inBase64) {
                if (base64AccumIdx > 0) {
                    bufIdx += buf.write(base64Accum.slice(0, base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
                    base64AccumIdx = 0;
                }

                buf[bufIdx++] = minusChar; // Write '-', then go to direct mode.
                inBase64 = false;
            }

            if (!inBase64) {
                buf[bufIdx++] = uChar; // Write direct character

                if (uChar === andChar)  // Ampersand -> '&-'
                    buf[bufIdx++] = minusChar;
            }

        } else { // Non-direct character
            if (!inBase64) {
                buf[bufIdx++] = andChar; // Write '&', then go to base64 mode.
                inBase64 = true;
            }
            if (inBase64) {
                base64Accum[base64AccumIdx++] = uChar >> 8;
                base64Accum[base64AccumIdx++] = uChar & 0xFF;

                if (base64AccumIdx == base64Accum.length) {
                    bufIdx += buf.write(base64Accum.toString('base64').replace(/\//g, ','), bufIdx);
                    base64AccumIdx = 0;
                }
            }
        }
    }

    this.inBase64 = inBase64;
    this.base64AccumIdx = base64AccumIdx;

    return buf.slice(0, bufIdx);
}

Utf7IMAPEncoder.prototype.end = function() {
    var buf = Buffer.alloc(10), bufIdx = 0;
    if (this.inBase64) {
        if (this.base64AccumIdx > 0) {
            bufIdx += buf.write(this.base64Accum.slice(0, this.base64AccumIdx).toString('base64').replace(/\//g, ',').replace(/=+$/, ''), bufIdx);
            this.base64AccumIdx = 0;
        }

        buf[bufIdx++] = minusChar; // Write '-', then go to direct mode.
        this.inBase64 = false;
    }

    return buf.slice(0, bufIdx);
}


// -- Decoding

function Utf7IMAPDecoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = '';
}

var base64IMAPChars = base64Chars.slice();
base64IMAPChars[','.charCodeAt(0)] = true;

Utf7IMAPDecoder.prototype.write = function(buf) {
    var res = "", lastI = 0,
        inBase64 = this.inBase64,
        base64Accum = this.base64Accum;

    // The decoder is more involved as we must handle chunks in stream.
    // It is forgiving, closer to standard UTF-7 (for example, '-' is optional at the end).

    for (var i = 0; i < buf.length; i++) {
        if (!inBase64) { // We're in direct mode.
            // Write direct chars until '&'
            if (buf[i] == andChar) {
                res += this.iconv.decode(buf.slice(lastI, i), "ascii"); // Write direct chars.
                lastI = i+1;
                inBase64 = true;
            }
        } else { // We decode base64.
            if (!base64IMAPChars[buf[i]]) { // Base64 ended.
                if (i == lastI && buf[i] == minusChar) { // "&-" -> "&"
                    res += "&";
                } else {
                    var b64str = base64Accum + this.iconv.decode(buf.slice(lastI, i), "ascii").replace(/,/g, '/');
                    res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
                }

                if (buf[i] != minusChar) // Minus may be absorbed after base64.
                    i--;

                lastI = i+1;
                inBase64 = false;
                base64Accum = '';
            }
        }
    }

    if (!inBase64) {
        res += this.iconv.decode(buf.slice(lastI), "ascii"); // Write direct chars.
    } else {
        var b64str = base64Accum + this.iconv.decode(buf.slice(lastI), "ascii").replace(/,/g, '/');

        var canBeDecoded = b64str.length - (b64str.length % 8); // Minimal chunk: 2 quads -> 2x3 bytes -> 3 chars.
        base64Accum = b64str.slice(canBeDecoded); // The rest will be decoded in future.
        b64str = b64str.slice(0, canBeDecoded);

        res += this.iconv.decode(Buffer.from(b64str, 'base64'), "utf16-be");
    }

    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;

    return res;
}

Utf7IMAPDecoder.prototype.end = function() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
        res = this.iconv.decode(Buffer.from(this.base64Accum, 'base64'), "utf16-be");

    this.inBase64 = false;
    this.base64Accum = '';
    return res;
}




/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

var Buffer = (__webpack_require__(17).Buffer);

// Single-byte codec. Needs a 'chars' string parameter that contains 256 or 128 chars that
// correspond to encoded bytes (if 128 - then lower half is ASCII). 

exports._sbcs = SBCSCodec;
function SBCSCodec(codecOptions, iconv) {
    if (!codecOptions)
        throw new Error("SBCS codec is called without the data.")
    
    // Prepare char buffer for decoding.
    if (!codecOptions.chars || (codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256))
        throw new Error("Encoding '"+codecOptions.type+"' has incorrect 'chars' (must be of len 128 or 256)");
    
    if (codecOptions.chars.length === 128) {
        var asciiString = "";
        for (var i = 0; i < 128; i++)
            asciiString += String.fromCharCode(i);
        codecOptions.chars = asciiString + codecOptions.chars;
    }

    this.decodeBuf = Buffer.from(codecOptions.chars, 'ucs2');
    
    // Encoding buffer.
    var encodeBuf = Buffer.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0));

    for (var i = 0; i < codecOptions.chars.length; i++)
        encodeBuf[codecOptions.chars.charCodeAt(i)] = i;

    this.encodeBuf = encodeBuf;
}

SBCSCodec.prototype.encoder = SBCSEncoder;
SBCSCodec.prototype.decoder = SBCSDecoder;


function SBCSEncoder(options, codec) {
    this.encodeBuf = codec.encodeBuf;
}

SBCSEncoder.prototype.write = function(str) {
    var buf = Buffer.alloc(str.length);
    for (var i = 0; i < str.length; i++)
        buf[i] = this.encodeBuf[str.charCodeAt(i)];
    
    return buf;
}

SBCSEncoder.prototype.end = function() {
}


function SBCSDecoder(options, codec) {
    this.decodeBuf = codec.decodeBuf;
}

SBCSDecoder.prototype.write = function(buf) {
    // Strings are immutable in JS -> we use ucs2 buffer to speed up computations.
    var decodeBuf = this.decodeBuf;
    var newBuf = Buffer.alloc(buf.length*2);
    var idx1 = 0, idx2 = 0;
    for (var i = 0; i < buf.length; i++) {
        idx1 = buf[i]*2; idx2 = i*2;
        newBuf[idx2] = decodeBuf[idx1];
        newBuf[idx2+1] = decodeBuf[idx1+1];
    }
    return newBuf.toString('ucs2');
}

SBCSDecoder.prototype.end = function() {
}


/***/ }),
/* 27 */
/***/ ((module) => {

"use strict";


// Manually added data to be used by sbcs codec in addition to generated one.

module.exports = {
    // Not supported by iconv, not sure why.
    "10029": "maccenteuro",
    "maccenteuro": {
        "type": "_sbcs",
        "chars": "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
    },

    "808": "cp808",
    "ibm808": "cp808",
    "cp808": {
        "type": "_sbcs",
        "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№€■ "
    },

    "mik": {
        "type": "_sbcs",
        "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя└┴┬├─┼╣║╚╔╩╦╠═╬┐░▒▓│┤№§╗╝┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },

    "cp720": {
        "type": "_sbcs",
        "chars": "\x80\x81éâ\x84à\x86çêëèïî\x8d\x8e\x8f\x90\u0651\u0652ô¤ـûùءآأؤ£إئابةتثجحخدذرزسشص«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ضطظعغفµقكلمنهوىي≡\u064b\u064c\u064d\u064e\u064f\u0650≈°∙·√ⁿ²■\u00a0"
    },

    // Aliases of generated encodings.
    "ascii8bit": "ascii",
    "usascii": "ascii",
    "ansix34": "ascii",
    "ansix341968": "ascii",
    "ansix341986": "ascii",
    "csascii": "ascii",
    "cp367": "ascii",
    "ibm367": "ascii",
    "isoir6": "ascii",
    "iso646us": "ascii",
    "iso646irv": "ascii",
    "us": "ascii",

    "latin1": "iso88591",
    "latin2": "iso88592",
    "latin3": "iso88593",
    "latin4": "iso88594",
    "latin5": "iso88599",
    "latin6": "iso885910",
    "latin7": "iso885913",
    "latin8": "iso885914",
    "latin9": "iso885915",
    "latin10": "iso885916",

    "csisolatin1": "iso88591",
    "csisolatin2": "iso88592",
    "csisolatin3": "iso88593",
    "csisolatin4": "iso88594",
    "csisolatincyrillic": "iso88595",
    "csisolatinarabic": "iso88596",
    "csisolatingreek" : "iso88597",
    "csisolatinhebrew": "iso88598",
    "csisolatin5": "iso88599",
    "csisolatin6": "iso885910",

    "l1": "iso88591",
    "l2": "iso88592",
    "l3": "iso88593",
    "l4": "iso88594",
    "l5": "iso88599",
    "l6": "iso885910",
    "l7": "iso885913",
    "l8": "iso885914",
    "l9": "iso885915",
    "l10": "iso885916",

    "isoir14": "iso646jp",
    "isoir57": "iso646cn",
    "isoir100": "iso88591",
    "isoir101": "iso88592",
    "isoir109": "iso88593",
    "isoir110": "iso88594",
    "isoir144": "iso88595",
    "isoir127": "iso88596",
    "isoir126": "iso88597",
    "isoir138": "iso88598",
    "isoir148": "iso88599",
    "isoir157": "iso885910",
    "isoir166": "tis620",
    "isoir179": "iso885913",
    "isoir199": "iso885914",
    "isoir203": "iso885915",
    "isoir226": "iso885916",

    "cp819": "iso88591",
    "ibm819": "iso88591",

    "cyrillic": "iso88595",

    "arabic": "iso88596",
    "arabic8": "iso88596",
    "ecma114": "iso88596",
    "asmo708": "iso88596",

    "greek" : "iso88597",
    "greek8" : "iso88597",
    "ecma118" : "iso88597",
    "elot928" : "iso88597",

    "hebrew": "iso88598",
    "hebrew8": "iso88598",

    "turkish": "iso88599",
    "turkish8": "iso88599",

    "thai": "iso885911",
    "thai8": "iso885911",

    "celtic": "iso885914",
    "celtic8": "iso885914",
    "isoceltic": "iso885914",

    "tis6200": "tis620",
    "tis62025291": "tis620",
    "tis62025330": "tis620",

    "10000": "macroman",
    "10006": "macgreek",
    "10007": "maccyrillic",
    "10079": "maciceland",
    "10081": "macturkish",

    "cspc8codepage437": "cp437",
    "cspc775baltic": "cp775",
    "cspc850multilingual": "cp850",
    "cspcp852": "cp852",
    "cspc862latinhebrew": "cp862",
    "cpgr": "cp869",

    "msee": "cp1250",
    "mscyrl": "cp1251",
    "msansi": "cp1252",
    "msgreek": "cp1253",
    "msturk": "cp1254",
    "mshebr": "cp1255",
    "msarab": "cp1256",
    "winbaltrim": "cp1257",

    "cp20866": "koi8r",
    "20866": "koi8r",
    "ibm878": "koi8r",
    "cskoi8r": "koi8r",

    "cp21866": "koi8u",
    "21866": "koi8u",
    "ibm1168": "koi8u",

    "strk10482002": "rk1048",

    "tcvn5712": "tcvn",
    "tcvn57121": "tcvn",

    "gb198880": "iso646cn",
    "cn": "iso646cn",

    "csiso14jisc6220ro": "iso646jp",
    "jisc62201969ro": "iso646jp",
    "jp": "iso646jp",

    "cshproman8": "hproman8",
    "r8": "hproman8",
    "roman8": "hproman8",
    "xroman8": "hproman8",
    "ibm1051": "hproman8",

    "mac": "macintosh",
    "csmacintosh": "macintosh",
};



/***/ }),
/* 28 */
/***/ ((module) => {

"use strict";


// Generated data for sbcs codec. Don't edit manually. Regenerate using generation/gen-sbcs.js script.
module.exports = {
  "437": "cp437",
  "737": "cp737",
  "775": "cp775",
  "850": "cp850",
  "852": "cp852",
  "855": "cp855",
  "856": "cp856",
  "857": "cp857",
  "858": "cp858",
  "860": "cp860",
  "861": "cp861",
  "862": "cp862",
  "863": "cp863",
  "864": "cp864",
  "865": "cp865",
  "866": "cp866",
  "869": "cp869",
  "874": "windows874",
  "922": "cp922",
  "1046": "cp1046",
  "1124": "cp1124",
  "1125": "cp1125",
  "1129": "cp1129",
  "1133": "cp1133",
  "1161": "cp1161",
  "1162": "cp1162",
  "1163": "cp1163",
  "1250": "windows1250",
  "1251": "windows1251",
  "1252": "windows1252",
  "1253": "windows1253",
  "1254": "windows1254",
  "1255": "windows1255",
  "1256": "windows1256",
  "1257": "windows1257",
  "1258": "windows1258",
  "28591": "iso88591",
  "28592": "iso88592",
  "28593": "iso88593",
  "28594": "iso88594",
  "28595": "iso88595",
  "28596": "iso88596",
  "28597": "iso88597",
  "28598": "iso88598",
  "28599": "iso88599",
  "28600": "iso885910",
  "28601": "iso885911",
  "28603": "iso885913",
  "28604": "iso885914",
  "28605": "iso885915",
  "28606": "iso885916",
  "windows874": {
    "type": "_sbcs",
    "chars": "€����…�����������‘’“”•–—�������� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
  },
  "win874": "windows874",
  "cp874": "windows874",
  "windows1250": {
    "type": "_sbcs",
    "chars": "€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
  },
  "win1250": "windows1250",
  "cp1250": "windows1250",
  "windows1251": {
    "type": "_sbcs",
    "chars": "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
  },
  "win1251": "windows1251",
  "cp1251": "windows1251",
  "windows1252": {
    "type": "_sbcs",
    "chars": "€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "win1252": "windows1252",
  "cp1252": "windows1252",
  "windows1253": {
    "type": "_sbcs",
    "chars": "€�‚ƒ„…†‡�‰�‹�����‘’“”•–—�™�›���� ΅Ά£¤¥¦§¨©�«¬­®―°±²³΄µ¶·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
  },
  "win1253": "windows1253",
  "cp1253": "windows1253",
  "windows1254": {
    "type": "_sbcs",
    "chars": "€�‚ƒ„…†‡ˆ‰Š‹Œ����‘’“”•–—˜™š›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
  },
  "win1254": "windows1254",
  "cp1254": "windows1254",
  "windows1255": {
    "type": "_sbcs",
    "chars": "€�‚ƒ„…†‡ˆ‰�‹�����‘’“”•–—˜™�›���� ¡¢£₪¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹֺֻּֽ־ֿ׀ׁׂ׃װױײ׳״�������אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
  },
  "win1255": "windows1255",
  "cp1255": "windows1255",
  "windows1256": {
    "type": "_sbcs",
    "chars": "€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں ،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے"
  },
  "win1256": "windows1256",
  "cp1256": "windows1256",
  "windows1257": {
    "type": "_sbcs",
    "chars": "€�‚�„…†‡�‰�‹�¨ˇ¸�‘’“”•–—�™�›�¯˛� �¢£¤�¦§Ø©Ŗ«¬­®Æ°±²³´µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž˙"
  },
  "win1257": "windows1257",
  "cp1257": "windows1257",
  "windows1258": {
    "type": "_sbcs",
    "chars": "€�‚ƒ„…†‡ˆ‰�‹Œ����‘’“”•–—˜™�›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
  },
  "win1258": "windows1258",
  "cp1258": "windows1258",
  "iso88591": {
    "type": "_sbcs",
    "chars": " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "cp28591": "iso88591",
  "iso88592": {
    "type": "_sbcs",
    "chars": " Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
  },
  "cp28592": "iso88592",
  "iso88593": {
    "type": "_sbcs",
    "chars": " Ħ˘£¤�Ĥ§¨İŞĞĴ­�Ż°ħ²³´µĥ·¸ışğĵ½�żÀÁÂ�ÄĊĈÇÈÉÊËÌÍÎÏ�ÑÒÓÔĠÖ×ĜÙÚÛÜŬŜßàáâ�äċĉçèéêëìíîï�ñòóôġö÷ĝùúûüŭŝ˙"
  },
  "cp28593": "iso88593",
  "iso88594": {
    "type": "_sbcs",
    "chars": " ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙"
  },
  "cp28594": "iso88594",
  "iso88595": {
    "type": "_sbcs",
    "chars": " ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ"
  },
  "cp28595": "iso88595",
  "iso88596": {
    "type": "_sbcs",
    "chars": " ���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������"
  },
  "cp28596": "iso88596",
  "iso88597": {
    "type": "_sbcs",
    "chars": " ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
  },
  "cp28597": "iso88597",
  "iso88598": {
    "type": "_sbcs",
    "chars": " �¢£¤¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
  },
  "cp28598": "iso88598",
  "iso88599": {
    "type": "_sbcs",
    "chars": " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
  },
  "cp28599": "iso88599",
  "iso885910": {
    "type": "_sbcs",
    "chars": " ĄĒĢĪĨĶ§ĻĐŠŦŽ­ŪŊ°ąēģīĩķ·ļđšŧž―ūŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎÏÐŅŌÓÔÕÖŨØŲÚÛÜÝÞßāáâãäåæįčéęëėíîïðņōóôõöũøųúûüýþĸ"
  },
  "cp28600": "iso885910",
  "iso885911": {
    "type": "_sbcs",
    "chars": " กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
  },
  "cp28601": "iso885911",
  "iso885913": {
    "type": "_sbcs",
    "chars": " ”¢£¤„¦§Ø©Ŗ«¬­®Æ°±²³“µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’"
  },
  "cp28603": "iso885913",
  "iso885914": {
    "type": "_sbcs",
    "chars": " Ḃḃ£ĊċḊ§Ẁ©ẂḋỲ­®ŸḞḟĠġṀṁ¶ṖẁṗẃṠỳẄẅṡÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŴÑÒÓÔÕÖṪØÙÚÛÜÝŶßàáâãäåæçèéêëìíîïŵñòóôõöṫøùúûüýŷÿ"
  },
  "cp28604": "iso885914",
  "iso885915": {
    "type": "_sbcs",
    "chars": " ¡¢£€¥Š§š©ª«¬­®¯°±²³Žµ¶·ž¹º»ŒœŸ¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "cp28605": "iso885915",
  "iso885916": {
    "type": "_sbcs",
    "chars": " ĄąŁ€„Š§š©Ș«Ź­źŻ°±ČłŽ”¶·žčș»ŒœŸżÀÁÂĂÄĆÆÇÈÉÊËÌÍÎÏĐŃÒÓÔŐÖŚŰÙÚÛÜĘȚßàáâăäćæçèéêëìíîïđńòóôőöśűùúûüęțÿ"
  },
  "cp28606": "iso885916",
  "cp437": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm437": "cp437",
  "csibm437": "cp437",
  "cp737": {
    "type": "_sbcs",
    "chars": "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ωάέήϊίόύϋώΆΈΉΊΌΎΏ±≥≤ΪΫ÷≈°∙·√ⁿ²■ "
  },
  "ibm737": "cp737",
  "csibm737": "cp737",
  "cp775": {
    "type": "_sbcs",
    "chars": "ĆüéāäģåćłēŖŗīŹÄÅÉæÆōöĢ¢ŚśÖÜø£Ø×¤ĀĪóŻżź”¦©®¬½¼Ł«»░▒▓│┤ĄČĘĖ╣║╗╝ĮŠ┐└┴┬├─┼ŲŪ╚╔╩╦╠═╬Žąčęėįšųūž┘┌█▄▌▐▀ÓßŌŃõÕµńĶķĻļņĒŅ’­±“¾¶§÷„°∙·¹³²■ "
  },
  "ibm775": "cp775",
  "csibm775": "cp775",
  "cp850": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
  },
  "ibm850": "cp850",
  "csibm850": "cp850",
  "cp852": {
    "type": "_sbcs",
    "chars": "ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■ "
  },
  "ibm852": "cp852",
  "csibm852": "cp852",
  "cp855": {
    "type": "_sbcs",
    "chars": "ђЂѓЃёЁєЄѕЅіІїЇјЈљЉњЊћЋќЌўЎџЏюЮъЪаАбБцЦдДеЕфФгГ«»░▒▓│┤хХиИ╣║╗╝йЙ┐└┴┬├─┼кК╚╔╩╦╠═╬¤лЛмМнНоОп┘┌█▄Пя▀ЯрРсСтТуУжЖвВьЬ№­ыЫзЗшШэЭщЩчЧ§■ "
  },
  "ibm855": "cp855",
  "csibm855": "cp855",
  "cp856": {
    "type": "_sbcs",
    "chars": "אבגדהוזחטיךכלםמןנסעףפץצקרשת�£�×����������®¬½¼�«»░▒▓│┤���©╣║╗╝¢¥┐└┴┬├─┼��╚╔╩╦╠═╬¤���������┘┌█▄¦�▀������µ�������¯´­±‗¾¶§÷¸°¨·¹³²■ "
  },
  "ibm856": "cp856",
  "csibm856": "cp856",
  "cp857": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèïîıÄÅÉæÆôöòûùİÖÜø£ØŞşáíóúñÑĞğ¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ºªÊËÈ�ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµ�×ÚÛÙìÿ¯´­±�¾¶§÷¸°¨·¹³²■ "
  },
  "ibm857": "cp857",
  "csibm857": "cp857",
  "cp858": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈ€ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
  },
  "ibm858": "cp858",
  "csibm858": "cp858",
  "cp860": {
    "type": "_sbcs",
    "chars": "ÇüéâãàÁçêÊèÍÔìÃÂÉÀÈôõòÚùÌÕÜ¢£Ù₧ÓáíóúñÑªº¿Ò¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm860": "cp860",
  "csibm860": "cp860",
  "cp861": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèÐðÞÄÅÉæÆôöþûÝýÖÜø£Ø₧ƒáíóúÁÍÓÚ¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm861": "cp861",
  "csibm861": "cp861",
  "cp862": {
    "type": "_sbcs",
    "chars": "אבגדהוזחטיךכלםמןנסעףפץצקרשת¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm862": "cp862",
  "csibm862": "cp862",
  "cp863": {
    "type": "_sbcs",
    "chars": "ÇüéâÂà¶çêëèïî‗À§ÉÈÊôËÏûù¤ÔÜ¢£ÙÛƒ¦´óú¨¸³¯Î⌐¬½¼¾«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm863": "cp863",
  "csibm863": "cp863",
  "cp864": {
    "type": "_sbcs",
    "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$٪&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~°·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ� ­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�"
  },
  "ibm864": "cp864",
  "csibm864": "cp864",
  "cp865": {
    "type": "_sbcs",
    "chars": "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø₧ƒáíóúñÑªº¿⌐¬½¼¡«¤░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
  },
  "ibm865": "cp865",
  "csibm865": "cp865",
  "cp866": {
    "type": "_sbcs",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■ "
  },
  "ibm866": "cp866",
  "csibm866": "cp866",
  "cp869": {
    "type": "_sbcs",
    "chars": "������Ά�·¬¦‘’Έ―ΉΊΪΌ��ΎΫ©Ώ²³ά£έήίϊΐόύΑΒΓΔΕΖΗ½ΘΙ«»░▒▓│┤ΚΛΜΝ╣║╗╝ΞΟ┐└┴┬├─┼ΠΡ╚╔╩╦╠═╬ΣΤΥΦΧΨΩαβγ┘┌█▄δε▀ζηθικλμνξοπρσςτ΄­±υφχ§ψ΅°¨ωϋΰώ■ "
  },
  "ibm869": "cp869",
  "csibm869": "cp869",
  "cp922": {
    "type": "_sbcs",
    "chars": " ¡¢£¤¥¦§¨©ª«¬­®‾°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŠÑÒÓÔÕÖ×ØÙÚÛÜÝŽßàáâãäåæçèéêëìíîïšñòóôõö÷øùúûüýžÿ"
  },
  "ibm922": "cp922",
  "csibm922": "cp922",
  "cp1046": {
    "type": "_sbcs",
    "chars": "ﺈ×÷ﹱ■│─┐┌└┘ﹹﹻﹽﹿﹷﺊﻰﻳﻲﻎﻏﻐﻶﻸﻺﻼ ¤ﺋﺑﺗﺛﺟﺣ،­ﺧﺳ٠١٢٣٤٥٦٧٨٩ﺷ؛ﺻﺿﻊ؟ﻋءآأؤإئابةتثجحخدذرزسشصضطﻇعغﻌﺂﺄﺎﻓـفقكلمنهوىيًٌٍَُِّْﻗﻛﻟﻵﻷﻹﻻﻣﻧﻬﻩ�"
  },
  "ibm1046": "cp1046",
  "csibm1046": "cp1046",
  "cp1124": {
    "type": "_sbcs",
    "chars": " ЁЂҐЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђґєѕіїјљњћќ§ўџ"
  },
  "ibm1124": "cp1124",
  "csibm1124": "cp1124",
  "cp1125": {
    "type": "_sbcs",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёҐґЄєІіЇї·√№¤■ "
  },
  "ibm1125": "cp1125",
  "csibm1125": "cp1125",
  "cp1129": {
    "type": "_sbcs",
    "chars": " ¡¢£¤¥¦§œ©ª«¬­®¯°±²³Ÿµ¶·Œ¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
  },
  "ibm1129": "cp1129",
  "csibm1129": "cp1129",
  "cp1133": {
    "type": "_sbcs",
    "chars": " ກຂຄງຈສຊຍດຕຖທນບປຜຝພຟມຢຣລວຫອຮ���ຯະາຳິີຶືຸູຼັົຽ���ເແໂໃໄ່້໊໋໌ໍໆ�ໜໝ₭����������������໐໑໒໓໔໕໖໗໘໙��¢¬¦�"
  },
  "ibm1133": "cp1133",
  "csibm1133": "cp1133",
  "cp1161": {
    "type": "_sbcs",
    "chars": "��������������������������������่กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู้๊๋€฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛¢¬¦ "
  },
  "ibm1161": "cp1161",
  "csibm1161": "cp1161",
  "cp1162": {
    "type": "_sbcs",
    "chars": "€…‘’“”•–— กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
  },
  "ibm1162": "cp1162",
  "csibm1162": "cp1162",
  "cp1163": {
    "type": "_sbcs",
    "chars": " ¡¢£€¥¦§œ©ª«¬­®¯°±²³Ÿµ¶·Œ¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
  },
  "ibm1163": "cp1163",
  "csibm1163": "cp1163",
  "maccroatian": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊�©⁄¤‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
  },
  "maccyrillic": {
    "type": "_sbcs",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°¢£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµ∂ЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
  },
  "macgreek": {
    "type": "_sbcs",
    "chars": "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦­ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ�"
  },
  "maciceland": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macroman": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macromania": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂŞ∞±≤≥¥µ∂∑∏π∫ªºΩăş¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›Ţţ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macthai": {
    "type": "_sbcs",
    "chars": "«»…“”�•‘’� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู﻿​–—฿เแโใไๅๆ็่้๊๋์ํ™๏๐๑๒๓๔๕๖๗๘๙®©����"
  },
  "macturkish": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙ�ˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "macukraine": {
    "type": "_sbcs",
    "chars": "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
  },
  "koi8r": {
    "type": "_sbcs",
    "chars": "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  },
  "koi8u": {
    "type": "_sbcs",
    "chars": "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґ╝╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪Ґ╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  },
  "koi8ru": {
    "type": "_sbcs",
    "chars": "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґў╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪ҐЎ©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  },
  "koi8t": {
    "type": "_sbcs",
    "chars": "қғ‚Ғ„…†‡�‰ҳ‹ҲҷҶ�Қ‘’“”•–—�™�›�����ӯӮё¤ӣ¦§���«¬­®�°±²Ё�Ӣ¶·�№�»���©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
  },
  "armscii8": {
    "type": "_sbcs",
    "chars": " �և։)(»«—.՝,-֊…՜՛՞ԱաԲբԳգԴդԵեԶզԷէԸըԹթԺժԻիԼլԽխԾծԿկՀհՁձՂղՃճՄմՅյՆնՇշՈոՉչՊպՋջՌռՍսՎվՏտՐրՑցՒւՓփՔքՕօՖֆ՚�"
  },
  "rk1048": {
    "type": "_sbcs",
    "chars": "ЂЃ‚ѓ„…†‡€‰Љ‹ЊҚҺЏђ‘’“”•–—�™љ›њқһџ ҰұӘ¤Ө¦§Ё©Ғ«¬­®Ү°±Ііөµ¶·ё№ғ»әҢңүАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
  },
  "tcvn": {
    "type": "_sbcs",
    "chars": "\u0000ÚỤ\u0003ỪỬỮ\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010ỨỰỲỶỸÝỴ\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ÀẢÃÁẠẶẬÈẺẼÉẸỆÌỈĨÍỊÒỎÕÓỌỘỜỞỠỚỢÙỦŨ ĂÂÊÔƠƯĐăâêôơưđẶ̀̀̉̃́àảãáạẲằẳẵắẴẮẦẨẪẤỀặầẩẫấậèỂẻẽéẹềểễếệìỉỄẾỒĩíịòỔỏõóọồổỗốộờởỡớợùỖủũúụừửữứựỳỷỹýỵỐ"
  },
  "georgianacademy": {
    "type": "_sbcs",
    "chars": "‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰჱჲჳჴჵჶçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "georgianps": {
    "type": "_sbcs",
    "chars": "‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿აბგდევზჱთიკლმნჲოპჟრსტჳუფქღყშჩცძწჭხჴჯჰჵæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
  },
  "pt154": {
    "type": "_sbcs",
    "chars": "ҖҒӮғ„…ҶҮҲүҠӢҢҚҺҸҗ‘’“”•–—ҳҷҡӣңқһҹ ЎўЈӨҘҰ§Ё©Ә«¬ӯ®Ҝ°ұІіҙө¶·ё№ә»јҪҫҝАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
  },
  "viscii": {
    "type": "_sbcs",
    "chars": "\u0000\u0001Ẳ\u0003\u0004ẴẪ\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013Ỷ\u0015\u0016\u0017\u0018Ỹ\u001a\u001b\u001c\u001dỴ\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ẠẮẰẶẤẦẨẬẼẸẾỀỂỄỆỐỒỔỖỘỢỚỜỞỊỎỌỈỦŨỤỲÕắằặấầẩậẽẹếềểễệốồổỗỠƠộờởịỰỨỪỬơớƯÀÁÂÃẢĂẳẵÈÉÊẺÌÍĨỳĐứÒÓÔạỷừửÙÚỹỵÝỡưàáâãảăữẫèéêẻìíĩỉđựòóôõỏọụùúũủýợỮ"
  },
  "iso646cn": {
    "type": "_sbcs",
    "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#¥%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}‾��������������������������������������������������������������������������������������������������������������������������������"
  },
  "iso646jp": {
    "type": "_sbcs",
    "chars": "\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[¥]^_`abcdefghijklmnopqrstuvwxyz{|}‾��������������������������������������������������������������������������������������������������������������������������������"
  },
  "hproman8": {
    "type": "_sbcs",
    "chars": " ÀÂÈÊËÎÏ´ˋˆ¨˜ÙÛ₤¯Ýý°ÇçÑñ¡¿¤£¥§ƒ¢âêôûáéóúàèòùäëöüÅîØÆåíøæÄìÖÜÉïßÔÁÃãÐðÍÌÓÒÕõŠšÚŸÿÞþ·µ¶¾—¼½ªº«■»±�"
  },
  "macintosh": {
    "type": "_sbcs",
    "chars": "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
  },
  "ascii": {
    "type": "_sbcs",
    "chars": "��������������������������������������������������������������������������������������������������������������������������������"
  },
  "tis620": {
    "type": "_sbcs",
    "chars": "���������������������������������กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
  }
}

/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

var Buffer = (__webpack_require__(17).Buffer);

// Multibyte codec. In this scheme, a character is represented by 1 or more bytes.
// Our codec supports UTF-16 surrogates, extensions for GB18030 and unicode sequences.
// To save memory and loading time, we read table files only when requested.

exports._dbcs = DBCSCodec;

var UNASSIGNED = -1,
    GB18030_CODE = -2,
    SEQ_START  = -10,
    NODE_START = -1000,
    UNASSIGNED_NODE = new Array(0x100),
    DEF_CHAR = -1;

for (var i = 0; i < 0x100; i++)
    UNASSIGNED_NODE[i] = UNASSIGNED;


// Class DBCSCodec reads and initializes mapping tables.
function DBCSCodec(codecOptions, iconv) {
    this.encodingName = codecOptions.encodingName;
    if (!codecOptions)
        throw new Error("DBCS codec is called without the data.")
    if (!codecOptions.table)
        throw new Error("Encoding '" + this.encodingName + "' has no data.");

    // Load tables.
    var mappingTable = codecOptions.table();


    // Decode tables: MBCS -> Unicode.

    // decodeTables is a trie, encoded as an array of arrays of integers. Internal arrays are trie nodes and all have len = 256.
    // Trie root is decodeTables[0].
    // Values: >=  0 -> unicode character code. can be > 0xFFFF
    //         == UNASSIGNED -> unknown/unassigned sequence.
    //         == GB18030_CODE -> this is the end of a GB18030 4-byte sequence.
    //         <= NODE_START -> index of the next node in our trie to process next byte.
    //         <= SEQ_START  -> index of the start of a character code sequence, in decodeTableSeq.
    this.decodeTables = [];
    this.decodeTables[0] = UNASSIGNED_NODE.slice(0); // Create root node.

    // Sometimes a MBCS char corresponds to a sequence of unicode chars. We store them as arrays of integers here. 
    this.decodeTableSeq = [];

    // Actual mapping tables consist of chunks. Use them to fill up decode tables.
    for (var i = 0; i < mappingTable.length; i++)
        this._addDecodeChunk(mappingTable[i]);

    // Load & create GB18030 tables when needed.
    if (typeof codecOptions.gb18030 === 'function') {
        this.gb18030 = codecOptions.gb18030(); // Load GB18030 ranges.

        // Add GB18030 common decode nodes.
        var commonThirdByteNodeIdx = this.decodeTables.length;
        this.decodeTables.push(UNASSIGNED_NODE.slice(0));

        var commonFourthByteNodeIdx = this.decodeTables.length;
        this.decodeTables.push(UNASSIGNED_NODE.slice(0));

        // Fill out the tree
        var firstByteNode = this.decodeTables[0];
        for (var i = 0x81; i <= 0xFE; i++) {
            var secondByteNode = this.decodeTables[NODE_START - firstByteNode[i]];
            for (var j = 0x30; j <= 0x39; j++) {
                if (secondByteNode[j] === UNASSIGNED) {
                    secondByteNode[j] = NODE_START - commonThirdByteNodeIdx;
                } else if (secondByteNode[j] > NODE_START) {
                    throw new Error("gb18030 decode tables conflict at byte 2");
                }

                var thirdByteNode = this.decodeTables[NODE_START - secondByteNode[j]];
                for (var k = 0x81; k <= 0xFE; k++) {
                    if (thirdByteNode[k] === UNASSIGNED) {
                        thirdByteNode[k] = NODE_START - commonFourthByteNodeIdx;
                    } else if (thirdByteNode[k] === NODE_START - commonFourthByteNodeIdx) {
                        continue;
                    } else if (thirdByteNode[k] > NODE_START) {
                        throw new Error("gb18030 decode tables conflict at byte 3");
                    }

                    var fourthByteNode = this.decodeTables[NODE_START - thirdByteNode[k]];
                    for (var l = 0x30; l <= 0x39; l++) {
                        if (fourthByteNode[l] === UNASSIGNED)
                            fourthByteNode[l] = GB18030_CODE;
                    }
                }
            }
        }
    }

    this.defaultCharUnicode = iconv.defaultCharUnicode;

    
    // Encode tables: Unicode -> DBCS.

    // `encodeTable` is array mapping from unicode char to encoded char. All its values are integers for performance.
    // Because it can be sparse, it is represented as array of buckets by 256 chars each. Bucket can be null.
    // Values: >=  0 -> it is a normal char. Write the value (if <=256 then 1 byte, if <=65536 then 2 bytes, etc.).
    //         == UNASSIGNED -> no conversion found. Output a default char.
    //         <= SEQ_START  -> it's an index in encodeTableSeq, see below. The character starts a sequence.
    this.encodeTable = [];
    
    // `encodeTableSeq` is used when a sequence of unicode characters is encoded as a single code. We use a tree of
    // objects where keys correspond to characters in sequence and leafs are the encoded dbcs values. A special DEF_CHAR key
    // means end of sequence (needed when one sequence is a strict subsequence of another).
    // Objects are kept separately from encodeTable to increase performance.
    this.encodeTableSeq = [];

    // Some chars can be decoded, but need not be encoded.
    var skipEncodeChars = {};
    if (codecOptions.encodeSkipVals)
        for (var i = 0; i < codecOptions.encodeSkipVals.length; i++) {
            var val = codecOptions.encodeSkipVals[i];
            if (typeof val === 'number')
                skipEncodeChars[val] = true;
            else
                for (var j = val.from; j <= val.to; j++)
                    skipEncodeChars[j] = true;
        }
        
    // Use decode trie to recursively fill out encode tables.
    this._fillEncodeTable(0, 0, skipEncodeChars);

    // Add more encoding pairs when needed.
    if (codecOptions.encodeAdd) {
        for (var uChar in codecOptions.encodeAdd)
            if (Object.prototype.hasOwnProperty.call(codecOptions.encodeAdd, uChar))
                this._setEncodeChar(uChar.charCodeAt(0), codecOptions.encodeAdd[uChar]);
    }

    this.defCharSB  = this.encodeTable[0][iconv.defaultCharSingleByte.charCodeAt(0)];
    if (this.defCharSB === UNASSIGNED) this.defCharSB = this.encodeTable[0]['?'];
    if (this.defCharSB === UNASSIGNED) this.defCharSB = "?".charCodeAt(0);
}

DBCSCodec.prototype.encoder = DBCSEncoder;
DBCSCodec.prototype.decoder = DBCSDecoder;

// Decoder helpers
DBCSCodec.prototype._getDecodeTrieNode = function(addr) {
    var bytes = [];
    for (; addr > 0; addr >>>= 8)
        bytes.push(addr & 0xFF);
    if (bytes.length == 0)
        bytes.push(0);

    var node = this.decodeTables[0];
    for (var i = bytes.length-1; i > 0; i--) { // Traverse nodes deeper into the trie.
        var val = node[bytes[i]];

        if (val == UNASSIGNED) { // Create new node.
            node[bytes[i]] = NODE_START - this.decodeTables.length;
            this.decodeTables.push(node = UNASSIGNED_NODE.slice(0));
        }
        else if (val <= NODE_START) { // Existing node.
            node = this.decodeTables[NODE_START - val];
        }
        else
            throw new Error("Overwrite byte in " + this.encodingName + ", addr: " + addr.toString(16));
    }
    return node;
}


DBCSCodec.prototype._addDecodeChunk = function(chunk) {
    // First element of chunk is the hex mbcs code where we start.
    var curAddr = parseInt(chunk[0], 16);

    // Choose the decoding node where we'll write our chars.
    var writeTable = this._getDecodeTrieNode(curAddr);
    curAddr = curAddr & 0xFF;

    // Write all other elements of the chunk to the table.
    for (var k = 1; k < chunk.length; k++) {
        var part = chunk[k];
        if (typeof part === "string") { // String, write as-is.
            for (var l = 0; l < part.length;) {
                var code = part.charCodeAt(l++);
                if (0xD800 <= code && code < 0xDC00) { // Decode surrogate
                    var codeTrail = part.charCodeAt(l++);
                    if (0xDC00 <= codeTrail && codeTrail < 0xE000)
                        writeTable[curAddr++] = 0x10000 + (code - 0xD800) * 0x400 + (codeTrail - 0xDC00);
                    else
                        throw new Error("Incorrect surrogate pair in "  + this.encodingName + " at chunk " + chunk[0]);
                }
                else if (0x0FF0 < code && code <= 0x0FFF) { // Character sequence (our own encoding used)
                    var len = 0xFFF - code + 2;
                    var seq = [];
                    for (var m = 0; m < len; m++)
                        seq.push(part.charCodeAt(l++)); // Simple variation: don't support surrogates or subsequences in seq.

                    writeTable[curAddr++] = SEQ_START - this.decodeTableSeq.length;
                    this.decodeTableSeq.push(seq);
                }
                else
                    writeTable[curAddr++] = code; // Basic char
            }
        } 
        else if (typeof part === "number") { // Integer, meaning increasing sequence starting with prev character.
            var charCode = writeTable[curAddr - 1] + 1;
            for (var l = 0; l < part; l++)
                writeTable[curAddr++] = charCode++;
        }
        else
            throw new Error("Incorrect type '" + typeof part + "' given in "  + this.encodingName + " at chunk " + chunk[0]);
    }
    if (curAddr > 0xFF)
        throw new Error("Incorrect chunk in "  + this.encodingName + " at addr " + chunk[0] + ": too long" + curAddr);
}

// Encoder helpers
DBCSCodec.prototype._getEncodeBucket = function(uCode) {
    var high = uCode >> 8; // This could be > 0xFF because of astral characters.
    if (this.encodeTable[high] === undefined)
        this.encodeTable[high] = UNASSIGNED_NODE.slice(0); // Create bucket on demand.
    return this.encodeTable[high];
}

DBCSCodec.prototype._setEncodeChar = function(uCode, dbcsCode) {
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 0xFF;
    if (bucket[low] <= SEQ_START)
        this.encodeTableSeq[SEQ_START-bucket[low]][DEF_CHAR] = dbcsCode; // There's already a sequence, set a single-char subsequence of it.
    else if (bucket[low] == UNASSIGNED)
        bucket[low] = dbcsCode;
}

DBCSCodec.prototype._setEncodeSequence = function(seq, dbcsCode) {
    
    // Get the root of character tree according to first character of the sequence.
    var uCode = seq[0];
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 0xFF;

    var node;
    if (bucket[low] <= SEQ_START) {
        // There's already a sequence with  - use it.
        node = this.encodeTableSeq[SEQ_START-bucket[low]];
    }
    else {
        // There was no sequence object - allocate a new one.
        node = {};
        if (bucket[low] !== UNASSIGNED) node[DEF_CHAR] = bucket[low]; // If a char was set before - make it a single-char subsequence.
        bucket[low] = SEQ_START - this.encodeTableSeq.length;
        this.encodeTableSeq.push(node);
    }

    // Traverse the character tree, allocating new nodes as needed.
    for (var j = 1; j < seq.length-1; j++) {
        var oldVal = node[uCode];
        if (typeof oldVal === 'object')
            node = oldVal;
        else {
            node = node[uCode] = {}
            if (oldVal !== undefined)
                node[DEF_CHAR] = oldVal
        }
    }

    // Set the leaf to given dbcsCode.
    uCode = seq[seq.length-1];
    node[uCode] = dbcsCode;
}

DBCSCodec.prototype._fillEncodeTable = function(nodeIdx, prefix, skipEncodeChars) {
    var node = this.decodeTables[nodeIdx];
    var hasValues = false;
    var subNodeEmpty = {};
    for (var i = 0; i < 0x100; i++) {
        var uCode = node[i];
        var mbCode = prefix + i;
        if (skipEncodeChars[mbCode])
            continue;

        if (uCode >= 0) {
            this._setEncodeChar(uCode, mbCode);
            hasValues = true;
        } else if (uCode <= NODE_START) {
            var subNodeIdx = NODE_START - uCode;
            if (!subNodeEmpty[subNodeIdx]) {  // Skip empty subtrees (they are too large in gb18030).
                var newPrefix = (mbCode << 8) >>> 0;  // NOTE: '>>> 0' keeps 32-bit num positive.
                if (this._fillEncodeTable(subNodeIdx, newPrefix, skipEncodeChars))
                    hasValues = true;
                else
                    subNodeEmpty[subNodeIdx] = true;
            }
        } else if (uCode <= SEQ_START) {
            this._setEncodeSequence(this.decodeTableSeq[SEQ_START - uCode], mbCode);
            hasValues = true;
        }
    }
    return hasValues;
}



// == Encoder ==================================================================

function DBCSEncoder(options, codec) {
    // Encoder state
    this.leadSurrogate = -1;
    this.seqObj = undefined;
    
    // Static data
    this.encodeTable = codec.encodeTable;
    this.encodeTableSeq = codec.encodeTableSeq;
    this.defaultCharSingleByte = codec.defCharSB;
    this.gb18030 = codec.gb18030;
}

DBCSEncoder.prototype.write = function(str) {
    var newBuf = Buffer.alloc(str.length * (this.gb18030 ? 4 : 3)),
        leadSurrogate = this.leadSurrogate,
        seqObj = this.seqObj, nextChar = -1,
        i = 0, j = 0;

    while (true) {
        // 0. Get next character.
        if (nextChar === -1) {
            if (i == str.length) break;
            var uCode = str.charCodeAt(i++);
        }
        else {
            var uCode = nextChar;
            nextChar = -1;    
        }

        // 1. Handle surrogates.
        if (0xD800 <= uCode && uCode < 0xE000) { // Char is one of surrogates.
            if (uCode < 0xDC00) { // We've got lead surrogate.
                if (leadSurrogate === -1) {
                    leadSurrogate = uCode;
                    continue;
                } else {
                    leadSurrogate = uCode;
                    // Double lead surrogate found.
                    uCode = UNASSIGNED;
                }
            } else { // We've got trail surrogate.
                if (leadSurrogate !== -1) {
                    uCode = 0x10000 + (leadSurrogate - 0xD800) * 0x400 + (uCode - 0xDC00);
                    leadSurrogate = -1;
                } else {
                    // Incomplete surrogate pair - only trail surrogate found.
                    uCode = UNASSIGNED;
                }
                
            }
        }
        else if (leadSurrogate !== -1) {
            // Incomplete surrogate pair - only lead surrogate found.
            nextChar = uCode; uCode = UNASSIGNED; // Write an error, then current char.
            leadSurrogate = -1;
        }

        // 2. Convert uCode character.
        var dbcsCode = UNASSIGNED;
        if (seqObj !== undefined && uCode != UNASSIGNED) { // We are in the middle of the sequence
            var resCode = seqObj[uCode];
            if (typeof resCode === 'object') { // Sequence continues.
                seqObj = resCode;
                continue;

            } else if (typeof resCode == 'number') { // Sequence finished. Write it.
                dbcsCode = resCode;

            } else if (resCode == undefined) { // Current character is not part of the sequence.

                // Try default character for this sequence
                resCode = seqObj[DEF_CHAR];
                if (resCode !== undefined) {
                    dbcsCode = resCode; // Found. Write it.
                    nextChar = uCode; // Current character will be written too in the next iteration.

                } else {
                    // TODO: What if we have no default? (resCode == undefined)
                    // Then, we should write first char of the sequence as-is and try the rest recursively.
                    // Didn't do it for now because no encoding has this situation yet.
                    // Currently, just skip the sequence and write current char.
                }
            }
            seqObj = undefined;
        }
        else if (uCode >= 0) {  // Regular character
            var subtable = this.encodeTable[uCode >> 8];
            if (subtable !== undefined)
                dbcsCode = subtable[uCode & 0xFF];
            
            if (dbcsCode <= SEQ_START) { // Sequence start
                seqObj = this.encodeTableSeq[SEQ_START-dbcsCode];
                continue;
            }

            if (dbcsCode == UNASSIGNED && this.gb18030) {
                // Use GB18030 algorithm to find character(s) to write.
                var idx = findIdx(this.gb18030.uChars, uCode);
                if (idx != -1) {
                    var dbcsCode = this.gb18030.gbChars[idx] + (uCode - this.gb18030.uChars[idx]);
                    newBuf[j++] = 0x81 + Math.floor(dbcsCode / 12600); dbcsCode = dbcsCode % 12600;
                    newBuf[j++] = 0x30 + Math.floor(dbcsCode / 1260); dbcsCode = dbcsCode % 1260;
                    newBuf[j++] = 0x81 + Math.floor(dbcsCode / 10); dbcsCode = dbcsCode % 10;
                    newBuf[j++] = 0x30 + dbcsCode;
                    continue;
                }
            }
        }

        // 3. Write dbcsCode character.
        if (dbcsCode === UNASSIGNED)
            dbcsCode = this.defaultCharSingleByte;
        
        if (dbcsCode < 0x100) {
            newBuf[j++] = dbcsCode;
        }
        else if (dbcsCode < 0x10000) {
            newBuf[j++] = dbcsCode >> 8;   // high byte
            newBuf[j++] = dbcsCode & 0xFF; // low byte
        }
        else if (dbcsCode < 0x1000000) {
            newBuf[j++] = dbcsCode >> 16;
            newBuf[j++] = (dbcsCode >> 8) & 0xFF;
            newBuf[j++] = dbcsCode & 0xFF;
        } else {
            newBuf[j++] = dbcsCode >>> 24;
            newBuf[j++] = (dbcsCode >>> 16) & 0xFF;
            newBuf[j++] = (dbcsCode >>> 8) & 0xFF;
            newBuf[j++] = dbcsCode & 0xFF;
        }
    }

    this.seqObj = seqObj;
    this.leadSurrogate = leadSurrogate;
    return newBuf.slice(0, j);
}

DBCSEncoder.prototype.end = function() {
    if (this.leadSurrogate === -1 && this.seqObj === undefined)
        return; // All clean. Most often case.

    var newBuf = Buffer.alloc(10), j = 0;

    if (this.seqObj) { // We're in the sequence.
        var dbcsCode = this.seqObj[DEF_CHAR];
        if (dbcsCode !== undefined) { // Write beginning of the sequence.
            if (dbcsCode < 0x100) {
                newBuf[j++] = dbcsCode;
            }
            else {
                newBuf[j++] = dbcsCode >> 8;   // high byte
                newBuf[j++] = dbcsCode & 0xFF; // low byte
            }
        } else {
            // See todo above.
        }
        this.seqObj = undefined;
    }

    if (this.leadSurrogate !== -1) {
        // Incomplete surrogate pair - only lead surrogate found.
        newBuf[j++] = this.defaultCharSingleByte;
        this.leadSurrogate = -1;
    }
    
    return newBuf.slice(0, j);
}

// Export for testing
DBCSEncoder.prototype.findIdx = findIdx;


// == Decoder ==================================================================

function DBCSDecoder(options, codec) {
    // Decoder state
    this.nodeIdx = 0;
    this.prevBytes = [];

    // Static data
    this.decodeTables = codec.decodeTables;
    this.decodeTableSeq = codec.decodeTableSeq;
    this.defaultCharUnicode = codec.defaultCharUnicode;
    this.gb18030 = codec.gb18030;
}

DBCSDecoder.prototype.write = function(buf) {
    var newBuf = Buffer.alloc(buf.length*2),
        nodeIdx = this.nodeIdx, 
        prevBytes = this.prevBytes, prevOffset = this.prevBytes.length,
        seqStart = -this.prevBytes.length, // idx of the start of current parsed sequence.
        uCode;

    for (var i = 0, j = 0; i < buf.length; i++) {
        var curByte = (i >= 0) ? buf[i] : prevBytes[i + prevOffset];

        // Lookup in current trie node.
        var uCode = this.decodeTables[nodeIdx][curByte];

        if (uCode >= 0) { 
            // Normal character, just use it.
        }
        else if (uCode === UNASSIGNED) { // Unknown char.
            // TODO: Callback with seq.
            uCode = this.defaultCharUnicode.charCodeAt(0);
            i = seqStart; // Skip one byte ('i' will be incremented by the for loop) and try to parse again.
        }
        else if (uCode === GB18030_CODE) {
            if (i >= 3) {
                var ptr = (buf[i-3]-0x81)*12600 + (buf[i-2]-0x30)*1260 + (buf[i-1]-0x81)*10 + (curByte-0x30);
            } else {
                var ptr = (prevBytes[i-3+prevOffset]-0x81)*12600 + 
                          (((i-2 >= 0) ? buf[i-2] : prevBytes[i-2+prevOffset])-0x30)*1260 + 
                          (((i-1 >= 0) ? buf[i-1] : prevBytes[i-1+prevOffset])-0x81)*10 + 
                          (curByte-0x30);
            }
            var idx = findIdx(this.gb18030.gbChars, ptr);
            uCode = this.gb18030.uChars[idx] + ptr - this.gb18030.gbChars[idx];
        }
        else if (uCode <= NODE_START) { // Go to next trie node.
            nodeIdx = NODE_START - uCode;
            continue;
        }
        else if (uCode <= SEQ_START) { // Output a sequence of chars.
            var seq = this.decodeTableSeq[SEQ_START - uCode];
            for (var k = 0; k < seq.length - 1; k++) {
                uCode = seq[k];
                newBuf[j++] = uCode & 0xFF;
                newBuf[j++] = uCode >> 8;
            }
            uCode = seq[seq.length-1];
        }
        else
            throw new Error("iconv-lite internal error: invalid decoding table value " + uCode + " at " + nodeIdx + "/" + curByte);

        // Write the character to buffer, handling higher planes using surrogate pair.
        if (uCode >= 0x10000) { 
            uCode -= 0x10000;
            var uCodeLead = 0xD800 | (uCode >> 10);
            newBuf[j++] = uCodeLead & 0xFF;
            newBuf[j++] = uCodeLead >> 8;

            uCode = 0xDC00 | (uCode & 0x3FF);
        }
        newBuf[j++] = uCode & 0xFF;
        newBuf[j++] = uCode >> 8;

        // Reset trie node.
        nodeIdx = 0; seqStart = i+1;
    }

    this.nodeIdx = nodeIdx;
    this.prevBytes = (seqStart >= 0)
        ? Array.prototype.slice.call(buf, seqStart)
        : prevBytes.slice(seqStart + prevOffset).concat(Array.prototype.slice.call(buf));

    return newBuf.slice(0, j).toString('ucs2');
}

DBCSDecoder.prototype.end = function() {
    var ret = '';

    // Try to parse all remaining chars.
    while (this.prevBytes.length > 0) {
        // Skip 1 character in the buffer.
        ret += this.defaultCharUnicode;
        var bytesArr = this.prevBytes.slice(1);

        // Parse remaining as usual.
        this.prevBytes = [];
        this.nodeIdx = 0;
        if (bytesArr.length > 0)
            ret += this.write(bytesArr);
    }

    this.prevBytes = [];
    this.nodeIdx = 0;
    return ret;
}

// Binary search for GB18030. Returns largest i such that table[i] <= val.
function findIdx(table, val) {
    if (table[0] > val)
        return -1;

    var l = 0, r = table.length;
    while (l < r-1) { // always table[l] <= val < table[r]
        var mid = l + ((r-l+1) >> 1);
        if (table[mid] <= val)
            l = mid;
        else
            r = mid;
    }
    return l;
}



/***/ }),
/* 30 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// Description of supported double byte encodings and aliases.
// Tables are not require()-d until they are needed to speed up library load.
// require()-s are direct to support Browserify.

module.exports = {
    
    // == Japanese/ShiftJIS ====================================================
    // All japanese encodings are based on JIS X set of standards:
    // JIS X 0201 - Single-byte encoding of ASCII + ¥ + Kana chars at 0xA1-0xDF.
    // JIS X 0208 - Main set of 6879 characters, placed in 94x94 plane, to be encoded by 2 bytes. 
    //              Has several variations in 1978, 1983, 1990 and 1997.
    // JIS X 0212 - Supplementary plane of 6067 chars in 94x94 plane. 1990. Effectively dead.
    // JIS X 0213 - Extension and modern replacement of 0208 and 0212. Total chars: 11233.
    //              2 planes, first is superset of 0208, second - revised 0212.
    //              Introduced in 2000, revised 2004. Some characters are in Unicode Plane 2 (0x2xxxx)

    // Byte encodings are:
    //  * Shift_JIS: Compatible with 0201, uses not defined chars in top half as lead bytes for double-byte
    //               encoding of 0208. Lead byte ranges: 0x81-0x9F, 0xE0-0xEF; Trail byte ranges: 0x40-0x7E, 0x80-0x9E, 0x9F-0xFC.
    //               Windows CP932 is a superset of Shift_JIS. Some companies added more chars, notably KDDI.
    //  * EUC-JP:    Up to 3 bytes per character. Used mostly on *nixes.
    //               0x00-0x7F       - lower part of 0201
    //               0x8E, 0xA1-0xDF - upper part of 0201
    //               (0xA1-0xFE)x2   - 0208 plane (94x94).
    //               0x8F, (0xA1-0xFE)x2 - 0212 plane (94x94).
    //  * JIS X 208: 7-bit, direct encoding of 0208. Byte ranges: 0x21-0x7E (94 values). Uncommon.
    //               Used as-is in ISO2022 family.
    //  * ISO2022-JP: Stateful encoding, with escape sequences to switch between ASCII, 
    //                0201-1976 Roman, 0208-1978, 0208-1983.
    //  * ISO2022-JP-1: Adds esc seq for 0212-1990.
    //  * ISO2022-JP-2: Adds esc seq for GB2313-1980, KSX1001-1992, ISO8859-1, ISO8859-7.
    //  * ISO2022-JP-3: Adds esc seq for 0201-1976 Kana set, 0213-2000 Planes 1, 2.
    //  * ISO2022-JP-2004: Adds 0213-2004 Plane 1.
    //
    // After JIS X 0213 appeared, Shift_JIS-2004, EUC-JISX0213 and ISO2022-JP-2004 followed, with just changing the planes.
    //
    // Overall, it seems that it's a mess :( http://www8.plala.or.jp/tkubota1/unicode-symbols-map2.html

    'shiftjis': {
        type: '_dbcs',
        table: function() { return __webpack_require__(31) },
        encodeAdd: {'\u00a5': 0x5C, '\u203E': 0x7E},
        encodeSkipVals: [{from: 0xED40, to: 0xF940}],
    },
    'csshiftjis': 'shiftjis',
    'mskanji': 'shiftjis',
    'sjis': 'shiftjis',
    'windows31j': 'shiftjis',
    'ms31j': 'shiftjis',
    'xsjis': 'shiftjis',
    'windows932': 'shiftjis',
    'ms932': 'shiftjis',
    '932': 'shiftjis',
    'cp932': 'shiftjis',

    'eucjp': {
        type: '_dbcs',
        table: function() { return __webpack_require__(32) },
        encodeAdd: {'\u00a5': 0x5C, '\u203E': 0x7E},
    },

    // TODO: KDDI extension to Shift_JIS
    // TODO: IBM CCSID 942 = CP932, but F0-F9 custom chars and other char changes.
    // TODO: IBM CCSID 943 = Shift_JIS = CP932 with original Shift_JIS lower 128 chars.


    // == Chinese/GBK ==========================================================
    // http://en.wikipedia.org/wiki/GBK
    // We mostly implement W3C recommendation: https://www.w3.org/TR/encoding/#gbk-encoder

    // Oldest GB2312 (1981, ~7600 chars) is a subset of CP936
    'gb2312': 'cp936',
    'gb231280': 'cp936',
    'gb23121980': 'cp936',
    'csgb2312': 'cp936',
    'csiso58gb231280': 'cp936',
    'euccn': 'cp936',

    // Microsoft's CP936 is a subset and approximation of GBK.
    'windows936': 'cp936',
    'ms936': 'cp936',
    '936': 'cp936',
    'cp936': {
        type: '_dbcs',
        table: function() { return __webpack_require__(33) },
    },

    // GBK (~22000 chars) is an extension of CP936 that added user-mapped chars and some other.
    'gbk': {
        type: '_dbcs',
        table: function() { return (__webpack_require__(33).concat)(__webpack_require__(34)) },
    },
    'xgbk': 'gbk',
    'isoir58': 'gbk',

    // GB18030 is an algorithmic extension of GBK.
    // Main source: https://www.w3.org/TR/encoding/#gbk-encoder
    // http://icu-project.org/docs/papers/gb18030.html
    // http://source.icu-project.org/repos/icu/data/trunk/charset/data/xml/gb-18030-2000.xml
    // http://www.khngai.com/chinese/charmap/tblgbk.php?page=0
    'gb18030': {
        type: '_dbcs',
        table: function() { return (__webpack_require__(33).concat)(__webpack_require__(34)) },
        gb18030: function() { return __webpack_require__(35) },
        encodeSkipVals: [0x80],
        encodeAdd: {'€': 0xA2E3},
    },

    'chinese': 'gb18030',


    // == Korean ===============================================================
    // EUC-KR, KS_C_5601 and KS X 1001 are exactly the same.
    'windows949': 'cp949',
    'ms949': 'cp949',
    '949': 'cp949',
    'cp949': {
        type: '_dbcs',
        table: function() { return __webpack_require__(36) },
    },

    'cseuckr': 'cp949',
    'csksc56011987': 'cp949',
    'euckr': 'cp949',
    'isoir149': 'cp949',
    'korean': 'cp949',
    'ksc56011987': 'cp949',
    'ksc56011989': 'cp949',
    'ksc5601': 'cp949',


    // == Big5/Taiwan/Hong Kong ================================================
    // There are lots of tables for Big5 and cp950. Please see the following links for history:
    // http://moztw.org/docs/big5/  http://www.haible.de/bruno/charsets/conversion-tables/Big5.html
    // Variations, in roughly number of defined chars:
    //  * Windows CP 950: Microsoft variant of Big5. Canonical: http://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP950.TXT
    //  * Windows CP 951: Microsoft variant of Big5-HKSCS-2001. Seems to be never public. http://me.abelcheung.org/articles/research/what-is-cp951/
    //  * Big5-2003 (Taiwan standard) almost superset of cp950.
    //  * Unicode-at-on (UAO) / Mozilla 1.8. Falling out of use on the Web. Not supported by other browsers.
    //  * Big5-HKSCS (-2001, -2004, -2008). Hong Kong standard. 
    //    many unicode code points moved from PUA to Supplementary plane (U+2XXXX) over the years.
    //    Plus, it has 4 combining sequences.
    //    Seems that Mozilla refused to support it for 10 yrs. https://bugzilla.mozilla.org/show_bug.cgi?id=162431 https://bugzilla.mozilla.org/show_bug.cgi?id=310299
    //    because big5-hkscs is the only encoding to include astral characters in non-algorithmic way.
    //    Implementations are not consistent within browsers; sometimes labeled as just big5.
    //    MS Internet Explorer switches from big5 to big5-hkscs when a patch applied.
    //    Great discussion & recap of what's going on https://bugzilla.mozilla.org/show_bug.cgi?id=912470#c31
    //    In the encoder, it might make sense to support encoding old PUA mappings to Big5 bytes seq-s.
    //    Official spec: http://www.ogcio.gov.hk/en/business/tech_promotion/ccli/terms/doc/2003cmp_2008.txt
    //                   http://www.ogcio.gov.hk/tc/business/tech_promotion/ccli/terms/doc/hkscs-2008-big5-iso.txt
    // 
    // Current understanding of how to deal with Big5(-HKSCS) is in the Encoding Standard, http://encoding.spec.whatwg.org/#big5-encoder
    // Unicode mapping (http://www.unicode.org/Public/MAPPINGS/OBSOLETE/EASTASIA/OTHER/BIG5.TXT) is said to be wrong.

    'windows950': 'cp950',
    'ms950': 'cp950',
    '950': 'cp950',
    'cp950': {
        type: '_dbcs',
        table: function() { return __webpack_require__(37) },
    },

    // Big5 has many variations and is an extension of cp950. We use Encoding Standard's as a consensus.
    'big5': 'big5hkscs',
    'big5hkscs': {
        type: '_dbcs',
        table: function() { return (__webpack_require__(37).concat)(__webpack_require__(38)) },
        encodeSkipVals: [
            // Although Encoding Standard says we should avoid encoding to HKSCS area (See Step 1 of
            // https://encoding.spec.whatwg.org/#index-big5-pointer), we still do it to increase compatibility with ICU.
            // But if a single unicode point can be encoded both as HKSCS and regular Big5, we prefer the latter.
            0x8e69, 0x8e6f, 0x8e7e, 0x8eab, 0x8eb4, 0x8ecd, 0x8ed0, 0x8f57, 0x8f69, 0x8f6e, 0x8fcb, 0x8ffe,
            0x906d, 0x907a, 0x90c4, 0x90dc, 0x90f1, 0x91bf, 0x92af, 0x92b0, 0x92b1, 0x92b2, 0x92d1, 0x9447, 0x94ca,
            0x95d9, 0x96fc, 0x9975, 0x9b76, 0x9b78, 0x9b7b, 0x9bc6, 0x9bde, 0x9bec, 0x9bf6, 0x9c42, 0x9c53, 0x9c62,
            0x9c68, 0x9c6b, 0x9c77, 0x9cbc, 0x9cbd, 0x9cd0, 0x9d57, 0x9d5a, 0x9dc4, 0x9def, 0x9dfb, 0x9ea9, 0x9eef,
            0x9efd, 0x9f60, 0x9fcb, 0xa077, 0xa0dc, 0xa0df, 0x8fcc, 0x92c8, 0x9644, 0x96ed,

            // Step 2 of https://encoding.spec.whatwg.org/#index-big5-pointer: Use last pointer for U+2550, U+255E, U+2561, U+256A, U+5341, or U+5345
            0xa2a4, 0xa2a5, 0xa2a7, 0xa2a6, 0xa2cc, 0xa2ce,
        ],
    },

    'cnbig5': 'big5hkscs',
    'csbig5': 'big5hkscs',
    'xxbig5': 'big5hkscs',
};


/***/ }),
/* 31 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["0","\\u0000",128],["a1","｡",62],["8140","　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈",9,"＋－±×"],["8180","÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓"],["81b8","∈∋⊆⊇⊂⊃∪∩"],["81c8","∧∨￢⇒⇔∀∃"],["81da","∠⊥⌒∂∇≡≒≪≫√∽∝∵∫∬"],["81f0","Å‰♯♭♪†‡¶"],["81fc","◯"],["824f","０",9],["8260","Ａ",25],["8281","ａ",25],["829f","ぁ",82],["8340","ァ",62],["8380","ム",22],["839f","Α",16,"Σ",6],["83bf","α",16,"σ",6],["8440","А",5,"ЁЖ",25],["8470","а",5,"ёж",7],["8480","о",17],["849f","─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂"],["8740","①",19,"Ⅰ",9],["875f","㍉㌔㌢㍍㌘㌧㌃㌶㍑㍗㌍㌦㌣㌫㍊㌻㎜㎝㎞㎎㎏㏄㎡"],["877e","㍻"],["8780","〝〟№㏍℡㊤",4,"㈱㈲㈹㍾㍽㍼≒≡∫∮∑√⊥∠∟⊿∵∩∪"],["889f","亜唖娃阿哀愛挨姶逢葵茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻飴絢綾鮎或粟袷安庵按暗案闇鞍杏以伊位依偉囲夷委威尉惟意慰易椅為畏異移維緯胃萎衣謂違遺医井亥域育郁磯一壱溢逸稲茨芋鰯允印咽員因姻引飲淫胤蔭"],["8940","院陰隠韻吋右宇烏羽迂雨卯鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏噂云運雲荏餌叡営嬰影映曳栄永泳洩瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲榎厭円"],["8980","園堰奄宴延怨掩援沿演炎焔煙燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥往応押旺横欧殴王翁襖鴬鴎黄岡沖荻億屋憶臆桶牡乙俺卸恩温穏音下化仮何伽価佳加可嘉夏嫁家寡科暇果架歌河火珂禍禾稼箇花苛茄荷華菓蝦課嘩貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓駕介会解回塊壊廻快怪悔恢懐戒拐改"],["8a40","魁晦械海灰界皆絵芥蟹開階貝凱劾外咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚角赫較郭閣隔革学岳楽額顎掛笠樫"],["8a80","橿梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛干幹患感慣憾換敢柑桓棺款歓汗漢澗潅環甘監看竿管簡緩缶翰肝艦莞観諌貫還鑑間閑関陥韓館舘丸含岸巌玩癌眼岩翫贋雁頑顔願企伎危喜器基奇嬉寄岐希幾忌揮机旗既期棋棄"],["8b40","機帰毅気汽畿祈季稀紀徽規記貴起軌輝飢騎鬼亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐逆丘久仇休及吸宮弓急救"],["8b80","朽求汲泣灸球究窮笈級糾給旧牛去居巨拒拠挙渠虚許距鋸漁禦魚亨享京供侠僑兇競共凶協匡卿叫喬境峡強彊怯恐恭挟教橋況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭暁業局曲極玉桐粁僅勤均巾錦斤欣欽琴禁禽筋緊芹菌衿襟謹近金吟銀九倶句区狗玖矩苦躯駆駈駒具愚虞喰空偶寓遇隅串櫛釧屑屈"],["8c40","掘窟沓靴轡窪熊隈粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係傾刑兄啓圭珪型契形径恵慶慧憩掲携敬景桂渓畦稽系経継繋罫茎荊蛍計詣警軽頚鶏芸迎鯨"],["8c80","劇戟撃激隙桁傑欠決潔穴結血訣月件倹倦健兼券剣喧圏堅嫌建憲懸拳捲検権牽犬献研硯絹県肩見謙賢軒遣鍵険顕験鹸元原厳幻弦減源玄現絃舷言諺限乎個古呼固姑孤己庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷雇顧鼓五互伍午呉吾娯後御悟梧檎瑚碁語誤護醐乞鯉交佼侯候倖光公功効勾厚口向"],["8d40","后喉坑垢好孔孝宏工巧巷幸広庚康弘恒慌抗拘控攻昂晃更杭校梗構江洪浩港溝甲皇硬稿糠紅紘絞綱耕考肯肱腔膏航荒行衡講貢購郊酵鉱砿鋼閤降"],["8d80","項香高鴻剛劫号合壕拷濠豪轟麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨狛込此頃今困坤墾婚恨懇昏昆根梱混痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐鎖裟坐座挫債催再最哉塞妻宰彩才採栽歳済災采犀砕砦祭斎細菜裁載際剤在材罪財冴坂阪堺榊肴咲崎埼碕鷺作削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷"],["8e40","察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三傘参山惨撒散桟燦珊産算纂蚕讃賛酸餐斬暫残仕仔伺使刺司史嗣四士始姉姿子屍市師志思指支孜斯施旨枝止"],["8e80","死氏獅祉私糸紙紫肢脂至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持時次滋治爾璽痔磁示而耳自蒔辞汐鹿式識鴫竺軸宍雫七叱執失嫉室悉湿漆疾質実蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫若寂弱惹主取守手朱殊狩珠種腫趣酒首儒受呪寿授樹綬需囚収周"],["8f40","宗就州修愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯週酋酬集醜什住充十従戎柔汁渋獣縦重銃叔夙宿淑祝縮粛塾熟出術述俊峻春瞬竣舜駿准循旬楯殉淳"],["8f80","準潤盾純巡遵醇順処初所暑曙渚庶緒署書薯藷諸助叙女序徐恕鋤除傷償勝匠升召哨商唱嘗奨妾娼宵将小少尚庄床廠彰承抄招掌捷昇昌昭晶松梢樟樵沼消渉湘焼焦照症省硝礁祥称章笑粧紹肖菖蒋蕉衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈丞乗冗剰城場壌嬢常情擾条杖浄状畳穣蒸譲醸錠嘱埴飾"],["9040","拭植殖燭織職色触食蝕辱尻伸信侵唇娠寝審心慎振新晋森榛浸深申疹真神秦紳臣芯薪親診身辛進針震人仁刃塵壬尋甚尽腎訊迅陣靭笥諏須酢図厨"],["9080","逗吹垂帥推水炊睡粋翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢姓征性成政整星晴棲栖正清牲生盛精聖声製西誠誓請逝醒青静斉税脆隻席惜戚斥昔析石積籍績脊責赤跡蹟碩切拙接摂折設窃節説雪絶舌蝉仙先千占宣専尖川戦扇撰栓栴泉浅洗染潜煎煽旋穿箭線"],["9140","繊羨腺舛船薦詮賎践選遷銭銑閃鮮前善漸然全禅繕膳糎噌塑岨措曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡鼠僧創双叢倉喪壮奏爽宋層匝惣想捜掃挿掻"],["9180","操早曹巣槍槽漕燥争痩相窓糟総綜聡草荘葬蒼藻装走送遭鎗霜騒像増憎臓蔵贈造促側則即息捉束測足速俗属賊族続卒袖其揃存孫尊損村遜他多太汰詑唾堕妥惰打柁舵楕陀駄騨体堆対耐岱帯待怠態戴替泰滞胎腿苔袋貸退逮隊黛鯛代台大第醍題鷹滝瀧卓啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只"],["9240","叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹単嘆坦担探旦歎淡湛炭短端箪綻耽胆蛋誕鍛団壇弾断暖檀段男談値知地弛恥智池痴稚置致蜘遅馳築畜竹筑蓄"],["9280","逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷註酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭低停偵剃貞呈堤定帝底庭廷弟悌抵挺提梯汀碇禎程締艇訂諦蹄逓"],["9340","邸鄭釘鼎泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄典填天展店添纏甜貼転顛点伝殿澱田電兎吐堵塗妬屠徒斗杜渡登菟賭途都鍍砥砺努度土奴怒倒党冬"],["9380","凍刀唐塔塘套宕島嶋悼投搭東桃梼棟盗淘湯涛灯燈当痘祷等答筒糖統到董蕩藤討謄豆踏逃透鐙陶頭騰闘働動同堂導憧撞洞瞳童胴萄道銅峠鴇匿得徳涜特督禿篤毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩匂賑肉虹廿日乳入"],["9440","如尿韮任妊忍認濡禰祢寧葱猫熱年念捻撚燃粘乃廼之埜嚢悩濃納能脳膿農覗蚤巴把播覇杷波派琶破婆罵芭馬俳廃拝排敗杯盃牌背肺輩配倍培媒梅"],["9480","楳煤狽買売賠陪這蝿秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤隼伴判半反叛帆搬斑板氾汎版犯班畔繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮匪卑否妃庇彼悲扉批披斐比泌疲皮碑秘緋罷肥被誹費避非飛樋簸備尾微枇毘琵眉美"],["9540","鼻柊稗匹疋髭彦膝菱肘弼必畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌浜瀕貧賓頻敏瓶不付埠夫婦富冨布府怖扶敷"],["9580","斧普浮父符腐膚芙譜負賦赴阜附侮撫武舞葡蕪部封楓風葺蕗伏副復幅服福腹複覆淵弗払沸仏物鮒分吻噴墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑箆偏変片篇編辺返遍便勉娩弁鞭保舗鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩倣俸包呆報奉宝峰峯崩庖抱捧放方朋"],["9640","法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲朴牧睦穆釦勃没殆堀幌奔本翻凡盆"],["9680","摩磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒桝亦俣又抹末沫迄侭繭麿万慢満漫蔓味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠務夢無牟矛霧鵡椋婿娘冥名命明盟迷銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾貰問悶紋門匁也冶夜爺耶野弥矢厄役約薬訳躍靖柳薮鑓愉愈油癒"],["9740","諭輸唯佑優勇友宥幽悠憂揖有柚湧涌猶猷由祐裕誘遊邑郵雄融夕予余与誉輿預傭幼妖容庸揚揺擁曜楊様洋溶熔用窯羊耀葉蓉要謡踊遥陽養慾抑欲"],["9780","沃浴翌翼淀羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫藍蘭覧利吏履李梨理璃痢裏裡里離陸律率立葎掠略劉流溜琉留硫粒隆竜龍侶慮旅虜了亮僚両凌寮料梁涼猟療瞭稜糧良諒遼量陵領力緑倫厘林淋燐琳臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂廉恋憐漣煉簾練聯"],["9840","蓮連錬呂魯櫓炉賂路露労婁廊弄朗楼榔浪漏牢狼篭老聾蝋郎六麓禄肋録論倭和話歪賄脇惑枠鷲亙亘鰐詫藁蕨椀湾碗腕"],["989f","弌丐丕个丱丶丼丿乂乖乘亂亅豫亊舒弍于亞亟亠亢亰亳亶从仍仄仆仂仗仞仭仟价伉佚估佛佝佗佇佶侈侏侘佻佩佰侑佯來侖儘俔俟俎俘俛俑俚俐俤俥倚倨倔倪倥倅伜俶倡倩倬俾俯們倆偃假會偕偐偈做偖偬偸傀傚傅傴傲"],["9940","僉僊傳僂僖僞僥僭僣僮價僵儉儁儂儖儕儔儚儡儺儷儼儻儿兀兒兌兔兢竸兩兪兮冀冂囘册冉冏冑冓冕冖冤冦冢冩冪冫决冱冲冰况冽凅凉凛几處凩凭"],["9980","凰凵凾刄刋刔刎刧刪刮刳刹剏剄剋剌剞剔剪剴剩剳剿剽劍劔劒剱劈劑辨辧劬劭劼劵勁勍勗勞勣勦飭勠勳勵勸勹匆匈甸匍匐匏匕匚匣匯匱匳匸區卆卅丗卉卍凖卞卩卮夘卻卷厂厖厠厦厥厮厰厶參簒雙叟曼燮叮叨叭叺吁吽呀听吭吼吮吶吩吝呎咏呵咎呟呱呷呰咒呻咀呶咄咐咆哇咢咸咥咬哄哈咨"],["9a40","咫哂咤咾咼哘哥哦唏唔哽哮哭哺哢唹啀啣啌售啜啅啖啗唸唳啝喙喀咯喊喟啻啾喘喞單啼喃喩喇喨嗚嗅嗟嗄嗜嗤嗔嘔嗷嘖嗾嗽嘛嗹噎噐營嘴嘶嘲嘸"],["9a80","噫噤嘯噬噪嚆嚀嚊嚠嚔嚏嚥嚮嚶嚴囂嚼囁囃囀囈囎囑囓囗囮囹圀囿圄圉圈國圍圓團圖嗇圜圦圷圸坎圻址坏坩埀垈坡坿垉垓垠垳垤垪垰埃埆埔埒埓堊埖埣堋堙堝塲堡塢塋塰毀塒堽塹墅墹墟墫墺壞墻墸墮壅壓壑壗壙壘壥壜壤壟壯壺壹壻壼壽夂夊夐夛梦夥夬夭夲夸夾竒奕奐奎奚奘奢奠奧奬奩"],["9b40","奸妁妝佞侫妣妲姆姨姜妍姙姚娥娟娑娜娉娚婀婬婉娵娶婢婪媚媼媾嫋嫂媽嫣嫗嫦嫩嫖嫺嫻嬌嬋嬖嬲嫐嬪嬶嬾孃孅孀孑孕孚孛孥孩孰孳孵學斈孺宀"],["9b80","它宦宸寃寇寉寔寐寤實寢寞寥寫寰寶寳尅將專對尓尠尢尨尸尹屁屆屎屓屐屏孱屬屮乢屶屹岌岑岔妛岫岻岶岼岷峅岾峇峙峩峽峺峭嶌峪崋崕崗嵜崟崛崑崔崢崚崙崘嵌嵒嵎嵋嵬嵳嵶嶇嶄嶂嶢嶝嶬嶮嶽嶐嶷嶼巉巍巓巒巖巛巫已巵帋帚帙帑帛帶帷幄幃幀幎幗幔幟幢幤幇幵并幺麼广庠廁廂廈廐廏"],["9c40","廖廣廝廚廛廢廡廨廩廬廱廳廰廴廸廾弃弉彝彜弋弑弖弩弭弸彁彈彌彎弯彑彖彗彙彡彭彳彷徃徂彿徊很徑徇從徙徘徠徨徭徼忖忻忤忸忱忝悳忿怡恠"],["9c80","怙怐怩怎怱怛怕怫怦怏怺恚恁恪恷恟恊恆恍恣恃恤恂恬恫恙悁悍惧悃悚悄悛悖悗悒悧悋惡悸惠惓悴忰悽惆悵惘慍愕愆惶惷愀惴惺愃愡惻惱愍愎慇愾愨愧慊愿愼愬愴愽慂慄慳慷慘慙慚慫慴慯慥慱慟慝慓慵憙憖憇憬憔憚憊憑憫憮懌懊應懷懈懃懆憺懋罹懍懦懣懶懺懴懿懽懼懾戀戈戉戍戌戔戛"],["9d40","戞戡截戮戰戲戳扁扎扞扣扛扠扨扼抂抉找抒抓抖拔抃抔拗拑抻拏拿拆擔拈拜拌拊拂拇抛拉挌拮拱挧挂挈拯拵捐挾捍搜捏掖掎掀掫捶掣掏掉掟掵捫"],["9d80","捩掾揩揀揆揣揉插揶揄搖搴搆搓搦搶攝搗搨搏摧摯摶摎攪撕撓撥撩撈撼據擒擅擇撻擘擂擱擧舉擠擡抬擣擯攬擶擴擲擺攀擽攘攜攅攤攣攫攴攵攷收攸畋效敖敕敍敘敞敝敲數斂斃變斛斟斫斷旃旆旁旄旌旒旛旙无旡旱杲昊昃旻杳昵昶昴昜晏晄晉晁晞晝晤晧晨晟晢晰暃暈暎暉暄暘暝曁暹曉暾暼"],["9e40","曄暸曖曚曠昿曦曩曰曵曷朏朖朞朦朧霸朮朿朶杁朸朷杆杞杠杙杣杤枉杰枩杼杪枌枋枦枡枅枷柯枴柬枳柩枸柤柞柝柢柮枹柎柆柧檜栞框栩桀桍栲桎"],["9e80","梳栫桙档桷桿梟梏梭梔條梛梃檮梹桴梵梠梺椏梍桾椁棊椈棘椢椦棡椌棍棔棧棕椶椒椄棗棣椥棹棠棯椨椪椚椣椡棆楹楷楜楸楫楔楾楮椹楴椽楙椰楡楞楝榁楪榲榮槐榿槁槓榾槎寨槊槝榻槃榧樮榑榠榜榕榴槞槨樂樛槿權槹槲槧樅榱樞槭樔槫樊樒櫁樣樓橄樌橲樶橸橇橢橙橦橈樸樢檐檍檠檄檢檣"],["9f40","檗蘗檻櫃櫂檸檳檬櫞櫑櫟檪櫚櫪櫻欅蘖櫺欒欖鬱欟欸欷盜欹飮歇歃歉歐歙歔歛歟歡歸歹歿殀殄殃殍殘殕殞殤殪殫殯殲殱殳殷殼毆毋毓毟毬毫毳毯"],["9f80","麾氈氓气氛氤氣汞汕汢汪沂沍沚沁沛汾汨汳沒沐泄泱泓沽泗泅泝沮沱沾沺泛泯泙泪洟衍洶洫洽洸洙洵洳洒洌浣涓浤浚浹浙涎涕濤涅淹渕渊涵淇淦涸淆淬淞淌淨淒淅淺淙淤淕淪淮渭湮渮渙湲湟渾渣湫渫湶湍渟湃渺湎渤滿渝游溂溪溘滉溷滓溽溯滄溲滔滕溏溥滂溟潁漑灌滬滸滾漿滲漱滯漲滌"],["e040","漾漓滷澆潺潸澁澀潯潛濳潭澂潼潘澎澑濂潦澳澣澡澤澹濆澪濟濕濬濔濘濱濮濛瀉瀋濺瀑瀁瀏濾瀛瀚潴瀝瀘瀟瀰瀾瀲灑灣炙炒炯烱炬炸炳炮烟烋烝"],["e080","烙焉烽焜焙煥煕熈煦煢煌煖煬熏燻熄熕熨熬燗熹熾燒燉燔燎燠燬燧燵燼燹燿爍爐爛爨爭爬爰爲爻爼爿牀牆牋牘牴牾犂犁犇犒犖犢犧犹犲狃狆狄狎狒狢狠狡狹狷倏猗猊猜猖猝猴猯猩猥猾獎獏默獗獪獨獰獸獵獻獺珈玳珎玻珀珥珮珞璢琅瑯琥珸琲琺瑕琿瑟瑙瑁瑜瑩瑰瑣瑪瑶瑾璋璞璧瓊瓏瓔珱"],["e140","瓠瓣瓧瓩瓮瓲瓰瓱瓸瓷甄甃甅甌甎甍甕甓甞甦甬甼畄畍畊畉畛畆畚畩畤畧畫畭畸當疆疇畴疊疉疂疔疚疝疥疣痂疳痃疵疽疸疼疱痍痊痒痙痣痞痾痿"],["e180","痼瘁痰痺痲痳瘋瘍瘉瘟瘧瘠瘡瘢瘤瘴瘰瘻癇癈癆癜癘癡癢癨癩癪癧癬癰癲癶癸發皀皃皈皋皎皖皓皙皚皰皴皸皹皺盂盍盖盒盞盡盥盧盪蘯盻眈眇眄眩眤眞眥眦眛眷眸睇睚睨睫睛睥睿睾睹瞎瞋瞑瞠瞞瞰瞶瞹瞿瞼瞽瞻矇矍矗矚矜矣矮矼砌砒礦砠礪硅碎硴碆硼碚碌碣碵碪碯磑磆磋磔碾碼磅磊磬"],["e240","磧磚磽磴礇礒礑礙礬礫祀祠祗祟祚祕祓祺祿禊禝禧齋禪禮禳禹禺秉秕秧秬秡秣稈稍稘稙稠稟禀稱稻稾稷穃穗穉穡穢穩龝穰穹穽窈窗窕窘窖窩竈窰"],["e280","窶竅竄窿邃竇竊竍竏竕竓站竚竝竡竢竦竭竰笂笏笊笆笳笘笙笞笵笨笶筐筺笄筍笋筌筅筵筥筴筧筰筱筬筮箝箘箟箍箜箚箋箒箏筝箙篋篁篌篏箴篆篝篩簑簔篦篥籠簀簇簓篳篷簗簍篶簣簧簪簟簷簫簽籌籃籔籏籀籐籘籟籤籖籥籬籵粃粐粤粭粢粫粡粨粳粲粱粮粹粽糀糅糂糘糒糜糢鬻糯糲糴糶糺紆"],["e340","紂紜紕紊絅絋紮紲紿紵絆絳絖絎絲絨絮絏絣經綉絛綏絽綛綺綮綣綵緇綽綫總綢綯緜綸綟綰緘緝緤緞緻緲緡縅縊縣縡縒縱縟縉縋縢繆繦縻縵縹繃縷"],["e380","縲縺繧繝繖繞繙繚繹繪繩繼繻纃緕繽辮繿纈纉續纒纐纓纔纖纎纛纜缸缺罅罌罍罎罐网罕罔罘罟罠罨罩罧罸羂羆羃羈羇羌羔羞羝羚羣羯羲羹羮羶羸譱翅翆翊翕翔翡翦翩翳翹飜耆耄耋耒耘耙耜耡耨耿耻聊聆聒聘聚聟聢聨聳聲聰聶聹聽聿肄肆肅肛肓肚肭冐肬胛胥胙胝胄胚胖脉胯胱脛脩脣脯腋"],["e440","隋腆脾腓腑胼腱腮腥腦腴膃膈膊膀膂膠膕膤膣腟膓膩膰膵膾膸膽臀臂膺臉臍臑臙臘臈臚臟臠臧臺臻臾舁舂舅與舊舍舐舖舩舫舸舳艀艙艘艝艚艟艤"],["e480","艢艨艪艫舮艱艷艸艾芍芒芫芟芻芬苡苣苟苒苴苳苺莓范苻苹苞茆苜茉苙茵茴茖茲茱荀茹荐荅茯茫茗茘莅莚莪莟莢莖茣莎莇莊荼莵荳荵莠莉莨菴萓菫菎菽萃菘萋菁菷萇菠菲萍萢萠莽萸蔆菻葭萪萼蕚蒄葷葫蒭葮蒂葩葆萬葯葹萵蓊葢蒹蒿蒟蓙蓍蒻蓚蓐蓁蓆蓖蒡蔡蓿蓴蔗蔘蔬蔟蔕蔔蓼蕀蕣蕘蕈"],["e540","蕁蘂蕋蕕薀薤薈薑薊薨蕭薔薛藪薇薜蕷蕾薐藉薺藏薹藐藕藝藥藜藹蘊蘓蘋藾藺蘆蘢蘚蘰蘿虍乕虔號虧虱蚓蚣蚩蚪蚋蚌蚶蚯蛄蛆蚰蛉蠣蚫蛔蛞蛩蛬"],["e580","蛟蛛蛯蜒蜆蜈蜀蜃蛻蜑蜉蜍蛹蜊蜴蜿蜷蜻蜥蜩蜚蝠蝟蝸蝌蝎蝴蝗蝨蝮蝙蝓蝣蝪蠅螢螟螂螯蟋螽蟀蟐雖螫蟄螳蟇蟆螻蟯蟲蟠蠏蠍蟾蟶蟷蠎蟒蠑蠖蠕蠢蠡蠱蠶蠹蠧蠻衄衂衒衙衞衢衫袁衾袞衵衽袵衲袂袗袒袮袙袢袍袤袰袿袱裃裄裔裘裙裝裹褂裼裴裨裲褄褌褊褓襃褞褥褪褫襁襄褻褶褸襌褝襠襞"],["e640","襦襤襭襪襯襴襷襾覃覈覊覓覘覡覩覦覬覯覲覺覽覿觀觚觜觝觧觴觸訃訖訐訌訛訝訥訶詁詛詒詆詈詼詭詬詢誅誂誄誨誡誑誥誦誚誣諄諍諂諚諫諳諧"],["e680","諤諱謔諠諢諷諞諛謌謇謚諡謖謐謗謠謳鞫謦謫謾謨譁譌譏譎證譖譛譚譫譟譬譯譴譽讀讌讎讒讓讖讙讚谺豁谿豈豌豎豐豕豢豬豸豺貂貉貅貊貍貎貔豼貘戝貭貪貽貲貳貮貶賈賁賤賣賚賽賺賻贄贅贊贇贏贍贐齎贓賍贔贖赧赭赱赳趁趙跂趾趺跏跚跖跌跛跋跪跫跟跣跼踈踉跿踝踞踐踟蹂踵踰踴蹊"],["e740","蹇蹉蹌蹐蹈蹙蹤蹠踪蹣蹕蹶蹲蹼躁躇躅躄躋躊躓躑躔躙躪躡躬躰軆躱躾軅軈軋軛軣軼軻軫軾輊輅輕輒輙輓輜輟輛輌輦輳輻輹轅轂輾轌轉轆轎轗轜"],["e780","轢轣轤辜辟辣辭辯辷迚迥迢迪迯邇迴逅迹迺逑逕逡逍逞逖逋逧逶逵逹迸遏遐遑遒逎遉逾遖遘遞遨遯遶隨遲邂遽邁邀邊邉邏邨邯邱邵郢郤扈郛鄂鄒鄙鄲鄰酊酖酘酣酥酩酳酲醋醉醂醢醫醯醪醵醴醺釀釁釉釋釐釖釟釡釛釼釵釶鈞釿鈔鈬鈕鈑鉞鉗鉅鉉鉤鉈銕鈿鉋鉐銜銖銓銛鉚鋏銹銷鋩錏鋺鍄錮"],["e840","錙錢錚錣錺錵錻鍜鍠鍼鍮鍖鎰鎬鎭鎔鎹鏖鏗鏨鏥鏘鏃鏝鏐鏈鏤鐚鐔鐓鐃鐇鐐鐶鐫鐵鐡鐺鑁鑒鑄鑛鑠鑢鑞鑪鈩鑰鑵鑷鑽鑚鑼鑾钁鑿閂閇閊閔閖閘閙"],["e880","閠閨閧閭閼閻閹閾闊濶闃闍闌闕闔闖關闡闥闢阡阨阮阯陂陌陏陋陷陜陞陝陟陦陲陬隍隘隕隗險隧隱隲隰隴隶隸隹雎雋雉雍襍雜霍雕雹霄霆霈霓霎霑霏霖霙霤霪霰霹霽霾靄靆靈靂靉靜靠靤靦靨勒靫靱靹鞅靼鞁靺鞆鞋鞏鞐鞜鞨鞦鞣鞳鞴韃韆韈韋韜韭齏韲竟韶韵頏頌頸頤頡頷頽顆顏顋顫顯顰"],["e940","顱顴顳颪颯颱颶飄飃飆飩飫餃餉餒餔餘餡餝餞餤餠餬餮餽餾饂饉饅饐饋饑饒饌饕馗馘馥馭馮馼駟駛駝駘駑駭駮駱駲駻駸騁騏騅駢騙騫騷驅驂驀驃"],["e980","騾驕驍驛驗驟驢驥驤驩驫驪骭骰骼髀髏髑髓體髞髟髢髣髦髯髫髮髴髱髷髻鬆鬘鬚鬟鬢鬣鬥鬧鬨鬩鬪鬮鬯鬲魄魃魏魍魎魑魘魴鮓鮃鮑鮖鮗鮟鮠鮨鮴鯀鯊鮹鯆鯏鯑鯒鯣鯢鯤鯔鯡鰺鯲鯱鯰鰕鰔鰉鰓鰌鰆鰈鰒鰊鰄鰮鰛鰥鰤鰡鰰鱇鰲鱆鰾鱚鱠鱧鱶鱸鳧鳬鳰鴉鴈鳫鴃鴆鴪鴦鶯鴣鴟鵄鴕鴒鵁鴿鴾鵆鵈"],["ea40","鵝鵞鵤鵑鵐鵙鵲鶉鶇鶫鵯鵺鶚鶤鶩鶲鷄鷁鶻鶸鶺鷆鷏鷂鷙鷓鷸鷦鷭鷯鷽鸚鸛鸞鹵鹹鹽麁麈麋麌麒麕麑麝麥麩麸麪麭靡黌黎黏黐黔黜點黝黠黥黨黯"],["ea80","黴黶黷黹黻黼黽鼇鼈皷鼕鼡鼬鼾齊齒齔齣齟齠齡齦齧齬齪齷齲齶龕龜龠堯槇遙瑤凜熙"],["ed40","纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏"],["ed80","塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱"],["ee40","犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙"],["ee80","蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"],["eeef","ⅰ",9,"￢￤＇＂"],["f040","",62],["f080","",124],["f140","",62],["f180","",124],["f240","",62],["f280","",124],["f340","",62],["f380","",124],["f440","",62],["f480","",124],["f540","",62],["f580","",124],["f640","",62],["f680","",124],["f740","",62],["f780","",124],["f840","",62],["f880","",124],["f940",""],["fa40","ⅰ",9,"Ⅰ",9,"￢￤＇＂㈱№℡∵纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊"],["fa80","兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯"],["fb40","涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神"],["fb80","祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙"],["fc40","髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"]]');

/***/ }),
/* 32 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["0","\\u0000",127],["8ea1","｡",62],["a1a1","　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈",9,"＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇"],["a2a1","◆□■△▲▽▼※〒→←↑↓〓"],["a2ba","∈∋⊆⊇⊂⊃∪∩"],["a2ca","∧∨￢⇒⇔∀∃"],["a2dc","∠⊥⌒∂∇≡≒≪≫√∽∝∵∫∬"],["a2f2","Å‰♯♭♪†‡¶"],["a2fe","◯"],["a3b0","０",9],["a3c1","Ａ",25],["a3e1","ａ",25],["a4a1","ぁ",82],["a5a1","ァ",85],["a6a1","Α",16,"Σ",6],["a6c1","α",16,"σ",6],["a7a1","А",5,"ЁЖ",25],["a7d1","а",5,"ёж",25],["a8a1","─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂"],["ada1","①",19,"Ⅰ",9],["adc0","㍉㌔㌢㍍㌘㌧㌃㌶㍑㍗㌍㌦㌣㌫㍊㌻㎜㎝㎞㎎㎏㏄㎡"],["addf","㍻〝〟№㏍℡㊤",4,"㈱㈲㈹㍾㍽㍼≒≡∫∮∑√⊥∠∟⊿∵∩∪"],["b0a1","亜唖娃阿哀愛挨姶逢葵茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻飴絢綾鮎或粟袷安庵按暗案闇鞍杏以伊位依偉囲夷委威尉惟意慰易椅為畏異移維緯胃萎衣謂違遺医井亥域育郁磯一壱溢逸稲茨芋鰯允印咽員因姻引飲淫胤蔭"],["b1a1","院陰隠韻吋右宇烏羽迂雨卯鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏噂云運雲荏餌叡営嬰影映曳栄永泳洩瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲榎厭円園堰奄宴延怨掩援沿演炎焔煙燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥往応"],["b2a1","押旺横欧殴王翁襖鴬鴎黄岡沖荻億屋憶臆桶牡乙俺卸恩温穏音下化仮何伽価佳加可嘉夏嫁家寡科暇果架歌河火珂禍禾稼箇花苛茄荷華菓蝦課嘩貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓駕介会解回塊壊廻快怪悔恢懐戒拐改"],["b3a1","魁晦械海灰界皆絵芥蟹開階貝凱劾外咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚角赫較郭閣隔革学岳楽額顎掛笠樫橿梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱"],["b4a1","粥刈苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛干幹患感慣憾換敢柑桓棺款歓汗漢澗潅環甘監看竿管簡緩缶翰肝艦莞観諌貫還鑑間閑関陥韓館舘丸含岸巌玩癌眼岩翫贋雁頑顔願企伎危喜器基奇嬉寄岐希幾忌揮机旗既期棋棄"],["b5a1","機帰毅気汽畿祈季稀紀徽規記貴起軌輝飢騎鬼亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐逆丘久仇休及吸宮弓急救朽求汲泣灸球究窮笈級糾給旧牛去居巨拒拠挙渠虚許距鋸漁禦魚亨享京"],["b6a1","供侠僑兇競共凶協匡卿叫喬境峡強彊怯恐恭挟教橋況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭暁業局曲極玉桐粁僅勤均巾錦斤欣欽琴禁禽筋緊芹菌衿襟謹近金吟銀九倶句区狗玖矩苦躯駆駈駒具愚虞喰空偶寓遇隅串櫛釧屑屈"],["b7a1","掘窟沓靴轡窪熊隈粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係傾刑兄啓圭珪型契形径恵慶慧憩掲携敬景桂渓畦稽系経継繋罫茎荊蛍計詣警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決潔穴結血訣月件倹倦健兼券剣喧圏堅嫌建憲懸拳捲"],["b8a1","検権牽犬献研硯絹県肩見謙賢軒遣鍵険顕験鹸元原厳幻弦減源玄現絃舷言諺限乎個古呼固姑孤己庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷雇顧鼓五互伍午呉吾娯後御悟梧檎瑚碁語誤護醐乞鯉交佼侯候倖光公功効勾厚口向"],["b9a1","后喉坑垢好孔孝宏工巧巷幸広庚康弘恒慌抗拘控攻昂晃更杭校梗構江洪浩港溝甲皇硬稿糠紅紘絞綱耕考肯肱腔膏航荒行衡講貢購郊酵鉱砿鋼閤降項香高鴻剛劫号合壕拷濠豪轟麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨狛込"],["baa1","此頃今困坤墾婚恨懇昏昆根梱混痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐鎖裟坐座挫債催再最哉塞妻宰彩才採栽歳済災采犀砕砦祭斎細菜裁載際剤在材罪財冴坂阪堺榊肴咲崎埼碕鷺作削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷"],["bba1","察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三傘参山惨撒散桟燦珊産算纂蚕讃賛酸餐斬暫残仕仔伺使刺司史嗣四士始姉姿子屍市師志思指支孜斯施旨枝止死氏獅祉私糸紙紫肢脂至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持時"],["bca1","次滋治爾璽痔磁示而耳自蒔辞汐鹿式識鴫竺軸宍雫七叱執失嫉室悉湿漆疾質実蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫若寂弱惹主取守手朱殊狩珠種腫趣酒首儒受呪寿授樹綬需囚収周"],["bda1","宗就州修愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯週酋酬集醜什住充十従戎柔汁渋獣縦重銃叔夙宿淑祝縮粛塾熟出術述俊峻春瞬竣舜駿准循旬楯殉淳準潤盾純巡遵醇順処初所暑曙渚庶緒署書薯藷諸助叙女序徐恕鋤除傷償"],["bea1","勝匠升召哨商唱嘗奨妾娼宵将小少尚庄床廠彰承抄招掌捷昇昌昭晶松梢樟樵沼消渉湘焼焦照症省硝礁祥称章笑粧紹肖菖蒋蕉衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈丞乗冗剰城場壌嬢常情擾条杖浄状畳穣蒸譲醸錠嘱埴飾"],["bfa1","拭植殖燭織職色触食蝕辱尻伸信侵唇娠寝審心慎振新晋森榛浸深申疹真神秦紳臣芯薪親診身辛進針震人仁刃塵壬尋甚尽腎訊迅陣靭笥諏須酢図厨逗吹垂帥推水炊睡粋翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据杉椙菅頗雀裾"],["c0a1","澄摺寸世瀬畝是凄制勢姓征性成政整星晴棲栖正清牲生盛精聖声製西誠誓請逝醒青静斉税脆隻席惜戚斥昔析石積籍績脊責赤跡蹟碩切拙接摂折設窃節説雪絶舌蝉仙先千占宣専尖川戦扇撰栓栴泉浅洗染潜煎煽旋穿箭線"],["c1a1","繊羨腺舛船薦詮賎践選遷銭銑閃鮮前善漸然全禅繕膳糎噌塑岨措曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡鼠僧創双叢倉喪壮奏爽宋層匝惣想捜掃挿掻操早曹巣槍槽漕燥争痩相窓糟総綜聡草荘葬蒼藻装走送遭鎗霜騒像増憎"],["c2a1","臓蔵贈造促側則即息捉束測足速俗属賊族続卒袖其揃存孫尊損村遜他多太汰詑唾堕妥惰打柁舵楕陀駄騨体堆対耐岱帯待怠態戴替泰滞胎腿苔袋貸退逮隊黛鯛代台大第醍題鷹滝瀧卓啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只"],["c3a1","叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹単嘆坦担探旦歎淡湛炭短端箪綻耽胆蛋誕鍛団壇弾断暖檀段男談値知地弛恥智池痴稚置致蜘遅馳築畜竹筑蓄逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷註酎鋳駐樗瀦猪苧著貯丁兆凋喋寵"],["c4a1","帖帳庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭低停偵剃貞呈堤定帝底庭廷弟悌抵挺提梯汀碇禎程締艇訂諦蹄逓"],["c5a1","邸鄭釘鼎泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄典填天展店添纏甜貼転顛点伝殿澱田電兎吐堵塗妬屠徒斗杜渡登菟賭途都鍍砥砺努度土奴怒倒党冬凍刀唐塔塘套宕島嶋悼投搭東桃梼棟盗淘湯涛灯燈当痘祷等答筒糖統到"],["c6a1","董蕩藤討謄豆踏逃透鐙陶頭騰闘働動同堂導憧撞洞瞳童胴萄道銅峠鴇匿得徳涜特督禿篤毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩匂賑肉虹廿日乳入"],["c7a1","如尿韮任妊忍認濡禰祢寧葱猫熱年念捻撚燃粘乃廼之埜嚢悩濃納能脳膿農覗蚤巴把播覇杷波派琶破婆罵芭馬俳廃拝排敗杯盃牌背肺輩配倍培媒梅楳煤狽買売賠陪這蝿秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝漠爆縛莫駁麦"],["c8a1","函箱硲箸肇筈櫨幡肌畑畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤隼伴判半反叛帆搬斑板氾汎版犯班畔繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮匪卑否妃庇彼悲扉批披斐比泌疲皮碑秘緋罷肥被誹費避非飛樋簸備尾微枇毘琵眉美"],["c9a1","鼻柊稗匹疋髭彦膝菱肘弼必畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌浜瀕貧賓頻敏瓶不付埠夫婦富冨布府怖扶敷斧普浮父符腐膚芙譜負賦赴阜附侮撫武舞葡蕪部封楓風葺蕗伏副復幅服"],["caa1","福腹複覆淵弗払沸仏物鮒分吻噴墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑箆偏変片篇編辺返遍便勉娩弁鞭保舗鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩倣俸包呆報奉宝峰峯崩庖抱捧放方朋"],["cba1","法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒桝亦俣又抹末沫迄侭繭麿万慢満"],["cca1","漫蔓味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠務夢無牟矛霧鵡椋婿娘冥名命明盟迷銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾貰問悶紋門匁也冶夜爺耶野弥矢厄役約薬訳躍靖柳薮鑓愉愈油癒"],["cda1","諭輸唯佑優勇友宥幽悠憂揖有柚湧涌猶猷由祐裕誘遊邑郵雄融夕予余与誉輿預傭幼妖容庸揚揺擁曜楊様洋溶熔用窯羊耀葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫藍蘭覧利吏履李梨理璃"],["cea1","痢裏裡里離陸律率立葎掠略劉流溜琉留硫粒隆竜龍侶慮旅虜了亮僚両凌寮料梁涼猟療瞭稜糧良諒遼量陵領力緑倫厘林淋燐琳臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂廉恋憐漣煉簾練聯"],["cfa1","蓮連錬呂魯櫓炉賂路露労婁廊弄朗楼榔浪漏牢狼篭老聾蝋郎六麓禄肋録論倭和話歪賄脇惑枠鷲亙亘鰐詫藁蕨椀湾碗腕"],["d0a1","弌丐丕个丱丶丼丿乂乖乘亂亅豫亊舒弍于亞亟亠亢亰亳亶从仍仄仆仂仗仞仭仟价伉佚估佛佝佗佇佶侈侏侘佻佩佰侑佯來侖儘俔俟俎俘俛俑俚俐俤俥倚倨倔倪倥倅伜俶倡倩倬俾俯們倆偃假會偕偐偈做偖偬偸傀傚傅傴傲"],["d1a1","僉僊傳僂僖僞僥僭僣僮價僵儉儁儂儖儕儔儚儡儺儷儼儻儿兀兒兌兔兢竸兩兪兮冀冂囘册冉冏冑冓冕冖冤冦冢冩冪冫决冱冲冰况冽凅凉凛几處凩凭凰凵凾刄刋刔刎刧刪刮刳刹剏剄剋剌剞剔剪剴剩剳剿剽劍劔劒剱劈劑辨"],["d2a1","辧劬劭劼劵勁勍勗勞勣勦飭勠勳勵勸勹匆匈甸匍匐匏匕匚匣匯匱匳匸區卆卅丗卉卍凖卞卩卮夘卻卷厂厖厠厦厥厮厰厶參簒雙叟曼燮叮叨叭叺吁吽呀听吭吼吮吶吩吝呎咏呵咎呟呱呷呰咒呻咀呶咄咐咆哇咢咸咥咬哄哈咨"],["d3a1","咫哂咤咾咼哘哥哦唏唔哽哮哭哺哢唹啀啣啌售啜啅啖啗唸唳啝喙喀咯喊喟啻啾喘喞單啼喃喩喇喨嗚嗅嗟嗄嗜嗤嗔嘔嗷嘖嗾嗽嘛嗹噎噐營嘴嘶嘲嘸噫噤嘯噬噪嚆嚀嚊嚠嚔嚏嚥嚮嚶嚴囂嚼囁囃囀囈囎囑囓囗囮囹圀囿圄圉"],["d4a1","圈國圍圓團圖嗇圜圦圷圸坎圻址坏坩埀垈坡坿垉垓垠垳垤垪垰埃埆埔埒埓堊埖埣堋堙堝塲堡塢塋塰毀塒堽塹墅墹墟墫墺壞墻墸墮壅壓壑壗壙壘壥壜壤壟壯壺壹壻壼壽夂夊夐夛梦夥夬夭夲夸夾竒奕奐奎奚奘奢奠奧奬奩"],["d5a1","奸妁妝佞侫妣妲姆姨姜妍姙姚娥娟娑娜娉娚婀婬婉娵娶婢婪媚媼媾嫋嫂媽嫣嫗嫦嫩嫖嫺嫻嬌嬋嬖嬲嫐嬪嬶嬾孃孅孀孑孕孚孛孥孩孰孳孵學斈孺宀它宦宸寃寇寉寔寐寤實寢寞寥寫寰寶寳尅將專對尓尠尢尨尸尹屁屆屎屓"],["d6a1","屐屏孱屬屮乢屶屹岌岑岔妛岫岻岶岼岷峅岾峇峙峩峽峺峭嶌峪崋崕崗嵜崟崛崑崔崢崚崙崘嵌嵒嵎嵋嵬嵳嵶嶇嶄嶂嶢嶝嶬嶮嶽嶐嶷嶼巉巍巓巒巖巛巫已巵帋帚帙帑帛帶帷幄幃幀幎幗幔幟幢幤幇幵并幺麼广庠廁廂廈廐廏"],["d7a1","廖廣廝廚廛廢廡廨廩廬廱廳廰廴廸廾弃弉彝彜弋弑弖弩弭弸彁彈彌彎弯彑彖彗彙彡彭彳彷徃徂彿徊很徑徇從徙徘徠徨徭徼忖忻忤忸忱忝悳忿怡恠怙怐怩怎怱怛怕怫怦怏怺恚恁恪恷恟恊恆恍恣恃恤恂恬恫恙悁悍惧悃悚"],["d8a1","悄悛悖悗悒悧悋惡悸惠惓悴忰悽惆悵惘慍愕愆惶惷愀惴惺愃愡惻惱愍愎慇愾愨愧慊愿愼愬愴愽慂慄慳慷慘慙慚慫慴慯慥慱慟慝慓慵憙憖憇憬憔憚憊憑憫憮懌懊應懷懈懃懆憺懋罹懍懦懣懶懺懴懿懽懼懾戀戈戉戍戌戔戛"],["d9a1","戞戡截戮戰戲戳扁扎扞扣扛扠扨扼抂抉找抒抓抖拔抃抔拗拑抻拏拿拆擔拈拜拌拊拂拇抛拉挌拮拱挧挂挈拯拵捐挾捍搜捏掖掎掀掫捶掣掏掉掟掵捫捩掾揩揀揆揣揉插揶揄搖搴搆搓搦搶攝搗搨搏摧摯摶摎攪撕撓撥撩撈撼"],["daa1","據擒擅擇撻擘擂擱擧舉擠擡抬擣擯攬擶擴擲擺攀擽攘攜攅攤攣攫攴攵攷收攸畋效敖敕敍敘敞敝敲數斂斃變斛斟斫斷旃旆旁旄旌旒旛旙无旡旱杲昊昃旻杳昵昶昴昜晏晄晉晁晞晝晤晧晨晟晢晰暃暈暎暉暄暘暝曁暹曉暾暼"],["dba1","曄暸曖曚曠昿曦曩曰曵曷朏朖朞朦朧霸朮朿朶杁朸朷杆杞杠杙杣杤枉杰枩杼杪枌枋枦枡枅枷柯枴柬枳柩枸柤柞柝柢柮枹柎柆柧檜栞框栩桀桍栲桎梳栫桙档桷桿梟梏梭梔條梛梃檮梹桴梵梠梺椏梍桾椁棊椈棘椢椦棡椌棍"],["dca1","棔棧棕椶椒椄棗棣椥棹棠棯椨椪椚椣椡棆楹楷楜楸楫楔楾楮椹楴椽楙椰楡楞楝榁楪榲榮槐榿槁槓榾槎寨槊槝榻槃榧樮榑榠榜榕榴槞槨樂樛槿權槹槲槧樅榱樞槭樔槫樊樒櫁樣樓橄樌橲樶橸橇橢橙橦橈樸樢檐檍檠檄檢檣"],["dda1","檗蘗檻櫃櫂檸檳檬櫞櫑櫟檪櫚櫪櫻欅蘖櫺欒欖鬱欟欸欷盜欹飮歇歃歉歐歙歔歛歟歡歸歹歿殀殄殃殍殘殕殞殤殪殫殯殲殱殳殷殼毆毋毓毟毬毫毳毯麾氈氓气氛氤氣汞汕汢汪沂沍沚沁沛汾汨汳沒沐泄泱泓沽泗泅泝沮沱沾"],["dea1","沺泛泯泙泪洟衍洶洫洽洸洙洵洳洒洌浣涓浤浚浹浙涎涕濤涅淹渕渊涵淇淦涸淆淬淞淌淨淒淅淺淙淤淕淪淮渭湮渮渙湲湟渾渣湫渫湶湍渟湃渺湎渤滿渝游溂溪溘滉溷滓溽溯滄溲滔滕溏溥滂溟潁漑灌滬滸滾漿滲漱滯漲滌"],["dfa1","漾漓滷澆潺潸澁澀潯潛濳潭澂潼潘澎澑濂潦澳澣澡澤澹濆澪濟濕濬濔濘濱濮濛瀉瀋濺瀑瀁瀏濾瀛瀚潴瀝瀘瀟瀰瀾瀲灑灣炙炒炯烱炬炸炳炮烟烋烝烙焉烽焜焙煥煕熈煦煢煌煖煬熏燻熄熕熨熬燗熹熾燒燉燔燎燠燬燧燵燼"],["e0a1","燹燿爍爐爛爨爭爬爰爲爻爼爿牀牆牋牘牴牾犂犁犇犒犖犢犧犹犲狃狆狄狎狒狢狠狡狹狷倏猗猊猜猖猝猴猯猩猥猾獎獏默獗獪獨獰獸獵獻獺珈玳珎玻珀珥珮珞璢琅瑯琥珸琲琺瑕琿瑟瑙瑁瑜瑩瑰瑣瑪瑶瑾璋璞璧瓊瓏瓔珱"],["e1a1","瓠瓣瓧瓩瓮瓲瓰瓱瓸瓷甄甃甅甌甎甍甕甓甞甦甬甼畄畍畊畉畛畆畚畩畤畧畫畭畸當疆疇畴疊疉疂疔疚疝疥疣痂疳痃疵疽疸疼疱痍痊痒痙痣痞痾痿痼瘁痰痺痲痳瘋瘍瘉瘟瘧瘠瘡瘢瘤瘴瘰瘻癇癈癆癜癘癡癢癨癩癪癧癬癰"],["e2a1","癲癶癸發皀皃皈皋皎皖皓皙皚皰皴皸皹皺盂盍盖盒盞盡盥盧盪蘯盻眈眇眄眩眤眞眥眦眛眷眸睇睚睨睫睛睥睿睾睹瞎瞋瞑瞠瞞瞰瞶瞹瞿瞼瞽瞻矇矍矗矚矜矣矮矼砌砒礦砠礪硅碎硴碆硼碚碌碣碵碪碯磑磆磋磔碾碼磅磊磬"],["e3a1","磧磚磽磴礇礒礑礙礬礫祀祠祗祟祚祕祓祺祿禊禝禧齋禪禮禳禹禺秉秕秧秬秡秣稈稍稘稙稠稟禀稱稻稾稷穃穗穉穡穢穩龝穰穹穽窈窗窕窘窖窩竈窰窶竅竄窿邃竇竊竍竏竕竓站竚竝竡竢竦竭竰笂笏笊笆笳笘笙笞笵笨笶筐"],["e4a1","筺笄筍笋筌筅筵筥筴筧筰筱筬筮箝箘箟箍箜箚箋箒箏筝箙篋篁篌篏箴篆篝篩簑簔篦篥籠簀簇簓篳篷簗簍篶簣簧簪簟簷簫簽籌籃籔籏籀籐籘籟籤籖籥籬籵粃粐粤粭粢粫粡粨粳粲粱粮粹粽糀糅糂糘糒糜糢鬻糯糲糴糶糺紆"],["e5a1","紂紜紕紊絅絋紮紲紿紵絆絳絖絎絲絨絮絏絣經綉絛綏絽綛綺綮綣綵緇綽綫總綢綯緜綸綟綰緘緝緤緞緻緲緡縅縊縣縡縒縱縟縉縋縢繆繦縻縵縹繃縷縲縺繧繝繖繞繙繚繹繪繩繼繻纃緕繽辮繿纈纉續纒纐纓纔纖纎纛纜缸缺"],["e6a1","罅罌罍罎罐网罕罔罘罟罠罨罩罧罸羂羆羃羈羇羌羔羞羝羚羣羯羲羹羮羶羸譱翅翆翊翕翔翡翦翩翳翹飜耆耄耋耒耘耙耜耡耨耿耻聊聆聒聘聚聟聢聨聳聲聰聶聹聽聿肄肆肅肛肓肚肭冐肬胛胥胙胝胄胚胖脉胯胱脛脩脣脯腋"],["e7a1","隋腆脾腓腑胼腱腮腥腦腴膃膈膊膀膂膠膕膤膣腟膓膩膰膵膾膸膽臀臂膺臉臍臑臙臘臈臚臟臠臧臺臻臾舁舂舅與舊舍舐舖舩舫舸舳艀艙艘艝艚艟艤艢艨艪艫舮艱艷艸艾芍芒芫芟芻芬苡苣苟苒苴苳苺莓范苻苹苞茆苜茉苙"],["e8a1","茵茴茖茲茱荀茹荐荅茯茫茗茘莅莚莪莟莢莖茣莎莇莊荼莵荳荵莠莉莨菴萓菫菎菽萃菘萋菁菷萇菠菲萍萢萠莽萸蔆菻葭萪萼蕚蒄葷葫蒭葮蒂葩葆萬葯葹萵蓊葢蒹蒿蒟蓙蓍蒻蓚蓐蓁蓆蓖蒡蔡蓿蓴蔗蔘蔬蔟蔕蔔蓼蕀蕣蕘蕈"],["e9a1","蕁蘂蕋蕕薀薤薈薑薊薨蕭薔薛藪薇薜蕷蕾薐藉薺藏薹藐藕藝藥藜藹蘊蘓蘋藾藺蘆蘢蘚蘰蘿虍乕虔號虧虱蚓蚣蚩蚪蚋蚌蚶蚯蛄蛆蚰蛉蠣蚫蛔蛞蛩蛬蛟蛛蛯蜒蜆蜈蜀蜃蛻蜑蜉蜍蛹蜊蜴蜿蜷蜻蜥蜩蜚蝠蝟蝸蝌蝎蝴蝗蝨蝮蝙"],["eaa1","蝓蝣蝪蠅螢螟螂螯蟋螽蟀蟐雖螫蟄螳蟇蟆螻蟯蟲蟠蠏蠍蟾蟶蟷蠎蟒蠑蠖蠕蠢蠡蠱蠶蠹蠧蠻衄衂衒衙衞衢衫袁衾袞衵衽袵衲袂袗袒袮袙袢袍袤袰袿袱裃裄裔裘裙裝裹褂裼裴裨裲褄褌褊褓襃褞褥褪褫襁襄褻褶褸襌褝襠襞"],["eba1","襦襤襭襪襯襴襷襾覃覈覊覓覘覡覩覦覬覯覲覺覽覿觀觚觜觝觧觴觸訃訖訐訌訛訝訥訶詁詛詒詆詈詼詭詬詢誅誂誄誨誡誑誥誦誚誣諄諍諂諚諫諳諧諤諱謔諠諢諷諞諛謌謇謚諡謖謐謗謠謳鞫謦謫謾謨譁譌譏譎證譖譛譚譫"],["eca1","譟譬譯譴譽讀讌讎讒讓讖讙讚谺豁谿豈豌豎豐豕豢豬豸豺貂貉貅貊貍貎貔豼貘戝貭貪貽貲貳貮貶賈賁賤賣賚賽賺賻贄贅贊贇贏贍贐齎贓賍贔贖赧赭赱赳趁趙跂趾趺跏跚跖跌跛跋跪跫跟跣跼踈踉跿踝踞踐踟蹂踵踰踴蹊"],["eda1","蹇蹉蹌蹐蹈蹙蹤蹠踪蹣蹕蹶蹲蹼躁躇躅躄躋躊躓躑躔躙躪躡躬躰軆躱躾軅軈軋軛軣軼軻軫軾輊輅輕輒輙輓輜輟輛輌輦輳輻輹轅轂輾轌轉轆轎轗轜轢轣轤辜辟辣辭辯辷迚迥迢迪迯邇迴逅迹迺逑逕逡逍逞逖逋逧逶逵逹迸"],["eea1","遏遐遑遒逎遉逾遖遘遞遨遯遶隨遲邂遽邁邀邊邉邏邨邯邱邵郢郤扈郛鄂鄒鄙鄲鄰酊酖酘酣酥酩酳酲醋醉醂醢醫醯醪醵醴醺釀釁釉釋釐釖釟釡釛釼釵釶鈞釿鈔鈬鈕鈑鉞鉗鉅鉉鉤鉈銕鈿鉋鉐銜銖銓銛鉚鋏銹銷鋩錏鋺鍄錮"],["efa1","錙錢錚錣錺錵錻鍜鍠鍼鍮鍖鎰鎬鎭鎔鎹鏖鏗鏨鏥鏘鏃鏝鏐鏈鏤鐚鐔鐓鐃鐇鐐鐶鐫鐵鐡鐺鑁鑒鑄鑛鑠鑢鑞鑪鈩鑰鑵鑷鑽鑚鑼鑾钁鑿閂閇閊閔閖閘閙閠閨閧閭閼閻閹閾闊濶闃闍闌闕闔闖關闡闥闢阡阨阮阯陂陌陏陋陷陜陞"],["f0a1","陝陟陦陲陬隍隘隕隗險隧隱隲隰隴隶隸隹雎雋雉雍襍雜霍雕雹霄霆霈霓霎霑霏霖霙霤霪霰霹霽霾靄靆靈靂靉靜靠靤靦靨勒靫靱靹鞅靼鞁靺鞆鞋鞏鞐鞜鞨鞦鞣鞳鞴韃韆韈韋韜韭齏韲竟韶韵頏頌頸頤頡頷頽顆顏顋顫顯顰"],["f1a1","顱顴顳颪颯颱颶飄飃飆飩飫餃餉餒餔餘餡餝餞餤餠餬餮餽餾饂饉饅饐饋饑饒饌饕馗馘馥馭馮馼駟駛駝駘駑駭駮駱駲駻駸騁騏騅駢騙騫騷驅驂驀驃騾驕驍驛驗驟驢驥驤驩驫驪骭骰骼髀髏髑髓體髞髟髢髣髦髯髫髮髴髱髷"],["f2a1","髻鬆鬘鬚鬟鬢鬣鬥鬧鬨鬩鬪鬮鬯鬲魄魃魏魍魎魑魘魴鮓鮃鮑鮖鮗鮟鮠鮨鮴鯀鯊鮹鯆鯏鯑鯒鯣鯢鯤鯔鯡鰺鯲鯱鯰鰕鰔鰉鰓鰌鰆鰈鰒鰊鰄鰮鰛鰥鰤鰡鰰鱇鰲鱆鰾鱚鱠鱧鱶鱸鳧鳬鳰鴉鴈鳫鴃鴆鴪鴦鶯鴣鴟鵄鴕鴒鵁鴿鴾鵆鵈"],["f3a1","鵝鵞鵤鵑鵐鵙鵲鶉鶇鶫鵯鵺鶚鶤鶩鶲鷄鷁鶻鶸鶺鷆鷏鷂鷙鷓鷸鷦鷭鷯鷽鸚鸛鸞鹵鹹鹽麁麈麋麌麒麕麑麝麥麩麸麪麭靡黌黎黏黐黔黜點黝黠黥黨黯黴黶黷黹黻黼黽鼇鼈皷鼕鼡鼬鼾齊齒齔齣齟齠齡齦齧齬齪齷齲齶龕龜龠"],["f4a1","堯槇遙瑤凜熙"],["f9a1","纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德"],["faa1","忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱"],["fba1","犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚"],["fca1","釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"],["fcf1","ⅰ",9,"￢￤＇＂"],["8fa2af","˘ˇ¸˙˝¯˛˚～΄΅"],["8fa2c2","¡¦¿"],["8fa2eb","ºª©®™¤№"],["8fa6e1","ΆΈΉΊΪ"],["8fa6e7","Ό"],["8fa6e9","ΎΫ"],["8fa6ec","Ώ"],["8fa6f1","άέήίϊΐόςύϋΰώ"],["8fa7c2","Ђ",10,"ЎЏ"],["8fa7f2","ђ",10,"ўџ"],["8fa9a1","ÆĐ"],["8fa9a4","Ħ"],["8fa9a6","Ĳ"],["8fa9a8","ŁĿ"],["8fa9ab","ŊØŒ"],["8fa9af","ŦÞ"],["8fa9c1","æđðħıĳĸłŀŉŋøœßŧþ"],["8faaa1","ÁÀÄÂĂǍĀĄÅÃĆĈČÇĊĎÉÈËÊĚĖĒĘ"],["8faaba","ĜĞĢĠĤÍÌÏÎǏİĪĮĨĴĶĹĽĻŃŇŅÑÓÒÖÔǑŐŌÕŔŘŖŚŜŠŞŤŢÚÙÜÛŬǓŰŪŲŮŨǗǛǙǕŴÝŸŶŹŽŻ"],["8faba1","áàäâăǎāąåãćĉčçċďéèëêěėēęǵĝğ"],["8fabbd","ġĥíìïîǐ"],["8fabc5","īįĩĵķĺľļńňņñóòöôǒőōõŕřŗśŝšşťţúùüûŭǔűūųůũǘǜǚǖŵýÿŷźžż"],["8fb0a1","丂丄丅丌丒丟丣两丨丫丮丯丰丵乀乁乄乇乑乚乜乣乨乩乴乵乹乿亍亖亗亝亯亹仃仐仚仛仠仡仢仨仯仱仳仵份仾仿伀伂伃伈伋伌伒伕伖众伙伮伱你伳伵伷伹伻伾佀佂佈佉佋佌佒佔佖佘佟佣佪佬佮佱佷佸佹佺佽佾侁侂侄"],["8fb1a1","侅侉侊侌侎侐侒侓侔侗侙侚侞侟侲侷侹侻侼侽侾俀俁俅俆俈俉俋俌俍俏俒俜俠俢俰俲俼俽俿倀倁倄倇倊倌倎倐倓倗倘倛倜倝倞倢倧倮倰倲倳倵偀偁偂偅偆偊偌偎偑偒偓偗偙偟偠偢偣偦偧偪偭偰偱倻傁傃傄傆傊傎傏傐"],["8fb2a1","傒傓傔傖傛傜傞",4,"傪傯傰傹傺傽僀僃僄僇僌僎僐僓僔僘僜僝僟僢僤僦僨僩僯僱僶僺僾儃儆儇儈儋儌儍儎僲儐儗儙儛儜儝儞儣儧儨儬儭儯儱儳儴儵儸儹兂兊兏兓兕兗兘兟兤兦兾冃冄冋冎冘冝冡冣冭冸冺冼冾冿凂"],["8fb3a1","凈减凑凒凓凕凘凞凢凥凮凲凳凴凷刁刂刅划刓刕刖刘刢刨刱刲刵刼剅剉剕剗剘剚剜剟剠剡剦剮剷剸剹劀劂劅劊劌劓劕劖劗劘劚劜劤劥劦劧劯劰劶劷劸劺劻劽勀勄勆勈勌勏勑勔勖勛勜勡勥勨勩勪勬勰勱勴勶勷匀匃匊匋"],["8fb4a1","匌匑匓匘匛匜匞匟匥匧匨匩匫匬匭匰匲匵匼匽匾卂卌卋卙卛卡卣卥卬卭卲卹卾厃厇厈厎厓厔厙厝厡厤厪厫厯厲厴厵厷厸厺厽叀叅叏叒叓叕叚叝叞叠另叧叵吂吓吚吡吧吨吪启吱吴吵呃呄呇呍呏呞呢呤呦呧呩呫呭呮呴呿"],["8fb5a1","咁咃咅咈咉咍咑咕咖咜咟咡咦咧咩咪咭咮咱咷咹咺咻咿哆哊响哎哠哪哬哯哶哼哾哿唀唁唅唈唉唌唍唎唕唪唫唲唵唶唻唼唽啁啇啉啊啍啐啑啘啚啛啞啠啡啤啦啿喁喂喆喈喎喏喑喒喓喔喗喣喤喭喲喿嗁嗃嗆嗉嗋嗌嗎嗑嗒"],["8fb6a1","嗓嗗嗘嗛嗞嗢嗩嗶嗿嘅嘈嘊嘍",5,"嘙嘬嘰嘳嘵嘷嘹嘻嘼嘽嘿噀噁噃噄噆噉噋噍噏噔噞噠噡噢噣噦噩噭噯噱噲噵嚄嚅嚈嚋嚌嚕嚙嚚嚝嚞嚟嚦嚧嚨嚩嚫嚬嚭嚱嚳嚷嚾囅囉囊囋囏囐囌囍囙囜囝囟囡囤",4,"囱囫园"],["8fb7a1","囶囷圁圂圇圊圌圑圕圚圛圝圠圢圣圤圥圩圪圬圮圯圳圴圽圾圿坅坆坌坍坒坢坥坧坨坫坭",4,"坳坴坵坷坹坺坻坼坾垁垃垌垔垗垙垚垜垝垞垟垡垕垧垨垩垬垸垽埇埈埌埏埕埝埞埤埦埧埩埭埰埵埶埸埽埾埿堃堄堈堉埡"],["8fb8a1","堌堍堛堞堟堠堦堧堭堲堹堿塉塌塍塏塐塕塟塡塤塧塨塸塼塿墀墁墇墈墉墊墌墍墏墐墔墖墝墠墡墢墦墩墱墲壄墼壂壈壍壎壐壒壔壖壚壝壡壢壩壳夅夆夋夌夒夓夔虁夝夡夣夤夨夯夰夳夵夶夿奃奆奒奓奙奛奝奞奟奡奣奫奭"],["8fb9a1","奯奲奵奶她奻奼妋妌妎妒妕妗妟妤妧妭妮妯妰妳妷妺妼姁姃姄姈姊姍姒姝姞姟姣姤姧姮姯姱姲姴姷娀娄娌娍娎娒娓娞娣娤娧娨娪娭娰婄婅婇婈婌婐婕婞婣婥婧婭婷婺婻婾媋媐媓媖媙媜媞媟媠媢媧媬媱媲媳媵媸媺媻媿"],["8fbaa1","嫄嫆嫈嫏嫚嫜嫠嫥嫪嫮嫵嫶嫽嬀嬁嬈嬗嬴嬙嬛嬝嬡嬥嬭嬸孁孋孌孒孖孞孨孮孯孼孽孾孿宁宄宆宊宎宐宑宓宔宖宨宩宬宭宯宱宲宷宺宼寀寁寍寏寖",4,"寠寯寱寴寽尌尗尞尟尣尦尩尫尬尮尰尲尵尶屙屚屜屢屣屧屨屩"],["8fbba1","屭屰屴屵屺屻屼屽岇岈岊岏岒岝岟岠岢岣岦岪岲岴岵岺峉峋峒峝峗峮峱峲峴崁崆崍崒崫崣崤崦崧崱崴崹崽崿嵂嵃嵆嵈嵕嵑嵙嵊嵟嵠嵡嵢嵤嵪嵭嵰嵹嵺嵾嵿嶁嶃嶈嶊嶒嶓嶔嶕嶙嶛嶟嶠嶧嶫嶰嶴嶸嶹巃巇巋巐巎巘巙巠巤"],["8fbca1","巩巸巹帀帇帍帒帔帕帘帟帠帮帨帲帵帾幋幐幉幑幖幘幛幜幞幨幪",4,"幰庀庋庎庢庤庥庨庪庬庱庳庽庾庿廆廌廋廎廑廒廔廕廜廞廥廫异弆弇弈弎弙弜弝弡弢弣弤弨弫弬弮弰弴弶弻弽弿彀彄彅彇彍彐彔彘彛彠彣彤彧"],["8fbda1","彯彲彴彵彸彺彽彾徉徍徏徖徜徝徢徧徫徤徬徯徰徱徸忄忇忈忉忋忐",4,"忞忡忢忨忩忪忬忭忮忯忲忳忶忺忼怇怊怍怓怔怗怘怚怟怤怭怳怵恀恇恈恉恌恑恔恖恗恝恡恧恱恾恿悂悆悈悊悎悑悓悕悘悝悞悢悤悥您悰悱悷"],["8fbea1","悻悾惂惄惈惉惊惋惎惏惔惕惙惛惝惞惢惥惲惵惸惼惽愂愇愊愌愐",4,"愖愗愙愜愞愢愪愫愰愱愵愶愷愹慁慅慆慉慞慠慬慲慸慻慼慿憀憁憃憄憋憍憒憓憗憘憜憝憟憠憥憨憪憭憸憹憼懀懁懂懎懏懕懜懝懞懟懡懢懧懩懥"],["8fbfa1","懬懭懯戁戃戄戇戓戕戜戠戢戣戧戩戫戹戽扂扃扄扆扌扐扑扒扔扖扚扜扤扭扯扳扺扽抍抎抏抐抦抨抳抶抷抺抾抿拄拎拕拖拚拪拲拴拼拽挃挄挊挋挍挐挓挖挘挩挪挭挵挶挹挼捁捂捃捄捆捊捋捎捒捓捔捘捛捥捦捬捭捱捴捵"],["8fc0a1","捸捼捽捿掂掄掇掊掐掔掕掙掚掞掤掦掭掮掯掽揁揅揈揎揑揓揔揕揜揠揥揪揬揲揳揵揸揹搉搊搐搒搔搘搞搠搢搤搥搩搪搯搰搵搽搿摋摏摑摒摓摔摚摛摜摝摟摠摡摣摭摳摴摻摽撅撇撏撐撑撘撙撛撝撟撡撣撦撨撬撳撽撾撿"],["8fc1a1","擄擉擊擋擌擎擐擑擕擗擤擥擩擪擭擰擵擷擻擿攁攄攈攉攊攏攓攔攖攙攛攞攟攢攦攩攮攱攺攼攽敃敇敉敐敒敔敟敠敧敫敺敽斁斅斊斒斕斘斝斠斣斦斮斲斳斴斿旂旈旉旎旐旔旖旘旟旰旲旴旵旹旾旿昀昄昈昉昍昑昒昕昖昝"],["8fc2a1","昞昡昢昣昤昦昩昪昫昬昮昰昱昳昹昷晀晅晆晊晌晑晎晗晘晙晛晜晠晡曻晪晫晬晾晳晵晿晷晸晹晻暀晼暋暌暍暐暒暙暚暛暜暟暠暤暭暱暲暵暻暿曀曂曃曈曌曎曏曔曛曟曨曫曬曮曺朅朇朎朓朙朜朠朢朳朾杅杇杈杌杔杕杝"],["8fc3a1","杦杬杮杴杶杻极构枎枏枑枓枖枘枙枛枰枱枲枵枻枼枽柹柀柂柃柅柈柉柒柗柙柜柡柦柰柲柶柷桒栔栙栝栟栨栧栬栭栯栰栱栳栻栿桄桅桊桌桕桗桘桛桫桮",4,"桵桹桺桻桼梂梄梆梈梖梘梚梜梡梣梥梩梪梮梲梻棅棈棌棏"],["8fc4a1","棐棑棓棖棙棜棝棥棨棪棫棬棭棰棱棵棶棻棼棽椆椉椊椐椑椓椖椗椱椳椵椸椻楂楅楉楎楗楛楣楤楥楦楨楩楬楰楱楲楺楻楿榀榍榒榖榘榡榥榦榨榫榭榯榷榸榺榼槅槈槑槖槗槢槥槮槯槱槳槵槾樀樁樃樏樑樕樚樝樠樤樨樰樲"],["8fc5a1","樴樷樻樾樿橅橆橉橊橎橐橑橒橕橖橛橤橧橪橱橳橾檁檃檆檇檉檋檑檛檝檞檟檥檫檯檰檱檴檽檾檿櫆櫉櫈櫌櫐櫔櫕櫖櫜櫝櫤櫧櫬櫰櫱櫲櫼櫽欂欃欆欇欉欏欐欑欗欛欞欤欨欫欬欯欵欶欻欿歆歊歍歒歖歘歝歠歧歫歮歰歵歽"],["8fc6a1","歾殂殅殗殛殟殠殢殣殨殩殬殭殮殰殸殹殽殾毃毄毉毌毖毚毡毣毦毧毮毱毷毹毿氂氄氅氉氍氎氐氒氙氟氦氧氨氬氮氳氵氶氺氻氿汊汋汍汏汒汔汙汛汜汫汭汯汴汶汸汹汻沅沆沇沉沔沕沗沘沜沟沰沲沴泂泆泍泏泐泑泒泔泖"],["8fc7a1","泚泜泠泧泩泫泬泮泲泴洄洇洊洎洏洑洓洚洦洧洨汧洮洯洱洹洼洿浗浞浟浡浥浧浯浰浼涂涇涑涒涔涖涗涘涪涬涴涷涹涽涿淄淈淊淎淏淖淛淝淟淠淢淥淩淯淰淴淶淼渀渄渞渢渧渲渶渹渻渼湄湅湈湉湋湏湑湒湓湔湗湜湝湞"],["8fc8a1","湢湣湨湳湻湽溍溓溙溠溧溭溮溱溳溻溿滀滁滃滇滈滊滍滎滏滫滭滮滹滻滽漄漈漊漌漍漖漘漚漛漦漩漪漯漰漳漶漻漼漭潏潑潒潓潗潙潚潝潞潡潢潨潬潽潾澃澇澈澋澌澍澐澒澓澔澖澚澟澠澥澦澧澨澮澯澰澵澶澼濅濇濈濊"],["8fc9a1","濚濞濨濩濰濵濹濼濽瀀瀅瀆瀇瀍瀗瀠瀣瀯瀴瀷瀹瀼灃灄灈灉灊灋灔灕灝灞灎灤灥灬灮灵灶灾炁炅炆炔",4,"炛炤炫炰炱炴炷烊烑烓烔烕烖烘烜烤烺焃",4,"焋焌焏焞焠焫焭焯焰焱焸煁煅煆煇煊煋煐煒煗煚煜煞煠"],["8fcaa1","煨煹熀熅熇熌熒熚熛熠熢熯熰熲熳熺熿燀燁燄燋燌燓燖燙燚燜燸燾爀爇爈爉爓爗爚爝爟爤爫爯爴爸爹牁牂牃牅牎牏牐牓牕牖牚牜牞牠牣牨牫牮牯牱牷牸牻牼牿犄犉犍犎犓犛犨犭犮犱犴犾狁狇狉狌狕狖狘狟狥狳狴狺狻"],["8fcba1","狾猂猄猅猇猋猍猒猓猘猙猞猢猤猧猨猬猱猲猵猺猻猽獃獍獐獒獖獘獝獞獟獠獦獧獩獫獬獮獯獱獷獹獼玀玁玃玅玆玎玐玓玕玗玘玜玞玟玠玢玥玦玪玫玭玵玷玹玼玽玿珅珆珉珋珌珏珒珓珖珙珝珡珣珦珧珩珴珵珷珹珺珻珽"],["8fcca1","珿琀琁琄琇琊琑琚琛琤琦琨",9,"琹瑀瑃瑄瑆瑇瑋瑍瑑瑒瑗瑝瑢瑦瑧瑨瑫瑭瑮瑱瑲璀璁璅璆璇璉璏璐璑璒璘璙璚璜璟璠璡璣璦璨璩璪璫璮璯璱璲璵璹璻璿瓈瓉瓌瓐瓓瓘瓚瓛瓞瓟瓤瓨瓪瓫瓯瓴瓺瓻瓼瓿甆"],["8fcda1","甒甖甗甠甡甤甧甩甪甯甶甹甽甾甿畀畃畇畈畎畐畒畗畞畟畡畯畱畹",5,"疁疅疐疒疓疕疙疜疢疤疴疺疿痀痁痄痆痌痎痏痗痜痟痠痡痤痧痬痮痯痱痹瘀瘂瘃瘄瘇瘈瘊瘌瘏瘒瘓瘕瘖瘙瘛瘜瘝瘞瘣瘥瘦瘩瘭瘲瘳瘵瘸瘹"],["8fcea1","瘺瘼癊癀癁癃癄癅癉癋癕癙癟癤癥癭癮癯癱癴皁皅皌皍皕皛皜皝皟皠皢",6,"皪皭皽盁盅盉盋盌盎盔盙盠盦盨盬盰盱盶盹盼眀眆眊眎眒眔眕眗眙眚眜眢眨眭眮眯眴眵眶眹眽眾睂睅睆睊睍睎睏睒睖睗睜睞睟睠睢"],["8fcfa1","睤睧睪睬睰睲睳睴睺睽瞀瞄瞌瞍瞔瞕瞖瞚瞟瞢瞧瞪瞮瞯瞱瞵瞾矃矉矑矒矕矙矞矟矠矤矦矪矬矰矱矴矸矻砅砆砉砍砎砑砝砡砢砣砭砮砰砵砷硃硄硇硈硌硎硒硜硞硠硡硣硤硨硪确硺硾碊碏碔碘碡碝碞碟碤碨碬碭碰碱碲碳"],["8fd0a1","碻碽碿磇磈磉磌磎磒磓磕磖磤磛磟磠磡磦磪磲磳礀磶磷磺磻磿礆礌礐礚礜礞礟礠礥礧礩礭礱礴礵礻礽礿祄祅祆祊祋祏祑祔祘祛祜祧祩祫祲祹祻祼祾禋禌禑禓禔禕禖禘禛禜禡禨禩禫禯禱禴禸离秂秄秇秈秊秏秔秖秚秝秞"],["8fd1a1","秠秢秥秪秫秭秱秸秼稂稃稇稉稊稌稑稕稛稞稡稧稫稭稯稰稴稵稸稹稺穄穅穇穈穌穕穖穙穜穝穟穠穥穧穪穭穵穸穾窀窂窅窆窊窋窐窑窔窞窠窣窬窳窵窹窻窼竆竉竌竎竑竛竨竩竫竬竱竴竻竽竾笇笔笟笣笧笩笪笫笭笮笯笰"],["8fd2a1","笱笴笽笿筀筁筇筎筕筠筤筦筩筪筭筯筲筳筷箄箉箎箐箑箖箛箞箠箥箬箯箰箲箵箶箺箻箼箽篂篅篈篊篔篖篗篙篚篛篨篪篲篴篵篸篹篺篼篾簁簂簃簄簆簉簋簌簎簏簙簛簠簥簦簨簬簱簳簴簶簹簺籆籊籕籑籒籓籙",5],["8fd3a1","籡籣籧籩籭籮籰籲籹籼籽粆粇粏粔粞粠粦粰粶粷粺粻粼粿糄糇糈糉糍糏糓糔糕糗糙糚糝糦糩糫糵紃紇紈紉紏紑紒紓紖紝紞紣紦紪紭紱紼紽紾絀絁絇絈絍絑絓絗絙絚絜絝絥絧絪絰絸絺絻絿綁綂綃綅綆綈綋綌綍綑綖綗綝"],["8fd4a1","綞綦綧綪綳綶綷綹緂",4,"緌緍緎緗緙縀緢緥緦緪緫緭緱緵緶緹緺縈縐縑縕縗縜縝縠縧縨縬縭縯縳縶縿繄繅繇繎繐繒繘繟繡繢繥繫繮繯繳繸繾纁纆纇纊纍纑纕纘纚纝纞缼缻缽缾缿罃罄罇罏罒罓罛罜罝罡罣罤罥罦罭"],["8fd5a1","罱罽罾罿羀羋羍羏羐羑羖羗羜羡羢羦羪羭羴羼羿翀翃翈翎翏翛翟翣翥翨翬翮翯翲翺翽翾翿耇耈耊耍耎耏耑耓耔耖耝耞耟耠耤耦耬耮耰耴耵耷耹耺耼耾聀聄聠聤聦聭聱聵肁肈肎肜肞肦肧肫肸肹胈胍胏胒胔胕胗胘胠胭胮"],["8fd6a1","胰胲胳胶胹胺胾脃脋脖脗脘脜脞脠脤脧脬脰脵脺脼腅腇腊腌腒腗腠腡腧腨腩腭腯腷膁膐膄膅膆膋膎膖膘膛膞膢膮膲膴膻臋臃臅臊臎臏臕臗臛臝臞臡臤臫臬臰臱臲臵臶臸臹臽臿舀舃舏舓舔舙舚舝舡舢舨舲舴舺艃艄艅艆"],["8fd7a1","艋艎艏艑艖艜艠艣艧艭艴艻艽艿芀芁芃芄芇芉芊芎芑芔芖芘芚芛芠芡芣芤芧芨芩芪芮芰芲芴芷芺芼芾芿苆苐苕苚苠苢苤苨苪苭苯苶苷苽苾茀茁茇茈茊茋荔茛茝茞茟茡茢茬茭茮茰茳茷茺茼茽荂荃荄荇荍荎荑荕荖荗荰荸"],["8fd8a1","荽荿莀莂莄莆莍莒莔莕莘莙莛莜莝莦莧莩莬莾莿菀菇菉菏菐菑菔菝荓菨菪菶菸菹菼萁萆萊萏萑萕萙莭萯萹葅葇葈葊葍葏葑葒葖葘葙葚葜葠葤葥葧葪葰葳葴葶葸葼葽蒁蒅蒒蒓蒕蒞蒦蒨蒩蒪蒯蒱蒴蒺蒽蒾蓀蓂蓇蓈蓌蓏蓓"],["8fd9a1","蓜蓧蓪蓯蓰蓱蓲蓷蔲蓺蓻蓽蔂蔃蔇蔌蔎蔐蔜蔞蔢蔣蔤蔥蔧蔪蔫蔯蔳蔴蔶蔿蕆蕏",4,"蕖蕙蕜",6,"蕤蕫蕯蕹蕺蕻蕽蕿薁薅薆薉薋薌薏薓薘薝薟薠薢薥薧薴薶薷薸薼薽薾薿藂藇藊藋藎薭藘藚藟藠藦藨藭藳藶藼"],["8fdaa1","藿蘀蘄蘅蘍蘎蘐蘑蘒蘘蘙蘛蘞蘡蘧蘩蘶蘸蘺蘼蘽虀虂虆虒虓虖虗虘虙虝虠",4,"虩虬虯虵虶虷虺蚍蚑蚖蚘蚚蚜蚡蚦蚧蚨蚭蚱蚳蚴蚵蚷蚸蚹蚿蛀蛁蛃蛅蛑蛒蛕蛗蛚蛜蛠蛣蛥蛧蚈蛺蛼蛽蜄蜅蜇蜋蜎蜏蜐蜓蜔蜙蜞蜟蜡蜣"],["8fdba1","蜨蜮蜯蜱蜲蜹蜺蜼蜽蜾蝀蝃蝅蝍蝘蝝蝡蝤蝥蝯蝱蝲蝻螃",6,"螋螌螐螓螕螗螘螙螞螠螣螧螬螭螮螱螵螾螿蟁蟈蟉蟊蟎蟕蟖蟙蟚蟜蟟蟢蟣蟤蟪蟫蟭蟱蟳蟸蟺蟿蠁蠃蠆蠉蠊蠋蠐蠙蠒蠓蠔蠘蠚蠛蠜蠞蠟蠨蠭蠮蠰蠲蠵"],["8fdca1","蠺蠼衁衃衅衈衉衊衋衎衑衕衖衘衚衜衟衠衤衩衱衹衻袀袘袚袛袜袟袠袨袪袺袽袾裀裊",4,"裑裒裓裛裞裧裯裰裱裵裷褁褆褍褎褏褕褖褘褙褚褜褠褦褧褨褰褱褲褵褹褺褾襀襂襅襆襉襏襒襗襚襛襜襡襢襣襫襮襰襳襵襺"],["8fdda1","襻襼襽覉覍覐覔覕覛覜覟覠覥覰覴覵覶覷覼觔",4,"觥觩觫觭觱觳觶觹觽觿訄訅訇訏訑訒訔訕訞訠訢訤訦訫訬訯訵訷訽訾詀詃詅詇詉詍詎詓詖詗詘詜詝詡詥詧詵詶詷詹詺詻詾詿誀誃誆誋誏誐誒誖誗誙誟誧誩誮誯誳"],["8fdea1","誶誷誻誾諃諆諈諉諊諑諓諔諕諗諝諟諬諰諴諵諶諼諿謅謆謋謑謜謞謟謊謭謰謷謼譂",4,"譈譒譓譔譙譍譞譣譭譶譸譹譼譾讁讄讅讋讍讏讔讕讜讞讟谸谹谽谾豅豇豉豋豏豑豓豔豗豘豛豝豙豣豤豦豨豩豭豳豵豶豻豾貆"],["8fdfa1","貇貋貐貒貓貙貛貜貤貹貺賅賆賉賋賏賖賕賙賝賡賨賬賯賰賲賵賷賸賾賿贁贃贉贒贗贛赥赩赬赮赿趂趄趈趍趐趑趕趞趟趠趦趫趬趯趲趵趷趹趻跀跅跆跇跈跊跎跑跔跕跗跙跤跥跧跬跰趼跱跲跴跽踁踄踅踆踋踑踔踖踠踡踢"],["8fe0a1","踣踦踧踱踳踶踷踸踹踽蹀蹁蹋蹍蹎蹏蹔蹛蹜蹝蹞蹡蹢蹩蹬蹭蹯蹰蹱蹹蹺蹻躂躃躉躐躒躕躚躛躝躞躢躧躩躭躮躳躵躺躻軀軁軃軄軇軏軑軔軜軨軮軰軱軷軹軺軭輀輂輇輈輏輐輖輗輘輞輠輡輣輥輧輨輬輭輮輴輵輶輷輺轀轁"],["8fe1a1","轃轇轏轑",4,"轘轝轞轥辝辠辡辤辥辦辵辶辸达迀迁迆迊迋迍运迒迓迕迠迣迤迨迮迱迵迶迻迾适逄逈逌逘逛逨逩逯逪逬逭逳逴逷逿遃遄遌遛遝遢遦遧遬遰遴遹邅邈邋邌邎邐邕邗邘邙邛邠邡邢邥邰邲邳邴邶邽郌邾郃"],["8fe2a1","郄郅郇郈郕郗郘郙郜郝郟郥郒郶郫郯郰郴郾郿鄀鄄鄅鄆鄈鄍鄐鄔鄖鄗鄘鄚鄜鄞鄠鄥鄢鄣鄧鄩鄮鄯鄱鄴鄶鄷鄹鄺鄼鄽酃酇酈酏酓酗酙酚酛酡酤酧酭酴酹酺酻醁醃醅醆醊醎醑醓醔醕醘醞醡醦醨醬醭醮醰醱醲醳醶醻醼醽醿"],["8fe3a1","釂釃釅釓釔釗釙釚釞釤釥釩釪釬",5,"釷釹釻釽鈀鈁鈄鈅鈆鈇鈉鈊鈌鈐鈒鈓鈖鈘鈜鈝鈣鈤鈥鈦鈨鈮鈯鈰鈳鈵鈶鈸鈹鈺鈼鈾鉀鉂鉃鉆鉇鉊鉍鉎鉏鉑鉘鉙鉜鉝鉠鉡鉥鉧鉨鉩鉮鉯鉰鉵",4,"鉻鉼鉽鉿銈銉銊銍銎銒銗"],["8fe4a1","銙銟銠銤銥銧銨銫銯銲銶銸銺銻銼銽銿",4,"鋅鋆鋇鋈鋋鋌鋍鋎鋐鋓鋕鋗鋘鋙鋜鋝鋟鋠鋡鋣鋥鋧鋨鋬鋮鋰鋹鋻鋿錀錂錈錍錑錔錕錜錝錞錟錡錤錥錧錩錪錳錴錶錷鍇鍈鍉鍐鍑鍒鍕鍗鍘鍚鍞鍤鍥鍧鍩鍪鍭鍯鍰鍱鍳鍴鍶"],["8fe5a1","鍺鍽鍿鎀鎁鎂鎈鎊鎋鎍鎏鎒鎕鎘鎛鎞鎡鎣鎤鎦鎨鎫鎴鎵鎶鎺鎩鏁鏄鏅鏆鏇鏉",4,"鏓鏙鏜鏞鏟鏢鏦鏧鏹鏷鏸鏺鏻鏽鐁鐂鐄鐈鐉鐍鐎鐏鐕鐖鐗鐟鐮鐯鐱鐲鐳鐴鐻鐿鐽鑃鑅鑈鑊鑌鑕鑙鑜鑟鑡鑣鑨鑫鑭鑮鑯鑱鑲钄钃镸镹"],["8fe6a1","镾閄閈閌閍閎閝閞閟閡閦閩閫閬閴閶閺閽閿闆闈闉闋闐闑闒闓闙闚闝闞闟闠闤闦阝阞阢阤阥阦阬阱阳阷阸阹阺阼阽陁陒陔陖陗陘陡陮陴陻陼陾陿隁隂隃隄隉隑隖隚隝隟隤隥隦隩隮隯隳隺雊雒嶲雘雚雝雞雟雩雯雱雺霂"],["8fe7a1","霃霅霉霚霛霝霡霢霣霨霱霳靁靃靊靎靏靕靗靘靚靛靣靧靪靮靳靶靷靸靻靽靿鞀鞉鞕鞖鞗鞙鞚鞞鞟鞢鞬鞮鞱鞲鞵鞶鞸鞹鞺鞼鞾鞿韁韄韅韇韉韊韌韍韎韐韑韔韗韘韙韝韞韠韛韡韤韯韱韴韷韸韺頇頊頙頍頎頔頖頜頞頠頣頦"],["8fe8a1","頫頮頯頰頲頳頵頥頾顄顇顊顑顒顓顖顗顙顚顢顣顥顦顪顬颫颭颮颰颴颷颸颺颻颿飂飅飈飌飡飣飥飦飧飪飳飶餂餇餈餑餕餖餗餚餛餜餟餢餦餧餫餱",4,"餹餺餻餼饀饁饆饇饈饍饎饔饘饙饛饜饞饟饠馛馝馟馦馰馱馲馵"],["8fe9a1","馹馺馽馿駃駉駓駔駙駚駜駞駧駪駫駬駰駴駵駹駽駾騂騃騄騋騌騐騑騖騞騠騢騣騤騧騭騮騳騵騶騸驇驁驄驊驋驌驎驑驔驖驝骪骬骮骯骲骴骵骶骹骻骾骿髁髃髆髈髎髐髒髕髖髗髛髜髠髤髥髧髩髬髲髳髵髹髺髽髿",4],["8feaa1","鬄鬅鬈鬉鬋鬌鬍鬎鬐鬒鬖鬙鬛鬜鬠鬦鬫鬭鬳鬴鬵鬷鬹鬺鬽魈魋魌魕魖魗魛魞魡魣魥魦魨魪",4,"魳魵魷魸魹魿鮀鮄鮅鮆鮇鮉鮊鮋鮍鮏鮐鮔鮚鮝鮞鮦鮧鮩鮬鮰鮱鮲鮷鮸鮻鮼鮾鮿鯁鯇鯈鯎鯐鯗鯘鯝鯟鯥鯧鯪鯫鯯鯳鯷鯸"],["8feba1","鯹鯺鯽鯿鰀鰂鰋鰏鰑鰖鰘鰙鰚鰜鰞鰢鰣鰦",4,"鰱鰵鰶鰷鰽鱁鱃鱄鱅鱉鱊鱎鱏鱐鱓鱔鱖鱘鱛鱝鱞鱟鱣鱩鱪鱜鱫鱨鱮鱰鱲鱵鱷鱻鳦鳲鳷鳹鴋鴂鴑鴗鴘鴜鴝鴞鴯鴰鴲鴳鴴鴺鴼鵅鴽鵂鵃鵇鵊鵓鵔鵟鵣鵢鵥鵩鵪鵫鵰鵶鵷鵻"],["8feca1","鵼鵾鶃鶄鶆鶊鶍鶎鶒鶓鶕鶖鶗鶘鶡鶪鶬鶮鶱鶵鶹鶼鶿鷃鷇鷉鷊鷔鷕鷖鷗鷚鷞鷟鷠鷥鷧鷩鷫鷮鷰鷳鷴鷾鸊鸂鸇鸎鸐鸑鸒鸕鸖鸙鸜鸝鹺鹻鹼麀麂麃麄麅麇麎麏麖麘麛麞麤麨麬麮麯麰麳麴麵黆黈黋黕黟黤黧黬黭黮黰黱黲黵"],["8feda1","黸黿鼂鼃鼉鼏鼐鼑鼒鼔鼖鼗鼙鼚鼛鼟鼢鼦鼪鼫鼯鼱鼲鼴鼷鼹鼺鼼鼽鼿齁齃",4,"齓齕齖齗齘齚齝齞齨齩齭",4,"齳齵齺齽龏龐龑龒龔龖龗龞龡龢龣龥"]]');

/***/ }),
/* 33 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["0","\\u0000",127,"€"],["8140","丂丄丅丆丏丒丗丟丠両丣並丩丮丯丱丳丵丷丼乀乁乂乄乆乊乑乕乗乚乛乢乣乤乥乧乨乪",5,"乲乴",9,"乿",6,"亇亊"],["8180","亐亖亗亙亜亝亞亣亪亯亰亱亴亶亷亸亹亼亽亾仈仌仏仐仒仚仛仜仠仢仦仧仩仭仮仯仱仴仸仹仺仼仾伀伂",6,"伋伌伒",4,"伜伝伡伣伨伩伬伭伮伱伳伵伷伹伻伾",4,"佄佅佇",5,"佒佔佖佡佢佦佨佪佫佭佮佱佲併佷佸佹佺佽侀侁侂侅來侇侊侌侎侐侒侓侕侖侘侙侚侜侞侟価侢"],["8240","侤侫侭侰",4,"侶",8,"俀俁係俆俇俈俉俋俌俍俒",4,"俙俛俠俢俤俥俧俫俬俰俲俴俵俶俷俹俻俼俽俿",11],["8280","個倎倐們倓倕倖倗倛倝倞倠倢倣値倧倫倯",10,"倻倽倿偀偁偂偄偅偆偉偊偋偍偐",4,"偖偗偘偙偛偝",7,"偦",5,"偭",8,"偸偹偺偼偽傁傂傃傄傆傇傉傊傋傌傎",20,"傤傦傪傫傭",4,"傳",6,"傼"],["8340","傽",17,"僐",5,"僗僘僙僛",10,"僨僩僪僫僯僰僱僲僴僶",4,"僼",9,"儈"],["8380","儉儊儌",5,"儓",13,"儢",28,"兂兇兊兌兎兏児兒兓兗兘兙兛兝",4,"兣兤兦內兩兪兯兲兺兾兿冃冄円冇冊冋冎冏冐冑冓冔冘冚冝冞冟冡冣冦",4,"冭冮冴冸冹冺冾冿凁凂凃凅凈凊凍凎凐凒",5],["8440","凘凙凚凜凞凟凢凣凥",5,"凬凮凱凲凴凷凾刄刅刉刋刌刏刐刓刔刕刜刞刟刡刢刣別刦刧刪刬刯刱刲刴刵刼刾剄",5,"剋剎剏剒剓剕剗剘"],["8480","剙剚剛剝剟剠剢剣剤剦剨剫剬剭剮剰剱剳",9,"剾劀劃",4,"劉",6,"劑劒劔",6,"劜劤劥劦劧劮劯劰労",9,"勀勁勂勄勅勆勈勊勌勍勎勏勑勓勔動勗務",5,"勠勡勢勣勥",10,"勱",7,"勻勼勽匁匂匃匄匇匉匊匋匌匎"],["8540","匑匒匓匔匘匛匜匞匟匢匤匥匧匨匩匫匬匭匯",9,"匼匽區卂卄卆卋卌卍卐協単卙卛卝卥卨卪卬卭卲卶卹卻卼卽卾厀厁厃厇厈厊厎厏"],["8580","厐",4,"厖厗厙厛厜厞厠厡厤厧厪厫厬厭厯",6,"厷厸厹厺厼厽厾叀參",4,"収叏叐叒叓叕叚叜叝叞叡叢叧叴叺叾叿吀吂吅吇吋吔吘吙吚吜吢吤吥吪吰吳吶吷吺吽吿呁呂呄呅呇呉呌呍呎呏呑呚呝",4,"呣呥呧呩",7,"呴呹呺呾呿咁咃咅咇咈咉咊咍咑咓咗咘咜咞咟咠咡"],["8640","咢咥咮咰咲咵咶咷咹咺咼咾哃哅哊哋哖哘哛哠",4,"哫哬哯哰哱哴",5,"哻哾唀唂唃唄唅唈唊",4,"唒唓唕",5,"唜唝唞唟唡唥唦"],["8680","唨唩唫唭唲唴唵唶唸唹唺唻唽啀啂啅啇啈啋",4,"啑啒啓啔啗",4,"啝啞啟啠啢啣啨啩啫啯",5,"啹啺啽啿喅喆喌喍喎喐喒喓喕喖喗喚喛喞喠",6,"喨",8,"喲喴営喸喺喼喿",4,"嗆嗇嗈嗊嗋嗎嗏嗐嗕嗗",4,"嗞嗠嗢嗧嗩嗭嗮嗰嗱嗴嗶嗸",4,"嗿嘂嘃嘄嘅"],["8740","嘆嘇嘊嘋嘍嘐",7,"嘙嘚嘜嘝嘠嘡嘢嘥嘦嘨嘩嘪嘫嘮嘯嘰嘳嘵嘷嘸嘺嘼嘽嘾噀",11,"噏",4,"噕噖噚噛噝",4],["8780","噣噥噦噧噭噮噯噰噲噳噴噵噷噸噹噺噽",7,"嚇",6,"嚐嚑嚒嚔",14,"嚤",10,"嚰",6,"嚸嚹嚺嚻嚽",12,"囋",8,"囕囖囘囙囜団囥",5,"囬囮囯囲図囶囷囸囻囼圀圁圂圅圇國",6],["8840","園",9,"圝圞圠圡圢圤圥圦圧圫圱圲圴",4,"圼圽圿坁坃坄坅坆坈坉坋坒",4,"坘坙坢坣坥坧坬坮坰坱坲坴坵坸坹坺坽坾坿垀"],["8880","垁垇垈垉垊垍",4,"垔",6,"垜垝垞垟垥垨垪垬垯垰垱垳垵垶垷垹",8,"埄",6,"埌埍埐埑埓埖埗埛埜埞埡埢埣埥",7,"埮埰埱埲埳埵埶執埻埼埾埿堁堃堄堅堈堉堊堌堎堏堐堒堓堔堖堗堘堚堛堜堝堟堢堣堥",4,"堫",4,"報堲堳場堶",7],["8940","堾",5,"塅",6,"塎塏塐塒塓塕塖塗塙",4,"塟",5,"塦",4,"塭",16,"塿墂墄墆墇墈墊墋墌"],["8980","墍",4,"墔",4,"墛墜墝墠",7,"墪",17,"墽墾墿壀壂壃壄壆",10,"壒壓壔壖",13,"壥",5,"壭壯壱売壴壵壷壸壺",7,"夃夅夆夈",4,"夎夐夑夒夓夗夘夛夝夞夠夡夢夣夦夨夬夰夲夳夵夶夻"],["8a40","夽夾夿奀奃奅奆奊奌奍奐奒奓奙奛",4,"奡奣奤奦",12,"奵奷奺奻奼奾奿妀妅妉妋妌妎妏妐妑妔妕妘妚妛妜妝妟妠妡妢妦"],["8a80","妧妬妭妰妱妳",5,"妺妼妽妿",6,"姇姈姉姌姍姎姏姕姖姙姛姞",4,"姤姦姧姩姪姫姭",11,"姺姼姽姾娀娂娊娋娍娎娏娐娒娔娕娖娗娙娚娛娝娞娡娢娤娦娧娨娪",6,"娳娵娷",4,"娽娾娿婁",4,"婇婈婋",9,"婖婗婘婙婛",5],["8b40","婡婣婤婥婦婨婩婫",8,"婸婹婻婼婽婾媀",17,"媓",6,"媜",13,"媫媬"],["8b80","媭",4,"媴媶媷媹",4,"媿嫀嫃",5,"嫊嫋嫍",4,"嫓嫕嫗嫙嫚嫛嫝嫞嫟嫢嫤嫥嫧嫨嫪嫬",4,"嫲",22,"嬊",11,"嬘",25,"嬳嬵嬶嬸",7,"孁",6],["8c40","孈",7,"孒孖孞孠孡孧孨孫孭孮孯孲孴孶孷學孹孻孼孾孿宂宆宊宍宎宐宑宒宔宖実宧宨宩宬宭宮宯宱宲宷宺宻宼寀寁寃寈寉寊寋寍寎寏"],["8c80","寑寔",8,"寠寢寣實寧審",4,"寯寱",6,"寽対尀専尃尅將專尋尌對導尐尒尓尗尙尛尞尟尠尡尣尦尨尩尪尫尭尮尯尰尲尳尵尶尷屃屄屆屇屌屍屒屓屔屖屗屘屚屛屜屝屟屢層屧",6,"屰屲",6,"屻屼屽屾岀岃",4,"岉岊岋岎岏岒岓岕岝",4,"岤",4],["8d40","岪岮岯岰岲岴岶岹岺岻岼岾峀峂峃峅",5,"峌",5,"峓",5,"峚",6,"峢峣峧峩峫峬峮峯峱",9,"峼",4],["8d80","崁崄崅崈",5,"崏",4,"崕崗崘崙崚崜崝崟",4,"崥崨崪崫崬崯",4,"崵",7,"崿",7,"嵈嵉嵍",10,"嵙嵚嵜嵞",10,"嵪嵭嵮嵰嵱嵲嵳嵵",12,"嶃",21,"嶚嶛嶜嶞嶟嶠"],["8e40","嶡",21,"嶸",12,"巆",6,"巎",12,"巜巟巠巣巤巪巬巭"],["8e80","巰巵巶巸",4,"巿帀帄帇帉帊帋帍帎帒帓帗帞",7,"帨",4,"帯帰帲",4,"帹帺帾帿幀幁幃幆",5,"幍",6,"幖",4,"幜幝幟幠幣",14,"幵幷幹幾庁庂広庅庈庉庌庍庎庒庘庛庝庡庢庣庤庨",4,"庮",4,"庴庺庻庼庽庿",6],["8f40","廆廇廈廋",5,"廔廕廗廘廙廚廜",11,"廩廫",8,"廵廸廹廻廼廽弅弆弇弉弌弍弎弐弒弔弖弙弚弜弝弞弡弢弣弤"],["8f80","弨弫弬弮弰弲",6,"弻弽弾弿彁",14,"彑彔彙彚彛彜彞彟彠彣彥彧彨彫彮彯彲彴彵彶彸彺彽彾彿徃徆徍徎徏徑従徔徖徚徛徝從徟徠徢",5,"復徫徬徯",5,"徶徸徹徺徻徾",4,"忇忈忊忋忎忓忔忕忚忛応忞忟忢忣忥忦忨忩忬忯忰忲忳忴忶忷忹忺忼怇"],["9040","怈怉怋怌怐怑怓怗怘怚怞怟怢怣怤怬怭怮怰",4,"怶",4,"怽怾恀恄",6,"恌恎恏恑恓恔恖恗恘恛恜恞恟恠恡恥恦恮恱恲恴恵恷恾悀"],["9080","悁悂悅悆悇悈悊悋悎悏悐悑悓悕悗悘悙悜悞悡悢悤悥悧悩悪悮悰悳悵悶悷悹悺悽",7,"惇惈惉惌",4,"惒惓惔惖惗惙惛惞惡",4,"惪惱惲惵惷惸惻",4,"愂愃愄愅愇愊愋愌愐",4,"愖愗愘愙愛愜愝愞愡愢愥愨愩愪愬",18,"慀",6],["9140","慇慉態慍慏慐慒慓慔慖",6,"慞慟慠慡慣慤慥慦慩",6,"慱慲慳慴慶慸",18,"憌憍憏",4,"憕"],["9180","憖",6,"憞",8,"憪憫憭",9,"憸",5,"憿懀懁懃",4,"應懌",4,"懓懕",16,"懧",13,"懶",8,"戀",5,"戇戉戓戔戙戜戝戞戠戣戦戧戨戩戫戭戯戰戱戲戵戶戸",4,"扂扄扅扆扊"],["9240","扏扐払扖扗扙扚扜",6,"扤扥扨扱扲扴扵扷扸扺扻扽抁抂抃抅抆抇抈抋",5,"抔抙抜抝択抣抦抧抩抪抭抮抯抰抲抳抴抶抷抸抺抾拀拁"],["9280","拃拋拏拑拕拝拞拠拡拤拪拫拰拲拵拸拹拺拻挀挃挄挅挆挊挋挌挍挏挐挒挓挔挕挗挘挙挜挦挧挩挬挭挮挰挱挳",5,"挻挼挾挿捀捁捄捇捈捊捑捒捓捔捖",7,"捠捤捥捦捨捪捫捬捯捰捲捳捴捵捸捹捼捽捾捿掁掃掄掅掆掋掍掑掓掔掕掗掙",6,"採掤掦掫掯掱掲掵掶掹掻掽掿揀"],["9340","揁揂揃揅揇揈揊揋揌揑揓揔揕揗",6,"揟揢揤",4,"揫揬揮揯揰揱揳揵揷揹揺揻揼揾搃搄搆",4,"損搎搑搒搕",5,"搝搟搢搣搤"],["9380","搥搧搨搩搫搮",5,"搵",4,"搻搼搾摀摂摃摉摋",6,"摓摕摖摗摙",4,"摟",7,"摨摪摫摬摮",9,"摻",6,"撃撆撈",8,"撓撔撗撘撚撛撜撝撟",4,"撥撦撧撨撪撫撯撱撲撳撴撶撹撻撽撾撿擁擃擄擆",6,"擏擑擓擔擕擖擙據"],["9440","擛擜擝擟擠擡擣擥擧",24,"攁",7,"攊",7,"攓",4,"攙",8],["9480","攢攣攤攦",4,"攬攭攰攱攲攳攷攺攼攽敀",4,"敆敇敊敋敍敎敐敒敓敔敗敘敚敜敟敠敡敤敥敧敨敩敪敭敮敯敱敳敵敶數",14,"斈斉斊斍斎斏斒斔斕斖斘斚斝斞斠斢斣斦斨斪斬斮斱",7,"斺斻斾斿旀旂旇旈旉旊旍旐旑旓旔旕旘",7,"旡旣旤旪旫"],["9540","旲旳旴旵旸旹旻",4,"昁昄昅昇昈昉昋昍昐昑昒昖昗昘昚昛昜昞昡昢昣昤昦昩昪昫昬昮昰昲昳昷",4,"昽昿晀時晄",6,"晍晎晐晑晘"],["9580","晙晛晜晝晞晠晢晣晥晧晩",4,"晱晲晳晵晸晹晻晼晽晿暀暁暃暅暆暈暉暊暋暍暎暏暐暒暓暔暕暘",4,"暞",8,"暩",4,"暯",4,"暵暶暷暸暺暻暼暽暿",25,"曚曞",7,"曧曨曪",5,"曱曵曶書曺曻曽朁朂會"],["9640","朄朅朆朇朌朎朏朑朒朓朖朘朙朚朜朞朠",5,"朧朩朮朰朲朳朶朷朸朹朻朼朾朿杁杄杅杇杊杋杍杒杔杕杗",4,"杝杢杣杤杦杧杫杬杮東杴杶"],["9680","杸杹杺杻杽枀枂枃枅枆枈枊枌枍枎枏枑枒枓枔枖枙枛枟枠枡枤枦枩枬枮枱枲枴枹",7,"柂柅",9,"柕柖柗柛柟柡柣柤柦柧柨柪柫柭柮柲柵",7,"柾栁栂栃栄栆栍栐栒栔栕栘",4,"栞栟栠栢",6,"栫",6,"栴栵栶栺栻栿桇桋桍桏桒桖",5],["9740","桜桝桞桟桪桬",7,"桵桸",8,"梂梄梇",7,"梐梑梒梔梕梖梘",9,"梣梤梥梩梪梫梬梮梱梲梴梶梷梸"],["9780","梹",6,"棁棃",5,"棊棌棎棏棐棑棓棔棖棗棙棛",4,"棡棢棤",9,"棯棲棳棴棶棷棸棻棽棾棿椀椂椃椄椆",4,"椌椏椑椓",11,"椡椢椣椥",7,"椮椯椱椲椳椵椶椷椸椺椻椼椾楀楁楃",16,"楕楖楘楙楛楜楟"],["9840","楡楢楤楥楧楨楩楪楬業楯楰楲",4,"楺楻楽楾楿榁榃榅榊榋榌榎",5,"榖榗榙榚榝",9,"榩榪榬榮榯榰榲榳榵榶榸榹榺榼榽"],["9880","榾榿槀槂",7,"構槍槏槑槒槓槕",5,"槜槝槞槡",11,"槮槯槰槱槳",9,"槾樀",9,"樋",11,"標",5,"樠樢",5,"権樫樬樭樮樰樲樳樴樶",6,"樿",4,"橅橆橈",7,"橑",6,"橚"],["9940","橜",4,"橢橣橤橦",10,"橲",6,"橺橻橽橾橿檁檂檃檅",8,"檏檒",4,"檘",7,"檡",5],["9980","檧檨檪檭",114,"欥欦欨",6],["9a40","欯欰欱欳欴欵欶欸欻欼欽欿歀歁歂歄歅歈歊歋歍",11,"歚",7,"歨歩歫",13,"歺歽歾歿殀殅殈"],["9a80","殌殎殏殐殑殔殕殗殘殙殜",4,"殢",7,"殫",7,"殶殸",6,"毀毃毄毆",4,"毌毎毐毑毘毚毜",4,"毢",7,"毬毭毮毰毱毲毴毶毷毸毺毻毼毾",6,"氈",4,"氎氒気氜氝氞氠氣氥氫氬氭氱氳氶氷氹氺氻氼氾氿汃汄汅汈汋",4,"汑汒汓汖汘"],["9b40","汙汚汢汣汥汦汧汫",4,"汱汳汵汷汸決汻汼汿沀沄沇沊沋沍沎沑沒沕沖沗沘沚沜沝沞沠沢沨沬沯沰沴沵沶沷沺泀況泂泃泆泇泈泋泍泎泏泑泒泘"],["9b80","泙泚泜泝泟泤泦泧泩泬泭泲泴泹泿洀洂洃洅洆洈洉洊洍洏洐洑洓洔洕洖洘洜洝洟",5,"洦洨洩洬洭洯洰洴洶洷洸洺洿浀浂浄浉浌浐浕浖浗浘浛浝浟浡浢浤浥浧浨浫浬浭浰浱浲浳浵浶浹浺浻浽",4,"涃涄涆涇涊涋涍涏涐涒涖",4,"涜涢涥涬涭涰涱涳涴涶涷涹",5,"淁淂淃淈淉淊"],["9c40","淍淎淏淐淒淓淔淕淗淚淛淜淟淢淣淥淧淨淩淪淭淯淰淲淴淵淶淸淺淽",7,"渆渇済渉渋渏渒渓渕渘渙減渜渞渟渢渦渧渨渪測渮渰渱渳渵"],["9c80","渶渷渹渻",7,"湅",7,"湏湐湑湒湕湗湙湚湜湝湞湠",10,"湬湭湯",14,"満溁溂溄溇溈溊",4,"溑",6,"溙溚溛溝溞溠溡溣溤溦溨溩溫溬溭溮溰溳溵溸溹溼溾溿滀滃滄滅滆滈滉滊滌滍滎滐滒滖滘滙滛滜滝滣滧滪",5],["9d40","滰滱滲滳滵滶滷滸滺",7,"漃漄漅漇漈漊",4,"漐漑漒漖",9,"漡漢漣漥漦漧漨漬漮漰漲漴漵漷",6,"漿潀潁潂"],["9d80","潃潄潅潈潉潊潌潎",9,"潙潚潛潝潟潠潡潣潤潥潧",5,"潯潰潱潳潵潶潷潹潻潽",6,"澅澆澇澊澋澏",12,"澝澞澟澠澢",4,"澨",10,"澴澵澷澸澺",5,"濁濃",5,"濊",6,"濓",10,"濟濢濣濤濥"],["9e40","濦",7,"濰",32,"瀒",7,"瀜",6,"瀤",6],["9e80","瀫",9,"瀶瀷瀸瀺",17,"灍灎灐",13,"灟",11,"灮灱灲灳灴灷灹灺灻災炁炂炃炄炆炇炈炋炌炍炏炐炑炓炗炘炚炛炞",12,"炰炲炴炵炶為炾炿烄烅烆烇烉烋",12,"烚"],["9f40","烜烝烞烠烡烢烣烥烪烮烰",6,"烸烺烻烼烾",10,"焋",4,"焑焒焔焗焛",10,"焧",7,"焲焳焴"],["9f80","焵焷",13,"煆煇煈煉煋煍煏",12,"煝煟",4,"煥煩",4,"煯煰煱煴煵煶煷煹煻煼煾",5,"熅",4,"熋熌熍熎熐熑熒熓熕熖熗熚",4,"熡",6,"熩熪熫熭",5,"熴熶熷熸熺",8,"燄",9,"燏",4],["a040","燖",9,"燡燢燣燤燦燨",5,"燯",9,"燺",11,"爇",19],["a080","爛爜爞",9,"爩爫爭爮爯爲爳爴爺爼爾牀",6,"牉牊牋牎牏牐牑牓牔牕牗牘牚牜牞牠牣牤牥牨牪牫牬牭牰牱牳牴牶牷牸牻牼牽犂犃犅",4,"犌犎犐犑犓",11,"犠",11,"犮犱犲犳犵犺",6,"狅狆狇狉狊狋狌狏狑狓狔狕狖狘狚狛"],["a1a1","　、。·ˉˇ¨〃々—～‖…‘’“”〔〕〈",7,"〖〗【】±×÷∶∧∨∑∏∪∩∈∷√⊥∥∠⌒⊙∫∮≡≌≈∽∝≠≮≯≤≥∞∵∴♂♀°′″℃＄¤￠￡‰§№☆★○●◎◇◆□■△▲※→←↑↓〓"],["a2a1","ⅰ",9],["a2b1","⒈",19,"⑴",19,"①",9],["a2e5","㈠",9],["a2f1","Ⅰ",11],["a3a1","！＂＃￥％",88,"￣"],["a4a1","ぁ",82],["a5a1","ァ",85],["a6a1","Α",16,"Σ",6],["a6c1","α",16,"σ",6],["a6e0","︵︶︹︺︿﹀︽︾﹁﹂﹃﹄"],["a6ee","︻︼︷︸︱"],["a6f4","︳︴"],["a7a1","А",5,"ЁЖ",25],["a7d1","а",5,"ёж",25],["a840","ˊˋ˙–―‥‵℅℉↖↗↘↙∕∟∣≒≦≧⊿═",35,"▁",6],["a880","█",7,"▓▔▕▼▽◢◣◤◥☉⊕〒〝〞"],["a8a1","āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêɑ"],["a8bd","ńň"],["a8c0","ɡ"],["a8c5","ㄅ",36],["a940","〡",8,"㊣㎎㎏㎜㎝㎞㎡㏄㏎㏑㏒㏕︰￢￤"],["a959","℡㈱"],["a95c","‐"],["a960","ー゛゜ヽヾ〆ゝゞ﹉",9,"﹔﹕﹖﹗﹙",8],["a980","﹢",4,"﹨﹩﹪﹫"],["a996","〇"],["a9a4","─",75],["aa40","狜狝狟狢",5,"狪狫狵狶狹狽狾狿猀猂猄",5,"猋猌猍猏猐猑猒猔猘猙猚猟猠猣猤猦猧猨猭猯猰猲猳猵猶猺猻猼猽獀",8],["aa80","獉獊獋獌獎獏獑獓獔獕獖獘",7,"獡",10,"獮獰獱"],["ab40","獲",11,"獿",4,"玅玆玈玊玌玍玏玐玒玓玔玕玗玘玙玚玜玝玞玠玡玣",5,"玪玬玭玱玴玵玶玸玹玼玽玾玿珁珃",4],["ab80","珋珌珎珒",6,"珚珛珜珝珟珡珢珣珤珦珨珪珫珬珮珯珰珱珳",4],["ac40","珸",10,"琄琇琈琋琌琍琎琑",8,"琜",5,"琣琤琧琩琫琭琯琱琲琷",4,"琽琾琿瑀瑂",11],["ac80","瑎",6,"瑖瑘瑝瑠",12,"瑮瑯瑱",4,"瑸瑹瑺"],["ad40","瑻瑼瑽瑿璂璄璅璆璈璉璊璌璍璏璑",10,"璝璟",7,"璪",15,"璻",12],["ad80","瓈",9,"瓓",8,"瓝瓟瓡瓥瓧",6,"瓰瓱瓲"],["ae40","瓳瓵瓸",6,"甀甁甂甃甅",7,"甎甐甒甔甕甖甗甛甝甞甠",4,"甦甧甪甮甴甶甹甼甽甿畁畂畃畄畆畇畉畊畍畐畑畒畓畕畖畗畘"],["ae80","畝",7,"畧畨畩畫",6,"畳畵當畷畺",4,"疀疁疂疄疅疇"],["af40","疈疉疊疌疍疎疐疓疕疘疛疜疞疢疦",4,"疭疶疷疺疻疿痀痁痆痋痌痎痏痐痑痓痗痙痚痜痝痟痠痡痥痩痬痭痮痯痲痳痵痶痷痸痺痻痽痾瘂瘄瘆瘇"],["af80","瘈瘉瘋瘍瘎瘏瘑瘒瘓瘔瘖瘚瘜瘝瘞瘡瘣瘧瘨瘬瘮瘯瘱瘲瘶瘷瘹瘺瘻瘽癁療癄"],["b040","癅",6,"癎",5,"癕癗",4,"癝癟癠癡癢癤",6,"癬癭癮癰",7,"癹発發癿皀皁皃皅皉皊皌皍皏皐皒皔皕皗皘皚皛"],["b080","皜",7,"皥",8,"皯皰皳皵",9,"盀盁盃啊阿埃挨哎唉哀皑癌蔼矮艾碍爱隘鞍氨安俺按暗岸胺案肮昂盎凹敖熬翱袄傲奥懊澳芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸白柏百摆佰败拜稗斑班搬扳般颁板版扮拌伴瓣半办绊邦帮梆榜膀绑棒磅蚌镑傍谤苞胞包褒剥"],["b140","盄盇盉盋盌盓盕盙盚盜盝盞盠",4,"盦",7,"盰盳盵盶盷盺盻盽盿眀眂眃眅眆眊県眎",10,"眛眜眝眞眡眣眤眥眧眪眫"],["b180","眬眮眰",4,"眹眻眽眾眿睂睄睅睆睈",7,"睒",7,"睜薄雹保堡饱宝抱报暴豹鲍爆杯碑悲卑北辈背贝钡倍狈备惫焙被奔苯本笨崩绷甭泵蹦迸逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛鞭边编贬扁便变卞辨辩辫遍标彪膘表鳖憋别瘪彬斌濒滨宾摈兵冰柄丙秉饼炳"],["b240","睝睞睟睠睤睧睩睪睭",11,"睺睻睼瞁瞂瞃瞆",5,"瞏瞐瞓",11,"瞡瞣瞤瞦瞨瞫瞭瞮瞯瞱瞲瞴瞶",4],["b280","瞼瞾矀",12,"矎",8,"矘矙矚矝",4,"矤病并玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳捕卜哺补埠不布步簿部怖擦猜裁材才财睬踩采彩菜蔡餐参蚕残惭惨灿苍舱仓沧藏操糙槽曹草厕策侧册测层蹭插叉茬茶查碴搽察岔差诧拆柴豺搀掺蝉馋谗缠铲产阐颤昌猖"],["b340","矦矨矪矯矰矱矲矴矵矷矹矺矻矼砃",5,"砊砋砎砏砐砓砕砙砛砞砠砡砢砤砨砪砫砮砯砱砲砳砵砶砽砿硁硂硃硄硆硈硉硊硋硍硏硑硓硔硘硙硚"],["b380","硛硜硞",11,"硯",7,"硸硹硺硻硽",6,"场尝常长偿肠厂敞畅唱倡超抄钞朝嘲潮巢吵炒车扯撤掣彻澈郴臣辰尘晨忱沉陈趁衬撑称城橙成呈乘程惩澄诚承逞骋秤吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽充冲虫崇宠抽酬畴踌稠愁筹仇绸瞅丑臭初出橱厨躇锄雏滁除楚"],["b440","碄碅碆碈碊碋碏碐碒碔碕碖碙碝碞碠碢碤碦碨",7,"碵碶碷碸確碻碼碽碿磀磂磃磄磆磇磈磌磍磎磏磑磒磓磖磗磘磚",9],["b480","磤磥磦磧磩磪磫磭",4,"磳磵磶磸磹磻",5,"礂礃礄礆",6,"础储矗搐触处揣川穿椽传船喘串疮窗幢床闯创吹炊捶锤垂春椿醇唇淳纯蠢戳绰疵茨磁雌辞慈瓷词此刺赐次聪葱囱匆从丛凑粗醋簇促蹿篡窜摧崔催脆瘁粹淬翠村存寸磋撮搓措挫错搭达答瘩打大呆歹傣戴带殆代贷袋待逮"],["b540","礍",5,"礔",9,"礟",4,"礥",14,"礵",4,"礽礿祂祃祄祅祇祊",8,"祔祕祘祙祡祣"],["b580","祤祦祩祪祫祬祮祰",6,"祹祻",4,"禂禃禆禇禈禉禋禌禍禎禐禑禒怠耽担丹单郸掸胆旦氮但惮淡诞弹蛋当挡党荡档刀捣蹈倒岛祷导到稻悼道盗德得的蹬灯登等瞪凳邓堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔颠掂滇碘点典靛垫电佃甸店惦奠淀殿碉叼雕凋刁掉吊钓调跌爹碟蝶迭谍叠"],["b640","禓",6,"禛",11,"禨",10,"禴",4,"禼禿秂秄秅秇秈秊秌秎秏秐秓秔秖秗秙",5,"秠秡秢秥秨秪"],["b680","秬秮秱",6,"秹秺秼秾秿稁稄稅稇稈稉稊稌稏",4,"稕稖稘稙稛稜丁盯叮钉顶鼎锭定订丢东冬董懂动栋侗恫冻洞兜抖斗陡豆逗痘都督毒犊独读堵睹赌杜镀肚度渡妒端短锻段断缎堆兑队对墩吨蹲敦顿囤钝盾遁掇哆多夺垛躲朵跺舵剁惰堕蛾峨鹅俄额讹娥恶厄扼遏鄂饿恩而儿耳尔饵洱二"],["b740","稝稟稡稢稤",14,"稴稵稶稸稺稾穀",5,"穇",9,"穒",4,"穘",16],["b780","穩",6,"穱穲穳穵穻穼穽穾窂窅窇窉窊窋窌窎窏窐窓窔窙窚窛窞窡窢贰发罚筏伐乏阀法珐藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛坊芳方肪房防妨仿访纺放菲非啡飞肥匪诽吠肺废沸费芬酚吩氛分纷坟焚汾粉奋份忿愤粪丰封枫蜂峰锋风疯烽逢冯缝讽奉凤佛否夫敷肤孵扶拂辐幅氟符伏俘服"],["b840","窣窤窧窩窪窫窮",4,"窴",10,"竀",10,"竌",9,"竗竘竚竛竜竝竡竢竤竧",5,"竮竰竱竲竳"],["b880","竴",4,"竻竼竾笀笁笂笅笇笉笌笍笎笐笒笓笖笗笘笚笜笝笟笡笢笣笧笩笭浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐噶嘎该改概钙盖溉干甘杆柑竿肝赶感秆敢赣冈刚钢缸肛纲岗港杠篙皋高膏羔糕搞镐稿告哥歌搁戈鸽胳疙割革葛格蛤阁隔铬个各给根跟耕更庚羹"],["b940","笯笰笲笴笵笶笷笹笻笽笿",5,"筆筈筊筍筎筓筕筗筙筜筞筟筡筣",10,"筯筰筳筴筶筸筺筼筽筿箁箂箃箄箆",6,"箎箏"],["b980","箑箒箓箖箘箙箚箛箞箟箠箣箤箥箮箯箰箲箳箵箶箷箹",7,"篂篃範埂耿梗工攻功恭龚供躬公宫弓巩汞拱贡共钩勾沟苟狗垢构购够辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇刮瓜剐寡挂褂乖拐怪棺关官冠观管馆罐惯灌贯光广逛瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽辊滚棍锅郭国果裹过哈"],["ba40","篅篈築篊篋篍篎篏篐篒篔",4,"篛篜篞篟篠篢篣篤篧篨篩篫篬篭篯篰篲",4,"篸篹篺篻篽篿",7,"簈簉簊簍簎簐",5,"簗簘簙"],["ba80","簚",4,"簠",5,"簨簩簫",12,"簹",5,"籂骸孩海氦亥害骇酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉夯杭航壕嚎豪毫郝好耗号浩呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺嘿黑痕很狠恨哼亨横衡恒轰哄烘虹鸿洪宏弘红喉侯猴吼厚候后呼乎忽瑚壶葫胡蝴狐糊湖"],["bb40","籃",9,"籎",36,"籵",5,"籾",9],["bb80","粈粊",6,"粓粔粖粙粚粛粠粡粣粦粧粨粩粫粬粭粯粰粴",4,"粺粻弧虎唬护互沪户花哗华猾滑画划化话槐徊怀淮坏欢环桓还缓换患唤痪豢焕涣宦幻荒慌黄磺蝗簧皇凰惶煌晃幌恍谎灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘荤昏婚魂浑混豁活伙火获或惑霍货祸击圾基机畸稽积箕"],["bc40","粿糀糂糃糄糆糉糋糎",6,"糘糚糛糝糞糡",6,"糩",5,"糰",7,"糹糺糼",13,"紋",5],["bc80","紑",14,"紡紣紤紥紦紨紩紪紬紭紮細",6,"肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件"],["bd40","紷",54,"絯",7],["bd80","絸",32,"健舰剑饯渐溅涧建僵姜将浆江疆蒋桨奖讲匠酱降蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸"],["be40","継",12,"綧",6,"綯",42],["be80","線",32,"尽劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净炯窘揪究纠玖韭久灸九酒厩救旧臼舅咎就疚鞠拘狙疽居驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧捐鹃娟倦眷卷绢撅攫抉掘倔爵觉决诀绝均菌钧军君峻"],["bf40","緻",62],["bf80","縺縼",4,"繂",4,"繈",21,"俊竣浚郡骏喀咖卡咯开揩楷凯慨刊堪勘坎砍看康慷糠扛抗亢炕考拷烤靠坷苛柯棵磕颗科壳咳可渴克刻客课肯啃垦恳坑吭空恐孔控抠口扣寇枯哭窟苦酷库裤夸垮挎跨胯块筷侩快宽款匡筐狂框矿眶旷况亏盔岿窥葵奎魁傀"],["c040","繞",35,"纃",23,"纜纝纞"],["c080","纮纴纻纼绖绤绬绹缊缐缞缷缹缻",6,"罃罆",9,"罒罓馈愧溃坤昆捆困括扩廓阔垃拉喇蜡腊辣啦莱来赖蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥琅榔狼廊郎朗浪捞劳牢老佬姥酪烙涝勒乐雷镭蕾磊累儡垒擂肋类泪棱楞冷厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐"],["c140","罖罙罛罜罝罞罠罣",4,"罫罬罭罯罰罳罵罶罷罸罺罻罼罽罿羀羂",7,"羋羍羏",4,"羕",4,"羛羜羠羢羣羥羦羨",6,"羱"],["c180","羳",4,"羺羻羾翀翂翃翄翆翇翈翉翋翍翏",4,"翖翗翙",5,"翢翣痢立粒沥隶力璃哩俩联莲连镰廉怜涟帘敛脸链恋炼练粮凉梁粱良两辆量晾亮谅撩聊僚疗燎寥辽潦了撂镣廖料列裂烈劣猎琳林磷霖临邻鳞淋凛赁吝拎玲菱零龄铃伶羚凌灵陵岭领另令溜琉榴硫馏留刘瘤流柳六龙聋咙笼窿"],["c240","翤翧翨翪翫翬翭翯翲翴",6,"翽翾翿耂耇耈耉耊耎耏耑耓耚耛耝耞耟耡耣耤耫",5,"耲耴耹耺耼耾聀聁聄聅聇聈聉聎聏聐聑聓聕聖聗"],["c280","聙聛",13,"聫",5,"聲",11,"隆垄拢陇楼娄搂篓漏陋芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮驴吕铝侣旅履屡缕虑氯律率滤绿峦挛孪滦卵乱掠略抡轮伦仑沦纶论萝螺罗逻锣箩骡裸落洛骆络妈麻玛码蚂马骂嘛吗埋买麦卖迈脉瞒馒蛮满蔓曼慢漫"],["c340","聾肁肂肅肈肊肍",5,"肔肕肗肙肞肣肦肧肨肬肰肳肵肶肸肹肻胅胇",4,"胏",6,"胘胟胠胢胣胦胮胵胷胹胻胾胿脀脁脃脄脅脇脈脋"],["c380","脌脕脗脙脛脜脝脟",12,"脭脮脰脳脴脵脷脹",4,"脿谩芒茫盲氓忙莽猫茅锚毛矛铆卯茂冒帽貌贸么玫枚梅酶霉煤没眉媒镁每美昧寐妹媚门闷们萌蒙檬盟锰猛梦孟眯醚靡糜迷谜弥米秘觅泌蜜密幂棉眠绵冕免勉娩缅面苗描瞄藐秒渺庙妙蔑灭民抿皿敏悯闽明螟鸣铭名命谬摸"],["c440","腀",5,"腇腉腍腎腏腒腖腗腘腛",4,"腡腢腣腤腦腨腪腫腬腯腲腳腵腶腷腸膁膃",4,"膉膋膌膍膎膐膒",5,"膙膚膞",4,"膤膥"],["c480","膧膩膫",7,"膴",5,"膼膽膾膿臄臅臇臈臉臋臍",6,"摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谋牟某拇牡亩姆母墓暮幕募慕木目睦牧穆拿哪呐钠那娜纳氖乃奶耐奈南男难囊挠脑恼闹淖呢馁内嫩能妮霓倪泥尼拟你匿腻逆溺蔫拈年碾撵捻念娘酿鸟尿捏聂孽啮镊镍涅您柠狞凝宁"],["c540","臔",14,"臤臥臦臨臩臫臮",4,"臵",5,"臽臿舃與",4,"舎舏舑舓舕",5,"舝舠舤舥舦舧舩舮舲舺舼舽舿"],["c580","艀艁艂艃艅艆艈艊艌艍艎艐",7,"艙艛艜艝艞艠",7,"艩拧泞牛扭钮纽脓浓农弄奴努怒女暖虐疟挪懦糯诺哦欧鸥殴藕呕偶沤啪趴爬帕怕琶拍排牌徘湃派攀潘盘磐盼畔判叛乓庞旁耪胖抛咆刨炮袍跑泡呸胚培裴赔陪配佩沛喷盆砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯砒霹批披劈琵毗"],["c640","艪艫艬艭艱艵艶艷艸艻艼芀芁芃芅芆芇芉芌芐芓芔芕芖芚芛芞芠芢芣芧芲芵芶芺芻芼芿苀苂苃苅苆苉苐苖苙苚苝苢苧苨苩苪苬苭苮苰苲苳苵苶苸"],["c680","苺苼",4,"茊茋茍茐茒茓茖茘茙茝",9,"茩茪茮茰茲茷茻茽啤脾疲皮匹痞僻屁譬篇偏片骗飘漂瓢票撇瞥拼频贫品聘乒坪苹萍平凭瓶评屏坡泼颇婆破魄迫粕剖扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫掐"],["c740","茾茿荁荂荄荅荈荊",4,"荓荕",4,"荝荢荰",6,"荹荺荾",6,"莇莈莊莋莌莍莏莐莑莔莕莖莗莙莚莝莟莡",6,"莬莭莮"],["c780","莯莵莻莾莿菂菃菄菆菈菉菋菍菎菐菑菒菓菕菗菙菚菛菞菢菣菤菦菧菨菫菬菭恰洽牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉枪呛腔羌墙蔷强抢橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍切茄且怯窃钦侵亲秦琴勤芹擒禽寝沁青轻氢倾卿清擎晴氰情顷请庆琼穷秋丘邱球求囚酋泅趋区蛆曲躯屈驱渠"],["c840","菮華菳",4,"菺菻菼菾菿萀萂萅萇萈萉萊萐萒",5,"萙萚萛萞",5,"萩",7,"萲",5,"萹萺萻萾",7,"葇葈葉"],["c880","葊",6,"葒",4,"葘葝葞葟葠葢葤",4,"葪葮葯葰葲葴葷葹葻葼取娶龋趣去圈颧权醛泉全痊拳犬券劝缺炔瘸却鹊榷确雀裙群然燃冉染瓤壤攘嚷让饶扰绕惹热壬仁人忍韧任认刃妊纫扔仍日戎茸蓉荣融熔溶容绒冗揉柔肉茹蠕儒孺如辱乳汝入褥软阮蕊瑞锐闰润若弱撒洒萨腮鳃塞赛三叁"],["c940","葽",4,"蒃蒄蒅蒆蒊蒍蒏",7,"蒘蒚蒛蒝蒞蒟蒠蒢",12,"蒰蒱蒳蒵蒶蒷蒻蒼蒾蓀蓂蓃蓅蓆蓇蓈蓋蓌蓎蓏蓒蓔蓕蓗"],["c980","蓘",4,"蓞蓡蓢蓤蓧",4,"蓭蓮蓯蓱",10,"蓽蓾蔀蔁蔂伞散桑嗓丧搔骚扫嫂瑟色涩森僧莎砂杀刹沙纱傻啥煞筛晒珊苫杉山删煽衫闪陕擅赡膳善汕扇缮墒伤商赏晌上尚裳梢捎稍烧芍勺韶少哨邵绍奢赊蛇舌舍赦摄射慑涉社设砷申呻伸身深娠绅神沈审婶甚肾慎渗声生甥牲升绳"],["ca40","蔃",8,"蔍蔎蔏蔐蔒蔔蔕蔖蔘蔙蔛蔜蔝蔞蔠蔢",8,"蔭",9,"蔾",4,"蕄蕅蕆蕇蕋",10],["ca80","蕗蕘蕚蕛蕜蕝蕟",4,"蕥蕦蕧蕩",8,"蕳蕵蕶蕷蕸蕼蕽蕿薀薁省盛剩胜圣师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试收手首守寿授售受瘦兽蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱"],["cb40","薂薃薆薈",6,"薐",10,"薝",6,"薥薦薧薩薫薬薭薱",5,"薸薺",6,"藂",6,"藊",4,"藑藒"],["cb80","藔藖",5,"藝",6,"藥藦藧藨藪",14,"恕刷耍摔衰甩帅栓拴霜双爽谁水睡税吮瞬顺舜说硕朔烁斯撕嘶思私司丝死肆寺嗣四伺似饲巳松耸怂颂送宋讼诵搜艘擞嗽苏酥俗素速粟僳塑溯宿诉肃酸蒜算虽隋随绥髓碎岁穗遂隧祟孙损笋蓑梭唆缩琐索锁所塌他它她塔"],["cc40","藹藺藼藽藾蘀",4,"蘆",10,"蘒蘓蘔蘕蘗",15,"蘨蘪",13,"蘹蘺蘻蘽蘾蘿虀"],["cc80","虁",11,"虒虓處",4,"虛虜虝號虠虡虣",7,"獭挞蹋踏胎苔抬台泰酞太态汰坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭汤塘搪堂棠膛唐糖倘躺淌趟烫掏涛滔绦萄桃逃淘陶讨套特藤腾疼誊梯剔踢锑提题蹄啼体替嚏惕涕剃屉天添填田甜恬舔腆挑条迢眺跳贴铁帖厅听烃"],["cd40","虭虯虰虲",6,"蚃",6,"蚎",4,"蚔蚖",5,"蚞",4,"蚥蚦蚫蚭蚮蚲蚳蚷蚸蚹蚻",4,"蛁蛂蛃蛅蛈蛌蛍蛒蛓蛕蛖蛗蛚蛜"],["cd80","蛝蛠蛡蛢蛣蛥蛦蛧蛨蛪蛫蛬蛯蛵蛶蛷蛺蛻蛼蛽蛿蜁蜄蜅蜆蜋蜌蜎蜏蜐蜑蜔蜖汀廷停亭庭挺艇通桐酮瞳同铜彤童桶捅筒统痛偷投头透凸秃突图徒途涂屠土吐兔湍团推颓腿蜕褪退吞屯臀拖托脱鸵陀驮驼椭妥拓唾挖哇蛙洼娃瓦袜歪外豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕汪王亡枉网往旺望忘妄威"],["ce40","蜙蜛蜝蜟蜠蜤蜦蜧蜨蜪蜫蜬蜭蜯蜰蜲蜳蜵蜶蜸蜹蜺蜼蜽蝀",6,"蝊蝋蝍蝏蝐蝑蝒蝔蝕蝖蝘蝚",5,"蝡蝢蝦",7,"蝯蝱蝲蝳蝵"],["ce80","蝷蝸蝹蝺蝿螀螁螄螆螇螉螊螌螎",4,"螔螕螖螘",6,"螠",4,"巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫瘟温蚊文闻纹吻稳紊问嗡翁瓮挝蜗涡窝我斡卧握沃巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误昔熙析西硒矽晰嘻吸锡牺"],["cf40","螥螦螧螩螪螮螰螱螲螴螶螷螸螹螻螼螾螿蟁",4,"蟇蟈蟉蟌",4,"蟔",6,"蟜蟝蟞蟟蟡蟢蟣蟤蟦蟧蟨蟩蟫蟬蟭蟯",9],["cf80","蟺蟻蟼蟽蟿蠀蠁蠂蠄",5,"蠋",7,"蠔蠗蠘蠙蠚蠜",4,"蠣稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细瞎虾匣霞辖暇峡侠狭下厦夏吓掀锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象萧硝霄削哮嚣销消宵淆晓"],["d040","蠤",13,"蠳",5,"蠺蠻蠽蠾蠿衁衂衃衆",5,"衎",5,"衕衖衘衚",6,"衦衧衪衭衯衱衳衴衵衶衸衹衺"],["d080","衻衼袀袃袆袇袉袊袌袎袏袐袑袓袔袕袗",4,"袝",4,"袣袥",5,"小孝校肖啸笑效楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑薪芯锌欣辛新忻心信衅星腥猩惺兴刑型形邢行醒幸杏性姓兄凶胸匈汹雄熊休修羞朽嗅锈秀袖绣墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续轩喧宣悬旋玄"],["d140","袬袮袯袰袲",4,"袸袹袺袻袽袾袿裀裃裄裇裈裊裋裌裍裏裐裑裓裖裗裚",4,"裠裡裦裧裩",6,"裲裵裶裷裺裻製裿褀褁褃",5],["d180","褉褋",4,"褑褔",4,"褜",4,"褢褣褤褦褧褨褩褬褭褮褯褱褲褳褵褷选癣眩绚靴薛学穴雪血勋熏循旬询寻驯巡殉汛训讯逊迅压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾邀腰妖瑶"],["d240","褸",8,"襂襃襅",24,"襠",5,"襧",19,"襼"],["d280","襽襾覀覂覄覅覇",26,"摇尧遥窑谣姚咬舀药要耀椰噎耶爷野冶也页掖业叶曳腋夜液一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎茵荫因殷音阴姻吟银淫寅饮尹引隐"],["d340","覢",30,"觃觍觓觔觕觗觘觙觛觝觟觠觡觢觤觧觨觩觪觬觭觮觰觱觲觴",6],["d380","觻",4,"訁",5,"計",21,"印英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映哟拥佣臃痈庸雍踊蛹咏泳涌永恿勇用幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉"],["d440","訞",31,"訿",8,"詉",21],["d480","詟",25,"詺",6,"浴寓裕预豫驭鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院曰约越跃钥岳粤月悦阅耘云郧匀陨允运蕴酝晕韵孕匝砸杂栽哉灾宰载再在咱攒暂赞赃脏葬遭糟凿藻枣早澡蚤躁噪造皂灶燥责择则泽贼怎增憎曾赠扎喳渣札轧"],["d540","誁",7,"誋",7,"誔",46],["d580","諃",32,"铡闸眨栅榨咋乍炸诈摘斋宅窄债寨瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽樟章彰漳张掌涨杖丈帐账仗胀瘴障招昭找沼赵照罩兆肇召遮折哲蛰辙者锗蔗这浙珍斟真甄砧臻贞针侦枕疹诊震振镇阵蒸挣睁征狰争怔整拯正政"],["d640","諤",34,"謈",27],["d680","謤謥謧",30,"帧症郑证芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒中盅忠钟衷终种肿重仲众舟周州洲诌粥轴肘帚咒皱宙昼骤珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑"],["d740","譆",31,"譧",4,"譭",25],["d780","讇",24,"讬讱讻诇诐诪谉谞住注祝驻抓爪拽专砖转撰赚篆桩庄装妆撞壮状椎锥追赘坠缀谆准捉拙卓桌琢茁酌啄着灼浊兹咨资姿滋淄孜紫仔籽滓子自渍字鬃棕踪宗综总纵邹走奏揍租足卒族祖诅阻组钻纂嘴醉最罪尊遵昨左佐柞做作坐座"],["d840","谸",8,"豂豃豄豅豈豊豋豍",7,"豖豗豘豙豛",5,"豣",6,"豬",6,"豴豵豶豷豻",6,"貃貄貆貇"],["d880","貈貋貍",6,"貕貖貗貙",20,"亍丌兀丐廿卅丕亘丞鬲孬噩丨禺丿匕乇夭爻卮氐囟胤馗毓睾鼗丶亟鼐乜乩亓芈孛啬嘏仄厍厝厣厥厮靥赝匚叵匦匮匾赜卦卣刂刈刎刭刳刿剀剌剞剡剜蒯剽劂劁劐劓冂罔亻仃仉仂仨仡仫仞伛仳伢佤仵伥伧伉伫佞佧攸佚佝"],["d940","貮",62],["d980","賭",32,"佟佗伲伽佶佴侑侉侃侏佾佻侪佼侬侔俦俨俪俅俚俣俜俑俟俸倩偌俳倬倏倮倭俾倜倌倥倨偾偃偕偈偎偬偻傥傧傩傺僖儆僭僬僦僮儇儋仝氽佘佥俎龠汆籴兮巽黉馘冁夔勹匍訇匐凫夙兕亠兖亳衮袤亵脔裒禀嬴蠃羸冫冱冽冼"],["da40","贎",14,"贠赑赒赗赟赥赨赩赪赬赮赯赱赲赸",8,"趂趃趆趇趈趉趌",4,"趒趓趕",9,"趠趡"],["da80","趢趤",12,"趲趶趷趹趻趽跀跁跂跅跇跈跉跊跍跐跒跓跔凇冖冢冥讠讦讧讪讴讵讷诂诃诋诏诎诒诓诔诖诘诙诜诟诠诤诨诩诮诰诳诶诹诼诿谀谂谄谇谌谏谑谒谔谕谖谙谛谘谝谟谠谡谥谧谪谫谮谯谲谳谵谶卩卺阝阢阡阱阪阽阼陂陉陔陟陧陬陲陴隈隍隗隰邗邛邝邙邬邡邴邳邶邺"],["db40","跕跘跙跜跠跡跢跥跦跧跩跭跮跰跱跲跴跶跼跾",6,"踆踇踈踋踍踎踐踑踒踓踕",7,"踠踡踤",4,"踫踭踰踲踳踴踶踷踸踻踼踾"],["db80","踿蹃蹅蹆蹌",4,"蹓",5,"蹚",11,"蹧蹨蹪蹫蹮蹱邸邰郏郅邾郐郄郇郓郦郢郜郗郛郫郯郾鄄鄢鄞鄣鄱鄯鄹酃酆刍奂劢劬劭劾哿勐勖勰叟燮矍廴凵凼鬯厶弁畚巯坌垩垡塾墼壅壑圩圬圪圳圹圮圯坜圻坂坩垅坫垆坼坻坨坭坶坳垭垤垌垲埏垧垴垓垠埕埘埚埙埒垸埴埯埸埤埝"],["dc40","蹳蹵蹷",4,"蹽蹾躀躂躃躄躆躈",6,"躑躒躓躕",6,"躝躟",11,"躭躮躰躱躳",6,"躻",7],["dc80","軃",10,"軏",21,"堋堍埽埭堀堞堙塄堠塥塬墁墉墚墀馨鼙懿艹艽艿芏芊芨芄芎芑芗芙芫芸芾芰苈苊苣芘芷芮苋苌苁芩芴芡芪芟苄苎芤苡茉苷苤茏茇苜苴苒苘茌苻苓茑茚茆茔茕苠苕茜荑荛荜茈莒茼茴茱莛荞茯荏荇荃荟荀茗荠茭茺茳荦荥"],["dd40","軥",62],["dd80","輤",32,"荨茛荩荬荪荭荮莰荸莳莴莠莪莓莜莅荼莶莩荽莸荻莘莞莨莺莼菁萁菥菘堇萘萋菝菽菖萜萸萑萆菔菟萏萃菸菹菪菅菀萦菰菡葜葑葚葙葳蒇蒈葺蒉葸萼葆葩葶蒌蒎萱葭蓁蓍蓐蓦蒽蓓蓊蒿蒺蓠蒡蒹蒴蒗蓥蓣蔌甍蔸蓰蔹蔟蔺"],["de40","轅",32,"轪辀辌辒辝辠辡辢辤辥辦辧辪辬辭辮辯農辳辴辵辷辸辺辻込辿迀迃迆"],["de80","迉",4,"迏迒迖迗迚迠迡迣迧迬迯迱迲迴迵迶迺迻迼迾迿逇逈逌逎逓逕逘蕖蔻蓿蓼蕙蕈蕨蕤蕞蕺瞢蕃蕲蕻薤薨薇薏蕹薮薜薅薹薷薰藓藁藜藿蘧蘅蘩蘖蘼廾弈夼奁耷奕奚奘匏尢尥尬尴扌扪抟抻拊拚拗拮挢拶挹捋捃掭揶捱捺掎掴捭掬掊捩掮掼揲揸揠揿揄揞揎摒揆掾摅摁搋搛搠搌搦搡摞撄摭撖"],["df40","這逜連逤逥逧",5,"逰",4,"逷逹逺逽逿遀遃遅遆遈",4,"過達違遖遙遚遜",5,"遤遦遧適遪遫遬遯",4,"遶",6,"遾邁"],["df80","還邅邆邇邉邊邌",4,"邒邔邖邘邚邜邞邟邠邤邥邧邨邩邫邭邲邷邼邽邿郀摺撷撸撙撺擀擐擗擤擢攉攥攮弋忒甙弑卟叱叽叩叨叻吒吖吆呋呒呓呔呖呃吡呗呙吣吲咂咔呷呱呤咚咛咄呶呦咝哐咭哂咴哒咧咦哓哔呲咣哕咻咿哌哙哚哜咩咪咤哝哏哞唛哧唠哽唔哳唢唣唏唑唧唪啧喏喵啉啭啁啕唿啐唼"],["e040","郂郃郆郈郉郋郌郍郒郔郕郖郘郙郚郞郟郠郣郤郥郩郪郬郮郰郱郲郳郵郶郷郹郺郻郼郿鄀鄁鄃鄅",19,"鄚鄛鄜"],["e080","鄝鄟鄠鄡鄤",10,"鄰鄲",6,"鄺",8,"酄唷啖啵啶啷唳唰啜喋嗒喃喱喹喈喁喟啾嗖喑啻嗟喽喾喔喙嗪嗷嗉嘟嗑嗫嗬嗔嗦嗝嗄嗯嗥嗲嗳嗌嗍嗨嗵嗤辔嘞嘈嘌嘁嘤嘣嗾嘀嘧嘭噘嘹噗嘬噍噢噙噜噌噔嚆噤噱噫噻噼嚅嚓嚯囔囗囝囡囵囫囹囿圄圊圉圜帏帙帔帑帱帻帼"],["e140","酅酇酈酑酓酔酕酖酘酙酛酜酟酠酦酧酨酫酭酳酺酻酼醀",4,"醆醈醊醎醏醓",6,"醜",5,"醤",5,"醫醬醰醱醲醳醶醷醸醹醻"],["e180","醼",10,"釈釋釐釒",9,"針",8,"帷幄幔幛幞幡岌屺岍岐岖岈岘岙岑岚岜岵岢岽岬岫岱岣峁岷峄峒峤峋峥崂崃崧崦崮崤崞崆崛嵘崾崴崽嵬嵛嵯嵝嵫嵋嵊嵩嵴嶂嶙嶝豳嶷巅彳彷徂徇徉後徕徙徜徨徭徵徼衢彡犭犰犴犷犸狃狁狎狍狒狨狯狩狲狴狷猁狳猃狺"],["e240","釦",62],["e280","鈥",32,"狻猗猓猡猊猞猝猕猢猹猥猬猸猱獐獍獗獠獬獯獾舛夥飧夤夂饣饧",5,"饴饷饽馀馄馇馊馍馐馑馓馔馕庀庑庋庖庥庠庹庵庾庳赓廒廑廛廨廪膺忄忉忖忏怃忮怄忡忤忾怅怆忪忭忸怙怵怦怛怏怍怩怫怊怿怡恸恹恻恺恂"],["e340","鉆",45,"鉵",16],["e380","銆",7,"銏",24,"恪恽悖悚悭悝悃悒悌悛惬悻悱惝惘惆惚悴愠愦愕愣惴愀愎愫慊慵憬憔憧憷懔懵忝隳闩闫闱闳闵闶闼闾阃阄阆阈阊阋阌阍阏阒阕阖阗阙阚丬爿戕氵汔汜汊沣沅沐沔沌汨汩汴汶沆沩泐泔沭泷泸泱泗沲泠泖泺泫泮沱泓泯泾"],["e440","銨",5,"銯",24,"鋉",31],["e480","鋩",32,"洹洧洌浃浈洇洄洙洎洫浍洮洵洚浏浒浔洳涑浯涞涠浞涓涔浜浠浼浣渚淇淅淞渎涿淠渑淦淝淙渖涫渌涮渫湮湎湫溲湟溆湓湔渲渥湄滟溱溘滠漭滢溥溧溽溻溷滗溴滏溏滂溟潢潆潇漤漕滹漯漶潋潴漪漉漩澉澍澌潸潲潼潺濑"],["e540","錊",51,"錿",10],["e580","鍊",31,"鍫濉澧澹澶濂濡濮濞濠濯瀚瀣瀛瀹瀵灏灞宀宄宕宓宥宸甯骞搴寤寮褰寰蹇謇辶迓迕迥迮迤迩迦迳迨逅逄逋逦逑逍逖逡逵逶逭逯遄遑遒遐遨遘遢遛暹遴遽邂邈邃邋彐彗彖彘尻咫屐屙孱屣屦羼弪弩弭艴弼鬻屮妁妃妍妩妪妣"],["e640","鍬",34,"鎐",27],["e680","鎬",29,"鏋鏌鏍妗姊妫妞妤姒妲妯姗妾娅娆姝娈姣姘姹娌娉娲娴娑娣娓婀婧婊婕娼婢婵胬媪媛婷婺媾嫫媲嫒嫔媸嫠嫣嫱嫖嫦嫘嫜嬉嬗嬖嬲嬷孀尕尜孚孥孳孑孓孢驵驷驸驺驿驽骀骁骅骈骊骐骒骓骖骘骛骜骝骟骠骢骣骥骧纟纡纣纥纨纩"],["e740","鏎",7,"鏗",54],["e780","鐎",32,"纭纰纾绀绁绂绉绋绌绐绔绗绛绠绡绨绫绮绯绱绲缍绶绺绻绾缁缂缃缇缈缋缌缏缑缒缗缙缜缛缟缡",6,"缪缫缬缭缯",4,"缵幺畿巛甾邕玎玑玮玢玟珏珂珑玷玳珀珉珈珥珙顼琊珩珧珞玺珲琏琪瑛琦琥琨琰琮琬"],["e840","鐯",14,"鐿",43,"鑬鑭鑮鑯"],["e880","鑰",20,"钑钖钘铇铏铓铔铚铦铻锜锠琛琚瑁瑜瑗瑕瑙瑷瑭瑾璜璎璀璁璇璋璞璨璩璐璧瓒璺韪韫韬杌杓杞杈杩枥枇杪杳枘枧杵枨枞枭枋杷杼柰栉柘栊柩枰栌柙枵柚枳柝栀柃枸柢栎柁柽栲栳桠桡桎桢桄桤梃栝桕桦桁桧桀栾桊桉栩梵梏桴桷梓桫棂楮棼椟椠棹"],["e940","锧锳锽镃镈镋镕镚镠镮镴镵長",7,"門",42],["e980","閫",32,"椤棰椋椁楗棣椐楱椹楠楂楝榄楫榀榘楸椴槌榇榈槎榉楦楣楹榛榧榻榫榭槔榱槁槊槟榕槠榍槿樯槭樗樘橥槲橄樾檠橐橛樵檎橹樽樨橘橼檑檐檩檗檫猷獒殁殂殇殄殒殓殍殚殛殡殪轫轭轱轲轳轵轶轸轷轹轺轼轾辁辂辄辇辋"],["ea40","闌",27,"闬闿阇阓阘阛阞阠阣",6,"阫阬阭阯阰阷阸阹阺阾陁陃陊陎陏陑陒陓陖陗"],["ea80","陘陙陚陜陝陞陠陣陥陦陫陭",4,"陳陸",12,"隇隉隊辍辎辏辘辚軎戋戗戛戟戢戡戥戤戬臧瓯瓴瓿甏甑甓攴旮旯旰昊昙杲昃昕昀炅曷昝昴昱昶昵耆晟晔晁晏晖晡晗晷暄暌暧暝暾曛曜曦曩贲贳贶贻贽赀赅赆赈赉赇赍赕赙觇觊觋觌觎觏觐觑牮犟牝牦牯牾牿犄犋犍犏犒挈挲掰"],["eb40","隌階隑隒隓隕隖隚際隝",9,"隨",7,"隱隲隴隵隷隸隺隻隿雂雃雈雊雋雐雑雓雔雖",9,"雡",6,"雫"],["eb80","雬雭雮雰雱雲雴雵雸雺電雼雽雿霂霃霅霊霋霌霐霑霒霔霕霗",4,"霝霟霠搿擘耄毪毳毽毵毹氅氇氆氍氕氘氙氚氡氩氤氪氲攵敕敫牍牒牖爰虢刖肟肜肓肼朊肽肱肫肭肴肷胧胨胩胪胛胂胄胙胍胗朐胝胫胱胴胭脍脎胲胼朕脒豚脶脞脬脘脲腈腌腓腴腙腚腱腠腩腼腽腭腧塍媵膈膂膑滕膣膪臌朦臊膻"],["ec40","霡",8,"霫霬霮霯霱霳",4,"霺霻霼霽霿",18,"靔靕靗靘靚靜靝靟靣靤靦靧靨靪",7],["ec80","靲靵靷",4,"靽",7,"鞆",4,"鞌鞎鞏鞐鞓鞕鞖鞗鞙",4,"臁膦欤欷欹歃歆歙飑飒飓飕飙飚殳彀毂觳斐齑斓於旆旄旃旌旎旒旖炀炜炖炝炻烀炷炫炱烨烊焐焓焖焯焱煳煜煨煅煲煊煸煺熘熳熵熨熠燠燔燧燹爝爨灬焘煦熹戾戽扃扈扉礻祀祆祉祛祜祓祚祢祗祠祯祧祺禅禊禚禧禳忑忐"],["ed40","鞞鞟鞡鞢鞤",6,"鞬鞮鞰鞱鞳鞵",46],["ed80","韤韥韨韮",4,"韴韷",23,"怼恝恚恧恁恙恣悫愆愍慝憩憝懋懑戆肀聿沓泶淼矶矸砀砉砗砘砑斫砭砜砝砹砺砻砟砼砥砬砣砩硎硭硖硗砦硐硇硌硪碛碓碚碇碜碡碣碲碹碥磔磙磉磬磲礅磴礓礤礞礴龛黹黻黼盱眄眍盹眇眈眚眢眙眭眦眵眸睐睑睇睃睚睨"],["ee40","頏",62],["ee80","顎",32,"睢睥睿瞍睽瞀瞌瞑瞟瞠瞰瞵瞽町畀畎畋畈畛畲畹疃罘罡罟詈罨罴罱罹羁罾盍盥蠲钅钆钇钋钊钌钍钏钐钔钗钕钚钛钜钣钤钫钪钭钬钯钰钲钴钶",4,"钼钽钿铄铈",6,"铐铑铒铕铖铗铙铘铛铞铟铠铢铤铥铧铨铪"],["ef40","顯",5,"颋颎颒颕颙颣風",37,"飏飐飔飖飗飛飜飝飠",4],["ef80","飥飦飩",30,"铩铫铮铯铳铴铵铷铹铼铽铿锃锂锆锇锉锊锍锎锏锒",4,"锘锛锝锞锟锢锪锫锩锬锱锲锴锶锷锸锼锾锿镂锵镄镅镆镉镌镎镏镒镓镔镖镗镘镙镛镞镟镝镡镢镤",8,"镯镱镲镳锺矧矬雉秕秭秣秫稆嵇稃稂稞稔"],["f040","餈",4,"餎餏餑",28,"餯",26],["f080","饊",9,"饖",12,"饤饦饳饸饹饻饾馂馃馉稹稷穑黏馥穰皈皎皓皙皤瓞瓠甬鸠鸢鸨",4,"鸲鸱鸶鸸鸷鸹鸺鸾鹁鹂鹄鹆鹇鹈鹉鹋鹌鹎鹑鹕鹗鹚鹛鹜鹞鹣鹦",6,"鹱鹭鹳疒疔疖疠疝疬疣疳疴疸痄疱疰痃痂痖痍痣痨痦痤痫痧瘃痱痼痿瘐瘀瘅瘌瘗瘊瘥瘘瘕瘙"],["f140","馌馎馚",10,"馦馧馩",47],["f180","駙",32,"瘛瘼瘢瘠癀瘭瘰瘿瘵癃瘾瘳癍癞癔癜癖癫癯翊竦穸穹窀窆窈窕窦窠窬窨窭窳衤衩衲衽衿袂袢裆袷袼裉裢裎裣裥裱褚裼裨裾裰褡褙褓褛褊褴褫褶襁襦襻疋胥皲皴矜耒耔耖耜耠耢耥耦耧耩耨耱耋耵聃聆聍聒聩聱覃顸颀颃"],["f240","駺",62],["f280","騹",32,"颉颌颍颏颔颚颛颞颟颡颢颥颦虍虔虬虮虿虺虼虻蚨蚍蚋蚬蚝蚧蚣蚪蚓蚩蚶蛄蚵蛎蚰蚺蚱蚯蛉蛏蚴蛩蛱蛲蛭蛳蛐蜓蛞蛴蛟蛘蛑蜃蜇蛸蜈蜊蜍蜉蜣蜻蜞蜥蜮蜚蜾蝈蜴蜱蜩蜷蜿螂蜢蝽蝾蝻蝠蝰蝌蝮螋蝓蝣蝼蝤蝙蝥螓螯螨蟒"],["f340","驚",17,"驲骃骉骍骎骔骕骙骦骩",6,"骲骳骴骵骹骻骽骾骿髃髄髆",4,"髍髎髏髐髒體髕髖髗髙髚髛髜"],["f380","髝髞髠髢髣髤髥髧髨髩髪髬髮髰",8,"髺髼",6,"鬄鬅鬆蟆螈螅螭螗螃螫蟥螬螵螳蟋蟓螽蟑蟀蟊蟛蟪蟠蟮蠖蠓蟾蠊蠛蠡蠹蠼缶罂罄罅舐竺竽笈笃笄笕笊笫笏筇笸笪笙笮笱笠笥笤笳笾笞筘筚筅筵筌筝筠筮筻筢筲筱箐箦箧箸箬箝箨箅箪箜箢箫箴篑篁篌篝篚篥篦篪簌篾篼簏簖簋"],["f440","鬇鬉",5,"鬐鬑鬒鬔",10,"鬠鬡鬢鬤",10,"鬰鬱鬳",7,"鬽鬾鬿魀魆魊魋魌魎魐魒魓魕",5],["f480","魛",32,"簟簪簦簸籁籀臾舁舂舄臬衄舡舢舣舭舯舨舫舸舻舳舴舾艄艉艋艏艚艟艨衾袅袈裘裟襞羝羟羧羯羰羲籼敉粑粝粜粞粢粲粼粽糁糇糌糍糈糅糗糨艮暨羿翎翕翥翡翦翩翮翳糸絷綦綮繇纛麸麴赳趄趔趑趱赧赭豇豉酊酐酎酏酤"],["f540","魼",62],["f580","鮻",32,"酢酡酰酩酯酽酾酲酴酹醌醅醐醍醑醢醣醪醭醮醯醵醴醺豕鹾趸跫踅蹙蹩趵趿趼趺跄跖跗跚跞跎跏跛跆跬跷跸跣跹跻跤踉跽踔踝踟踬踮踣踯踺蹀踹踵踽踱蹉蹁蹂蹑蹒蹊蹰蹶蹼蹯蹴躅躏躔躐躜躞豸貂貊貅貘貔斛觖觞觚觜"],["f640","鯜",62],["f680","鰛",32,"觥觫觯訾謦靓雩雳雯霆霁霈霏霎霪霭霰霾龀龃龅",5,"龌黾鼋鼍隹隼隽雎雒瞿雠銎銮鋈錾鍪鏊鎏鐾鑫鱿鲂鲅鲆鲇鲈稣鲋鲎鲐鲑鲒鲔鲕鲚鲛鲞",5,"鲥",4,"鲫鲭鲮鲰",7,"鲺鲻鲼鲽鳄鳅鳆鳇鳊鳋"],["f740","鰼",62],["f780","鱻鱽鱾鲀鲃鲄鲉鲊鲌鲏鲓鲖鲗鲘鲙鲝鲪鲬鲯鲹鲾",4,"鳈鳉鳑鳒鳚鳛鳠鳡鳌",4,"鳓鳔鳕鳗鳘鳙鳜鳝鳟鳢靼鞅鞑鞒鞔鞯鞫鞣鞲鞴骱骰骷鹘骶骺骼髁髀髅髂髋髌髑魅魃魇魉魈魍魑飨餍餮饕饔髟髡髦髯髫髻髭髹鬈鬏鬓鬟鬣麽麾縻麂麇麈麋麒鏖麝麟黛黜黝黠黟黢黩黧黥黪黯鼢鼬鼯鼹鼷鼽鼾齄"],["f840","鳣",62],["f880","鴢",32],["f940","鵃",62],["f980","鶂",32],["fa40","鶣",62],["fa80","鷢",32],["fb40","鸃",27,"鸤鸧鸮鸰鸴鸻鸼鹀鹍鹐鹒鹓鹔鹖鹙鹝鹟鹠鹡鹢鹥鹮鹯鹲鹴",9,"麀"],["fb80","麁麃麄麅麆麉麊麌",5,"麔",8,"麞麠",5,"麧麨麩麪"],["fc40","麫",8,"麵麶麷麹麺麼麿",4,"黅黆黇黈黊黋黌黐黒黓黕黖黗黙黚點黡黣黤黦黨黫黬黭黮黰",8,"黺黽黿",6],["fc80","鼆",4,"鼌鼏鼑鼒鼔鼕鼖鼘鼚",5,"鼡鼣",8,"鼭鼮鼰鼱"],["fd40","鼲",4,"鼸鼺鼼鼿",4,"齅",10,"齒",38],["fd80","齹",5,"龁龂龍",11,"龜龝龞龡",4,"郎凉秊裏隣"],["fe40","兀嗀﨎﨏﨑﨓﨔礼﨟蘒﨡﨣﨤﨧﨨﨩"]]');

/***/ }),
/* 34 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["a140","",62],["a180","",32],["a240","",62],["a280","",32],["a2ab","",5],["a2e3","€"],["a2ef",""],["a2fd",""],["a340","",62],["a380","",31,"　"],["a440","",62],["a480","",32],["a4f4","",10],["a540","",62],["a580","",32],["a5f7","",7],["a640","",62],["a680","",32],["a6b9","",7],["a6d9","",6],["a6ec",""],["a6f3",""],["a6f6","",8],["a740","",62],["a780","",32],["a7c2","",14],["a7f2","",12],["a896","",10],["a8bc","ḿ"],["a8bf","ǹ"],["a8c1",""],["a8ea","",20],["a958",""],["a95b",""],["a95d",""],["a989","〾⿰",11],["a997","",12],["a9f0","",14],["aaa1","",93],["aba1","",93],["aca1","",93],["ada1","",93],["aea1","",93],["afa1","",93],["d7fa","",4],["f8a1","",93],["f9a1","",93],["faa1","",93],["fba1","",93],["fca1","",93],["fda1","",93],["fe50","⺁⺄㑳㑇⺈⺋㖞㘚㘎⺌⺗㥮㤘㧏㧟㩳㧐㭎㱮㳠⺧⺪䁖䅟⺮䌷⺳⺶⺷䎱䎬⺻䏝䓖䙡䙌"],["fe80","䜣䜩䝼䞍⻊䥇䥺䥽䦂䦃䦅䦆䦟䦛䦷䦶䲣䲟䲠䲡䱷䲢䴓",6,"䶮",93],["8135f437",""]]');

/***/ }),
/* 35 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"uChars":[128,165,169,178,184,216,226,235,238,244,248,251,253,258,276,284,300,325,329,334,364,463,465,467,469,471,473,475,477,506,594,610,712,716,730,930,938,962,970,1026,1104,1106,8209,8215,8218,8222,8231,8241,8244,8246,8252,8365,8452,8454,8458,8471,8482,8556,8570,8596,8602,8713,8720,8722,8726,8731,8737,8740,8742,8748,8751,8760,8766,8777,8781,8787,8802,8808,8816,8854,8858,8870,8896,8979,9322,9372,9548,9588,9616,9622,9634,9652,9662,9672,9676,9680,9702,9735,9738,9793,9795,11906,11909,11913,11917,11928,11944,11947,11951,11956,11960,11964,11979,12284,12292,12312,12319,12330,12351,12436,12447,12535,12543,12586,12842,12850,12964,13200,13215,13218,13253,13263,13267,13270,13384,13428,13727,13839,13851,14617,14703,14801,14816,14964,15183,15471,15585,16471,16736,17208,17325,17330,17374,17623,17997,18018,18212,18218,18301,18318,18760,18811,18814,18820,18823,18844,18848,18872,19576,19620,19738,19887,40870,59244,59336,59367,59413,59417,59423,59431,59437,59443,59452,59460,59478,59493,63789,63866,63894,63976,63986,64016,64018,64021,64025,64034,64037,64042,65074,65093,65107,65112,65127,65132,65375,65510,65536],"gbChars":[0,36,38,45,50,81,89,95,96,100,103,104,105,109,126,133,148,172,175,179,208,306,307,308,309,310,311,312,313,341,428,443,544,545,558,741,742,749,750,805,819,820,7922,7924,7925,7927,7934,7943,7944,7945,7950,8062,8148,8149,8152,8164,8174,8236,8240,8262,8264,8374,8380,8381,8384,8388,8390,8392,8393,8394,8396,8401,8406,8416,8419,8424,8437,8439,8445,8482,8485,8496,8521,8603,8936,8946,9046,9050,9063,9066,9076,9092,9100,9108,9111,9113,9131,9162,9164,9218,9219,11329,11331,11334,11336,11346,11361,11363,11366,11370,11372,11375,11389,11682,11686,11687,11692,11694,11714,11716,11723,11725,11730,11736,11982,11989,12102,12336,12348,12350,12384,12393,12395,12397,12510,12553,12851,12962,12973,13738,13823,13919,13933,14080,14298,14585,14698,15583,15847,16318,16434,16438,16481,16729,17102,17122,17315,17320,17402,17418,17859,17909,17911,17915,17916,17936,17939,17961,18664,18703,18814,18962,19043,33469,33470,33471,33484,33485,33490,33497,33501,33505,33513,33520,33536,33550,37845,37921,37948,38029,38038,38064,38065,38066,38069,38075,38076,38078,39108,39109,39113,39114,39115,39116,39265,39394,189000]}');

/***/ }),
/* 36 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["0","\\u0000",127],["8141","갂갃갅갆갋",4,"갘갞갟갡갢갣갥",6,"갮갲갳갴"],["8161","갵갶갷갺갻갽갾갿걁",9,"걌걎",5,"걕"],["8181","걖걗걙걚걛걝",18,"걲걳걵걶걹걻",4,"겂겇겈겍겎겏겑겒겓겕",6,"겞겢",5,"겫겭겮겱",6,"겺겾겿곀곂곃곅곆곇곉곊곋곍",7,"곖곘",7,"곢곣곥곦곩곫곭곮곲곴곷",4,"곾곿괁괂괃괅괇",4,"괎괐괒괓"],["8241","괔괕괖괗괙괚괛괝괞괟괡",7,"괪괫괮",5],["8261","괶괷괹괺괻괽",6,"굆굈굊",5,"굑굒굓굕굖굗"],["8281","굙",7,"굢굤",7,"굮굯굱굲굷굸굹굺굾궀궃",4,"궊궋궍궎궏궑",10,"궞",5,"궥",17,"궸",7,"귂귃귅귆귇귉",6,"귒귔",7,"귝귞귟귡귢귣귥",18],["8341","귺귻귽귾긂",5,"긊긌긎",5,"긕",7],["8361","긝",18,"긲긳긵긶긹긻긼"],["8381","긽긾긿깂깄깇깈깉깋깏깑깒깓깕깗",4,"깞깢깣깤깦깧깪깫깭깮깯깱",6,"깺깾",5,"꺆",5,"꺍",46,"꺿껁껂껃껅",6,"껎껒",5,"껚껛껝",8],["8441","껦껧껩껪껬껮",5,"껵껶껷껹껺껻껽",8],["8461","꼆꼉꼊꼋꼌꼎꼏꼑",18],["8481","꼤",7,"꼮꼯꼱꼳꼵",6,"꼾꽀꽄꽅꽆꽇꽊",5,"꽑",10,"꽞",5,"꽦",18,"꽺",5,"꾁꾂꾃꾅꾆꾇꾉",6,"꾒꾓꾔꾖",5,"꾝",26,"꾺꾻꾽꾾"],["8541","꾿꿁",5,"꿊꿌꿏",4,"꿕",6,"꿝",4],["8561","꿢",5,"꿪",5,"꿲꿳꿵꿶꿷꿹",6,"뀂뀃"],["8581","뀅",6,"뀍뀎뀏뀑뀒뀓뀕",6,"뀞",9,"뀩",26,"끆끇끉끋끍끏끐끑끒끖끘끚끛끜끞",29,"끾끿낁낂낃낅",6,"낎낐낒",5,"낛낝낞낣낤"],["8641","낥낦낧낪낰낲낶낷낹낺낻낽",6,"냆냊",5,"냒"],["8661","냓냕냖냗냙",6,"냡냢냣냤냦",10],["8681","냱",22,"넊넍넎넏넑넔넕넖넗넚넞",4,"넦넧넩넪넫넭",6,"넶넺",5,"녂녃녅녆녇녉",6,"녒녓녖녗녙녚녛녝녞녟녡",22,"녺녻녽녾녿놁놃",4,"놊놌놎놏놐놑놕놖놗놙놚놛놝"],["8741","놞",9,"놩",15],["8761","놹",18,"뇍뇎뇏뇑뇒뇓뇕"],["8781","뇖",5,"뇞뇠",7,"뇪뇫뇭뇮뇯뇱",7,"뇺뇼뇾",5,"눆눇눉눊눍",6,"눖눘눚",5,"눡",18,"눵",6,"눽",26,"뉙뉚뉛뉝뉞뉟뉡",6,"뉪",4],["8841","뉯",4,"뉶",5,"뉽",6,"늆늇늈늊",4],["8861","늏늒늓늕늖늗늛",4,"늢늤늧늨늩늫늭늮늯늱늲늳늵늶늷"],["8881","늸",15,"닊닋닍닎닏닑닓",4,"닚닜닞닟닠닡닣닧닩닪닰닱닲닶닼닽닾댂댃댅댆댇댉",6,"댒댖",5,"댝",54,"덗덙덚덝덠덡덢덣"],["8941","덦덨덪덬덭덯덲덳덵덶덷덹",6,"뎂뎆",5,"뎍"],["8961","뎎뎏뎑뎒뎓뎕",10,"뎢",5,"뎩뎪뎫뎭"],["8981","뎮",21,"돆돇돉돊돍돏돑돒돓돖돘돚돜돞돟돡돢돣돥돦돧돩",18,"돽",18,"됑",6,"됙됚됛됝됞됟됡",6,"됪됬",7,"됵",15],["8a41","둅",10,"둒둓둕둖둗둙",6,"둢둤둦"],["8a61","둧",4,"둭",18,"뒁뒂"],["8a81","뒃",4,"뒉",19,"뒞",5,"뒥뒦뒧뒩뒪뒫뒭",7,"뒶뒸뒺",5,"듁듂듃듅듆듇듉",6,"듑듒듓듔듖",5,"듞듟듡듢듥듧",4,"듮듰듲",5,"듹",26,"딖딗딙딚딝"],["8b41","딞",5,"딦딫",4,"딲딳딵딶딷딹",6,"땂땆"],["8b61","땇땈땉땊땎땏땑땒땓땕",6,"땞땢",8],["8b81","땫",52,"떢떣떥떦떧떩떬떭떮떯떲떶",4,"떾떿뗁뗂뗃뗅",6,"뗎뗒",5,"뗙",18,"뗭",18],["8c41","똀",15,"똒똓똕똖똗똙",4],["8c61","똞",6,"똦",5,"똭",6,"똵",5],["8c81","똻",12,"뙉",26,"뙥뙦뙧뙩",50,"뚞뚟뚡뚢뚣뚥",5,"뚭뚮뚯뚰뚲",16],["8d41","뛃",16,"뛕",8],["8d61","뛞",17,"뛱뛲뛳뛵뛶뛷뛹뛺"],["8d81","뛻",4,"뜂뜃뜄뜆",33,"뜪뜫뜭뜮뜱",6,"뜺뜼",7,"띅띆띇띉띊띋띍",6,"띖",9,"띡띢띣띥띦띧띩",6,"띲띴띶",5,"띾띿랁랂랃랅",6,"랎랓랔랕랚랛랝랞"],["8e41","랟랡",6,"랪랮",5,"랶랷랹",8],["8e61","럂",4,"럈럊",19],["8e81","럞",13,"럮럯럱럲럳럵",6,"럾렂",4,"렊렋렍렎렏렑",6,"렚렜렞",5,"렦렧렩렪렫렭",6,"렶렺",5,"롁롂롃롅",11,"롒롔",7,"롞롟롡롢롣롥",6,"롮롰롲",5,"롹롺롻롽",7],["8f41","뢅",7,"뢎",17],["8f61","뢠",7,"뢩",6,"뢱뢲뢳뢵뢶뢷뢹",4],["8f81","뢾뢿룂룄룆",5,"룍룎룏룑룒룓룕",7,"룞룠룢",5,"룪룫룭룮룯룱",6,"룺룼룾",5,"뤅",18,"뤙",6,"뤡",26,"뤾뤿륁륂륃륅",6,"륍륎륐륒",5],["9041","륚륛륝륞륟륡",6,"륪륬륮",5,"륶륷륹륺륻륽"],["9061","륾",5,"릆릈릋릌릏",15],["9081","릟",12,"릮릯릱릲릳릵",6,"릾맀맂",5,"맊맋맍맓",4,"맚맜맟맠맢맦맧맩맪맫맭",6,"맶맻",4,"먂",5,"먉",11,"먖",33,"먺먻먽먾먿멁멃멄멅멆"],["9141","멇멊멌멏멐멑멒멖멗멙멚멛멝",6,"멦멪",5],["9161","멲멳멵멶멷멹",9,"몆몈몉몊몋몍",5],["9181","몓",20,"몪몭몮몯몱몳",4,"몺몼몾",5,"뫅뫆뫇뫉",14,"뫚",33,"뫽뫾뫿묁묂묃묅",7,"묎묐묒",5,"묙묚묛묝묞묟묡",6],["9241","묨묪묬",7,"묷묹묺묿",4,"뭆뭈뭊뭋뭌뭎뭑뭒"],["9261","뭓뭕뭖뭗뭙",7,"뭢뭤",7,"뭭",4],["9281","뭲",21,"뮉뮊뮋뮍뮎뮏뮑",18,"뮥뮦뮧뮩뮪뮫뮭",6,"뮵뮶뮸",7,"믁믂믃믅믆믇믉",6,"믑믒믔",35,"믺믻믽믾밁"],["9341","밃",4,"밊밎밐밒밓밙밚밠밡밢밣밦밨밪밫밬밮밯밲밳밵"],["9361","밶밷밹",6,"뱂뱆뱇뱈뱊뱋뱎뱏뱑",8],["9381","뱚뱛뱜뱞",37,"벆벇벉벊벍벏",4,"벖벘벛",4,"벢벣벥벦벩",6,"벲벶",5,"벾벿볁볂볃볅",7,"볎볒볓볔볖볗볙볚볛볝",22,"볷볹볺볻볽"],["9441","볾",5,"봆봈봊",5,"봑봒봓봕",8],["9461","봞",5,"봥",6,"봭",12],["9481","봺",5,"뵁",6,"뵊뵋뵍뵎뵏뵑",6,"뵚",9,"뵥뵦뵧뵩",22,"붂붃붅붆붋",4,"붒붔붖붗붘붛붝",6,"붥",10,"붱",6,"붹",24],["9541","뷒뷓뷖뷗뷙뷚뷛뷝",11,"뷪",5,"뷱"],["9561","뷲뷳뷵뷶뷷뷹",6,"븁븂븄븆",5,"븎븏븑븒븓"],["9581","븕",6,"븞븠",35,"빆빇빉빊빋빍빏",4,"빖빘빜빝빞빟빢빣빥빦빧빩빫",4,"빲빶",4,"빾빿뺁뺂뺃뺅",6,"뺎뺒",5,"뺚",13,"뺩",14],["9641","뺸",23,"뻒뻓"],["9661","뻕뻖뻙",6,"뻡뻢뻦",5,"뻭",8],["9681","뻶",10,"뼂",5,"뼊",13,"뼚뼞",33,"뽂뽃뽅뽆뽇뽉",6,"뽒뽓뽔뽖",44],["9741","뾃",16,"뾕",8],["9761","뾞",17,"뾱",7],["9781","뾹",11,"뿆",5,"뿎뿏뿑뿒뿓뿕",6,"뿝뿞뿠뿢",89,"쀽쀾쀿"],["9841","쁀",16,"쁒",5,"쁙쁚쁛"],["9861","쁝쁞쁟쁡",6,"쁪",15],["9881","쁺",21,"삒삓삕삖삗삙",6,"삢삤삦",5,"삮삱삲삷",4,"삾샂샃샄샆샇샊샋샍샎샏샑",6,"샚샞",5,"샦샧샩샪샫샭",6,"샶샸샺",5,"섁섂섃섅섆섇섉",6,"섑섒섓섔섖",5,"섡섢섥섨섩섪섫섮"],["9941","섲섳섴섵섷섺섻섽섾섿셁",6,"셊셎",5,"셖셗"],["9961","셙셚셛셝",6,"셦셪",5,"셱셲셳셵셶셷셹셺셻"],["9981","셼",8,"솆",5,"솏솑솒솓솕솗",4,"솞솠솢솣솤솦솧솪솫솭솮솯솱",11,"솾",5,"쇅쇆쇇쇉쇊쇋쇍",6,"쇕쇖쇙",6,"쇡쇢쇣쇥쇦쇧쇩",6,"쇲쇴",7,"쇾쇿숁숂숃숅",6,"숎숐숒",5,"숚숛숝숞숡숢숣"],["9a41","숤숥숦숧숪숬숮숰숳숵",16],["9a61","쉆쉇쉉",6,"쉒쉓쉕쉖쉗쉙",6,"쉡쉢쉣쉤쉦"],["9a81","쉧",4,"쉮쉯쉱쉲쉳쉵",6,"쉾슀슂",5,"슊",5,"슑",6,"슙슚슜슞",5,"슦슧슩슪슫슮",5,"슶슸슺",33,"싞싟싡싢싥",5,"싮싰싲싳싴싵싷싺싽싾싿쌁",6,"쌊쌋쌎쌏"],["9b41","쌐쌑쌒쌖쌗쌙쌚쌛쌝",6,"쌦쌧쌪",8],["9b61","쌳",17,"썆",7],["9b81","썎",25,"썪썫썭썮썯썱썳",4,"썺썻썾",5,"쎅쎆쎇쎉쎊쎋쎍",50,"쏁",22,"쏚"],["9c41","쏛쏝쏞쏡쏣",4,"쏪쏫쏬쏮",5,"쏶쏷쏹",5],["9c61","쏿",8,"쐉",6,"쐑",9],["9c81","쐛",8,"쐥",6,"쐭쐮쐯쐱쐲쐳쐵",6,"쐾",9,"쑉",26,"쑦쑧쑩쑪쑫쑭",6,"쑶쑷쑸쑺",5,"쒁",18,"쒕",6,"쒝",12],["9d41","쒪",13,"쒹쒺쒻쒽",8],["9d61","쓆",25],["9d81","쓠",8,"쓪",5,"쓲쓳쓵쓶쓷쓹쓻쓼쓽쓾씂",9,"씍씎씏씑씒씓씕",6,"씝",10,"씪씫씭씮씯씱",6,"씺씼씾",5,"앆앇앋앏앐앑앒앖앚앛앜앟앢앣앥앦앧앩",6,"앲앶",5,"앾앿얁얂얃얅얆얈얉얊얋얎얐얒얓얔"],["9e41","얖얙얚얛얝얞얟얡",7,"얪",9,"얶"],["9e61","얷얺얿",4,"엋엍엏엒엓엕엖엗엙",6,"엢엤엦엧"],["9e81","엨엩엪엫엯엱엲엳엵엸엹엺엻옂옃옄옉옊옋옍옎옏옑",6,"옚옝",6,"옦옧옩옪옫옯옱옲옶옸옺옼옽옾옿왂왃왅왆왇왉",6,"왒왖",5,"왞왟왡",10,"왭왮왰왲",5,"왺왻왽왾왿욁",6,"욊욌욎",5,"욖욗욙욚욛욝",6,"욦"],["9f41","욨욪",5,"욲욳욵욶욷욻",4,"웂웄웆",5,"웎"],["9f61","웏웑웒웓웕",6,"웞웟웢",5,"웪웫웭웮웯웱웲"],["9f81","웳",4,"웺웻웼웾",5,"윆윇윉윊윋윍",6,"윖윘윚",5,"윢윣윥윦윧윩",6,"윲윴윶윸윹윺윻윾윿읁읂읃읅",4,"읋읎읐읙읚읛읝읞읟읡",6,"읩읪읬",7,"읶읷읹읺읻읿잀잁잂잆잋잌잍잏잒잓잕잙잛",4,"잢잧",4,"잮잯잱잲잳잵잶잷"],["a041","잸잹잺잻잾쟂",5,"쟊쟋쟍쟏쟑",6,"쟙쟚쟛쟜"],["a061","쟞",5,"쟥쟦쟧쟩쟪쟫쟭",13],["a081","쟻",4,"젂젃젅젆젇젉젋",4,"젒젔젗",4,"젞젟젡젢젣젥",6,"젮젰젲",5,"젹젺젻젽젾젿졁",6,"졊졋졎",5,"졕",26,"졲졳졵졶졷졹졻",4,"좂좄좈좉좊좎",5,"좕",7,"좞좠좢좣좤"],["a141","좥좦좧좩",18,"좾좿죀죁"],["a161","죂죃죅죆죇죉죊죋죍",6,"죖죘죚",5,"죢죣죥"],["a181","죦",14,"죶",5,"죾죿줁줂줃줇",4,"줎　、。·‥…¨〃­―∥＼∼‘’“”〔〕〈",9,"±×÷≠≤≥∞∴°′″℃Å￠￡￥♂♀∠⊥⌒∂∇≡≒§※☆★○●◎◇◆□■△▲▽▼→←↑↓↔〓≪≫√∽∝∵∫∬∈∋⊆⊇⊂⊃∪∩∧∨￢"],["a241","줐줒",5,"줙",18],["a261","줭",6,"줵",18],["a281","쥈",7,"쥒쥓쥕쥖쥗쥙",6,"쥢쥤",7,"쥭쥮쥯⇒⇔∀∃´～ˇ˘˝˚˙¸˛¡¿ː∮∑∏¤℉‰◁◀▷▶♤♠♡♥♧♣⊙◈▣◐◑▒▤▥▨▧▦▩♨☏☎☜☞¶†‡↕↗↙↖↘♭♩♪♬㉿㈜№㏇™㏂㏘℡€®"],["a341","쥱쥲쥳쥵",6,"쥽",10,"즊즋즍즎즏"],["a361","즑",6,"즚즜즞",16],["a381","즯",16,"짂짃짅짆짉짋",4,"짒짔짗짘짛！",58,"￦］",32,"￣"],["a441","짞짟짡짣짥짦짨짩짪짫짮짲",5,"짺짻짽짾짿쨁쨂쨃쨄"],["a461","쨅쨆쨇쨊쨎",5,"쨕쨖쨗쨙",12],["a481","쨦쨧쨨쨪",28,"ㄱ",93],["a541","쩇",4,"쩎쩏쩑쩒쩓쩕",6,"쩞쩢",5,"쩩쩪"],["a561","쩫",17,"쩾",5,"쪅쪆"],["a581","쪇",16,"쪙",14,"ⅰ",9],["a5b0","Ⅰ",9],["a5c1","Α",16,"Σ",6],["a5e1","α",16,"σ",6],["a641","쪨",19,"쪾쪿쫁쫂쫃쫅"],["a661","쫆",5,"쫎쫐쫒쫔쫕쫖쫗쫚",5,"쫡",6],["a681","쫨쫩쫪쫫쫭",6,"쫵",18,"쬉쬊─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂┒┑┚┙┖┕┎┍┞┟┡┢┦┧┩┪┭┮┱┲┵┶┹┺┽┾╀╁╃",7],["a741","쬋",4,"쬑쬒쬓쬕쬖쬗쬙",6,"쬢",7],["a761","쬪",22,"쭂쭃쭄"],["a781","쭅쭆쭇쭊쭋쭍쭎쭏쭑",6,"쭚쭛쭜쭞",5,"쭥",7,"㎕㎖㎗ℓ㎘㏄㎣㎤㎥㎦㎙",9,"㏊㎍㎎㎏㏏㎈㎉㏈㎧㎨㎰",9,"㎀",4,"㎺",5,"㎐",4,"Ω㏀㏁㎊㎋㎌㏖㏅㎭㎮㎯㏛㎩㎪㎫㎬㏝㏐㏓㏃㏉㏜㏆"],["a841","쭭",10,"쭺",14],["a861","쮉",18,"쮝",6],["a881","쮤",19,"쮹",11,"ÆÐªĦ"],["a8a6","Ĳ"],["a8a8","ĿŁØŒºÞŦŊ"],["a8b1","㉠",27,"ⓐ",25,"①",14,"½⅓⅔¼¾⅛⅜⅝⅞"],["a941","쯅",14,"쯕",10],["a961","쯠쯡쯢쯣쯥쯦쯨쯪",18],["a981","쯽",14,"찎찏찑찒찓찕",6,"찞찟찠찣찤æđðħıĳĸŀłøœßþŧŋŉ㈀",27,"⒜",25,"⑴",14,"¹²³⁴ⁿ₁₂₃₄"],["aa41","찥찦찪찫찭찯찱",6,"찺찿",4,"챆챇챉챊챋챍챎"],["aa61","챏",4,"챖챚",5,"챡챢챣챥챧챩",6,"챱챲"],["aa81","챳챴챶",29,"ぁ",82],["ab41","첔첕첖첗첚첛첝첞첟첡",6,"첪첮",5,"첶첷첹"],["ab61","첺첻첽",6,"쳆쳈쳊",5,"쳑쳒쳓쳕",5],["ab81","쳛",8,"쳥",6,"쳭쳮쳯쳱",12,"ァ",85],["ac41","쳾쳿촀촂",5,"촊촋촍촎촏촑",6,"촚촜촞촟촠"],["ac61","촡촢촣촥촦촧촩촪촫촭",11,"촺",4],["ac81","촿",28,"쵝쵞쵟А",5,"ЁЖ",25],["acd1","а",5,"ёж",25],["ad41","쵡쵢쵣쵥",6,"쵮쵰쵲",5,"쵹",7],["ad61","춁",6,"춉",10,"춖춗춙춚춛춝춞춟"],["ad81","춠춡춢춣춦춨춪",5,"춱",18,"췅"],["ae41","췆",5,"췍췎췏췑",16],["ae61","췢",5,"췩췪췫췭췮췯췱",6,"췺췼췾",4],["ae81","츃츅츆츇츉츊츋츍",6,"츕츖츗츘츚",5,"츢츣츥츦츧츩츪츫"],["af41","츬츭츮츯츲츴츶",19],["af61","칊",13,"칚칛칝칞칢",5,"칪칬"],["af81","칮",5,"칶칷칹칺칻칽",6,"캆캈캊",5,"캒캓캕캖캗캙"],["b041","캚",5,"캢캦",5,"캮",12],["b061","캻",5,"컂",19],["b081","컖",13,"컦컧컩컪컭",6,"컶컺",5,"가각간갇갈갉갊감",7,"같",4,"갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆"],["b141","켂켃켅켆켇켉",6,"켒켔켖",5,"켝켞켟켡켢켣"],["b161","켥",6,"켮켲",5,"켹",11],["b181","콅",14,"콖콗콙콚콛콝",6,"콦콨콪콫콬괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸"],["b241","콭콮콯콲콳콵콶콷콹",6,"쾁쾂쾃쾄쾆",5,"쾍"],["b261","쾎",18,"쾢",5,"쾩"],["b281","쾪",5,"쾱",18,"쿅",6,"깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙"],["b341","쿌",19,"쿢쿣쿥쿦쿧쿩"],["b361","쿪",5,"쿲쿴쿶",5,"쿽쿾쿿퀁퀂퀃퀅",5],["b381","퀋",5,"퀒",5,"퀙",19,"끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납낫",4,"낱낳내낵낸낼냄냅냇냈냉냐냑냔냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝"],["b441","퀮",5,"퀶퀷퀹퀺퀻퀽",6,"큆큈큊",5],["b461","큑큒큓큕큖큗큙",6,"큡",10,"큮큯"],["b481","큱큲큳큵",6,"큾큿킀킂",18,"뇟뇨뇩뇬뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫",4,"닳담답닷",4,"닿대댁댄댈댐댑댓댔댕댜더덕덖던덛덜덞덟덤덥"],["b541","킕",14,"킦킧킩킪킫킭",5],["b561","킳킶킸킺",5,"탂탃탅탆탇탊",5,"탒탖",4],["b581","탛탞탟탡탢탣탥",6,"탮탲",5,"탹",11,"덧덩덫덮데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪따딱딴딸"],["b641","턅",7,"턎",17],["b661","턠",15,"턲턳턵턶턷턹턻턼턽턾"],["b681","턿텂텆",5,"텎텏텑텒텓텕",6,"텞텠텢",5,"텩텪텫텭땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗"],["b741","텮",13,"텽",6,"톅톆톇톉톊"],["b761","톋",20,"톢톣톥톦톧"],["b781","톩",6,"톲톴톶톷톸톹톻톽톾톿퇁",14,"래랙랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩"],["b841","퇐",7,"퇙",17],["b861","퇫",8,"퇵퇶퇷퇹",13],["b881","툈툊",5,"툑",24,"륫륭르륵른를름릅릇릉릊릍릎리릭린릴림립릿링마막만많",4,"맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못몽뫄뫈뫘뫙뫼"],["b941","툪툫툮툯툱툲툳툵",6,"툾퉀퉂",5,"퉉퉊퉋퉌"],["b961","퉍",14,"퉝",6,"퉥퉦퉧퉨"],["b981","퉩",22,"튂튃튅튆튇튉튊튋튌묀묄묍묏묑묘묜묠묩묫무묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍및밑바",4,"받",4,"밤밥밧방밭배백밴밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗"],["ba41","튍튎튏튒튓튔튖",5,"튝튞튟튡튢튣튥",6,"튭"],["ba61","튮튯튰튲",5,"튺튻튽튾틁틃",4,"틊틌",5],["ba81","틒틓틕틖틗틙틚틛틝",6,"틦",9,"틲틳틵틶틷틹틺벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟비빅빈빌빎빔빕빗빙빚빛빠빡빤"],["bb41","틻",4,"팂팄팆",5,"팏팑팒팓팕팗",4,"팞팢팣"],["bb61","팤팦팧팪팫팭팮팯팱",6,"팺팾",5,"퍆퍇퍈퍉"],["bb81","퍊",31,"빨빪빰빱빳빴빵빻빼빽뺀뺄뺌뺍뺏뺐뺑뺘뺙뺨뻐뻑뻔뻗뻘뻠뻣뻤뻥뻬뼁뼈뼉뼘뼙뼛뼜뼝뽀뽁뽄뽈뽐뽑뽕뾔뾰뿅뿌뿍뿐뿔뿜뿟뿡쀼쁑쁘쁜쁠쁨쁩삐삑삔삘삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅새색샌샐샘샙샛샜생샤"],["bc41","퍪",17,"퍾퍿펁펂펃펅펆펇"],["bc61","펈펉펊펋펎펒",5,"펚펛펝펞펟펡",6,"펪펬펮"],["bc81","펯",4,"펵펶펷펹펺펻펽",6,"폆폇폊",5,"폑",5,"샥샨샬샴샵샷샹섀섄섈섐섕서",4,"섣설섦섧섬섭섯섰성섶세섹센셀셈셉셋셌셍셔셕션셜셤셥셧셨셩셰셴셸솅소속솎손솔솖솜솝솟송솥솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠쇤쇨쇰쇱쇳쇼쇽숀숄숌숍숏숑수숙순숟술숨숩숫숭"],["bd41","폗폙",7,"폢폤",7,"폮폯폱폲폳폵폶폷"],["bd61","폸폹폺폻폾퐀퐂",5,"퐉",13],["bd81","퐗",5,"퐞",25,"숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿슁슈슉슐슘슛슝스슥슨슬슭슴습슷승시식신싣실싫심십싯싱싶싸싹싻싼쌀쌈쌉쌌쌍쌓쌔쌕쌘쌜쌤쌥쌨쌩썅써썩썬썰썲썸썹썼썽쎄쎈쎌쏀쏘쏙쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쐈쐐쐤쐬쐰"],["be41","퐸",7,"푁푂푃푅",14],["be61","푔",7,"푝푞푟푡푢푣푥",7,"푮푰푱푲"],["be81","푳",4,"푺푻푽푾풁풃",4,"풊풌풎",5,"풕",8,"쐴쐼쐽쑈쑤쑥쑨쑬쑴쑵쑹쒀쒔쒜쒸쒼쓩쓰쓱쓴쓸쓺쓿씀씁씌씐씔씜씨씩씬씰씸씹씻씽아악안앉않알앍앎앓암압앗았앙앝앞애액앤앨앰앱앳앴앵야약얀얄얇얌얍얏양얕얗얘얜얠얩어억언얹얻얼얽얾엄",6,"엌엎"],["bf41","풞",10,"풪",14],["bf61","풹",18,"퓍퓎퓏퓑퓒퓓퓕"],["bf81","퓖",5,"퓝퓞퓠",7,"퓩퓪퓫퓭퓮퓯퓱",6,"퓹퓺퓼에엑엔엘엠엡엣엥여역엮연열엶엷염",5,"옅옆옇예옌옐옘옙옛옜오옥온올옭옮옰옳옴옵옷옹옻와왁완왈왐왑왓왔왕왜왝왠왬왯왱외왹왼욀욈욉욋욍요욕욘욜욤욥욧용우욱운울욹욺움웁웃웅워웍원월웜웝웠웡웨"],["c041","퓾",5,"픅픆픇픉픊픋픍",6,"픖픘",5],["c061","픞",25],["c081","픸픹픺픻픾픿핁핂핃핅",6,"핎핐핒",5,"핚핛핝핞핟핡핢핣웩웬웰웸웹웽위윅윈윌윔윕윗윙유육윤율윰윱윳융윷으윽은을읊음읍읏응",7,"읜읠읨읫이익인일읽읾잃임입잇있잉잊잎자작잔잖잗잘잚잠잡잣잤장잦재잭잰잴잼잽잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬저적전절젊"],["c141","핤핦핧핪핬핮",5,"핶핷핹핺핻핽",6,"햆햊햋"],["c161","햌햍햎햏햑",19,"햦햧"],["c181","햨",31,"점접젓정젖제젝젠젤젬젭젯젱져젼졀졈졉졌졍졔조족존졸졺좀좁좃종좆좇좋좌좍좔좝좟좡좨좼좽죄죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥰쥴쥼즈즉즌즐즘즙즛증지직진짇질짊짐집짓"],["c241","헊헋헍헎헏헑헓",4,"헚헜헞",5,"헦헧헩헪헫헭헮"],["c261","헯",4,"헶헸헺",5,"혂혃혅혆혇혉",6,"혒"],["c281","혖",5,"혝혞혟혡혢혣혥",7,"혮",9,"혺혻징짖짙짚짜짝짠짢짤짧짬짭짯짰짱째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨩쩌쩍쩐쩔쩜쩝쩟쩠쩡쩨쩽쪄쪘쪼쪽쫀쫄쫌쫍쫏쫑쫓쫘쫙쫠쫬쫴쬈쬐쬔쬘쬠쬡쭁쭈쭉쭌쭐쭘쭙쭝쭤쭸쭹쮜쮸쯔쯤쯧쯩찌찍찐찔찜찝찡찢찧차착찬찮찰참찹찻"],["c341","혽혾혿홁홂홃홄홆홇홊홌홎홏홐홒홓홖홗홙홚홛홝",4],["c361","홢",4,"홨홪",5,"홲홳홵",11],["c381","횁횂횄횆",5,"횎횏횑횒횓횕",7,"횞횠횢",5,"횩횪찼창찾채책챈챌챔챕챗챘챙챠챤챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇쳉쳐쳔쳤쳬쳰촁초촉촌촐촘촙촛총촤촨촬촹최쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췐취췬췰췸췹췻췽츄츈츌츔츙츠측츤츨츰츱츳층"],["c441","횫횭횮횯횱",7,"횺횼",7,"훆훇훉훊훋"],["c461","훍훎훏훐훒훓훕훖훘훚",5,"훡훢훣훥훦훧훩",4],["c481","훮훯훱훲훳훴훶",5,"훾훿휁휂휃휅",11,"휒휓휔치칙친칟칠칡침칩칫칭카칵칸칼캄캅캇캉캐캑캔캘캠캡캣캤캥캬캭컁커컥컨컫컬컴컵컷컸컹케켁켄켈켐켑켓켕켜켠켤켬켭켯켰켱켸코콕콘콜콤콥콧콩콰콱콴콸쾀쾅쾌쾡쾨쾰쿄쿠쿡쿤쿨쿰쿱쿳쿵쿼퀀퀄퀑퀘퀭퀴퀵퀸퀼"],["c541","휕휖휗휚휛휝휞휟휡",6,"휪휬휮",5,"휶휷휹"],["c561","휺휻휽",6,"흅흆흈흊",5,"흒흓흕흚",4],["c581","흟흢흤흦흧흨흪흫흭흮흯흱흲흳흵",6,"흾흿힀힂",5,"힊힋큄큅큇큉큐큔큘큠크큭큰클큼큽킁키킥킨킬킴킵킷킹타탁탄탈탉탐탑탓탔탕태택탠탤탬탭탯탰탱탸턍터턱턴털턺텀텁텃텄텅테텍텐텔템텝텟텡텨텬텼톄톈토톡톤톨톰톱톳통톺톼퇀퇘퇴퇸툇툉툐투툭툰툴툼툽툿퉁퉈퉜"],["c641","힍힎힏힑",6,"힚힜힞",5],["c6a1","퉤튀튁튄튈튐튑튕튜튠튤튬튱트특튼튿틀틂틈틉틋틔틘틜틤틥티틱틴틸팀팁팃팅파팍팎판팔팖팜팝팟팠팡팥패팩팬팰팸팹팻팼팽퍄퍅퍼퍽펀펄펌펍펏펐펑페펙펜펠펨펩펫펭펴편펼폄폅폈평폐폘폡폣포폭폰폴폼폽폿퐁"],["c7a1","퐈퐝푀푄표푠푤푭푯푸푹푼푿풀풂품풉풋풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗피픽핀필핌핍핏핑하학한할핥함합핫항해핵핸핼햄햅햇했행햐향허헉헌헐헒험헙헛헝헤헥헨헬헴헵헷헹혀혁현혈혐협혓혔형혜혠"],["c8a1","혤혭호혹혼홀홅홈홉홋홍홑화확환활홧황홰홱홴횃횅회획횐횔횝횟횡효횬횰횹횻후훅훈훌훑훔훗훙훠훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸휼흄흇흉흐흑흔흖흗흘흙흠흡흣흥흩희흰흴흼흽힁히힉힌힐힘힙힛힝"],["caa1","伽佳假價加可呵哥嘉嫁家暇架枷柯歌珂痂稼苛茄街袈訶賈跏軻迦駕刻却各恪慤殼珏脚覺角閣侃刊墾奸姦干幹懇揀杆柬桿澗癎看磵稈竿簡肝艮艱諫間乫喝曷渴碣竭葛褐蝎鞨勘坎堪嵌感憾戡敢柑橄減甘疳監瞰紺邯鑑鑒龕"],["cba1","匣岬甲胛鉀閘剛堈姜岡崗康强彊慷江畺疆糠絳綱羌腔舡薑襁講鋼降鱇介价個凱塏愷愾慨改槪漑疥皆盖箇芥蓋豈鎧開喀客坑更粳羹醵倨去居巨拒据據擧渠炬祛距踞車遽鉅鋸乾件健巾建愆楗腱虔蹇鍵騫乞傑杰桀儉劍劒檢"],["cca1","瞼鈐黔劫怯迲偈憩揭擊格檄激膈覡隔堅牽犬甄絹繭肩見譴遣鵑抉決潔結缺訣兼慊箝謙鉗鎌京俓倞傾儆勁勍卿坰境庚徑慶憬擎敬景暻更梗涇炅烱璟璥瓊痙硬磬竟競絅經耕耿脛莖警輕逕鏡頃頸驚鯨係啓堺契季屆悸戒桂械"],["cda1","棨溪界癸磎稽系繫繼計誡谿階鷄古叩告呱固姑孤尻庫拷攷故敲暠枯槁沽痼皐睾稿羔考股膏苦苽菰藁蠱袴誥賈辜錮雇顧高鼓哭斛曲梏穀谷鵠困坤崑昆梱棍滾琨袞鯤汨滑骨供公共功孔工恐恭拱控攻珙空蚣貢鞏串寡戈果瓜"],["cea1","科菓誇課跨過鍋顆廓槨藿郭串冠官寬慣棺款灌琯瓘管罐菅觀貫關館刮恝括适侊光匡壙廣曠洸炚狂珖筐胱鑛卦掛罫乖傀塊壞怪愧拐槐魁宏紘肱轟交僑咬喬嬌嶠巧攪敎校橋狡皎矯絞翹膠蕎蛟較轎郊餃驕鮫丘久九仇俱具勾"],["cfa1","區口句咎嘔坵垢寇嶇廐懼拘救枸柩構歐毆毬求溝灸狗玖球瞿矩究絿耉臼舅舊苟衢謳購軀逑邱鉤銶駒驅鳩鷗龜國局菊鞠鞫麴君窘群裙軍郡堀屈掘窟宮弓穹窮芎躬倦券勸卷圈拳捲權淃眷厥獗蕨蹶闕机櫃潰詭軌饋句晷歸貴"],["d0a1","鬼龜叫圭奎揆槻珪硅窺竅糾葵規赳逵閨勻均畇筠菌鈞龜橘克剋劇戟棘極隙僅劤勤懃斤根槿瑾筋芹菫覲謹近饉契今妗擒昑檎琴禁禽芩衾衿襟金錦伋及急扱汲級給亘兢矜肯企伎其冀嗜器圻基埼夔奇妓寄岐崎己幾忌技旗旣"],["d1a1","朞期杞棋棄機欺氣汽沂淇玘琦琪璂璣畸畿碁磯祁祇祈祺箕紀綺羈耆耭肌記譏豈起錡錤飢饑騎騏驥麒緊佶吉拮桔金喫儺喇奈娜懦懶拏拿癩",5,"那樂",4,"諾酪駱亂卵暖欄煖爛蘭難鸞捏捺南嵐枏楠湳濫男藍襤拉"],["d2a1","納臘蠟衲囊娘廊",4,"乃來內奈柰耐冷女年撚秊念恬拈捻寧寗努勞奴弩怒擄櫓爐瑙盧",5,"駑魯",10,"濃籠聾膿農惱牢磊腦賂雷尿壘",7,"嫩訥杻紐勒",5,"能菱陵尼泥匿溺多茶"],["d3a1","丹亶但單團壇彖斷旦檀段湍短端簞緞蛋袒鄲鍛撻澾獺疸達啖坍憺擔曇淡湛潭澹痰聃膽蕁覃談譚錟沓畓答踏遝唐堂塘幢戇撞棠當糖螳黨代垈坮大對岱帶待戴擡玳臺袋貸隊黛宅德悳倒刀到圖堵塗導屠島嶋度徒悼挑掉搗桃"],["d4a1","棹櫂淘渡滔濤燾盜睹禱稻萄覩賭跳蹈逃途道都鍍陶韜毒瀆牘犢獨督禿篤纛讀墩惇敦旽暾沌焞燉豚頓乭突仝冬凍動同憧東桐棟洞潼疼瞳童胴董銅兜斗杜枓痘竇荳讀豆逗頭屯臀芚遁遯鈍得嶝橙燈登等藤謄鄧騰喇懶拏癩羅"],["d5a1","蘿螺裸邏樂洛烙珞絡落諾酪駱丹亂卵欄欒瀾爛蘭鸞剌辣嵐擥攬欖濫籃纜藍襤覽拉臘蠟廊朗浪狼琅瑯螂郞來崍徠萊冷掠略亮倆兩凉梁樑粮粱糧良諒輛量侶儷勵呂廬慮戾旅櫚濾礪藜蠣閭驢驪麗黎力曆歷瀝礫轢靂憐戀攣漣"],["d6a1","煉璉練聯蓮輦連鍊冽列劣洌烈裂廉斂殮濂簾獵令伶囹寧岺嶺怜玲笭羚翎聆逞鈴零靈領齡例澧禮醴隷勞怒撈擄櫓潞瀘爐盧老蘆虜路輅露魯鷺鹵碌祿綠菉錄鹿麓論壟弄朧瀧瓏籠聾儡瀨牢磊賂賚賴雷了僚寮廖料燎療瞭聊蓼"],["d7a1","遼鬧龍壘婁屢樓淚漏瘻累縷蔞褸鏤陋劉旒柳榴流溜瀏琉瑠留瘤硫謬類六戮陸侖倫崙淪綸輪律慄栗率隆勒肋凜凌楞稜綾菱陵俚利厘吏唎履悧李梨浬犁狸理璃異痢籬罹羸莉裏裡里釐離鯉吝潾燐璘藺躪隣鱗麟林淋琳臨霖砬"],["d8a1","立笠粒摩瑪痲碼磨馬魔麻寞幕漠膜莫邈万卍娩巒彎慢挽晩曼滿漫灣瞞萬蔓蠻輓饅鰻唜抹末沫茉襪靺亡妄忘忙望網罔芒茫莽輞邙埋妹媒寐昧枚梅每煤罵買賣邁魅脈貊陌驀麥孟氓猛盲盟萌冪覓免冕勉棉沔眄眠綿緬面麵滅"],["d9a1","蔑冥名命明暝椧溟皿瞑茗蓂螟酩銘鳴袂侮冒募姆帽慕摸摹暮某模母毛牟牡瑁眸矛耗芼茅謀謨貌木沐牧目睦穆鶩歿沒夢朦蒙卯墓妙廟描昴杳渺猫竗苗錨務巫憮懋戊拇撫无楙武毋無珷畝繆舞茂蕪誣貿霧鵡墨默們刎吻問文"],["daa1","汶紊紋聞蚊門雯勿沕物味媚尾嵋彌微未梶楣渼湄眉米美薇謎迷靡黴岷悶愍憫敏旻旼民泯玟珉緡閔密蜜謐剝博拍搏撲朴樸泊珀璞箔粕縛膊舶薄迫雹駁伴半反叛拌搬攀斑槃泮潘班畔瘢盤盼磐磻礬絆般蟠返頒飯勃拔撥渤潑"],["dba1","發跋醱鉢髮魃倣傍坊妨尨幇彷房放方旁昉枋榜滂磅紡肪膀舫芳蒡蚌訪謗邦防龐倍俳北培徘拜排杯湃焙盃背胚裴裵褙賠輩配陪伯佰帛柏栢白百魄幡樊煩燔番磻繁蕃藩飜伐筏罰閥凡帆梵氾汎泛犯範范法琺僻劈壁擘檗璧癖"],["dca1","碧蘗闢霹便卞弁變辨辯邊別瞥鱉鼈丙倂兵屛幷昞昺柄棅炳甁病秉竝輧餠騈保堡報寶普步洑湺潽珤甫菩補褓譜輔伏僕匐卜宓復服福腹茯蔔複覆輹輻馥鰒本乶俸奉封峯峰捧棒烽熢琫縫蓬蜂逢鋒鳳不付俯傅剖副否咐埠夫婦"],["dda1","孚孵富府復扶敷斧浮溥父符簿缶腐腑膚艀芙莩訃負賦賻赴趺部釜阜附駙鳧北分吩噴墳奔奮忿憤扮昐汾焚盆粉糞紛芬賁雰不佛弗彿拂崩朋棚硼繃鵬丕備匕匪卑妃婢庇悲憊扉批斐枇榧比毖毗毘沸泌琵痺砒碑秕秘粃緋翡肥"],["dea1","脾臂菲蜚裨誹譬費鄙非飛鼻嚬嬪彬斌檳殯浜濱瀕牝玭貧賓頻憑氷聘騁乍事些仕伺似使俟僿史司唆嗣四士奢娑寫寺射巳師徙思捨斜斯柶査梭死沙泗渣瀉獅砂社祀祠私篩紗絲肆舍莎蓑蛇裟詐詞謝賜赦辭邪飼駟麝削數朔索"],["dfa1","傘刪山散汕珊産疝算蒜酸霰乷撒殺煞薩三參杉森渗芟蔘衫揷澁鈒颯上傷像償商喪嘗孀尙峠常床庠廂想桑橡湘爽牀狀相祥箱翔裳觴詳象賞霜塞璽賽嗇塞穡索色牲生甥省笙墅壻嶼序庶徐恕抒捿敍暑曙書栖棲犀瑞筮絮緖署"],["e0a1","胥舒薯西誓逝鋤黍鼠夕奭席惜昔晳析汐淅潟石碩蓆釋錫仙僊先善嬋宣扇敾旋渲煽琁瑄璇璿癬禪線繕羨腺膳船蘚蟬詵跣選銑鐥饍鮮卨屑楔泄洩渫舌薛褻設說雪齧剡暹殲纖蟾贍閃陝攝涉燮葉城姓宬性惺成星晟猩珹盛省筬"],["e1a1","聖聲腥誠醒世勢歲洗稅笹細說貰召嘯塑宵小少巢所掃搔昭梳沼消溯瀟炤燒甦疏疎瘙笑篠簫素紹蔬蕭蘇訴逍遡邵銷韶騷俗屬束涑粟續謖贖速孫巽損蓀遜飡率宋悚松淞訟誦送頌刷殺灑碎鎖衰釗修受嗽囚垂壽嫂守岫峀帥愁"],["e2a1","戍手授搜收數樹殊水洙漱燧狩獸琇璲瘦睡秀穗竪粹綏綬繡羞脩茱蒐蓚藪袖誰讐輸遂邃酬銖銹隋隧隨雖需須首髓鬚叔塾夙孰宿淑潚熟琡璹肅菽巡徇循恂旬栒楯橓殉洵淳珣盾瞬筍純脣舜荀蓴蕣詢諄醇錞順馴戌術述鉥崇崧"],["e3a1","嵩瑟膝蝨濕拾習褶襲丞乘僧勝升承昇繩蠅陞侍匙嘶始媤尸屎屍市弑恃施是時枾柴猜矢示翅蒔蓍視試詩諡豕豺埴寔式息拭植殖湜熄篒蝕識軾食飾伸侁信呻娠宸愼新晨燼申神紳腎臣莘薪藎蜃訊身辛辰迅失室實悉審尋心沁"],["e4a1","沈深瀋甚芯諶什十拾雙氏亞俄兒啞娥峨我牙芽莪蛾衙訝阿雅餓鴉鵝堊岳嶽幄惡愕握樂渥鄂鍔顎鰐齷安岸按晏案眼雁鞍顔鮟斡謁軋閼唵岩巖庵暗癌菴闇壓押狎鴨仰央怏昻殃秧鴦厓哀埃崖愛曖涯碍艾隘靄厄扼掖液縊腋額"],["e5a1","櫻罌鶯鸚也倻冶夜惹揶椰爺耶若野弱掠略約若葯蒻藥躍亮佯兩凉壤孃恙揚攘敭暘梁楊樣洋瀁煬痒瘍禳穰糧羊良襄諒讓釀陽量養圄御於漁瘀禦語馭魚齬億憶抑檍臆偃堰彦焉言諺孼蘖俺儼嚴奄掩淹嶪業円予余勵呂女如廬"],["e6a1","旅歟汝濾璵礖礪與艅茹輿轝閭餘驪麗黎亦力域役易曆歷疫繹譯轢逆驛嚥堧姸娟宴年延憐戀捐挻撚椽沇沿涎涓淵演漣烟然煙煉燃燕璉硏硯秊筵緣練縯聯衍軟輦蓮連鉛鍊鳶列劣咽悅涅烈熱裂說閱厭廉念捻染殮炎焰琰艶苒"],["e7a1","簾閻髥鹽曄獵燁葉令囹塋寧嶺嶸影怜映暎楹榮永泳渶潁濚瀛瀯煐營獰玲瑛瑩瓔盈穎纓羚聆英詠迎鈴鍈零霙靈領乂倪例刈叡曳汭濊猊睿穢芮藝蘂禮裔詣譽豫醴銳隸霓預五伍俉傲午吾吳嗚塢墺奧娛寤悟惡懊敖旿晤梧汚澳"],["e8a1","烏熬獒筽蜈誤鰲鼇屋沃獄玉鈺溫瑥瘟穩縕蘊兀壅擁瓮甕癰翁邕雍饔渦瓦窩窪臥蛙蝸訛婉完宛梡椀浣玩琓琬碗緩翫脘腕莞豌阮頑曰往旺枉汪王倭娃歪矮外嵬巍猥畏了僚僥凹堯夭妖姚寥寮尿嶢拗搖撓擾料曜樂橈燎燿瑤療"],["e9a1","窈窯繇繞耀腰蓼蟯要謠遙遼邀饒慾欲浴縟褥辱俑傭冗勇埇墉容庸慂榕涌湧溶熔瑢用甬聳茸蓉踊鎔鏞龍于佑偶優又友右宇寓尤愚憂旴牛玗瑀盂祐禑禹紆羽芋藕虞迂遇郵釪隅雨雩勖彧旭昱栯煜稶郁頊云暈橒殞澐熉耘芸蕓"],["eaa1","運隕雲韻蔚鬱亐熊雄元原員圓園垣媛嫄寃怨愿援沅洹湲源爰猿瑗苑袁轅遠阮院願鴛月越鉞位偉僞危圍委威尉慰暐渭爲瑋緯胃萎葦蔿蝟衛褘謂違韋魏乳侑儒兪劉唯喩孺宥幼幽庾悠惟愈愉揄攸有杻柔柚柳楡楢油洧流游溜"],["eba1","濡猶猷琉瑜由留癒硫紐維臾萸裕誘諛諭踰蹂遊逾遺酉釉鍮類六堉戮毓肉育陸倫允奫尹崙淪潤玧胤贇輪鈗閏律慄栗率聿戎瀜絨融隆垠恩慇殷誾銀隱乙吟淫蔭陰音飮揖泣邑凝應膺鷹依倚儀宜意懿擬椅毅疑矣義艤薏蟻衣誼"],["eca1","議醫二以伊利吏夷姨履已弛彛怡易李梨泥爾珥理異痍痢移罹而耳肄苡荑裏裡貽貳邇里離飴餌匿溺瀷益翊翌翼謚人仁刃印吝咽因姻寅引忍湮燐璘絪茵藺蚓認隣靭靷鱗麟一佚佾壹日溢逸鎰馹任壬妊姙恁林淋稔臨荏賃入卄"],["eda1","立笠粒仍剩孕芿仔刺咨姉姿子字孜恣慈滋炙煮玆瓷疵磁紫者自茨蔗藉諮資雌作勺嚼斫昨灼炸爵綽芍酌雀鵲孱棧殘潺盞岑暫潛箴簪蠶雜丈仗匠場墻壯奬將帳庄張掌暲杖樟檣欌漿牆狀獐璋章粧腸臟臧莊葬蔣薔藏裝贓醬長"],["eea1","障再哉在宰才材栽梓渽滓災縡裁財載齋齎爭箏諍錚佇低儲咀姐底抵杵楮樗沮渚狙猪疽箸紵苧菹著藷詛貯躇這邸雎齟勣吊嫡寂摘敵滴狄炙的積笛籍績翟荻謫賊赤跡蹟迪迹適鏑佃佺傳全典前剪塡塼奠專展廛悛戰栓殿氈澱"],["efa1","煎琠田甸畑癲筌箋箭篆纏詮輾轉鈿銓錢鐫電顚顫餞切截折浙癤竊節絶占岾店漸点粘霑鮎點接摺蝶丁井亭停偵呈姃定幀庭廷征情挺政整旌晶晸柾楨檉正汀淀淨渟湞瀞炡玎珽町睛碇禎程穽精綎艇訂諪貞鄭酊釘鉦鋌錠霆靖"],["f0a1","靜頂鼎制劑啼堤帝弟悌提梯濟祭第臍薺製諸蹄醍除際霽題齊俎兆凋助嘲弔彫措操早晁曺曹朝條棗槽漕潮照燥爪璪眺祖祚租稠窕粗糟組繰肇藻蚤詔調趙躁造遭釣阻雕鳥族簇足鏃存尊卒拙猝倧宗從悰慫棕淙琮種終綜縱腫"],["f1a1","踪踵鍾鐘佐坐左座挫罪主住侏做姝胄呪周嗾奏宙州廚晝朱柱株注洲湊澍炷珠疇籌紂紬綢舟蛛註誅走躊輳週酎酒鑄駐竹粥俊儁准埈寯峻晙樽浚準濬焌畯竣蠢逡遵雋駿茁中仲衆重卽櫛楫汁葺增憎曾拯烝甑症繒蒸證贈之只"],["f2a1","咫地址志持指摯支旨智枝枳止池沚漬知砥祉祗紙肢脂至芝芷蜘誌識贄趾遲直稙稷織職唇嗔塵振搢晉晋桭榛殄津溱珍瑨璡畛疹盡眞瞋秦縉縝臻蔯袗診賑軫辰進鎭陣陳震侄叱姪嫉帙桎瓆疾秩窒膣蛭質跌迭斟朕什執潗緝輯"],["f3a1","鏶集徵懲澄且侘借叉嗟嵯差次此磋箚茶蹉車遮捉搾着窄錯鑿齪撰澯燦璨瓚竄簒纂粲纘讚贊鑽餐饌刹察擦札紮僭參塹慘慙懺斬站讒讖倉倡創唱娼廠彰愴敞昌昶暢槍滄漲猖瘡窓脹艙菖蒼債埰寀寨彩採砦綵菜蔡采釵冊柵策"],["f4a1","責凄妻悽處倜刺剔尺慽戚拓擲斥滌瘠脊蹠陟隻仟千喘天川擅泉淺玔穿舛薦賤踐遷釧闡阡韆凸哲喆徹撤澈綴輟轍鐵僉尖沾添甛瞻簽籤詹諂堞妾帖捷牒疊睫諜貼輒廳晴淸聽菁請靑鯖切剃替涕滯締諦逮遞體初剿哨憔抄招梢"],["f5a1","椒楚樵炒焦硝礁礎秒稍肖艸苕草蕉貂超酢醋醮促囑燭矗蜀觸寸忖村邨叢塚寵悤憁摠總聰蔥銃撮催崔最墜抽推椎楸樞湫皺秋芻萩諏趨追鄒酋醜錐錘鎚雛騶鰍丑畜祝竺筑築縮蓄蹙蹴軸逐春椿瑃出朮黜充忠沖蟲衝衷悴膵萃"],["f6a1","贅取吹嘴娶就炊翠聚脆臭趣醉驟鷲側仄厠惻測層侈値嗤峙幟恥梔治淄熾痔痴癡稚穉緇緻置致蚩輜雉馳齒則勅飭親七柒漆侵寢枕沈浸琛砧針鍼蟄秤稱快他咤唾墮妥惰打拖朶楕舵陀馱駝倬卓啄坼度托拓擢晫柝濁濯琢琸託"],["f7a1","鐸呑嘆坦彈憚歎灘炭綻誕奪脫探眈耽貪塔搭榻宕帑湯糖蕩兌台太怠態殆汰泰笞胎苔跆邰颱宅擇澤撑攄兎吐土討慟桶洞痛筒統通堆槌腿褪退頹偸套妬投透鬪慝特闖坡婆巴把播擺杷波派爬琶破罷芭跛頗判坂板版瓣販辦鈑"],["f8a1","阪八叭捌佩唄悖敗沛浿牌狽稗覇貝彭澎烹膨愎便偏扁片篇編翩遍鞭騙貶坪平枰萍評吠嬖幣廢弊斃肺蔽閉陛佈包匍匏咆哺圃布怖抛抱捕暴泡浦疱砲胞脯苞葡蒲袍褒逋鋪飽鮑幅暴曝瀑爆輻俵剽彪慓杓標漂瓢票表豹飇飄驃"],["f9a1","品稟楓諷豊風馮彼披疲皮被避陂匹弼必泌珌畢疋筆苾馝乏逼下何厦夏廈昰河瑕荷蝦賀遐霞鰕壑學虐謔鶴寒恨悍旱汗漢澣瀚罕翰閑閒限韓割轄函含咸啣喊檻涵緘艦銜陷鹹合哈盒蛤閤闔陜亢伉姮嫦巷恒抗杭桁沆港缸肛航"],["faa1","行降項亥偕咳垓奚孩害懈楷海瀣蟹解該諧邂駭骸劾核倖幸杏荇行享向嚮珦鄕響餉饗香噓墟虛許憲櫶獻軒歇險驗奕爀赫革俔峴弦懸晛泫炫玄玹現眩睍絃絢縣舷衒見賢鉉顯孑穴血頁嫌俠協夾峽挾浹狹脅脇莢鋏頰亨兄刑型"],["fba1","形泂滎瀅灐炯熒珩瑩荊螢衡逈邢鎣馨兮彗惠慧暳蕙蹊醯鞋乎互呼壕壺好岵弧戶扈昊晧毫浩淏湖滸澔濠濩灝狐琥瑚瓠皓祜糊縞胡芦葫蒿虎號蝴護豪鎬頀顥惑或酷婚昏混渾琿魂忽惚笏哄弘汞泓洪烘紅虹訌鴻化和嬅樺火畵"],["fca1","禍禾花華話譁貨靴廓擴攫確碻穫丸喚奐宦幻患換歡晥桓渙煥環紈還驩鰥活滑猾豁闊凰幌徨恍惶愰慌晃晄榥況湟滉潢煌璜皇篁簧荒蝗遑隍黃匯回廻徊恢悔懷晦會檜淮澮灰獪繪膾茴蛔誨賄劃獲宖橫鐄哮嚆孝效斅曉梟涍淆"],["fda1","爻肴酵驍侯候厚后吼喉嗅帿後朽煦珝逅勛勳塤壎焄熏燻薰訓暈薨喧暄煊萱卉喙毁彙徽揮暉煇諱輝麾休携烋畦虧恤譎鷸兇凶匈洶胸黑昕欣炘痕吃屹紇訖欠欽歆吸恰洽翕興僖凞喜噫囍姬嬉希憙憘戱晞曦熙熹熺犧禧稀羲詰"]]');

/***/ }),
/* 37 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["0","\\u0000",127],["a140","　，、。．‧；：？！︰…‥﹐﹑﹒·﹔﹕﹖﹗｜–︱—︳╴︴﹏（）︵︶｛｝︷︸〔〕︹︺【】︻︼《》︽︾〈〉︿﹀「」﹁﹂『』﹃﹄﹙﹚"],["a1a1","﹛﹜﹝﹞‘’“”〝〞‵′＃＆＊※§〃○●△▲◎☆★◇◆□■▽▼㊣℅¯￣＿ˍ﹉﹊﹍﹎﹋﹌﹟﹠﹡＋－×÷±√＜＞＝≦≧≠∞≒≡﹢",4,"～∩∪⊥∠∟⊿㏒㏑∫∮∵∴♀♂⊕⊙↑↓←→↖↗↙↘∥∣／"],["a240","＼∕﹨＄￥〒￠￡％＠℃℉﹩﹪﹫㏕㎜㎝㎞㏎㎡㎎㎏㏄°兙兛兞兝兡兣嗧瓩糎▁",7,"▏▎▍▌▋▊▉┼┴┬┤├▔─│▕┌┐└┘╭"],["a2a1","╮╰╯═╞╪╡◢◣◥◤╱╲╳０",9,"Ⅰ",9,"〡",8,"十卄卅Ａ",25,"ａ",21],["a340","ｗｘｙｚΑ",16,"Σ",6,"α",16,"σ",6,"ㄅ",10],["a3a1","ㄐ",25,"˙ˉˊˇˋ"],["a3e1","€"],["a440","一乙丁七乃九了二人儿入八几刀刁力匕十卜又三下丈上丫丸凡久么也乞于亡兀刃勺千叉口土士夕大女子孑孓寸小尢尸山川工己已巳巾干廾弋弓才"],["a4a1","丑丐不中丰丹之尹予云井互五亢仁什仃仆仇仍今介仄元允內六兮公冗凶分切刈勻勾勿化匹午升卅卞厄友及反壬天夫太夭孔少尤尺屯巴幻廿弔引心戈戶手扎支文斗斤方日曰月木欠止歹毋比毛氏水火爪父爻片牙牛犬王丙"],["a540","世丕且丘主乍乏乎以付仔仕他仗代令仙仞充兄冉冊冬凹出凸刊加功包匆北匝仟半卉卡占卯卮去可古右召叮叩叨叼司叵叫另只史叱台句叭叻四囚外"],["a5a1","央失奴奶孕它尼巨巧左市布平幼弁弘弗必戊打扔扒扑斥旦朮本未末札正母民氐永汁汀氾犯玄玉瓜瓦甘生用甩田由甲申疋白皮皿目矛矢石示禾穴立丞丟乒乓乩亙交亦亥仿伉伙伊伕伍伐休伏仲件任仰仳份企伋光兇兆先全"],["a640","共再冰列刑划刎刖劣匈匡匠印危吉吏同吊吐吁吋各向名合吃后吆吒因回囝圳地在圭圬圯圩夙多夷夸妄奸妃好她如妁字存宇守宅安寺尖屹州帆并年"],["a6a1","式弛忙忖戎戌戍成扣扛托收早旨旬旭曲曳有朽朴朱朵次此死氖汝汗汙江池汐汕污汛汍汎灰牟牝百竹米糸缶羊羽老考而耒耳聿肉肋肌臣自至臼舌舛舟艮色艾虫血行衣西阡串亨位住佇佗佞伴佛何估佐佑伽伺伸佃佔似但佣"],["a740","作你伯低伶余佝佈佚兌克免兵冶冷別判利刪刨劫助努劬匣即卵吝吭吞吾否呎吧呆呃吳呈呂君吩告吹吻吸吮吵吶吠吼呀吱含吟听囪困囤囫坊坑址坍"],["a7a1","均坎圾坐坏圻壯夾妝妒妨妞妣妙妖妍妤妓妊妥孝孜孚孛完宋宏尬局屁尿尾岐岑岔岌巫希序庇床廷弄弟彤形彷役忘忌志忍忱快忸忪戒我抄抗抖技扶抉扭把扼找批扳抒扯折扮投抓抑抆改攻攸旱更束李杏材村杜杖杞杉杆杠"],["a840","杓杗步每求汞沙沁沈沉沅沛汪決沐汰沌汨沖沒汽沃汲汾汴沆汶沍沔沘沂灶灼災灸牢牡牠狄狂玖甬甫男甸皂盯矣私秀禿究系罕肖肓肝肘肛肚育良芒"],["a8a1","芋芍見角言谷豆豕貝赤走足身車辛辰迂迆迅迄巡邑邢邪邦那酉釆里防阮阱阪阬並乖乳事些亞享京佯依侍佳使佬供例來侃佰併侈佩佻侖佾侏侑佺兔兒兕兩具其典冽函刻券刷刺到刮制剁劾劻卒協卓卑卦卷卸卹取叔受味呵"],["a940","咖呸咕咀呻呷咄咒咆呼咐呱呶和咚呢周咋命咎固垃坷坪坩坡坦坤坼夜奉奇奈奄奔妾妻委妹妮姑姆姐姍始姓姊妯妳姒姅孟孤季宗定官宜宙宛尚屈居"],["a9a1","屆岷岡岸岩岫岱岳帘帚帖帕帛帑幸庚店府底庖延弦弧弩往征彿彼忝忠忽念忿怏怔怯怵怖怪怕怡性怩怫怛或戕房戾所承拉拌拄抿拂抹拒招披拓拔拋拈抨抽押拐拙拇拍抵拚抱拘拖拗拆抬拎放斧於旺昔易昌昆昂明昀昏昕昊"],["aa40","昇服朋杭枋枕東果杳杷枇枝林杯杰板枉松析杵枚枓杼杪杲欣武歧歿氓氛泣注泳沱泌泥河沽沾沼波沫法泓沸泄油況沮泗泅泱沿治泡泛泊沬泯泜泖泠"],["aaa1","炕炎炒炊炙爬爭爸版牧物狀狎狙狗狐玩玨玟玫玥甽疝疙疚的盂盲直知矽社祀祁秉秈空穹竺糾罔羌羋者肺肥肢肱股肫肩肴肪肯臥臾舍芳芝芙芭芽芟芹花芬芥芯芸芣芰芾芷虎虱初表軋迎返近邵邸邱邶采金長門阜陀阿阻附"],["ab40","陂隹雨青非亟亭亮信侵侯便俠俑俏保促侶俘俟俊俗侮俐俄係俚俎俞侷兗冒冑冠剎剃削前剌剋則勇勉勃勁匍南卻厚叛咬哀咨哎哉咸咦咳哇哂咽咪品"],["aba1","哄哈咯咫咱咻咩咧咿囿垂型垠垣垢城垮垓奕契奏奎奐姜姘姿姣姨娃姥姪姚姦威姻孩宣宦室客宥封屎屏屍屋峙峒巷帝帥帟幽庠度建弈弭彥很待徊律徇後徉怒思怠急怎怨恍恰恨恢恆恃恬恫恪恤扁拜挖按拼拭持拮拽指拱拷"],["ac40","拯括拾拴挑挂政故斫施既春昭映昧是星昨昱昤曷柿染柱柔某柬架枯柵柩柯柄柑枴柚查枸柏柞柳枰柙柢柝柒歪殃殆段毒毗氟泉洋洲洪流津洌洱洞洗"],["aca1","活洽派洶洛泵洹洧洸洩洮洵洎洫炫為炳炬炯炭炸炮炤爰牲牯牴狩狠狡玷珊玻玲珍珀玳甚甭畏界畎畋疫疤疥疢疣癸皆皇皈盈盆盃盅省盹相眉看盾盼眇矜砂研砌砍祆祉祈祇禹禺科秒秋穿突竿竽籽紂紅紀紉紇約紆缸美羿耄"],["ad40","耐耍耑耶胖胥胚胃胄背胡胛胎胞胤胝致舢苧范茅苣苛苦茄若茂茉苒苗英茁苜苔苑苞苓苟苯茆虐虹虻虺衍衫要觔計訂訃貞負赴赳趴軍軌述迦迢迪迥"],["ada1","迭迫迤迨郊郎郁郃酋酊重閂限陋陌降面革韋韭音頁風飛食首香乘亳倌倍倣俯倦倥俸倩倖倆值借倚倒們俺倀倔倨俱倡個候倘俳修倭倪俾倫倉兼冤冥冢凍凌准凋剖剜剔剛剝匪卿原厝叟哨唐唁唷哼哥哲唆哺唔哩哭員唉哮哪"],["ae40","哦唧唇哽唏圃圄埂埔埋埃堉夏套奘奚娑娘娜娟娛娓姬娠娣娩娥娌娉孫屘宰害家宴宮宵容宸射屑展屐峭峽峻峪峨峰島崁峴差席師庫庭座弱徒徑徐恙"],["aea1","恣恥恐恕恭恩息悄悟悚悍悔悌悅悖扇拳挈拿捎挾振捕捂捆捏捉挺捐挽挪挫挨捍捌效敉料旁旅時晉晏晃晒晌晅晁書朔朕朗校核案框桓根桂桔栩梳栗桌桑栽柴桐桀格桃株桅栓栘桁殊殉殷氣氧氨氦氤泰浪涕消涇浦浸海浙涓"],["af40","浬涉浮浚浴浩涌涊浹涅浥涔烊烘烤烙烈烏爹特狼狹狽狸狷玆班琉珮珠珪珞畔畝畜畚留疾病症疲疳疽疼疹痂疸皋皰益盍盎眩真眠眨矩砰砧砸砝破砷"],["afa1","砥砭砠砟砲祕祐祠祟祖神祝祗祚秤秣秧租秦秩秘窄窈站笆笑粉紡紗紋紊素索純紐紕級紜納紙紛缺罟羔翅翁耆耘耕耙耗耽耿胱脂胰脅胭胴脆胸胳脈能脊胼胯臭臬舀舐航舫舨般芻茫荒荔荊茸荐草茵茴荏茲茹茶茗荀茱茨荃"],["b040","虔蚊蚪蚓蚤蚩蚌蚣蚜衰衷袁袂衽衹記訐討訌訕訊託訓訖訏訑豈豺豹財貢起躬軒軔軏辱送逆迷退迺迴逃追逅迸邕郡郝郢酒配酌釘針釗釜釙閃院陣陡"],["b0a1","陛陝除陘陞隻飢馬骨高鬥鬲鬼乾偺偽停假偃偌做偉健偶偎偕偵側偷偏倏偯偭兜冕凰剪副勒務勘動匐匏匙匿區匾參曼商啪啦啄啞啡啃啊唱啖問啕唯啤唸售啜唬啣唳啁啗圈國圉域堅堊堆埠埤基堂堵執培夠奢娶婁婉婦婪婀"],["b140","娼婢婚婆婊孰寇寅寄寂宿密尉專將屠屜屝崇崆崎崛崖崢崑崩崔崙崤崧崗巢常帶帳帷康庸庶庵庾張強彗彬彩彫得徙從徘御徠徜恿患悉悠您惋悴惦悽"],["b1a1","情悻悵惜悼惘惕惆惟悸惚惇戚戛扈掠控捲掖探接捷捧掘措捱掩掉掃掛捫推掄授掙採掬排掏掀捻捩捨捺敝敖救教敗啟敏敘敕敔斜斛斬族旋旌旎晝晚晤晨晦晞曹勗望梁梯梢梓梵桿桶梱梧梗械梃棄梭梆梅梔條梨梟梡梂欲殺"],["b240","毫毬氫涎涼淳淙液淡淌淤添淺清淇淋涯淑涮淞淹涸混淵淅淒渚涵淚淫淘淪深淮淨淆淄涪淬涿淦烹焉焊烽烯爽牽犁猜猛猖猓猙率琅琊球理現琍瓠瓶"],["b2a1","瓷甜產略畦畢異疏痔痕疵痊痍皎盔盒盛眷眾眼眶眸眺硫硃硎祥票祭移窒窕笠笨笛第符笙笞笮粒粗粕絆絃統紮紹紼絀細紳組累終紲紱缽羞羚翌翎習耜聊聆脯脖脣脫脩脰脤舂舵舷舶船莎莞莘荸莢莖莽莫莒莊莓莉莠荷荻荼"],["b340","莆莧處彪蛇蛀蚶蛄蚵蛆蛋蚱蚯蛉術袞袈被袒袖袍袋覓規訪訝訣訥許設訟訛訢豉豚販責貫貨貪貧赧赦趾趺軛軟這逍通逗連速逝逐逕逞造透逢逖逛途"],["b3a1","部郭都酗野釵釦釣釧釭釩閉陪陵陳陸陰陴陶陷陬雀雪雩章竟頂頃魚鳥鹵鹿麥麻傢傍傅備傑傀傖傘傚最凱割剴創剩勞勝勛博厥啻喀喧啼喊喝喘喂喜喪喔喇喋喃喳單喟唾喲喚喻喬喱啾喉喫喙圍堯堪場堤堰報堡堝堠壹壺奠"],["b440","婷媚婿媒媛媧孳孱寒富寓寐尊尋就嵌嵐崴嵇巽幅帽幀幃幾廊廁廂廄弼彭復循徨惑惡悲悶惠愜愣惺愕惰惻惴慨惱愎惶愉愀愒戟扉掣掌描揀揩揉揆揍"],["b4a1","插揣提握揖揭揮捶援揪換摒揚揹敞敦敢散斑斐斯普晰晴晶景暑智晾晷曾替期朝棺棕棠棘棗椅棟棵森棧棹棒棲棣棋棍植椒椎棉棚楮棻款欺欽殘殖殼毯氮氯氬港游湔渡渲湧湊渠渥渣減湛湘渤湖湮渭渦湯渴湍渺測湃渝渾滋"],["b540","溉渙湎湣湄湲湩湟焙焚焦焰無然煮焜牌犄犀猶猥猴猩琺琪琳琢琥琵琶琴琯琛琦琨甥甦畫番痢痛痣痙痘痞痠登發皖皓皴盜睏短硝硬硯稍稈程稅稀窘"],["b5a1","窗窖童竣等策筆筐筒答筍筋筏筑粟粥絞結絨絕紫絮絲絡給絢絰絳善翔翕耋聒肅腕腔腋腑腎脹腆脾腌腓腴舒舜菩萃菸萍菠菅萋菁華菱菴著萊菰萌菌菽菲菊萸萎萄菜萇菔菟虛蛟蛙蛭蛔蛛蛤蛐蛞街裁裂袱覃視註詠評詞証詁"],["b640","詔詛詐詆訴診訶詖象貂貯貼貳貽賁費賀貴買貶貿貸越超趁跎距跋跚跑跌跛跆軻軸軼辜逮逵週逸進逶鄂郵鄉郾酣酥量鈔鈕鈣鈉鈞鈍鈐鈇鈑閔閏開閑"],["b6a1","間閒閎隊階隋陽隅隆隍陲隄雁雅雄集雇雯雲韌項順須飧飪飯飩飲飭馮馭黃黍黑亂傭債傲傳僅傾催傷傻傯僇剿剷剽募勦勤勢勣匯嗟嗨嗓嗦嗎嗜嗇嗑嗣嗤嗯嗚嗡嗅嗆嗥嗉園圓塞塑塘塗塚塔填塌塭塊塢塒塋奧嫁嫉嫌媾媽媼"],["b740","媳嫂媲嵩嵯幌幹廉廈弒彙徬微愚意慈感想愛惹愁愈慎慌慄慍愾愴愧愍愆愷戡戢搓搾搞搪搭搽搬搏搜搔損搶搖搗搆敬斟新暗暉暇暈暖暄暘暍會榔業"],["b7a1","楚楷楠楔極椰概楊楨楫楞楓楹榆楝楣楛歇歲毀殿毓毽溢溯滓溶滂源溝滇滅溥溘溼溺溫滑準溜滄滔溪溧溴煎煙煩煤煉照煜煬煦煌煥煞煆煨煖爺牒猷獅猿猾瑯瑚瑕瑟瑞瑁琿瑙瑛瑜當畸瘀痰瘁痲痱痺痿痴痳盞盟睛睫睦睞督"],["b840","睹睪睬睜睥睨睢矮碎碰碗碘碌碉硼碑碓硿祺祿禁萬禽稜稚稠稔稟稞窟窠筷節筠筮筧粱粳粵經絹綑綁綏絛置罩罪署義羨群聖聘肆肄腱腰腸腥腮腳腫"],["b8a1","腹腺腦舅艇蒂葷落萱葵葦葫葉葬葛萼萵葡董葩葭葆虞虜號蛹蜓蜈蜇蜀蛾蛻蜂蜃蜆蜊衙裟裔裙補裘裝裡裊裕裒覜解詫該詳試詩詰誇詼詣誠話誅詭詢詮詬詹詻訾詨豢貊貉賊資賈賄貲賃賂賅跡跟跨路跳跺跪跤跦躲較載軾輊"],["b940","辟農運遊道遂達逼違遐遇遏過遍遑逾遁鄒鄗酬酪酩釉鈷鉗鈸鈽鉀鈾鉛鉋鉤鉑鈴鉉鉍鉅鈹鈿鉚閘隘隔隕雍雋雉雊雷電雹零靖靴靶預頑頓頊頒頌飼飴"],["b9a1","飽飾馳馱馴髡鳩麂鼎鼓鼠僧僮僥僖僭僚僕像僑僱僎僩兢凳劃劂匱厭嗾嘀嘛嘗嗽嘔嘆嘉嘍嘎嗷嘖嘟嘈嘐嗶團圖塵塾境墓墊塹墅塽壽夥夢夤奪奩嫡嫦嫩嫗嫖嫘嫣孵寞寧寡寥實寨寢寤察對屢嶄嶇幛幣幕幗幔廓廖弊彆彰徹慇"],["ba40","愿態慷慢慣慟慚慘慵截撇摘摔撤摸摟摺摑摧搴摭摻敲斡旗旖暢暨暝榜榨榕槁榮槓構榛榷榻榫榴槐槍榭槌榦槃榣歉歌氳漳演滾漓滴漩漾漠漬漏漂漢"],["baa1","滿滯漆漱漸漲漣漕漫漯澈漪滬漁滲滌滷熔熙煽熊熄熒爾犒犖獄獐瑤瑣瑪瑰瑭甄疑瘧瘍瘋瘉瘓盡監瞄睽睿睡磁碟碧碳碩碣禎福禍種稱窪窩竭端管箕箋筵算箝箔箏箸箇箄粹粽精綻綰綜綽綾綠緊綴網綱綺綢綿綵綸維緒緇綬"],["bb40","罰翠翡翟聞聚肇腐膀膏膈膊腿膂臧臺與舔舞艋蓉蒿蓆蓄蒙蒞蒲蒜蓋蒸蓀蓓蒐蒼蓑蓊蜿蜜蜻蜢蜥蜴蜘蝕蜷蜩裳褂裴裹裸製裨褚裯誦誌語誣認誡誓誤"],["bba1","說誥誨誘誑誚誧豪貍貌賓賑賒赫趙趕跼輔輒輕輓辣遠遘遜遣遙遞遢遝遛鄙鄘鄞酵酸酷酴鉸銀銅銘銖鉻銓銜銨鉼銑閡閨閩閣閥閤隙障際雌雒需靼鞅韶頗領颯颱餃餅餌餉駁骯骰髦魁魂鳴鳶鳳麼鼻齊億儀僻僵價儂儈儉儅凜"],["bc40","劇劈劉劍劊勰厲嘮嘻嘹嘲嘿嘴嘩噓噎噗噴嘶嘯嘰墀墟增墳墜墮墩墦奭嬉嫻嬋嫵嬌嬈寮寬審寫層履嶝嶔幢幟幡廢廚廟廝廣廠彈影德徵慶慧慮慝慕憂"],["bca1","慼慰慫慾憧憐憫憎憬憚憤憔憮戮摩摯摹撞撲撈撐撰撥撓撕撩撒撮播撫撚撬撙撢撳敵敷數暮暫暴暱樣樟槨樁樞標槽模樓樊槳樂樅槭樑歐歎殤毅毆漿潼澄潑潦潔澆潭潛潸潮澎潺潰潤澗潘滕潯潠潟熟熬熱熨牖犛獎獗瑩璋璃"],["bd40","瑾璀畿瘠瘩瘟瘤瘦瘡瘢皚皺盤瞎瞇瞌瞑瞋磋磅確磊碾磕碼磐稿稼穀稽稷稻窯窮箭箱範箴篆篇篁箠篌糊締練緯緻緘緬緝編緣線緞緩綞緙緲緹罵罷羯"],["bda1","翩耦膛膜膝膠膚膘蔗蔽蔚蓮蔬蔭蔓蔑蔣蔡蔔蓬蔥蓿蔆螂蝴蝶蝠蝦蝸蝨蝙蝗蝌蝓衛衝褐複褒褓褕褊誼諒談諄誕請諸課諉諂調誰論諍誶誹諛豌豎豬賠賞賦賤賬賭賢賣賜質賡赭趟趣踫踐踝踢踏踩踟踡踞躺輝輛輟輩輦輪輜輞"],["be40","輥適遮遨遭遷鄰鄭鄧鄱醇醉醋醃鋅銻銷鋪銬鋤鋁銳銼鋒鋇鋰銲閭閱霄霆震霉靠鞍鞋鞏頡頫頜颳養餓餒餘駝駐駟駛駑駕駒駙骷髮髯鬧魅魄魷魯鴆鴉"],["bea1","鴃麩麾黎墨齒儒儘儔儐儕冀冪凝劑劓勳噙噫噹噩噤噸噪器噥噱噯噬噢噶壁墾壇壅奮嬝嬴學寰導彊憲憑憩憊懍憶憾懊懈戰擅擁擋撻撼據擄擇擂操撿擒擔撾整曆曉暹曄曇暸樽樸樺橙橫橘樹橄橢橡橋橇樵機橈歙歷氅濂澱澡"],["bf40","濃澤濁澧澳激澹澶澦澠澴熾燉燐燒燈燕熹燎燙燜燃燄獨璜璣璘璟璞瓢甌甍瘴瘸瘺盧盥瞠瞞瞟瞥磨磚磬磧禦積穎穆穌穋窺篙簑築篤篛篡篩篦糕糖縊"],["bfa1","縑縈縛縣縞縝縉縐罹羲翰翱翮耨膳膩膨臻興艘艙蕊蕙蕈蕨蕩蕃蕉蕭蕪蕞螃螟螞螢融衡褪褲褥褫褡親覦諦諺諫諱謀諜諧諮諾謁謂諷諭諳諶諼豫豭貓賴蹄踱踴蹂踹踵輻輯輸輳辨辦遵遴選遲遼遺鄴醒錠錶鋸錳錯錢鋼錫錄錚"],["c040","錐錦錡錕錮錙閻隧隨險雕霎霑霖霍霓霏靛靜靦鞘頰頸頻頷頭頹頤餐館餞餛餡餚駭駢駱骸骼髻髭鬨鮑鴕鴣鴦鴨鴒鴛默黔龍龜優償儡儲勵嚎嚀嚐嚅嚇"],["c0a1","嚏壕壓壑壎嬰嬪嬤孺尷屨嶼嶺嶽嶸幫彌徽應懂懇懦懋戲戴擎擊擘擠擰擦擬擱擢擭斂斃曙曖檀檔檄檢檜櫛檣橾檗檐檠歜殮毚氈濘濱濟濠濛濤濫濯澀濬濡濩濕濮濰燧營燮燦燥燭燬燴燠爵牆獰獲璩環璦璨癆療癌盪瞳瞪瞰瞬"],["c140","瞧瞭矯磷磺磴磯礁禧禪穗窿簇簍篾篷簌篠糠糜糞糢糟糙糝縮績繆縷縲繃縫總縱繅繁縴縹繈縵縿縯罄翳翼聱聲聰聯聳臆臃膺臂臀膿膽臉膾臨舉艱薪"],["c1a1","薄蕾薜薑薔薯薛薇薨薊虧蟀蟑螳蟒蟆螫螻螺蟈蟋褻褶襄褸褽覬謎謗謙講謊謠謝謄謐豁谿豳賺賽購賸賻趨蹉蹋蹈蹊轄輾轂轅輿避遽還邁邂邀鄹醣醞醜鍍鎂錨鍵鍊鍥鍋錘鍾鍬鍛鍰鍚鍔闊闋闌闈闆隱隸雖霜霞鞠韓顆颶餵騁"],["c240","駿鮮鮫鮪鮭鴻鴿麋黏點黜黝黛鼾齋叢嚕嚮壙壘嬸彝懣戳擴擲擾攆擺擻擷斷曜朦檳檬櫃檻檸櫂檮檯歟歸殯瀉瀋濾瀆濺瀑瀏燻燼燾燸獷獵璧璿甕癖癘"],["c2a1","癒瞽瞿瞻瞼礎禮穡穢穠竄竅簫簧簪簞簣簡糧織繕繞繚繡繒繙罈翹翻職聶臍臏舊藏薩藍藐藉薰薺薹薦蟯蟬蟲蟠覆覲觴謨謹謬謫豐贅蹙蹣蹦蹤蹟蹕軀轉轍邇邃邈醫醬釐鎔鎊鎖鎢鎳鎮鎬鎰鎘鎚鎗闔闖闐闕離雜雙雛雞霤鞣鞦"],["c340","鞭韹額顏題顎顓颺餾餿餽餮馥騎髁鬃鬆魏魎魍鯊鯉鯽鯈鯀鵑鵝鵠黠鼕鼬儳嚥壞壟壢寵龐廬懲懷懶懵攀攏曠曝櫥櫝櫚櫓瀛瀟瀨瀚瀝瀕瀘爆爍牘犢獸"],["c3a1","獺璽瓊瓣疇疆癟癡矇礙禱穫穩簾簿簸簽簷籀繫繭繹繩繪羅繳羶羹羸臘藩藝藪藕藤藥藷蟻蠅蠍蟹蟾襠襟襖襞譁譜識證譚譎譏譆譙贈贊蹼蹲躇蹶蹬蹺蹴轔轎辭邊邋醱醮鏡鏑鏟鏃鏈鏜鏝鏖鏢鏍鏘鏤鏗鏨關隴難霪霧靡韜韻類"],["c440","願顛颼饅饉騖騙鬍鯨鯧鯖鯛鶉鵡鵲鵪鵬麒麗麓麴勸嚨嚷嚶嚴嚼壤孀孃孽寶巉懸懺攘攔攙曦朧櫬瀾瀰瀲爐獻瓏癢癥礦礪礬礫竇競籌籃籍糯糰辮繽繼"],["c4a1","纂罌耀臚艦藻藹蘑藺蘆蘋蘇蘊蠔蠕襤覺觸議譬警譯譟譫贏贍躉躁躅躂醴釋鐘鐃鏽闡霰飄饒饑馨騫騰騷騵鰓鰍鹹麵黨鼯齟齣齡儷儸囁囀囂夔屬巍懼懾攝攜斕曩櫻欄櫺殲灌爛犧瓖瓔癩矓籐纏續羼蘗蘭蘚蠣蠢蠡蠟襪襬覽譴"],["c540","護譽贓躊躍躋轟辯醺鐮鐳鐵鐺鐸鐲鐫闢霸霹露響顧顥饗驅驃驀騾髏魔魑鰭鰥鶯鶴鷂鶸麝黯鼙齜齦齧儼儻囈囊囉孿巔巒彎懿攤權歡灑灘玀瓤疊癮癬"],["c5a1","禳籠籟聾聽臟襲襯觼讀贖贗躑躓轡酈鑄鑑鑒霽霾韃韁顫饕驕驍髒鬚鱉鰱鰾鰻鷓鷗鼴齬齪龔囌巖戀攣攫攪曬欐瓚竊籤籣籥纓纖纔臢蘸蘿蠱變邐邏鑣鑠鑤靨顯饜驚驛驗髓體髑鱔鱗鱖鷥麟黴囑壩攬灞癱癲矗罐羈蠶蠹衢讓讒"],["c640","讖艷贛釀鑪靂靈靄韆顰驟鬢魘鱟鷹鷺鹼鹽鼇齷齲廳欖灣籬籮蠻觀躡釁鑲鑰顱饞髖鬣黌灤矚讚鑷韉驢驥纜讜躪釅鑽鑾鑼鱷鱸黷豔鑿鸚爨驪鬱鸛鸞籲"],["c940","乂乜凵匚厂万丌乇亍囗兀屮彳丏冇与丮亓仂仉仈冘勼卬厹圠夃夬尐巿旡殳毌气爿丱丼仨仜仩仡仝仚刌匜卌圢圣夗夯宁宄尒尻屴屳帄庀庂忉戉扐氕"],["c9a1","氶汃氿氻犮犰玊禸肊阞伎优伬仵伔仱伀价伈伝伂伅伢伓伄仴伒冱刓刉刐劦匢匟卍厊吇囡囟圮圪圴夼妀奼妅奻奾奷奿孖尕尥屼屺屻屾巟幵庄异弚彴忕忔忏扜扞扤扡扦扢扙扠扚扥旯旮朾朹朸朻机朿朼朳氘汆汒汜汏汊汔汋"],["ca40","汌灱牞犴犵玎甪癿穵网艸艼芀艽艿虍襾邙邗邘邛邔阢阤阠阣佖伻佢佉体佤伾佧佒佟佁佘伭伳伿佡冏冹刜刞刡劭劮匉卣卲厎厏吰吷吪呔呅吙吜吥吘"],["caa1","吽呏呁吨吤呇囮囧囥坁坅坌坉坋坒夆奀妦妘妠妗妎妢妐妏妧妡宎宒尨尪岍岏岈岋岉岒岊岆岓岕巠帊帎庋庉庌庈庍弅弝彸彶忒忑忐忭忨忮忳忡忤忣忺忯忷忻怀忴戺抃抌抎抏抔抇扱扻扺扰抁抈扷扽扲扴攷旰旴旳旲旵杅杇"],["cb40","杙杕杌杈杝杍杚杋毐氙氚汸汧汫沄沋沏汱汯汩沚汭沇沕沜汦汳汥汻沎灴灺牣犿犽狃狆狁犺狅玕玗玓玔玒町甹疔疕皁礽耴肕肙肐肒肜芐芏芅芎芑芓"],["cba1","芊芃芄豸迉辿邟邡邥邞邧邠阰阨阯阭丳侘佼侅佽侀侇佶佴侉侄佷佌侗佪侚佹侁佸侐侜侔侞侒侂侕佫佮冞冼冾刵刲刳剆刱劼匊匋匼厒厔咇呿咁咑咂咈呫呺呾呥呬呴呦咍呯呡呠咘呣呧呤囷囹坯坲坭坫坱坰坶垀坵坻坳坴坢"],["cc40","坨坽夌奅妵妺姏姎妲姌姁妶妼姃姖妱妽姀姈妴姇孢孥宓宕屄屇岮岤岠岵岯岨岬岟岣岭岢岪岧岝岥岶岰岦帗帔帙弨弢弣弤彔徂彾彽忞忥怭怦怙怲怋"],["cca1","怴怊怗怳怚怞怬怢怍怐怮怓怑怌怉怜戔戽抭抴拑抾抪抶拊抮抳抯抻抩抰抸攽斨斻昉旼昄昒昈旻昃昋昍昅旽昑昐曶朊枅杬枎枒杶杻枘枆构杴枍枌杺枟枑枙枃杽极杸杹枔欥殀歾毞氝沓泬泫泮泙沶泔沭泧沷泐泂沺泃泆泭泲"],["cd40","泒泝沴沊沝沀泞泀洰泍泇沰泹泏泩泑炔炘炅炓炆炄炑炖炂炚炃牪狖狋狘狉狜狒狔狚狌狑玤玡玭玦玢玠玬玝瓝瓨甿畀甾疌疘皯盳盱盰盵矸矼矹矻矺"],["cda1","矷祂礿秅穸穻竻籵糽耵肏肮肣肸肵肭舠芠苀芫芚芘芛芵芧芮芼芞芺芴芨芡芩苂芤苃芶芢虰虯虭虮豖迒迋迓迍迖迕迗邲邴邯邳邰阹阽阼阺陃俍俅俓侲俉俋俁俔俜俙侻侳俛俇俖侺俀侹俬剄剉勀勂匽卼厗厖厙厘咺咡咭咥哏"],["ce40","哃茍咷咮哖咶哅哆咠呰咼咢咾呲哞咰垵垞垟垤垌垗垝垛垔垘垏垙垥垚垕壴复奓姡姞姮娀姱姝姺姽姼姶姤姲姷姛姩姳姵姠姾姴姭宨屌峐峘峌峗峋峛"],["cea1","峞峚峉峇峊峖峓峔峏峈峆峎峟峸巹帡帢帣帠帤庰庤庢庛庣庥弇弮彖徆怷怹恔恲恞恅恓恇恉恛恌恀恂恟怤恄恘恦恮扂扃拏挍挋拵挎挃拫拹挏挌拸拶挀挓挔拺挕拻拰敁敃斪斿昶昡昲昵昜昦昢昳昫昺昝昴昹昮朏朐柁柲柈枺"],["cf40","柜枻柸柘柀枷柅柫柤柟枵柍枳柷柶柮柣柂枹柎柧柰枲柼柆柭柌枮柦柛柺柉柊柃柪柋欨殂殄殶毖毘毠氠氡洨洴洭洟洼洿洒洊泚洳洄洙洺洚洑洀洝浂"],["cfa1","洁洘洷洃洏浀洇洠洬洈洢洉洐炷炟炾炱炰炡炴炵炩牁牉牊牬牰牳牮狊狤狨狫狟狪狦狣玅珌珂珈珅玹玶玵玴珫玿珇玾珃珆玸珋瓬瓮甮畇畈疧疪癹盄眈眃眄眅眊盷盻盺矧矨砆砑砒砅砐砏砎砉砃砓祊祌祋祅祄秕种秏秖秎窀"],["d040","穾竑笀笁籺籸籹籿粀粁紃紈紁罘羑羍羾耇耎耏耔耷胘胇胠胑胈胂胐胅胣胙胜胊胕胉胏胗胦胍臿舡芔苙苾苹茇苨茀苕茺苫苖苴苬苡苲苵茌苻苶苰苪"],["d0a1","苤苠苺苳苭虷虴虼虳衁衎衧衪衩觓訄訇赲迣迡迮迠郱邽邿郕郅邾郇郋郈釔釓陔陏陑陓陊陎倞倅倇倓倢倰倛俵俴倳倷倬俶俷倗倜倠倧倵倯倱倎党冔冓凊凄凅凈凎剡剚剒剞剟剕剢勍匎厞唦哢唗唒哧哳哤唚哿唄唈哫唑唅哱"],["d140","唊哻哷哸哠唎唃唋圁圂埌堲埕埒垺埆垽垼垸垶垿埇埐垹埁夎奊娙娖娭娮娕娏娗娊娞娳孬宧宭宬尃屖屔峬峿峮峱峷崀峹帩帨庨庮庪庬弳弰彧恝恚恧"],["d1a1","恁悢悈悀悒悁悝悃悕悛悗悇悜悎戙扆拲挐捖挬捄捅挶捃揤挹捋捊挼挩捁挴捘捔捙挭捇挳捚捑挸捗捀捈敊敆旆旃旄旂晊晟晇晑朒朓栟栚桉栲栳栻桋桏栖栱栜栵栫栭栯桎桄栴栝栒栔栦栨栮桍栺栥栠欬欯欭欱欴歭肂殈毦毤"],["d240","毨毣毢毧氥浺浣浤浶洍浡涒浘浢浭浯涑涍淯浿涆浞浧浠涗浰浼浟涂涘洯浨涋浾涀涄洖涃浻浽浵涐烜烓烑烝烋缹烢烗烒烞烠烔烍烅烆烇烚烎烡牂牸"],["d2a1","牷牶猀狺狴狾狶狳狻猁珓珙珥珖玼珧珣珩珜珒珛珔珝珚珗珘珨瓞瓟瓴瓵甡畛畟疰痁疻痄痀疿疶疺皊盉眝眛眐眓眒眣眑眕眙眚眢眧砣砬砢砵砯砨砮砫砡砩砳砪砱祔祛祏祜祓祒祑秫秬秠秮秭秪秜秞秝窆窉窅窋窌窊窇竘笐"],["d340","笄笓笅笏笈笊笎笉笒粄粑粊粌粈粍粅紞紝紑紎紘紖紓紟紒紏紌罜罡罞罠罝罛羖羒翃翂翀耖耾耹胺胲胹胵脁胻脀舁舯舥茳茭荄茙荑茥荖茿荁茦茜茢"],["d3a1","荂荎茛茪茈茼荍茖茤茠茷茯茩荇荅荌荓茞茬荋茧荈虓虒蚢蚨蚖蚍蚑蚞蚇蚗蚆蚋蚚蚅蚥蚙蚡蚧蚕蚘蚎蚝蚐蚔衃衄衭衵衶衲袀衱衿衯袃衾衴衼訒豇豗豻貤貣赶赸趵趷趶軑軓迾迵适迿迻逄迼迶郖郠郙郚郣郟郥郘郛郗郜郤酐"],["d440","酎酏釕釢釚陜陟隼飣髟鬯乿偰偪偡偞偠偓偋偝偲偈偍偁偛偊偢倕偅偟偩偫偣偤偆偀偮偳偗偑凐剫剭剬剮勖勓匭厜啵啶唼啍啐唴唪啑啢唶唵唰啒啅"],["d4a1","唌唲啥啎唹啈唭唻啀啋圊圇埻堔埢埶埜埴堀埭埽堈埸堋埳埏堇埮埣埲埥埬埡堎埼堐埧堁堌埱埩埰堍堄奜婠婘婕婧婞娸娵婭婐婟婥婬婓婤婗婃婝婒婄婛婈媎娾婍娹婌婰婩婇婑婖婂婜孲孮寁寀屙崞崋崝崚崠崌崨崍崦崥崏"],["d540","崰崒崣崟崮帾帴庱庴庹庲庳弶弸徛徖徟悊悐悆悾悰悺惓惔惏惤惙惝惈悱惛悷惊悿惃惍惀挲捥掊掂捽掽掞掭掝掗掫掎捯掇掐据掯捵掜捭掮捼掤挻掟"],["d5a1","捸掅掁掑掍捰敓旍晥晡晛晙晜晢朘桹梇梐梜桭桮梮梫楖桯梣梬梩桵桴梲梏桷梒桼桫桲梪梀桱桾梛梖梋梠梉梤桸桻梑梌梊桽欶欳欷欸殑殏殍殎殌氪淀涫涴涳湴涬淩淢涷淶淔渀淈淠淟淖涾淥淜淝淛淴淊涽淭淰涺淕淂淏淉"],["d640","淐淲淓淽淗淍淣涻烺焍烷焗烴焌烰焄烳焐烼烿焆焓焀烸烶焋焂焎牾牻牼牿猝猗猇猑猘猊猈狿猏猞玈珶珸珵琄琁珽琇琀珺珼珿琌琋珴琈畤畣痎痒痏"],["d6a1","痋痌痑痐皏皉盓眹眯眭眱眲眴眳眽眥眻眵硈硒硉硍硊硌砦硅硐祤祧祩祪祣祫祡离秺秸秶秷窏窔窐笵筇笴笥笰笢笤笳笘笪笝笱笫笭笯笲笸笚笣粔粘粖粣紵紽紸紶紺絅紬紩絁絇紾紿絊紻紨罣羕羜羝羛翊翋翍翐翑翇翏翉耟"],["d740","耞耛聇聃聈脘脥脙脛脭脟脬脞脡脕脧脝脢舑舸舳舺舴舲艴莐莣莨莍荺荳莤荴莏莁莕莙荵莔莩荽莃莌莝莛莪莋荾莥莯莈莗莰荿莦莇莮荶莚虙虖蚿蚷"],["d7a1","蛂蛁蛅蚺蚰蛈蚹蚳蚸蛌蚴蚻蚼蛃蚽蚾衒袉袕袨袢袪袚袑袡袟袘袧袙袛袗袤袬袌袓袎覂觖觙觕訰訧訬訞谹谻豜豝豽貥赽赻赹趼跂趹趿跁軘軞軝軜軗軠軡逤逋逑逜逌逡郯郪郰郴郲郳郔郫郬郩酖酘酚酓酕釬釴釱釳釸釤釹釪"],["d840","釫釷釨釮镺閆閈陼陭陫陱陯隿靪頄飥馗傛傕傔傞傋傣傃傌傎傝偨傜傒傂傇兟凔匒匑厤厧喑喨喥喭啷噅喢喓喈喏喵喁喣喒喤啽喌喦啿喕喡喎圌堩堷"],["d8a1","堙堞堧堣堨埵塈堥堜堛堳堿堶堮堹堸堭堬堻奡媯媔媟婺媢媞婸媦婼媥媬媕媮娷媄媊媗媃媋媩婻婽媌媜媏媓媝寪寍寋寔寑寊寎尌尰崷嵃嵫嵁嵋崿崵嵑嵎嵕崳崺嵒崽崱嵙嵂崹嵉崸崼崲崶嵀嵅幄幁彘徦徥徫惉悹惌惢惎惄愔"],["d940","惲愊愖愅惵愓惸惼惾惁愃愘愝愐惿愄愋扊掔掱掰揎揥揨揯揃撝揳揊揠揶揕揲揵摡揟掾揝揜揄揘揓揂揇揌揋揈揰揗揙攲敧敪敤敜敨敥斌斝斞斮旐旒"],["d9a1","晼晬晻暀晱晹晪晲朁椌棓椄棜椪棬棪棱椏棖棷棫棤棶椓椐棳棡椇棌椈楰梴椑棯棆椔棸棐棽棼棨椋椊椗棎棈棝棞棦棴棑椆棔棩椕椥棇欹欻欿欼殔殗殙殕殽毰毲毳氰淼湆湇渟湉溈渼渽湅湢渫渿湁湝湳渜渳湋湀湑渻渃渮湞"],["da40","湨湜湡渱渨湠湱湫渹渢渰湓湥渧湸湤湷湕湹湒湦渵渶湚焠焞焯烻焮焱焣焥焢焲焟焨焺焛牋牚犈犉犆犅犋猒猋猰猢猱猳猧猲猭猦猣猵猌琮琬琰琫琖"],["daa1","琚琡琭琱琤琣琝琩琠琲瓻甯畯畬痧痚痡痦痝痟痤痗皕皒盚睆睇睄睍睅睊睎睋睌矞矬硠硤硥硜硭硱硪确硰硩硨硞硢祴祳祲祰稂稊稃稌稄窙竦竤筊笻筄筈筌筎筀筘筅粢粞粨粡絘絯絣絓絖絧絪絏絭絜絫絒絔絩絑絟絎缾缿罥"],["db40","罦羢羠羡翗聑聏聐胾胔腃腊腒腏腇脽腍脺臦臮臷臸臹舄舼舽舿艵茻菏菹萣菀菨萒菧菤菼菶萐菆菈菫菣莿萁菝菥菘菿菡菋菎菖菵菉萉萏菞萑萆菂菳"],["dba1","菕菺菇菑菪萓菃菬菮菄菻菗菢萛菛菾蛘蛢蛦蛓蛣蛚蛪蛝蛫蛜蛬蛩蛗蛨蛑衈衖衕袺裗袹袸裀袾袶袼袷袽袲褁裉覕覘覗觝觚觛詎詍訹詙詀詗詘詄詅詒詈詑詊詌詏豟貁貀貺貾貰貹貵趄趀趉跘跓跍跇跖跜跏跕跙跈跗跅軯軷軺"],["dc40","軹軦軮軥軵軧軨軶軫軱軬軴軩逭逴逯鄆鄬鄄郿郼鄈郹郻鄁鄀鄇鄅鄃酡酤酟酢酠鈁鈊鈥鈃鈚鈦鈏鈌鈀鈒釿釽鈆鈄鈧鈂鈜鈤鈙鈗鈅鈖镻閍閌閐隇陾隈"],["dca1","隉隃隀雂雈雃雱雰靬靰靮頇颩飫鳦黹亃亄亶傽傿僆傮僄僊傴僈僂傰僁傺傱僋僉傶傸凗剺剸剻剼嗃嗛嗌嗐嗋嗊嗝嗀嗔嗄嗩喿嗒喍嗏嗕嗢嗖嗈嗲嗍嗙嗂圔塓塨塤塏塍塉塯塕塎塝塙塥塛堽塣塱壼嫇嫄嫋媺媸媱媵媰媿嫈媻嫆"],["dd40","媷嫀嫊媴媶嫍媹媐寖寘寙尟尳嵱嵣嵊嵥嵲嵬嵞嵨嵧嵢巰幏幎幊幍幋廅廌廆廋廇彀徯徭惷慉慊愫慅愶愲愮慆愯慏愩慀戠酨戣戥戤揅揱揫搐搒搉搠搤"],["dda1","搳摃搟搕搘搹搷搢搣搌搦搰搨摁搵搯搊搚摀搥搧搋揧搛搮搡搎敯斒旓暆暌暕暐暋暊暙暔晸朠楦楟椸楎楢楱椿楅楪椹楂楗楙楺楈楉椵楬椳椽楥棰楸椴楩楀楯楄楶楘楁楴楌椻楋椷楜楏楑椲楒椯楻椼歆歅歃歂歈歁殛嗀毻毼"],["de40","毹毷毸溛滖滈溏滀溟溓溔溠溱溹滆滒溽滁溞滉溷溰滍溦滏溲溾滃滜滘溙溒溎溍溤溡溿溳滐滊溗溮溣煇煔煒煣煠煁煝煢煲煸煪煡煂煘煃煋煰煟煐煓"],["dea1","煄煍煚牏犍犌犑犐犎猼獂猻猺獀獊獉瑄瑊瑋瑒瑑瑗瑀瑏瑐瑎瑂瑆瑍瑔瓡瓿瓾瓽甝畹畷榃痯瘏瘃痷痾痼痹痸瘐痻痶痭痵痽皙皵盝睕睟睠睒睖睚睩睧睔睙睭矠碇碚碔碏碄碕碅碆碡碃硹碙碀碖硻祼禂祽祹稑稘稙稒稗稕稢稓"],["df40","稛稐窣窢窞竫筦筤筭筴筩筲筥筳筱筰筡筸筶筣粲粴粯綈綆綀綍絿綅絺綎絻綃絼綌綔綄絽綒罭罫罧罨罬羦羥羧翛翜耡腤腠腷腜腩腛腢腲朡腞腶腧腯"],["dfa1","腄腡舝艉艄艀艂艅蓱萿葖葶葹蒏蒍葥葑葀蒆葧萰葍葽葚葙葴葳葝蔇葞萷萺萴葺葃葸萲葅萩菙葋萯葂萭葟葰萹葎葌葒葯蓅蒎萻葇萶萳葨葾葄萫葠葔葮葐蜋蜄蛷蜌蛺蛖蛵蝍蛸蜎蜉蜁蛶蜍蜅裖裋裍裎裞裛裚裌裐覅覛觟觥觤"],["e040","觡觠觢觜触詶誆詿詡訿詷誂誄詵誃誁詴詺谼豋豊豥豤豦貆貄貅賌赨赩趑趌趎趏趍趓趔趐趒跰跠跬跱跮跐跩跣跢跧跲跫跴輆軿輁輀輅輇輈輂輋遒逿"],["e0a1","遄遉逽鄐鄍鄏鄑鄖鄔鄋鄎酮酯鉈鉒鈰鈺鉦鈳鉥鉞銃鈮鉊鉆鉭鉬鉏鉠鉧鉯鈶鉡鉰鈱鉔鉣鉐鉲鉎鉓鉌鉖鈲閟閜閞閛隒隓隑隗雎雺雽雸雵靳靷靸靲頏頍頎颬飶飹馯馲馰馵骭骫魛鳪鳭鳧麀黽僦僔僗僨僳僛僪僝僤僓僬僰僯僣僠"],["e140","凘劀劁勩勫匰厬嘧嘕嘌嘒嗼嘏嘜嘁嘓嘂嗺嘝嘄嗿嗹墉塼墐墘墆墁塿塴墋塺墇墑墎塶墂墈塻墔墏壾奫嫜嫮嫥嫕嫪嫚嫭嫫嫳嫢嫠嫛嫬嫞嫝嫙嫨嫟孷寠"],["e1a1","寣屣嶂嶀嵽嶆嵺嶁嵷嶊嶉嶈嵾嵼嶍嵹嵿幘幙幓廘廑廗廎廜廕廙廒廔彄彃彯徶愬愨慁慞慱慳慒慓慲慬憀慴慔慺慛慥愻慪慡慖戩戧戫搫摍摛摝摴摶摲摳摽摵摦撦摎撂摞摜摋摓摠摐摿搿摬摫摙摥摷敳斠暡暠暟朅朄朢榱榶槉"],["e240","榠槎榖榰榬榼榑榙榎榧榍榩榾榯榿槄榽榤槔榹槊榚槏榳榓榪榡榞槙榗榐槂榵榥槆歊歍歋殞殟殠毃毄毾滎滵滱漃漥滸漷滻漮漉潎漙漚漧漘漻漒滭漊"],["e2a1","漶潳滹滮漭潀漰漼漵滫漇漎潃漅滽滶漹漜滼漺漟漍漞漈漡熇熐熉熀熅熂熏煻熆熁熗牄牓犗犕犓獃獍獑獌瑢瑳瑱瑵瑲瑧瑮甀甂甃畽疐瘖瘈瘌瘕瘑瘊瘔皸瞁睼瞅瞂睮瞀睯睾瞃碲碪碴碭碨硾碫碞碥碠碬碢碤禘禊禋禖禕禔禓"],["e340","禗禈禒禐稫穊稰稯稨稦窨窫窬竮箈箜箊箑箐箖箍箌箛箎箅箘劄箙箤箂粻粿粼粺綧綷緂綣綪緁緀緅綝緎緄緆緋緌綯綹綖綼綟綦綮綩綡緉罳翢翣翥翞"],["e3a1","耤聝聜膉膆膃膇膍膌膋舕蒗蒤蒡蒟蒺蓎蓂蒬蒮蒫蒹蒴蓁蓍蒪蒚蒱蓐蒝蒧蒻蒢蒔蓇蓌蒛蒩蒯蒨蓖蒘蒶蓏蒠蓗蓔蓒蓛蒰蒑虡蜳蜣蜨蝫蝀蜮蜞蜡蜙蜛蝃蜬蝁蜾蝆蜠蜲蜪蜭蜼蜒蜺蜱蜵蝂蜦蜧蜸蜤蜚蜰蜑裷裧裱裲裺裾裮裼裶裻"],["e440","裰裬裫覝覡覟覞觩觫觨誫誙誋誒誏誖谽豨豩賕賏賗趖踉踂跿踍跽踊踃踇踆踅跾踀踄輐輑輎輍鄣鄜鄠鄢鄟鄝鄚鄤鄡鄛酺酲酹酳銥銤鉶銛鉺銠銔銪銍"],["e4a1","銦銚銫鉹銗鉿銣鋮銎銂銕銢鉽銈銡銊銆銌銙銧鉾銇銩銝銋鈭隞隡雿靘靽靺靾鞃鞀鞂靻鞄鞁靿韎韍頖颭颮餂餀餇馝馜駃馹馻馺駂馽駇骱髣髧鬾鬿魠魡魟鳱鳲鳵麧僿儃儰僸儆儇僶僾儋儌僽儊劋劌勱勯噈噂噌嘵噁噊噉噆噘"],["e540","噚噀嘳嘽嘬嘾嘸嘪嘺圚墫墝墱墠墣墯墬墥墡壿嫿嫴嫽嫷嫶嬃嫸嬂嫹嬁嬇嬅嬏屧嶙嶗嶟嶒嶢嶓嶕嶠嶜嶡嶚嶞幩幝幠幜緳廛廞廡彉徲憋憃慹憱憰憢憉"],["e5a1","憛憓憯憭憟憒憪憡憍慦憳戭摮摰撖撠撅撗撜撏撋撊撌撣撟摨撱撘敶敺敹敻斲斳暵暰暩暲暷暪暯樀樆樗槥槸樕槱槤樠槿槬槢樛樝槾樧槲槮樔槷槧橀樈槦槻樍槼槫樉樄樘樥樏槶樦樇槴樖歑殥殣殢殦氁氀毿氂潁漦潾澇濆澒"],["e640","澍澉澌潢潏澅潚澖潶潬澂潕潲潒潐潗澔澓潝漀潡潫潽潧澐潓澋潩潿澕潣潷潪潻熲熯熛熰熠熚熩熵熝熥熞熤熡熪熜熧熳犘犚獘獒獞獟獠獝獛獡獚獙"],["e6a1","獢璇璉璊璆璁瑽璅璈瑼瑹甈甇畾瘥瘞瘙瘝瘜瘣瘚瘨瘛皜皝皞皛瞍瞏瞉瞈磍碻磏磌磑磎磔磈磃磄磉禚禡禠禜禢禛歶稹窲窴窳箷篋箾箬篎箯箹篊箵糅糈糌糋緷緛緪緧緗緡縃緺緦緶緱緰緮緟罶羬羰羭翭翫翪翬翦翨聤聧膣膟"],["e740","膞膕膢膙膗舖艏艓艒艐艎艑蔤蔻蔏蔀蔩蔎蔉蔍蔟蔊蔧蔜蓻蔫蓺蔈蔌蓴蔪蓲蔕蓷蓫蓳蓼蔒蓪蓩蔖蓾蔨蔝蔮蔂蓽蔞蓶蔱蔦蓧蓨蓰蓯蓹蔘蔠蔰蔋蔙蔯虢"],["e7a1","蝖蝣蝤蝷蟡蝳蝘蝔蝛蝒蝡蝚蝑蝞蝭蝪蝐蝎蝟蝝蝯蝬蝺蝮蝜蝥蝏蝻蝵蝢蝧蝩衚褅褌褔褋褗褘褙褆褖褑褎褉覢覤覣觭觰觬諏諆誸諓諑諔諕誻諗誾諀諅諘諃誺誽諙谾豍貏賥賟賙賨賚賝賧趠趜趡趛踠踣踥踤踮踕踛踖踑踙踦踧"],["e840","踔踒踘踓踜踗踚輬輤輘輚輠輣輖輗遳遰遯遧遫鄯鄫鄩鄪鄲鄦鄮醅醆醊醁醂醄醀鋐鋃鋄鋀鋙銶鋏鋱鋟鋘鋩鋗鋝鋌鋯鋂鋨鋊鋈鋎鋦鋍鋕鋉鋠鋞鋧鋑鋓"],["e8a1","銵鋡鋆銴镼閬閫閮閰隤隢雓霅霈霂靚鞊鞎鞈韐韏頞頝頦頩頨頠頛頧颲餈飺餑餔餖餗餕駜駍駏駓駔駎駉駖駘駋駗駌骳髬髫髳髲髱魆魃魧魴魱魦魶魵魰魨魤魬鳼鳺鳽鳿鳷鴇鴀鳹鳻鴈鴅鴄麃黓鼏鼐儜儓儗儚儑凞匴叡噰噠噮"],["e940","噳噦噣噭噲噞噷圜圛壈墽壉墿墺壂墼壆嬗嬙嬛嬡嬔嬓嬐嬖嬨嬚嬠嬞寯嶬嶱嶩嶧嶵嶰嶮嶪嶨嶲嶭嶯嶴幧幨幦幯廩廧廦廨廥彋徼憝憨憖懅憴懆懁懌憺"],["e9a1","憿憸憌擗擖擐擏擉撽撉擃擛擳擙攳敿敼斢曈暾曀曊曋曏暽暻暺曌朣樴橦橉橧樲橨樾橝橭橶橛橑樨橚樻樿橁橪橤橐橏橔橯橩橠樼橞橖橕橍橎橆歕歔歖殧殪殫毈毇氄氃氆澭濋澣濇澼濎濈潞濄澽澞濊澨瀄澥澮澺澬澪濏澿澸"],["ea40","澢濉澫濍澯澲澰燅燂熿熸燖燀燁燋燔燊燇燏熽燘熼燆燚燛犝犞獩獦獧獬獥獫獪瑿璚璠璔璒璕璡甋疀瘯瘭瘱瘽瘳瘼瘵瘲瘰皻盦瞚瞝瞡瞜瞛瞢瞣瞕瞙"],["eaa1","瞗磝磩磥磪磞磣磛磡磢磭磟磠禤穄穈穇窶窸窵窱窷篞篣篧篝篕篥篚篨篹篔篪篢篜篫篘篟糒糔糗糐糑縒縡縗縌縟縠縓縎縜縕縚縢縋縏縖縍縔縥縤罃罻罼罺羱翯耪耩聬膱膦膮膹膵膫膰膬膴膲膷膧臲艕艖艗蕖蕅蕫蕍蕓蕡蕘"],["eb40","蕀蕆蕤蕁蕢蕄蕑蕇蕣蔾蕛蕱蕎蕮蕵蕕蕧蕠薌蕦蕝蕔蕥蕬虣虥虤螛螏螗螓螒螈螁螖螘蝹螇螣螅螐螑螝螄螔螜螚螉褞褦褰褭褮褧褱褢褩褣褯褬褟觱諠"],["eba1","諢諲諴諵諝謔諤諟諰諈諞諡諨諿諯諻貑貒貐賵賮賱賰賳赬赮趥趧踳踾踸蹀蹅踶踼踽蹁踰踿躽輶輮輵輲輹輷輴遶遹遻邆郺鄳鄵鄶醓醐醑醍醏錧錞錈錟錆錏鍺錸錼錛錣錒錁鍆錭錎錍鋋錝鋺錥錓鋹鋷錴錂錤鋿錩錹錵錪錔錌"],["ec40","錋鋾錉錀鋻錖閼闍閾閹閺閶閿閵閽隩雔霋霒霐鞙鞗鞔韰韸頵頯頲餤餟餧餩馞駮駬駥駤駰駣駪駩駧骹骿骴骻髶髺髹髷鬳鮀鮅鮇魼魾魻鮂鮓鮒鮐魺鮕"],["eca1","魽鮈鴥鴗鴠鴞鴔鴩鴝鴘鴢鴐鴙鴟麈麆麇麮麭黕黖黺鼒鼽儦儥儢儤儠儩勴嚓嚌嚍嚆嚄嚃噾嚂噿嚁壖壔壏壒嬭嬥嬲嬣嬬嬧嬦嬯嬮孻寱寲嶷幬幪徾徻懃憵憼懧懠懥懤懨懞擯擩擣擫擤擨斁斀斶旚曒檍檖檁檥檉檟檛檡檞檇檓檎"],["ed40","檕檃檨檤檑橿檦檚檅檌檒歛殭氉濌澩濴濔濣濜濭濧濦濞濲濝濢濨燡燱燨燲燤燰燢獳獮獯璗璲璫璐璪璭璱璥璯甐甑甒甏疄癃癈癉癇皤盩瞵瞫瞲瞷瞶"],["eda1","瞴瞱瞨矰磳磽礂磻磼磲礅磹磾礄禫禨穜穛穖穘穔穚窾竀竁簅簏篲簀篿篻簎篴簋篳簂簉簃簁篸篽簆篰篱簐簊糨縭縼繂縳顈縸縪繉繀繇縩繌縰縻縶繄縺罅罿罾罽翴翲耬膻臄臌臊臅臇膼臩艛艚艜薃薀薏薧薕薠薋薣蕻薤薚薞"],["ee40","蕷蕼薉薡蕺蕸蕗薎薖薆薍薙薝薁薢薂薈薅蕹蕶薘薐薟虨螾螪螭蟅螰螬螹螵螼螮蟉蟃蟂蟌螷螯蟄蟊螴螶螿螸螽蟞螲褵褳褼褾襁襒褷襂覭覯覮觲觳謞"],["eea1","謘謖謑謅謋謢謏謒謕謇謍謈謆謜謓謚豏豰豲豱豯貕貔賹赯蹎蹍蹓蹐蹌蹇轃轀邅遾鄸醚醢醛醙醟醡醝醠鎡鎃鎯鍤鍖鍇鍼鍘鍜鍶鍉鍐鍑鍠鍭鎏鍌鍪鍹鍗鍕鍒鍏鍱鍷鍻鍡鍞鍣鍧鎀鍎鍙闇闀闉闃闅閷隮隰隬霠霟霘霝霙鞚鞡鞜"],["ef40","鞞鞝韕韔韱顁顄顊顉顅顃餥餫餬餪餳餲餯餭餱餰馘馣馡騂駺駴駷駹駸駶駻駽駾駼騃骾髾髽鬁髼魈鮚鮨鮞鮛鮦鮡鮥鮤鮆鮢鮠鮯鴳鵁鵧鴶鴮鴯鴱鴸鴰"],["efa1","鵅鵂鵃鴾鴷鵀鴽翵鴭麊麉麍麰黈黚黻黿鼤鼣鼢齔龠儱儭儮嚘嚜嚗嚚嚝嚙奰嬼屩屪巀幭幮懘懟懭懮懱懪懰懫懖懩擿攄擽擸攁攃擼斔旛曚曛曘櫅檹檽櫡櫆檺檶檷櫇檴檭歞毉氋瀇瀌瀍瀁瀅瀔瀎濿瀀濻瀦濼濷瀊爁燿燹爃燽獶"],["f040","璸瓀璵瓁璾璶璻瓂甔甓癜癤癙癐癓癗癚皦皽盬矂瞺磿礌礓礔礉礐礒礑禭禬穟簜簩簙簠簟簭簝簦簨簢簥簰繜繐繖繣繘繢繟繑繠繗繓羵羳翷翸聵臑臒"],["f0a1","臐艟艞薴藆藀藃藂薳薵薽藇藄薿藋藎藈藅薱薶藒蘤薸薷薾虩蟧蟦蟢蟛蟫蟪蟥蟟蟳蟤蟔蟜蟓蟭蟘蟣螤蟗蟙蠁蟴蟨蟝襓襋襏襌襆襐襑襉謪謧謣謳謰謵譇謯謼謾謱謥謷謦謶謮謤謻謽謺豂豵貙貘貗賾贄贂贀蹜蹢蹠蹗蹖蹞蹥蹧"],["f140","蹛蹚蹡蹝蹩蹔轆轇轈轋鄨鄺鄻鄾醨醥醧醯醪鎵鎌鎒鎷鎛鎝鎉鎧鎎鎪鎞鎦鎕鎈鎙鎟鎍鎱鎑鎲鎤鎨鎴鎣鎥闒闓闑隳雗雚巂雟雘雝霣霢霥鞬鞮鞨鞫鞤鞪"],["f1a1","鞢鞥韗韙韖韘韺顐顑顒颸饁餼餺騏騋騉騍騄騑騊騅騇騆髀髜鬈鬄鬅鬩鬵魊魌魋鯇鯆鯃鮿鯁鮵鮸鯓鮶鯄鮹鮽鵜鵓鵏鵊鵛鵋鵙鵖鵌鵗鵒鵔鵟鵘鵚麎麌黟鼁鼀鼖鼥鼫鼪鼩鼨齌齕儴儵劖勷厴嚫嚭嚦嚧嚪嚬壚壝壛夒嬽嬾嬿巃幰"],["f240","徿懻攇攐攍攉攌攎斄旞旝曞櫧櫠櫌櫑櫙櫋櫟櫜櫐櫫櫏櫍櫞歠殰氌瀙瀧瀠瀖瀫瀡瀢瀣瀩瀗瀤瀜瀪爌爊爇爂爅犥犦犤犣犡瓋瓅璷瓃甖癠矉矊矄矱礝礛"],["f2a1","礡礜礗礞禰穧穨簳簼簹簬簻糬糪繶繵繸繰繷繯繺繲繴繨罋罊羃羆羷翽翾聸臗臕艤艡艣藫藱藭藙藡藨藚藗藬藲藸藘藟藣藜藑藰藦藯藞藢蠀蟺蠃蟶蟷蠉蠌蠋蠆蟼蠈蟿蠊蠂襢襚襛襗襡襜襘襝襙覈覷覶觶譐譈譊譀譓譖譔譋譕"],["f340","譑譂譒譗豃豷豶貚贆贇贉趬趪趭趫蹭蹸蹳蹪蹯蹻軂轒轑轏轐轓辴酀鄿醰醭鏞鏇鏏鏂鏚鏐鏹鏬鏌鏙鎩鏦鏊鏔鏮鏣鏕鏄鏎鏀鏒鏧镽闚闛雡霩霫霬霨霦"],["f3a1","鞳鞷鞶韝韞韟顜顙顝顗颿颽颻颾饈饇饃馦馧騚騕騥騝騤騛騢騠騧騣騞騜騔髂鬋鬊鬎鬌鬷鯪鯫鯠鯞鯤鯦鯢鯰鯔鯗鯬鯜鯙鯥鯕鯡鯚鵷鶁鶊鶄鶈鵱鶀鵸鶆鶋鶌鵽鵫鵴鵵鵰鵩鶅鵳鵻鶂鵯鵹鵿鶇鵨麔麑黀黼鼭齀齁齍齖齗齘匷嚲"],["f440","嚵嚳壣孅巆巇廮廯忀忁懹攗攖攕攓旟曨曣曤櫳櫰櫪櫨櫹櫱櫮櫯瀼瀵瀯瀷瀴瀱灂瀸瀿瀺瀹灀瀻瀳灁爓爔犨獽獼璺皫皪皾盭矌矎矏矍矲礥礣礧礨礤礩"],["f4a1","禲穮穬穭竷籉籈籊籇籅糮繻繾纁纀羺翿聹臛臙舋艨艩蘢藿蘁藾蘛蘀藶蘄蘉蘅蘌藽蠙蠐蠑蠗蠓蠖襣襦覹觷譠譪譝譨譣譥譧譭趮躆躈躄轙轖轗轕轘轚邍酃酁醷醵醲醳鐋鐓鏻鐠鐏鐔鏾鐕鐐鐨鐙鐍鏵鐀鏷鐇鐎鐖鐒鏺鐉鏸鐊鏿"],["f540","鏼鐌鏶鐑鐆闞闠闟霮霯鞹鞻韽韾顠顢顣顟飁飂饐饎饙饌饋饓騲騴騱騬騪騶騩騮騸騭髇髊髆鬐鬒鬑鰋鰈鯷鰅鰒鯸鱀鰇鰎鰆鰗鰔鰉鶟鶙鶤鶝鶒鶘鶐鶛"],["f5a1","鶠鶔鶜鶪鶗鶡鶚鶢鶨鶞鶣鶿鶩鶖鶦鶧麙麛麚黥黤黧黦鼰鼮齛齠齞齝齙龑儺儹劘劗囃嚽嚾孈孇巋巏廱懽攛欂櫼欃櫸欀灃灄灊灈灉灅灆爝爚爙獾甗癪矐礭礱礯籔籓糲纊纇纈纋纆纍罍羻耰臝蘘蘪蘦蘟蘣蘜蘙蘧蘮蘡蘠蘩蘞蘥"],["f640","蠩蠝蠛蠠蠤蠜蠫衊襭襩襮襫觺譹譸譅譺譻贐贔趯躎躌轞轛轝酆酄酅醹鐿鐻鐶鐩鐽鐼鐰鐹鐪鐷鐬鑀鐱闥闤闣霵霺鞿韡顤飉飆飀饘饖騹騽驆驄驂驁騺"],["f6a1","騿髍鬕鬗鬘鬖鬺魒鰫鰝鰜鰬鰣鰨鰩鰤鰡鶷鶶鶼鷁鷇鷊鷏鶾鷅鷃鶻鶵鷎鶹鶺鶬鷈鶱鶭鷌鶳鷍鶲鹺麜黫黮黭鼛鼘鼚鼱齎齥齤龒亹囆囅囋奱孋孌巕巑廲攡攠攦攢欋欈欉氍灕灖灗灒爞爟犩獿瓘瓕瓙瓗癭皭礵禴穰穱籗籜籙籛籚"],["f740","糴糱纑罏羇臞艫蘴蘵蘳蘬蘲蘶蠬蠨蠦蠪蠥襱覿覾觻譾讄讂讆讅譿贕躕躔躚躒躐躖躗轠轢酇鑌鑐鑊鑋鑏鑇鑅鑈鑉鑆霿韣顪顩飋饔饛驎驓驔驌驏驈驊"],["f7a1","驉驒驐髐鬙鬫鬻魖魕鱆鱈鰿鱄鰹鰳鱁鰼鰷鰴鰲鰽鰶鷛鷒鷞鷚鷋鷐鷜鷑鷟鷩鷙鷘鷖鷵鷕鷝麶黰鼵鼳鼲齂齫龕龢儽劙壨壧奲孍巘蠯彏戁戃戄攩攥斖曫欑欒欏毊灛灚爢玂玁玃癰矔籧籦纕艬蘺虀蘹蘼蘱蘻蘾蠰蠲蠮蠳襶襴襳觾"],["f840","讌讎讋讈豅贙躘轤轣醼鑢鑕鑝鑗鑞韄韅頀驖驙鬞鬟鬠鱒鱘鱐鱊鱍鱋鱕鱙鱌鱎鷻鷷鷯鷣鷫鷸鷤鷶鷡鷮鷦鷲鷰鷢鷬鷴鷳鷨鷭黂黐黲黳鼆鼜鼸鼷鼶齃齏"],["f8a1","齱齰齮齯囓囍孎屭攭曭曮欓灟灡灝灠爣瓛瓥矕礸禷禶籪纗羉艭虃蠸蠷蠵衋讔讕躞躟躠躝醾醽釂鑫鑨鑩雥靆靃靇韇韥驞髕魙鱣鱧鱦鱢鱞鱠鸂鷾鸇鸃鸆鸅鸀鸁鸉鷿鷽鸄麠鼞齆齴齵齶囔攮斸欘欙欗欚灢爦犪矘矙礹籩籫糶纚"],["f940","纘纛纙臠臡虆虇虈襹襺襼襻觿讘讙躥躤躣鑮鑭鑯鑱鑳靉顲饟鱨鱮鱭鸋鸍鸐鸏鸒鸑麡黵鼉齇齸齻齺齹圞灦籯蠼趲躦釃鑴鑸鑶鑵驠鱴鱳鱱鱵鸔鸓黶鼊"],["f9a1","龤灨灥糷虪蠾蠽蠿讞貜躩軉靋顳顴飌饡馫驤驦驧鬤鸕鸗齈戇欞爧虌躨钂钀钁驩驨鬮鸙爩虋讟钃鱹麷癵驫鱺鸝灩灪麤齾齉龘碁銹裏墻恒粧嫺╔╦╗╠╬╣╚╩╝╒╤╕╞╪╡╘╧╛╓╥╖╟╫╢╙╨╜║═╭╮╰╯▓"]]');

/***/ }),
/* 38 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[["8740","䏰䰲䘃䖦䕸𧉧䵷䖳𧲱䳢𧳅㮕䜶䝄䱇䱀𤊿𣘗𧍒𦺋𧃒䱗𪍑䝏䗚䲅𧱬䴇䪤䚡𦬣爥𥩔𡩣𣸆𣽡晍囻"],["8767","綕夝𨮹㷴霴𧯯寛𡵞媤㘥𩺰嫑宷峼杮薓𩥅瑡璝㡵𡵓𣚞𦀡㻬"],["87a1","𥣞㫵竼龗𤅡𨤍𣇪𠪊𣉞䌊蒄龖鐯䤰蘓墖靊鈘秐稲晠権袝瑌篅枂稬剏遆㓦珄𥶹瓆鿇垳䤯呌䄱𣚎堘穲𧭥讏䚮𦺈䆁𥶙箮𢒼鿈𢓁𢓉𢓌鿉蔄𣖻䂴鿊䓡𪷿拁灮鿋"],["8840","㇀",4,"𠄌㇅𠃑𠃍㇆㇇𠃋𡿨㇈𠃊㇉㇊㇋㇌𠄎㇍㇎ĀÁǍÀĒÉĚÈŌÓǑÒ࿿Ê̄Ế࿿Ê̌ỀÊāáǎàɑēéěèīíǐìōóǒòūúǔùǖǘǚ"],["88a1","ǜü࿿ê̄ế࿿ê̌ềêɡ⏚⏛"],["8940","𪎩𡅅"],["8943","攊"],["8946","丽滝鵎釟"],["894c","𧜵撑会伨侨兖兴农凤务动医华发变团声处备夲头学实実岚庆总斉柾栄桥济炼电纤纬纺织经统缆缷艺苏药视设询车轧轮"],["89a1","琑糼緍楆竉刧"],["89ab","醌碸酞肼"],["89b0","贋胶𠧧"],["89b5","肟黇䳍鷉鸌䰾𩷶𧀎鸊𪄳㗁"],["89c1","溚舾甙"],["89c5","䤑马骏龙禇𨑬𡷊𠗐𢫦两亁亀亇亿仫伷㑌侽㹈倃傈㑽㒓㒥円夅凛凼刅争剹劐匧㗇厩㕑厰㕓参吣㕭㕲㚁咓咣咴咹哐哯唘唣唨㖘唿㖥㖿嗗㗅"],["8a40","𧶄唥"],["8a43","𠱂𠴕𥄫喐𢳆㧬𠍁蹆𤶸𩓥䁓𨂾睺𢰸㨴䟕𨅝𦧲𤷪擝𠵼𠾴𠳕𡃴撍蹾𠺖𠰋𠽤𢲩𨉖𤓓"],["8a64","𠵆𩩍𨃩䟴𤺧𢳂骲㩧𩗴㿭㔆𥋇𩟔𧣈𢵄鵮頕"],["8a76","䏙𦂥撴哣𢵌𢯊𡁷㧻𡁯"],["8aa1","𦛚𦜖𧦠擪𥁒𠱃蹨𢆡𨭌𠜱"],["8aac","䠋𠆩㿺塳𢶍"],["8ab2","𤗈𠓼𦂗𠽌𠶖啹䂻䎺"],["8abb","䪴𢩦𡂝膪飵𠶜捹㧾𢝵跀嚡摼㹃"],["8ac9","𪘁𠸉𢫏𢳉"],["8ace","𡃈𣧂㦒㨆𨊛㕸𥹉𢃇噒𠼱𢲲𩜠㒼氽𤸻"],["8adf","𧕴𢺋𢈈𪙛𨳍𠹺𠰴𦠜羓𡃏𢠃𢤹㗻𥇣𠺌𠾍𠺪㾓𠼰𠵇𡅏𠹌"],["8af6","𠺫𠮩𠵈𡃀𡄽㿹𢚖搲𠾭"],["8b40","𣏴𧘹𢯎𠵾𠵿𢱑𢱕㨘𠺘𡃇𠼮𪘲𦭐𨳒𨶙𨳊閪哌苄喹"],["8b55","𩻃鰦骶𧝞𢷮煀腭胬尜𦕲脴㞗卟𨂽醶𠻺𠸏𠹷𠻻㗝𤷫㘉𠳖嚯𢞵𡃉𠸐𠹸𡁸𡅈𨈇𡑕𠹹𤹐𢶤婔𡀝𡀞𡃵𡃶垜𠸑"],["8ba1","𧚔𨋍𠾵𠹻𥅾㜃𠾶𡆀𥋘𪊽𤧚𡠺𤅷𨉼墙剨㘚𥜽箲孨䠀䬬鼧䧧鰟鮍𥭴𣄽嗻㗲嚉丨夂𡯁屮靑𠂆乛亻㔾尣彑忄㣺扌攵歺氵氺灬爫丬犭𤣩罒礻糹罓𦉪㓁"],["8bde","𦍋耂肀𦘒𦥑卝衤见𧢲讠贝钅镸长门𨸏韦页风飞饣𩠐鱼鸟黄歯龜丷𠂇阝户钢"],["8c40","倻淾𩱳龦㷉袏𤅎灷峵䬠𥇍㕙𥴰愢𨨲辧釶熑朙玺𣊁𪄇㲋𡦀䬐磤琂冮𨜏䀉橣𪊺䈣蘏𠩯稪𩥇𨫪靕灍匤𢁾鏴盙𨧣龧矝亣俰傼丯众龨吴綋墒壐𡶶庒庙忂𢜒斋"],["8ca1","𣏹椙橃𣱣泿"],["8ca7","爀𤔅玌㻛𤨓嬕璹讃𥲤𥚕窓篬糃繬苸薗龩袐龪躹龫迏蕟駠鈡龬𨶹𡐿䁱䊢娚"],["8cc9","顨杫䉶圽"],["8cce","藖𤥻芿𧄍䲁𦵴嵻𦬕𦾾龭龮宖龯曧繛湗秊㶈䓃𣉖𢞖䎚䔶"],["8ce6","峕𣬚諹屸㴒𣕑嵸龲煗䕘𤃬𡸣䱷㥸㑊𠆤𦱁諌侴𠈹妿腬顖𩣺弻"],["8d40","𠮟"],["8d42","𢇁𨥭䄂䚻𩁹㼇龳𪆵䃸㟖䛷𦱆䅼𨚲𧏿䕭㣔𥒚䕡䔛䶉䱻䵶䗪㿈𤬏㙡䓞䒽䇭崾嵈嵖㷼㠏嶤嶹㠠㠸幂庽弥徃㤈㤔㤿㥍惗愽峥㦉憷憹懏㦸戬抐拥挘㧸嚱"],["8da1","㨃揢揻搇摚㩋擀崕嘡龟㪗斆㪽旿晓㫲暒㬢朖㭂枤栀㭘桊梄㭲㭱㭻椉楃牜楤榟榅㮼槖㯝橥橴橱檂㯬檙㯲檫檵櫔櫶殁毁毪汵沪㳋洂洆洦涁㳯涤涱渕渘温溆𨧀溻滢滚齿滨滩漤漴㵆𣽁澁澾㵪㵵熷岙㶊瀬㶑灐灔灯灿炉𠌥䏁㗱𠻘"],["8e40","𣻗垾𦻓焾𥟠㙎榢𨯩孴穉𥣡𩓙穥穽𥦬窻窰竂竃燑𦒍䇊竚竝竪䇯咲𥰁笋筕笩𥌎𥳾箢筯莜𥮴𦱿篐萡箒箸𥴠㶭𥱥蒒篺簆簵𥳁籄粃𤢂粦晽𤕸糉糇糦籴糳糵糎"],["8ea1","繧䔝𦹄絝𦻖璍綉綫焵綳緒𤁗𦀩緤㴓緵𡟹緥𨍭縝𦄡𦅚繮纒䌫鑬縧罀罁罇礶𦋐駡羗𦍑羣𡙡𠁨䕜𣝦䔃𨌺翺𦒉者耈耝耨耯𪂇𦳃耻耼聡𢜔䦉𦘦𣷣𦛨朥肧𨩈脇脚墰𢛶汿𦒘𤾸擧𡒊舘𡡞橓𤩥𤪕䑺舩𠬍𦩒𣵾俹𡓽蓢荢𦬊𤦧𣔰𡝳𣷸芪椛芳䇛"],["8f40","蕋苐茚𠸖𡞴㛁𣅽𣕚艻苢茘𣺋𦶣𦬅𦮗𣗎㶿茝嗬莅䔋𦶥莬菁菓㑾𦻔橗蕚㒖𦹂𢻯葘𥯤葱㷓䓤檧葊𣲵祘蒨𦮖𦹷𦹃蓞萏莑䒠蒓蓤𥲑䉀𥳀䕃蔴嫲𦺙䔧蕳䔖枿蘖"],["8fa1","𨘥𨘻藁𧂈蘂𡖂𧃍䕫䕪蘨㙈𡢢号𧎚虾蝱𪃸蟮𢰧螱蟚蠏噡虬桖䘏衅衆𧗠𣶹𧗤衞袜䙛袴袵揁装睷𧜏覇覊覦覩覧覼𨨥觧𧤤𧪽誜瞓釾誐𧩙竩𧬺𣾏䜓𧬸煼謌謟𥐰𥕥謿譌譍誩𤩺讐讛誯𡛟䘕衏貛𧵔𧶏貫㜥𧵓賖𧶘𧶽贒贃𡤐賛灜贑𤳉㻐起"],["9040","趩𨀂𡀔𤦊㭼𨆼𧄌竧躭躶軃鋔輙輭𨍥𨐒辥錃𪊟𠩐辳䤪𨧞𨔽𣶻廸𣉢迹𪀔𨚼𨔁𢌥㦀𦻗逷𨔼𧪾遡𨕬𨘋邨𨜓郄𨛦邮都酧㫰醩釄粬𨤳𡺉鈎沟鉁鉢𥖹銹𨫆𣲛𨬌𥗛"],["90a1","𠴱錬鍫𨫡𨯫炏嫃𨫢𨫥䥥鉄𨯬𨰹𨯿鍳鑛躼閅閦鐦閠濶䊹𢙺𨛘𡉼𣸮䧟氜陻隖䅬隣𦻕懚隶磵𨫠隽双䦡𦲸𠉴𦐐𩂯𩃥𤫑𡤕𣌊霱虂霶䨏䔽䖅𤫩灵孁霛靜𩇕靗孊𩇫靟鐥僐𣂷𣂼鞉鞟鞱鞾韀韒韠𥑬韮琜𩐳響韵𩐝𧥺䫑頴頳顋顦㬎𧅵㵑𠘰𤅜"],["9140","𥜆飊颷飈飇䫿𦴧𡛓喰飡飦飬鍸餹𤨩䭲𩡗𩤅駵騌騻騐驘𥜥㛄𩂱𩯕髠髢𩬅髴䰎鬔鬭𨘀倴鬴𦦨㣃𣁽魐魀𩴾婅𡡣鮎𤉋鰂鯿鰌𩹨鷔𩾷𪆒𪆫𪃡𪄣𪇟鵾鶃𪄴鸎梈"],["91a1","鷄𢅛𪆓𪈠𡤻𪈳鴹𪂹𪊴麐麕麞麢䴴麪麯𤍤黁㭠㧥㴝伲㞾𨰫鼂鼈䮖鐤𦶢鼗鼖鼹嚟嚊齅馸𩂋韲葿齢齩竜龎爖䮾𤥵𤦻煷𤧸𤍈𤩑玞𨯚𡣺禟𨥾𨸶鍩鏳𨩄鋬鎁鏋𨥬𤒹爗㻫睲穃烐𤑳𤏸煾𡟯炣𡢾𣖙㻇𡢅𥐯𡟸㜢𡛻𡠹㛡𡝴𡣑𥽋㜣𡛀坛𤨥𡏾𡊨"],["9240","𡏆𡒶蔃𣚦蔃葕𤦔𧅥𣸱𥕜𣻻𧁒䓴𣛮𩦝𦼦柹㜳㰕㷧塬𡤢栐䁗𣜿𤃡𤂋𤄏𦰡哋嚞𦚱嚒𠿟𠮨𠸍鏆𨬓鎜仸儫㠙𤐶亼𠑥𠍿佋侊𥙑婨𠆫𠏋㦙𠌊𠐔㐵伩𠋀𨺳𠉵諚𠈌亘"],["92a1","働儍侢伃𤨎𣺊佂倮偬傁俌俥偘僼兙兛兝兞湶𣖕𣸹𣺿浲𡢄𣺉冨凃𠗠䓝𠒣𠒒𠒑赺𨪜𠜎剙劤𠡳勡鍮䙺熌𤎌𠰠𤦬𡃤槑𠸝瑹㻞璙琔瑖玘䮎𤪼𤂍叐㖄爏𤃉喴𠍅响𠯆圝鉝雴鍦埝垍坿㘾壋媙𨩆𡛺𡝯𡜐娬妸銏婾嫏娒𥥆𡧳𡡡𤊕㛵洅瑃娡𥺃"],["9340","媁𨯗𠐓鏠璌𡌃焅䥲鐈𨧻鎽㞠尞岞幞幈𡦖𡥼𣫮廍孏𡤃𡤄㜁𡢠㛝𡛾㛓脪𨩇𡶺𣑲𨦨弌弎𡤧𡞫婫𡜻孄蘔𧗽衠恾𢡠𢘫忛㺸𢖯𢖾𩂈𦽳懀𠀾𠁆𢘛憙憘恵𢲛𢴇𤛔𩅍"],["93a1","摱𤙥𢭪㨩𢬢𣑐𩣪𢹸挷𪑛撶挱揑𤧣𢵧护𢲡搻敫楲㯴𣂎𣊭𤦉𣊫唍𣋠𡣙𩐿曎𣊉𣆳㫠䆐𥖄𨬢𥖏𡛼𥕛𥐥磮𣄃𡠪𣈴㑤𣈏𣆂𤋉暎𦴤晫䮓昰𧡰𡷫晣𣋒𣋡昞𥡲㣑𣠺𣞼㮙𣞢𣏾瓐㮖枏𤘪梶栞㯄檾㡣𣟕𤒇樳橒櫉欅𡤒攑梘橌㯗橺歗𣿀𣲚鎠鋲𨯪𨫋"],["9440","銉𨀞𨧜鑧涥漋𤧬浧𣽿㶏渄𤀼娽渊塇洤硂焻𤌚𤉶烱牐犇犔𤞏𤜥兹𤪤𠗫瑺𣻸𣙟𤩊𤤗𥿡㼆㺱𤫟𨰣𣼵悧㻳瓌琼鎇琷䒟𦷪䕑疃㽣𤳙𤴆㽘畕癳𪗆㬙瑨𨫌𤦫𤦎㫻"],["94a1","㷍𤩎㻿𤧅𤣳釺圲鍂𨫣𡡤僟𥈡𥇧睸𣈲眎眏睻𤚗𣞁㩞𤣰琸璛㺿𤪺𤫇䃈𤪖𦆮錇𥖁砞碍碈磒珐祙𧝁𥛣䄎禛蒖禥樭𣻺稺秴䅮𡛦䄲鈵秱𠵌𤦌𠊙𣶺𡝮㖗啫㕰㚪𠇔𠰍竢婙𢛵𥪯𥪜娍𠉛磰娪𥯆竾䇹籝籭䈑𥮳𥺼𥺦糍𤧹𡞰粎籼粮檲緜縇緓罎𦉡"],["9540","𦅜𧭈綗𥺂䉪𦭵𠤖柖𠁎𣗏埄𦐒𦏸𤥢翝笧𠠬𥫩𥵃笌𥸎駦虅驣樜𣐿㧢𤧷𦖭騟𦖠蒀𧄧𦳑䓪脷䐂胆脉腂𦞴飃𦩂艢艥𦩑葓𦶧蘐𧈛媆䅿𡡀嬫𡢡嫤𡣘蚠蜨𣶏蠭𧐢娂"],["95a1","衮佅袇袿裦襥襍𥚃襔𧞅𧞄𨯵𨯙𨮜𨧹㺭蒣䛵䛏㟲訽訜𩑈彍鈫𤊄旔焩烄𡡅鵭貟賩𧷜妚矃姰䍮㛔踪躧𤰉輰轊䋴汘澻𢌡䢛潹溋𡟚鯩㚵𤤯邻邗啱䤆醻鐄𨩋䁢𨫼鐧𨰝𨰻蓥訫閙閧閗閖𨴴瑅㻂𤣿𤩂𤏪㻧𣈥随𨻧𨹦𨹥㻌𤧭𤩸𣿮琒瑫㻼靁𩂰"],["9640","桇䨝𩂓𥟟靝鍨𨦉𨰦𨬯𦎾銺嬑譩䤼珹𤈛鞛靱餸𠼦巁𨯅𤪲頟𩓚鋶𩗗釥䓀𨭐𤩧𨭤飜𨩅㼀鈪䤥萔餻饍𧬆㷽馛䭯馪驜𨭥𥣈檏騡嫾騯𩣱䮐𩥈馼䮽䮗鍽塲𡌂堢𤦸"],["96a1","𡓨硄𢜟𣶸棅㵽鑘㤧慐𢞁𢥫愇鱏鱓鱻鰵鰐魿鯏𩸭鮟𪇵𪃾鴡䲮𤄄鸘䲰鴌𪆴𪃭𪃳𩤯鶥蒽𦸒𦿟𦮂藼䔳𦶤𦺄𦷰萠藮𦸀𣟗𦁤秢𣖜𣙀䤭𤧞㵢鏛銾鍈𠊿碹鉷鑍俤㑀遤𥕝砽硔碶硋𡝗𣇉𤥁㚚佲濚濙瀞瀞吔𤆵垻壳垊鴖埗焴㒯𤆬燫𦱀𤾗嬨𡞵𨩉"],["9740","愌嫎娋䊼𤒈㜬䭻𨧼鎻鎸𡣖𠼝葲𦳀𡐓𤋺𢰦𤏁妔𣶷𦝁綨𦅛𦂤𤦹𤦋𨧺鋥珢㻩璴𨭣𡢟㻡𤪳櫘珳珻㻖𤨾𤪔𡟙𤩦𠎧𡐤𤧥瑈𤤖炥𤥶銄珦鍟𠓾錱𨫎𨨖鎆𨯧𥗕䤵𨪂煫"],["97a1","𤥃𠳿嚤𠘚𠯫𠲸唂秄𡟺緾𡛂𤩐𡡒䔮鐁㜊𨫀𤦭妰𡢿𡢃𧒄媡㛢𣵛㚰鉟婹𨪁𡡢鍴㳍𠪴䪖㦊僴㵩㵌𡎜煵䋻𨈘渏𩃤䓫浗𧹏灧沯㳖𣿭𣸭渂漌㵯𠏵畑㚼㓈䚀㻚䡱姄鉮䤾轁𨰜𦯀堒埈㛖𡑒烾𤍢𤩱𢿣𡊰𢎽梹楧𡎘𣓥𧯴𣛟𨪃𣟖𣏺𤲟樚𣚭𦲷萾䓟䓎"],["9840","𦴦𦵑𦲂𦿞漗𧄉茽𡜺菭𦲀𧁓𡟛妉媂𡞳婡婱𡤅𤇼㜭姯𡜼㛇熎鎐暚𤊥婮娫𤊓樫𣻹𧜶𤑛𤋊焝𤉙𨧡侰𦴨峂𤓎𧹍𤎽樌𤉖𡌄炦焳𤏩㶥泟勇𤩏繥姫崯㷳彜𤩝𡟟綤萦"],["98a1","咅𣫺𣌀𠈔坾𠣕𠘙㿥𡾞𪊶瀃𩅛嵰玏糓𨩙𩐠俈翧狍猐𧫴猸猹𥛶獁獈㺩𧬘遬燵𤣲珡臶㻊県㻑沢国琙琞琟㻢㻰㻴㻺瓓㼎㽓畂畭畲疍㽼痈痜㿀癍㿗癴㿜発𤽜熈嘣覀塩䀝睃䀹条䁅㗛瞘䁪䁯属瞾矋売砘点砜䂨砹硇硑硦葈𥔵礳栃礲䄃"],["9940","䄉禑禙辻稆込䅧窑䆲窼艹䇄竏竛䇏両筢筬筻簒簛䉠䉺类粜䊌粸䊔糭输烀𠳏総緔緐緽羮羴犟䎗耠耥笹耮耱联㷌垴炠肷胩䏭脌猪脎脒畠脔䐁㬹腖腙腚"],["99a1","䐓堺腼膄䐥膓䐭膥埯臁臤艔䒏芦艶苊苘苿䒰荗险榊萅烵葤惣蒈䔄蒾蓡蓸蔐蔸蕒䔻蕯蕰藠䕷虲蚒蚲蛯际螋䘆䘗袮裿褤襇覑𧥧訩訸誔誴豑賔賲贜䞘塟跃䟭仮踺嗘坔蹱嗵躰䠷軎転軤軭軲辷迁迊迌逳駄䢭飠鈓䤞鈨鉘鉫銱銮銿"],["9a40","鋣鋫鋳鋴鋽鍃鎄鎭䥅䥑麿鐗匁鐝鐭鐾䥪鑔鑹锭関䦧间阳䧥枠䨤靀䨵鞲韂噔䫤惨颹䬙飱塄餎餙冴餜餷饂饝饢䭰駅䮝騼鬏窃魩鮁鯝鯱鯴䱭鰠㝯𡯂鵉鰺"],["9aa1","黾噐鶓鶽鷀鷼银辶鹻麬麱麽黆铜黢黱黸竈齄𠂔𠊷𠎠椚铃妬𠓗塀铁㞹𠗕𠘕𠙶𡚺块煳𠫂𠫍𠮿呪吆𠯋咞𠯻𠰻𠱓𠱥𠱼惧𠲍噺𠲵𠳝𠳭𠵯𠶲𠷈楕鰯螥𠸄𠸎𠻗𠾐𠼭𠹳尠𠾼帋𡁜𡁏𡁶朞𡁻𡂈𡂖㙇𡂿𡃓𡄯𡄻卤蒭𡋣𡍵𡌶讁𡕷𡘙𡟃𡟇乸炻𡠭𡥪"],["9b40","𡨭𡩅𡰪𡱰𡲬𡻈拃𡻕𡼕熘桕𢁅槩㛈𢉼𢏗𢏺𢜪𢡱𢥏苽𢥧𢦓𢫕覥𢫨辠𢬎鞸𢬿顇骽𢱌"],["9b62","𢲈𢲷𥯨𢴈𢴒𢶷𢶕𢹂𢽴𢿌𣀳𣁦𣌟𣏞徱晈暿𧩹𣕧𣗳爁𤦺矗𣘚𣜖纇𠍆墵朎"],["9ba1","椘𣪧𧙗𥿢𣸑𣺹𧗾𢂚䣐䪸𤄙𨪚𤋮𤌍𤀻𤌴𤎖𤩅𠗊凒𠘑妟𡺨㮾𣳿𤐄𤓖垈𤙴㦛𤜯𨗨𩧉㝢𢇃譞𨭎駖𤠒𤣻𤨕爉𤫀𠱸奥𤺥𤾆𠝹軚𥀬劏圿煱𥊙𥐙𣽊𤪧喼𥑆𥑮𦭒釔㑳𥔿𧘲𥕞䜘𥕢𥕦𥟇𤤿𥡝偦㓻𣏌惞𥤃䝼𨥈𥪮𥮉𥰆𡶐垡煑澶𦄂𧰒遖𦆲𤾚譢𦐂𦑊"],["9c40","嵛𦯷輶𦒄𡤜諪𤧶𦒈𣿯𦔒䯀𦖿𦚵𢜛鑥𥟡憕娧晉侻嚹𤔡𦛼乪𤤴陖涏𦲽㘘襷𦞙𦡮𦐑𦡞營𦣇筂𩃀𠨑𦤦鄄𦤹穅鷰𦧺騦𦨭㙟𦑩𠀡禃𦨴𦭛崬𣔙菏𦮝䛐𦲤画补𦶮墶"],["9ca1","㜜𢖍𧁋𧇍㱔𧊀𧊅銁𢅺𧊋錰𧋦𤧐氹钟𧑐𠻸蠧裵𢤦𨑳𡞱溸𤨪𡠠㦤㚹尐秣䔿暶𩲭𩢤襃𧟌𧡘囖䃟𡘊㦡𣜯𨃨𡏅熭荦𧧝𩆨婧䲷𧂯𨦫𧧽𧨊𧬋𧵦𤅺筃祾𨀉澵𪋟樃𨌘厢𦸇鎿栶靝𨅯𨀣𦦵𡏭𣈯𨁈嶅𨰰𨂃圕頣𨥉嶫𤦈斾槕叒𤪥𣾁㰑朶𨂐𨃴𨄮𡾡𨅏"],["9d40","𨆉𨆯𨈚𨌆𨌯𨎊㗊𨑨𨚪䣺揦𨥖砈鉕𨦸䏲𨧧䏟𨧨𨭆𨯔姸𨰉輋𨿅𩃬筑𩄐𩄼㷷𩅞𤫊运犏嚋𩓧𩗩𩖰𩖸𩜲𩣑𩥉𩥪𩧃𩨨𩬎𩵚𩶛纟𩻸𩼣䲤镇𪊓熢𪋿䶑递𪗋䶜𠲜达嗁"],["9da1","辺𢒰边𤪓䔉繿潖檱仪㓤𨬬𧢝㜺躀𡟵𨀤𨭬𨮙𧨾𦚯㷫𧙕𣲷𥘵𥥖亚𥺁𦉘嚿𠹭踎孭𣺈𤲞揞拐𡟶𡡻攰嘭𥱊吚𥌑㷆𩶘䱽嘢嘞罉𥻘奵𣵀蝰东𠿪𠵉𣚺脗鵞贘瘻鱅癎瞹鍅吲腈苷嘥脲萘肽嗪祢噃吖𠺝㗎嘅嗱曱𨋢㘭甴嗰喺咗啲𠱁𠲖廐𥅈𠹶𢱢"],["9e40","𠺢麫絚嗞𡁵抝靭咔賍燶酶揼掹揾啩𢭃鱲𢺳冚㓟𠶧冧呍唞唓癦踭𦢊疱肶蠄螆裇膶萜𡃁䓬猄𤜆宐茋𦢓噻𢛴𧴯𤆣𧵳𦻐𧊶酰𡇙鈈𣳼𪚩𠺬𠻹牦𡲢䝎𤿂𧿹𠿫䃺"],["9ea1","鱝攟𢶠䣳𤟠𩵼𠿬𠸊恢𧖣𠿭"],["9ead","𦁈𡆇熣纎鵐业丄㕷嬍沲卧㚬㧜卽㚥𤘘墚𤭮舭呋垪𥪕𠥹"],["9ec5","㩒𢑥獴𩺬䴉鯭𣳾𩼰䱛𤾩𩖞𩿞葜𣶶𧊲𦞳𣜠挮紥𣻷𣸬㨪逈勌㹴㙺䗩𠒎癀嫰𠺶硺𧼮墧䂿噼鮋嵴癔𪐴麅䳡痹㟻愙𣃚𤏲"],["9ef5","噝𡊩垧𤥣𩸆刴𧂮㖭汊鵼"],["9f40","籖鬹埞𡝬屓擓𩓐𦌵𧅤蚭𠴨𦴢𤫢𠵱"],["9f4f","凾𡼏嶎霃𡷑麁遌笟鬂峑箣扨挵髿篏鬪籾鬮籂粆鰕篼鬉鼗鰛𤤾齚啳寃俽麘俲剠㸆勑坧偖妷帒韈鶫轜呩鞴饀鞺匬愰"],["9fa1","椬叚鰊鴂䰻陁榀傦畆𡝭駚剳"],["9fae","酙隁酜"],["9fb2","酑𨺗捿𦴣櫊嘑醎畺抅𠏼獏籰𥰡𣳽"],["9fc1","𤤙盖鮝个𠳔莾衂"],["9fc9","届槀僭坺刟巵从氱𠇲伹咜哚劚趂㗾弌㗳"],["9fdb","歒酼龥鮗頮颴骺麨麄煺笔"],["9fe7","毺蠘罸"],["9feb","嘠𪙊蹷齓"],["9ff0","跔蹏鸜踁抂𨍽踨蹵竓𤩷稾磘泪詧瘇"],["a040","𨩚鼦泎蟖痃𪊲硓咢贌狢獱謭猂瓱賫𤪻蘯徺袠䒷"],["a055","𡠻𦸅"],["a058","詾𢔛"],["a05b","惽癧髗鵄鍮鮏蟵"],["a063","蠏賷猬霡鮰㗖犲䰇籑饊𦅙慙䰄麖慽"],["a073","坟慯抦戹拎㩜懢厪𣏵捤栂㗒"],["a0a1","嵗𨯂迚𨸹"],["a0a6","僙𡵆礆匲阸𠼻䁥"],["a0ae","矾"],["a0b0","糂𥼚糚稭聦聣絍甅瓲覔舚朌聢𧒆聛瓰脃眤覉𦟌畓𦻑螩蟎臈螌詉貭譃眫瓸蓚㘵榲趦"],["a0d4","覩瑨涹蟁𤀑瓧㷛煶悤憜㳑煢恷"],["a0e2","罱𨬭牐惩䭾删㰘𣳇𥻗𧙖𥔱𡥄𡋾𩤃𦷜𧂭峁𦆭𨨏𣙷𠃮𦡆𤼎䕢嬟𦍌齐麦𦉫"],["a3c0","␀",31,"␡"],["c6a1","①",9,"⑴",9,"ⅰ",9,"丶丿亅亠冂冖冫勹匸卩厶夊宀巛⼳广廴彐彡攴无疒癶辵隶¨ˆヽヾゝゞ〃仝々〆〇ー［］✽ぁ",23],["c740","す",58,"ァアィイ"],["c7a1","ゥ",81,"А",5,"ЁЖ",4],["c840","Л",26,"ёж",25,"⇧↸↹㇏𠃌乚𠂊刂䒑"],["c8a1","龰冈龱𧘇"],["c8cd","￢￤＇＂㈱№℡゛゜⺀⺄⺆⺇⺈⺊⺌⺍⺕⺜⺝⺥⺧⺪⺬⺮⺶⺼⺾⻆⻊⻌⻍⻏⻖⻗⻞⻣"],["c8f5","ʃɐɛɔɵœøŋʊɪ"],["f9fe","￭"],["fa40","𠕇鋛𠗟𣿅蕌䊵珯况㙉𤥂𨧤鍄𡧛苮𣳈砼杄拟𤤳𨦪𠊠𦮳𡌅侫𢓭倈𦴩𧪄𣘀𤪱𢔓倩𠍾徤𠎀𠍇滛𠐟偽儁㑺儎顬㝃萖𤦤𠒇兠𣎴兪𠯿𢃼𠋥𢔰𠖎𣈳𡦃宂蝽𠖳𣲙冲冸"],["faa1","鴴凉减凑㳜凓𤪦决凢卂凭菍椾𣜭彻刋刦刼劵剗劔効勅簕蕂勠蘍𦬓包𨫞啉滙𣾀𠥔𣿬匳卄𠯢泋𡜦栛珕恊㺪㣌𡛨燝䒢卭却𨚫卾卿𡖖𡘓矦厓𨪛厠厫厮玧𥝲㽙玜叁叅汉义埾叙㪫𠮏叠𣿫𢶣叶𠱷吓灹唫晗浛呭𦭓𠵴啝咏咤䞦𡜍𠻝㶴𠵍"],["fb40","𨦼𢚘啇䳭启琗喆喩嘅𡣗𤀺䕒𤐵暳𡂴嘷曍𣊊暤暭噍噏磱囱鞇叾圀囯园𨭦㘣𡉏坆𤆥汮炋坂㚱𦱾埦𡐖堃𡑔𤍣堦𤯵塜墪㕡壠壜𡈼壻寿坃𪅐𤉸鏓㖡够梦㛃湙"],["fba1","𡘾娤啓𡚒蔅姉𠵎𦲁𦴪𡟜姙𡟻𡞲𦶦浱𡠨𡛕姹𦹅媫婣㛦𤦩婷㜈媖瑥嫓𦾡𢕔㶅𡤑㜲𡚸広勐孶斈孼𧨎䀄䡝𠈄寕慠𡨴𥧌𠖥寳宝䴐尅𡭄尓珎尔𡲥𦬨屉䣝岅峩峯嶋𡷹𡸷崐崘嵆𡺤岺巗苼㠭𤤁𢁉𢅳芇㠶㯂帮檊幵幺𤒼𠳓厦亷廐厨𡝱帉廴𨒂"],["fc40","廹廻㢠廼栾鐛弍𠇁弢㫞䢮𡌺强𦢈𢏐彘𢑱彣鞽𦹮彲鍀𨨶徧嶶㵟𥉐𡽪𧃸𢙨釖𠊞𨨩怱暅𡡷㥣㷇㘹垐𢞴祱㹀悞悤悳𤦂𤦏𧩓璤僡媠慤萤慂慈𦻒憁凴𠙖憇宪𣾷"],["fca1","𢡟懓𨮝𩥝懐㤲𢦀𢣁怣慜攞掋𠄘担𡝰拕𢸍捬𤧟㨗搸揸𡎎𡟼撐澊𢸶頔𤂌𥜝擡擥鑻㩦携㩗敍漖𤨨𤨣斅敭敟𣁾斵𤥀䬷旑䃘𡠩无旣忟𣐀昘𣇷𣇸晄𣆤𣆥晋𠹵晧𥇦晳晴𡸽𣈱𨗴𣇈𥌓矅𢣷馤朂𤎜𤨡㬫槺𣟂杞杧杢𤇍𩃭柗䓩栢湐鈼栁𣏦𦶠桝"],["fd40","𣑯槡樋𨫟楳棃𣗍椁椀㴲㨁𣘼㮀枬楡𨩊䋼椶榘㮡𠏉荣傐槹𣙙𢄪橅𣜃檝㯳枱櫈𩆜㰍欝𠤣惞欵歴𢟍溵𣫛𠎵𡥘㝀吡𣭚毡𣻼毜氷𢒋𤣱𦭑汚舦汹𣶼䓅𣶽𤆤𤤌𤤀"],["fda1","𣳉㛥㳫𠴲鮃𣇹𢒑羏样𦴥𦶡𦷫涖浜湼漄𤥿𤂅𦹲蔳𦽴凇沜渝萮𨬡港𣸯瑓𣾂秌湏媑𣁋濸㜍澝𣸰滺𡒗𤀽䕕鏰潄潜㵎潴𩅰㴻澟𤅄濓𤂑𤅕𤀹𣿰𣾴𤄿凟𤅖𤅗𤅀𦇝灋灾炧炁烌烕烖烟䄄㷨熴熖𤉷焫煅媈煊煮岜𤍥煏鍢𤋁焬𤑚𤨧𤨢熺𨯨炽爎"],["fe40","鑂爕夑鑃爤鍁𥘅爮牀𤥴梽牕牗㹕𣁄栍漽犂猪猫𤠣𨠫䣭𨠄猨献珏玪𠰺𦨮珉瑉𤇢𡛧𤨤昣㛅𤦷𤦍𤧻珷琕椃𤨦琹𠗃㻗瑜𢢭瑠𨺲瑇珤瑶莹瑬㜰瑴鏱樬璂䥓𤪌"],["fea1","𤅟𤩹𨮏孆𨰃𡢞瓈𡦈甎瓩甞𨻙𡩋寗𨺬鎅畍畊畧畮𤾂㼄𤴓疎瑝疞疴瘂瘬癑癏癯癶𦏵皐臯㟸𦤑𦤎皡皥皷盌𦾟葢𥂝𥅽𡸜眞眦着撯𥈠睘𣊬瞯𨥤𨥨𡛁矴砉𡍶𤨒棊碯磇磓隥礮𥗠磗礴碱𧘌辸袄𨬫𦂃𢘜禆褀椂禀𥡗禝𧬹礼禩渪𧄦㺨秆𩄍秔"]]');

/***/ }),
/* 39 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var Buffer = (__webpack_require__(17).Buffer);

// NOTE: Due to 'stream' module being pretty large (~100Kb, significant in browser environments), 
// we opt to dependency-inject it instead of creating a hard dependency.
module.exports = function(stream_module) {
    var Transform = stream_module.Transform;

    // == Encoder stream =======================================================

    function IconvLiteEncoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.decodeStrings = false; // We accept only strings, so we don't need to decode them.
        Transform.call(this, options);
    }

    IconvLiteEncoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteEncoderStream }
    });

    IconvLiteEncoderStream.prototype._transform = function(chunk, encoding, done) {
        if (typeof chunk != 'string')
            return done(new Error("Iconv encoding stream needs strings as its input."));
        try {
            var res = this.conv.write(chunk);
            if (res && res.length) this.push(res);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteEncoderStream.prototype._flush = function(done) {
        try {
            var res = this.conv.end();
            if (res && res.length) this.push(res);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteEncoderStream.prototype.collect = function(cb) {
        var chunks = [];
        this.on('error', cb);
        this.on('data', function(chunk) { chunks.push(chunk); });
        this.on('end', function() {
            cb(null, Buffer.concat(chunks));
        });
        return this;
    }


    // == Decoder stream =======================================================

    function IconvLiteDecoderStream(conv, options) {
        this.conv = conv;
        options = options || {};
        options.encoding = this.encoding = 'utf8'; // We output strings.
        Transform.call(this, options);
    }

    IconvLiteDecoderStream.prototype = Object.create(Transform.prototype, {
        constructor: { value: IconvLiteDecoderStream }
    });

    IconvLiteDecoderStream.prototype._transform = function(chunk, encoding, done) {
        if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array))
            return done(new Error("Iconv decoding stream needs buffers as its input."));
        try {
            var res = this.conv.write(chunk);
            if (res && res.length) this.push(res, this.encoding);
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteDecoderStream.prototype._flush = function(done) {
        try {
            var res = this.conv.end();
            if (res && res.length) this.push(res, this.encoding);                
            done();
        }
        catch (e) {
            done(e);
        }
    }

    IconvLiteDecoderStream.prototype.collect = function(cb) {
        var res = '';
        this.on('error', cb);
        this.on('data', function(chunk) { res += chunk; });
        this.on('end', function() {
            cb(null, res);
        });
        return this;
    }

    return {
        IconvLiteEncoderStream: IconvLiteEncoderStream,
        IconvLiteDecoderStream: IconvLiteDecoderStream,
    };
};


/***/ }),
/* 40 */
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),
/* 41 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

// noinspection SpellCheckingInspection



let charsets = [];
let defaultCharsets = [];

class Collation {
  constructor(index, name, charset, maxLength) {
    this.index = index;
    this.name = name;
    this.charset = charset;
    this.maxLength = maxLength;
  }

  static fromCharset(charset) {
    return defaultCharsets[charset === 'utf8mb3' ? 'utf8' : charset];
  }

  static fromIndex(index) {
    if (index >= charsets.length) return undefined;
    return charsets[index];
  }

  static fromName(name) {
    for (let i = 0; i < charsets.length; i++) {
      let collation = charsets[i];
      if (collation && collation.name === name) {
        return collation;
      }
    }
    return undefined;
  }
}

// generated with query :
// SELECT CONCAT('charsets[', CAST(co.ID as char), '] = new Collation(', CAST(co.ID as char), ', \'',
// UPPER(co.COLLATION_NAME), '\', \'', co.CHARACTER_SET_NAME, '\', ', CAST(ca.MAXLEN as char), ');\n')
// FROM information_schema.COLLATIONS co
//   LEFT OUTER JOIN information_schema.CHARACTER_SETS ca ON ca.character_set_name = co.character_set_name
// ORDER BY co.ID ASC;
//then replace "utf8mb4" by "utf8"

charsets[1] = new Collation(1, 'BIG5_CHINESE_CI', 'big5', 2);
charsets[2] = new Collation(2, 'LATIN2_CZECH_CS', 'latin2', 1);
charsets[3] = new Collation(3, 'DEC8_SWEDISH_CI', 'dec8', 1);
charsets[4] = new Collation(4, 'CP850_GENERAL_CI', 'cp850', 1);
charsets[5] = new Collation(5, 'LATIN1_GERMAN1_CI', 'latin1', 1);
charsets[6] = new Collation(6, 'HP8_ENGLISH_CI', 'hp8', 1);
charsets[7] = new Collation(7, 'KOI8R_GENERAL_CI', 'koi8r', 1);
charsets[8] = new Collation(8, 'LATIN1_SWEDISH_CI', 'latin1', 1);
charsets[9] = new Collation(9, 'LATIN2_GENERAL_CI', 'latin2', 1);
charsets[10] = new Collation(10, 'SWE7_SWEDISH_CI', 'swe7', 1);
charsets[11] = new Collation(11, 'ASCII_GENERAL_CI', 'ascii', 1);
charsets[12] = new Collation(12, 'UJIS_JAPANESE_CI', 'ujis', 3);
charsets[13] = new Collation(13, 'SJIS_JAPANESE_CI', 'sjis', 2);
charsets[14] = new Collation(14, 'CP1251_BULGARIAN_CI', 'cp1251', 1);
charsets[15] = new Collation(15, 'LATIN1_DANISH_CI', 'latin1', 1);
charsets[16] = new Collation(16, 'HEBREW_GENERAL_CI', 'hebrew', 1);
charsets[18] = new Collation(18, 'TIS620_THAI_CI', 'tis620', 1);
charsets[19] = new Collation(19, 'EUCKR_KOREAN_CI', 'euckr', 2);
charsets[20] = new Collation(20, 'LATIN7_ESTONIAN_CS', 'latin7', 1);
charsets[21] = new Collation(21, 'LATIN2_HUNGARIAN_CI', 'latin2', 1);
charsets[22] = new Collation(22, 'KOI8U_GENERAL_CI', 'koi8u', 1);
charsets[23] = new Collation(23, 'CP1251_UKRAINIAN_CI', 'cp1251', 1);
charsets[24] = new Collation(24, 'GB2312_CHINESE_CI', 'gb2312', 2);
charsets[25] = new Collation(25, 'GREEK_GENERAL_CI', 'greek', 1);
charsets[26] = new Collation(26, 'CP1250_GENERAL_CI', 'cp1250', 1);
charsets[27] = new Collation(27, 'LATIN2_CROATIAN_CI', 'latin2', 1);
charsets[28] = new Collation(28, 'GBK_CHINESE_CI', 'gbk', 2);
charsets[29] = new Collation(29, 'CP1257_LITHUANIAN_CI', 'cp1257', 1);
charsets[30] = new Collation(30, 'LATIN5_TURKISH_CI', 'latin5', 1);
charsets[31] = new Collation(31, 'LATIN1_GERMAN2_CI', 'latin1', 1);
charsets[32] = new Collation(32, 'ARMSCII8_GENERAL_CI', 'armscii8', 1);
charsets[33] = new Collation(33, 'UTF8_GENERAL_CI', 'utf8', 3);
charsets[34] = new Collation(34, 'CP1250_CZECH_CS', 'cp1250', 1);
charsets[35] = new Collation(35, 'UCS2_GENERAL_CI', 'ucs2', 2);
charsets[36] = new Collation(36, 'CP866_GENERAL_CI', 'cp866', 1);
charsets[37] = new Collation(37, 'KEYBCS2_GENERAL_CI', 'keybcs2', 1);
charsets[38] = new Collation(38, 'MACCE_GENERAL_CI', 'macce', 1);
charsets[39] = new Collation(39, 'MACROMAN_GENERAL_CI', 'macroman', 1);
charsets[40] = new Collation(40, 'CP852_GENERAL_CI', 'cp852', 1);
charsets[41] = new Collation(41, 'LATIN7_GENERAL_CI', 'latin7', 1);
charsets[42] = new Collation(42, 'LATIN7_GENERAL_CS', 'latin7', 1);
charsets[43] = new Collation(43, 'MACCE_BIN', 'macce', 1);
charsets[44] = new Collation(44, 'CP1250_CROATIAN_CI', 'cp1250', 1);
charsets[45] = new Collation(45, 'UTF8MB4_GENERAL_CI', 'utf8', 4);
charsets[46] = new Collation(46, 'UTF8MB4_BIN', 'utf8', 4);
charsets[47] = new Collation(47, 'LATIN1_BIN', 'latin1', 1);
charsets[48] = new Collation(48, 'LATIN1_GENERAL_CI', 'latin1', 1);
charsets[49] = new Collation(49, 'LATIN1_GENERAL_CS', 'latin1', 1);
charsets[50] = new Collation(50, 'CP1251_BIN', 'cp1251', 1);
charsets[51] = new Collation(51, 'CP1251_GENERAL_CI', 'cp1251', 1);
charsets[52] = new Collation(52, 'CP1251_GENERAL_CS', 'cp1251', 1);
charsets[53] = new Collation(53, 'MACROMAN_BIN', 'macroman', 1);
charsets[54] = new Collation(54, 'UTF16_GENERAL_CI', 'utf16', 4);
charsets[55] = new Collation(55, 'UTF16_BIN', 'utf16', 4);
charsets[56] = new Collation(56, 'UTF16LE_GENERAL_CI', 'utf16le', 4);
charsets[57] = new Collation(57, 'CP1256_GENERAL_CI', 'cp1256', 1);
charsets[58] = new Collation(58, 'CP1257_BIN', 'cp1257', 1);
charsets[59] = new Collation(59, 'CP1257_GENERAL_CI', 'cp1257', 1);
charsets[60] = new Collation(60, 'UTF32_GENERAL_CI', 'utf32', 4);
charsets[61] = new Collation(61, 'UTF32_BIN', 'utf32', 4);
charsets[62] = new Collation(62, 'UTF16LE_BIN', 'utf16le', 4);
charsets[63] = new Collation(63, 'BINARY', 'binary', 1);
charsets[64] = new Collation(64, 'ARMSCII8_BIN', 'armscii8', 1);
charsets[65] = new Collation(65, 'ASCII_BIN', 'ascii', 1);
charsets[66] = new Collation(66, 'CP1250_BIN', 'cp1250', 1);
charsets[67] = new Collation(67, 'CP1256_BIN', 'cp1256', 1);
charsets[68] = new Collation(68, 'CP866_BIN', 'cp866', 1);
charsets[69] = new Collation(69, 'DEC8_BIN', 'dec8', 1);
charsets[70] = new Collation(70, 'GREEK_BIN', 'greek', 1);
charsets[71] = new Collation(71, 'HEBREW_BIN', 'hebrew', 1);
charsets[72] = new Collation(72, 'HP8_BIN', 'hp8', 1);
charsets[73] = new Collation(73, 'KEYBCS2_BIN', 'keybcs2', 1);
charsets[74] = new Collation(74, 'KOI8R_BIN', 'koi8r', 1);
charsets[75] = new Collation(75, 'KOI8U_BIN', 'koi8u', 1);
charsets[76] = new Collation(76, 'UTF8_TOLOWER_CI', 'utf8', 3);
charsets[77] = new Collation(77, 'LATIN2_BIN', 'latin2', 1);
charsets[78] = new Collation(78, 'LATIN5_BIN', 'latin5', 1);
charsets[79] = new Collation(79, 'LATIN7_BIN', 'latin7', 1);
charsets[80] = new Collation(80, 'CP850_BIN', 'cp850', 1);
charsets[81] = new Collation(81, 'CP852_BIN', 'cp852', 1);
charsets[82] = new Collation(82, 'SWE7_BIN', 'swe7', 1);
charsets[83] = new Collation(83, 'UTF8_BIN', 'utf8', 3);
charsets[84] = new Collation(84, 'BIG5_BIN', 'big5', 2);
charsets[85] = new Collation(85, 'EUCKR_BIN', 'euckr', 2);
charsets[86] = new Collation(86, 'GB2312_BIN', 'gb2312', 2);
charsets[87] = new Collation(87, 'GBK_BIN', 'gbk', 2);
charsets[88] = new Collation(88, 'SJIS_BIN', 'sjis', 2);
charsets[89] = new Collation(89, 'TIS620_BIN', 'tis620', 1);
charsets[90] = new Collation(90, 'UCS2_BIN', 'ucs2', 2);
charsets[91] = new Collation(91, 'UJIS_BIN', 'ujis', 3);
charsets[92] = new Collation(92, 'GEOSTD8_GENERAL_CI', 'geostd8', 1);
charsets[93] = new Collation(93, 'GEOSTD8_BIN', 'geostd8', 1);
charsets[94] = new Collation(94, 'LATIN1_SPANISH_CI', 'latin1', 1);
charsets[95] = new Collation(95, 'CP932_JAPANESE_CI', 'cp932', 2);
charsets[96] = new Collation(96, 'CP932_BIN', 'cp932', 2);
charsets[97] = new Collation(97, 'EUCJPMS_JAPANESE_CI', 'eucjpms', 3);
charsets[98] = new Collation(98, 'EUCJPMS_BIN', 'eucjpms', 3);
charsets[99] = new Collation(99, 'CP1250_POLISH_CI', 'cp1250', 1);
charsets[101] = new Collation(101, 'UTF16_UNICODE_CI', 'utf16', 4);
charsets[102] = new Collation(102, 'UTF16_ICELANDIC_CI', 'utf16', 4);
charsets[103] = new Collation(103, 'UTF16_LATVIAN_CI', 'utf16', 4);
charsets[104] = new Collation(104, 'UTF16_ROMANIAN_CI', 'utf16', 4);
charsets[105] = new Collation(105, 'UTF16_SLOVENIAN_CI', 'utf16', 4);
charsets[106] = new Collation(106, 'UTF16_POLISH_CI', 'utf16', 4);
charsets[107] = new Collation(107, 'UTF16_ESTONIAN_CI', 'utf16', 4);
charsets[108] = new Collation(108, 'UTF16_SPANISH_CI', 'utf16', 4);
charsets[109] = new Collation(109, 'UTF16_SWEDISH_CI', 'utf16', 4);
charsets[110] = new Collation(110, 'UTF16_TURKISH_CI', 'utf16', 4);
charsets[111] = new Collation(111, 'UTF16_CZECH_CI', 'utf16', 4);
charsets[112] = new Collation(112, 'UTF16_DANISH_CI', 'utf16', 4);
charsets[113] = new Collation(113, 'UTF16_LITHUANIAN_CI', 'utf16', 4);
charsets[114] = new Collation(114, 'UTF16_SLOVAK_CI', 'utf16', 4);
charsets[115] = new Collation(115, 'UTF16_SPANISH2_CI', 'utf16', 4);
charsets[116] = new Collation(116, 'UTF16_ROMAN_CI', 'utf16', 4);
charsets[117] = new Collation(117, 'UTF16_PERSIAN_CI', 'utf16', 4);
charsets[118] = new Collation(118, 'UTF16_ESPERANTO_CI', 'utf16', 4);
charsets[119] = new Collation(119, 'UTF16_HUNGARIAN_CI', 'utf16', 4);
charsets[120] = new Collation(120, 'UTF16_SINHALA_CI', 'utf16', 4);
charsets[121] = new Collation(121, 'UTF16_GERMAN2_CI', 'utf16', 4);
charsets[122] = new Collation(122, 'UTF16_CROATIAN_MYSQL561_CI', 'utf16', 4);
charsets[123] = new Collation(123, 'UTF16_UNICODE_520_CI', 'utf16', 4);
charsets[124] = new Collation(124, 'UTF16_VIETNAMESE_CI', 'utf16', 4);
charsets[128] = new Collation(128, 'UCS2_UNICODE_CI', 'ucs2', 2);
charsets[129] = new Collation(129, 'UCS2_ICELANDIC_CI', 'ucs2', 2);
charsets[130] = new Collation(130, 'UCS2_LATVIAN_CI', 'ucs2', 2);
charsets[131] = new Collation(131, 'UCS2_ROMANIAN_CI', 'ucs2', 2);
charsets[132] = new Collation(132, 'UCS2_SLOVENIAN_CI', 'ucs2', 2);
charsets[133] = new Collation(133, 'UCS2_POLISH_CI', 'ucs2', 2);
charsets[134] = new Collation(134, 'UCS2_ESTONIAN_CI', 'ucs2', 2);
charsets[135] = new Collation(135, 'UCS2_SPANISH_CI', 'ucs2', 2);
charsets[136] = new Collation(136, 'UCS2_SWEDISH_CI', 'ucs2', 2);
charsets[137] = new Collation(137, 'UCS2_TURKISH_CI', 'ucs2', 2);
charsets[138] = new Collation(138, 'UCS2_CZECH_CI', 'ucs2', 2);
charsets[139] = new Collation(139, 'UCS2_DANISH_CI', 'ucs2', 2);
charsets[140] = new Collation(140, 'UCS2_LITHUANIAN_CI', 'ucs2', 2);
charsets[141] = new Collation(141, 'UCS2_SLOVAK_CI', 'ucs2', 2);
charsets[142] = new Collation(142, 'UCS2_SPANISH2_CI', 'ucs2', 2);
charsets[143] = new Collation(143, 'UCS2_ROMAN_CI', 'ucs2', 2);
charsets[144] = new Collation(144, 'UCS2_PERSIAN_CI', 'ucs2', 2);
charsets[145] = new Collation(145, 'UCS2_ESPERANTO_CI', 'ucs2', 2);
charsets[146] = new Collation(146, 'UCS2_HUNGARIAN_CI', 'ucs2', 2);
charsets[147] = new Collation(147, 'UCS2_SINHALA_CI', 'ucs2', 2);
charsets[148] = new Collation(148, 'UCS2_GERMAN2_CI', 'ucs2', 2);
charsets[149] = new Collation(149, 'UCS2_CROATIAN_MYSQL561_CI', 'ucs2', 2);
charsets[150] = new Collation(150, 'UCS2_UNICODE_520_CI', 'ucs2', 2);
charsets[151] = new Collation(151, 'UCS2_VIETNAMESE_CI', 'ucs2', 2);
charsets[159] = new Collation(159, 'UCS2_GENERAL_MYSQL500_CI', 'ucs2', 2);
charsets[160] = new Collation(160, 'UTF32_UNICODE_CI', 'utf32', 4);
charsets[161] = new Collation(161, 'UTF32_ICELANDIC_CI', 'utf32', 4);
charsets[162] = new Collation(162, 'UTF32_LATVIAN_CI', 'utf32', 4);
charsets[163] = new Collation(163, 'UTF32_ROMANIAN_CI', 'utf32', 4);
charsets[164] = new Collation(164, 'UTF32_SLOVENIAN_CI', 'utf32', 4);
charsets[165] = new Collation(165, 'UTF32_POLISH_CI', 'utf32', 4);
charsets[166] = new Collation(166, 'UTF32_ESTONIAN_CI', 'utf32', 4);
charsets[167] = new Collation(167, 'UTF32_SPANISH_CI', 'utf32', 4);
charsets[168] = new Collation(168, 'UTF32_SWEDISH_CI', 'utf32', 4);
charsets[169] = new Collation(169, 'UTF32_TURKISH_CI', 'utf32', 4);
charsets[170] = new Collation(170, 'UTF32_CZECH_CI', 'utf32', 4);
charsets[171] = new Collation(171, 'UTF32_DANISH_CI', 'utf32', 4);
charsets[172] = new Collation(172, 'UTF32_LITHUANIAN_CI', 'utf32', 4);
charsets[173] = new Collation(173, 'UTF32_SLOVAK_CI', 'utf32', 4);
charsets[174] = new Collation(174, 'UTF32_SPANISH2_CI', 'utf32', 4);
charsets[175] = new Collation(175, 'UTF32_ROMAN_CI', 'utf32', 4);
charsets[176] = new Collation(176, 'UTF32_PERSIAN_CI', 'utf32', 4);
charsets[177] = new Collation(177, 'UTF32_ESPERANTO_CI', 'utf32', 4);
charsets[178] = new Collation(178, 'UTF32_HUNGARIAN_CI', 'utf32', 4);
charsets[179] = new Collation(179, 'UTF32_SINHALA_CI', 'utf32', 4);
charsets[180] = new Collation(180, 'UTF32_GERMAN2_CI', 'utf32', 4);
charsets[181] = new Collation(181, 'UTF32_CROATIAN_MYSQL561_CI', 'utf32', 4);
charsets[182] = new Collation(182, 'UTF32_UNICODE_520_CI', 'utf32', 4);
charsets[183] = new Collation(183, 'UTF32_VIETNAMESE_CI', 'utf32', 4);
charsets[192] = new Collation(192, 'UTF8_UNICODE_CI', 'utf8', 3);
charsets[193] = new Collation(193, 'UTF8_ICELANDIC_CI', 'utf8', 3);
charsets[194] = new Collation(194, 'UTF8_LATVIAN_CI', 'utf8', 3);
charsets[195] = new Collation(195, 'UTF8_ROMANIAN_CI', 'utf8', 3);
charsets[196] = new Collation(196, 'UTF8_SLOVENIAN_CI', 'utf8', 3);
charsets[197] = new Collation(197, 'UTF8_POLISH_CI', 'utf8', 3);
charsets[198] = new Collation(198, 'UTF8_ESTONIAN_CI', 'utf8', 3);
charsets[199] = new Collation(199, 'UTF8_SPANISH_CI', 'utf8', 3);
charsets[200] = new Collation(200, 'UTF8_SWEDISH_CI', 'utf8', 3);
charsets[201] = new Collation(201, 'UTF8_TURKISH_CI', 'utf8', 3);
charsets[202] = new Collation(202, 'UTF8_CZECH_CI', 'utf8', 3);
charsets[203] = new Collation(203, 'UTF8_DANISH_CI', 'utf8', 3);
charsets[204] = new Collation(204, 'UTF8_LITHUANIAN_CI', 'utf8', 3);
charsets[205] = new Collation(205, 'UTF8_SLOVAK_CI', 'utf8', 3);
charsets[206] = new Collation(206, 'UTF8_SPANISH2_CI', 'utf8', 3);
charsets[207] = new Collation(207, 'UTF8_ROMAN_CI', 'utf8', 3);
charsets[208] = new Collation(208, 'UTF8_PERSIAN_CI', 'utf8', 3);
charsets[209] = new Collation(209, 'UTF8_ESPERANTO_CI', 'utf8', 3);
charsets[210] = new Collation(210, 'UTF8_HUNGARIAN_CI', 'utf8', 3);
charsets[211] = new Collation(211, 'UTF8_SINHALA_CI', 'utf8', 3);
charsets[212] = new Collation(212, 'UTF8_GERMAN2_CI', 'utf8', 3);
charsets[213] = new Collation(213, 'UTF8_CROATIAN_MYSQL561_CI', 'utf8', 3);
charsets[214] = new Collation(214, 'UTF8_UNICODE_520_CI', 'utf8', 3);
charsets[215] = new Collation(215, 'UTF8_VIETNAMESE_CI', 'utf8', 3);
charsets[223] = new Collation(223, 'UTF8_GENERAL_MYSQL500_CI', 'utf8', 3);
charsets[224] = new Collation(224, 'UTF8MB4_UNICODE_CI', 'utf8', 4);
charsets[225] = new Collation(225, 'UTF8MB4_ICELANDIC_CI', 'utf8', 4);
charsets[226] = new Collation(226, 'UTF8MB4_LATVIAN_CI', 'utf8', 4);
charsets[227] = new Collation(227, 'UTF8MB4_ROMANIAN_CI', 'utf8', 4);
charsets[228] = new Collation(228, 'UTF8MB4_SLOVENIAN_CI', 'utf8', 4);
charsets[229] = new Collation(229, 'UTF8MB4_POLISH_CI', 'utf8', 4);
charsets[230] = new Collation(230, 'UTF8MB4_ESTONIAN_CI', 'utf8', 4);
charsets[231] = new Collation(231, 'UTF8MB4_SPANISH_CI', 'utf8', 4);
charsets[232] = new Collation(232, 'UTF8MB4_SWEDISH_CI', 'utf8', 4);
charsets[233] = new Collation(233, 'UTF8MB4_TURKISH_CI', 'utf8', 4);
charsets[234] = new Collation(234, 'UTF8MB4_CZECH_CI', 'utf8', 4);
charsets[235] = new Collation(235, 'UTF8MB4_DANISH_CI', 'utf8', 4);
charsets[236] = new Collation(236, 'UTF8MB4_LITHUANIAN_CI', 'utf8', 4);
charsets[237] = new Collation(237, 'UTF8MB4_SLOVAK_CI', 'utf8', 4);
charsets[238] = new Collation(238, 'UTF8MB4_SPANISH2_CI', 'utf8', 4);
charsets[239] = new Collation(239, 'UTF8MB4_ROMAN_CI', 'utf8', 4);
charsets[240] = new Collation(240, 'UTF8MB4_PERSIAN_CI', 'utf8', 4);
charsets[241] = new Collation(241, 'UTF8MB4_ESPERANTO_CI', 'utf8', 4);
charsets[242] = new Collation(242, 'UTF8MB4_HUNGARIAN_CI', 'utf8', 4);
charsets[243] = new Collation(243, 'UTF8MB4_SINHALA_CI', 'utf8', 4);
charsets[244] = new Collation(244, 'UTF8MB4_GERMAN2_CI', 'utf8', 4);
charsets[245] = new Collation(245, 'UTF8MB4_CROATIAN_MYSQL561_CI', 'utf8', 4);
charsets[246] = new Collation(246, 'UTF8MB4_UNICODE_520_CI', 'utf8', 4);
charsets[247] = new Collation(247, 'UTF8MB4_VIETNAMESE_CI', 'utf8', 4);
charsets[248] = new Collation(248, 'GB18030_CHINESE_CI', 'gb18030', 4);
charsets[249] = new Collation(249, 'GB18030_BIN', 'gb18030', 4);
charsets[250] = new Collation(250, 'GB18030_UNICODE_520_CI', 'gb18030', 4);
charsets[255] = new Collation(255, 'UTF8MB4_0900_AI_CI', 'utf8', 4);
charsets[256] = new Collation(256, 'UTF8MB4_DE_PB_0900_AI_CI', 'utf8', 4);
charsets[257] = new Collation(257, 'UTF8MB4_IS_0900_AI_CI', 'utf8', 4);
charsets[258] = new Collation(258, 'UTF8MB4_LV_0900_AI_CI', 'utf8', 4);
charsets[259] = new Collation(259, 'UTF8MB4_RO_0900_AI_CI', 'utf8', 4);
charsets[260] = new Collation(260, 'UTF8MB4_SL_0900_AI_CI', 'utf8', 4);
charsets[261] = new Collation(261, 'UTF8MB4_PL_0900_AI_CI', 'utf8', 4);
charsets[262] = new Collation(262, 'UTF8MB4_ET_0900_AI_CI', 'utf8', 4);
charsets[263] = new Collation(263, 'UTF8MB4_ES_0900_AI_CI', 'utf8', 4);
charsets[264] = new Collation(264, 'UTF8MB4_SV_0900_AI_CI', 'utf8', 4);
charsets[265] = new Collation(265, 'UTF8MB4_TR_0900_AI_CI', 'utf8', 4);
charsets[266] = new Collation(266, 'UTF8MB4_CS_0900_AI_CI', 'utf8', 4);
charsets[267] = new Collation(267, 'UTF8MB4_DA_0900_AI_CI', 'utf8', 4);
charsets[268] = new Collation(268, 'UTF8MB4_LT_0900_AI_CI', 'utf8', 4);
charsets[269] = new Collation(269, 'UTF8MB4_SK_0900_AI_CI', 'utf8', 4);
charsets[270] = new Collation(270, 'UTF8MB4_ES_TRAD_0900_AI_CI', 'utf8', 4);
charsets[271] = new Collation(271, 'UTF8MB4_LA_0900_AI_CI', 'utf8', 4);
charsets[273] = new Collation(273, 'UTF8MB4_EO_0900_AI_CI', 'utf8', 4);
charsets[274] = new Collation(274, 'UTF8MB4_HU_0900_AI_CI', 'utf8', 4);
charsets[275] = new Collation(275, 'UTF8MB4_HR_0900_AI_CI', 'utf8', 4);
charsets[277] = new Collation(277, 'UTF8MB4_VI_0900_AI_CI', 'utf8', 4);
charsets[278] = new Collation(278, 'UTF8MB4_0900_AS_CS', 'utf8', 4);
charsets[279] = new Collation(279, 'UTF8MB4_DE_PB_0900_AS_CS', 'utf8', 4);
charsets[280] = new Collation(280, 'UTF8MB4_IS_0900_AS_CS', 'utf8', 4);
charsets[281] = new Collation(281, 'UTF8MB4_LV_0900_AS_CS', 'utf8', 4);
charsets[282] = new Collation(282, 'UTF8MB4_RO_0900_AS_CS', 'utf8', 4);
charsets[283] = new Collation(283, 'UTF8MB4_SL_0900_AS_CS', 'utf8', 4);
charsets[284] = new Collation(284, 'UTF8MB4_PL_0900_AS_CS', 'utf8', 4);
charsets[285] = new Collation(285, 'UTF8MB4_ET_0900_AS_CS', 'utf8', 4);
charsets[286] = new Collation(286, 'UTF8MB4_ES_0900_AS_CS', 'utf8', 4);
charsets[287] = new Collation(287, 'UTF8MB4_SV_0900_AS_CS', 'utf8', 4);
charsets[288] = new Collation(288, 'UTF8MB4_TR_0900_AS_CS', 'utf8', 4);
charsets[289] = new Collation(289, 'UTF8MB4_CS_0900_AS_CS', 'utf8', 4);
charsets[290] = new Collation(290, 'UTF8MB4_DA_0900_AS_CS', 'utf8', 4);
charsets[291] = new Collation(291, 'UTF8MB4_LT_0900_AS_CS', 'utf8', 4);
charsets[292] = new Collation(292, 'UTF8MB4_SK_0900_AS_CS', 'utf8', 4);
charsets[293] = new Collation(293, 'UTF8MB4_ES_TRAD_0900_AS_CS', 'utf8', 4);
charsets[294] = new Collation(294, 'UTF8MB4_LA_0900_AS_CS', 'utf8', 4);
charsets[296] = new Collation(296, 'UTF8MB4_EO_0900_AS_CS', 'utf8', 4);
charsets[297] = new Collation(297, 'UTF8MB4_HU_0900_AS_CS', 'utf8', 4);
charsets[298] = new Collation(298, 'UTF8MB4_HR_0900_AS_CS', 'utf8', 4);
charsets[300] = new Collation(300, 'UTF8MB4_VI_0900_AS_CS', 'utf8', 4);
charsets[303] = new Collation(303, 'UTF8MB4_JA_0900_AS_CS', 'utf8', 4);
charsets[304] = new Collation(304, 'UTF8MB4_JA_0900_AS_CS_KS', 'utf8', 4);
charsets[305] = new Collation(305, 'UTF8MB4_0900_AS_CI', 'utf8', 4);
charsets[306] = new Collation(306, 'UTF8MB4_RU_0900_AI_CI', 'utf8', 4);
charsets[307] = new Collation(307, 'UTF8MB4_RU_0900_AS_CS', 'utf8', 4);
charsets[308] = new Collation(308, 'UTF8MB4_ZH_0900_AS_CS', 'utf8', 4);
charsets[309] = new Collation(309, 'UTF8MB4_0900_BIN', 'utf8', 4);
charsets[576] = new Collation(576, 'UTF8_CROATIAN_CI', 'utf8', 3);
charsets[577] = new Collation(577, 'UTF8_MYANMAR_CI', 'utf8', 3);
charsets[578] = new Collation(578, 'UTF8_THAI_520_W2', 'utf8', 3);
charsets[608] = new Collation(608, 'UTF8MB4_CROATIAN_CI', 'utf8', 4);
charsets[609] = new Collation(609, 'UTF8MB4_MYANMAR_CI', 'utf8', 4);
charsets[610] = new Collation(610, 'UTF8MB4_THAI_520_W2', 'utf8', 4);
charsets[640] = new Collation(640, 'UCS2_CROATIAN_CI', 'ucs2', 2);
charsets[641] = new Collation(641, 'UCS2_MYANMAR_CI', 'ucs2', 2);
charsets[642] = new Collation(642, 'UCS2_THAI_520_W2', 'ucs2', 2);
charsets[672] = new Collation(672, 'UTF16_CROATIAN_CI', 'utf16', 4);
charsets[673] = new Collation(673, 'UTF16_MYANMAR_CI', 'utf16', 4);
charsets[674] = new Collation(674, 'UTF16_THAI_520_W2', 'utf16', 4);
charsets[736] = new Collation(736, 'UTF32_CROATIAN_CI', 'utf32', 4);
charsets[737] = new Collation(737, 'UTF32_MYANMAR_CI', 'utf32', 4);
charsets[738] = new Collation(738, 'UTF32_THAI_520_W2', 'utf32', 4);
charsets[1025] = new Collation(1025, 'BIG5_CHINESE_NOPAD_CI', 'big5', 2);
charsets[1027] = new Collation(1027, 'DEC8_SWEDISH_NOPAD_CI', 'dec8', 1);
charsets[1028] = new Collation(1028, 'CP850_GENERAL_NOPAD_CI', 'cp850', 1);
charsets[1030] = new Collation(1030, 'HP8_ENGLISH_NOPAD_CI', 'hp8', 1);
charsets[1031] = new Collation(1031, 'KOI8R_GENERAL_NOPAD_CI', 'koi8r', 1);
charsets[1032] = new Collation(1032, 'LATIN1_SWEDISH_NOPAD_CI', 'latin1', 1);
charsets[1033] = new Collation(1033, 'LATIN2_GENERAL_NOPAD_CI', 'latin2', 1);
charsets[1034] = new Collation(1034, 'SWE7_SWEDISH_NOPAD_CI', 'swe7', 1);
charsets[1035] = new Collation(1035, 'ASCII_GENERAL_NOPAD_CI', 'ascii', 1);
charsets[1036] = new Collation(1036, 'UJIS_JAPANESE_NOPAD_CI', 'ujis', 3);
charsets[1037] = new Collation(1037, 'SJIS_JAPANESE_NOPAD_CI', 'sjis', 2);
charsets[1040] = new Collation(1040, 'HEBREW_GENERAL_NOPAD_CI', 'hebrew', 1);
charsets[1042] = new Collation(1042, 'TIS620_THAI_NOPAD_CI', 'tis620', 1);
charsets[1043] = new Collation(1043, 'EUCKR_KOREAN_NOPAD_CI', 'euckr', 2);
charsets[1046] = new Collation(1046, 'KOI8U_GENERAL_NOPAD_CI', 'koi8u', 1);
charsets[1048] = new Collation(1048, 'GB2312_CHINESE_NOPAD_CI', 'gb2312', 2);
charsets[1049] = new Collation(1049, 'GREEK_GENERAL_NOPAD_CI', 'greek', 1);
charsets[1050] = new Collation(1050, 'CP1250_GENERAL_NOPAD_CI', 'cp1250', 1);
charsets[1052] = new Collation(1052, 'GBK_CHINESE_NOPAD_CI', 'gbk', 2);
charsets[1054] = new Collation(1054, 'LATIN5_TURKISH_NOPAD_CI', 'latin5', 1);
charsets[1056] = new Collation(1056, 'ARMSCII8_GENERAL_NOPAD_CI', 'armscii8', 1);
charsets[1057] = new Collation(1057, 'UTF8_GENERAL_NOPAD_CI', 'utf8', 3);
charsets[1059] = new Collation(1059, 'UCS2_GENERAL_NOPAD_CI', 'ucs2', 2);
charsets[1060] = new Collation(1060, 'CP866_GENERAL_NOPAD_CI', 'cp866', 1);
charsets[1061] = new Collation(1061, 'KEYBCS2_GENERAL_NOPAD_CI', 'keybcs2', 1);
charsets[1062] = new Collation(1062, 'MACCE_GENERAL_NOPAD_CI', 'macce', 1);
charsets[1063] = new Collation(1063, 'MACROMAN_GENERAL_NOPAD_CI', 'macroman', 1);
charsets[1064] = new Collation(1064, 'CP852_GENERAL_NOPAD_CI', 'cp852', 1);
charsets[1065] = new Collation(1065, 'LATIN7_GENERAL_NOPAD_CI', 'latin7', 1);
charsets[1067] = new Collation(1067, 'MACCE_NOPAD_BIN', 'macce', 1);
charsets[1069] = new Collation(1069, 'UTF8MB4_GENERAL_NOPAD_CI', 'utf8', 4);
charsets[1070] = new Collation(1070, 'UTF8MB4_NOPAD_BIN', 'utf8', 4);
charsets[1071] = new Collation(1071, 'LATIN1_NOPAD_BIN', 'latin1', 1);
charsets[1074] = new Collation(1074, 'CP1251_NOPAD_BIN', 'cp1251', 1);
charsets[1075] = new Collation(1075, 'CP1251_GENERAL_NOPAD_CI', 'cp1251', 1);
charsets[1077] = new Collation(1077, 'MACROMAN_NOPAD_BIN', 'macroman', 1);
charsets[1078] = new Collation(1078, 'UTF16_GENERAL_NOPAD_CI', 'utf16', 4);
charsets[1079] = new Collation(1079, 'UTF16_NOPAD_BIN', 'utf16', 4);
charsets[1080] = new Collation(1080, 'UTF16LE_GENERAL_NOPAD_CI', 'utf16le', 4);
charsets[1081] = new Collation(1081, 'CP1256_GENERAL_NOPAD_CI', 'cp1256', 1);
charsets[1082] = new Collation(1082, 'CP1257_NOPAD_BIN', 'cp1257', 1);
charsets[1083] = new Collation(1083, 'CP1257_GENERAL_NOPAD_CI', 'cp1257', 1);
charsets[1084] = new Collation(1084, 'UTF32_GENERAL_NOPAD_CI', 'utf32', 4);
charsets[1085] = new Collation(1085, 'UTF32_NOPAD_BIN', 'utf32', 4);
charsets[1086] = new Collation(1086, 'UTF16LE_NOPAD_BIN', 'utf16le', 4);
charsets[1088] = new Collation(1088, 'ARMSCII8_NOPAD_BIN', 'armscii8', 1);
charsets[1089] = new Collation(1089, 'ASCII_NOPAD_BIN', 'ascii', 1);
charsets[1090] = new Collation(1090, 'CP1250_NOPAD_BIN', 'cp1250', 1);
charsets[1091] = new Collation(1091, 'CP1256_NOPAD_BIN', 'cp1256', 1);
charsets[1092] = new Collation(1092, 'CP866_NOPAD_BIN', 'cp866', 1);
charsets[1093] = new Collation(1093, 'DEC8_NOPAD_BIN', 'dec8', 1);
charsets[1094] = new Collation(1094, 'GREEK_NOPAD_BIN', 'greek', 1);
charsets[1095] = new Collation(1095, 'HEBREW_NOPAD_BIN', 'hebrew', 1);
charsets[1096] = new Collation(1096, 'HP8_NOPAD_BIN', 'hp8', 1);
charsets[1097] = new Collation(1097, 'KEYBCS2_NOPAD_BIN', 'keybcs2', 1);
charsets[1098] = new Collation(1098, 'KOI8R_NOPAD_BIN', 'koi8r', 1);
charsets[1099] = new Collation(1099, 'KOI8U_NOPAD_BIN', 'koi8u', 1);
charsets[1101] = new Collation(1101, 'LATIN2_NOPAD_BIN', 'latin2', 1);
charsets[1102] = new Collation(1102, 'LATIN5_NOPAD_BIN', 'latin5', 1);
charsets[1103] = new Collation(1103, 'LATIN7_NOPAD_BIN', 'latin7', 1);
charsets[1104] = new Collation(1104, 'CP850_NOPAD_BIN', 'cp850', 1);
charsets[1105] = new Collation(1105, 'CP852_NOPAD_BIN', 'cp852', 1);
charsets[1106] = new Collation(1106, 'SWE7_NOPAD_BIN', 'swe7', 1);
charsets[1107] = new Collation(1107, 'UTF8_NOPAD_BIN', 'utf8', 3);
charsets[1108] = new Collation(1108, 'BIG5_NOPAD_BIN', 'big5', 2);
charsets[1109] = new Collation(1109, 'EUCKR_NOPAD_BIN', 'euckr', 2);
charsets[1110] = new Collation(1110, 'GB2312_NOPAD_BIN', 'gb2312', 2);
charsets[1111] = new Collation(1111, 'GBK_NOPAD_BIN', 'gbk', 2);
charsets[1112] = new Collation(1112, 'SJIS_NOPAD_BIN', 'sjis', 2);
charsets[1113] = new Collation(1113, 'TIS620_NOPAD_BIN', 'tis620', 1);
charsets[1114] = new Collation(1114, 'UCS2_NOPAD_BIN', 'ucs2', 2);
charsets[1115] = new Collation(1115, 'UJIS_NOPAD_BIN', 'ujis', 3);
charsets[1116] = new Collation(1116, 'GEOSTD8_GENERAL_NOPAD_CI', 'geostd8', 1);
charsets[1117] = new Collation(1117, 'GEOSTD8_NOPAD_BIN', 'geostd8', 1);
charsets[1119] = new Collation(1119, 'CP932_JAPANESE_NOPAD_CI', 'cp932', 2);
charsets[1120] = new Collation(1120, 'CP932_NOPAD_BIN', 'cp932', 2);
charsets[1121] = new Collation(1121, 'EUCJPMS_JAPANESE_NOPAD_CI', 'eucjpms', 3);
charsets[1122] = new Collation(1122, 'EUCJPMS_NOPAD_BIN', 'eucjpms', 3);
charsets[1125] = new Collation(1125, 'UTF16_UNICODE_NOPAD_CI', 'utf16', 4);
charsets[1147] = new Collation(1147, 'UTF16_UNICODE_520_NOPAD_CI', 'utf16', 4);
charsets[1152] = new Collation(1152, 'UCS2_UNICODE_NOPAD_CI', 'ucs2', 2);
charsets[1174] = new Collation(1174, 'UCS2_UNICODE_520_NOPAD_CI', 'ucs2', 2);
charsets[1184] = new Collation(1184, 'UTF32_UNICODE_NOPAD_CI', 'utf32', 4);
charsets[1206] = new Collation(1206, 'UTF32_UNICODE_520_NOPAD_CI', 'utf32', 4);
charsets[1216] = new Collation(1216, 'UTF8_UNICODE_NOPAD_CI', 'utf8', 3);
charsets[1238] = new Collation(1238, 'UTF8_UNICODE_520_NOPAD_CI', 'utf8', 3);
charsets[1248] = new Collation(1248, 'UTF8MB4_UNICODE_NOPAD_CI', 'utf8', 4);
charsets[1270] = new Collation(1270, 'UTF8MB4_UNICODE_520_NOPAD_CI', 'utf8', 4);

for (let i = 0; i < charsets.length; i++) {
  let collation = charsets[i];
  if (collation) {
    Collation.prototype[collation.name] = collation;
  }
}

/**
 * Map charset to default collation
 *
 * created with query:
 *  SELECT CONCAT(' defaultCharsets[\'',  co.character_set_name , '\'] = charsets[', CAST(co.ID as char), '];')
 *  FROM information_schema.COLLATIONS co WHERE co.IS_DEFAULT = 'Yes' ORDER BY co.ID ASC;
 */
defaultCharsets['big5'] = charsets[1];
defaultCharsets['dec8'] = charsets[3];
defaultCharsets['cp850'] = charsets[4];
defaultCharsets['hp8'] = charsets[6];
defaultCharsets['koi8r'] = charsets[7];
defaultCharsets['latin1'] = charsets[8];
defaultCharsets['latin2'] = charsets[9];
defaultCharsets['swe7'] = charsets[10];
defaultCharsets['ascii'] = charsets[11];
defaultCharsets['ujis'] = charsets[12];
defaultCharsets['sjis'] = charsets[13];
defaultCharsets['hebrew'] = charsets[16];
defaultCharsets['tis620'] = charsets[18];
defaultCharsets['euckr'] = charsets[19];
defaultCharsets['koi8u'] = charsets[22];
defaultCharsets['gb2312'] = charsets[24];
defaultCharsets['greek'] = charsets[25];
defaultCharsets['cp1250'] = charsets[26];
defaultCharsets['gbk'] = charsets[28];
defaultCharsets['latin5'] = charsets[30];
defaultCharsets['armscii8'] = charsets[32];
defaultCharsets['utf8'] = charsets[33];
defaultCharsets['ucs2'] = charsets[35];
defaultCharsets['cp866'] = charsets[36];
defaultCharsets['keybcs2'] = charsets[37];
defaultCharsets['macce'] = charsets[38];
defaultCharsets['macroman'] = charsets[39];
defaultCharsets['cp852'] = charsets[40];
defaultCharsets['latin7'] = charsets[41];
defaultCharsets['utf8mb4'] = charsets[45];
defaultCharsets['cp1251'] = charsets[51];
defaultCharsets['utf16'] = charsets[54];
defaultCharsets['utf16le'] = charsets[56];
defaultCharsets['cp1256'] = charsets[57];
defaultCharsets['cp1257'] = charsets[59];
defaultCharsets['utf32'] = charsets[60];
defaultCharsets['binary'] = charsets[63];
defaultCharsets['geostd8'] = charsets[92];
defaultCharsets['cp932'] = charsets[95];
defaultCharsets['eucjpms'] = charsets[97];
defaultCharsets['gb18030'] = charsets[248];

module.exports = Collation;


/***/ }),
/* 42 */
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const hexArray = '0123456789ABCDEF'.split('');
const Errors = __webpack_require__(13);
const Iconv = __webpack_require__(16);
const TextEncoder = __webpack_require__(43);

/**
 * Write bytes/hexadecimal value of a byte array to a string.
 * String output example :
 * 38 00 00 00 03 63 72 65  61 74 65 20 74 61 62 6C     8....create tabl
 * 65 20 42 6C 6F 62 54 65  73 74 63 6C 6F 62 74 65     e BlobTestclobte
 * 73 74 32 20 28 73 74 72  6D 20 74 65 78 74 29 20     st2 (strm text)
 * 43 48 41 52 53 45 54 20  75 74 66 38                 CHARSET utf8
 */
module.exports.log = function (opts, buf, off, end, header) {
  let out = [];
  if (!buf) return '';
  if (off === undefined || off === null) off = 0;
  if (end === undefined || end === null) end = buf.length;
  let asciiValue = new Array(16);
  asciiValue[8] = ' ';

  let useHeader = header !== undefined;
  let offset = off || 0;
  const maxLgh = Math.min(useHeader ? opts.debugLen - header.length : opts.debugLen, end - offset);
  const isLimited = end - offset > maxLgh;
  let byteValue;
  let posHexa = 0;
  let pos = 0;

  out.push(
    '+--------------------------------------------------+\n' +
      '|  0  1  2  3  4  5  6  7   8  9  a  b  c  d  e  f |\n' +
      '+--------------------------------------------------+------------------+\n'
  );

  if (useHeader) {
    while (pos < header.length) {
      if (posHexa === 0) out.push('| ');
      byteValue = header[pos++] & 0xff;
      out.push(hexArray[byteValue >>> 4], hexArray[byteValue & 0x0f], ' ');
      asciiValue[posHexa++] = byteValue > 31 && byteValue < 127 ? String.fromCharCode(byteValue) : '.';
      if (posHexa === 8) out.push(' ');
    }
  }

  pos = offset;
  while (pos < maxLgh + offset) {
    if (posHexa === 0) out.push('| ');
    byteValue = buf[pos] & 0xff;

    out.push(hexArray[byteValue >>> 4], hexArray[byteValue & 0x0f], ' ');

    asciiValue[posHexa++] = byteValue > 31 && byteValue < 127 ? String.fromCharCode(byteValue) : '.';

    if (posHexa === 8) out.push(' ');
    if (posHexa === 16) {
      out.push('| ', asciiValue.join(''), ' |\n');
      posHexa = 0;
    }
    pos++;
  }

  let remaining = posHexa;
  if (remaining > 0) {
    if (remaining < 8) {
      for (; remaining < 8; remaining++) {
        out.push('   ');
        asciiValue[posHexa++] = ' ';
      }
      out.push(' ');
    }

    for (; remaining < 16; remaining++) {
      out.push('   ');
      asciiValue[posHexa++] = ' ';
    }

    out.push('| ', asciiValue.join(''), isLimited ? ' |...\n' : ' |\n');
  } else if (isLimited) {
    out[out.length - 1] = ' |...\n';
  }
  out.push('+--------------------------------------------------+------------------+\n');
  return out.join('');
};

module.exports.escapeId = (opts, info, value) => {
  if (!value || value === '') {
    throw Errors.createError('Cannot escape empty ID value', Errors.ER_NULL_ESCAPEID, info, '0A000');
  }
  if (value.includes('\u0000')) {
    throw Errors.createError(
      'Cannot escape ID with null character (u0000)',
      Errors.ER_NULL_CHAR_ESCAPEID,
      info,
      '0A000'
    );
  }

  // always return escaped value, even when there is no special characters
  // to permit working with reserved words
  return '`' + value.replace(/`/g, '``') + '`';
};

const escapeParameters = (opts, info, value) => {
  if (value === undefined || value === null) return 'NULL';

  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'bigint':
    case 'number':
      return '' + value;
    case 'object':
      if (value instanceof Date) {
        return TextEncoder.getLocalDate(value);
      } else if (Buffer.isBuffer(value)) {
        let stValue;
        if (Buffer.isEncoding(info.collation.charset)) {
          stValue = value.toString(info.collation.charset, 0, value.length);
        } else {
          stValue = Iconv.decode(value, info.collation.charset);
        }
        return "_binary'" + escapeString(stValue) + "'";
      } else if (typeof value.toSqlString === 'function') {
        return "'" + escapeString(String(value.toSqlString())) + "'";
      } else if (Array.isArray(value)) {
        let out = opts.arrayParenthesis ? '(' : '';
        for (let i = 0; i < value.length; i++) {
          if (i !== 0) out += ',';
          out += escapeParameters(opts, info, value[i]);
        }
        if (opts.arrayParenthesis) out += ')';
        return out;
      } else {
        if (
          value.type != null &&
          [
            'Point',
            'LineString',
            'Polygon',
            'MultiPoint',
            'MultiLineString',
            'MultiPolygon',
            'GeometryCollection'
          ].includes(value.type)
        ) {
          //GeoJSON format.
          let prefix =
            info &&
            ((info.isMariaDB() && info.hasMinVersion(10, 1, 4)) || (!info.isMariaDB() && info.hasMinVersion(5, 7, 6)))
              ? 'ST_'
              : '';
          switch (value.type) {
            case 'Point':
              return prefix + "PointFromText('POINT(" + TextEncoder.geoPointToString(value.coordinates) + ")')";

            case 'LineString':
              return (
                prefix + "LineFromText('LINESTRING(" + TextEncoder.geoArrayPointToString(value.coordinates) + ")')"
              );

            case 'Polygon':
              return (
                prefix + "PolygonFromText('POLYGON(" + TextEncoder.geoMultiArrayPointToString(value.coordinates) + ")')"
              );

            case 'MultiPoint':
              return (
                prefix +
                "MULTIPOINTFROMTEXT('MULTIPOINT(" +
                TextEncoder.geoArrayPointToString(value.coordinates) +
                ")')"
              );

            case 'MultiLineString':
              return (
                prefix +
                "MLineFromText('MULTILINESTRING(" +
                TextEncoder.geoMultiArrayPointToString(value.coordinates) +
                ")')"
              );

            case 'MultiPolygon':
              return (
                prefix + "MPolyFromText('MULTIPOLYGON(" + TextEncoder.geoMultiPolygonToString(value.coordinates) + ")')"
              );

            case 'GeometryCollection':
              return (
                prefix +
                "GeomCollFromText('GEOMETRYCOLLECTION(" +
                TextEncoder.geometricCollectionToString(value.geometries) +
                ")')"
              );
          }
        } else {
          if (opts.permitSetMultiParamEntries) {
            let out = '';
            let first = true;
            for (let key in value) {
              const val = value[key];
              if (typeof val === 'function') continue;
              if (first) {
                first = false;
              } else {
                out += ',';
              }
              out += '`' + key + '`=';
              out += this.escape(opts, info, val);
            }
            if (out === '') return "'" + escapeString(JSON.stringify(value)) + "'";
            return out;
          } else {
            return "'" + escapeString(JSON.stringify(value)) + "'";
          }
        }
      }
    default:
      return "'" + escapeString(value) + "'";
  }
};

// see https://mariadb.com/kb/en/library/string-literals/
const LITTERAL_ESCAPE = {
  '\u0000': '\\0',
  "'": "\\'",
  '"': '\\"',
  '\b': '\\b',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\u001A': '\\Z',
  '\\': '\\\\'
};

const escapeString = (val) => {
  const pattern = /[\u0000'"\b\n\r\t\u001A\\]/g;

  let offset = 0;
  let escaped = '';
  let match;

  while ((match = pattern.exec(val))) {
    escaped += val.substring(offset, match.index);
    escaped += LITTERAL_ESCAPE[match[0]];
    offset = pattern.lastIndex;
  }

  if (offset === 0) {
    return val;
  }

  if (offset < val.length) {
    escaped += val.substring(offset);
  }

  return escaped;
};

module.exports.escape = escapeParameters;


/***/ }),
/* 43 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const QUOTE = 0x27;

class TextEncoder {
  /**
   * Write (and escape) current parameter value to output writer
   *
   * @param out     output writer
   * @param value   current parameter
   * @param opts    connection options
   * @param info    connection information
   */
  writeParam(out, value, opts, info) {
    switch (typeof value) {
      case 'boolean':
        out.writeStringAscii(value ? 'true' : 'false');
        break;
      case 'bigint':
      case 'number':
        out.writeStringAscii('' + value);
        break;
      case 'object':
        if (value == null) {
          out.writeStringAscii('NULL');
        } else if (value instanceof Date) {
          out.writeStringAscii(TextEncoder.getLocalDate(value));
        } else if (Buffer.isBuffer(value)) {
          out.writeStringAscii("_BINARY '");
          out.writeBufferEscape(value);
          out.writeInt8(QUOTE);
        } else if (typeof value.toSqlString === 'function') {
          out.writeStringEscapeQuote(String(value.toSqlString()));
        } else if (Array.isArray(value)) {
          if (opts.arrayParenthesis) {
            out.writeStringAscii('(');
          }
          for (let i = 0; i < value.length; i++) {
            if (i !== 0) out.writeStringAscii(',');
            this.writeParam(out, value[i], opts, info);
          }
          if (opts.arrayParenthesis) {
            out.writeStringAscii(')');
          }
        } else {
          if (
            value.type != null &&
            [
              'Point',
              'LineString',
              'Polygon',
              'MultiPoint',
              'MultiLineString',
              'MultiPolygon',
              'GeometryCollection'
            ].includes(value.type)
          ) {
            //GeoJSON format.
            let prefix =
              (info.isMariaDB() && info.hasMinVersion(10, 1, 4)) || (!info.isMariaDB() && info.hasMinVersion(5, 7, 6))
                ? 'ST_'
                : '';
            switch (value.type) {
              case 'Point':
                out.writeStringAscii(
                  prefix + "PointFromText('POINT(" + TextEncoder.geoPointToString(value.coordinates) + ")')"
                );
                break;

              case 'LineString':
                out.writeStringAscii(
                  prefix + "LineFromText('LINESTRING(" + TextEncoder.geoArrayPointToString(value.coordinates) + ")')"
                );
                break;

              case 'Polygon':
                out.writeStringAscii(
                  prefix +
                    "PolygonFromText('POLYGON(" +
                    TextEncoder.geoMultiArrayPointToString(value.coordinates) +
                    ")')"
                );
                break;

              case 'MultiPoint':
                out.writeStringAscii(
                  prefix +
                    "MULTIPOINTFROMTEXT('MULTIPOINT(" +
                    TextEncoder.geoArrayPointToString(value.coordinates) +
                    ")')"
                );
                break;

              case 'MultiLineString':
                out.writeStringAscii(
                  prefix +
                    "MLineFromText('MULTILINESTRING(" +
                    TextEncoder.geoMultiArrayPointToString(value.coordinates) +
                    ")')"
                );
                break;

              case 'MultiPolygon':
                out.writeStringAscii(
                  prefix +
                    "MPolyFromText('MULTIPOLYGON(" +
                    TextEncoder.geoMultiPolygonToString(value.coordinates) +
                    ")')"
                );
                break;

              case 'GeometryCollection':
                out.writeStringAscii(
                  prefix +
                    "GeomCollFromText('GEOMETRYCOLLECTION(" +
                    TextEncoder.geometricCollectionToString(value.geometries) +
                    ")')"
                );
                break;
            }
          } else {
            if (opts.permitSetMultiParamEntries) {
              let first = true;
              for (let key in value) {
                const val = value[key];
                if (typeof val === 'function') continue;
                if (first) {
                  first = false;
                } else {
                  out.writeStringAscii(',');
                }
                out.writeString('`' + key + '`');
                out.writeStringAscii('=');
                this.writeParam(out, val, opts, info);
              }
              if (first) out.writeStringEscapeQuote(JSON.stringify(value));
            } else {
              out.writeStringEscapeQuote(JSON.stringify(value));
            }
          }
        }
        break;
      default:
        if (value == null) {
          out.writeStringAscii('NULL');
        } else {
          out.writeStringEscapeQuote(value);
        }
    }
  }

  static geometricCollectionToString(geo) {
    if (!geo) return '';
    let st = '';
    for (let i = 0; i < geo.length; i++) {
      //GeoJSON format.
      st += i !== 0 ? ',' : '';
      switch (geo[i].type) {
        case 'Point':
          st += `POINT(${TextEncoder.geoPointToString(geo[i].coordinates)})`;
          break;

        case 'LineString':
          st += `LINESTRING(${TextEncoder.geoArrayPointToString(geo[i].coordinates)})`;
          break;

        case 'Polygon':
          st += `POLYGON(${TextEncoder.geoMultiArrayPointToString(geo[i].coordinates)})`;
          break;

        case 'MultiPoint':
          st += `MULTIPOINT(${TextEncoder.geoArrayPointToString(geo[i].coordinates)})`;
          break;

        case 'MultiLineString':
          st += `MULTILINESTRING(${TextEncoder.geoMultiArrayPointToString(geo[i].coordinates)})`;
          break;

        case 'MultiPolygon':
          st += `MULTIPOLYGON(${TextEncoder.geoMultiPolygonToString(geo[i].coordinates)})`;
          break;
      }
    }
    return st;
  }

  static geoMultiPolygonToString(coords) {
    if (!coords) return '';
    let st = '';
    for (let i = 0; i < coords.length; i++) {
      st += (i !== 0 ? ',(' : '(') + TextEncoder.geoMultiArrayPointToString(coords[i]) + ')';
    }
    return st;
  }

  static geoMultiArrayPointToString(coords) {
    if (!coords) return '';
    let st = '';
    for (let i = 0; i < coords.length; i++) {
      st += (i !== 0 ? ',(' : '(') + TextEncoder.geoArrayPointToString(coords[i]) + ')';
    }
    return st;
  }

  static geoArrayPointToString(coords) {
    if (!coords) return '';
    let st = '';
    for (let i = 0; i < coords.length; i++) {
      st += (i !== 0 ? ',' : '') + TextEncoder.geoPointToString(coords[i]);
    }
    return st;
  }

  static geoPointToString(coords) {
    if (!coords) return '';
    return (isNaN(coords[0]) ? '' : coords[0]) + ' ' + (isNaN(coords[1]) ? '' : coords[1]);
  }

  static getLocalDate(date) {
    const year = date.getFullYear();
    const mon = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    const ms = date.getMilliseconds();

    //return 'YYYY-MM-DD HH:MM:SS' datetime format
    //see https://mariadb.com/kb/en/library/datetime/
    return (
      "'" +
      TextEncoder.formatDigit(year, 4) +
      '-' +
      TextEncoder.formatDigit(mon, 2) +
      '-' +
      TextEncoder.formatDigit(day, 2) +
      ' ' +
      TextEncoder.formatDigit(hour, 2) +
      ':' +
      TextEncoder.formatDigit(min, 2) +
      ':' +
      TextEncoder.formatDigit(sec, 2) +
      (ms > 0 ? '.' + TextEncoder.formatDigit(ms, 3) : '') +
      "'"
    );
  }
  static formatDigit(val, significantDigit) {
    let res = '' + val;
    while (res.length < significantDigit) res = '0' + res;
    return res;
  }
}

module.exports = TextEncoder;


/***/ }),
/* 44 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Iconv = __webpack_require__(16);
const Utils = __webpack_require__(42);
const Errors = __webpack_require__(13);
const Collations = __webpack_require__(41);

const QUOTE = 0x27;
const DBL_QUOTE = 0x22;
const ZERO_BYTE = 0x00;
const SLASH = 0x5c;

//increase by level to avoid buffer copy.
const SMALL_BUFFER_SIZE = 256;
const MEDIUM_BUFFER_SIZE = 16384; //16k
const LARGE_BUFFER_SIZE = 131072; //128k
const BIG_BUFFER_SIZE = 1048576; //1M
const MAX_BUFFER_SIZE = 16777219; //16M + 4
const CHARS_GLOBAL_REGEXP = /[\0\"\'\\\b\n\r\t\u001A]/g; // eslint-disable-line no-control-regex

/**
 * MySQL packet builder.
 *
 * @param opts    options
 * @param info    connection info
 * @constructor
 */
class PacketOutputStream {
  constructor(opts, info) {
    this.opts = opts;
    this.info = info;
    this.pos = 4;
    this.markPos = -1;
    this.bufContainDataAfterMark = false;
    this.cmdLength = 0;
    this.buf = Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    this.maxAllowedPacket = opts.maxAllowedPacket || 4194304;
    this.maxPacketLength = Math.min(MAX_BUFFER_SIZE, this.maxAllowedPacket + 4);

    this.changeEncoding(this.opts.collation ? this.opts.collation : Collations.fromIndex(224));
    this.changeDebug(this.opts.debug);

    this.opts.on('collation', this.changeEncoding.bind(this));
    this.opts.on('debug', this.changeDebug.bind(this));
  }

  changeEncoding(collation) {
    this.encoding = collation.charset;
    if (this.encoding === 'utf8') {
      this.writeString = this.writeDefaultBufferString;
      this.encodeString = this.encodeNodeString;
      this.writeLengthEncodedString = this.writeDefaultBufferLengthEncodedString;
      this.writeStringEscapeQuote = this.writeUtf8StringEscapeQuote;
    } else if (Buffer.isEncoding(this.encoding)) {
      this.writeString = this.writeDefaultBufferString;
      this.encodeString = this.encodeNodeString;
      this.writeLengthEncodedString = this.writeDefaultBufferLengthEncodedString;
      this.writeStringEscapeQuote = this.writeDefaultStringEscapeQuote;
    } else {
      this.writeString = this.writeDefaultIconvString;
      this.encodeString = this.encodeIconvString;
      this.writeLengthEncodedString = this.writeDefaultIconvLengthEncodedString;
      this.writeStringEscapeQuote = this.writeDefaultStringEscapeQuote;
    }
  }

  changeDebug(debug) {
    this.debug = debug;
    this.flushBuffer = debug ? this.flushBufferDebug : this.flushBufferBasic;
    this.fastFlush = debug ? this.fastFlushDebug : this.fastFlushBasic;
  }

  setStream(stream) {
    this.stream = stream;
  }

  growBuffer(len) {
    let newCapacity;
    if (len + this.pos < MEDIUM_BUFFER_SIZE) {
      newCapacity = MEDIUM_BUFFER_SIZE;
    } else if (len + this.pos < LARGE_BUFFER_SIZE) {
      newCapacity = LARGE_BUFFER_SIZE;
    } else if (len + this.pos < BIG_BUFFER_SIZE) {
      newCapacity = BIG_BUFFER_SIZE;
    } else {
      newCapacity = MAX_BUFFER_SIZE;
    }

    if (len + this.pos > newCapacity) {
      if (this.markPos !== -1) {
        // buf is > 16M with mark.
        // flush until mark, reset pos at beginning
        this.flushBufferStopAtMark();

        if (len + this.pos <= this.buf.length) {
          return;
        }
        this.growBuffer(len);
      }
    }

    let newBuf = Buffer.allocUnsafe(newCapacity);
    this.buf.copy(newBuf, 0, 0, this.pos);
    this.buf = newBuf;
  }

  mark() {
    this.markPos = this.pos;
  }

  isMarked() {
    return this.markPos !== -1;
  }

  hasFlushed() {
    return this.cmd.sequenceNo !== -1;
  }

  bufIsDataAfterMark() {
    return this.bufContainDataAfterMark;
  }

  bufIsAfterMaxPacketLength() {
    return this.pos > this.maxPacketLength;
  }

  /**
   * Reset mark flag and send bytes after mark flag.
   *
   * @return buffer after mark flag
   */
  resetMark() {
    this.pos = this.markPos;
    this.markPos = -1;
    if (this.bufContainDataAfterMark) {
      const data = Buffer.allocUnsafe(this.pos - 4);
      this.buf.copy(data, 0, 4, this.pos);
      this.cmd.sequenceNo = -1;
      this.cmd.compressSequenceNo = -1;
      this.bufContainDataAfterMark = false;
      return data;
    }
    return null;
  }

  /**
   * Send packet to socket.
   *
   * @throws IOException if socket error occur.
   */
  flush() {
    this.flushBuffer(true, 0);
    this.buf = Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    this.cmd.sequenceNo = -1;
    this.cmd.compressSequenceNo = -1;
    this.cmdLength = 0;
    this.markPos = -1;
  }

  flushPacket() {
    this.flushBuffer(false, 0);
    this.buf = Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    this.cmdLength = 0;
    this.markPos = -1;
  }

  startPacket(cmd) {
    this.cmd = cmd;
    this.pos = 4;
  }

  writeInt8(value) {
    if (this.pos + 1 >= this.buf.length) {
      if (this.pos >= MAX_BUFFER_SIZE && !this.bufContainDataAfterMark) {
        //buffer is more than a Packet, must flushBuffer()
        this.flushBuffer(false, 1);
      } else this.growBuffer(1);
    }
    this.buf[this.pos++] = value;
  }

  writeInt16(value) {
    if (this.pos + 2 >= this.buf.length) {
      let b = Buffer.allocUnsafe(2);
      b[0] = value;
      b[1] = value >>> 8;
      this.writeBuffer(b, 0, 2);
      return;
    }
    this.buf[this.pos] = value;
    this.buf[this.pos + 1] = value >> 8;
    this.pos += 2;
  }

  writeInt16AtPos(initPos) {
    this.buf[initPos] = this.pos - initPos - 2;
    this.buf[initPos + 1] = (this.pos - initPos - 2) >> 8;
  }

  writeInt24(value) {
    if (this.pos + 3 >= this.buf.length) {
      //not enough space remaining
      let arr = Buffer.allocUnsafe(3);
      arr[0] = value;
      arr[1] = value >> 8;
      arr[2] = value >> 16;
      this.writeBuffer(arr, 0, 3);
      return;
    }

    this.buf[this.pos] = value;
    this.buf[this.pos + 1] = value >> 8;
    this.buf[this.pos + 2] = value >> 16;
    this.pos += 3;
  }

  writeInt32(value) {
    if (this.pos + 4 >= this.buf.length) {
      //not enough space remaining
      let arr = Buffer.allocUnsafe(4);
      arr.writeInt32LE(value, 0);
      this.writeBuffer(arr, 0, 4);
      return;
    }

    this.buf[this.pos] = value;
    this.buf[this.pos + 1] = value >> 8;
    this.buf[this.pos + 2] = value >> 16;
    this.buf[this.pos + 3] = value >> 24;
    this.pos += 4;
  }

  writeBigInt(value) {
    if (this.pos + 8 >= this.buf.length) {
      //not enough space remaining
      let arr = Buffer.allocUnsafe(8);
      arr.writeBigInt64LE(value, 0);
      this.writeBuffer(arr, 0, 8);
      return;
    }
    this.buf.writeBigInt64LE(value, this.pos);
    this.pos += 8;
  }

  writeDouble(value) {
    if (this.pos + 8 >= this.buf.length) {
      //not enough space remaining
      let arr = Buffer.allocUnsafe(8);
      arr.writeDoubleLE(value, 0);
      this.writeBuffer(arr, 0, 8);
      return;
    }
    this.buf.writeDoubleLE(value, this.pos);
    this.pos += 8;
  }

  writeLengthCoded(len) {
    if (len < 0xfb) {
      this.writeInt8(len);
      return;
    }

    if (len < 65536) {
      //max length is len < 0xffff
      this.writeInt8(0xfc);
      this.writeInt16(len);
    } else if (len < 16777216) {
      this.writeInt8(0xfd);
      this.writeInt24(len);
    } else {
      this.writeInt8(0xfe);
      this.writeBigInt(BigInt(len));
    }
  }

  writeBuffer(arr, off, len) {
    if (len > this.buf.length - this.pos) {
      if (this.buf.length !== MAX_BUFFER_SIZE) {
        this.growBuffer(len);
      }

      //max buffer size
      if (len > this.buf.length - this.pos) {
        if (this.markPos !== -1) {
          this.growBuffer(len);
          if (this.markPos !== -1) {
            this.flushBufferStopAtMark();
          }
        }

        if (len > this.buf.length - this.pos) {
          //not enough space in buffer, will stream :
          // fill buffer and flush until all data are snd
          let remainingLen = len;

          while (true) {
            //filling buffer
            let lenToFillBuffer = Math.min(MAX_BUFFER_SIZE - this.pos, remainingLen);
            arr.copy(this.buf, this.pos, off, off + lenToFillBuffer);
            remainingLen -= lenToFillBuffer;
            off += lenToFillBuffer;
            this.pos += lenToFillBuffer;

            if (remainingLen === 0) return;
            this.flushBuffer(false, remainingLen);
          }
        }
      }
    }

    // node.js copy is fast only when copying big buffer.
    // quick array copy is multiple time faster for small copy
    if (len > 50) {
      arr.copy(this.buf, this.pos, off, off + len);
      this.pos += len;
    } else {
      for (let i = 0; i < len; i++) {
        this.buf[this.pos++] = arr[off + i];
      }
    }
  }

  /**
   * Write ascii string to socket (no escaping)
   *
   * @param str                string
   */
  writeStringAscii(str) {
    let len = str.length;

    //not enough space remaining
    if (len >= this.buf.length - this.pos) {
      let strBuf = Buffer.from(str, 'ascii');
      this.writeBuffer(strBuf, 0, strBuf.length);
      return;
    }

    for (let off = 0; off < len; ) {
      this.buf[this.pos++] = str.charCodeAt(off++);
    }
  }

  writeLengthEncodedBuffer(buffer) {
    const len = buffer.length;
    this.writeLengthCoded(len);
    this.writeBuffer(buffer, 0, len);
  }

  writeUtf8StringEscapeQuote(str) {
    const charsLength = str.length;

    //not enough space remaining
    if (charsLength * 3 + 2 >= this.buf.length - this.pos) {
      const arr = Buffer.from(str, 'utf8');
      this.writeInt8(QUOTE);
      this.writeBufferEscape(arr);
      this.writeInt8(QUOTE);
      return;
    }

    //create UTF-8 byte array
    //since javascript char are internally using UTF-16 using surrogate's pattern, 4 bytes unicode characters will
    //represent 2 characters : example "\uD83C\uDFA4" = 🎤 unicode 8 "no microphones"
    //so max size is 3 * charLength
    //(escape characters are 1 byte encoded, so length might only be 2 when escaped)
    // + 2 for the quotes for text protocol
    let charsOffset = 0;
    let currChar;
    this.buf[this.pos++] = QUOTE;
    //quick loop if only ASCII chars for faster escape
    for (; charsOffset < charsLength && (currChar = str.charCodeAt(charsOffset)) < 0x80; charsOffset++) {
      if (currChar === SLASH || currChar === QUOTE || currChar === ZERO_BYTE || currChar === DBL_QUOTE) {
        this.buf[this.pos++] = SLASH;
      }
      this.buf[this.pos++] = currChar;
    }

    //if quick loop not finished
    while (charsOffset < charsLength) {
      currChar = str.charCodeAt(charsOffset++);
      if (currChar < 0x80) {
        if (currChar === SLASH || currChar === QUOTE || currChar === ZERO_BYTE || currChar === DBL_QUOTE) {
          this.buf[this.pos++] = SLASH;
        }
        this.buf[this.pos++] = currChar;
      } else if (currChar < 0x800) {
        this.buf[this.pos++] = 0xc0 | (currChar >> 6);
        this.buf[this.pos++] = 0x80 | (currChar & 0x3f);
      } else if (currChar >= 0xd800 && currChar < 0xe000) {
        //reserved for surrogate - see https://en.wikipedia.org/wiki/UTF-16
        if (currChar < 0xdc00) {
          //is high surrogate
          if (charsOffset + 1 > charsLength) {
            this.buf[this.pos++] = 0x3f;
          } else {
            const nextChar = str.charCodeAt(charsOffset);
            if (nextChar >= 0xdc00 && nextChar < 0xe000) {
              //is low surrogate
              const surrogatePairs = (currChar << 10) + nextChar + (0x010000 - (0xd800 << 10) - 0xdc00);
              this.buf[this.pos++] = 0xf0 | (surrogatePairs >> 18);
              this.buf[this.pos++] = 0x80 | ((surrogatePairs >> 12) & 0x3f);
              this.buf[this.pos++] = 0x80 | ((surrogatePairs >> 6) & 0x3f);
              this.buf[this.pos++] = 0x80 | (surrogatePairs & 0x3f);
              charsOffset++;
            } else {
              //must have low surrogate
              this.buf[this.pos++] = 0x3f;
            }
          }
        } else {
          //low surrogate without high surrogate before
          this.buf[this.pos++] = 0x3f;
        }
      } else {
        this.buf[this.pos++] = 0xe0 | (currChar >> 12);
        this.buf[this.pos++] = 0x80 | ((currChar >> 6) & 0x3f);
        this.buf[this.pos++] = 0x80 | (currChar & 0x3f);
      }
    }
    this.buf[this.pos++] = QUOTE;
  }

  encodeIconvString(str) {
    return Iconv.encode(str, this.encoding);
  }

  encodeNodeString(str) {
    return Buffer.from(str, this.encoding);
  }

  writeDefaultBufferString(str) {
    //javascript use UCS-2 or UTF-16 string internal representation
    //that means that string to byte will be a maximum of * 3
    // (4 bytes utf-8 are represented on 2 UTF-16 characters)
    if (str.length * 3 < this.buf.length - this.pos) {
      this.pos += this.buf.write(str, this.pos, this.encoding);
      return;
    }

    //checking real length
    let byteLength = Buffer.byteLength(str, this.encoding);
    if (byteLength > this.buf.length - this.pos) {
      if (this.buf.length < MAX_BUFFER_SIZE) {
        this.growBuffer(byteLength);
      }
      if (byteLength > this.buf.length - this.pos) {
        //not enough space in buffer, will stream :
        let strBuf = Buffer.from(str, this.encoding);
        this.writeBuffer(strBuf, 0, strBuf.length);
        return;
      }
    }
    this.pos += this.buf.write(str, this.pos, this.encoding);
  }

  writeDefaultBufferLengthEncodedString(str) {
    //javascript use UCS-2 or UTF-16 string internal representation
    //that means that string to byte will be a maximum of * 3
    // (4 bytes utf-8 are represented on 2 UTF-16 characters)
    //checking real length
    let byteLength = Buffer.byteLength(str, this.encoding);
    this.writeLengthCoded(byteLength);

    if (byteLength > this.buf.length - this.pos) {
      if (this.buf.length < MAX_BUFFER_SIZE) {
        this.growBuffer(byteLength);
      }
      if (byteLength > this.buf.length - this.pos) {
        //not enough space in buffer, will stream :
        let strBuf = Buffer.from(str, this.encoding);
        this.writeBuffer(strBuf, 0, strBuf.length);
        return;
      }
    }
    this.pos += this.buf.write(str, this.pos, this.encoding);
  }

  writeDefaultIconvString(str) {
    let buf = Iconv.encode(str, this.encoding);
    this.writeBuffer(buf, 0, buf.length);
  }

  writeDefaultIconvLengthEncodedString(str) {
    let buf = Iconv.encode(str, this.encoding);
    this.writeLengthCoded(buf.length);
    this.writeBuffer(buf, 0, buf.length);
  }

  /**
   * Parameters need to be properly escaped :
   * following characters are to be escaped by "\" :
   * - \0
   * - \\
   * - \'
   * - \"
   * regex split part of string writing part, and escaping special char.
   * Those chars are <= 7f meaning that this will work even with multi-byte encoding
   *
   * @param str string to escape.
   */
  writeDefaultStringEscapeQuote(str) {
    this.writeInt8(QUOTE);
    let match;
    let lastIndex = 0;
    while ((match = CHARS_GLOBAL_REGEXP.exec(str)) !== null) {
      this.writeString(str.slice(lastIndex, match.index));
      this.writeInt8(SLASH);
      this.writeInt8(match[0].charCodeAt(0));
      lastIndex = CHARS_GLOBAL_REGEXP.lastIndex;
    }

    if (lastIndex === 0) {
      // Nothing was escaped
      this.writeString(str);
      this.writeInt8(QUOTE);
      return;
    }

    if (lastIndex < str.length) {
      this.writeString(str.slice(lastIndex));
    }
    this.writeInt8(QUOTE);
  }

  writeBinaryDate(date) {
    const year = date.getFullYear();
    const mon = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();
    const ms = date.getMilliseconds();

    let len = ms === 0 ? 7 : 11;
    //not enough space remaining
    if (len + 1 > this.buf.length - this.pos) {
      let tmpBuf = Buffer.allocUnsafe(len + 1);

      tmpBuf[0] = len;
      tmpBuf[1] = year;
      tmpBuf[2] = year >>> 8;
      tmpBuf[3] = mon;
      tmpBuf[4] = day;
      tmpBuf[5] = hour;
      tmpBuf[6] = min;
      tmpBuf[7] = sec;
      if (ms !== 0) {
        const micro = ms * 1000;
        tmpBuf[8] = micro;
        tmpBuf[9] = micro >>> 8;
        tmpBuf[10] = micro >>> 16;
        tmpBuf[11] = micro >>> 24;
      }

      this.writeBuffer(tmpBuf, 0, len + 1);
      return;
    }

    this.buf[this.pos] = len;
    this.buf[this.pos + 1] = year;
    this.buf[this.pos + 2] = year >>> 8;
    this.buf[this.pos + 3] = mon;
    this.buf[this.pos + 4] = day;
    this.buf[this.pos + 5] = hour;
    this.buf[this.pos + 6] = min;
    this.buf[this.pos + 7] = sec;

    if (ms !== 0) {
      const micro = ms * 1000;
      this.buf[this.pos + 8] = micro;
      this.buf[this.pos + 9] = micro >>> 8;
      this.buf[this.pos + 10] = micro >>> 16;
      this.buf[this.pos + 11] = micro >>> 24;
    }
    this.pos += len + 1;
  }

  writeBufferEscape(val) {
    let valLen = val.length;
    if (valLen * 2 > this.buf.length - this.pos) {
      //makes buffer bigger (up to 16M)
      if (this.buf.length !== MAX_BUFFER_SIZE) this.growBuffer(valLen * 2);

      //data may still be bigger than buffer.
      //must flush buffer when full (and reset position to 4)
      if (valLen * 2 > this.buf.length - this.pos) {
        //not enough space in buffer, will fill buffer
        for (let i = 0; i < valLen; i++) {
          switch (val[i]) {
            case QUOTE:
            case SLASH:
            case DBL_QUOTE:
            case ZERO_BYTE:
              if (this.pos >= this.buf.length) this.flushBuffer(false, (valLen - i) * 2);
              this.buf[this.pos++] = SLASH; //add escape slash
          }
          if (this.pos >= this.buf.length) this.flushBuffer(false, (valLen - i) * 2);
          this.buf[this.pos++] = val[i];
        }
        return;
      }
    }

    //sure to have enough place to use buffer directly
    for (let i = 0; i < valLen; i++) {
      switch (val[i]) {
        case QUOTE:
        case SLASH:
        case DBL_QUOTE:
        case ZERO_BYTE:
          this.buf[this.pos++] = SLASH; //add escape slash
      }
      this.buf[this.pos++] = val[i];
    }
  }

  /**
   * Count query size. If query size is greater than max_allowed_packet and nothing has been already
   * send, throw an exception to avoid having the connection closed.
   *
   * @param length additional length to query size
   * @param info current connection information
   * @throws Error if query has not to be send.
   */
  checkMaxAllowedLength(length, info) {
    if (this.cmdLength + length >= this.maxAllowedPacket) {
      // launch exception only if no packet has been send.
      return Errors.createFatalError(
        `query size (${this.cmdLength + length}) is >= to max_allowed_packet (${this.maxAllowedPacket})`,
        Errors.ER_MAX_ALLOWED_PACKET,
        info
      );
    }
    return null;
  }

  /**
   * Indicate if buffer contain any data.
   * @returns {boolean}
   */
  isEmpty() {
    return this.pos <= 4;
  }

  /**
   * Flush the internal buffer.
   */
  flushBufferDebug(commandEnd, remainingLen) {
    if (this.pos > 4) {
      this.buf[0] = this.pos - 4;
      this.buf[1] = (this.pos - 4) >>> 8;
      this.buf[2] = (this.pos - 4) >>> 16;
      this.buf[3] = ++this.cmd.sequenceNo;
      this.stream.writeBuf(this.buf.subarray(0, this.pos), this.cmd);
      this.stream.flush(true, this.cmd);
      this.cmdLength += this.pos - 4;

      this.opts.logger.network(
        `==> conn:${this.info.threadId ? this.info.threadId : -1} ${
          this.cmd.constructor.name + '(0,' + this.pos + ')'
        }\n${Utils.log(this.opts, this.buf, 0, this.pos)}`
      );

      if (commandEnd && this.pos === MAX_BUFFER_SIZE) {
        //if last packet fill the max size, must send an empty com to indicate that command end.
        this.writeEmptyPacket();
      }
      this.pos = 4;
    }
  }

  /**
   * Flush to last mark.
   */
  flushBufferStopAtMark() {
    const end = this.pos;
    this.pos = this.markPos;
    const tmpBuf = Buffer.allocUnsafe(Math.max(SMALL_BUFFER_SIZE, end + 4 - this.pos));
    this.buf.copy(tmpBuf, 4, this.markPos, end);
    this.flushBuffer(true, end - this.pos);
    this.cmdLength = 0;
    this.buf = tmpBuf;
    this.pos = 4 + end - this.markPos;
    this.markPos = -1;
    this.bufContainDataAfterMark = true;
  }

  flushBufferBasic(commandEnd, remainingLen) {
    this.buf[0] = this.pos - 4;
    this.buf[1] = (this.pos - 4) >>> 8;
    this.buf[2] = (this.pos - 4) >>> 16;
    this.buf[3] = ++this.cmd.sequenceNo;
    this.stream.writeBuf(this.buf.subarray(0, this.pos), this.cmd);
    this.stream.flush(true, this.cmd);
    this.cmdLength += this.pos - 4;
    if (commandEnd && this.pos === MAX_BUFFER_SIZE) {
      //if last packet fill the max size, must send an empty com to indicate that command end.
      this.writeEmptyPacket();
    }
    this.pos = 4;
  }

  fastFlushDebug(cmd, packet) {
    this.stream.writeBuf(packet, cmd);
    this.stream.flush(true, cmd);
    this.cmdLength += packet.length;

    this.opts.logger.network(
      `==> conn:${this.info.threadId ? this.info.threadId : -1} ${
        cmd.constructor.name + '(0,' + packet.length + ')'
      }\n${Utils.log(this.opts, packet, 0, packet.length)}`
    );
    this.cmdLength = 0;
    this.markPos = -1;
  }

  fastFlushBasic(cmd, packet) {
    this.stream.writeBuf(packet, cmd);
    this.stream.flush(true, cmd);
    this.cmdLength = 0;
    this.markPos = -1;
  }

  writeEmptyPacket() {
    const emptyBuf = Buffer.from([0x00, 0x00, 0x00, ++this.cmd.sequenceNo]);

    if (this.debug) {
      this.opts.logger.network(
        `==> conn:${this.info.threadId ? this.info.threadId : -1} ${this.cmd.constructor.name}(0,4)\n${Utils.log(
          this.opts,
          emptyBuf,
          0,
          4
        )}`
      );
    }

    this.stream.writeBuf(emptyBuf, this.cmd);
    this.stream.flush(true, this.cmd);
    this.cmdLength = 0;
  }
}

module.exports = PacketOutputStream;


/***/ }),
/* 45 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const ZLib = __webpack_require__(46);
const Utils = __webpack_require__(42);

/**
 * MySQL packet parser
 * see : https://mariadb.com/kb/en/library/0-packet/
 */
class CompressionInputStream {
  constructor(reader, receiveQueue, opts, info) {
    this.reader = reader;
    this.receiveQueue = receiveQueue;
    this.info = info;
    this.opts = opts;
    this.header = Buffer.allocUnsafe(7);
    this.headerLen = 0;
    this.compressPacketLen = null;
    this.packetLen = null;
    this.remainingLen = null;

    this.parts = null;
    this.partsTotalLen = 0;
  }

  receivePacket(chunk) {
    let cmd = this.currentCmd();
    if (this.opts.debugCompress) {
      this.opts.logger.network(
        `<== conn:${this.info.threadId ? this.info.threadId : -1} ${
          cmd
            ? cmd.onPacketReceive
              ? cmd.constructor.name + '.' + cmd.onPacketReceive.name
              : cmd.constructor.name
            : 'no command'
        } (compress)\n${Utils.log(this.opts, chunk, 0, chunk.length, this.header)}`
      );
    }
    if (cmd) cmd.compressSequenceNo = this.header[3];
    const unCompressLen = this.header[4] | (this.header[5] << 8) | (this.header[6] << 16);
    if (unCompressLen === 0) {
      this.reader.onData(chunk);
    } else {
      //use synchronous inflating, to ensure FIFO packet order
      const unCompressChunk = ZLib.inflateSync(chunk);
      this.reader.onData(unCompressChunk);
    }
  }

  currentCmd() {
    let cmd;
    while ((cmd = this.receiveQueue.peek())) {
      if (cmd.onPacketReceive) return cmd;
      this.receiveQueue.shift();
    }
    return null;
  }

  resetHeader() {
    this.remainingLen = null;
    this.headerLen = 0;
  }

  onData(chunk) {
    let pos = 0;
    let length;
    const chunkLen = chunk.length;

    do {
      if (this.remainingLen) {
        length = this.remainingLen;
      } else if (this.headerLen === 0 && chunkLen - pos >= 7) {
        this.header[0] = chunk[pos];
        this.header[1] = chunk[pos + 1];
        this.header[2] = chunk[pos + 2];
        this.header[3] = chunk[pos + 3];
        this.header[4] = chunk[pos + 4];
        this.header[5] = chunk[pos + 5];
        this.header[6] = chunk[pos + 6];
        this.headerLen = 7;
        pos += 7;
        this.compressPacketLen = this.header[0] + (this.header[1] << 8) + (this.header[2] << 16);
        this.packetLen = this.header[4] | (this.header[5] << 8) | (this.header[6] << 16);
        if (this.packetLen === 0) this.packetLen = this.compressPacketLen;
        length = this.compressPacketLen;
      } else {
        length = null;
        while (chunkLen - pos > 0) {
          this.header[this.headerLen++] = chunk[pos++];
          if (this.headerLen === 7) {
            this.compressPacketLen = this.header[0] + (this.header[1] << 8) + (this.header[2] << 16);
            this.packetLen = this.header[4] | (this.header[5] << 8) | (this.header[6] << 16);
            if (this.packetLen === 0) this.packetLen = this.compressPacketLen;
            length = this.compressPacketLen;
            break;
          }
        }
      }

      if (length) {
        if (chunkLen - pos >= length) {
          const buf = chunk.subarray(pos, pos + length);
          pos += length;
          if (this.parts) {
            this.parts.push(buf);
            this.partsTotalLen += length;

            if (this.compressPacketLen < 0xffffff) {
              let buf = Buffer.concat(this.parts, this.partsTotalLen);
              this.parts = null;
              this.receivePacket(buf);
            }
          } else {
            if (this.compressPacketLen < 0xffffff) {
              this.receivePacket(buf);
            } else {
              this.parts = [buf];
              this.partsTotalLen = length;
            }
          }
          this.resetHeader();
        } else {
          const buf = chunk.subarray(pos, chunkLen);
          if (!this.parts) {
            this.parts = [buf];
            this.partsTotalLen = chunkLen - pos;
          } else {
            this.parts.push(buf);
            this.partsTotalLen += chunkLen - pos;
          }
          this.remainingLen = length - (chunkLen - pos);
          return;
        }
      }
    } while (pos < chunkLen);
  }
}

module.exports = CompressionInputStream;


/***/ }),
/* 46 */
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ }),
/* 47 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Utils = __webpack_require__(42);
const ZLib = __webpack_require__(46);

//increase by level to avoid buffer copy.
const SMALL_BUFFER_SIZE = 2048;
const MEDIUM_BUFFER_SIZE = 131072; //128k
const LARGE_BUFFER_SIZE = 1048576; //1M
const MAX_BUFFER_SIZE = 16777222; //16M + 7

/**
/**
 * MySQL compression filter.
 * see https://mariadb.com/kb/en/library/0-packet/#compressed-packet
 */
class CompressionOutputStream {
  /**
   * Constructor
   *
   * @param socket    current socket
   * @param opts      current connection options
   * @param info      current connection information
   * @constructor
   */
  constructor(socket, opts, info) {
    this.info = info;
    this.opts = opts;
    this.pos = 7;
    this.header = Buffer.allocUnsafe(7);
    this.buf = Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    this.writer = (buffer) => {
      socket.write(buffer);
    };
  }

  growBuffer(len) {
    let newCapacity;
    if (len + this.pos < MEDIUM_BUFFER_SIZE) {
      newCapacity = MEDIUM_BUFFER_SIZE;
    } else if (len + this.pos < LARGE_BUFFER_SIZE) {
      newCapacity = LARGE_BUFFER_SIZE;
    } else newCapacity = MAX_BUFFER_SIZE;

    let newBuf = Buffer.allocUnsafe(newCapacity);
    this.buf.copy(newBuf, 0, 0, this.pos);
    this.buf = newBuf;
  }

  writeBuf(arr, cmd) {
    let off = 0,
      len = arr.length;
    if (arr instanceof Uint8Array) {
      arr = Buffer.from(arr);
    }
    if (len > this.buf.length - this.pos) {
      if (this.buf.length !== MAX_BUFFER_SIZE) {
        this.growBuffer(len);
      }

      //max buffer size
      if (len > this.buf.length - this.pos) {
        //not enough space in buffer, will stream :
        // fill buffer and flush until all data are snd
        let remainingLen = len;

        while (true) {
          //filling buffer
          let lenToFillBuffer = Math.min(MAX_BUFFER_SIZE - this.pos, remainingLen);
          arr.copy(this.buf, this.pos, off, off + lenToFillBuffer);
          remainingLen -= lenToFillBuffer;
          off += lenToFillBuffer;
          this.pos += lenToFillBuffer;

          if (remainingLen === 0) return;
          this.flush(false, cmd, remainingLen);
        }
      }
    }
    arr.copy(this.buf, this.pos, off, off + len);
    this.pos += len;
  }

  /**
   * Flush the internal buffer.
   */
  flush(cmdEnd, cmd, remainingLen) {
    if (this.pos < 1536) {
      //*******************************************************************************
      // small packet, no compression
      //*******************************************************************************

      this.buf[0] = this.pos - 7;
      this.buf[1] = (this.pos - 7) >>> 8;
      this.buf[2] = (this.pos - 7) >>> 16;
      this.buf[3] = ++cmd.compressSequenceNo;
      this.buf[4] = 0;
      this.buf[5] = 0;
      this.buf[6] = 0;

      if (this.opts.debugCompress) {
        this.opts.logger.network(
          `==> conn:${this.info.threadId ? this.info.threadId : -1} ${
            cmd ? cmd.constructor.name + '(0,' + this.pos + ')' : 'unknown'
          } (compress)\n${Utils.log(this.opts, this.buf, 0, this.pos)}`
        );
      }

      this.writer(this.buf.subarray(0, this.pos));
    } else {
      //*******************************************************************************
      // compressing packet
      //*******************************************************************************
      //use synchronous inflating, to ensure FIFO packet order
      const compressChunk = ZLib.deflateSync(this.buf.subarray(7, this.pos));
      const compressChunkLen = compressChunk.length;

      this.header[0] = compressChunkLen;
      this.header[1] = compressChunkLen >>> 8;
      this.header[2] = compressChunkLen >>> 16;
      this.header[3] = ++cmd.compressSequenceNo;
      this.header[4] = this.pos - 7;
      this.header[5] = (this.pos - 7) >>> 8;
      this.header[6] = (this.pos - 7) >>> 16;

      if (this.opts.debugCompress) {
        this.opts.logger.network(
          `==> conn:${this.info.threadId ? this.info.threadId : -1} ${
            cmd ? cmd.constructor.name + '(0,' + this.pos + '=>' + compressChunkLen + ')' : 'unknown'
          } (compress)\n${Utils.log(this.opts, compressChunk, 0, compressChunkLen, this.header)}`
        );
      }

      this.writer(this.header);
      this.writer(compressChunk);
      if (cmdEnd && compressChunkLen === MAX_BUFFER_SIZE) this.writeEmptyPacket(cmd);
      this.header = Buffer.allocUnsafe(7);
    }
    this.buf = remainingLen
      ? CompressionOutputStream.allocateBuffer(remainingLen)
      : Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    this.pos = 7;
  }

  static allocateBuffer(len) {
    if (len + 4 < SMALL_BUFFER_SIZE) {
      return Buffer.allocUnsafe(SMALL_BUFFER_SIZE);
    } else if (len + 4 < MEDIUM_BUFFER_SIZE) {
      return Buffer.allocUnsafe(MEDIUM_BUFFER_SIZE);
    } else if (len + 4 < LARGE_BUFFER_SIZE) {
      return Buffer.allocUnsafe(LARGE_BUFFER_SIZE);
    }
    return Buffer.allocUnsafe(MAX_BUFFER_SIZE);
  }

  writeEmptyPacket(cmd) {
    const emptyBuf = Buffer.from([0x00, 0x00, 0x00, cmd.compressSequenceNo, 0x00, 0x00, 0x00]);

    if (this.opts.debugCompress) {
      this.opts.logger.network(
        `==> conn:${this.info.threadId ? this.info.threadId : -1} ${
          cmd ? cmd.constructor.name + '(0,' + this.pos + ')' : 'unknown'
        } (compress)\n${Utils.log(this.opts, emptyBuf, 0, 7)}`
      );
    }

    this.writer(emptyBuf);
  }
}

module.exports = CompressionOutputStream;


/***/ }),
/* 48 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * possible server status flag value
 * see https://mariadb.com/kb/en/library/ok_packet/#server-status-flag
 * @type {number}
 */
//A transaction is currently active
module.exports.STATUS_IN_TRANS = 1;
//Autocommit mode is set
module.exports.STATUS_AUTOCOMMIT = 2;
//more results exists (more packet follow)
module.exports.MORE_RESULTS_EXISTS = 8;
module.exports.QUERY_NO_GOOD_INDEX_USED = 16;
module.exports.QUERY_NO_INDEX_USED = 32;
//when using COM_STMT_FETCH, indicate that current cursor still has result (deprecated)
module.exports.STATUS_CURSOR_EXISTS = 64;
//when using COM_STMT_FETCH, indicate that current cursor has finished to send results (deprecated)
module.exports.STATUS_LAST_ROW_SENT = 128;
//database has been dropped
module.exports.STATUS_DB_DROPPED = 1 << 8;
//current escape mode is "no backslash escape"
module.exports.STATUS_NO_BACKSLASH_ESCAPES = 1 << 9;
//A DDL change did have an impact on an existing PREPARE (an automatic re-prepare has been executed)
module.exports.STATUS_METADATA_CHANGED = 1 << 10;
module.exports.QUERY_WAS_SLOW = 1 << 11;
//this result-set contain stored procedure output parameter
module.exports.PS_OUT_PARAMS = 1 << 12;
//current transaction is a read-only transaction
module.exports.STATUS_IN_TRANS_READONLY = 1 << 13;
//session state change. see Session change type for more information
module.exports.SESSION_STATE_CHANGED = 1 << 14;


/***/ }),
/* 49 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



class ConnectionInformation {
  #redirectFct;
  constructor(opts, redirectFct) {
    this.threadId = -1;
    this.status = null;
    this.serverVersion = null;
    this.serverCapabilities = null;
    this.database = opts.database;
    this.port = opts.port;
    this.#redirectFct = redirectFct;
    this.redirectRequest = null;
  }

  hasMinVersion(major, minor, patch) {
    if (!this.serverVersion) throw new Error('cannot know if server version until connection is established');

    if (!major) throw new Error('a major version must be set');

    if (!minor) minor = 0;
    if (!patch) patch = 0;

    let ver = this.serverVersion;
    return (
      ver.major > major ||
      (ver.major === major && ver.minor > minor) ||
      (ver.major === major && ver.minor === minor && ver.patch >= patch)
    );
  }

  redirect(value, resolve) {
    return this.#redirectFct(value, resolve);
  }

  isMariaDB() {
    if (!this.serverVersion) throw new Error('cannot know if server is MariaDB until connection is established');
    return this.serverVersion.mariaDb;
  }

  /**
   * Parse raw info to set server major/minor/patch values
   * @param info
   */
  static parseVersionString(info) {
    let car;
    let offset = 0;
    let type = 0;
    let val = 0;

    for (; offset < info.serverVersion.raw.length; offset++) {
      car = info.serverVersion.raw.charCodeAt(offset);
      if (car < 48 || car > 57) {
        switch (type) {
          case 0:
            info.serverVersion.major = val;
            break;
          case 1:
            info.serverVersion.minor = val;
            break;
          case 2:
            info.serverVersion.patch = val;
            return;
        }
        type++;
        val = 0;
      } else {
        val = val * 10 + car - 48;
      }
    }
    //serverVersion finished by number like "5.5.57", assign patchVersion
    if (type === 2) info.serverVersion.patch = val;
  }
}

module.exports = ConnectionInformation;


/***/ }),
/* 50 */
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),
/* 51 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * Capabilities list ( with 'CLIENT_' removed)
 * see : https://mariadb.com/kb/en/library/1-connecting-connecting/#capabilities
 */
/* mysql/old mariadb server/client */
module.exports.MYSQL = 1n;
/* Found instead of affected rows */
module.exports.FOUND_ROWS = 2n;
/* get all column flags */
module.exports.LONG_FLAG = 4n;
/* one can specify db on connect */
module.exports.CONNECT_WITH_DB = 8n;
/* don't allow database.table.column */
module.exports.NO_SCHEMA = 1n << 4n;
/* can use compression protocol */
module.exports.COMPRESS = 1n << 5n;
/* odbc client */
module.exports.ODBC = 1n << 6n;
/* can use LOAD DATA LOCAL */
module.exports.LOCAL_FILES = 1n << 7n;
/* ignore spaces before '' */
module.exports.IGNORE_SPACE = 1n << 8n;
/* new 4.1 protocol */
module.exports.PROTOCOL_41 = 1n << 9n;
/* this is an interactive client */
module.exports.INTERACTIVE = 1n << 10n;
/* switch to ssl after handshake */
module.exports.SSL = 1n << 11n;
/* IGNORE sigpipes */
module.exports.IGNORE_SIGPIPE = 1n << 12n;
/* client knows about transactions */
module.exports.TRANSACTIONS = 1n << 13n;
/* old flag for 4.1 protocol  */
module.exports.RESERVED = 1n << 14n;
/* new 4.1 authentication */
module.exports.SECURE_CONNECTION = 1n << 15n;
/* enable/disable multi-stmt support */
module.exports.MULTI_STATEMENTS = 1n << 16n;
/* enable/disable multi-results */
module.exports.MULTI_RESULTS = 1n << 17n;
/* multi-results in ps-protocol */
module.exports.PS_MULTI_RESULTS = 1n << 18n;
/* client supports plugin authentication */
module.exports.PLUGIN_AUTH = 1n << 19n;
/* permits connection attributes */
module.exports.CONNECT_ATTRS = 1n << 20n;
/* Enable authentication response packet to be larger than 255 bytes. */
module.exports.PLUGIN_AUTH_LENENC_CLIENT_DATA = 1n << 21n;
/* Don't close the connection for a connection with expired password. */
module.exports.CAN_HANDLE_EXPIRED_PASSWORDS = 1n << 22n;
/* Capable of handling server state change information. Its a hint to the
  server to include the state change information in Ok packet. */
module.exports.SESSION_TRACK = 1n << 23n;
/* Client no longer needs EOF packet */
module.exports.DEPRECATE_EOF = 1n << 24n;
module.exports.SSL_VERIFY_SERVER_CERT = 1n << 30n;

/* MariaDB extended capabilities */

/* Permit bulk insert*/
module.exports.MARIADB_CLIENT_STMT_BULK_OPERATIONS = 1n << 34n;

/* Clients supporting extended metadata */
module.exports.MARIADB_CLIENT_EXTENDED_TYPE_INFO = 1n << 35n;
module.exports.MARIADB_CLIENT_CACHE_METADATA = 1n << 36n;


/***/ }),
/* 52 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Collations = __webpack_require__(41);
const urlFormat = /mariadb:\/\/(([^/@:]+)?(:([^/]+))?@)?(([^/:]+)(:([0-9]+))?)\/([^?]+)(\?(.*))?$/;

/**
 * Default option similar to mysql driver.
 * known differences
 * - no queryFormat option. Permitting client to parse is a security risk. Best is to give SQL + parameters
 *   Only possible Objects are :
 *   - Buffer
 *   - Date
 *   - Object that implement toSqlString function
 *   - JSON object
 * + rowsAsArray (in mysql2) permit to have rows by index, not by name. Avoiding to parsing metadata string => faster
 */
class ConnectionOptions {
  constructor(opts) {
    if (typeof opts === 'string') {
      opts = ConnectionOptions.parse(opts);
    }

    if (!opts) opts = {};
    this.host = opts.host || 'localhost';
    this.port = opts.port || 3306;
    this.keepEof = opts.keepEof || false;
    this.user = opts.user || process.env.USERNAME;
    this.password = opts.password;
    this.database = opts.database;
    this.stream = opts.stream;

    // log
    this.debug = opts.debug || false;
    this.debugCompress = opts.debugCompress || false;
    this.debugLen = opts.debugLen || 256;
    this.logParam = opts.logParam === undefined ? true : opts.logParam === true;
    if (opts.logger) {
      if (typeof opts.logger === 'function') {
        this.logger = {
          network: opts.logger,
          query: opts.logger,
          error: opts.logger,
          warning: opts.logger
        };
      } else {
        this.logger = {
          network: opts.logger.network,
          query: opts.logger.query,
          error: opts.logger.error,
          warning: opts.logger.warning || console.log
        };
        if (opts.logger.logParam !== undefined) this.logParam = opts.logger.logParam;
      }
    } else {
      this.logger = { network: null, query: null, error: null, warning: console.log };
      if ((this.debug || this.debugCompress) && !this.logger.network) {
        this.logger.network = console.log;
      }
    }
    this.debug = !!this.logger.network;

    if (opts.charset && typeof opts.charset === 'string') {
      this.collation = Collations.fromCharset(opts.charset.toLowerCase());
      if (this.collation === undefined) {
        this.collation = Collations.fromName(opts.charset.toUpperCase());
        if (this.collation !== undefined) {
          this.logger.warning(
            "warning: please use option 'collation' " +
              "in replacement of 'charset' when using a collation name ('" +
              opts.charset +
              "')\n" +
              "(collation looks like 'UTF8MB4_UNICODE_CI', charset like 'utf8')."
          );
        } else {
          this.charset = opts.charset;
        }
      }
    } else if (opts.collation && typeof opts.collation === 'string') {
      this.collation = Collations.fromName(opts.collation.toUpperCase());
      if (this.collation === undefined) throw new RangeError("Unknown collation '" + opts.collation + "'");
    } else {
      this.collation = opts.charsetNumber ? Collations.fromIndex(opts.charsetNumber) : undefined;
    }

    // connection options
    this.permitRedirect = opts.permitRedirect === undefined ? true : opts.permitRedirect;
    this.initSql = opts.initSql;
    this.connectTimeout = opts.connectTimeout === undefined ? 1000 : opts.connectTimeout;
    this.connectAttributes = opts.connectAttributes || false;
    this.compress = opts.compress || false;
    this.rsaPublicKey = opts.rsaPublicKey;
    this.cachingRsaPublicKey = opts.cachingRsaPublicKey;
    this.allowPublicKeyRetrieval = opts.allowPublicKeyRetrieval || false;
    this.forceVersionCheck = opts.forceVersionCheck || false;
    this.maxAllowedPacket = opts.maxAllowedPacket;
    this.permitConnectionWhenExpired = opts.permitConnectionWhenExpired || false;
    this.pipelining = opts.pipelining;
    this.timezone = opts.timezone || 'local';
    this.socketPath = opts.socketPath;
    this.sessionVariables = opts.sessionVariables;
    this.infileStreamFactory = opts.infileStreamFactory;
    this.ssl = opts.ssl;
    if (opts.ssl) {
      if (typeof opts.ssl !== 'boolean' && typeof opts.ssl !== 'string') {
        this.ssl.rejectUnauthorized = opts.ssl.rejectUnauthorized !== false;
      }
    }

    // socket
    this.queryTimeout = opts.queryTimeout === undefined ? 0 : opts.queryTimeout;
    this.socketTimeout = opts.socketTimeout === undefined ? 0 : opts.socketTimeout;
    this.keepAliveDelay = opts.keepAliveDelay === undefined ? 0 : opts.keepAliveDelay;

    this.trace = opts.trace || false;

    // result-set
    this.checkDuplicate = opts.checkDuplicate === undefined ? true : opts.checkDuplicate;
    this.dateStrings = opts.dateStrings || false;
    this.foundRows = opts.foundRows === undefined || opts.foundRows;
    this.metaAsArray = opts.metaAsArray || false;
    this.metaEnumerable = opts.metaEnumerable || false;
    this.multipleStatements = opts.multipleStatements || false;
    this.namedPlaceholders = opts.namedPlaceholders || false;
    this.nestTables = opts.nestTables;
    this.autoJsonMap = opts.autoJsonMap === undefined ? true : opts.autoJsonMap;
    this.bitOneIsBoolean = opts.bitOneIsBoolean === undefined ? true : opts.bitOneIsBoolean;
    this.arrayParenthesis = opts.arrayParenthesis || false;
    this.permitSetMultiParamEntries = opts.permitSetMultiParamEntries || false;
    this.rowsAsArray = opts.rowsAsArray || false;
    this.typeCast = opts.typeCast;
    if (this.typeCast !== undefined && typeof this.typeCast !== 'function') {
      this.typeCast = undefined;
    }
    this.bulk = opts.bulk === undefined || opts.bulk;
    this.checkNumberRange = opts.checkNumberRange || false;

    // coherence check
    if (opts.pipelining === undefined) {
      this.permitLocalInfile = opts.permitLocalInfile || false;
      this.pipelining = !this.permitLocalInfile;
    } else {
      this.pipelining = opts.pipelining;
      if (opts.permitLocalInfile === true && this.pipelining) {
        throw new Error(
          'enabling options `permitLocalInfile` and `pipelining` is not possible, options are incompatible.'
        );
      }
      this.permitLocalInfile = this.pipelining ? false : opts.permitLocalInfile || false;
    }
    this.prepareCacheLength = opts.prepareCacheLength === undefined ? 256 : opts.prepareCacheLength;
    this.restrictedAuth = opts.restrictedAuth;
    if (this.restrictedAuth != null) {
      if (!Array.isArray(this.restrictedAuth)) {
        this.restrictedAuth = this.restrictedAuth.split(',');
      }
    }

    // for compatibility with 2.x version and mysql/mysql2
    this.bigIntAsNumber = opts.bigIntAsNumber || false;
    this.insertIdAsNumber = opts.insertIdAsNumber || false;
    this.decimalAsNumber = opts.decimalAsNumber || false;
    this.supportBigNumbers = opts.supportBigNumbers || false;
    this.bigNumberStrings = opts.bigNumberStrings || false;

    if (this.maxAllowedPacket && !Number.isInteger(this.maxAllowedPacket)) {
      throw new RangeError("maxAllowedPacket must be an integer. was '" + this.maxAllowedPacket + "'");
    }
  }

  /**
   * When parsing from String, correcting type.
   *
   * @param opts options
   * @return {opts}
   */
  static parseOptionDataType(opts) {
    if (opts.bulk) opts.bulk = opts.bulk === 'true';
    if (opts.allowPublicKeyRetrieval) opts.allowPublicKeyRetrieval = opts.allowPublicKeyRetrieval === 'true';

    if (opts.insertIdAsNumber) opts.insertIdAsNumber = opts.insertIdAsNumber === 'true';
    if (opts.decimalAsNumber) opts.decimalAsNumber = opts.decimalAsNumber === 'true';
    if (opts.bigIntAsNumber) opts.bigIntAsNumber = opts.bigIntAsNumber === 'true';
    if (opts.charsetNumber && !isNaN(Number.parseInt(opts.charsetNumber))) {
      opts.charsetNumber = Number.parseInt(opts.charsetNumber);
    }
    if (opts.permitRedirect) opts.permitRedirect = opts.permitRedirect === 'true';
    if (opts.logParam) opts.logParam = opts.logParam === 'true';
    if (opts.compress) opts.compress = opts.compress === 'true';
    if (opts.connectAttributes) opts.connectAttributes = JSON.parse(opts.connectAttributes);
    if (opts.connectTimeout) opts.connectTimeout = parseInt(opts.connectTimeout);
    if (opts.keepAliveDelay) opts.keepAliveDelay = parseInt(opts.keepAliveDelay);
    if (opts.socketTimeout) opts.socketTimeout = parseInt(opts.socketTimeout);
    if (opts.dateStrings) opts.dateStrings = opts.dateStrings === 'true';
    if (opts.debug) opts.debug = opts.debug === 'true';
    if (opts.autoJsonMap) opts.autoJsonMap = opts.autoJsonMap === 'true';
    if (opts.arrayParenthesis) opts.arrayParenthesis = opts.arrayParenthesis === 'true';

    if (opts.checkDuplicate) opts.checkDuplicate = opts.checkDuplicate === 'true';
    if (opts.debugCompress) opts.debugCompress = opts.debugCompress === 'true';
    if (opts.debugLen) opts.debugLen = parseInt(opts.debugLen);
    if (opts.prepareCacheLength) opts.prepareCacheLength = parseInt(opts.prepareCacheLength);
    if (opts.queryTimeout) opts.queryTimeout = parseInt(opts.queryTimeout);
    if (opts.foundRows) opts.foundRows = opts.foundRows === 'true';
    if (opts.maxAllowedPacket && !isNaN(Number.parseInt(opts.maxAllowedPacket)))
      opts.maxAllowedPacket = parseInt(opts.maxAllowedPacket);
    if (opts.metaAsArray) opts.metaAsArray = opts.metaAsArray === 'true';
    if (opts.metaEnumerable) opts.metaEnumerable = opts.metaEnumerable === 'true';
    if (opts.multipleStatements) opts.multipleStatements = opts.multipleStatements === 'true';
    if (opts.namedPlaceholders) opts.namedPlaceholders = opts.namedPlaceholders === 'true';
    if (opts.nestTables) opts.nestTables = opts.nestTables === 'true';
    if (opts.permitSetMultiParamEntries) opts.permitSetMultiParamEntries = opts.permitSetMultiParamEntries === 'true';
    if (opts.pipelining) opts.pipelining = opts.pipelining === 'true';
    if (opts.forceVersionCheck) opts.forceVersionCheck = opts.forceVersionCheck === 'true';
    if (opts.rowsAsArray) opts.rowsAsArray = opts.rowsAsArray === 'true';
    if (opts.trace) opts.trace = opts.trace === 'true';
    if (opts.ssl && (opts.ssl === 'true' || opts.ssl === 'false')) opts.ssl = opts.ssl === 'true';
    if (opts.bitOneIsBoolean) opts.bitOneIsBoolean = opts.bitOneIsBoolean === 'true';
    return opts;
  }

  static parse(opts) {
    const matchResults = opts.match(urlFormat);

    if (!matchResults) {
      throw new Error(
        `error parsing connection string '${opts}'. format must be 'mariadb://[<user>[:<password>]@]<host>[:<port>]/[<db>[?<opt1>=<value1>[&<opt2>=<value2>]]]'`
      );
    }
    const options = {
      user: matchResults[2] ? decodeURIComponent(matchResults[2]) : undefined,
      password: matchResults[4] ? decodeURIComponent(matchResults[4]) : undefined,
      host: matchResults[6] ? decodeURIComponent(matchResults[6]) : matchResults[6],
      port: matchResults[8] ? parseInt(matchResults[8]) : undefined,
      database: matchResults[9] ? decodeURIComponent(matchResults[9]) : matchResults[9]
    };

    const variousOptsString = matchResults[11];
    if (variousOptsString) {
      const keyValues = variousOptsString.split('&');
      keyValues.forEach(function (keyVal) {
        const equalIdx = keyVal.indexOf('=');
        if (equalIdx !== 1) {
          let val = keyVal.substring(equalIdx + 1);
          val = val ? decodeURIComponent(val) : undefined;
          options[keyVal.substring(0, equalIdx)] = val;
        }
      });
    }

    return this.parseOptionDataType(options);
  }
}

module.exports = ConnectionOptions;


/***/ }),
/* 53 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);
const Errors = __webpack_require__(13);
const Capabilities = __webpack_require__(51);
const Handshake = __webpack_require__(55);
const ServerStatus = __webpack_require__(48);
const StateChange = __webpack_require__(63);
const Collations = __webpack_require__(41);
const authenticationPlugins = {
  mysql_native_password: __webpack_require__(60),
  mysql_clear_password: __webpack_require__(64),
  client_ed25519: __webpack_require__(65),
  dialog: __webpack_require__(66),
  sha256_password: __webpack_require__(67),
  caching_sha2_password: __webpack_require__(69)
};

/**
 * Handle handshake.
 * see https://mariadb.com/kb/en/library/1-connecting-connecting/
 */
class Authentication extends Command {
  constructor(cmdParam, resolve, reject, _createSecureContext, getSocket) {
    super(cmdParam, resolve, reject);
    this.cmdParam = cmdParam;
    this._createSecureContext = _createSecureContext;
    this.getSocket = getSocket;
    this.plugin = new Handshake(this, getSocket, this.handshakeResult, reject);
  }

  onPacketReceive(packet, out, opts, info) {
    this.plugin.sequenceNo = this.sequenceNo;
    this.plugin.compressSequenceNo = this.compressSequenceNo;
    this.plugin.onPacketReceive(packet, out, opts, info);
  }

  /**
   * Fast-path handshake results :
   *  - if plugin was the one expected by server, server will send OK_Packet / ERR_Packet.
   *  - if not, server send an AuthSwitchRequest packet, indicating the specific PLUGIN to use with this user.
   *    dispatching to plugin handler then.
   *
   * @param packet    current packet
   * @param out       output buffer
   * @param opts      options
   * @param info      connection info
   * @returns {*}     return null if authentication succeed, depending on plugin conversation if not finished
   */
  handshakeResult(packet, out, opts, info) {
    const marker = packet.peek();
    switch (marker) {
      //*********************************************************************************************************
      //* AuthSwitchRequest packet
      //*********************************************************************************************************
      case 0xfe:
        this.dispatchAuthSwitchRequest(packet, out, opts, info);
        return;

      //*********************************************************************************************************
      //* OK_Packet - authentication succeeded
      //*********************************************************************************************************
      case 0x00:
        this.plugin.onPacketReceive = null;
        packet.skip(1); //skip header
        packet.skipLengthCodedNumber(); //skip affected rows
        packet.skipLengthCodedNumber(); //skip last insert id
        info.status = packet.readUInt16();
        let mustRedirect = false;
        if (info.status & ServerStatus.SESSION_STATE_CHANGED) {
          packet.skip(2); //skip warning count
          packet.skipLengthCodedNumber();
          while (packet.remaining()) {
            const len = packet.readUnsignedLength();
            if (len > 0) {
              const subPacket = packet.subPacketLengthEncoded(len);
              while (subPacket.remaining()) {
                const type = subPacket.readUInt8();
                switch (type) {
                  case StateChange.SESSION_TRACK_SYSTEM_VARIABLES:
                    let subSubPacket;
                    do {
                      subSubPacket = subPacket.subPacketLengthEncoded(subPacket.readUnsignedLength());
                      const variable = subSubPacket.readStringLengthEncoded();
                      const value = subSubPacket.readStringLengthEncoded();

                      switch (variable) {
                        case 'character_set_client':
                          info.collation = Collations.fromCharset(value);
                          if (info.collation === undefined) {
                            this.throwError(new Error("unknown charset : '" + value + "'"), info);
                            return;
                          }
                          opts.emit('collation', info.collation);
                          break;

                        case 'redirect_url':
                          mustRedirect = true;
                          info.redirect(value, this.successEnd);
                          break;

                        case 'connection_id':
                          info.threadId = parseInt(value);
                          break;

                        default:
                        //variable not used by driver
                      }
                    } while (subSubPacket.remaining() > 0);
                    break;

                  case StateChange.SESSION_TRACK_SCHEMA:
                    const subSubPacket2 = subPacket.subPacketLengthEncoded(subPacket.readUnsignedLength());
                    info.database = subSubPacket2.readStringLengthEncoded();
                    break;
                }
              }
            }
          }
        }
        if (!mustRedirect) this.successEnd();
        return;

      //*********************************************************************************************************
      //* ERR_Packet
      //*********************************************************************************************************
      case 0xff:
        this.plugin.onPacketReceive = null;
        const authErr = packet.readError(info, this.displaySql());
        authErr.fatal = true;
        return this.plugin.throwError(authErr, info);

      //*********************************************************************************************************
      //* unexpected
      //*********************************************************************************************************
      default:
        this.throwNewError(
          `Unexpected type of packet during handshake phase : ${marker}`,
          true,
          info,
          '42000',
          Errors.ER_AUTHENTICATION_BAD_PACKET
        );
    }
  }

  /**
   * Handle authentication switch request : dispatch to plugin handler.
   *
   * @param packet  packet
   * @param out     output writer
   * @param opts    options
   * @param info    connection information
   */
  dispatchAuthSwitchRequest(packet, out, opts, info) {
    let pluginName, pluginData;
    if (info.clientCapabilities & Capabilities.PLUGIN_AUTH) {
      packet.skip(1); //header
      if (packet.remaining()) {
        //AuthSwitchRequest packet.
        pluginName = packet.readStringNullEnded();
        pluginData = packet.readBufferRemaining();
      } else {
        //OldAuthSwitchRequest
        pluginName = 'mysql_old_password';
        pluginData = info.seed.slice(0, 8);
      }
    } else {
      pluginName = packet.readStringNullEnded('ascii');
      pluginData = packet.readBufferRemaining();
    }

    if (opts.restrictedAuth && !opts.restrictedAuth.includes(pluginName)) {
      this.throwNewError(
        `Unsupported authentication plugin ${pluginName}. Authorized plugin: ${opts.restrictedAuth.toString()}`,
        true,
        info,
        '42000',
        Errors.ER_NOT_SUPPORTED_AUTH_PLUGIN
      );
      return;
    }
    try {
      this.plugin.emit('end');
      this.plugin.onPacketReceive = null;
      this.plugin = Authentication.pluginHandler(
        pluginName,
        this.plugin.sequenceNo,
        this.plugin.compressSequenceNo,
        pluginData,
        info,
        opts,
        out,
        this.cmdParam,
        this.reject,
        this.handshakeResult.bind(this)
      );
      this.plugin.start(out, opts, info);
    } catch (err) {
      this.reject(err);
      return;
    }
  }

  static pluginHandler(
    pluginName,
    packSeq,
    compressPackSeq,
    pluginData,
    info,
    opts,
    out,
    cmdParam,
    authReject,
    multiAuthResolver
  ) {
    let pluginAuth = authenticationPlugins[pluginName];
    if (!pluginAuth) {
      throw Errors.createFatalError(
        `Client does not support authentication protocol '${pluginName}' requested by server.`,
        Errors.ER_AUTHENTICATION_PLUGIN_NOT_SUPPORTED,
        info,
        '08004'
      );
    }
    return new pluginAuth(packSeq, compressPackSeq, pluginData, cmdParam, authReject, multiAuthResolver);
  }
}

module.exports = Authentication;


/***/ }),
/* 54 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const EventEmitter = __webpack_require__(7);
const Errors = __webpack_require__(13);

/**
 * Default command interface.
 */
class Command extends EventEmitter {
  constructor(cmdParam, resolve, reject) {
    super();
    this.cmdParam = cmdParam;
    this.sequenceNo = -1;
    this.compressSequenceNo = -1;
    this.resolve = resolve;
    this.reject = reject;
    this.sending = false;
    this.unexpectedError = this.throwUnexpectedError.bind(this);
  }

  displaySql() {
    return null;
  }

  /**
   * Throw an unexpected error.
   * server exchange will still be read to keep connection in a good state, but promise will be rejected.
   *
   * @param msg message
   * @param fatal is error fatal for connection
   * @param info current server state information
   * @param sqlState error sqlState
   * @param errno error number
   */
  throwUnexpectedError(msg, fatal, info, sqlState, errno) {
    const err = Errors.createError(
      msg,
      errno,
      info,
      sqlState,
      this.opts && this.opts.logParam ? this.displaySql() : this.sql,
      fatal,
      this.cmdParam ? this.cmdParam.stack : null,
      false
    );
    if (this.reject) {
      process.nextTick(this.reject, err);
      this.resolve = null;
      this.reject = null;
    }
    return err;
  }

  /**
   * Create and throw new Error from error information
   * only first called throwing an error or successfully end will be executed.
   *
   * @param msg message
   * @param fatal is error fatal for connection
   * @param info current server state information
   * @param sqlState error sqlState
   * @param errno error number
   */
  throwNewError(msg, fatal, info, sqlState, errno) {
    this.onPacketReceive = null;
    const err = this.throwUnexpectedError(msg, fatal, info, sqlState, errno);
    this.emit('end');
    return err;
  }

  /**
   * When command cannot be sent due to error.
   * (this is only on start command)
   *
   * @param msg error message
   * @param errno error number
   * @param info connection information
   */
  sendCancelled(msg, errno, info) {
    const err = Errors.createError(msg, errno, info, 'HY000', this.opts.logParam ? this.displaySql() : this.sql);
    this.emit('send_end');
    this.throwError(err, info);
  }

  /**
   * Throw Error
   *  only first called throwing an error or successfully end will be executed.
   *
   * @param err error to be thrown
   * @param info current server state information
   */
  throwError(err, info) {
    this.onPacketReceive = null;
    if (this.reject) {
      if (this.cmdParam && this.cmdParam.stack) {
        err = Errors.createError(
          err.text ? err.text : err.message,
          err.errno,
          info,
          err.sqlState,
          err.sql,
          err.fatal,
          this.cmdParam.stack,
          false
        );
      }
      this.resolve = null;
      process.nextTick(this.reject, err);
      this.reject = null;
    }
    this.emit('end', err);
  }

  /**
   * Successfully end command.
   * only first called throwing an error or successfully end will be executed.
   *
   * @param val return value.
   */
  successEnd(val) {
    this.onPacketReceive = null;
    if (this.resolve) {
      this.reject = null;
      process.nextTick(this.resolve, val);
      this.resolve = null;
    }
    this.emit('end');
  }
}

module.exports = Command;


/***/ }),
/* 55 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const PluginAuth = __webpack_require__(56);
const InitialHandshake = __webpack_require__(57);
const ClientCapabilities = __webpack_require__(58);
const Capabilities = __webpack_require__(51);
const SslRequest = __webpack_require__(59);
const Errors = __webpack_require__(13);
const NativePasswordAuth = __webpack_require__(60);
const os = __webpack_require__(62);
const Iconv = __webpack_require__(16);
const driverVersion = (__webpack_require__(5).version);

/**
 * Handshake response
 */
class Handshake extends PluginAuth {
  constructor(auth, getSocket, multiAuthResolver, reject) {
    super(null, multiAuthResolver, reject);
    this.sequenceNo = 0;
    this.compressSequenceNo = 0;
    this.auth = auth;
    this.getSocket = getSocket;
    this.counter = 0;
    this.onPacketReceive = this.parseHandshakeInit;
  }

  start(out, opts, info) {}

  parseHandshakeInit(packet, out, opts, info) {
    if (packet.peek() === 0xff) {
      //in case that some host is not permit to connect server
      const authErr = packet.readError(info);
      authErr.fatal = true;
      return this.throwError(authErr, info);
    }

    let handshake = new InitialHandshake(packet, info);
    ClientCapabilities.init(opts, info);

    if (opts.ssl) {
      if (info.serverCapabilities & Capabilities.SSL) {
        info.clientCapabilities |= Capabilities.SSL;
        SslRequest.send(this, out, info, opts);
        this.auth._createSecureContext(Handshake.send.bind(this, this, out, opts, handshake.pluginName, info));
      } else {
        return this.throwNewError(
          'Trying to connect with ssl, but ssl not enabled in the server',
          true,
          info,
          '08S01',
          Errors.ER_SERVER_SSL_DISABLED
        );
      }
    } else {
      Handshake.send(this, out, opts, handshake.pluginName, info);
    }
    this.onPacketReceive = this.auth.handshakeResult.bind(this.auth);
  }

  /**
   * Send Handshake response packet
   * see https://mariadb.com/kb/en/library/1-connecting-connecting/#handshake-response-packet
   *
   * @param cmd         current handshake command
   * @param out         output writer
   * @param opts        connection options
   * @param pluginName  plugin name
   * @param info        connection information
   */
  static send(cmd, out, opts, pluginName, info) {
    out.startPacket(cmd);
    info.defaultPluginName = pluginName;
    const pwd = Array.isArray(opts.password) ? opts.password[0] : opts.password;
    let authToken;
    let authPlugin;
    switch (pluginName) {
      case 'mysql_clear_password':
        authToken = Buffer.from(pwd);
        authPlugin = 'mysql_clear_password';
        break;

      default:
        authToken = NativePasswordAuth.encryptSha1Password(pwd, info.seed);
        authPlugin = 'mysql_native_password';
        break;
    }
    out.writeInt32(Number(info.clientCapabilities & BigInt(0xffffffff)));
    out.writeInt32(1024 * 1024 * 1024); // max packet size

    // if collation index > 255, this will be set using SET NAMES xx COLLATE yy
    out.writeInt8(opts.collation && opts.collation.index < 255 ? opts.collation.index : info.collation.index);
    for (let i = 0; i < 19; i++) {
      out.writeInt8(0);
    }

    out.writeInt32(Number(info.clientCapabilities >> 32n));

    //null encoded user
    out.writeString(opts.user || '');
    out.writeInt8(0);

    if (info.serverCapabilities & Capabilities.PLUGIN_AUTH_LENENC_CLIENT_DATA) {
      out.writeLengthCoded(authToken.length);
      out.writeBuffer(authToken, 0, authToken.length);
    } else if (info.serverCapabilities & Capabilities.SECURE_CONNECTION) {
      out.writeInt8(authToken.length);
      out.writeBuffer(authToken, 0, authToken.length);
    } else {
      out.writeBuffer(authToken, 0, authToken.length);
      out.writeInt8(0);
    }

    if (info.clientCapabilities & Capabilities.CONNECT_WITH_DB) {
      out.writeString(opts.database);
      out.writeInt8(0);
      info.database = opts.database;
    }

    if (info.clientCapabilities & Capabilities.PLUGIN_AUTH) {
      out.writeString(authPlugin);
      out.writeInt8(0);
    }

    if (info.clientCapabilities & Capabilities.CONNECT_ATTRS) {
      out.writeInt8(0xfc);
      let initPos = out.pos; //save position, assuming connection attributes length will be less than 2 bytes length
      out.writeInt16(0);
      const encoding = info.collation.charset;

      Handshake.writeParam(out, '_client_name', encoding);
      Handshake.writeParam(out, 'MariaDB connector/Node', encoding);

      Handshake.writeParam(out, '_client_version', encoding);
      Handshake.writeParam(out, driverVersion, encoding);

      const address = cmd.getSocket().address().address;
      if (address) {
        Handshake.writeParam(out, '_server_host', encoding);
        Handshake.writeParam(out, address, encoding);
      }

      Handshake.writeParam(out, '_os', encoding);
      Handshake.writeParam(out, process.platform, encoding);

      Handshake.writeParam(out, '_client_host', encoding);
      Handshake.writeParam(out, os.hostname(), encoding);

      Handshake.writeParam(out, '_node_version', encoding);
      Handshake.writeParam(out, process.versions.node, encoding);

      if (opts.connectAttributes !== true) {
        let attrNames = Object.keys(opts.connectAttributes);
        for (let k = 0; k < attrNames.length; ++k) {
          Handshake.writeParam(out, attrNames[k], encoding);
          Handshake.writeParam(out, opts.connectAttributes[attrNames[k]], encoding);
        }
      }

      //write end size
      out.writeInt16AtPos(initPos);
    }

    out.flushPacket();
  }

  static writeParam(out, val, encoding) {
    let param = Buffer.isEncoding(encoding) ? Buffer.from(val, encoding) : Iconv.encode(val, encoding);
    out.writeLengthCoded(param.length);
    out.writeBuffer(param, 0, param.length);
  }
}

module.exports = Handshake;


/***/ }),
/* 56 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);

/**
 * Base authentication plugin
 */
class PluginAuth extends Command {
  constructor(cmdParam, multiAuthResolver, reject) {
    super(cmdParam, multiAuthResolver, reject);
    this.onPacketReceive = multiAuthResolver;
  }
}

module.exports = PluginAuth;


/***/ }),
/* 57 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Capabilities = __webpack_require__(51);
const Collations = __webpack_require__(41);
const ConnectionInformation = __webpack_require__(49);

/**
 * Parser server initial handshake.
 * see https://mariadb.com/kb/en/library/1-connecting-connecting/#initial-handshake-packet
 */
class InitialHandshake {
  constructor(packet, info) {
    //protocolVersion
    packet.skip(1);
    info.serverVersion = {};
    info.serverVersion.raw = packet.readStringNullEnded();
    info.threadId = packet.readUInt32();

    let seed1 = packet.readBuffer(8);
    packet.skip(1); //reserved byte

    let serverCapabilities = BigInt(packet.readUInt16());
    info.collation = Collations.fromIndex(packet.readUInt8());
    info.status = packet.readUInt16();
    serverCapabilities += BigInt(packet.readUInt16()) << 16n;

    let saltLength = 0;
    if (serverCapabilities & Capabilities.PLUGIN_AUTH) {
      saltLength = Math.max(12, packet.readUInt8() - 9);
    } else {
      packet.skip(1);
    }
    if (serverCapabilities & Capabilities.MYSQL) {
      packet.skip(10);
    } else {
      packet.skip(6);
      serverCapabilities += BigInt(packet.readUInt32()) << 32n;
    }

    if (serverCapabilities & Capabilities.SECURE_CONNECTION) {
      let seed2 = packet.readBuffer(saltLength);
      info.seed = Buffer.concat([seed1, seed2]);
    } else {
      info.seed = seed1;
    }
    packet.skip(1);
    info.serverCapabilities = serverCapabilities;

    /**
     * check for MariaDB 10.x replication hack , remove fake prefix if needed
     * MDEV-4088: in 10.0+, the real version string maybe prefixed with "5.5.5-",
     * to workaround bugs in Oracle MySQL replication
     **/

    if (info.serverVersion.raw.startsWith('5.5.5-')) {
      info.serverVersion.mariaDb = true;
      info.serverVersion.raw = info.serverVersion.raw.substring('5.5.5-'.length);
    } else {
      //Support for MDEV-7780 faking server version
      info.serverVersion.mariaDb =
        info.serverVersion.raw.includes('MariaDB') || (serverCapabilities & Capabilities.MYSQL) === 0n;
    }

    if (serverCapabilities & Capabilities.PLUGIN_AUTH) {
      this.pluginName = packet.readStringNullEnded();
    } else {
      this.pluginName = '';
    }
    ConnectionInformation.parseVersionString(info);
  }
}

module.exports = InitialHandshake;


/***/ }),
/* 58 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

// noinspection JSBitwiseOperatorUsage



const Capabilities = __webpack_require__(51);

/**
 * Initialize client capabilities according to options and server capabilities
 *
 * @param opts                options
 * @param info                information
 */
module.exports.init = function (opts, info) {
  let capabilities =
    Capabilities.IGNORE_SPACE |
    Capabilities.PROTOCOL_41 |
    Capabilities.TRANSACTIONS |
    Capabilities.SECURE_CONNECTION |
    Capabilities.MULTI_RESULTS |
    Capabilities.PS_MULTI_RESULTS |
    Capabilities.SESSION_TRACK |
    Capabilities.CONNECT_ATTRS |
    Capabilities.PLUGIN_AUTH_LENENC_CLIENT_DATA |
    Capabilities.MARIADB_CLIENT_EXTENDED_TYPE_INFO |
    Capabilities.PLUGIN_AUTH;

  if (opts.foundRows) {
    capabilities |= Capabilities.FOUND_ROWS;
  }

  if (opts.permitLocalInfile) {
    capabilities |= Capabilities.LOCAL_FILES;
  }

  if (opts.multipleStatements) {
    capabilities |= Capabilities.MULTI_STATEMENTS;
  }

  info.eofDeprecated = !opts.keepEof && (info.serverCapabilities & Capabilities.DEPRECATE_EOF) > 0;
  if (info.eofDeprecated) {
    capabilities |= Capabilities.DEPRECATE_EOF;
  }

  if (opts.database && info.serverCapabilities & Capabilities.CONNECT_WITH_DB) {
    capabilities |= Capabilities.CONNECT_WITH_DB;
  }

  info.serverPermitSkipMeta = (info.serverCapabilities & Capabilities.MARIADB_CLIENT_CACHE_METADATA) > 0;
  if (info.serverPermitSkipMeta) {
    capabilities |= Capabilities.MARIADB_CLIENT_CACHE_METADATA;
  }

  // use compression only if requested by client and supported by server
  if (opts.compress) {
    if (info.serverCapabilities & Capabilities.COMPRESS) {
      capabilities |= Capabilities.COMPRESS;
    } else {
      opts.compress = false;
    }
  }

  if (opts.bulk && info.serverCapabilities & Capabilities.MARIADB_CLIENT_STMT_BULK_OPERATIONS) {
    capabilities |= Capabilities.MARIADB_CLIENT_STMT_BULK_OPERATIONS;
  }

  if (opts.permitConnectionWhenExpired) {
    capabilities |= Capabilities.CAN_HANDLE_EXPIRED_PASSWORDS;
  }

  info.clientCapabilities = capabilities & info.serverCapabilities;
};


/***/ }),
/* 59 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const Capabilities = __webpack_require__(51);

/**
 * Send SSL Request packet.
 * see : https://mariadb.com/kb/en/library/1-connecting-connecting/#sslrequest-packet
 *
 * @param cmd     current command
 * @param out     output writer
 * @param info    client information
 * @param opts    connection options
 */
module.exports.send = function sendSSLRequest(cmd, out, info, opts) {
  out.startPacket(cmd);
  out.writeInt32(Number(info.clientCapabilities & BigInt(0xffffffff)));
  out.writeInt32(1024 * 1024 * 1024); // max packet size
  out.writeInt8(opts.collation ? opts.collation.index : info.collation.index);
  for (let i = 0; i < 19; i++) {
    out.writeInt8(0);
  }

  if (info.serverCapabilities & Capabilities.MYSQL) {
    out.writeInt32(0);
  } else {
    out.writeInt32(Number(info.clientCapabilities >> 32n));
  }

  out.flushPacket();
};


/***/ }),
/* 60 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const PluginAuth = __webpack_require__(56);
const Crypto = __webpack_require__(61);

/**
 * Standard authentication plugin
 */
class NativePasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, reject, multiAuthResolver) {
    super(cmdParam, multiAuthResolver, reject);
    this.pluginData = pluginData;
    this.sequenceNo = packSeq;
    this.compressSequenceNo = compressPackSeq;
  }

  start(out, opts, info) {
    //seed is ended with a null byte value.
    const data = this.pluginData.slice(0, 20);
    let authToken = NativePasswordAuth.encryptSha1Password(opts.password, data);

    out.startPacket(this);
    if (authToken.length > 0) {
      out.writeBuffer(authToken, 0, authToken.length);
      out.flushPacket();
    } else {
      out.writeEmptyPacket(true);
    }
    this.emit('send_end');
  }

  static encryptSha1Password(password, seed) {
    if (!password) return Buffer.alloc(0);

    let hash = Crypto.createHash('sha1');
    let stage1 = hash.update(password, 'utf8').digest();
    hash = Crypto.createHash('sha1');

    let stage2 = hash.update(stage1).digest();
    hash = Crypto.createHash('sha1');

    hash.update(seed);
    hash.update(stage2);

    let digest = hash.digest();
    let returnBytes = Buffer.allocUnsafe(digest.length);
    for (let i = 0; i < digest.length; i++) {
      returnBytes[i] = stage1[i] ^ digest[i];
    }
    return returnBytes;
  }
}

module.exports = NativePasswordAuth;


/***/ }),
/* 61 */
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),
/* 62 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 63 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * Session change type.
 * see : https://mariadb.com/kb/en/library/ok_packet/#session-change-type
 * @type {number}
 */

module.exports.SESSION_TRACK_SYSTEM_VARIABLES = 0;
module.exports.SESSION_TRACK_SCHEMA = 1;
module.exports.SESSION_TRACK_STATE_CHANGE = 2;
module.exports.SESSION_TRACK_GTIDS = 3;
module.exports.SESSION_TRACK_TRANSACTION_CHARACTERISTICS = 4;
module.exports.SESSION_TRACK_TRANSACTION_STATE = 5;


/***/ }),
/* 64 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const PluginAuth = __webpack_require__(56);

/**
 * Send password in clear.
 * (used only when SSL is active)
 */
class ClearPasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, resolve, reject, multiAuthResolver) {
    super(cmdParam, resolve, reject, multiAuthResolver);
    this.sequenceNo = packSeq;
    this.counter = 0;
  }

  start(out, opts, info) {
    out.startPacket(this);
    const pwd = opts.password;
    if (pwd) {
      if (Array.isArray(pwd)) {
        out.writeString(pwd[this.counter++]);
      } else {
        out.writeString(pwd);
      }
    }
    out.writeInt8(0);
    out.flushPacket();
    this.emit('send_end');
  }
}

module.exports = ClearPasswordAuth;


/***/ }),
/* 65 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const PluginAuth = __webpack_require__(56);
const Crypto = __webpack_require__(61);

/**
 * Standard authentication plugin
 */
class Ed25519PasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, reject, multiAuthResolver) {
    super(cmdParam, multiAuthResolver, reject);
    this.pluginData = pluginData;
    this.sequenceNo = packSeq;
    this.compressSequenceNo = compressPackSeq;
  }

  start(out, opts, info) {
    //seed is ended with a null byte value.
    const data = this.pluginData;

    const sign = Ed25519PasswordAuth.encryptPassword(opts.password, data);
    out.startPacket(this);
    out.writeBuffer(sign, 0, sign.length);
    out.flushPacket();
    this.emit('send_end');
  }

  static encryptPassword(password, seed) {
    if (!password) return Buffer.alloc(0);

    let i, j;
    let p = [gf(), gf(), gf(), gf()];
    const signedMsg = Buffer.alloc(96);
    const bytePwd = Buffer.from(password);

    let hash = Crypto.createHash('sha512');
    const d = hash.update(bytePwd).digest();
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;

    for (i = 0; i < 32; i++) signedMsg[64 + i] = seed[i];
    for (i = 0; i < 32; i++) signedMsg[32 + i] = d[32 + i];

    hash = Crypto.createHash('sha512');
    const r = hash.update(signedMsg.slice(32, 96)).digest();

    reduce(r);
    scalarbase(p, r);
    pack(signedMsg, p);

    p = [gf(), gf(), gf(), gf()];

    scalarbase(p, d);
    const tt = Buffer.alloc(32);
    pack(tt, p);

    for (i = 32; i < 64; i++) signedMsg[i] = tt[i - 32];

    hash = Crypto.createHash('sha512');
    const h = hash.update(signedMsg).digest();

    reduce(h);

    const x = new Float64Array(64);
    for (i = 0; i < 64; i++) x[i] = 0;
    for (i = 0; i < 32; i++) x[i] = r[i];
    for (i = 0; i < 32; i++) {
      for (j = 0; j < 32; j++) {
        x[i + j] += h[i] * d[j];
      }
    }

    modL(signedMsg.subarray(32), x);

    return signedMsg.slice(0, 64);
  }
}

/*******************************************************
 *
 * This plugin uses the following public domain tweetnacl-js code by Dmitry Chestnykh
 * (from https://github.com/dchest/tweetnacl-js/blob/master/nacl-fast.js).
 * tweetnacl cannot be used directly (secret key mandatory size is 32 in nacl + implementation differ :
 * second scalarbase use hash of secret key, not secret key).
 *
 *******************************************************/

const gf = function (init) {
  const r = new Float64Array(16);
  if (init) for (let i = 0; i < init.length; i++) r[i] = init[i];
  return r;
};

const gf0 = gf(),
  gf1 = gf([1]),
  D2 = gf([
    0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df,
    0xd9dc, 0x2406
  ]),
  X = gf([
    0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e,
    0x36d3, 0x2169
  ]),
  Y = gf([
    0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666,
    0x6666, 0x6666
  ]);

const L = new Float64Array([
  0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0x10
]);

function reduce(r) {
  const x = new Float64Array(64);
  let i;
  for (i = 0; i < 64; i++) x[i] = r[i];
  for (i = 0; i < 64; i++) r[i] = 0;
  modL(r, x);
}

function modL(r, x) {
  let carry, i, j, k;
  for (i = 63; i >= 32; --i) {
    carry = 0;
    for (j = i - 32, k = i - 12; j < k; ++j) {
      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
      carry = (x[j] + 128) >> 8;
      x[j] -= carry * 256;
    }
    x[j] += carry;
    x[i] = 0;
  }
  carry = 0;
  for (j = 0; j < 32; j++) {
    x[j] += carry - (x[31] >> 4) * L[j];
    carry = x[j] >> 8;
    x[j] &= 255;
  }
  for (j = 0; j < 32; j++) x[j] -= carry * L[j];
  for (i = 0; i < 32; i++) {
    x[i + 1] += x[i] >> 8;
    r[i] = x[i] & 255;
  }
}

function scalarbase(p, s) {
  const q = [gf(), gf(), gf(), gf()];
  set25519(q[0], X);
  set25519(q[1], Y);
  set25519(q[2], gf1);
  M(q[3], X, Y);
  scalarmult(p, q, s);
}

function set25519(r, a) {
  for (let i = 0; i < 16; i++) r[i] = a[i] | 0;
}

function M(o, a, b) {
  let v,
    c,
    t0 = 0,
    t1 = 0,
    t2 = 0,
    t3 = 0,
    t4 = 0,
    t5 = 0,
    t6 = 0,
    t7 = 0,
    t8 = 0,
    t9 = 0,
    t10 = 0,
    t11 = 0,
    t12 = 0,
    t13 = 0,
    t14 = 0,
    t15 = 0,
    t16 = 0,
    t17 = 0,
    t18 = 0,
    t19 = 0,
    t20 = 0,
    t21 = 0,
    t22 = 0,
    t23 = 0,
    t24 = 0,
    t25 = 0,
    t26 = 0,
    t27 = 0,
    t28 = 0,
    t29 = 0,
    t30 = 0;
  const b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7],
    b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11],
    b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];

  v = a[0];
  t0 += v * b0;
  t1 += v * b1;
  t2 += v * b2;
  t3 += v * b3;
  t4 += v * b4;
  t5 += v * b5;
  t6 += v * b6;
  t7 += v * b7;
  t8 += v * b8;
  t9 += v * b9;
  t10 += v * b10;
  t11 += v * b11;
  t12 += v * b12;
  t13 += v * b13;
  t14 += v * b14;
  t15 += v * b15;
  v = a[1];
  t1 += v * b0;
  t2 += v * b1;
  t3 += v * b2;
  t4 += v * b3;
  t5 += v * b4;
  t6 += v * b5;
  t7 += v * b6;
  t8 += v * b7;
  t9 += v * b8;
  t10 += v * b9;
  t11 += v * b10;
  t12 += v * b11;
  t13 += v * b12;
  t14 += v * b13;
  t15 += v * b14;
  t16 += v * b15;
  v = a[2];
  t2 += v * b0;
  t3 += v * b1;
  t4 += v * b2;
  t5 += v * b3;
  t6 += v * b4;
  t7 += v * b5;
  t8 += v * b6;
  t9 += v * b7;
  t10 += v * b8;
  t11 += v * b9;
  t12 += v * b10;
  t13 += v * b11;
  t14 += v * b12;
  t15 += v * b13;
  t16 += v * b14;
  t17 += v * b15;
  v = a[3];
  t3 += v * b0;
  t4 += v * b1;
  t5 += v * b2;
  t6 += v * b3;
  t7 += v * b4;
  t8 += v * b5;
  t9 += v * b6;
  t10 += v * b7;
  t11 += v * b8;
  t12 += v * b9;
  t13 += v * b10;
  t14 += v * b11;
  t15 += v * b12;
  t16 += v * b13;
  t17 += v * b14;
  t18 += v * b15;
  v = a[4];
  t4 += v * b0;
  t5 += v * b1;
  t6 += v * b2;
  t7 += v * b3;
  t8 += v * b4;
  t9 += v * b5;
  t10 += v * b6;
  t11 += v * b7;
  t12 += v * b8;
  t13 += v * b9;
  t14 += v * b10;
  t15 += v * b11;
  t16 += v * b12;
  t17 += v * b13;
  t18 += v * b14;
  t19 += v * b15;
  v = a[5];
  t5 += v * b0;
  t6 += v * b1;
  t7 += v * b2;
  t8 += v * b3;
  t9 += v * b4;
  t10 += v * b5;
  t11 += v * b6;
  t12 += v * b7;
  t13 += v * b8;
  t14 += v * b9;
  t15 += v * b10;
  t16 += v * b11;
  t17 += v * b12;
  t18 += v * b13;
  t19 += v * b14;
  t20 += v * b15;
  v = a[6];
  t6 += v * b0;
  t7 += v * b1;
  t8 += v * b2;
  t9 += v * b3;
  t10 += v * b4;
  t11 += v * b5;
  t12 += v * b6;
  t13 += v * b7;
  t14 += v * b8;
  t15 += v * b9;
  t16 += v * b10;
  t17 += v * b11;
  t18 += v * b12;
  t19 += v * b13;
  t20 += v * b14;
  t21 += v * b15;
  v = a[7];
  t7 += v * b0;
  t8 += v * b1;
  t9 += v * b2;
  t10 += v * b3;
  t11 += v * b4;
  t12 += v * b5;
  t13 += v * b6;
  t14 += v * b7;
  t15 += v * b8;
  t16 += v * b9;
  t17 += v * b10;
  t18 += v * b11;
  t19 += v * b12;
  t20 += v * b13;
  t21 += v * b14;
  t22 += v * b15;
  v = a[8];
  t8 += v * b0;
  t9 += v * b1;
  t10 += v * b2;
  t11 += v * b3;
  t12 += v * b4;
  t13 += v * b5;
  t14 += v * b6;
  t15 += v * b7;
  t16 += v * b8;
  t17 += v * b9;
  t18 += v * b10;
  t19 += v * b11;
  t20 += v * b12;
  t21 += v * b13;
  t22 += v * b14;
  t23 += v * b15;
  v = a[9];
  t9 += v * b0;
  t10 += v * b1;
  t11 += v * b2;
  t12 += v * b3;
  t13 += v * b4;
  t14 += v * b5;
  t15 += v * b6;
  t16 += v * b7;
  t17 += v * b8;
  t18 += v * b9;
  t19 += v * b10;
  t20 += v * b11;
  t21 += v * b12;
  t22 += v * b13;
  t23 += v * b14;
  t24 += v * b15;
  v = a[10];
  t10 += v * b0;
  t11 += v * b1;
  t12 += v * b2;
  t13 += v * b3;
  t14 += v * b4;
  t15 += v * b5;
  t16 += v * b6;
  t17 += v * b7;
  t18 += v * b8;
  t19 += v * b9;
  t20 += v * b10;
  t21 += v * b11;
  t22 += v * b12;
  t23 += v * b13;
  t24 += v * b14;
  t25 += v * b15;
  v = a[11];
  t11 += v * b0;
  t12 += v * b1;
  t13 += v * b2;
  t14 += v * b3;
  t15 += v * b4;
  t16 += v * b5;
  t17 += v * b6;
  t18 += v * b7;
  t19 += v * b8;
  t20 += v * b9;
  t21 += v * b10;
  t22 += v * b11;
  t23 += v * b12;
  t24 += v * b13;
  t25 += v * b14;
  t26 += v * b15;
  v = a[12];
  t12 += v * b0;
  t13 += v * b1;
  t14 += v * b2;
  t15 += v * b3;
  t16 += v * b4;
  t17 += v * b5;
  t18 += v * b6;
  t19 += v * b7;
  t20 += v * b8;
  t21 += v * b9;
  t22 += v * b10;
  t23 += v * b11;
  t24 += v * b12;
  t25 += v * b13;
  t26 += v * b14;
  t27 += v * b15;
  v = a[13];
  t13 += v * b0;
  t14 += v * b1;
  t15 += v * b2;
  t16 += v * b3;
  t17 += v * b4;
  t18 += v * b5;
  t19 += v * b6;
  t20 += v * b7;
  t21 += v * b8;
  t22 += v * b9;
  t23 += v * b10;
  t24 += v * b11;
  t25 += v * b12;
  t26 += v * b13;
  t27 += v * b14;
  t28 += v * b15;
  v = a[14];
  t14 += v * b0;
  t15 += v * b1;
  t16 += v * b2;
  t17 += v * b3;
  t18 += v * b4;
  t19 += v * b5;
  t20 += v * b6;
  t21 += v * b7;
  t22 += v * b8;
  t23 += v * b9;
  t24 += v * b10;
  t25 += v * b11;
  t26 += v * b12;
  t27 += v * b13;
  t28 += v * b14;
  t29 += v * b15;
  v = a[15];
  t15 += v * b0;
  t16 += v * b1;
  t17 += v * b2;
  t18 += v * b3;
  t19 += v * b4;
  t20 += v * b5;
  t21 += v * b6;
  t22 += v * b7;
  t23 += v * b8;
  t24 += v * b9;
  t25 += v * b10;
  t26 += v * b11;
  t27 += v * b12;
  t28 += v * b13;
  t29 += v * b14;
  t30 += v * b15;

  t0 += 38 * t16;
  t1 += 38 * t17;
  t2 += 38 * t18;
  t3 += 38 * t19;
  t4 += 38 * t20;
  t5 += 38 * t21;
  t6 += 38 * t22;
  t7 += 38 * t23;
  t8 += 38 * t24;
  t9 += 38 * t25;
  t10 += 38 * t26;
  t11 += 38 * t27;
  t12 += 38 * t28;
  t13 += 38 * t29;
  t14 += 38 * t30;
  // t15 left as is

  // first car
  c = 1;
  v = t0 + c + 65535;
  c = Math.floor(v / 65536);
  t0 = v - c * 65536;
  v = t1 + c + 65535;
  c = Math.floor(v / 65536);
  t1 = v - c * 65536;
  v = t2 + c + 65535;
  c = Math.floor(v / 65536);
  t2 = v - c * 65536;
  v = t3 + c + 65535;
  c = Math.floor(v / 65536);
  t3 = v - c * 65536;
  v = t4 + c + 65535;
  c = Math.floor(v / 65536);
  t4 = v - c * 65536;
  v = t5 + c + 65535;
  c = Math.floor(v / 65536);
  t5 = v - c * 65536;
  v = t6 + c + 65535;
  c = Math.floor(v / 65536);
  t6 = v - c * 65536;
  v = t7 + c + 65535;
  c = Math.floor(v / 65536);
  t7 = v - c * 65536;
  v = t8 + c + 65535;
  c = Math.floor(v / 65536);
  t8 = v - c * 65536;
  v = t9 + c + 65535;
  c = Math.floor(v / 65536);
  t9 = v - c * 65536;
  v = t10 + c + 65535;
  c = Math.floor(v / 65536);
  t10 = v - c * 65536;
  v = t11 + c + 65535;
  c = Math.floor(v / 65536);
  t11 = v - c * 65536;
  v = t12 + c + 65535;
  c = Math.floor(v / 65536);
  t12 = v - c * 65536;
  v = t13 + c + 65535;
  c = Math.floor(v / 65536);
  t13 = v - c * 65536;
  v = t14 + c + 65535;
  c = Math.floor(v / 65536);
  t14 = v - c * 65536;
  v = t15 + c + 65535;
  c = Math.floor(v / 65536);
  t15 = v - c * 65536;
  t0 += c - 1 + 37 * (c - 1);

  // second car
  c = 1;
  v = t0 + c + 65535;
  c = Math.floor(v / 65536);
  t0 = v - c * 65536;
  v = t1 + c + 65535;
  c = Math.floor(v / 65536);
  t1 = v - c * 65536;
  v = t2 + c + 65535;
  c = Math.floor(v / 65536);
  t2 = v - c * 65536;
  v = t3 + c + 65535;
  c = Math.floor(v / 65536);
  t3 = v - c * 65536;
  v = t4 + c + 65535;
  c = Math.floor(v / 65536);
  t4 = v - c * 65536;
  v = t5 + c + 65535;
  c = Math.floor(v / 65536);
  t5 = v - c * 65536;
  v = t6 + c + 65535;
  c = Math.floor(v / 65536);
  t6 = v - c * 65536;
  v = t7 + c + 65535;
  c = Math.floor(v / 65536);
  t7 = v - c * 65536;
  v = t8 + c + 65535;
  c = Math.floor(v / 65536);
  t8 = v - c * 65536;
  v = t9 + c + 65535;
  c = Math.floor(v / 65536);
  t9 = v - c * 65536;
  v = t10 + c + 65535;
  c = Math.floor(v / 65536);
  t10 = v - c * 65536;
  v = t11 + c + 65535;
  c = Math.floor(v / 65536);
  t11 = v - c * 65536;
  v = t12 + c + 65535;
  c = Math.floor(v / 65536);
  t12 = v - c * 65536;
  v = t13 + c + 65535;
  c = Math.floor(v / 65536);
  t13 = v - c * 65536;
  v = t14 + c + 65535;
  c = Math.floor(v / 65536);
  t14 = v - c * 65536;
  v = t15 + c + 65535;
  c = Math.floor(v / 65536);
  t15 = v - c * 65536;
  t0 += c - 1 + 37 * (c - 1);

  o[0] = t0;
  o[1] = t1;
  o[2] = t2;
  o[3] = t3;
  o[4] = t4;
  o[5] = t5;
  o[6] = t6;
  o[7] = t7;
  o[8] = t8;
  o[9] = t9;
  o[10] = t10;
  o[11] = t11;
  o[12] = t12;
  o[13] = t13;
  o[14] = t14;
  o[15] = t15;
}

function scalarmult(p, q, s) {
  let b, i;
  set25519(p[0], gf0);
  set25519(p[1], gf1);
  set25519(p[2], gf1);
  set25519(p[3], gf0);
  for (i = 255; i >= 0; --i) {
    b = (s[(i / 8) | 0] >> (i & 7)) & 1;
    cswap(p, q, b);
    add(q, p);
    add(p, p);
    cswap(p, q, b);
  }
}

function pack(r, p) {
  const tx = gf(),
    ty = gf(),
    zi = gf();
  inv25519(zi, p[2]);
  M(tx, p[0], zi);
  M(ty, p[1], zi);
  pack25519(r, ty);
  r[31] ^= par25519(tx) << 7;
}

function inv25519(o, i) {
  const c = gf();
  let a;
  for (a = 0; a < 16; a++) c[a] = i[a];
  for (a = 253; a >= 0; a--) {
    S(c, c);
    if (a !== 2 && a !== 4) M(c, c, i);
  }
  for (a = 0; a < 16; a++) o[a] = c[a];
}

function S(o, a) {
  M(o, a, a);
}

function par25519(a) {
  const d = new Uint8Array(32);
  pack25519(d, a);
  return d[0] & 1;
}
function car25519(o) {
  let i,
    v,
    c = 1;
  for (i = 0; i < 16; i++) {
    v = o[i] + c + 65535;
    c = Math.floor(v / 65536);
    o[i] = v - c * 65536;
  }
  o[0] += c - 1 + 37 * (c - 1);
}

function pack25519(o, n) {
  let i, j, b;
  const m = gf(),
    t = gf();
  for (i = 0; i < 16; i++) t[i] = n[i];
  car25519(t);
  car25519(t);
  car25519(t);
  for (j = 0; j < 2; j++) {
    m[0] = t[0] - 0xffed;
    for (i = 1; i < 15; i++) {
      m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
      m[i - 1] &= 0xffff;
    }
    m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
    b = (m[15] >> 16) & 1;
    m[14] &= 0xffff;
    sel25519(t, m, 1 - b);
  }
  for (i = 0; i < 16; i++) {
    o[2 * i] = t[i] & 0xff;
    o[2 * i + 1] = t[i] >> 8;
  }
}

function cswap(p, q, b) {
  for (let i = 0; i < 4; i++) {
    sel25519(p[i], q[i], b);
  }
}

function A(o, a, b) {
  for (let i = 0; i < 16; i++) o[i] = a[i] + b[i];
}

function Z(o, a, b) {
  for (let i = 0; i < 16; i++) o[i] = a[i] - b[i];
}

function add(p, q) {
  const a = gf(),
    b = gf(),
    c = gf(),
    d = gf(),
    e = gf(),
    f = gf(),
    g = gf(),
    h = gf(),
    t = gf();

  Z(a, p[1], p[0]);
  Z(t, q[1], q[0]);
  M(a, a, t);
  A(b, p[0], p[1]);
  A(t, q[0], q[1]);
  M(b, b, t);
  M(c, p[3], q[3]);
  M(c, c, D2);
  M(d, p[2], q[2]);
  A(d, d, d);
  Z(e, b, a);
  Z(f, d, c);
  A(g, d, c);
  A(h, b, a);

  M(p[0], e, f);
  M(p[1], h, g);
  M(p[2], g, f);
  M(p[3], e, h);
}

function sel25519(p, q, b) {
  const c = ~(b - 1);
  let t;
  for (let i = 0; i < 16; i++) {
    t = c & (p[i] ^ q[i]);
    p[i] ^= t;
    q[i] ^= t;
  }
}

module.exports = Ed25519PasswordAuth;


/***/ }),
/* 66 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const PluginAuth = __webpack_require__(56);

/**
 * Use PAM authentication
 */
class PamPasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, reject, multiAuthResolver) {
    super(cmdParam, multiAuthResolver, reject);
    this.pluginData = pluginData;
    this.sequenceNo = packSeq;
    this.compressSequenceNo = compressPackSeq;
    this.counter = 0;
    this.multiAuthResolver = multiAuthResolver;
  }

  start(out, opts, info) {
    this.exchange(this.pluginData, out, opts, info);
    this.onPacketReceive = this.response;
  }

  exchange(buffer, out, opts, info) {
    //conversation is :
    // - first byte is information tell if question is a password (4) or clear text (2).
    // - other bytes are the question to user

    out.startPacket(this);

    let pwd;
    if (Array.isArray(opts.password)) {
      pwd = opts.password[this.counter];
      this.counter++;
    } else {
      pwd = opts.password;
    }

    if (pwd) out.writeString(pwd);
    out.writeInt8(0);
    out.flushPacket();
  }

  response(packet, out, opts, info) {
    const marker = packet.peek();
    switch (marker) {
      //*********************************************************************************************************
      //* OK_Packet and Err_Packet ending packet
      //*********************************************************************************************************
      case 0x00:
      case 0xff:
        this.emit('send_end');
        return this.multiAuthResolver(packet, out, opts, info);

      default:
        let promptData = packet.readBuffer();
        this.exchange(promptData, out, opts, info);
        this.onPacketReceive = this.response;
    }
  }
}

module.exports = PamPasswordAuth;


/***/ }),
/* 67 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const PluginAuth = __webpack_require__(56);
const fs = __webpack_require__(68);
const crypto = __webpack_require__(61);
const Errors = __webpack_require__(13);
const Crypto = __webpack_require__(61);

/**
 * Use Sha256 authentication
 */
class Sha256PasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, reject, multiAuthResolver) {
    super(cmdParam, multiAuthResolver, reject);
    this.pluginData = pluginData;
    this.sequenceNo = packSeq;
    this.compressSequenceNo = compressPackSeq;
    this.counter = 0;
    this.counter = 0;
    this.initialState = true;
    this.multiAuthResolver = multiAuthResolver;
  }

  start(out, opts, info) {
    this.exchange(this.pluginData, out, opts, info);
    this.onPacketReceive = this.response;
  }

  exchange(buffer, out, opts, info) {
    if (this.initialState) {
      if (!opts.password) {
        out.startPacket(this);
        out.writeEmptyPacket(true);
        return;
      } else if (opts.ssl) {
        // using SSL, so sending password in clear
        out.startPacket(this);
        if (opts.password) {
          out.writeString(opts.password);
        }
        out.writeInt8(0);
        out.flushPacket();
        return;
      } else {
        // retrieve public key from configuration or from server
        if (opts.rsaPublicKey) {
          try {
            let key = opts.rsaPublicKey;
            if (!key.includes('-----BEGIN')) {
              // rsaPublicKey contain path
              key = fs.readFileSync(key, 'utf8');
            }
            this.publicKey = Sha256PasswordAuth.retrievePublicKey(key);
          } catch (err) {
            return this.throwError(err, info);
          }
        } else {
          if (!opts.allowPublicKeyRetrieval) {
            return this.throwError(
              Errors.createFatalError(
                'RSA public key is not available client side. Either set option `rsaPublicKey` to indicate' +
                  ' public key path, or allow public key retrieval with option `allowPublicKeyRetrieval`',
                Errors.ER_CANNOT_RETRIEVE_RSA_KEY,
                info
              ),
              info
            );
          }
          this.initialState = false;

          // ask public Key Retrieval
          out.startPacket(this);
          out.writeInt8(0x01);
          out.flushPacket();
          return;
        }
      }

      // send Sha256Password Packet
      Sha256PasswordAuth.sendSha256PwdPacket(this, this.pluginData, this.publicKey, opts.password, out);
    } else {
      // has request public key
      this.publicKey = Sha256PasswordAuth.retrievePublicKey(buffer.toString('utf8', 1));
      Sha256PasswordAuth.sendSha256PwdPacket(this, this.pluginData, this.publicKey, opts.password, out);
    }
  }

  static retrievePublicKey(key) {
    return key.replace('(-+BEGIN PUBLIC KEY-+\\r?\\n|\\n?-+END PUBLIC KEY-+\\r?\\n?)', '');
  }

  static sendSha256PwdPacket(cmd, pluginData, publicKey, password, out) {
    const truncatedSeed = pluginData.slice(0, pluginData.length - 1);
    out.startPacket(cmd);
    const enc = Sha256PasswordAuth.encrypt(truncatedSeed, password, publicKey);
    out.writeBuffer(enc, 0, enc.length);
    out.flushPacket();
  }

  static encryptSha256Password(password, seed) {
    if (!password) return Buffer.alloc(0);

    let hash = Crypto.createHash('sha256');
    let stage1 = hash.update(password, 'utf8').digest();
    hash = Crypto.createHash('sha256');

    let stage2 = hash.update(stage1).digest();
    hash = Crypto.createHash('sha256');

    // order is different than sha 1 !!!!!
    hash.update(stage2);
    hash.update(seed);

    let digest = hash.digest();
    let returnBytes = Buffer.allocUnsafe(digest.length);
    for (let i = 0; i < digest.length; i++) {
      returnBytes[i] = stage1[i] ^ digest[i];
    }
    return returnBytes;
  }

  // encrypt password with public key
  static encrypt(seed, password, publicKey) {
    const nullFinishedPwd = Buffer.from(password + '\0');
    const xorBytes = Buffer.allocUnsafe(nullFinishedPwd.length);
    const seedLength = seed.length;
    for (let i = 0; i < xorBytes.length; i++) {
      xorBytes[i] = nullFinishedPwd[i] ^ seed[i % seedLength];
    }
    return crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, xorBytes);
  }

  response(packet, out, opts, info) {
    const marker = packet.peek();
    switch (marker) {
      //*********************************************************************************************************
      //* OK_Packet and Err_Packet ending packet
      //*********************************************************************************************************
      case 0x00:
      case 0xff:
        this.emit('send_end');
        return this.multiAuthResolver(packet, out, opts, info);

      default:
        let promptData = packet.readBufferRemaining();
        this.exchange(promptData, out, opts, info);
        this.onPacketReceive = this.response;
    }
  }
}

module.exports = Sha256PasswordAuth;


/***/ }),
/* 68 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 69 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const PluginAuth = __webpack_require__(56);
const fs = __webpack_require__(68);
const Errors = __webpack_require__(13);
const Sha256PasswordAuth = __webpack_require__(67);

const State = {
  INIT: 'INIT',
  FAST_AUTH_RESULT: 'FAST_AUTH_RESULT',
  REQUEST_SERVER_KEY: 'REQUEST_SERVER_KEY',
  SEND_AUTH: 'SEND_AUTH'
};

/**
 * Use caching Sha2 password authentication
 */
class CachingSha2PasswordAuth extends PluginAuth {
  constructor(packSeq, compressPackSeq, pluginData, cmdParam, reject, multiAuthResolver) {
    super(cmdParam, multiAuthResolver, reject);
    this.multiAuthResolver = multiAuthResolver;
    this.pluginData = pluginData;
    this.sequenceNo = packSeq;
    this.compressSequenceNo = compressPackSeq;
    this.counter = 0;
    this.state = State.INIT;
  }

  start(out, opts, info) {
    this.exchange(this.pluginData, out, opts, info);
    this.onPacketReceive = this.response;
  }

  exchange(packet, out, opts, info) {
    switch (this.state) {
      case State.INIT:
        const truncatedSeed = this.pluginData.slice(0, this.pluginData.length - 1);
        const encPwd = Sha256PasswordAuth.encryptSha256Password(opts.password, truncatedSeed);
        out.startPacket(this);
        if (encPwd.length > 0) {
          out.writeBuffer(encPwd, 0, encPwd.length);
          out.flushPacket();
        } else {
          out.writeEmptyPacket(true);
        }
        this.state = State.FAST_AUTH_RESULT;
        return;

      case State.FAST_AUTH_RESULT:
        // length encoded numeric : 0x01 0x03/0x04
        const fastAuthResult = packet[1];
        switch (fastAuthResult) {
          case 0x03:
            // success authentication
            // an OK_Packet will follow
            return;

          case 0x04:
            if (opts.ssl) {
              // using SSL, so sending password in clear
              out.startPacket(this);
              out.writeString(opts.password);
              out.writeInt8(0);
              out.flushPacket();
              return;
            }

            // retrieve public key from configuration or from server
            if (opts.cachingRsaPublicKey) {
              try {
                let key = opts.cachingRsaPublicKey;
                if (!key.includes('-----BEGIN')) {
                  // rsaPublicKey contain path
                  key = fs.readFileSync(key, 'utf8');
                }
                this.publicKey = Sha256PasswordAuth.retrievePublicKey(key);
              } catch (err) {
                return this.throwError(err, info);
              }
              // send Sha256Password Packet
              Sha256PasswordAuth.sendSha256PwdPacket(this, this.pluginData, this.publicKey, opts.password, out);
            } else {
              if (!opts.allowPublicKeyRetrieval) {
                return this.throwError(
                  Errors.createFatalError(
                    'RSA public key is not available client side. Either set option `cachingRsaPublicKey` to indicate' +
                      ' public key path, or allow public key retrieval with option `allowPublicKeyRetrieval`',
                    Errors.ER_CANNOT_RETRIEVE_RSA_KEY,
                    info
                  ),
                  info
                );
              }
              this.state = State.REQUEST_SERVER_KEY;
              // ask caching public Key Retrieval
              out.startPacket(this);
              out.writeInt8(0x02);
              out.flushPacket();
            }
            return;
        }

      case State.REQUEST_SERVER_KEY:
        this.publicKey = Sha256PasswordAuth.retrievePublicKey(packet.toString(undefined, 1));
        this.state = State.SEND_AUTH;
        Sha256PasswordAuth.sendSha256PwdPacket(this, this.pluginData, this.publicKey, opts.password, out);
        return;
    }
  }

  response(packet, out, opts, info) {
    const marker = packet.peek();
    switch (marker) {
      //*********************************************************************************************************
      //* OK_Packet and Err_Packet ending packet
      //*********************************************************************************************************
      case 0x00:
      case 0xff:
        this.emit('send_end');
        return this.multiAuthResolver(packet, out, opts, info);

      default:
        let promptData = packet.readBufferRemaining();
        this.exchange(promptData, out, opts, info);
        this.onPacketReceive = this.response;
    }
  }
}

module.exports = CachingSha2PasswordAuth;


/***/ }),
/* 70 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);
const QUIT_COMMAND = new Uint8Array([1, 0, 0, 0, 0x01]);

/**
 * Quit (close connection)
 * see https://mariadb.com/kb/en/library/com_quit/
 */
class Quit extends Command {
  constructor(cmdParam, resolve, reject) {
    super(cmdParam, resolve, reject);
  }

  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query('QUIT');
    this.onPacketReceive = this.skipResults;
    out.fastFlush(this, QUIT_COMMAND);
    this.emit('send_end');
    this.successEnd();
  }

  skipResults(packet, out, opts, info) {
    //deliberately empty, if server send answer
  }
}

module.exports = Quit;


/***/ }),
/* 71 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);
const ServerStatus = __webpack_require__(48);

const PING_COMMAND = new Uint8Array([1, 0, 0, 0, 0x0e]);

/**
 * send a COM_PING: permits sending a packet containing one byte to check that the connection is active.
 * see https://mariadb.com/kb/en/library/com_ping/
 */
class Ping extends Command {
  constructor(cmdParam, resolve, reject) {
    super(cmdParam, resolve, reject);
  }

  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query('PING');
    this.onPacketReceive = this.readPingResponsePacket;
    out.fastFlush(this, PING_COMMAND);
    this.emit('send_end');
  }

  /**
   * Read ping response packet.
   * packet can be :
   * - an ERR_Packet
   * - an OK_Packet
   *
   * @param packet  query response
   * @param out     output writer
   * @param opts    connection options
   * @param info    connection info
   */
  readPingResponsePacket(packet, out, opts, info) {
    packet.skip(1); //skip header
    packet.skipLengthCodedNumber(); //affected rows
    packet.skipLengthCodedNumber(); //insert ids
    info.status = packet.readUInt16();
    if (info.redirectRequest && (info.status & ServerStatus.STATUS_IN_TRANS) === 0) {
      info.redirect(info.redirectRequest, this.successEnd.bind(this, null));
    } else {
      this.successEnd(null);
    }
  }
}

module.exports = Ping;


/***/ }),
/* 72 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);
const ServerStatus = __webpack_require__(48);
const RESET_COMMAND = new Uint8Array([1, 0, 0, 0, 0x1f]);
/**
 * send a COM_RESET_CONNECTION: permits to reset a connection without re-authentication.
 * see https://mariadb.com/kb/en/library/com_reset_connection/
 */
class Reset extends Command {
  constructor(cmdParam, resolve, reject) {
    super(cmdParam, resolve, reject);
  }

  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query('RESET');
    this.onPacketReceive = this.readResetResponsePacket;
    out.fastFlush(this, RESET_COMMAND);
    this.emit('send_end');
  }

  /**
   * Read response packet.
   * packet can be :
   * - an ERR_Packet
   * - a OK_Packet
   *
   * @param packet  query response
   * @param out     output writer
   * @param opts    connection options
   * @param info    connection info
   */
  readResetResponsePacket(packet, out, opts, info) {
    packet.skip(1); //skip header
    packet.skipLengthCodedNumber(); //affected rows
    packet.skipLengthCodedNumber(); //insert ids

    info.status = packet.readUInt16();
    if (info.redirectRequest && (info.status & ServerStatus.STATUS_IN_TRANS) === 0) {
      info.redirect(info.redirectRequest, this.successEnd.bind(this));
    } else {
      this.successEnd();
    }
  }
}

module.exports = Reset;


/***/ }),
/* 73 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Parser = __webpack_require__(74);
const Errors = __webpack_require__(13);
const Parse = __webpack_require__(78);
const TextEncoder = __webpack_require__(43);
const { Readable } = __webpack_require__(40);
const QUOTE = 0x27;

/**
 * Protocol COM_QUERY
 * see : https://mariadb.com/kb/en/library/com_query/
 */
class Query extends Parser {
  constructor(resolve, reject, connOpts, cmdParam) {
    super(resolve, reject, connOpts, cmdParam);
    this.encoder = new TextEncoder(this.opts);
    this.binary = false;
  }

  /**
   * Send COM_QUERY
   *
   * @param out   output writer
   * @param opts  connection options
   * @param info  connection information
   */
  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query(`QUERY: ${opts.logParam ? this.displaySql() : this.sql}`);
    this.onPacketReceive = this.readResponsePacket;
    if (this.initialValues === undefined) {
      //shortcut if no parameters
      out.startPacket(this);
      out.writeInt8(0x03);
      if (!this.handleTimeout(out, info)) return;
      out.writeString(this.sql);
      out.flush();
      this.emit('send_end');
      return;
    }

    this.encodedSql = out.encodeString(this.sql);

    if (this.opts.namedPlaceholders) {
      try {
        const parsed = Parse.splitQueryPlaceholder(
          this.encodedSql,
          info,
          this.initialValues,
          this.opts.logParam ? this.displaySql.bind(this) : () => this.sql
        );
        this.paramPositions = parsed.paramPositions;
        this.values = parsed.values;
      } catch (err) {
        this.emit('send_end');
        return this.throwError(err, info);
      }
    } else {
      this.paramPositions = Parse.splitQuery(this.encodedSql);
      this.values = Array.isArray(this.initialValues) ? this.initialValues : [this.initialValues];
      if (!this.validateParameters(info)) return;
    }

    out.startPacket(this);
    out.writeInt8(0x03);
    if (!this.handleTimeout(out, info)) return;

    this.paramPos = 0;
    this.sqlPos = 0;

    //********************************************
    // send params
    //********************************************
    const len = this.paramPositions.length / 2;
    for (this.valueIdx = 0; this.valueIdx < len; ) {
      out.writeBuffer(this.encodedSql, this.sqlPos, this.paramPositions[this.paramPos++] - this.sqlPos);
      this.sqlPos = this.paramPositions[this.paramPos++];

      const value = this.values[this.valueIdx++];

      if (
        value != null &&
        typeof value === 'object' &&
        typeof value.pipe === 'function' &&
        typeof value.read === 'function'
      ) {
        this.sending = true;
        //********************************************
        // param is stream,
        // now all params will be written by event
        //********************************************
        this.paramWritten = this._paramWritten.bind(this, out, info);
        out.writeInt8(QUOTE); //'
        value.on('data', out.writeBufferEscape.bind(out));

        value.on(
          'end',
          function () {
            out.writeInt8(QUOTE); //'
            this.paramWritten();
          }.bind(this)
        );

        return;
      } else {
        //********************************************
        // param isn't stream. directly write in buffer
        //********************************************
        this.encoder.writeParam(out, value, this.opts, info);
      }
    }
    out.writeBuffer(this.encodedSql, this.sqlPos, this.encodedSql.length - this.sqlPos);
    out.flush();
    this.emit('send_end');
  }

  /**
   * If timeout is set, prepend query with SET STATEMENT max_statement_time=xx FOR, or throw an error
   * @param out buffer
   * @param info server information
   * @returns {boolean} false if an error has been thrown
   */
  handleTimeout(out, info) {
    if (this.opts.timeout) {
      if (info.isMariaDB()) {
        if (info.hasMinVersion(10, 1, 2)) {
          out.writeString(`SET STATEMENT max_statement_time=${this.opts.timeout / 1000} FOR `);
          return true;
        } else {
          this.sendCancelled(
            `Cannot use timeout for xpand/MariaDB server before 10.1.2. timeout value: ${this.opts.timeout}`,
            Errors.ER_TIMEOUT_NOT_SUPPORTED,
            info
          );
          return false;
        }
      } else {
        //not available for MySQL
        // max_execution time exist, but only for select, and as hint
        this.sendCancelled(
          `Cannot use timeout for MySQL server. timeout value: ${this.opts.timeout}`,
          Errors.ER_TIMEOUT_NOT_SUPPORTED,
          info
        );
        return false;
      }
    }
    return true;
  }

  /**
   * Validate that parameters exists and are defined.
   *
   * @param info        connection info
   * @returns {boolean} return false if any error occur.
   */
  validateParameters(info) {
    //validate parameter size.
    if (this.paramPositions.length / 2 > this.values.length) {
      this.sendCancelled(
        `Parameter at position ${this.values.length + 1} is not set`,
        Errors.ER_MISSING_PARAMETER,
        info
      );
      return false;
    }
    return true;
  }

  _paramWritten(out, info) {
    while (true) {
      if (this.valueIdx === this.paramPositions.length / 2) {
        //********************************************
        // all parameters are written.
        // flush packet
        //********************************************
        out.writeBuffer(this.encodedSql, this.sqlPos, this.encodedSql.length - this.sqlPos);
        out.flush();
        this.sending = false;
        this.emit('send_end');
        return;
      } else {
        const value = this.values[this.valueIdx++];
        out.writeBuffer(this.encodedSql, this.sqlPos, this.paramPositions[this.paramPos++] - this.sqlPos);
        this.sqlPos = this.paramPositions[this.paramPos++];

        if (value == null) {
          out.writeStringAscii('NULL');
          continue;
        }

        if (typeof value === 'object' && typeof value.pipe === 'function' && typeof value.read === 'function') {
          //********************************************
          // param is stream,
          //********************************************
          out.writeInt8(QUOTE);
          value.once(
            'end',
            function () {
              out.writeInt8(QUOTE);
              this._paramWritten(out, info);
            }.bind(this)
          );
          value.on('data', out.writeBufferEscape.bind(out));
          return;
        }

        //********************************************
        // param isn't stream. directly write in buffer
        //********************************************
        this.encoder.writeParam(out, value, this.opts, info);
      }
    }
  }

  _stream(socket, options) {
    this.socket = socket;
    options = options || {};
    options.objectMode = true;
    options.read = () => {
      this.socket.resume();
    };
    this.inStream = new Readable(options);

    this.on('fields', function (meta) {
      this.inStream.emit('fields', meta);
    });

    this.on('error', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('close', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('end', function (err) {
      if (err) this.inStream.emit('error', err);
      this.socket.resume();
      this.inStream.push(null);
    });

    this.inStream.close = function () {
      this.handleNewRows = () => {};
      this.socket.resume();
    }.bind(this);

    this.handleNewRows = function (row) {
      if (!this.inStream.push(row)) {
        this.socket.pause();
      }
    };

    return this.inStream;
  }
}

module.exports = Query;


/***/ }),
/* 74 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);
const ServerStatus = __webpack_require__(48);
const ColumnDefinition = __webpack_require__(75);
const Errors = __webpack_require__(13);
const fs = __webpack_require__(68);
const Parse = __webpack_require__(78);
const BinaryDecoder = __webpack_require__(79);
const TextDecoder = __webpack_require__(80);
const OkPacket = __webpack_require__(81);
const StateChange = __webpack_require__(63);
const Collations = __webpack_require__(41);

/**
 * handle COM_QUERY / COM_STMT_EXECUTE results
 * see : https://mariadb.com/kb/en/library/4-server-response-packets/
 */
class Parser extends Command {
  constructor(resolve, reject, connOpts, cmdParam) {
    super(cmdParam, resolve, reject);
    this._responseIndex = 0;
    this._rows = [];
    this.opts = cmdParam.opts ? Object.assign({}, connOpts, cmdParam.opts) : connOpts;
    this.sql = cmdParam.sql;
    this.initialValues = cmdParam.values;
    this.canSkipMeta = false;
  }

  /**
   * Read Query response packet.
   * packet can be :
   * - a result-set
   * - an ERR_Packet
   * - a OK_Packet
   * - LOCAL_INFILE Packet
   *
   * @param packet  query response
   * @param out     output writer
   * @param opts    connection options
   * @param info    connection info
   */
  readResponsePacket(packet, out, opts, info) {
    switch (packet.peek()) {
      //*********************************************************************************************************
      //* OK response
      //*********************************************************************************************************
      case 0x00:
        return this.readOKPacket(packet, out, opts, info);

      //*********************************************************************************************************
      //* ERROR response
      //*********************************************************************************************************
      case 0xff:
        // in case of timeout, free accumulated rows
        this._columns = null;
        this._rows = [];

        const err = packet.readError(info, opts.logParam ? this.displaySql() : this.sql, this.stack);
        //force in transaction status, since query will have created a transaction if autocommit is off
        //goal is to avoid unnecessary COMMIT/ROLLBACK.
        info.status |= ServerStatus.STATUS_IN_TRANS;
        return this.throwError(err, info);

      //*********************************************************************************************************
      //* LOCAL INFILE response
      //*********************************************************************************************************
      case 0xfb:
        return this.readLocalInfile(packet, out, opts, info);

      //*********************************************************************************************************
      //* Parser
      //*********************************************************************************************************
      default:
        return this.readResultSet(packet, info);
    }
  }

  /**
   * Read result-set packets :
   * see https://mariadb.com/kb/en/library/resultset/
   *
   * @param packet    Column count packet
   * @param info      current connection information
   * @returns {Parser.readColumn} next packet handler
   */
  readResultSet(packet, info) {
    this._columnCount = packet.readUnsignedLength();

    this._rows.push([]);
    if (this.canSkipMeta && info.serverPermitSkipMeta && packet.readUInt8() === 0) {
      // command support skipping meta
      // server permits it
      // and tells that no columns follows, using prepare results
      this._columns = this.prepare.columns;
      this.emit('fields', this._columns);
      this.setParser();
      return (this.onPacketReceive = info.eofDeprecated ? this.readResultSetRow : this.readIntermediateEOF);
    }

    this._columns = [];
    this.onPacketReceive = this.readColumn;
  }

  /**
   * Read OK_Packet.
   * see https://mariadb.com/kb/en/library/ok_packet/
   *
   * @param packet    OK_Packet
   * @param opts      connection options
   * @param info      connection information
   * @param out       output writer
   * @returns {*}     null or {Result.readResponsePacket} in case of multi-result-set
   */
  readOKPacket(packet, out, opts, info) {
    packet.skip(1); //skip header

    const affectedRows = packet.readUnsignedLength();
    let insertId = packet.readSignedLengthBigInt();
    info.status = packet.readUInt16();
    if (insertId != null && (this.opts.supportBigNumbers || this.opts.insertIdAsNumber)) {
      if (this.opts.insertIdAsNumber && this.opts.checkNumberRange && !Number.isSafeInteger(Number(insertId))) {
        this.onPacketReceive = info.status & ServerStatus.MORE_RESULTS_EXISTS ? this.readResponsePacket : null;
        this.throwUnexpectedError(
          `last insert id value ${insertId} can't safely be converted to number`,
          false,
          info,
          '42000',
          Errors.ER_PARSING_PRECISION
        );
        return;
      }
      if (this.opts.supportBigNumbers && (this.opts.bigNumberStrings || !Number.isSafeInteger(Number(insertId)))) {
        insertId = insertId.toString();
      } else insertId = Number(insertId);
    }

    const okPacket = new OkPacket(affectedRows, insertId, packet.readUInt16());
    let mustRedirect = false;
    if (info.status & ServerStatus.SESSION_STATE_CHANGED) {
      packet.skipLengthCodedNumber();
      while (packet.remaining()) {
        const len = packet.readUnsignedLength();
        if (len > 0) {
          const subPacket = packet.subPacketLengthEncoded(len);
          while (subPacket.remaining()) {
            const type = subPacket.readUInt8();
            switch (type) {
              case StateChange.SESSION_TRACK_SYSTEM_VARIABLES:
                let subSubPacket;
                do {
                  subSubPacket = subPacket.subPacketLengthEncoded(subPacket.readUnsignedLength());
                  const variable = subSubPacket.readStringLengthEncoded();
                  const value = subSubPacket.readStringLengthEncoded();

                  switch (variable) {
                    case 'character_set_client':
                      info.collation = Collations.fromCharset(value);
                      if (info.collation === undefined) {
                        this.throwError(new Error("unknown charset : '" + value + "'"), info);
                        return;
                      }
                      opts.emit('collation', info.collation);
                      break;

                    case 'redirect_url':
                      mustRedirect = true;
                      info.redirect(value, this.okPacketSuccess.bind(this, okPacket, info));
                      break;

                    case 'connection_id':
                      info.threadId = parseInt(value);
                      break;

                    default:
                    //variable not used by driver
                  }
                } while (subSubPacket.remaining() > 0);
                break;

              case StateChange.SESSION_TRACK_SCHEMA:
                const subSubPacket2 = subPacket.subPacketLengthEncoded(subPacket.readUnsignedLength());
                info.database = subSubPacket2.readStringLengthEncoded();
                break;
            }
          }
        }
      }
    }
    if (!mustRedirect) {
      if (
        info.redirectRequest &&
        (info.status & ServerStatus.STATUS_IN_TRANS) === 0 &&
        (info.status & ServerStatus.MORE_RESULTS_EXISTS) === 0
      ) {
        info.redirect(info.redirectRequest, this.okPacketSuccess.bind(this, okPacket, info));
      } else {
        this.okPacketSuccess(okPacket, info);
      }
    }
  }

  okPacketSuccess(okPacket, info) {
    if (this._responseIndex === 0) {
      // fast path for standard single result
      if (info.status & ServerStatus.MORE_RESULTS_EXISTS) {
        this._rows.push(okPacket);
        this._responseIndex++;
        return (this.onPacketReceive = this.readResponsePacket);
      }
      return this.success(this.opts.metaAsArray ? [okPacket, []] : okPacket);
    }

    this._rows.push(okPacket);

    if (info.status & ServerStatus.MORE_RESULTS_EXISTS) {
      this._responseIndex++;
      return (this.onPacketReceive = this.readResponsePacket);
    }

    if (this.opts.metaAsArray) {
      if (!this._meta) {
        this._meta = new Array(this._responseIndex);
      }
      this._meta[this._responseIndex] = null;
      this.success([this._rows, this._meta]);
    } else {
      this.success(this._rows);
    }
  }

  success(val) {
    this.successEnd(val);
    this._columns = null;
    this._rows = [];
  }

  /**
   * Read column information metadata
   * see https://mariadb.com/kb/en/library/resultset/#column-definition-packet
   *
   * @param packet    column definition packet
   * @param out       output writer
   * @param opts      connection options
   * @param info      connection information
   * @returns {*}
   */
  readColumn(packet, out, opts, info) {
    this._columns.push(new ColumnDefinition(packet, info, this.opts.rowsAsArray));

    // last column
    if (this._columns.length === this._columnCount) {
      this.setParser();
      if (this.canSkipMeta && info.serverPermitSkipMeta && this.prepare != null) {
        // server can skip meta, but have force sending it.
        // metadata have changed, updating prepare result accordingly
        this.prepare.columns = this._columns;
      }
      this.emit('fields', this._columns);

      return (this.onPacketReceive = info.eofDeprecated ? this.readResultSetRow : this.readIntermediateEOF);
    }
  }

  setParser() {
    this._parseFonction = new Array(this._columnCount);
    if (this.opts.typeCast) {
      for (let i = 0; i < this._columnCount; i++) {
        this._parseFonction[i] = this.readCastValue.bind(this, this._columns[i]);
      }
    } else {
      const dataParser = this.binary ? BinaryDecoder.parser : TextDecoder.parser;
      for (let i = 0; i < this._columnCount; i++) {
        this._parseFonction[i] = dataParser(this._columns[i], this.opts);
      }
    }

    if (this.opts.rowsAsArray) {
      this.parseRow = this.parseRowAsArray;
    } else {
      this.tableHeader = new Array(this._columnCount);
      this.parseRow = this.binary ? this.parseRowStdBinary : this.parseRowStdText;
      if (this.opts.nestTables) {
        if (typeof this.opts.nestTables === 'string') {
          for (let i = 0; i < this._columnCount; i++) {
            this.tableHeader[i] = this._columns[i].table() + this.opts.nestTables + this._columns[i].name();
          }
          this.checkDuplicates();
        } else if (this.opts.nestTables === true) {
          this.parseRow = this.parseRowNested;
          for (let i = 0; i < this._columnCount; i++) {
            this.tableHeader[i] = [this._columns[i].table(), this._columns[i].name()];
          }
          this.checkNestTablesDuplicates();
        }
      } else {
        for (let i = 0; i < this._columnCount; i++) {
          this.tableHeader[i] = this._columns[i].name();
        }
        this.checkDuplicates();
      }
    }
  }

  checkDuplicates() {
    if (this.opts.checkDuplicate) {
      for (let i = 0; i < this._columnCount; i++) {
        if (this.tableHeader.indexOf(this.tableHeader[i], i + 1) > 0) {
          const dupes = this.tableHeader.reduce(
            (acc, v, i, arr) => (arr.indexOf(v) !== i && acc.indexOf(v) === -1 ? acc.concat(v) : acc),
            []
          );
          this.throwUnexpectedError(
            `Error in results, duplicate field name \`${dupes[0]}\`.\n(see option \`checkDuplicate\`)`,
            false,
            null,
            '42000',
            Errors.ER_DUPLICATE_FIELD
          );
        }
      }
    }
  }

  checkNestTablesDuplicates() {
    if (this.opts.checkDuplicate) {
      for (let i = 0; i < this._columnCount; i++) {
        for (let j = 0; j < i; j++) {
          if (this.tableHeader[j][0] === this.tableHeader[i][0] && this.tableHeader[j][1] === this.tableHeader[i][1]) {
            this.throwUnexpectedError(
              `Error in results, duplicate field name \`${this.tableHeader[i][0]}\`.\`${this.tableHeader[i][1]}\`\n(see option \`checkDuplicate\`)`,
              false,
              null,
              '42000',
              Errors.ER_DUPLICATE_FIELD
            );
          }
        }
      }
    }
  }

  /**
   * Read intermediate EOF.
   * _only for server before MariaDB 10.2 / MySQL 5.7 that doesn't have CLIENT_DEPRECATE_EOF capability_
   * see https://mariadb.com/kb/en/library/eof_packet/
   *
   * @param packet    EOF Packet
   * @param out       output writer
   * @param opts      connection options
   * @param info      connection information
   * @returns {*}
   */
  readIntermediateEOF(packet, out, opts, info) {
    if (packet.peek() !== 0xfe) {
      return this.throwNewError('Error in protocol, expected EOF packet', true, info, '42000', Errors.ER_EOF_EXPECTED);
    }

    //before MySQL 5.7.5, last EOF doesn't contain the good flag SERVER_MORE_RESULTS_EXISTS
    //for OUT parameters. It must be checked here
    //(5.7.5 does have the CLIENT_DEPRECATE_EOF capability, so this packet in not even send)
    packet.skip(3);
    info.status = packet.readUInt16();
    this.isOutParameter = info.status & ServerStatus.PS_OUT_PARAMS;
    this.onPacketReceive = this.readResultSetRow;
  }

  handleNewRows(row) {
    this._rows[this._responseIndex].push(row);
  }

  /**
   * Check if packet is result-set end = EOF of OK_Packet with EOF header according to CLIENT_DEPRECATE_EOF capability
   * or a result-set row
   *
   * @param packet    current packet
   * @param out       output writer
   * @param opts      connection options
   * @param info      connection information
   * @returns {*}
   */
  readResultSetRow(packet, out, opts, info) {
    if (packet.peek() >= 0xfe) {
      if (packet.peek() === 0xff) {
        //force in transaction status, since query will have created a transaction if autocommit is off
        //goal is to avoid unnecessary COMMIT/ROLLBACK.
        info.status |= ServerStatus.STATUS_IN_TRANS;
        return this.throwError(
          packet.readError(info, this.opts.logParam ? this.displaySql() : this.sql, this.stack),
          info
        );
      }

      if ((!info.eofDeprecated && packet.length() < 13) || (info.eofDeprecated && packet.length() < 0xffffff)) {
        if (!info.eofDeprecated) {
          packet.skip(3);
          info.status = packet.readUInt16();
        } else {
          packet.skip(1); //skip header
          packet.skipLengthCodedNumber(); //skip update count
          packet.skipLengthCodedNumber(); //skip insert id
          info.status = packet.readUInt16();
        }

        if (
          info.redirectRequest &&
          (info.status & ServerStatus.STATUS_IN_TRANS) === 0 &&
          (info.status & ServerStatus.MORE_RESULTS_EXISTS) === 0
        ) {
          info.redirect(info.redirectRequest, this.resultSetEndingPacketResult.bind(this, info));
        } else {
          this.resultSetEndingPacketResult(info);
        }
        return;
      }
    }

    this.handleNewRows(this.parseRow(packet));
  }

  resultSetEndingPacketResult(info) {
    if (this.opts.metaAsArray) {
      //return promise object as array :
      // example for SELECT 1 =>
      // [
      //   [ {"1": 1} ],      //rows
      //   [ColumnDefinition] //meta
      // ]

      if (info.status & ServerStatus.MORE_RESULTS_EXISTS || this.isOutParameter) {
        if (!this._meta) this._meta = [];
        this._meta[this._responseIndex] = this._columns;
        this._responseIndex++;
        return (this.onPacketReceive = this.readResponsePacket);
      }
      if (this._responseIndex === 0) {
        this.success([this._rows[0], this._columns]);
      } else {
        if (!this._meta) this._meta = [];
        this._meta[this._responseIndex] = this._columns;
        this.success([this._rows, this._meta]);
      }
    } else {
      //return promise object as rows that have meta property :
      // example for SELECT 1 =>
      // [
      //   {"1": 1},
      //   meta: [ColumnDefinition]
      // ]
      Object.defineProperty(this._rows[this._responseIndex], 'meta', {
        value: this._columns,
        writable: true,
        enumerable: this.opts.metaEnumerable
      });

      if (info.status & ServerStatus.MORE_RESULTS_EXISTS || this.isOutParameter) {
        this._responseIndex++;
        return (this.onPacketReceive = this.readResponsePacket);
      }
      this.success(this._responseIndex === 0 ? this._rows[0] : this._rows);
    }
  }

  /**
   * Display current SQL with parameters (truncated if too big)
   *
   * @returns {string}
   */
  displaySql() {
    if (this.opts && this.initialValues) {
      if (this.sql.length > this.opts.debugLen) {
        return this.sql.substring(0, this.opts.debugLen) + '...';
      }

      let sqlMsg = this.sql + ' - parameters:';
      return Parser.logParameters(this.opts, sqlMsg, this.initialValues);
    }
    if (this.sql.length > this.opts.debugLen) {
      return this.sql.substring(0, this.opts.debugLen) + '... - parameters:[]';
    }
    return this.sql + ' - parameters:[]';
  }

  static logParameters(opts, sqlMsg, values) {
    if (opts.namedPlaceholders) {
      sqlMsg += '{';
      let first = true;
      for (let key in values) {
        if (first) {
          first = false;
        } else {
          sqlMsg += ',';
        }
        sqlMsg += "'" + key + "':";
        let param = values[key];
        sqlMsg = Parser.logParam(sqlMsg, param);
        if (sqlMsg.length > opts.debugLen) {
          return sqlMsg.substring(0, opts.debugLen) + '...';
        }
      }
      sqlMsg += '}';
    } else {
      sqlMsg += '[';
      if (Array.isArray(values)) {
        for (let i = 0; i < values.length; i++) {
          if (i !== 0) sqlMsg += ',';
          let param = values[i];
          sqlMsg = Parser.logParam(sqlMsg, param);
          if (sqlMsg.length > opts.debugLen) {
            return sqlMsg.substring(0, opts.debugLen) + '...';
          }
        }
      } else {
        sqlMsg = Parser.logParam(sqlMsg, values);
        if (sqlMsg.length > opts.debugLen) {
          return sqlMsg.substring(0, opts.debugLen) + '...';
        }
      }
      sqlMsg += ']';
    }
    return sqlMsg;
  }

  parseRowAsArray(packet) {
    const row = new Array(this._columnCount);
    const nullBitMap = this.binary ? BinaryDecoder.newRow(packet, this._columns) : null;
    for (let i = 0; i < this._columnCount; i++) {
      row[i] = this._parseFonction[i](packet, this.opts, this.unexpectedError, nullBitMap, i);
    }
    return row;
  }

  parseRowNested(packet) {
    const row = {};
    const nullBitMap = this.binary ? BinaryDecoder.newRow(packet, this._columns) : null;
    for (let i = 0; i < this._columnCount; i++) {
      if (!row[this.tableHeader[i][0]]) row[this.tableHeader[i][0]] = {};
      row[this.tableHeader[i][0]][this.tableHeader[i][1]] = this._parseFonction[i](
        packet,
        this.opts,
        this.unexpectedError,
        nullBitMap,
        i
      );
    }
    return row;
  }

  parseRowStdText(packet) {
    const row = {};
    for (let i = 0; i < this._columnCount; i++) {
      row[this.tableHeader[i]] = this._parseFonction[i](packet, this.opts, this.unexpectedError);
    }
    return row;
  }

  parseRowStdBinary(packet) {
    const nullBitMap = BinaryDecoder.newRow(packet, this._columns);
    const row = {};
    for (let i = 0; i < this._columnCount; i++) {
      row[this.tableHeader[i]] = this._parseFonction[i](packet, this.opts, this.unexpectedError, nullBitMap, i);
    }
    return row;
  }

  readCastValue(column, packet, opts, unexpectedError, nullBitmap, index) {
    if (this.binary) {
      BinaryDecoder.castWrapper(column, packet, opts, nullBitmap, index);
    } else {
      TextDecoder.castWrapper(column, packet, opts, nullBitmap, index);
    }
    const dataParser = this.binary ? BinaryDecoder.parser : TextDecoder.parser;
    return opts.typeCast(column, dataParser(column, opts).bind(null, packet, opts, unexpectedError, nullBitmap, index));
  }

  readLocalInfile(packet, out, opts, info) {
    packet.skip(1); //skip header
    out.startPacket(this);

    const fileName = packet.readStringRemaining();

    if (!Parse.validateFileName(this.sql, this.initialValues, fileName)) {
      out.writeEmptyPacket();
      const error = Errors.createError(
        "LOCAL INFILE wrong filename. '" +
          fileName +
          "' doesn't correspond to query " +
          this.sql +
          '. Query cancelled. Check for malicious server / proxy',
        Errors.ER_LOCAL_INFILE_WRONG_FILENAME,
        info,
        'HY000',
        this.sql
      );
      process.nextTick(this.reject, error);
      this.reject = null;
      this.resolve = null;
      return (this.onPacketReceive = this.readResponsePacket);
    }

    // this.sequenceNo = 2;
    // this.compressSequenceNo = 2;
    let stream;
    try {
      stream = this.opts.infileStreamFactory ? this.opts.infileStreamFactory(fileName) : fs.createReadStream(fileName);
    } catch (e) {
      out.writeEmptyPacket();
      const error = Errors.createError(
        `LOCAL INFILE infileStreamFactory failed`,
        Errors.ER_LOCAL_INFILE_NOT_READABLE,
        info,
        '22000',
        this.opts.logParam ? this.displaySql() : this.sql
      );
      error.cause = e;
      process.nextTick(this.reject, error);
      this.reject = null;
      this.resolve = null;
      return (this.onPacketReceive = this.readResponsePacket);
    }

    stream.on(
      'error',
      function (err) {
        out.writeEmptyPacket();
        const error = Errors.createError(
          `LOCAL INFILE command failed: ${err.message}`,
          Errors.ER_LOCAL_INFILE_NOT_READABLE,
          info,
          '22000',
          this.sql
        );
        process.nextTick(this.reject, error);
        this.reject = null;
        this.resolve = null;
      }.bind(this)
    );
    stream.on('data', (chunk) => {
      out.writeBuffer(chunk, 0, chunk.length);
    });
    stream.on('end', () => {
      if (!out.isEmpty()) {
        out.flushBuffer(false);
      }
      out.writeEmptyPacket();
    });
    this.onPacketReceive = this.readResponsePacket;
  }

  static logParam(sqlMsg, param) {
    if (param == null) {
      sqlMsg += param === undefined ? 'undefined' : 'null';
    } else {
      switch (param.constructor.name) {
        case 'Buffer':
          sqlMsg += '0x' + param.toString('hex', 0, Math.min(1024, param.length)) + '';
          break;

        case 'String':
          sqlMsg += "'" + param + "'";
          break;

        case 'Date':
          sqlMsg += getStringDate(param);
          break;

        case 'Object':
          sqlMsg += JSON.stringify(param);
          break;

        default:
          sqlMsg += param.toString();
      }
    }
    return sqlMsg;
  }
}

function getStringDate(param) {
  return (
    "'" +
    ('00' + (param.getMonth() + 1)).slice(-2) +
    '/' +
    ('00' + param.getDate()).slice(-2) +
    '/' +
    param.getFullYear() +
    ' ' +
    ('00' + param.getHours()).slice(-2) +
    ':' +
    ('00' + param.getMinutes()).slice(-2) +
    ':' +
    ('00' + param.getSeconds()).slice(-2) +
    '.' +
    ('000' + param.getMilliseconds()).slice(-3) +
    "'"
  );
}

module.exports = Parser;


/***/ }),
/* 75 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Collations = __webpack_require__(41);
const FieldType = __webpack_require__(76);
const FieldDetails = __webpack_require__(77);
const Capabilities = __webpack_require__(51);

// noinspection JSBitwiseOperatorUsage
/**
 * Column definition
 * see https://mariadb.com/kb/en/library/resultset/#column-definition-packet
 */
class ColumnDef {
  #stringParser;
  constructor(packet, info, skipName) {
    this.#stringParser = skipName ? new StringParser(packet) : new StringParserWithName(packet);
    if (info.clientCapabilities & Capabilities.MARIADB_CLIENT_EXTENDED_TYPE_INFO) {
      const len = packet.readUnsignedLength();
      if (len > 0) {
        const subPacket = packet.subPacketLengthEncoded(len);
        while (subPacket.remaining()) {
          switch (subPacket.readUInt8()) {
            case 0:
              this.dataTypeName = subPacket.readAsciiStringLengthEncoded();
              break;

            case 1:
              this.dataTypeFormat = subPacket.readAsciiStringLengthEncoded();
              break;

            default:
              subPacket.skip(subPacket.readUnsignedLength());
              break;
          }
        }
      }
    }

    packet.skip(1); // length of fixed fields
    this.collation = Collations.fromIndex(packet.readUInt16());
    this.columnLength = packet.readUInt32();
    this.columnType = packet.readUInt8();
    this.flags = packet.readUInt16();
    this.scale = packet.readUInt8();
    this.type = FieldType.TYPES[this.columnType];
  }

  __getDefaultGeomVal() {
    if (this.dataTypeName) {
      switch (this.dataTypeName) {
        case 'point':
          return { type: 'Point' };
        case 'linestring':
          return { type: 'LineString' };
        case 'polygon':
          return { type: 'Polygon' };
        case 'multipoint':
          return { type: 'MultiPoint' };
        case 'multilinestring':
          return { type: 'MultiLineString' };
        case 'multipolygon':
          return { type: 'MultiPolygon' };
        default:
          return { type: this.dataTypeName };
      }
    }
    return null;
  }

  db() {
    return this.#stringParser.db();
  }

  schema() {
    return this.#stringParser.schema();
  }

  table() {
    return this.#stringParser.table();
  }

  orgTable() {
    return this.#stringParser.orgTable();
  }

  name() {
    return this.#stringParser.name();
  }

  orgName() {
    return this.#stringParser.orgName();
  }

  signed() {
    return (this.flags & FieldDetails.UNSIGNED) === 0;
  }

  isSet() {
    return (this.flags & FieldDetails.SET) !== 0;
  }
}

/**
 * String parser.
 * This object permits to avoid listing all private information to metadata object.
 */

class BaseStringParser {
  constructor(readFct, saveBuf) {
    this.buf = saveBuf;
    this.readString = readFct;
  }

  _readIdentifier(skip) {
    let pos = 0;
    while (skip-- > 0) {
      const type = this.buf[pos++] & 0xff;
      pos += type < 0xfb ? type : 2 + this.buf[pos] + this.buf[pos + 1] * 2 ** 8;
    }

    let len;
    const type = this.buf[pos++] & 0xff;
    len = type < 0xfb ? type : this.buf[pos++] + this.buf[pos++] * 2 ** 8;

    return this.readString(this.buf, pos, len);
  }

  name() {
    return this._readIdentifier(3);
  }

  db() {
    return this._readIdentifier(0);
  }

  schema() {
    return this.db();
  }

  table() {
    return this._readIdentifier(1);
  }

  orgTable() {
    return this._readIdentifier(2);
  }

  orgName() {
    return this._readIdentifier(4);
  }
}

class StringParser extends BaseStringParser {
  constructor(packet) {
    packet.skip(4); // skip 'def'
    const initPos = packet.pos;
    packet.skip(packet.readMetadataLength()); //schema
    packet.skip(packet.readMetadataLength()); //table alias
    packet.skip(packet.readMetadataLength()); //table
    packet.skip(packet.readMetadataLength()); //column alias
    packet.skip(packet.readMetadataLength()); //column

    const len = packet.pos - initPos;
    const saveBuf = Buffer.allocUnsafe(packet.pos - initPos);
    for (let i = 0; i < len; i++) saveBuf[i] = packet.buf[initPos + i];

    super(packet.readString.bind(packet), saveBuf);
  }
}

/**
 * String parser.
 * This object permits to avoid listing all private information to metadata object.
 */
class StringParserWithName extends BaseStringParser {
  colName;
  constructor(packet) {
    packet.skip(4); // skip 'def'
    const initPos = packet.pos;
    packet.skip(packet.readMetadataLength()); //schema
    packet.skip(packet.readMetadataLength()); //table alias
    packet.skip(packet.readMetadataLength()); //table
    const colName = packet.readStringLengthEncoded(); //column alias
    packet.skip(packet.readMetadataLength()); //column

    const len = packet.pos - initPos;
    const saveBuf = Buffer.allocUnsafe(packet.pos - initPos);
    for (let i = 0; i < len; i++) saveBuf[i] = packet.buf[initPos + i];

    super(packet.readString.bind(packet), saveBuf);
    this.colName = colName;
  }

  name() {
    return this.colName;
  }
}

module.exports = ColumnDef;


/***/ }),
/* 76 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * Field types
 * see https://mariadb.com/kb/en/library/resultset/#field-types
 */

module.exports.DECIMAL = 0;
module.exports.TINY = 1;
module.exports.SHORT = 2;
module.exports.INT = 3;
module.exports.FLOAT = 4;
module.exports.DOUBLE = 5;
module.exports.NULL = 6;
module.exports.TIMESTAMP = 7;
module.exports.BIGINT = 8;
module.exports.INT24 = 9;
module.exports.DATE = 10;
module.exports.TIME = 11;
module.exports.DATETIME = 12;
module.exports.YEAR = 13;
module.exports.NEWDATE = 14;
module.exports.VARCHAR = 15;
module.exports.BIT = 16;
module.exports.TIMESTAMP2 = 17;
module.exports.DATETIME2 = 18;
module.exports.TIME2 = 19;
module.exports.JSON = 245; //only for MySQL
module.exports.NEWDECIMAL = 246;
module.exports.ENUM = 247;
module.exports.SET = 248;
module.exports.TINY_BLOB = 249;
module.exports.MEDIUM_BLOB = 250;
module.exports.LONG_BLOB = 251;
module.exports.BLOB = 252;
module.exports.VAR_STRING = 253;
module.exports.STRING = 254;
module.exports.GEOMETRY = 255;

const typeNames = [];
typeNames[0] = 'DECIMAL';
typeNames[1] = 'TINY';
typeNames[2] = 'SHORT';
typeNames[3] = 'INT';
typeNames[4] = 'FLOAT';
typeNames[5] = 'DOUBLE';
typeNames[6] = 'NULL';
typeNames[7] = 'TIMESTAMP';
typeNames[8] = 'BIGINT';
typeNames[9] = 'INT24';
typeNames[10] = 'DATE';
typeNames[11] = 'TIME';
typeNames[12] = 'DATETIME';
typeNames[13] = 'YEAR';
typeNames[14] = 'NEWDATE';
typeNames[15] = 'VARCHAR';
typeNames[16] = 'BIT';
typeNames[17] = 'TIMESTAMP2';
typeNames[18] = 'DATETIME2';
typeNames[19] = 'TIME2';
typeNames[245] = 'JSON';
typeNames[246] = 'NEWDECIMAL';
typeNames[247] = 'ENUM';
typeNames[248] = 'SET';
typeNames[249] = 'TINY_BLOB';
typeNames[250] = 'MEDIUM_BLOB';
typeNames[251] = 'LONG_BLOB';
typeNames[252] = 'BLOB';
typeNames[253] = 'VAR_STRING';
typeNames[254] = 'STRING';
typeNames[255] = 'GEOMETRY';

module.exports.TYPES = typeNames;


/***/ }),
/* 77 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * Column definition packet "Field detail" flag value
 * see : https://mariadb.com/kb/en/library/resultset/#field-detail-flag
 */

//	field cannot be null
module.exports.NOT_NULL = 1;
//	field is a primary key
module.exports.PRIMARY_KEY = 2;
//field is unique
module.exports.UNIQUE_KEY = 4;
//field is in a multiple key
module.exports.MULTIPLE_KEY = 8;
//is this field a Blob
module.exports.BLOB = 1 << 4;
//	is this field unsigned
module.exports.UNSIGNED = 1 << 5;
//is this field a zerofill
module.exports.ZEROFILL_FLAG = 1 << 6;
//whether this field has a binary collation
module.exports.BINARY_COLLATION = 1 << 7;
//Field is an enumeration
module.exports.ENUM = 1 << 8;
//field auto-increment
module.exports.AUTO_INCREMENT = 1 << 9;
//field is a timestamp value
module.exports.TIMESTAMP = 1 << 10;
//field is a SET
module.exports.SET = 1 << 11;
//field doesn't have default value
module.exports.NO_DEFAULT_VALUE_FLAG = 1 << 12;
//field is set to NOW on UPDATE
module.exports.ON_UPDATE_NOW_FLAG = 1 << 13;
//field is num
module.exports.NUM_FLAG = 1 << 14;


/***/ }),
/* 78 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

const Errors = __webpack_require__(13);

const State = {
  Normal: 1 /* inside  query */,
  String: 2 /* inside string */,
  SlashStarComment: 3 /* inside slash-star comment */,
  Escape: 4 /* found backslash */,
  EOLComment: 5 /* # comment, or // comment, or -- comment */,
  Backtick: 6 /* found backtick */,
  Placeholder: 7 /* found placeholder */
};

const SLASH_BYTE = '/'.charCodeAt(0);
const STAR_BYTE = '*'.charCodeAt(0);
const BACKSLASH_BYTE = '\\'.charCodeAt(0);
const HASH_BYTE = '#'.charCodeAt(0);
const MINUS_BYTE = '-'.charCodeAt(0);
const LINE_FEED_BYTE = '\n'.charCodeAt(0);
const DBL_QUOTE_BYTE = '"'.charCodeAt(0);
const QUOTE_BYTE = "'".charCodeAt(0);
const RADICAL_BYTE = '`'.charCodeAt(0);
const QUESTION_MARK_BYTE = '?'.charCodeAt(0);
const COLON_BYTE = ':'.charCodeAt(0);
const SEMICOLON_BYTE = ';'.charCodeAt(0);

/**
 * Set question mark position (question mark).
 * Question mark in comment are not taken in account
 *
 * @returns {Array} question mark position
 */
module.exports.splitQuery = function (query) {
  let paramPositions = [];
  let state = State.Normal;
  let lastChar = 0x00;
  let singleQuotes = false;

  const len = query.length;
  for (let i = 0; i < len; i++) {
    if (
      state === State.Escape &&
      !((query[i] === QUOTE_BYTE && singleQuotes) || (query[i] === DBL_QUOTE_BYTE && !singleQuotes))
    ) {
      state = State.String;
      lastChar = query[i];
      continue;
    }
    switch (query[i]) {
      case STAR_BYTE:
        if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.SlashStarComment;
        }
        break;

      case SLASH_BYTE:
        if (state === State.SlashStarComment && lastChar === STAR_BYTE) {
          state = State.Normal;
        } else if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.EOLComment;
        }
        break;

      case HASH_BYTE:
        if (state === State.Normal) {
          state = State.EOLComment;
        }
        break;

      case MINUS_BYTE:
        if (state === State.Normal && lastChar === MINUS_BYTE) {
          state = State.EOLComment;
        }
        break;

      case LINE_FEED_BYTE:
        if (state === State.EOLComment) {
          state = State.Normal;
        }
        break;

      case DBL_QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = false;
        } else if (state === State.String && !singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = true;
        } else if (state === State.String && singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case BACKSLASH_BYTE:
        if (state === State.String) {
          state = State.Escape;
        }
        break;
      case QUESTION_MARK_BYTE:
        if (state === State.Normal) {
          paramPositions.push(i, ++i);
        }
        break;
      case RADICAL_BYTE:
        if (state === State.Backtick) {
          state = State.Normal;
        } else if (state === State.Normal) {
          state = State.Backtick;
        }
        break;
    }
    lastChar = query[i];
  }
  return paramPositions;
};

/**
 * Split query according to parameters using placeholder.
 *
 * @param query           query bytes
 * @param info            connection information
 * @param initialValues   placeholder object
 * @param displaySql      display sql function
 * @returns {{paramPositions: Array, values: Array}}
 */
module.exports.splitQueryPlaceholder = function (query, info, initialValues, displaySql) {
  let paramPositions = [];
  let values = [];
  let state = State.Normal;
  let lastChar = 0x00;
  let singleQuotes = false;
  let car;

  const len = query.length;
  for (let i = 0; i < len; i++) {
    car = query[i];
    if (
      state === State.Escape &&
      !((car === QUOTE_BYTE && singleQuotes) || (car === DBL_QUOTE_BYTE && !singleQuotes))
    ) {
      state = State.String;
      lastChar = car;
      continue;
    }
    switch (car) {
      case STAR_BYTE:
        if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.SlashStarComment;
        }
        break;

      case SLASH_BYTE:
        if (state === State.SlashStarComment && lastChar === STAR_BYTE) {
          state = State.Normal;
        } else if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.EOLComment;
        }
        break;

      case HASH_BYTE:
        if (state === State.Normal) {
          state = State.EOLComment;
        }
        break;

      case MINUS_BYTE:
        if (state === State.Normal && lastChar === MINUS_BYTE) {
          state = State.EOLComment;
        }
        break;

      case LINE_FEED_BYTE:
        if (state === State.EOLComment) {
          state = State.Normal;
        }
        break;

      case DBL_QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = false;
        } else if (state === State.String && !singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = true;
        } else if (state === State.String && singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case BACKSLASH_BYTE:
        if (state === State.String) {
          state = State.Escape;
        }
        break;
      case QUESTION_MARK_BYTE:
        if (state === State.Normal) {
          paramPositions.push(i);
          paramPositions.push(++i);
        }
        break;
      case COLON_BYTE:
        if (state === State.Normal) {
          let j = 1;

          while (
            (i + j < len && query[i + j] >= '0'.charCodeAt(0) && query[i + j] <= '9'.charCodeAt(0)) ||
            (query[i + j] >= 'A'.charCodeAt(0) && query[i + j] <= 'Z'.charCodeAt(0)) ||
            (query[i + j] >= 'a'.charCodeAt(0) && query[i + j] <= 'z'.charCodeAt(0)) ||
            query[i + j] === '-'.charCodeAt(0) ||
            query[i + j] === '_'.charCodeAt(0)
          ) {
            j++;
          }

          paramPositions.push(i, i + j);

          const placeholderName = query.toString('utf8', i + 1, i + j);
          i += j;

          const val = initialValues[placeholderName];
          if (val === undefined) {
            throw Errors.createError(
              `Placeholder '${placeholderName}' is not defined`,
              Errors.ER_PLACEHOLDER_UNDEFINED,
              info,
              'HY000',
              displaySql.call()
            );
          }
          values.push(val);
        }
        break;
      case RADICAL_BYTE:
        if (state === State.Backtick) {
          state = State.Normal;
        } else if (state === State.Normal) {
          state = State.Backtick;
        }
        break;
    }
    lastChar = car;
  }
  return { paramPositions: paramPositions, values: values };
};

module.exports.searchPlaceholder = function (sql) {
  let sqlPlaceHolder = '';
  let placeHolderIndex = [];
  let state = State.Normal;
  let lastChar = '\0';

  let singleQuotes = false;
  let lastParameterPosition = 0;

  let idx = 0;
  let car = sql.charAt(idx++);
  let placeholderName;

  while (car !== '') {
    if (state === State.Escape && !((car === "'" && singleQuotes) || (car === '"' && !singleQuotes))) {
      state = State.String;
      lastChar = car;
      car = sql.charAt(idx++);
      continue;
    }

    switch (car) {
      case '*':
        if (state === State.Normal && lastChar === '/') state = State.SlashStarComment;
        break;

      case '/':
        if (state === State.SlashStarComment && lastChar === '*') state = State.Normal;
        break;

      case '#':
        if (state === State.Normal) state = State.EOLComment;
        break;

      case '-':
        if (state === State.Normal && lastChar === '-') {
          state = State.EOLComment;
        }
        break;

      case '\n':
        if (state === State.EOLComment) {
          state = State.Normal;
        }
        break;

      case '"':
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = false;
        } else if (state === State.String && !singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape && !singleQuotes) {
          state = State.String;
        }
        break;

      case "'":
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = true;
        } else if (state === State.String && singleQuotes) {
          state = State.Normal;
          singleQuotes = false;
        } else if (state === State.Escape && singleQuotes) {
          state = State.String;
        }
        break;

      case '\\':
        if (state === State.String) state = State.Escape;
        break;

      case ':':
        if (state === State.Normal) {
          sqlPlaceHolder += sql.substring(lastParameterPosition, idx - 1) + '?';
          placeholderName = '';
          while (
            ((car = sql.charAt(idx++)) !== '' && car >= '0' && car <= '9') ||
            (car >= 'A' && car <= 'Z') ||
            (car >= 'a' && car <= 'z') ||
            car === '-' ||
            car === '_'
          ) {
            placeholderName += car;
          }
          idx--;
          placeHolderIndex.push(placeholderName);
          lastParameterPosition = idx;
        }
        break;
      case '`':
        if (state === State.Backtick) {
          state = State.Normal;
        } else if (state === State.Normal) {
          state = State.Backtick;
        }
    }
    lastChar = car;

    car = sql.charAt(idx++);
  }
  if (lastParameterPosition === 0) {
    sqlPlaceHolder = sql;
  } else {
    sqlPlaceHolder += sql.substring(lastParameterPosition);
  }

  return { sql: sqlPlaceHolder, placeHolderIndex: placeHolderIndex };
};

/**
 * Ensure that filename requested by server corresponds to query
 * protocol : https://mariadb.com/kb/en/library/local_infile-packet/
 *
 * @param sql         query
 * @param parameters  parameters if any
 * @param fileName    server requested file
 * @returns {boolean} is filename corresponding to query
 */
module.exports.validateFileName = function (sql, parameters, fileName) {
  // in case of windows, file name in query are escaped
  // so for example LOAD DATA LOCAL INFILE 'C:\\Temp\\myFile.txt' ...
  // but server return 'C:\Temp\myFile.txt'
  // so with regex escaped, must test LOAD DATA LOCAL INFILE 'C:\\\\Temp\\\\myFile.txt'
  let queryValidator = new RegExp(
    "^(\\s*\\/\\*([^\\*]|\\*[^\\/])*\\*\\/)*\\s*LOAD\\s+DATA\\s+((LOW_PRIORITY|CONCURRENT)\\s+)?LOCAL\\s+INFILE\\s+'" +
      fileName.replace(/\\/g, '\\\\\\\\').replace('.', '\\.') +
      "'",
    'i'
  );
  if (queryValidator.test(sql)) return true;

  if (parameters != null) {
    queryValidator = new RegExp(
      '^(\\s*\\/\\*([^\\*]|\\*[^\\/])*\\*\\/)*\\s*LOAD\\s+DATA\\s+((LOW_PRIORITY|CONCURRENT)\\s+)?LOCAL\\s+INFILE\\s+\\?',
      'i'
    );
    if (queryValidator.test(sql) && parameters.length > 0) {
      if (Array.isArray(parameters)) {
        return parameters[0].toLowerCase() === fileName.toLowerCase();
      }
      return parameters.toLowerCase() === fileName.toLowerCase();
    }
  }
  return false;
};

/**
 * Parse commands from buffer, returns queries separated by ';'
 * (last one is not parsed)
 *
 * @param bufState buffer
 * @returns {*[]} array of queries contained in buffer
 */
module.exports.parseQueries = function (bufState) {
  let state = State.Normal;
  let lastChar = 0x00;
  let currByte;
  let queries = [];
  let singleQuotes = false;

  for (let i = bufState.offset; i < bufState.end; i++) {
    currByte = bufState.buffer[i];
    if (
      state === State.Escape &&
      !((currByte === QUOTE_BYTE && singleQuotes) || (currByte === DBL_QUOTE_BYTE && !singleQuotes))
    ) {
      state = State.String;
      lastChar = currByte;
      continue;
    }
    switch (currByte) {
      case STAR_BYTE:
        if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.SlashStarComment;
        }
        break;

      case SLASH_BYTE:
        if (state === State.SlashStarComment && lastChar === STAR_BYTE) {
          state = State.Normal;
        } else if (state === State.Normal && lastChar === SLASH_BYTE) {
          state = State.EOLComment;
        }
        break;

      case HASH_BYTE:
        if (state === State.Normal) {
          state = State.EOLComment;
        }
        break;

      case MINUS_BYTE:
        if (state === State.Normal && lastChar === MINUS_BYTE) {
          state = State.EOLComment;
        }
        break;

      case LINE_FEED_BYTE:
        if (state === State.EOLComment) {
          state = State.Normal;
        }
        break;

      case DBL_QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = false;
        } else if (state === State.String && !singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case QUOTE_BYTE:
        if (state === State.Normal) {
          state = State.String;
          singleQuotes = true;
        } else if (state === State.String && singleQuotes) {
          state = State.Normal;
        } else if (state === State.Escape) {
          state = State.String;
        }
        break;

      case BACKSLASH_BYTE:
        if (state === State.String) {
          state = State.Escape;
        }
        break;
      case SEMICOLON_BYTE:
        if (state === State.Normal) {
          queries.push(bufState.buffer.toString('utf8', bufState.offset, i));
          bufState.offset = i + 1;
        }
        break;
      case RADICAL_BYTE:
        if (state === State.Backtick) {
          state = State.Normal;
        } else if (state === State.Normal) {
          state = State.Backtick;
        }
        break;
    }
    lastChar = currByte;
  }
  return queries;
};


/***/ }),
/* 79 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const FieldType = __webpack_require__(76);
const Errors = __webpack_require__(13);

class BinaryDecoder {
  static newRow(packet, columns) {
    packet.skip(1); // skip 0x00 header.
    const len = Math.floor((columns.length + 9) / 8);
    const nullBitMap = new Array(len);
    for (let i = 0; i < len; i++) nullBitMap[i] = packet.readUInt8();
    return nullBitMap;
  }

  static castWrapper(column, packet, opts, nullBitmap, index) {
    column.string = () => (isNullBitmap(index, nullBitmap) ? null : packet.readStringLengthEncoded());
    column.buffer = () => (isNullBitmap(index, nullBitmap) ? null : packet.readBufferLengthEncoded());
    column.float = () => (isNullBitmap(index, nullBitmap) ? null : packet.readFloat());
    column.tiny = () =>
      isNullBitmap(index, nullBitmap) ? null : column.signed() ? packet.readInt8() : packet.readUInt8();
    column.short = () =>
      isNullBitmap(index, nullBitmap) ? null : column.signed() ? packet.readInt16() : packet.readUInt16();
    column.int = () => (isNullBitmap(index, nullBitmap) ? null : packet.readInt32());
    column.long = () => (isNullBitmap(index, nullBitmap) ? null : packet.readBigInt64());
    column.decimal = () => (isNullBitmap(index, nullBitmap) ? null : packet.readDecimalLengthEncoded());
    column.date = () => (isNullBitmap(index, nullBitmap) ? null : packet.readBinaryDate(opts));
    column.datetime = () => (isNullBitmap(index, nullBitmap) ? null : packet.readBinaryDateTime());

    column.geometry = () => {
      let defaultVal = null;
      if (column.dataTypeName) {
        switch (column.dataTypeName) {
          case 'point':
            defaultVal = { type: 'Point' };
            break;
          case 'linestring':
            defaultVal = { type: 'LineString' };
            break;
          case 'polygon':
            defaultVal = { type: 'Polygon' };
            break;
          case 'multipoint':
            defaultVal = { type: 'MultiPoint' };
            break;
          case 'multilinestring':
            defaultVal = { type: 'MultiLineString' };
            break;
          case 'multipolygon':
            defaultVal = { type: 'MultiPolygon' };
            break;
          default:
            defaultVal = { type: column.dataTypeName };
            break;
        }
      }

      if (isNullBitmap(index, nullBitmap)) {
        return defaultVal;
      }
      return packet.readGeometry(defaultVal);
    };
  }
  static parser(col, opts) {
    // set reader function read(col, packet, index, nullBitmap, opts, throwUnexpectedError)
    // this permit for multi-row result-set to avoid resolving type parsing each data.
    switch (col.columnType) {
      case FieldType.TINY:
        return col.signed() ? readTinyBinarySigned : readTinyBinaryUnsigned;

      case FieldType.YEAR:
      case FieldType.SHORT:
        return col.signed() ? readShortBinarySigned : readShortBinaryUnsigned;

      case FieldType.INT24:
        return col.signed() ? readMediumBinarySigned : readMediumBinaryUnsigned;

      case FieldType.INT:
        return col.signed() ? readIntBinarySigned : readIntBinaryUnsigned;

      case FieldType.FLOAT:
        return readFloatBinary;

      case FieldType.DOUBLE:
        return readDoubleBinary;

      case FieldType.BIGINT:
        if (col.signed()) {
          return opts.bigIntAsNumber || opts.supportBigNumbers ? readBigintAsIntBinarySigned : readBigintBinarySigned;
        }
        return opts.bigIntAsNumber || opts.supportBigNumbers ? readBigintAsIntBinaryUnsigned : readBigintBinaryUnsigned;

      case FieldType.DATE:
        return readDateBinary;

      case FieldType.DATETIME:
      case FieldType.TIMESTAMP:
        return opts.dateStrings ? readTimestampStringBinary.bind(null, col.scale) : readTimestampBinary;

      case FieldType.TIME:
        return readTimeBinary;

      case FieldType.DECIMAL:
      case FieldType.NEWDECIMAL:
        return col.scale === 0 ? readDecimalAsIntBinary : readDecimalBinary;

      case FieldType.GEOMETRY:
        let defaultVal = col.__getDefaultGeomVal();
        return readGeometryBinary.bind(null, defaultVal);

      case FieldType.JSON:
        //for mysql only => parse string as JSON object
        return readJsonBinary;

      case FieldType.BIT:
        if (col.columnLength === 1 && opts.bitOneIsBoolean) {
          return readBitBinaryBoolean;
        }
        return readBinaryBuffer;

      default:
        if (col.dataTypeFormat && col.dataTypeFormat === 'json' && opts.autoJsonMap) {
          return readJsonBinary;
        }
        if (col.collation.index === 63) {
          return readBinaryBuffer;
        }
        if (col.isSet()) {
          return readBinarySet;
        }
        return readStringBinary;
    }
  }
}
const isNullBitmap = (index, nullBitmap) => {
  return (nullBitmap[Math.floor((index + 2) / 8)] & (1 << (index + 2) % 8)) > 0;
};

module.exports = BinaryDecoder;

const readTinyBinarySigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readInt8();
const readTinyBinaryUnsigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readUInt8();
const readShortBinarySigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readInt16();
const readShortBinaryUnsigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readUInt16();
const readMediumBinarySigned = (packet, opts, throwUnexpectedError, nullBitmap, index) => {
  if (isNullBitmap(index, nullBitmap)) {
    return null;
  }
  const result = packet.readInt24();
  packet.skip(1); // MEDIUMINT is encoded on 4 bytes in exchanges !
  return result;
};
const readMediumBinaryUnsigned = (packet, opts, throwUnexpectedError, nullBitmap, index) => {
  if (isNullBitmap(index, nullBitmap)) {
    return null;
  }
  const result = packet.readInt24();
  packet.skip(1); // MEDIUMINT is encoded on 4 bytes in exchanges !
  return result;
};
const readIntBinarySigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readInt32();
const readIntBinaryUnsigned = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readUInt32();
const readFloatBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readFloat();
const readDoubleBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readDouble();
const readBigintBinaryUnsigned = function (packet, opts, throwUnexpectedError, nullBitmap, index) {
  if (isNullBitmap(index, nullBitmap)) return null;
  return packet.readBigUInt64();
};
const readBigintBinarySigned = function (packet, opts, throwUnexpectedError, nullBitmap, index) {
  if (isNullBitmap(index, nullBitmap)) return null;
  return packet.readBigInt64();
};

const readBigintAsIntBinaryUnsigned = function (packet, opts, throwUnexpectedError, nullBitmap, index) {
  if (isNullBitmap(index, nullBitmap)) return null;
  const val = packet.readBigUInt64();
  if (opts.bigIntAsNumber && opts.checkNumberRange && !Number.isSafeInteger(Number(val))) {
    return throwUnexpectedError(
      `value ${val} can't safely be converted to number`,
      false,
      null,
      '42000',
      Errors.ER_PARSING_PRECISION
    );
  }
  if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(val)))) {
    return val.toString();
  }
  return Number(val);
};

const readBigintAsIntBinarySigned = function (packet, opts, throwUnexpectedError, nullBitmap, index) {
  if (isNullBitmap(index, nullBitmap)) return null;
  const val = packet.readBigInt64();
  if (opts.bigIntAsNumber && opts.checkNumberRange && !Number.isSafeInteger(Number(val))) {
    return throwUnexpectedError(
      `value ${val} can't safely be converted to number`,
      false,
      null,
      '42000',
      Errors.ER_PARSING_PRECISION
    );
  }
  if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(val)))) {
    return val.toString();
  }
  return Number(val);
};

const readGeometryBinary = (defaultVal, packet, opts, throwUnexpectedError, nullBitmap, index) => {
  if (isNullBitmap(index, nullBitmap)) {
    return defaultVal;
  }
  return packet.readGeometry(defaultVal);
};
const readDateBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBinaryDate(opts);
const readTimestampBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBinaryDateTime();
const readTimestampStringBinary = (scale, packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBinaryDateTimeAsString(scale);
const readTimeBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBinaryTime();
const readDecimalAsIntBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) => {
  //checkNumberRange additional check is only done when
  // resulting value is an integer
  if (isNullBitmap(index, nullBitmap)) return null;
  const valDec = packet.readDecimalLengthEncoded();
  if (valDec != null && (opts.decimalAsNumber || opts.supportBigNumbers)) {
    if (opts.decimalAsNumber && opts.checkNumberRange && !Number.isSafeInteger(Number(valDec))) {
      return throwUnexpectedError(
        `value ${valDec} can't safely be converted to number`,
        false,
        null,
        '42000',
        Errors.ER_PARSING_PRECISION
      );
    }
    if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(valDec)))) {
      return valDec.toString();
    }
    return Number(valDec);
  }
  return valDec;
};
const readDecimalBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) => {
  if (isNullBitmap(index, nullBitmap)) return null;
  const valDec = packet.readDecimalLengthEncoded();
  if (valDec != null && (opts.decimalAsNumber || opts.supportBigNumbers)) {
    if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(valDec)))) {
      return valDec.toString();
    }
    return Number(valDec);
  }
  return valDec;
};
const readJsonBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : JSON.parse(packet.readStringLengthEncoded());
const readBitBinaryBoolean = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBufferLengthEncoded()[0] === 1;
const readBinaryBuffer = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readBufferLengthEncoded();
const readBinarySet = (packet, opts, throwUnexpectedError, nullBitmap, index) => {
  if (isNullBitmap(index, nullBitmap)) return null;
  const string = packet.readStringLengthEncoded();
  return string == null ? null : string === '' ? [] : string.split(',');
};
const readStringBinary = (packet, opts, throwUnexpectedError, nullBitmap, index) =>
  isNullBitmap(index, nullBitmap) ? null : packet.readStringLengthEncoded();


/***/ }),
/* 80 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const FieldType = __webpack_require__(76);
const Errors = __webpack_require__(13);

class TextDecoder {
  static castWrapper(column, packet, opts, nullBitmap, index) {
    column.string = () => packet.readStringLengthEncoded();
    column.buffer = () => packet.readBufferLengthEncoded();
    column.float = () => packet.readFloatLengthCoded();
    column.tiny = () => packet.readIntLengthEncoded();
    column.short = () => packet.readIntLengthEncoded();
    column.int = () => packet.readIntLengthEncoded();
    column.long = () => packet.readBigIntLengthEncoded();
    column.decimal = () => packet.readDecimalLengthEncoded();
    column.date = () => packet.readDate(opts);
    column.datetime = () => packet.readDateTime();

    column.geometry = () => {
      let defaultVal = null;
      if (column.dataTypeName) {
        switch (column.dataTypeName) {
          case 'point':
            defaultVal = { type: 'Point' };
            break;
          case 'linestring':
            defaultVal = { type: 'LineString' };
            break;
          case 'polygon':
            defaultVal = { type: 'Polygon' };
            break;
          case 'multipoint':
            defaultVal = { type: 'MultiPoint' };
            break;
          case 'multilinestring':
            defaultVal = { type: 'MultiLineString' };
            break;
          case 'multipolygon':
            defaultVal = { type: 'MultiPolygon' };
            break;
          default:
            defaultVal = { type: column.dataTypeName };
            break;
        }
      }

      return packet.readGeometry(defaultVal);
    };
  }
  static parser(col, opts) {
    // set reader function read(col, packet, index, nullBitmap, opts, throwUnexpectedError)
    // this permit for multi-row result-set to avoid resolving type parsing each data.

    switch (col.columnType) {
      case FieldType.TINY:
      case FieldType.SHORT:
      case FieldType.INT:
      case FieldType.INT24:
      case FieldType.YEAR:
        return readIntLengthEncoded;

      case FieldType.FLOAT:
      case FieldType.DOUBLE:
        return readFloatLengthCoded;

      case FieldType.BIGINT:
        if (opts.bigIntAsNumber || opts.supportBigNumbers) return readBigIntAsNumberLengthCoded;
        return readBigIntLengthCoded;

      case FieldType.DECIMAL:
      case FieldType.NEWDECIMAL:
        return col.scale === 0 ? readDecimalAsIntLengthCoded : readDecimalLengthCoded;

      case FieldType.DATE:
        return readDate;

      case FieldType.DATETIME:
      case FieldType.TIMESTAMP:
        return readTimestamp;

      case FieldType.TIME:
        return readAsciiStringLengthEncoded;

      case FieldType.GEOMETRY:
        let defaultVal = col.__getDefaultGeomVal();
        return readGeometry.bind(null, defaultVal);

      case FieldType.JSON:
        //for mysql only => parse string as JSON object
        return readJson;

      case FieldType.BIT:
        if (col.columnLength === 1 && opts.bitOneIsBoolean) {
          return readBitAsBoolean;
        }
        return readBufferLengthEncoded;

      default:
        if (col.dataTypeFormat && col.dataTypeFormat === 'json' && opts.autoJsonMap) {
          return readJson;
        }
        if (col.collation.index === 63) {
          return readBufferLengthEncoded;
        }
        if (col.isSet()) {
          return readSet;
        }
        return readStringLengthEncoded;
    }
  }
}

module.exports = TextDecoder;

const readGeometry = (defaultVal, packet, opts, throwUnexpectedError) => packet.readGeometry(defaultVal);

const readIntLengthEncoded = (packet, opts, throwUnexpectedError) => packet.readIntLengthEncoded();
const readStringLengthEncoded = (packet, opts, throwUnexpectedError) => packet.readStringLengthEncoded();
const readFloatLengthCoded = (packet, opts, throwUnexpectedError) => packet.readFloatLengthCoded();
const readBigIntLengthCoded = (packet, opts, throwUnexpectedError) => packet.readBigIntLengthEncoded();

const readBigIntAsNumberLengthCoded = (packet, opts, throwUnexpectedError) => {
  const len = packet.readUnsignedLength();
  if (len === null) return null;
  if (len < 16) {
    const val = packet._atoi(len);
    if (opts.supportBigNumbers && opts.bigNumberStrings) {
      return '' + val;
    }
    return val;
  }

  const val = packet.readBigIntFromLen(len);
  if (opts.bigIntAsNumber && opts.checkNumberRange && !Number.isSafeInteger(Number(val))) {
    return throwUnexpectedError(
      `value ${val} can't safely be converted to number`,
      false,
      null,
      '42000',
      Errors.ER_PARSING_PRECISION
    );
  }
  if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(val)))) {
    return val.toString();
  }
  return Number(val);
};

const readDecimalAsIntLengthCoded = (packet, opts, throwUnexpectedError) => {
  const valDec = packet.readDecimalLengthEncoded();
  if (valDec != null && (opts.decimalAsNumber || opts.supportBigNumbers)) {
    if (opts.decimalAsNumber && opts.checkNumberRange && !Number.isSafeInteger(Number(valDec))) {
      return throwUnexpectedError(
        `value ${valDec} can't safely be converted to number`,
        false,
        null,
        '42000',
        Errors.ER_PARSING_PRECISION
      );
    }
    if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(valDec)))) {
      return valDec.toString();
    }
    return Number(valDec);
  }
  return valDec;
};
const readDecimalLengthCoded = (packet, opts, throwUnexpectedError) => {
  const valDec = packet.readDecimalLengthEncoded();
  if (valDec != null && (opts.decimalAsNumber || opts.supportBigNumbers)) {
    if (opts.supportBigNumbers && (opts.bigNumberStrings || !Number.isSafeInteger(Number(valDec)))) {
      return valDec.toString();
    }
    return Number(valDec);
  }
  return valDec;
};
const readDate = (packet, opts, throwUnexpectedError) => {
  if (opts.dateStrings) {
    return packet.readAsciiStringLengthEncoded();
  }
  return packet.readDate();
};
const readTimestamp = (packet, opts, throwUnexpectedError) => {
  if (opts.dateStrings) {
    return packet.readAsciiStringLengthEncoded();
  }
  return packet.readDateTime();
};
const readAsciiStringLengthEncoded = (packet, opts, throwUnexpectedError) => packet.readAsciiStringLengthEncoded();
const readBitAsBoolean = (packet, opts, throwUnexpectedError) => {
  const val = packet.readBufferLengthEncoded();
  return val == null ? null : val[0] === 1;
};
const readBufferLengthEncoded = (packet, opts, throwUnexpectedError) => packet.readBufferLengthEncoded();
const readJson = (packet, opts, throwUnexpectedError) => JSON.parse(packet.readStringLengthEncoded());
const readSet = (packet, opts, throwUnexpectedError) => {
  const string = packet.readStringLengthEncoded();
  return string == null ? null : string === '' ? [] : string.split(',');
};


/***/ }),
/* 81 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



/**
 * Ok_Packet
 * see https://mariadb.com/kb/en/ok_packet/
 */
class OkPacket {
  constructor(affectedRows, insertId, warningStatus) {
    this.affectedRows = affectedRows;
    this.insertId = insertId;
    this.warningStatus = warningStatus;
  }
}

module.exports = OkPacket;


/***/ }),
/* 82 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const Parser = __webpack_require__(74);
const Parse = __webpack_require__(78);
const BinaryEncoder = __webpack_require__(83);
const PrepareCacheWrapper = __webpack_require__(84);
const PrepareResult = __webpack_require__(86);
const ServerStatus = __webpack_require__(48);
const Errors = __webpack_require__(13);
const ColumnDefinition = __webpack_require__(75);

/**
 * send a COM_STMT_PREPARE: permits sending a prepare packet
 * see https://mariadb.com/kb/en/com_stmt_prepare/
 */
class Prepare extends Parser {
  constructor(resolve, reject, connOpts, cmdParam, conn) {
    super(resolve, reject, connOpts, cmdParam);
    this.encoder = new BinaryEncoder(this.opts);
    this.binary = true;
    this.conn = conn;
  }

  /**
   * Send COM_STMT_PREPARE
   *
   * @param out   output writer
   * @param opts  connection options
   * @param info  connection information
   */
  start(out, opts, info) {
    // check in cache if enabled
    if (this.conn.prepareCache) {
      let cachedPrepare = this.conn.prepareCache.get(this.sql);
      if (cachedPrepare) {
        this.emit('send_end');
        return this.successEnd(cachedPrepare);
      }
    }
    if (opts.logger.query) opts.logger.query(`PREPARE: ${this.sql}`);
    this.onPacketReceive = this.readPrepareResultPacket;

    if (this.opts.namedPlaceholders) {
      const res = Parse.searchPlaceholder(this.sql);
      this.sql = res.sql;
      this.placeHolderIndex = res.placeHolderIndex;
    }

    out.startPacket(this);
    out.writeInt8(0x16);
    out.writeString(this.sql);
    out.flush();
    this.emit('send_end');
  }

  successPrepare(info, opts) {
    let prepare = new PrepareResult(
      this.statementId,
      this.parameterCount,
      this._columns,
      info.database,
      this.sql,
      this.placeHolderIndex,
      this.conn
    );

    if (this.conn.prepareCache) {
      let cached = new PrepareCacheWrapper(prepare);
      this.conn.prepareCache.set(this.sql, cached);
      return this.successEnd(cached.incrementUse());
    }
    return this.successEnd(prepare);
  }

  /**
   * Read COM_STMT_PREPARE response Packet.
   * see https://mariadb.com/kb/en/library/com_stmt_prepare/#com_stmt_prepare-response
   *
   * @param packet    COM_STMT_PREPARE_OK packet
   * @param opts      connection options
   * @param info      connection information
   * @param out       output writer
   * @returns {*}     null or {Result.readResponsePacket} in case of multi-result-set
   */
  readPrepareResultPacket(packet, out, opts, info) {
    switch (packet.peek()) {
      //*********************************************************************************************************
      //* PREPARE response
      //*********************************************************************************************************
      case 0x00:
        packet.skip(1); //skip header
        this.statementId = packet.readInt32();
        this.columnNo = packet.readUInt16();
        this.parameterCount = packet.readUInt16();
        this._parameterNo = this.parameterCount;
        this._columns = [];
        if (this._parameterNo > 0) return (this.onPacketReceive = this.skipPrepareParameterPacket);
        if (this.columnNo > 0) return (this.onPacketReceive = this.readPrepareColumnsPacket);
        return this.successPrepare(info, opts);

      //*********************************************************************************************************
      //* ERROR response
      //*********************************************************************************************************
      case 0xff:
        const err = packet.readError(info, this.displaySql(), this.stack);
        //force in transaction status, since query will have created a transaction if autocommit is off
        //goal is to avoid unnecessary COMMIT/ROLLBACK.
        info.status |= ServerStatus.STATUS_IN_TRANS;
        this.onPacketReceive = this.readResponsePacket;
        return this.throwError(err, info);

      //*********************************************************************************************************
      //* Unexpected response
      //*********************************************************************************************************
      default:
        info.status |= ServerStatus.STATUS_IN_TRANS;
        this.onPacketReceive = this.readResponsePacket;
        return this.throwError(Errors.ER_UNEXPECTED_PACKET, info);
    }
  }

  readPrepareColumnsPacket(packet, out, opts, info) {
    this.columnNo--;
    this._columns.push(new ColumnDefinition(packet, info, opts.rowsAsArray));
    if (this.columnNo === 0) {
      if (info.eofDeprecated) {
        return this.successPrepare(info, opts);
      }
      return (this.onPacketReceive = this.skipEofPacket);
    }
  }

  skipEofPacket(packet, out, opts, info) {
    if (this.columnNo > 0) return (this.onPacketReceive = this.readPrepareColumnsPacket);
    return this.successPrepare(info, opts);
  }

  skipPrepareParameterPacket(packet, out, opts, info) {
    this._parameterNo--;
    if (this._parameterNo === 0) {
      if (info.eofDeprecated) {
        if (this.columnNo > 0) return (this.onPacketReceive = this.readPrepareColumnsPacket);
        return this.successPrepare(info, opts);
      }
      return (this.onPacketReceive = this.skipEofPacket);
    }
  }

  /**
   * Display current SQL with parameters (truncated if too big)
   *
   * @returns {string}
   */
  displaySql() {
    if (this.opts) {
      if (this.sql.length > this.opts.debugLen) {
        return this.sql.substring(0, this.opts.debugLen) + '...';
      }
    }
    return this.sql;
  }
}

module.exports = Prepare;


/***/ }),
/* 83 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



class BinaryEncoder {
  /**
   * Write (and escape) current parameter value to output writer
   *
   * @param out     output writer
   * @param value   current parameter
   * @param opts    connection options
   * @param info    connection information
   */
  writeParam(out, value, opts, info) {
    // GEOJSON are not checked, because change to null/Buffer on parameter validation
    switch (typeof value) {
      case 'boolean':
        out.writeInt8(value ? 0x01 : 0x00);
        break;
      case 'bigint':
        if (value >= 2n ** 63n) {
          out.writeLengthEncodedString(value.toString());
        } else {
          out.writeBigInt(value);
        }
        break;

      case 'number':
        // additional verification, to permit query without type,
        // like 'SELECT ?' returning same type of value
        if (Number.isSafeInteger(value) && value >= -2147483648 && value < 2147483647) {
          out.writeInt32(value);
          break;
        }
        out.writeDouble(value);
        break;
      case 'string':
        out.writeLengthEncodedString(value);
        break;
      case 'object':
        if (value instanceof Date) {
          out.writeBinaryDate(value);
        } else if (Buffer.isBuffer(value)) {
          out.writeLengthEncodedBuffer(value);
        } else if (typeof value.toSqlString === 'function') {
          out.writeLengthEncodedString(String(value.toSqlString()));
        } else {
          out.writeLengthEncodedString(JSON.stringify(value));
        }
        break;
      default:
        out.writeLengthEncodedBuffer(value);
    }
  }

  static getBufferFromGeometryValue(value, headerType) {
    let geoBuff;
    let pos;
    let type;
    if (!headerType) {
      switch (value.type) {
        case 'Point':
          geoBuff = Buffer.allocUnsafe(21);
          geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
          geoBuff.writeInt32LE(1, 1); //wkbPoint
          if (
            value.coordinates &&
            Array.isArray(value.coordinates) &&
            value.coordinates.length >= 2 &&
            !isNaN(value.coordinates[0]) &&
            !isNaN(value.coordinates[1])
          ) {
            geoBuff.writeDoubleLE(value.coordinates[0], 5); //X
            geoBuff.writeDoubleLE(value.coordinates[1], 13); //Y
            return geoBuff;
          } else {
            return null;
          }

        case 'LineString':
          if (value.coordinates && Array.isArray(value.coordinates)) {
            const pointNumber = value.coordinates.length;
            geoBuff = Buffer.allocUnsafe(9 + 16 * pointNumber);
            geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
            geoBuff.writeInt32LE(2, 1); //wkbLineString
            geoBuff.writeInt32LE(pointNumber, 5);
            for (let i = 0; i < pointNumber; i++) {
              if (
                value.coordinates[i] &&
                Array.isArray(value.coordinates[i]) &&
                value.coordinates[i].length >= 2 &&
                !isNaN(value.coordinates[i][0]) &&
                !isNaN(value.coordinates[i][1])
              ) {
                geoBuff.writeDoubleLE(value.coordinates[i][0], 9 + 16 * i); //X
                geoBuff.writeDoubleLE(value.coordinates[i][1], 17 + 16 * i); //Y
              } else {
                return null;
              }
            }
            return geoBuff;
          } else {
            return null;
          }

        case 'Polygon':
          if (value.coordinates && Array.isArray(value.coordinates)) {
            const numRings = value.coordinates.length;
            let size = 0;
            for (let i = 0; i < numRings; i++) {
              size += 4 + 16 * value.coordinates[i].length;
            }
            geoBuff = Buffer.allocUnsafe(9 + size);
            geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
            geoBuff.writeInt32LE(3, 1); //wkbPolygon
            geoBuff.writeInt32LE(numRings, 5);
            pos = 9;
            for (let i = 0; i < numRings; i++) {
              const lineString = value.coordinates[i];
              if (lineString && Array.isArray(lineString)) {
                geoBuff.writeInt32LE(lineString.length, pos);
                pos += 4;
                for (let j = 0; j < lineString.length; j++) {
                  if (
                    lineString[j] &&
                    Array.isArray(lineString[j]) &&
                    lineString[j].length >= 2 &&
                    !isNaN(lineString[j][0]) &&
                    !isNaN(lineString[j][1])
                  ) {
                    geoBuff.writeDoubleLE(lineString[j][0], pos); //X
                    geoBuff.writeDoubleLE(lineString[j][1], pos + 8); //Y
                    pos += 16;
                  } else {
                    return null;
                  }
                }
              }
            }
            return geoBuff;
          } else {
            return null;
          }

        case 'MultiPoint':
          type = 'MultiPoint';
          geoBuff = Buffer.allocUnsafe(9);
          geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
          geoBuff.writeInt32LE(4, 1); //wkbMultiPoint
          break;

        case 'MultiLineString':
          type = 'MultiLineString';
          geoBuff = Buffer.allocUnsafe(9);
          geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
          geoBuff.writeInt32LE(5, 1); //wkbMultiLineString
          break;

        case 'MultiPolygon':
          type = 'MultiPolygon';
          geoBuff = Buffer.allocUnsafe(9);
          geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
          geoBuff.writeInt32LE(6, 1); //wkbMultiPolygon
          break;

        case 'GeometryCollection':
          geoBuff = Buffer.allocUnsafe(9);
          geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
          geoBuff.writeInt32LE(7, 1); //wkbGeometryCollection

          if (value.geometries && Array.isArray(value.geometries)) {
            const coordinateLength = value.geometries.length;
            const subArrays = [geoBuff];
            for (let i = 0; i < coordinateLength; i++) {
              const tmpBuf = this.getBufferFromGeometryValue(value.geometries[i]);
              if (tmpBuf == null) break;
              subArrays.push(tmpBuf);
            }
            geoBuff.writeInt32LE(subArrays.length - 1, 5);
            return Buffer.concat(subArrays);
          } else {
            geoBuff.writeInt32LE(0, 5);
            return geoBuff;
          }
        default:
          return null;
      }
      if (value.coordinates && Array.isArray(value.coordinates)) {
        const coordinateLength = value.coordinates.length;
        const subArrays = [geoBuff];
        for (let i = 0; i < coordinateLength; i++) {
          const tmpBuf = this.getBufferFromGeometryValue(value.coordinates[i], type);
          if (tmpBuf == null) break;
          subArrays.push(tmpBuf);
        }
        geoBuff.writeInt32LE(subArrays.length - 1, 5);
        return Buffer.concat(subArrays);
      } else {
        geoBuff.writeInt32LE(0, 5);
        return geoBuff;
      }
    } else {
      switch (headerType) {
        case 'MultiPoint':
          if (value && Array.isArray(value) && value.length >= 2 && !isNaN(value[0]) && !isNaN(value[1])) {
            geoBuff = Buffer.allocUnsafe(21);
            geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
            geoBuff.writeInt32LE(1, 1); //wkbPoint
            geoBuff.writeDoubleLE(value[0], 5); //X
            geoBuff.writeDoubleLE(value[1], 13); //Y
            return geoBuff;
          }
          return null;

        case 'MultiLineString':
          if (value && Array.isArray(value)) {
            const pointNumber = value.length;
            geoBuff = Buffer.allocUnsafe(9 + 16 * pointNumber);
            geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
            geoBuff.writeInt32LE(2, 1); //wkbLineString
            geoBuff.writeInt32LE(pointNumber, 5);
            for (let i = 0; i < pointNumber; i++) {
              if (
                value[i] &&
                Array.isArray(value[i]) &&
                value[i].length >= 2 &&
                !isNaN(value[i][0]) &&
                !isNaN(value[i][1])
              ) {
                geoBuff.writeDoubleLE(value[i][0], 9 + 16 * i); //X
                geoBuff.writeDoubleLE(value[i][1], 17 + 16 * i); //Y
              } else {
                return null;
              }
            }
            return geoBuff;
          }
          return null;

        case 'MultiPolygon':
          if (value && Array.isArray(value)) {
            const numRings = value.length;
            let size = 0;
            for (let i = 0; i < numRings; i++) {
              size += 4 + 16 * value[i].length;
            }
            geoBuff = Buffer.allocUnsafe(9 + size);
            geoBuff.writeInt8(0x01, 0); //LITTLE ENDIAN
            geoBuff.writeInt32LE(3, 1); //wkbPolygon
            geoBuff.writeInt32LE(numRings, 5);
            pos = 9;
            for (let i = 0; i < numRings; i++) {
              const lineString = value[i];
              if (lineString && Array.isArray(lineString)) {
                geoBuff.writeInt32LE(lineString.length, pos);
                pos += 4;
                for (let j = 0; j < lineString.length; j++) {
                  if (
                    lineString[j] &&
                    Array.isArray(lineString[j]) &&
                    lineString[j].length >= 2 &&
                    !isNaN(lineString[j][0]) &&
                    !isNaN(lineString[j][1])
                  ) {
                    geoBuff.writeDoubleLE(lineString[j][0], pos); //X
                    geoBuff.writeDoubleLE(lineString[j][1], pos + 8); //Y
                    pos += 16;
                  } else {
                    return null;
                  }
                }
              }
            }
            return geoBuff;
          }
          return null;
      }
      return null;
    }
  }
}

module.exports = BinaryEncoder;


/***/ }),
/* 84 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const PrepareWrapper = __webpack_require__(85);

/**
 * Prepare cache wrapper
 * see https://mariadb.com/kb/en/com_stmt_prepare/#com_stmt_prepare_ok
 */
class PrepareCacheWrapper {
  #use = 0;
  #cached;
  #prepare;

  constructor(prepare) {
    this.#prepare = prepare;
    this.#cached = true;
  }

  incrementUse() {
    this.#use += 1;
    return new PrepareWrapper(this, this.#prepare);
  }

  unCache() {
    this.#cached = false;
    if (this.#use === 0) {
      this.#prepare.close();
    }
  }

  decrementUse() {
    this.#use -= 1;
    if (this.#use === 0 && !this.#cached) {
      this.#prepare.close();
    }
  }

  toString() {
    return 'Prepare{use:' + this.#use + ',cached:' + this.#cached + '}';
  }
}

module.exports = PrepareCacheWrapper;


/***/ }),
/* 85 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



/**
 * Prepare result wrapper
 * This permit to ensure that cache can be close only one time cache.
 */
class PrepareWrapper {
  #closed = false;
  #cacheWrapper;
  #prepare;
  #conn;

  constructor(cacheWrapper, prepare) {
    this.#cacheWrapper = cacheWrapper;
    this.#prepare = prepare;
    this.#conn = prepare.conn;
    this.execute = this.#prepare.execute;
    this.executeStream = this.#prepare.executeStream;
  }
  get conn() {
    return this.#conn;
  }

  get id() {
    return this.#prepare.id;
  }

  get parameterCount() {
    return this.#prepare.parameterCount;
  }

  get _placeHolderIndex() {
    return this.#prepare._placeHolderIndex;
  }

  get columns() {
    return this.#prepare.columns;
  }

  set columns(columns) {
    this.#prepare.columns = columns;
  }
  get database() {
    return this.#prepare.database;
  }

  get query() {
    return this.#prepare.query;
  }

  isClose() {
    return this.#closed;
  }

  close() {
    if (!this.#closed) {
      this.#closed = true;
      this.#cacheWrapper.decrementUse();
    }
  }

  toString() {
    return 'PrepareWrapper{closed:' + this.#closed + ',cache:' + this.#cacheWrapper + '}';
  }
}

module.exports = PrepareWrapper;


/***/ }),
/* 86 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const CommandParameter = __webpack_require__(87);
const Errors = __webpack_require__(13);
const ExecuteStream = __webpack_require__(88);
const Parser = __webpack_require__(74);

/**
 * Prepare result
 * see https://mariadb.com/kb/en/com_stmt_prepare/#com_stmt_prepare_ok
 */
class PrepareResultPacket {
  #conn;
  constructor(statementId, parameterCount, columns, database, sql, placeHolderIndex, conn) {
    this.id = statementId;
    this.parameterCount = parameterCount;
    this.columns = columns;
    this.database = database;
    this.query = sql;
    this.closed = false;
    this._placeHolderIndex = placeHolderIndex;
    this.#conn = conn;
  }

  get conn() {
    return this.#conn;
  }

  execute(values, opts, cb, stack) {
    let _opts = opts,
      _cb = cb;

    if (typeof _opts === 'function') {
      _cb = _opts;
      _opts = undefined;
    }

    if (this.isClose()) {
      let sql = this.query;
      if (this.conn.opts.logParam) {
        if (this.query.length > this.conn.opts.debugLen) {
          sql = this.query.substring(0, this.conn.opts.debugLen) + '...';
        } else {
          let sqlMsg = this.query + ' - parameters:';
          sql = Parser.logParameters(this.conn.opts, sqlMsg, values);
        }
      }

      const error = Errors.createError(
        `Execute fails, prepare command as already been closed`,
        Errors.ER_PREPARE_CLOSED,
        null,
        '22000',
        sql
      );

      if (!_cb) {
        return Promise.reject(error);
      } else {
        _cb(error);
        return;
      }
    }

    const cmdParam = new CommandParameter(this.query, values, _opts, _cb);
    if (stack) cmdParam.stack = stack;
    const conn = this.conn;
    const promise = new Promise((resolve, reject) => conn.executePromise.call(conn, cmdParam, this, resolve, reject));
    if (!_cb) {
      return promise;
    } else {
      promise
        .then((res) => {
          if (_cb) _cb(null, res, null);
        })
        .catch(_cb || function (err) {});
    }
  }

  executeStream(values, opts, cb, stack) {
    let _opts = opts,
      _cb = cb;

    if (typeof _opts === 'function') {
      _cb = _opts;
      _opts = undefined;
    }

    if (this.isClose()) {
      const error = Errors.createError(
        `Execute fails, prepare command as already been closed`,
        Errors.ER_PREPARE_CLOSED,
        null,
        '22000',
        this.query
      );

      if (!_cb) {
        throw error;
      } else {
        _cb(error);
        return;
      }
    }

    const cmdParam = new CommandParameter(this.query, values, _opts, _cb);
    if (stack) cmdParam.stack = stack;

    const cmd = new ExecuteStream(cmdParam, this.conn.opts, this, this.conn.socket);
    if (this.conn.opts.logger.error) cmd.on('error', this.conn.opts.logger.error);
    this.conn.addCommand(cmd);
    return cmd.inStream;
  }

  isClose() {
    return this.closed;
  }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.#conn.emit('close_prepare', this);
    }
  }
  toString() {
    return 'Prepare{closed:' + this.closed + '}';
  }
}

module.exports = PrepareResultPacket;


/***/ }),
/* 87 */
/***/ ((module) => {

"use strict";


class CommandParameter {
  constructor(sql, values, opts, callback) {
    this.sql = sql;
    this.values = values;
    this.opts = opts;
    this.callback = callback;
  }
}

module.exports = CommandParameter;


/***/ }),
/* 88 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const Execute = __webpack_require__(89);
const { Readable } = __webpack_require__(40);

/**
 * Protocol COM_STMT_EXECUTE with streaming events.
 * see : https://mariadb.com/kb/en/com_stmt_execute/
 */
class ExecuteStream extends Execute {
  constructor(cmdParam, connOpts, prepare, socket) {
    super(
      () => {},
      () => {},
      connOpts,
      cmdParam,
      prepare
    );
    this.socket = socket;
    this.inStream = new Readable({
      objectMode: true,
      read: () => {
        this.socket.resume();
      }
    });

    this.on('fields', function (meta) {
      this.inStream.emit('fields', meta);
    });

    this.on('error', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('close', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('end', function (err) {
      if (err) this.inStream.emit('error', err);
      this.socket.resume();
      this.inStream.push(null);
    });

    this.inStream.close = function () {
      this.handleNewRows = () => {};
      this.socket.resume();
    }.bind(this);
  }

  handleNewRows(row) {
    if (!this.inStream.push(row)) {
      this.socket.pause();
    }
  }
}

module.exports = ExecuteStream;


/***/ }),
/* 89 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Parser = __webpack_require__(74);
const Errors = __webpack_require__(13);
const BinaryEncoder = __webpack_require__(83);
const FieldType = __webpack_require__(76);

/**
 * Protocol COM_STMT_EXECUTE
 * see : https://mariadb.com/kb/en/com_stmt_execute/
 */
class Execute extends Parser {
  constructor(resolve, reject, connOpts, cmdParam, prepare) {
    super(resolve, reject, connOpts, cmdParam);
    this.encoder = new BinaryEncoder(this.opts);
    this.binary = true;
    this.prepare = prepare;
    this.canSkipMeta = true;
  }

  /**
   * Send COM_QUERY
   *
   * @param out   output writer
   * @param opts  connection options
   * @param info  connection information
   */
  start(out, opts, info) {
    this.onPacketReceive = this.readResponsePacket;
    this.values = [];

    if (this.opts.namedPlaceholders && this.prepare._placeHolderIndex) {
      // using named placeholders, so change values accordingly
      this.values = new Array(this.prepare.parameterCount);
      if (this.initialValues) {
        for (let i = 0; i < this.prepare._placeHolderIndex.length; i++) {
          this.values[i] = this.initialValues[this.prepare._placeHolderIndex[i]];
        }
      }
    } else {
      if (this.initialValues)
        this.values = Array.isArray(this.initialValues) ? this.initialValues : [this.initialValues];
    }

    if (!this.validateParameters(info)) return;

    // send long data using COM_STMT_SEND_LONG_DATA
    this.longDataStep = false; // send long data
    for (let i = 0; i < this.prepare.parameterCount; i++) {
      const value = this.values[i];
      if (
        value != null &&
        ((typeof value === 'object' && typeof value.pipe === 'function' && typeof value.read === 'function') ||
          Buffer.isBuffer(value))
      ) {
        if (opts.logger.query)
          opts.logger.query(`EXECUTE: (${this.prepare.id}) sql: ${opts.logParam ? this.displaySql() : this.sql}`);
        if (!this.longDataStep) {
          this.longDataStep = true;
          this.registerStreamSendEvent(out, info);
          this.currentParam = i;
        }
        this.sendComStmtLongData(out, info, value);
        return;
      }
    }

    if (!this.longDataStep) {
      // no stream parameter, so can send directly
      if (opts.logger.query)
        opts.logger.query(`EXECUTE: (${this.prepare.id}) sql: ${opts.logParam ? this.displaySql() : this.sql}`);
      this.sendComStmtExecute(out, info);
    }
  }

  /**
   * Validate that parameters exists and are defined.
   *
   * @param info        connection info
   * @returns {boolean} return false if any error occur.
   */
  validateParameters(info) {
    //validate parameter size.
    if (this.prepare.parameterCount > this.values.length) {
      this.sendCancelled(
        `Parameter at position ${this.values.length} is not set\\nsql: ${
          this.opts.logParam ? this.displaySql() : this.sql
        }`,
        Errors.ER_MISSING_PARAMETER,
        info
      );
      return false;
    }

    //validate parameter is defined.
    for (let i = 0; i < this.prepare.parameterCount; i++) {
      if (this.opts.namedPlaceholders && this.prepare._placeHolderIndex && this.values[i] === undefined) {
        let errMsg = `Parameter named ${this.prepare._placeHolderIndex[i]} is not set`;
        if (this.prepare._placeHolderIndex.length < this.prepare.parameterCount) {
          errMsg = `Command expect ${this.prepare.parameterCount} parameters, but found only ${this.prepare._placeHolderIndex.length} named parameters. You probably use question mark in place of named parameters`;
        }
        this.sendCancelled(errMsg, Errors.ER_PARAMETER_UNDEFINED, info);
        return false;
      }

      // special check for GEOJSON that can be null even if object is not
      if (
        this.values[i] &&
        this.values[i].type != null &&
        [
          'Point',
          'LineString',
          'Polygon',
          'MultiPoint',
          'MultiLineString',
          'MultiPolygon',
          'GeometryCollection'
        ].includes(this.values[i].type)
      ) {
        const geoBuff = BinaryEncoder.getBufferFromGeometryValue(this.values[i]);
        if (geoBuff == null) {
          this.values[i] = null;
        } else {
          this.values[i] = Buffer.concat([
            Buffer.from([0, 0, 0, 0]), // SRID
            geoBuff // WKB
          ]);
        }
      }
    }
    return true;
  }

  sendComStmtLongData(out, info, value) {
    out.startPacket(this);
    out.writeInt8(0x18);
    out.writeInt32(this.prepare.id);
    out.writeInt16(this.currentParam);

    if (Buffer.isBuffer(value)) {
      out.writeBuffer(value, 0, value.length);
      out.flush();
      this.currentParam++;
      return this.paramWritten();
    }
    this.sending = true;

    // streaming
    value.on('data', function (chunk) {
      out.writeBuffer(chunk, 0, chunk.length);
    });

    value.on(
      'end',
      function () {
        out.flush();
        this.currentParam++;
        this.paramWritten();
      }.bind(this)
    );
  }

  /**
   * Send a COM_STMT_EXECUTE
   * @param out
   * @param info
   */
  sendComStmtExecute(out, info) {
    const parameterCount = this.prepare.parameterCount;

    let nullCount = Math.floor((parameterCount + 7) / 8);
    const nullBitsBuffer = Buffer.alloc(nullCount);
    for (let i = 0; i < parameterCount; i++) {
      if (this.values[i] == null) {
        nullBitsBuffer[Math.floor(i / 8)] |= 1 << i % 8;
      }
    }

    out.startPacket(this);
    out.writeInt8(0x17); // COM_STMT_EXECUTE
    out.writeInt32(this.prepare.id); // Statement id
    out.writeInt8(0); // no cursor flag
    out.writeInt32(1); // 1 command
    out.writeBuffer(nullBitsBuffer, 0, nullCount); // null buffer
    out.writeInt8(1); // always send type to server

    // send types
    for (let i = 0; i < parameterCount; i++) {
      const val = this.values[i];
      if (val != null) {
        switch (typeof val) {
          case 'boolean':
            out.writeInt8(FieldType.TINY);
            break;
          case 'bigint':
            if (val >= 2n ** 63n) {
              out.writeInt8(FieldType.NEWDECIMAL);
            } else {
              out.writeInt8(FieldType.BIGINT);
            }
            break;
          case 'number':
            // additional verification, to permit query without type,
            // like 'SELECT ?' returning same type of value
            if (Number.isSafeInteger(val) && val >= -2147483648 && val < 2147483647) {
              out.writeInt8(FieldType.INT);
              break;
            }
            out.writeInt8(FieldType.DOUBLE);
            break;
          case 'string':
            out.writeInt8(FieldType.VAR_STRING);
            break;
          case 'object':
            if (val instanceof Date) {
              out.writeInt8(FieldType.DATETIME);
            } else if (Buffer.isBuffer(val)) {
              out.writeInt8(FieldType.BLOB);
            } else if (typeof val.toSqlString === 'function') {
              out.writeInt8(FieldType.VAR_STRING);
            } else if (typeof val.pipe === 'function' && typeof val.read === 'function') {
              out.writeInt8(FieldType.BLOB);
            } else {
              out.writeInt8(FieldType.VAR_STRING);
            }
            break;
          default:
            out.writeInt8(FieldType.BLOB);
            break;
        }
      } else {
        out.writeInt8(FieldType.VAR_STRING);
      }
      out.writeInt8(0);
    }

    //********************************************
    // send not null / not streaming values
    //********************************************
    for (let i = 0; i < parameterCount; i++) {
      const value = this.values[i];
      if (
        value != null &&
        !(typeof value === 'object' && typeof value.pipe === 'function' && typeof value.read === 'function') &&
        !Buffer.isBuffer(value)
      ) {
        this.encoder.writeParam(out, value, this.opts, info);
      }
    }
    out.flush();
    this.sending = false;
    this.emit('send_end');
  }

  /**
   * Define params events.
   * Each parameter indicate that he is written to socket,
   * emitting event so next stream parameter can be written.
   */
  registerStreamSendEvent(out, info) {
    // note : Implementation use recursive calls, but stack won't never get near v8 max call stack size
    //since event launched for stream parameter only
    this.paramWritten = function () {
      if (this.longDataStep) {
        for (; this.currentParam < this.prepare.parameterCount; this.currentParam++) {
          const value = this.values[this.currentParam];
          if (
            (value != null &&
              typeof value === 'object' &&
              typeof value.pipe === 'function' &&
              typeof value.read === 'function') ||
            Buffer.isBuffer(value)
          ) {
            this.sendComStmtLongData(out, info, value);
            return;
          }
        }
        this.longDataStep = false; // all streams have been send
      }

      if (!this.longDataStep) {
        this.sendComStmtExecute(out, info);
      }
    }.bind(this);
  }
}

module.exports = Execute;


/***/ }),
/* 90 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Command = __webpack_require__(54);

/**
 * Close prepared statement
 * see https://mariadb.com/kb/en/3-binary-protocol-prepared-statements-com_stmt_close/
 */
class ClosePrepare extends Command {
  constructor(cmdParam, resolve, reject, prepare) {
    super(cmdParam, resolve, reject);
    this.prepare = prepare;
  }

  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query(`CLOSE PREPARE: (${this.prepare.id}) ${this.prepare.query}`);
    const closeCmd = new Uint8Array([
      5,
      0,
      0,
      0,
      0x19,
      this.prepare.id,
      this.prepare.id >> 8,
      this.prepare.id >> 16,
      this.prepare.id >> 24
    ]);
    out.fastFlush(this, closeCmd);
    this.onPacketReceive = null;
    this.emit('send_end');
    this.emit('end');
  }
}

module.exports = ClosePrepare;


/***/ }),
/* 91 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Parser = __webpack_require__(74);
const Errors = __webpack_require__(13);
const BinaryEncoder = __webpack_require__(83);
const FieldType = __webpack_require__(76);
const OkPacket = __webpack_require__(81);

/**
 * Protocol COM_STMT_BULK_EXECUTE
 * see : https://mariadb.com/kb/en/library/com_stmt_bulk_execute/
 */
class BatchBulk extends Parser {
  constructor(resolve, reject, connOpts, prepare, cmdParam) {
    super(resolve, reject, connOpts, cmdParam);
    this.encoder = new BinaryEncoder(this.opts);
    this.cmdOpts = cmdParam.opts;
    this.binary = true;
    this.prepare = prepare;
    this.canSkipMeta = true;
  }

  /**
   * Send COM_STMT_BULK_EXECUTE
   *
   * @param out   output writer
   * @param opts  connection options
   * @param info  connection information
   */
  start(out, opts, info) {
    this.info = info;
    this.values = this.initialValues;

    if (this.cmdOpts && this.cmdOpts.timeout) {
      this.bulkPacketNo = 1;
      this.sending = false;
      return this.sendCancelled('Cannot use timeout for Batch statement', Errors.ER_TIMEOUT_NOT_SUPPORTED);
    }
    this.onPacketReceive = this.readResponsePacket;
    if (this.opts.namedPlaceholders && this.prepare._placeHolderIndex) {
      // using named placeholders, so change values accordingly
      this.values = [];
      if (this.initialValues) {
        for (let r = 0; r < this.initialValues.length; r++) {
          let val = this.initialValues[r];
          this.values[r] = new Array(this.prepare.parameterCount);
          for (let i = 0; i < this.prepare._placeHolderIndex.length; i++) {
            this.values[r][i] = val[this.prepare._placeHolderIndex[i]];
          }
        }
      }
    } else {
      this.values = this.initialValues;
    }

    if (!this.validateParameters(info)) return;

    this.sendComStmtBulkExecute(out, opts, info);
  }

  /**
   * Set header type
   * @param value current value
   * @param parameterCount parameter number
   * @returns {*[]} header type array
   */
  parameterHeaderFromValue(value, parameterCount) {
    const parameterHeaderType = new Array(parameterCount);

    // set header type
    for (let i = 0; i < parameterCount; i++) {
      const val = value[i];
      if (val != null) {
        switch (typeof val) {
          case 'boolean':
            parameterHeaderType[i] = FieldType.TINY;
            break;
          case 'bigint':
            if (val >= 2n ** 63n) {
              parameterHeaderType[i] = FieldType.NEWDECIMAL;
            } else {
              parameterHeaderType[i] = FieldType.BIGINT;
            }
            break;
          case 'number':
            // additional verification, to permit query without type,
            // like 'SELECT ?' returning same type of value
            if (Number.isSafeInteger(val) && val >= -2147483648 && val < 2147483647) {
              parameterHeaderType[i] = FieldType.INT;
              break;
            }
            parameterHeaderType[i] = FieldType.DOUBLE;
            break;
          case 'string':
            parameterHeaderType[i] = FieldType.VAR_STRING;
            break;
          case 'object':
            if (val instanceof Date) {
              parameterHeaderType[i] = FieldType.TIMESTAMP;
            } else if (Buffer.isBuffer(val)) {
              parameterHeaderType[i] = FieldType.BLOB;
            } else if (typeof val.toSqlString === 'function') {
              parameterHeaderType[i] = FieldType.VAR_STRING;
            } else {
              if (
                val.type != null &&
                [
                  'Point',
                  'LineString',
                  'Polygon',
                  'MultiPoint',
                  'MultiLineString',
                  'MultiPolygon',
                  'GeometryCollection'
                ].includes(val.type)
              ) {
                parameterHeaderType[i] = FieldType.BLOB;
              } else {
                parameterHeaderType[i] = FieldType.VAR_STRING;
              }
            }
            break;
          default:
            parameterHeaderType[i] = FieldType.BLOB;
            break;
        }
      } else {
        parameterHeaderType[i] = FieldType.VAR_STRING;
      }
    }
    return parameterHeaderType;
  }

  /**
   * Check current value has same header than set in initial BULK header
   *
   * @param parameterHeaderType current header
   * @param value current value
   * @param parameterCount number of parameter
   * @returns {boolean} true if identical
   */
  checkSameHeader(parameterHeaderType, value, parameterCount) {
    // set header type
    let val;
    for (let i = 0; i < parameterCount; i++) {
      if ((val = value[i]) != null) {
        switch (typeof val) {
          case 'boolean':
            if (parameterHeaderType[i] !== FieldType.TINY) return false;
            break;
          case 'bigint':
            if (val >= 2n ** 63n) {
              if (parameterHeaderType[i] !== FieldType.VAR_STRING) return false;
            } else {
              if (parameterHeaderType[i] !== FieldType.BIGINT) return false;
            }
            break;
          case 'number':
            // additional verification, to permit query without type,
            // like 'SELECT ?' returning same type of value
            if (Number.isSafeInteger(val) && val >= -2147483648 && val < 2147483647) {
              if (parameterHeaderType[i] !== FieldType.INT) return false;
              break;
            }
            if (parameterHeaderType[i] !== FieldType.DOUBLE) return false;
            break;
          case 'string':
            if (parameterHeaderType[i] !== FieldType.VAR_STRING) return false;
            break;
          case 'object':
            if (val instanceof Date) {
              if (parameterHeaderType[i] !== FieldType.TIMESTAMP) return false;
            } else if (Buffer.isBuffer(val)) {
              if (parameterHeaderType[i] !== FieldType.BLOB) return false;
            } else if (typeof val.toSqlString === 'function') {
              if (parameterHeaderType[i] !== FieldType.VAR_STRING) return false;
            } else {
              if (
                val.type != null &&
                [
                  'Point',
                  'LineString',
                  'Polygon',
                  'MultiPoint',
                  'MultiLineString',
                  'MultiPolygon',
                  'GeometryCollection'
                ].includes(val.type)
              ) {
                if (parameterHeaderType[i] !== FieldType.BLOB) return false;
              } else {
                if (parameterHeaderType[i] !== FieldType.VAR_STRING) return false;
              }
            }
            break;
          default:
            if (parameterHeaderType[i] !== FieldType.BLOB) return false;
            break;
        }
      }
    }
    return true;
  }

  /**
   * Send a COM_STMT_BULK_EXECUTE
   * @param out output packet writer
   * @param opts options
   * @param info information
   */
  sendComStmtBulkExecute(out, opts, info) {
    if (opts.logger.query)
      opts.logger.query(`BULK: (${this.prepare.id}) sql: ${opts.logParam ? this.displaySql() : this.sql}`);
    const parameterCount = this.prepare.parameterCount;
    this.rowIdx = 0;
    this.vals = this.values[this.rowIdx++];
    let parameterHeaderType = this.parameterHeaderFromValue(this.vals, parameterCount);
    let lastCmdData = null;
    this.bulkPacketNo = 0;
    this.sending = true;

    /**
     * Implementation After writing bunch of parameter to buffer is marked. then : - when writing
     * next bunch of parameter, if buffer grow more than max_allowed_packet, send buffer up to mark,
     * then create a new packet with current bunch of data - if bunch of parameter data type changes
     * send buffer up to mark, then create a new packet with new data type.
     *
     * <p>Problem remains if a bunch of parameter is bigger than max_allowed_packet
     */
    main_loop: while (true) {
      this.bulkPacketNo++;
      out.startPacket(this);
      out.writeInt8(0xfa); // COM_STMT_BULK_EXECUTE
      out.writeInt32(this.prepare.id); // Statement id
      out.writeInt16(128); // always SEND_TYPES_TO_SERVER

      for (let i = 0; i < parameterCount; i++) {
        out.writeInt16(parameterHeaderType[i]);
      }

      if (lastCmdData != null) {
        const err = out.checkMaxAllowedLength(lastCmdData.length, info);
        if (err) {
          this.throwError(err, info);
          return;
        }
        out.writeBuffer(lastCmdData, 0, lastCmdData.length);
        out.mark();
        lastCmdData = null;
        if (this.rowIdx >= this.values.length) {
          break;
        }
        this.vals = this.values[this.rowIdx++];
      }

      parameter_loop: while (true) {
        for (let i = 0; i < parameterCount; i++) {
          let param = this.vals[i];
          if (param != null) {
            // special check for GEOJSON that can be null even if object is not
            if (
              param.type != null &&
              [
                'Point',
                'LineString',
                'Polygon',
                'MultiPoint',
                'MultiLineString',
                'MultiPolygon',
                'GeometryCollection'
              ].includes(param.type)
            ) {
              const geoBuff = BinaryEncoder.getBufferFromGeometryValue(param);
              if (geoBuff == null) {
                out.writeInt8(0x01); // value is null
              } else {
                out.writeInt8(0x00); // value follow
                param = Buffer.concat([
                  Buffer.from([0, 0, 0, 0]), // SRID
                  geoBuff // WKB
                ]);
                this.encoder.writeParam(out, param, this.opts, info);
              }
            } else {
              out.writeInt8(0x00); // value follow
              this.encoder.writeParam(out, param, this.opts, info);
            }
          } else {
            out.writeInt8(0x01); // value is null
          }
        }

        if (!out.bufIsDataAfterMark() && !out.isMarked() && out.hasFlushed()) {
          // parameter were too big to fit in a MySQL packet
          // need to finish the packet separately
          out.flush();
          if (!this.rowIdx >= this.values.length) {
            break main_loop;
          }
          this.vals = this.values[this.rowIdx++];

          // reset header type
          parameterHeaderType = this.parameterHeaderFromValue(this.vals, parameterCount);
          break parameter_loop;
        }

        if (out.isMarked() && out.bufIsAfterMaxPacketLength()) {
          // for max_allowed_packet < 16Mb
          // packet length was ok at last mark, but won't with new data
          out.flushBufferStopAtMark();
          out.mark();
          lastCmdData = out.resetMark();
          break;
        }

        out.mark();

        if (out.bufIsDataAfterMark()) {
          // flush has been done
          lastCmdData = out.resetMark();
          break;
        }

        if (this.rowIdx >= this.values.length) {
          break main_loop;
        }

        this.vals = this.values[this.rowIdx++];

        // ensure type has not changed
        if (!this.checkSameHeader(parameterHeaderType, this.vals, parameterCount)) {
          out.flush();
          // reset header type
          parameterHeaderType = this.parameterHeaderFromValue(this.vals, parameterCount);
          break parameter_loop;
        }
      }
    }
    out.flush();
    this.sending = false;
    this.emit('send_end');
  }

  displaySql() {
    if (this.sql.length > this.opts.debugLen) {
      return this.sql.substring(0, this.opts.debugLen) + '...';
    }

    let sqlMsg = this.sql + ' - parameters:[';
    for (let i = 0; i < this.initialValues.length; i++) {
      if (i !== 0) sqlMsg += ',';
      let param = this.initialValues[i];
      sqlMsg = Parser.logParameters(this.opts, sqlMsg, param);
      if (sqlMsg.length > this.opts.debugLen) {
        return sqlMsg.substring(0, this.opts.debugLen) + '...';
      }
    }
    sqlMsg += ']';
    return sqlMsg;
  }

  success(val) {
    this.bulkPacketNo--;

    // fast path doesn't push OkPacket if ony one results
    if (this._responseIndex === 0) {
      if (this.opts.metaAsArray) {
        if (val[0] instanceof OkPacket) this._rows.push(val[0]);
      } else if (val instanceof OkPacket) this._rows.push(val);
    }

    if (!this.sending && this.bulkPacketNo === 0) {
      this.packet = null;
      if (this.firstError) {
        this.resolve = null;
        this.onPacketReceive = null;
        this._columns = null;
        this._rows = null;
        process.nextTick(this.reject, this.firstError);
        this.reject = null;
        this.emit('end', this.firstError);
      } else {
        if (this._rows[0].affectedRows !== undefined) {
          // ok packets, reassemble them if needed
          let totalAffectedRows = 0;
          this._rows.forEach((row) => {
            totalAffectedRows += row.affectedRows;
          });

          const rs = new OkPacket(
            totalAffectedRows,
            this._rows[0].insertId,
            this._rows[this._rows.length - 1].warningStatus
          );
          this.successEnd(this.opts.metaAsArray ? [rs, []] : rs);
        } else {
          if (this._rows.length === 1) {
            this.successEnd(this.opts.metaAsArray ? [this._rows[0], this._columns] : this._rows[0]);
          }
          if (this.opts.metaAsArray) {
            if (this._rows.length === 1) {
              this.successEnd([this._rows[0], this._columns]);
            } else {
              const rs = [];
              this._rows.forEach((row) => {
                rs.push(...row);
              });
              this.successEnd([rs, this._columns]);
            }
          } else {
            // insert with returning
            if (this._rows.length === 1) {
              this.successEnd(this._rows[0]);
            } else {
              const rs = [];
              this._rows.forEach((row) => {
                rs.push(...row);
              });
              Object.defineProperty(rs, 'meta', {
                value: this._columns,
                writable: true,
                enumerable: this.opts.metaEnumerable
              });
              this.successEnd(rs);
            }
          }
        }
        this._columns = null;
        this._rows = null;
      }
      return;
    }

    if (!this.firstError) {
      this._responseIndex++;
      this.onPacketReceive = this.readResponsePacket;
    }
  }

  throwError(err, info) {
    this.bulkPacketNo--;
    if (!this.firstError) {
      if (err.fatal) {
        this.bulkPacketNo = 0;
      }
      if (this.stack) {
        err = Errors.createError(err.message, err.errno, info, err.sqlState, this.sql, err.fatal, this.stack, false);
      }
      this.firstError = err;
    }

    if (!this.sending && this.bulkPacketNo === 0) {
      this.resolve = null;
      this.emit('send_end');
      process.nextTick(this.reject, this.firstError);
      this.reject = null;
      this.onPacketReceive = null;
      this.emit('end', this.firstError);
    } else {
      this._responseIndex++;
      this.onPacketReceive = this.readResponsePacket;
    }
  }

  /**
   * Validate that parameters exists and are defined.
   *
   * @param info        connection info
   * @returns {boolean} return false if any error occur.
   */
  validateParameters(info) {
    //validate parameter size.
    const nbParameter = this.prepare.parameterCount;
    for (let r = 0; r < this.values.length; r++) {
      if (!Array.isArray(this.values[r])) this.values[r] = [this.values[r]];

      //validate parameter is defined.
      if (this.values[r].length < nbParameter) {
        this.emit('send_end');
        this.throwNewError(
          `Expect ${nbParameter} parameters, but at index ${r}, parameters only contains ${this.values[r].length}\n ${
            this.opts.logParam ? this.displaySql() : this.sql
          }`,
          false,
          info,
          'HY000',
          Errors.ER_PARAMETER_UNDEFINED
        );
        return false;
      }
    }

    return true;
  }
}

module.exports = BatchBulk;


/***/ }),
/* 92 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

// noinspection JSBitwiseOperatorUsage



const Iconv = __webpack_require__(16);
const Capabilities = __webpack_require__(51);
const Ed25519PasswordAuth = __webpack_require__(65);
const NativePasswordAuth = __webpack_require__(60);
const Collations = __webpack_require__(41);
const Authentication = __webpack_require__(53);

/**
 * send a COM_CHANGE_USER: resets the connection and re-authenticates with the given credentials
 * see https://mariadb.com/kb/en/library/com_change_user/
 */
class ChangeUser extends Authentication {
  constructor(cmdParam, connOpts, resolve, reject, getSocket) {
    super(cmdParam, resolve, reject, () => {}, getSocket);
    this.configAssign(connOpts, cmdParam.opts);
  }

  start(out, opts, info) {
    if (opts.logger.query) opts.logger.query(`CHANGE USER to '${this.opts.user || ''}'`);
    let authToken;
    const pwd = Array.isArray(this.opts.password) ? this.opts.password[0] : this.opts.password;
    switch (info.defaultPluginName) {
      case 'mysql_native_password':
      case '':
        authToken = NativePasswordAuth.encryptSha1Password(pwd, info.seed);
        break;
      case 'client_ed25519':
        authToken = Ed25519PasswordAuth.encryptPassword(pwd, info.seed);
        break;
      default:
        authToken = Buffer.alloc(0);
        break;
    }

    out.startPacket(this);
    out.writeInt8(0x11);
    out.writeString(this.opts.user || '');
    out.writeInt8(0);

    if (info.serverCapabilities & Capabilities.SECURE_CONNECTION) {
      out.writeInt8(authToken.length);
      out.writeBuffer(authToken, 0, authToken.length);
    } else {
      out.writeBuffer(authToken, 0, authToken.length);
      out.writeInt8(0);
    }

    if (info.clientCapabilities & Capabilities.CONNECT_WITH_DB) {
      out.writeString(this.opts.database);
      out.writeInt8(0);
      info.database = this.opts.database;
    }
    // handle default collation.
    if (this.opts.collation) {
      // collation has been set using charset.
      // If server use same charset, use server collation.
      if (!this.opts.charset || info.collation.charset !== this.opts.collation.charset) {
        info.collation = this.opts.collation;
      }
    } else {
      // if not utf8mb4 and no configuration, force to use UTF8MB4_UNICODE_CI
      if (info.collation.charset !== 'utf8' || info.collation.maxLength === 3) {
        info.collation = Collations.fromIndex(224);
      }
    }
    out.writeInt16(info.collation.index);

    if (info.clientCapabilities & Capabilities.PLUGIN_AUTH) {
      out.writeString(info.defaultPluginName);
      out.writeInt8(0);
    }

    if (info.clientCapabilities & Capabilities.CONNECT_ATTRS) {
      out.writeInt8(0xfc);
      let initPos = out.pos; //save position, assuming connection attributes length will be less than 2 bytes length
      out.writeInt16(0);

      const encoding = info.collation.charset;

      writeParam(out, '_client_name', encoding);
      writeParam(out, 'MariaDB connector/Node', encoding);

      let packageJson = __webpack_require__(5);
      writeParam(out, '_client_version', encoding);
      writeParam(out, packageJson.version, encoding);

      writeParam(out, '_node_version', encoding);
      writeParam(out, process.versions.node, encoding);

      if (opts.connectAttributes !== true) {
        let attrNames = Object.keys(this.opts.connectAttributes);
        for (let k = 0; k < attrNames.length; ++k) {
          writeParam(out, attrNames[k], encoding);
          writeParam(out, this.opts.connectAttributes[attrNames[k]], encoding);
        }
      }

      //write end size
      out.writeInt16AtPos(initPos);
    }

    out.flush();
    this.plugin.onPacketReceive = this.handshakeResult.bind(this);
  }

  /**
   * Assign global configuration option used by result-set to current query option.
   * a little faster than Object.assign() since doest copy all information
   *
   * @param connOpts  connection global configuration
   * @param cmdOpts   current options
   */
  configAssign(connOpts, cmdOpts) {
    if (!cmdOpts) {
      this.opts = connOpts;
      return;
    }
    this.opts = cmdOpts ? Object.assign({}, connOpts, cmdOpts) : connOpts;

    if (cmdOpts.charset && typeof cmdOpts.charset === 'string') {
      this.opts.collation = Collations.fromCharset(cmdOpts.charset.toLowerCase());
      if (this.opts.collation === undefined) {
        this.opts.collation = Collations.fromName(cmdOpts.charset.toUpperCase());
        if (this.opts.collation !== undefined) {
          this.opts.logger.warning(
            "warning: please use option 'collation' " +
              "in replacement of 'charset' when using a collation name ('" +
              cmdOpts.charset +
              "')\n" +
              "(collation looks like 'UTF8MB4_UNICODE_CI', charset like 'utf8')."
          );
        }
      }
      if (this.opts.collation === undefined) throw new RangeError("Unknown charset '" + cmdOpts.charset + "'");
    } else if (cmdOpts.collation && typeof cmdOpts.collation === 'string') {
      const initial = cmdOpts.collation;
      this.opts.collation = Collations.fromName(initial.toUpperCase());
      if (this.opts.collation === undefined) throw new RangeError("Unknown collation '" + initial + "'");
    } else {
      this.opts.collation = Collations.fromIndex(cmdOpts.charsetNumber) || connOpts.collation;
    }
    connOpts.password = cmdOpts.password;
  }
}

function writeParam(out, val, encoding) {
  let param = Buffer.isEncoding(encoding) ? Buffer.from(val, encoding) : Iconv.encode(val, encoding);
  out.writeLengthCoded(param.length);
  out.writeBuffer(param, 0, param.length);
}

module.exports = ChangeUser;


/***/ }),
/* 93 */
/***/ ((module) => {

"use strict";


const Status = {
  NOT_CONNECTED: 1,
  CONNECTING: 2,
  AUTHENTICATING: 3,
  INIT_CMD: 4,
  CONNECTED: 5,
  CLOSING: 6,
  CLOSED: 7
};

module.exports.Status = Status;


/***/ }),
/* 94 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab


const LRU = __webpack_require__(95);

/**
 * LRU prepare cache
 *
 */
class LruPrepareCache {
  #lruCache;
  #info;
  constructor(info, prepareCacheLength) {
    this.#info = info;
    this.#lruCache = new LRU.LRUCache({
      max: prepareCacheLength,
      dispose: (value, key) => value.unCache()
    });
  }

  get(sql) {
    const key = this.#info.database + '|' + sql;
    const cachedItem = this.#lruCache.get(key);
    if (cachedItem) {
      return cachedItem.incrementUse();
    }
    return null;
  }

  set(sql, cache) {
    const key = this.#info.database + '|' + sql;
    this.#lruCache.set(key, cache);
  }

  toString() {
    let keyStr = '';
    for (const value of this.#lruCache.keys()) {
      keyStr += '[' + value + '],';
    }
    if (keyStr.length > 1) keyStr = keyStr.substring(0, keyStr.length - 1);
    return 'info{cache:' + keyStr + '}';
  }

  reset() {
    this.#lruCache.clear();
  }
}

module.exports = LruPrepareCache;


/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/**
 * @module LRUCache
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LRUCache = void 0;
const perf = typeof performance === 'object' &&
    performance &&
    typeof performance.now === 'function'
    ? performance
    : Date;
const warned = new Set();
/* c8 ignore start */
const PROCESS = (typeof process === 'object' && !!process ? process : {});
/* c8 ignore start */
const emitWarning = (msg, type, code, fn) => {
    typeof PROCESS.emitWarning === 'function'
        ? PROCESS.emitWarning(msg, type, code, fn)
        : console.error(`[${code}] ${type}: ${msg}`);
};
let AC = globalThis.AbortController;
let AS = globalThis.AbortSignal;
/* c8 ignore start */
if (typeof AC === 'undefined') {
    //@ts-ignore
    AS = class AbortSignal {
        onabort;
        _onabort = [];
        reason;
        aborted = false;
        addEventListener(_, fn) {
            this._onabort.push(fn);
        }
    };
    //@ts-ignore
    AC = class AbortController {
        constructor() {
            warnACPolyfill();
        }
        signal = new AS();
        abort(reason) {
            if (this.signal.aborted)
                return;
            //@ts-ignore
            this.signal.reason = reason;
            //@ts-ignore
            this.signal.aborted = true;
            //@ts-ignore
            for (const fn of this.signal._onabort) {
                fn(reason);
            }
            this.signal.onabort?.(reason);
        }
    };
    let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== '1';
    const warnACPolyfill = () => {
        if (!printACPolyfillWarning)
            return;
        printACPolyfillWarning = false;
        emitWarning('AbortController is not defined. If using lru-cache in ' +
            'node 14, load an AbortController polyfill from the ' +
            '`node-abort-controller` package. A minimal polyfill is ' +
            'provided for use by LRUCache.fetch(), but it should not be ' +
            'relied upon in other contexts (eg, passing it to other APIs that ' +
            'use AbortController/AbortSignal might have undesirable effects). ' +
            'You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.', 'NO_ABORT_CONTROLLER', 'ENOTSUP', warnACPolyfill);
    };
}
/* c8 ignore stop */
const shouldWarn = (code) => !warned.has(code);
const TYPE = Symbol('type');
const isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
/* c8 ignore start */
// This is a little bit ridiculous, tbh.
// The maximum array length is 2^32-1 or thereabouts on most JS impls.
// And well before that point, you're caching the entire world, I mean,
// that's ~32GB of just integers for the next/prev links, plus whatever
// else to hold that many keys and values.  Just filling the memory with
// zeroes at init time is brutal when you get that big.
// But why not be complete?
// Maybe in the future, these limits will have expanded.
const getUintArray = (max) => !isPosInt(max)
    ? null
    : max <= Math.pow(2, 8)
        ? Uint8Array
        : max <= Math.pow(2, 16)
            ? Uint16Array
            : max <= Math.pow(2, 32)
                ? Uint32Array
                : max <= Number.MAX_SAFE_INTEGER
                    ? ZeroArray
                    : null;
/* c8 ignore stop */
class ZeroArray extends Array {
    constructor(size) {
        super(size);
        this.fill(0);
    }
}
class Stack {
    heap;
    length;
    // private constructor
    static #constructing = false;
    static create(max) {
        const HeapCls = getUintArray(max);
        if (!HeapCls)
            return [];
        Stack.#constructing = true;
        const s = new Stack(max, HeapCls);
        Stack.#constructing = false;
        return s;
    }
    constructor(max, HeapCls) {
        /* c8 ignore start */
        if (!Stack.#constructing) {
            throw new TypeError('instantiate Stack using Stack.create(n)');
        }
        /* c8 ignore stop */
        this.heap = new HeapCls(max);
        this.length = 0;
    }
    push(n) {
        this.heap[this.length++] = n;
    }
    pop() {
        return this.heap[--this.length];
    }
}
/**
 * Default export, the thing you're using this module to get.
 *
 * All properties from the options object (with the exception of
 * {@link OptionsBase.max} and {@link OptionsBase.maxSize}) are added as
 * normal public members. (`max` and `maxBase` are read-only getters.)
 * Changing any of these will alter the defaults for subsequent method calls,
 * but is otherwise safe.
 */
class LRUCache {
    // properties coming in from the options of these, only max and maxSize
    // really *need* to be protected. The rest can be modified, as they just
    // set defaults for various methods.
    #max;
    #maxSize;
    #dispose;
    #disposeAfter;
    #fetchMethod;
    /**
     * {@link LRUCache.OptionsBase.ttl}
     */
    ttl;
    /**
     * {@link LRUCache.OptionsBase.ttlResolution}
     */
    ttlResolution;
    /**
     * {@link LRUCache.OptionsBase.ttlAutopurge}
     */
    ttlAutopurge;
    /**
     * {@link LRUCache.OptionsBase.updateAgeOnGet}
     */
    updateAgeOnGet;
    /**
     * {@link LRUCache.OptionsBase.updateAgeOnHas}
     */
    updateAgeOnHas;
    /**
     * {@link LRUCache.OptionsBase.allowStale}
     */
    allowStale;
    /**
     * {@link LRUCache.OptionsBase.noDisposeOnSet}
     */
    noDisposeOnSet;
    /**
     * {@link LRUCache.OptionsBase.noUpdateTTL}
     */
    noUpdateTTL;
    /**
     * {@link LRUCache.OptionsBase.maxEntrySize}
     */
    maxEntrySize;
    /**
     * {@link LRUCache.OptionsBase.sizeCalculation}
     */
    sizeCalculation;
    /**
     * {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
     */
    noDeleteOnFetchRejection;
    /**
     * {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
     */
    noDeleteOnStaleGet;
    /**
     * {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
     */
    allowStaleOnFetchAbort;
    /**
     * {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
     */
    allowStaleOnFetchRejection;
    /**
     * {@link LRUCache.OptionsBase.ignoreFetchAbort}
     */
    ignoreFetchAbort;
    // computed properties
    #size;
    #calculatedSize;
    #keyMap;
    #keyList;
    #valList;
    #next;
    #prev;
    #head;
    #tail;
    #free;
    #disposed;
    #sizes;
    #starts;
    #ttls;
    #hasDispose;
    #hasFetchMethod;
    #hasDisposeAfter;
    /**
     * Do not call this method unless you need to inspect the
     * inner workings of the cache.  If anything returned by this
     * object is modified in any way, strange breakage may occur.
     *
     * These fields are private for a reason!
     *
     * @internal
     */
    static unsafeExposeInternals(c) {
        return {
            // properties
            starts: c.#starts,
            ttls: c.#ttls,
            sizes: c.#sizes,
            keyMap: c.#keyMap,
            keyList: c.#keyList,
            valList: c.#valList,
            next: c.#next,
            prev: c.#prev,
            get head() {
                return c.#head;
            },
            get tail() {
                return c.#tail;
            },
            free: c.#free,
            // methods
            isBackgroundFetch: (p) => c.#isBackgroundFetch(p),
            backgroundFetch: (k, index, options, context) => c.#backgroundFetch(k, index, options, context),
            moveToTail: (index) => c.#moveToTail(index),
            indexes: (options) => c.#indexes(options),
            rindexes: (options) => c.#rindexes(options),
            isStale: (index) => c.#isStale(index),
        };
    }
    // Protected read-only members
    /**
     * {@link LRUCache.OptionsBase.max} (read-only)
     */
    get max() {
        return this.#max;
    }
    /**
     * {@link LRUCache.OptionsBase.maxSize} (read-only)
     */
    get maxSize() {
        return this.#maxSize;
    }
    /**
     * The total computed size of items in the cache (read-only)
     */
    get calculatedSize() {
        return this.#calculatedSize;
    }
    /**
     * The number of items stored in the cache (read-only)
     */
    get size() {
        return this.#size;
    }
    /**
     * {@link LRUCache.OptionsBase.fetchMethod} (read-only)
     */
    get fetchMethod() {
        return this.#fetchMethod;
    }
    /**
     * {@link LRUCache.OptionsBase.dispose} (read-only)
     */
    get dispose() {
        return this.#dispose;
    }
    /**
     * {@link LRUCache.OptionsBase.disposeAfter} (read-only)
     */
    get disposeAfter() {
        return this.#disposeAfter;
    }
    constructor(options) {
        const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort, } = options;
        if (max !== 0 && !isPosInt(max)) {
            throw new TypeError('max option must be a nonnegative integer');
        }
        const UintArray = max ? getUintArray(max) : Array;
        if (!UintArray) {
            throw new Error('invalid max value: ' + max);
        }
        this.#max = max;
        this.#maxSize = maxSize;
        this.maxEntrySize = maxEntrySize || this.#maxSize;
        this.sizeCalculation = sizeCalculation;
        if (this.sizeCalculation) {
            if (!this.#maxSize && !this.maxEntrySize) {
                throw new TypeError('cannot set sizeCalculation without setting maxSize or maxEntrySize');
            }
            if (typeof this.sizeCalculation !== 'function') {
                throw new TypeError('sizeCalculation set to non-function');
            }
        }
        if (fetchMethod !== undefined &&
            typeof fetchMethod !== 'function') {
            throw new TypeError('fetchMethod must be a function if specified');
        }
        this.#fetchMethod = fetchMethod;
        this.#hasFetchMethod = !!fetchMethod;
        this.#keyMap = new Map();
        this.#keyList = new Array(max).fill(undefined);
        this.#valList = new Array(max).fill(undefined);
        this.#next = new UintArray(max);
        this.#prev = new UintArray(max);
        this.#head = 0;
        this.#tail = 0;
        this.#free = Stack.create(max);
        this.#size = 0;
        this.#calculatedSize = 0;
        if (typeof dispose === 'function') {
            this.#dispose = dispose;
        }
        if (typeof disposeAfter === 'function') {
            this.#disposeAfter = disposeAfter;
            this.#disposed = [];
        }
        else {
            this.#disposeAfter = undefined;
            this.#disposed = undefined;
        }
        this.#hasDispose = !!this.#dispose;
        this.#hasDisposeAfter = !!this.#disposeAfter;
        this.noDisposeOnSet = !!noDisposeOnSet;
        this.noUpdateTTL = !!noUpdateTTL;
        this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
        this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
        this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
        this.ignoreFetchAbort = !!ignoreFetchAbort;
        // NB: maxEntrySize is set to maxSize if it's set
        if (this.maxEntrySize !== 0) {
            if (this.#maxSize !== 0) {
                if (!isPosInt(this.#maxSize)) {
                    throw new TypeError('maxSize must be a positive integer if specified');
                }
            }
            if (!isPosInt(this.maxEntrySize)) {
                throw new TypeError('maxEntrySize must be a positive integer if specified');
            }
            this.#initializeSizeTracking();
        }
        this.allowStale = !!allowStale;
        this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
        this.updateAgeOnGet = !!updateAgeOnGet;
        this.updateAgeOnHas = !!updateAgeOnHas;
        this.ttlResolution =
            isPosInt(ttlResolution) || ttlResolution === 0
                ? ttlResolution
                : 1;
        this.ttlAutopurge = !!ttlAutopurge;
        this.ttl = ttl || 0;
        if (this.ttl) {
            if (!isPosInt(this.ttl)) {
                throw new TypeError('ttl must be a positive integer if specified');
            }
            this.#initializeTTLTracking();
        }
        // do not allow completely unbounded caches
        if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
            throw new TypeError('At least one of max, maxSize, or ttl is required');
        }
        if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
            const code = 'LRU_CACHE_UNBOUNDED';
            if (shouldWarn(code)) {
                warned.add(code);
                const msg = 'TTL caching without ttlAutopurge, max, or maxSize can ' +
                    'result in unbounded memory consumption.';
                emitWarning(msg, 'UnboundedCacheWarning', code, LRUCache);
            }
        }
    }
    /**
     * Return the remaining TTL time for a given entry key
     */
    getRemainingTTL(key) {
        return this.#keyMap.has(key) ? Infinity : 0;
    }
    #initializeTTLTracking() {
        const ttls = new ZeroArray(this.#max);
        const starts = new ZeroArray(this.#max);
        this.#ttls = ttls;
        this.#starts = starts;
        this.#setItemTTL = (index, ttl, start = perf.now()) => {
            starts[index] = ttl !== 0 ? start : 0;
            ttls[index] = ttl;
            if (ttl !== 0 && this.ttlAutopurge) {
                const t = setTimeout(() => {
                    if (this.#isStale(index)) {
                        this.delete(this.#keyList[index]);
                    }
                }, ttl + 1);
                // unref() not supported on all platforms
                /* c8 ignore start */
                if (t.unref) {
                    t.unref();
                }
                /* c8 ignore stop */
            }
        };
        this.#updateItemAge = index => {
            starts[index] = ttls[index] !== 0 ? perf.now() : 0;
        };
        this.#statusTTL = (status, index) => {
            if (ttls[index]) {
                const ttl = ttls[index];
                const start = starts[index];
                /* c8 ignore next */
                if (!ttl || !start)
                    return;
                status.ttl = ttl;
                status.start = start;
                status.now = cachedNow || getNow();
                const age = status.now - start;
                status.remainingTTL = ttl - age;
            }
        };
        // debounce calls to perf.now() to 1s so we're not hitting
        // that costly call repeatedly.
        let cachedNow = 0;
        const getNow = () => {
            const n = perf.now();
            if (this.ttlResolution > 0) {
                cachedNow = n;
                const t = setTimeout(() => (cachedNow = 0), this.ttlResolution);
                // not available on all platforms
                /* c8 ignore start */
                if (t.unref) {
                    t.unref();
                }
                /* c8 ignore stop */
            }
            return n;
        };
        this.getRemainingTTL = key => {
            const index = this.#keyMap.get(key);
            if (index === undefined) {
                return 0;
            }
            const ttl = ttls[index];
            const start = starts[index];
            if (!ttl || !start) {
                return Infinity;
            }
            const age = (cachedNow || getNow()) - start;
            return ttl - age;
        };
        this.#isStale = index => {
            const s = starts[index];
            const t = ttls[index];
            return !!t && !!s && (cachedNow || getNow()) - s > t;
        };
    }
    // conditionally set private methods related to TTL
    #updateItemAge = () => { };
    #statusTTL = () => { };
    #setItemTTL = () => { };
    /* c8 ignore stop */
    #isStale = () => false;
    #initializeSizeTracking() {
        const sizes = new ZeroArray(this.#max);
        this.#calculatedSize = 0;
        this.#sizes = sizes;
        this.#removeItemSize = index => {
            this.#calculatedSize -= sizes[index];
            sizes[index] = 0;
        };
        this.#requireSize = (k, v, size, sizeCalculation) => {
            // provisionally accept background fetches.
            // actual value size will be checked when they return.
            if (this.#isBackgroundFetch(v)) {
                return 0;
            }
            if (!isPosInt(size)) {
                if (sizeCalculation) {
                    if (typeof sizeCalculation !== 'function') {
                        throw new TypeError('sizeCalculation must be a function');
                    }
                    size = sizeCalculation(v, k);
                    if (!isPosInt(size)) {
                        throw new TypeError('sizeCalculation return invalid (expect positive integer)');
                    }
                }
                else {
                    throw new TypeError('invalid size value (must be positive integer). ' +
                        'When maxSize or maxEntrySize is used, sizeCalculation ' +
                        'or size must be set.');
                }
            }
            return size;
        };
        this.#addItemSize = (index, size, status) => {
            sizes[index] = size;
            if (this.#maxSize) {
                const maxSize = this.#maxSize - sizes[index];
                while (this.#calculatedSize > maxSize) {
                    this.#evict(true);
                }
            }
            this.#calculatedSize += sizes[index];
            if (status) {
                status.entrySize = size;
                status.totalCalculatedSize = this.#calculatedSize;
            }
        };
    }
    #removeItemSize = _i => { };
    #addItemSize = (_i, _s, _st) => { };
    #requireSize = (_k, _v, size, sizeCalculation) => {
        if (size || sizeCalculation) {
            throw new TypeError('cannot set size without setting maxSize or maxEntrySize on cache');
        }
        return 0;
    };
    *#indexes({ allowStale = this.allowStale } = {}) {
        if (this.#size) {
            for (let i = this.#tail; true;) {
                if (!this.#isValidIndex(i)) {
                    break;
                }
                if (allowStale || !this.#isStale(i)) {
                    yield i;
                }
                if (i === this.#head) {
                    break;
                }
                else {
                    i = this.#prev[i];
                }
            }
        }
    }
    *#rindexes({ allowStale = this.allowStale } = {}) {
        if (this.#size) {
            for (let i = this.#head; true;) {
                if (!this.#isValidIndex(i)) {
                    break;
                }
                if (allowStale || !this.#isStale(i)) {
                    yield i;
                }
                if (i === this.#tail) {
                    break;
                }
                else {
                    i = this.#next[i];
                }
            }
        }
    }
    #isValidIndex(index) {
        return (index !== undefined &&
            this.#keyMap.get(this.#keyList[index]) === index);
    }
    /**
     * Return a generator yielding `[key, value]` pairs,
     * in order from most recently used to least recently used.
     */
    *entries() {
        for (const i of this.#indexes()) {
            if (this.#valList[i] !== undefined &&
                this.#keyList[i] !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield [this.#keyList[i], this.#valList[i]];
            }
        }
    }
    /**
     * Inverse order version of {@link LRUCache.entries}
     *
     * Return a generator yielding `[key, value]` pairs,
     * in order from least recently used to most recently used.
     */
    *rentries() {
        for (const i of this.#rindexes()) {
            if (this.#valList[i] !== undefined &&
                this.#keyList[i] !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield [this.#keyList[i], this.#valList[i]];
            }
        }
    }
    /**
     * Return a generator yielding the keys in the cache,
     * in order from most recently used to least recently used.
     */
    *keys() {
        for (const i of this.#indexes()) {
            const k = this.#keyList[i];
            if (k !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield k;
            }
        }
    }
    /**
     * Inverse order version of {@link LRUCache.keys}
     *
     * Return a generator yielding the keys in the cache,
     * in order from least recently used to most recently used.
     */
    *rkeys() {
        for (const i of this.#rindexes()) {
            const k = this.#keyList[i];
            if (k !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield k;
            }
        }
    }
    /**
     * Return a generator yielding the values in the cache,
     * in order from most recently used to least recently used.
     */
    *values() {
        for (const i of this.#indexes()) {
            const v = this.#valList[i];
            if (v !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield this.#valList[i];
            }
        }
    }
    /**
     * Inverse order version of {@link LRUCache.values}
     *
     * Return a generator yielding the values in the cache,
     * in order from least recently used to most recently used.
     */
    *rvalues() {
        for (const i of this.#rindexes()) {
            const v = this.#valList[i];
            if (v !== undefined &&
                !this.#isBackgroundFetch(this.#valList[i])) {
                yield this.#valList[i];
            }
        }
    }
    /**
     * Iterating over the cache itself yields the same results as
     * {@link LRUCache.entries}
     */
    [Symbol.iterator]() {
        return this.entries();
    }
    /**
     * A String value that is used in the creation of the default string description of an object.
     * Called by the built-in method Object.prototype.toString.
     */
    [Symbol.toStringTag] = 'LRUCache';
    /**
     * Find a value for which the supplied fn method returns a truthy value,
     * similar to Array.find().  fn is called as fn(value, key, cache).
     */
    find(fn, getOptions = {}) {
        for (const i of this.#indexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
                ? v.__staleWhileFetching
                : v;
            if (value === undefined)
                continue;
            if (fn(value, this.#keyList[i], this)) {
                return this.get(this.#keyList[i], getOptions);
            }
        }
    }
    /**
     * Call the supplied function on each item in the cache, in order from
     * most recently used to least recently used.  fn is called as
     * fn(value, key, cache).  Does not update age or recenty of use.
     * Does not iterate over stale values.
     */
    forEach(fn, thisp = this) {
        for (const i of this.#indexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
                ? v.__staleWhileFetching
                : v;
            if (value === undefined)
                continue;
            fn.call(thisp, value, this.#keyList[i], this);
        }
    }
    /**
     * The same as {@link LRUCache.forEach} but items are iterated over in
     * reverse order.  (ie, less recently used items are iterated over first.)
     */
    rforEach(fn, thisp = this) {
        for (const i of this.#rindexes()) {
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
                ? v.__staleWhileFetching
                : v;
            if (value === undefined)
                continue;
            fn.call(thisp, value, this.#keyList[i], this);
        }
    }
    /**
     * Delete any stale entries. Returns true if anything was removed,
     * false otherwise.
     */
    purgeStale() {
        let deleted = false;
        for (const i of this.#rindexes({ allowStale: true })) {
            if (this.#isStale(i)) {
                this.delete(this.#keyList[i]);
                deleted = true;
            }
        }
        return deleted;
    }
    /**
     * Get the extended info about a given entry, to get its value, size, and
     * TTL info simultaneously. Like {@link LRUCache#dump}, but just for a
     * single key. Always returns stale values, if their info is found in the
     * cache, so be sure to check for expired TTLs if relevant.
     */
    info(key) {
        const i = this.#keyMap.get(key);
        if (i === undefined)
            return undefined;
        const v = this.#valList[i];
        const value = this.#isBackgroundFetch(v)
            ? v.__staleWhileFetching
            : v;
        if (value === undefined)
            return undefined;
        const entry = { value };
        if (this.#ttls && this.#starts) {
            const ttl = this.#ttls[i];
            const start = this.#starts[i];
            if (ttl && start) {
                const remain = ttl - (perf.now() - start);
                entry.ttl = remain;
                entry.start = Date.now();
            }
        }
        if (this.#sizes) {
            entry.size = this.#sizes[i];
        }
        return entry;
    }
    /**
     * Return an array of [key, {@link LRUCache.Entry}] tuples which can be
     * passed to cache.load()
     */
    dump() {
        const arr = [];
        for (const i of this.#indexes({ allowStale: true })) {
            const key = this.#keyList[i];
            const v = this.#valList[i];
            const value = this.#isBackgroundFetch(v)
                ? v.__staleWhileFetching
                : v;
            if (value === undefined || key === undefined)
                continue;
            const entry = { value };
            if (this.#ttls && this.#starts) {
                entry.ttl = this.#ttls[i];
                // always dump the start relative to a portable timestamp
                // it's ok for this to be a bit slow, it's a rare operation.
                const age = perf.now() - this.#starts[i];
                entry.start = Math.floor(Date.now() - age);
            }
            if (this.#sizes) {
                entry.size = this.#sizes[i];
            }
            arr.unshift([key, entry]);
        }
        return arr;
    }
    /**
     * Reset the cache and load in the items in entries in the order listed.
     * Note that the shape of the resulting cache may be different if the
     * same options are not used in both caches.
     */
    load(arr) {
        this.clear();
        for (const [key, entry] of arr) {
            if (entry.start) {
                // entry.start is a portable timestamp, but we may be using
                // node's performance.now(), so calculate the offset, so that
                // we get the intended remaining TTL, no matter how long it's
                // been on ice.
                //
                // it's ok for this to be a bit slow, it's a rare operation.
                const age = Date.now() - entry.start;
                entry.start = perf.now() - age;
            }
            this.set(key, entry.value, entry);
        }
    }
    /**
     * Add a value to the cache.
     *
     * Note: if `undefined` is specified as a value, this is an alias for
     * {@link LRUCache#delete}
     */
    set(k, v, setOptions = {}) {
        if (v === undefined) {
            this.delete(k);
            return this;
        }
        const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status, } = setOptions;
        let { noUpdateTTL = this.noUpdateTTL } = setOptions;
        const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
        // if the item doesn't fit, don't do anything
        // NB: maxEntrySize set to maxSize by default
        if (this.maxEntrySize && size > this.maxEntrySize) {
            if (status) {
                status.set = 'miss';
                status.maxEntrySizeExceeded = true;
            }
            // have to delete, in case something is there already.
            this.delete(k);
            return this;
        }
        let index = this.#size === 0 ? undefined : this.#keyMap.get(k);
        if (index === undefined) {
            // addition
            index = (this.#size === 0
                ? this.#tail
                : this.#free.length !== 0
                    ? this.#free.pop()
                    : this.#size === this.#max
                        ? this.#evict(false)
                        : this.#size);
            this.#keyList[index] = k;
            this.#valList[index] = v;
            this.#keyMap.set(k, index);
            this.#next[this.#tail] = index;
            this.#prev[index] = this.#tail;
            this.#tail = index;
            this.#size++;
            this.#addItemSize(index, size, status);
            if (status)
                status.set = 'add';
            noUpdateTTL = false;
        }
        else {
            // update
            this.#moveToTail(index);
            const oldVal = this.#valList[index];
            if (v !== oldVal) {
                if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
                    oldVal.__abortController.abort(new Error('replaced'));
                    const { __staleWhileFetching: s } = oldVal;
                    if (s !== undefined && !noDisposeOnSet) {
                        if (this.#hasDispose) {
                            this.#dispose?.(s, k, 'set');
                        }
                        if (this.#hasDisposeAfter) {
                            this.#disposed?.push([s, k, 'set']);
                        }
                    }
                }
                else if (!noDisposeOnSet) {
                    if (this.#hasDispose) {
                        this.#dispose?.(oldVal, k, 'set');
                    }
                    if (this.#hasDisposeAfter) {
                        this.#disposed?.push([oldVal, k, 'set']);
                    }
                }
                this.#removeItemSize(index);
                this.#addItemSize(index, size, status);
                this.#valList[index] = v;
                if (status) {
                    status.set = 'replace';
                    const oldValue = oldVal && this.#isBackgroundFetch(oldVal)
                        ? oldVal.__staleWhileFetching
                        : oldVal;
                    if (oldValue !== undefined)
                        status.oldValue = oldValue;
                }
            }
            else if (status) {
                status.set = 'update';
            }
        }
        if (ttl !== 0 && !this.#ttls) {
            this.#initializeTTLTracking();
        }
        if (this.#ttls) {
            if (!noUpdateTTL) {
                this.#setItemTTL(index, ttl, start);
            }
            if (status)
                this.#statusTTL(status, index);
        }
        if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
        return this;
    }
    /**
     * Evict the least recently used item, returning its value or
     * `undefined` if cache is empty.
     */
    pop() {
        try {
            while (this.#size) {
                const val = this.#valList[this.#head];
                this.#evict(true);
                if (this.#isBackgroundFetch(val)) {
                    if (val.__staleWhileFetching) {
                        return val.__staleWhileFetching;
                    }
                }
                else if (val !== undefined) {
                    return val;
                }
            }
        }
        finally {
            if (this.#hasDisposeAfter && this.#disposed) {
                const dt = this.#disposed;
                let task;
                while ((task = dt?.shift())) {
                    this.#disposeAfter?.(...task);
                }
            }
        }
    }
    #evict(free) {
        const head = this.#head;
        const k = this.#keyList[head];
        const v = this.#valList[head];
        if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error('evicted'));
        }
        else if (this.#hasDispose || this.#hasDisposeAfter) {
            if (this.#hasDispose) {
                this.#dispose?.(v, k, 'evict');
            }
            if (this.#hasDisposeAfter) {
                this.#disposed?.push([v, k, 'evict']);
            }
        }
        this.#removeItemSize(head);
        // if we aren't about to use the index, then null these out
        if (free) {
            this.#keyList[head] = undefined;
            this.#valList[head] = undefined;
            this.#free.push(head);
        }
        if (this.#size === 1) {
            this.#head = this.#tail = 0;
            this.#free.length = 0;
        }
        else {
            this.#head = this.#next[head];
        }
        this.#keyMap.delete(k);
        this.#size--;
        return head;
    }
    /**
     * Check if a key is in the cache, without updating the recency of use.
     * Will return false if the item is stale, even though it is technically
     * in the cache.
     *
     * Will not update item age unless
     * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
     */
    has(k, hasOptions = {}) {
        const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
        const index = this.#keyMap.get(k);
        if (index !== undefined) {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v) &&
                v.__staleWhileFetching === undefined) {
                return false;
            }
            if (!this.#isStale(index)) {
                if (updateAgeOnHas) {
                    this.#updateItemAge(index);
                }
                if (status) {
                    status.has = 'hit';
                    this.#statusTTL(status, index);
                }
                return true;
            }
            else if (status) {
                status.has = 'stale';
                this.#statusTTL(status, index);
            }
        }
        else if (status) {
            status.has = 'miss';
        }
        return false;
    }
    /**
     * Like {@link LRUCache#get} but doesn't update recency or delete stale
     * items.
     *
     * Returns `undefined` if the item is stale, unless
     * {@link LRUCache.OptionsBase.allowStale} is set.
     */
    peek(k, peekOptions = {}) {
        const { allowStale = this.allowStale } = peekOptions;
        const index = this.#keyMap.get(k);
        if (index === undefined ||
            (!allowStale && this.#isStale(index))) {
            return;
        }
        const v = this.#valList[index];
        // either stale and allowed, or forcing a refresh of non-stale value
        return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
    }
    #backgroundFetch(k, index, options, context) {
        const v = index === undefined ? undefined : this.#valList[index];
        if (this.#isBackgroundFetch(v)) {
            return v;
        }
        const ac = new AC();
        const { signal } = options;
        // when/if our AC signals, then stop listening to theirs.
        signal?.addEventListener('abort', () => ac.abort(signal.reason), {
            signal: ac.signal,
        });
        const fetchOpts = {
            signal: ac.signal,
            options,
            context,
        };
        const cb = (v, updateCache = false) => {
            const { aborted } = ac.signal;
            const ignoreAbort = options.ignoreFetchAbort && v !== undefined;
            if (options.status) {
                if (aborted && !updateCache) {
                    options.status.fetchAborted = true;
                    options.status.fetchError = ac.signal.reason;
                    if (ignoreAbort)
                        options.status.fetchAbortIgnored = true;
                }
                else {
                    options.status.fetchResolved = true;
                }
            }
            if (aborted && !ignoreAbort && !updateCache) {
                return fetchFail(ac.signal.reason);
            }
            // either we didn't abort, and are still here, or we did, and ignored
            const bf = p;
            if (this.#valList[index] === p) {
                if (v === undefined) {
                    if (bf.__staleWhileFetching) {
                        this.#valList[index] = bf.__staleWhileFetching;
                    }
                    else {
                        this.delete(k);
                    }
                }
                else {
                    if (options.status)
                        options.status.fetchUpdated = true;
                    this.set(k, v, fetchOpts.options);
                }
            }
            return v;
        };
        const eb = (er) => {
            if (options.status) {
                options.status.fetchRejected = true;
                options.status.fetchError = er;
            }
            return fetchFail(er);
        };
        const fetchFail = (er) => {
            const { aborted } = ac.signal;
            const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
            const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
            const noDelete = allowStale || options.noDeleteOnFetchRejection;
            const bf = p;
            if (this.#valList[index] === p) {
                // if we allow stale on fetch rejections, then we need to ensure that
                // the stale value is not removed from the cache when the fetch fails.
                const del = !noDelete || bf.__staleWhileFetching === undefined;
                if (del) {
                    this.delete(k);
                }
                else if (!allowStaleAborted) {
                    // still replace the *promise* with the stale value,
                    // since we are done with the promise at this point.
                    // leave it untouched if we're still waiting for an
                    // aborted background fetch that hasn't yet returned.
                    this.#valList[index] = bf.__staleWhileFetching;
                }
            }
            if (allowStale) {
                if (options.status && bf.__staleWhileFetching !== undefined) {
                    options.status.returnedStale = true;
                }
                return bf.__staleWhileFetching;
            }
            else if (bf.__returned === bf) {
                throw er;
            }
        };
        const pcall = (res, rej) => {
            const fmp = this.#fetchMethod?.(k, v, fetchOpts);
            if (fmp && fmp instanceof Promise) {
                fmp.then(v => res(v === undefined ? undefined : v), rej);
            }
            // ignored, we go until we finish, regardless.
            // defer check until we are actually aborting,
            // so fetchMethod can override.
            ac.signal.addEventListener('abort', () => {
                if (!options.ignoreFetchAbort ||
                    options.allowStaleOnFetchAbort) {
                    res(undefined);
                    // when it eventually resolves, update the cache.
                    if (options.allowStaleOnFetchAbort) {
                        res = v => cb(v, true);
                    }
                }
            });
        };
        if (options.status)
            options.status.fetchDispatched = true;
        const p = new Promise(pcall).then(cb, eb);
        const bf = Object.assign(p, {
            __abortController: ac,
            __staleWhileFetching: v,
            __returned: undefined,
        });
        if (index === undefined) {
            // internal, don't expose status.
            this.set(k, bf, { ...fetchOpts.options, status: undefined });
            index = this.#keyMap.get(k);
        }
        else {
            this.#valList[index] = bf;
        }
        return bf;
    }
    #isBackgroundFetch(p) {
        if (!this.#hasFetchMethod)
            return false;
        const b = p;
        return (!!b &&
            b instanceof Promise &&
            b.hasOwnProperty('__staleWhileFetching') &&
            b.__abortController instanceof AC);
    }
    async fetch(k, fetchOptions = {}) {
        const { 
        // get options
        allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, 
        // set options
        ttl = this.ttl, noDisposeOnSet = this.noDisposeOnSet, size = 0, sizeCalculation = this.sizeCalculation, noUpdateTTL = this.noUpdateTTL, 
        // fetch exclusive options
        noDeleteOnFetchRejection = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection = this.allowStaleOnFetchRejection, ignoreFetchAbort = this.ignoreFetchAbort, allowStaleOnFetchAbort = this.allowStaleOnFetchAbort, context, forceRefresh = false, status, signal, } = fetchOptions;
        if (!this.#hasFetchMethod) {
            if (status)
                status.fetch = 'get';
            return this.get(k, {
                allowStale,
                updateAgeOnGet,
                noDeleteOnStaleGet,
                status,
            });
        }
        const options = {
            allowStale,
            updateAgeOnGet,
            noDeleteOnStaleGet,
            ttl,
            noDisposeOnSet,
            size,
            sizeCalculation,
            noUpdateTTL,
            noDeleteOnFetchRejection,
            allowStaleOnFetchRejection,
            allowStaleOnFetchAbort,
            ignoreFetchAbort,
            status,
            signal,
        };
        let index = this.#keyMap.get(k);
        if (index === undefined) {
            if (status)
                status.fetch = 'miss';
            const p = this.#backgroundFetch(k, index, options, context);
            return (p.__returned = p);
        }
        else {
            // in cache, maybe already fetching
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
                const stale = allowStale && v.__staleWhileFetching !== undefined;
                if (status) {
                    status.fetch = 'inflight';
                    if (stale)
                        status.returnedStale = true;
                }
                return stale ? v.__staleWhileFetching : (v.__returned = v);
            }
            // if we force a refresh, that means do NOT serve the cached value,
            // unless we are already in the process of refreshing the cache.
            const isStale = this.#isStale(index);
            if (!forceRefresh && !isStale) {
                if (status)
                    status.fetch = 'hit';
                this.#moveToTail(index);
                if (updateAgeOnGet) {
                    this.#updateItemAge(index);
                }
                if (status)
                    this.#statusTTL(status, index);
                return v;
            }
            // ok, it is stale or a forced refresh, and not already fetching.
            // refresh the cache.
            const p = this.#backgroundFetch(k, index, options, context);
            const hasStale = p.__staleWhileFetching !== undefined;
            const staleVal = hasStale && allowStale;
            if (status) {
                status.fetch = isStale ? 'stale' : 'refresh';
                if (staleVal && isStale)
                    status.returnedStale = true;
            }
            return staleVal ? p.__staleWhileFetching : (p.__returned = p);
        }
    }
    /**
     * Return a value from the cache. Will update the recency of the cache
     * entry found.
     *
     * If the key is not found, get() will return `undefined`.
     */
    get(k, getOptions = {}) {
        const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status, } = getOptions;
        const index = this.#keyMap.get(k);
        if (index !== undefined) {
            const value = this.#valList[index];
            const fetching = this.#isBackgroundFetch(value);
            if (status)
                this.#statusTTL(status, index);
            if (this.#isStale(index)) {
                if (status)
                    status.get = 'stale';
                // delete only if not an in-flight background fetch
                if (!fetching) {
                    if (!noDeleteOnStaleGet) {
                        this.delete(k);
                    }
                    if (status && allowStale)
                        status.returnedStale = true;
                    return allowStale ? value : undefined;
                }
                else {
                    if (status &&
                        allowStale &&
                        value.__staleWhileFetching !== undefined) {
                        status.returnedStale = true;
                    }
                    return allowStale ? value.__staleWhileFetching : undefined;
                }
            }
            else {
                if (status)
                    status.get = 'hit';
                // if we're currently fetching it, we don't actually have it yet
                // it's not stale, which means this isn't a staleWhileRefetching.
                // If it's not stale, and fetching, AND has a __staleWhileFetching
                // value, then that means the user fetched with {forceRefresh:true},
                // so it's safe to return that value.
                if (fetching) {
                    return value.__staleWhileFetching;
                }
                this.#moveToTail(index);
                if (updateAgeOnGet) {
                    this.#updateItemAge(index);
                }
                return value;
            }
        }
        else if (status) {
            status.get = 'miss';
        }
    }
    #connect(p, n) {
        this.#prev[n] = p;
        this.#next[p] = n;
    }
    #moveToTail(index) {
        // if tail already, nothing to do
        // if head, move head to next[index]
        // else
        //   move next[prev[index]] to next[index] (head has no prev)
        //   move prev[next[index]] to prev[index]
        // prev[index] = tail
        // next[tail] = index
        // tail = index
        if (index !== this.#tail) {
            if (index === this.#head) {
                this.#head = this.#next[index];
            }
            else {
                this.#connect(this.#prev[index], this.#next[index]);
            }
            this.#connect(this.#tail, index);
            this.#tail = index;
        }
    }
    /**
     * Deletes a key out of the cache.
     * Returns true if the key was deleted, false otherwise.
     */
    delete(k) {
        let deleted = false;
        if (this.#size !== 0) {
            const index = this.#keyMap.get(k);
            if (index !== undefined) {
                deleted = true;
                if (this.#size === 1) {
                    this.clear();
                }
                else {
                    this.#removeItemSize(index);
                    const v = this.#valList[index];
                    if (this.#isBackgroundFetch(v)) {
                        v.__abortController.abort(new Error('deleted'));
                    }
                    else if (this.#hasDispose || this.#hasDisposeAfter) {
                        if (this.#hasDispose) {
                            this.#dispose?.(v, k, 'delete');
                        }
                        if (this.#hasDisposeAfter) {
                            this.#disposed?.push([v, k, 'delete']);
                        }
                    }
                    this.#keyMap.delete(k);
                    this.#keyList[index] = undefined;
                    this.#valList[index] = undefined;
                    if (index === this.#tail) {
                        this.#tail = this.#prev[index];
                    }
                    else if (index === this.#head) {
                        this.#head = this.#next[index];
                    }
                    else {
                        const pi = this.#prev[index];
                        this.#next[pi] = this.#next[index];
                        const ni = this.#next[index];
                        this.#prev[ni] = this.#prev[index];
                    }
                    this.#size--;
                    this.#free.push(index);
                }
            }
        }
        if (this.#hasDisposeAfter && this.#disposed?.length) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
        return deleted;
    }
    /**
     * Clear the cache entirely, throwing away all values.
     */
    clear() {
        for (const index of this.#rindexes({ allowStale: true })) {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
                v.__abortController.abort(new Error('deleted'));
            }
            else {
                const k = this.#keyList[index];
                if (this.#hasDispose) {
                    this.#dispose?.(v, k, 'delete');
                }
                if (this.#hasDisposeAfter) {
                    this.#disposed?.push([v, k, 'delete']);
                }
            }
        }
        this.#keyMap.clear();
        this.#valList.fill(undefined);
        this.#keyList.fill(undefined);
        if (this.#ttls && this.#starts) {
            this.#ttls.fill(0);
            this.#starts.fill(0);
        }
        if (this.#sizes) {
            this.#sizes.fill(0);
        }
        this.#head = 0;
        this.#tail = 0;
        this.#free.length = 0;
        this.#calculatedSize = 0;
        this.#size = 0;
        if (this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=index.js.map

/***/ }),
/* 96 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Stream = __webpack_require__(97);
const CommandParameter = __webpack_require__(87);
const Errors = __webpack_require__(13);

/**
 * New Connection instance.
 *
 * @param options    connection options
 * @returns Connection instance
 * @constructor
 * @fires Connection#connect
 * @fires Connection#end
 * @fires Connection#error
 *
 */
class ConnectionPromise {
  #conn;

  constructor(conn) {
    this.#conn = conn;
  }

  get threadId() {
    return this.#conn.threadId;
  }

  get info() {
    return this.#conn.info;
  }

  get prepareCache() {
    return this.#conn.prepareCache;
  }

  /**
   * Permit to change user during connection.
   * All user variables will be reset, Prepare commands will be released.
   * !!! mysql has a bug when CONNECT_ATTRS capability is set, that is default !!!!
   *
   * @param options   connection options
   * @returns {Promise} promise
   */
  changeUser(options) {
    const cmdParam = new CommandParameter(null, null, options);
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.changeUser.bind(this.#conn, cmdParam));
  }

  /**
   * Start transaction
   *
   * @returns {Promise} promise
   */
  beginTransaction() {
    return this.query('START TRANSACTION');
  }

  /**
   * Commit a transaction.
   *
   * @returns {Promise} command if commit was needed only
   */
  commit() {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, 'COMMIT');
    return new Promise(this.#conn.changeTransaction.bind(this.#conn, cmdParam));
  }

  /**
   * Roll back a transaction.
   *
   * @returns {Promise} promise
   */
  rollback() {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, 'ROLLBACK');
    return new Promise(this.#conn.changeTransaction.bind(this.#conn, cmdParam));
  }

  /**
   * Execute query using text protocol.
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @returns {Promise} promise
   */
  query(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, sql, values);
    return new Promise(this.#conn.query.bind(this.#conn, cmdParam));
  }

  static _PARAM(options, sql, values) {
    let _cmdOpt,
      _sql = sql,
      _values = values;
    if (typeof sql === 'object') {
      _cmdOpt = sql;
      _sql = _cmdOpt.sql;
      if (_cmdOpt.values) _values = _cmdOpt.values;
    }
    const cmdParam = new CommandParameter(_sql, _values, _cmdOpt);
    if (options.trace) Error.captureStackTrace(cmdParam);
    return cmdParam;
  }

  execute(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, sql, values);
    return ConnectionPromise._EXECUTE_CMD(this.#conn, cmdParam);
  }

  static _EXECUTE_CMD(conn, cmdParam) {
    return new Promise(conn.prepare.bind(conn, cmdParam))
      .then((prepare) => {
        return new Promise(function (resolve, reject) {
          conn.executePromise.call(conn, cmdParam, prepare, resolve, reject);
        }).finally(() => prepare.close());
      })
      .catch((err) => {
        if (conn.opts.logger.error) conn.opts.logger.error(err);
        throw err;
      });
  }

  prepare(sql) {
    let _cmdOpt, _sql;
    if (typeof sql === 'object') {
      _cmdOpt = sql;
      _sql = _cmdOpt.sql;
    } else {
      _sql = sql;
    }
    const cmdParam = new CommandParameter(_sql, null, _cmdOpt);
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.prepare.bind(this.#conn, cmdParam));
  }

  /**
   * Execute batch using text protocol.
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values
   * @returns {Promise} promise
   */
  batch(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, sql, values);
    return this.#conn.batch(cmdParam);
  }

  static _BATCH_CMD(conn, cmdParam) {
    return conn.batch(cmdParam);
  }

  /**
   * Import sql file.
   *
   * @param opts JSON array with 2 possible fields: file and database
   */
  importFile(opts) {
    if (!opts || !opts.file) {
      return Promise.reject(
        Errors.createError(
          'SQL file parameter is mandatory',
          Errors.ER_MISSING_SQL_PARAMETER,
          this.#conn.info,
          'HY000',
          null,
          false,
          null
        )
      );
    }
    return new Promise(this.#conn.importFile.bind(this.#conn, { file: opts.file, database: opts.database }));
  }

  /**
   * Execute query returning a Readable Object that will emit columns/data/end/error events
   * to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @returns {Readable}
   */
  queryStream(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#conn.opts, sql, values);
    const cmd = new Stream(cmdParam, this.#conn.opts, this.#conn.socket);
    if (this.#conn.opts.logger.error) cmd.on('error', this.#conn.opts.logger.error);
    this.#conn.addCommand(cmd);
    return cmd.inStream;
  }

  /**
   * Send an empty MySQL packet to ensure connection is active, and reset @@wait_timeout
   * @param timeout (optional) timeout value in ms. If reached, throw error and close connection
   * @returns {Promise} promise
   */
  ping(timeout) {
    const cmdParam = new CommandParameter(null, null, { timeout: timeout });
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.ping.bind(this.#conn, cmdParam));
  }

  /**
   * Send a reset command that will
   * - rollback any open transaction
   * - reset transaction isolation level
   * - reset session variables
   * - delete user variables
   * - remove temporary tables
   * - remove all PREPARE statement
   *
   * @returns {Promise} promise
   */
  reset() {
    const cmdParam = new CommandParameter();
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.reset.bind(this.#conn, cmdParam));
  }

  /**
   * Indicates the state of the connection as the driver knows it
   * @returns {boolean}
   */
  isValid() {
    return this.#conn.isValid();
  }

  /**
   * Terminate connection gracefully.
   *
   * @returns {Promise} promise
   */
  end() {
    const cmdParam = new CommandParameter();
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.end.bind(this.#conn, cmdParam));
  }

  /**
   * Alias for destroy.
   */
  close() {
    this.destroy();
  }

  /**
   * Force connection termination by closing the underlying socket and killing server process if any.
   */
  destroy() {
    this.#conn.destroy();
  }

  pause() {
    this.#conn.pause();
  }

  resume() {
    this.#conn.resume();
  }

  format(sql, values) {
    this.#conn.format(sql, values);
  }

  /**
   * return current connected server version information.
   *
   * @returns {*}
   */
  serverVersion() {
    return this.#conn.serverVersion();
  }

  /**
   * Change option "debug" during connection.
   * @param val   debug value
   */
  debug(val) {
    return this.#conn.debug(val);
  }

  debugCompress(val) {
    return this.#conn.debugCompress(val);
  }

  escape(val) {
    return this.#conn.escape(val);
  }

  escapeId(val) {
    return this.#conn.escapeId(val);
  }

  //*****************************************************************
  // EventEmitter proxy methods
  //*****************************************************************

  on(eventName, listener) {
    this.#conn.on.call(this.#conn, eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.#conn.off.call(this.#conn, eventName, listener);
    return this;
  }

  once(eventName, listener) {
    this.#conn.once.call(this.#conn, eventName, listener);
    return this;
  }

  listeners(eventName) {
    return this.#conn.listeners.call(this.#conn, eventName);
  }

  addListener(eventName, listener) {
    this.#conn.addListener.call(this.#conn, eventName, listener);
    return this;
  }

  eventNames() {
    return this.#conn.eventNames.call(this.#conn);
  }

  getMaxListeners() {
    return this.#conn.getMaxListeners.call(this.#conn);
  }

  listenerCount(eventName, listener) {
    return this.#conn.listenerCount.call(this.#conn, eventName, listener);
  }

  prependListener(eventName, listener) {
    this.#conn.prependListener.call(this.#conn, eventName, listener);
    return this;
  }

  prependOnceListener(eventName, listener) {
    this.#conn.prependOnceListener.call(this.#conn, eventName, listener);
    return this;
  }

  removeAllListeners(eventName, listener) {
    this.#conn.removeAllListeners.call(this.#conn, eventName, listener);
    return this;
  }

  removeListener(eventName, listener) {
    this.#conn.removeListener.call(this.#conn, eventName, listener);
    return this;
  }

  setMaxListeners(n) {
    this.#conn.setMaxListeners.call(this.#conn, n);
    return this;
  }

  rawListeners(eventName) {
    return this.#conn.rawListeners.call(this.#conn, eventName);
  }

  //*****************************************************************
  // internal public testing methods
  //*****************************************************************

  get __tests() {
    return this.#conn.__tests;
  }
}

module.exports = ConnectionPromise;


/***/ }),
/* 97 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Query = __webpack_require__(73);
const { Readable } = __webpack_require__(40);

/**
 * Protocol COM_QUERY with streaming events.
 * see : https://mariadb.com/kb/en/library/com_query/
 */
class Stream extends Query {
  constructor(cmdParam, connOpts, socket) {
    super(
      () => {},
      () => {},
      connOpts,
      cmdParam
    );
    this.socket = socket;
    this.inStream = new Readable({
      objectMode: true,
      read: () => {
        this.socket.resume();
      }
    });

    this.on('fields', function (meta) {
      this.inStream.emit('fields', meta);
    });

    this.on('error', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('close', function (err) {
      this.inStream.emit('error', err);
    });

    this.on('end', function (err) {
      if (err) this.inStream.emit('error', err);
      this.socket.resume();
      this.inStream.push(null);
    });

    this.inStream.close = function () {
      this.handleNewRows = () => {};
      this.socket.resume();
    }.bind(this);
  }

  handleNewRows(row) {
    if (!this.inStream.push(row)) {
      this.socket.pause();
    }
  }
}

module.exports = Stream;


/***/ }),
/* 98 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const { EventEmitter } = __webpack_require__(7);

const Pool = __webpack_require__(99);
const ConnectionPromise = __webpack_require__(96);
const CommandParameter = __webpack_require__(87);
const Errors = __webpack_require__(13);

class PoolPromise extends EventEmitter {
  #pool;
  constructor(options) {
    super();
    this.#pool = new Pool(options);
    this.#pool.on('acquire', this.emit.bind(this, 'acquire'));
    this.#pool.on('connection', this.emit.bind(this, 'connection'));
    this.#pool.on('enqueue', this.emit.bind(this, 'enqueue'));
    this.#pool.on('release', this.emit.bind(this, 'release'));
    this.#pool.on('error', this.emit.bind(this, 'error'));
  }

  get closed() {
    return this.#pool.closed;
  }

  /**
   * Get current total connection number.
   * @return {number}
   */
  totalConnections() {
    return this.#pool.totalConnections();
  }

  /**
   * Get current active connections.
   * @return {number}
   */
  activeConnections() {
    return this.#pool.activeConnections();
  }

  /**
   * Get current idle connection number.
   * @return {number}
   */
  idleConnections() {
    return this.#pool.idleConnections();
  }

  /**
   * Get current stacked connection request.
   * @return {number}
   */
  taskQueueSize() {
    return this.#pool.taskQueueSize();
  }

  escape(value) {
    return this.#pool.escape(value);
  }

  escapeId(value) {
    return this.#pool.escapeId(value);
  }

  /**
   * Ends pool
   *
   * @return Promise
   **/
  end() {
    return this.#pool.end();
  }

  /**
   * Retrieve a connection from pool.
   * Create a new one, if limit is not reached.
   * wait until acquireTimeout.
   *
   */
  async getConnection() {
    const cmdParam = new CommandParameter();
    if (this.#pool.opts.connOptions.trace) Error.captureStackTrace(cmdParam);
    const baseConn = await this.#pool.getConnection(cmdParam);
    const conn = new ConnectionPromise(baseConn);
    conn.release = () => new Promise(baseConn.release);
    conn.end = conn.release;
    conn.close = conn.release;
    return conn;
  }

  /**
   * Execute query using text protocol with callback emit columns/data/end/error
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   */
  query(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#pool.opts.connOptions, sql, values);
    return this.#pool.getConnection(cmdParam).then((baseConn) => {
      return new Promise(baseConn.query.bind(baseConn, cmdParam)).finally(() => {
        this.#pool.release(baseConn);
      });
    });
  }

  /**
   * Execute query using binary protocol with callback emit columns/data/end/error
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   */
  execute(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#pool.opts.connOptions, sql, values);
    return this.#pool.getConnection(cmdParam).then((baseConn) => {
      return ConnectionPromise._EXECUTE_CMD(baseConn, cmdParam).finally(() => {
        this.#pool.release(baseConn);
      });
    });
  }

  /**
   * execute a batch
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  array of placeholder values
   */
  batch(sql, values) {
    const cmdParam = ConnectionPromise._PARAM(this.#pool.opts.connOptions, sql, values);
    return this.#pool.getConnection(cmdParam).then((baseConn) => {
      return ConnectionPromise._BATCH_CMD(baseConn, cmdParam).finally(() => {
        this.#pool.release(baseConn);
      });
    });
  }

  /**
   * Import sql file.
   *
   * @param opts JSON array with 2 possible fields: file and database
   */
  importFile(opts) {
    if (!opts) {
      return Promise.reject(
        Errors.createError(
          'SQL file parameter is mandatory',
          Errors.ER_MISSING_SQL_PARAMETER,
          null,
          'HY000',
          null,
          false,
          null
        )
      );
    }

    return this.#pool.getConnection({}).then((baseConn) => {
      return new Promise(baseConn.importFile.bind(baseConn, { file: opts.file, database: opts.database })).finally(
        () => {
          this.#pool.release(baseConn);
        }
      );
    });
  }
}

module.exports = PoolPromise;


/***/ }),
/* 99 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const { EventEmitter } = __webpack_require__(7);

const Queue = __webpack_require__(8);
const Errors = __webpack_require__(13);
const Utils = __webpack_require__(42);
const Connection = __webpack_require__(6);
const CommandParameter = __webpack_require__(87);

class Pool extends EventEmitter {
  opts;
  #closed = false;
  #connectionInCreation = false;
  #errorCreatingConnection = null;
  #idleConnections = new Queue();
  #activeConnections = {};
  #requests = new Queue();
  #unusedConnectionRemoverId;
  #requestTimeoutId;
  #connErrorNumber = 0;
  #initialized = false;
  _sizeHandlerTimeout;

  constructor(options) {
    super();
    this.opts = options;

    this.on('_idle', this._requestsHandler);
    this.on('validateSize', this._sizeHandler);
    this._sizeHandler();
  }

  //*****************************************************************
  // pool automatic handlers
  //*****************************************************************

  _doCreateConnection(resolve, reject, timeoutEnd) {
    this._createConnection()
      .then((conn) => {
        if (this.#closed) {
          conn.forceEnd(
            null,
            () => {},
            () => {}
          );
          reject(
            new Errors.createFatalError(
              'Cannot create new connection to pool, pool closed',
              Errors.ER_ADD_CONNECTION_CLOSED_POOL
            )
          );
          return;
        }

        conn.lastUse = Date.now();
        const nativeDestroy = conn.destroy.bind(conn);
        const pool = this;

        conn.destroy = function () {
          pool._endLeak(conn);
          delete pool.#activeConnections[conn.threadId];
          nativeDestroy();
          pool.emit('validateSize');
        };

        conn.once('error', function () {
          let idx = 0;
          let currConn;
          pool._endLeak(conn);
          delete pool.#activeConnections[conn.threadId];
          while ((currConn = pool.#idleConnections.peekAt(idx))) {
            if (currConn === conn) {
              pool.#idleConnections.removeOne(idx);
              continue;
            }
            //since connection did have an error, other waiting connection might too
            //forcing validation when borrowed next time, even if "minDelayValidation" is not reached.
            currConn.lastUse = Math.min(currConn.lastUse, Date.now() - pool.opts.minDelayValidation);
            idx++;
          }
          setTimeout(() => {
            if (!pool.#requests.isEmpty()) {
              pool._sizeHandler();
            }
          }, 0);
        });

        this.#idleConnections.push(conn);
        this.#connectionInCreation = false;
        this.emit('_idle');
        this.emit('connection', conn);
        resolve(conn);
      })
      .catch((err) => {
        //if timeout is reached or authentication fail return error
        if (
          this.#closed ||
          (err.errno && (err.errno === 1524 || err.errno === 1045 || err.errno === 1698)) ||
          timeoutEnd < Date.now()
        ) {
          err.message = err.message + this._errorMsgAddon();
          reject(err);
          return;
        }
        setTimeout(this._doCreateConnection.bind(this, resolve, reject, timeoutEnd), 500);
      });
  }

  _destroy(conn) {
    this._endLeak(conn);
    delete this.#activeConnections[conn.threadId];
    conn.lastUse = Date.now();
    conn.forceEnd(
      null,
      () => {},
      () => {}
    );

    if (this.totalConnections() === 0) {
      this._stopReaping();
    }

    this.emit('validateSize');
  }

  release(conn) {
    // ensure releasing only once
    if (this.#activeConnections[conn.threadId]) {
      this._endLeak(conn);
      this.#activeConnections[conn.threadId] = null;
      conn.lastUse = Date.now();

      if (this.#closed) {
        conn.forceEnd(
          null,
          () => {},
          () => {}
        );
      } else if (conn.isValid()) {
        this.emit('release', conn);
        this.#idleConnections.push(conn);
        process.nextTick(this.emit.bind(this, '_idle'));
      } else {
        this.emit('validateSize');
      }
    }
  }

  _checkLeak(conn) {
    conn.lastUse = Date.now();
    conn.leaked = false;
    conn.leakProcess = setTimeout(
      (conn) => {
        conn.leaked = true;
        conn.opts.logger.warning(
          `A possible connection leak on the thread ${
            conn.info.threadId
          } (the connection not returned to the pool since ${
            Date.now() - conn.lastUse
          } ms). Has the connection.release() been called ?` + this._errorMsgAddon()
        );
      },
      this.opts.leakDetectionTimeout,
      conn
    );
  }

  _endLeak(conn) {
    if (conn.leakProcess) {
      clearTimeout(conn.leakProcess);
      conn.leakProcess = null;
      if (conn.leaked) {
        conn.opts.logger.warning(
          `Previous possible leak connection with thread ${conn.info.threadId} was returned to pool`
        );
      }
    }
  }

  /**
   * Permit to remove idle connection if unused for some time.
   */
  _startReaping() {
    if (!this.#unusedConnectionRemoverId && this.opts.idleTimeout > 0) {
      this.#unusedConnectionRemoverId = setInterval(this._reaper.bind(this), 500);
    }
  }

  _stopReaping() {
    if (this.#unusedConnectionRemoverId && this.totalConnections() === 0) {
      clearInterval(this.#unusedConnectionRemoverId);
    }
  }

  _reaper() {
    const idleTimeRemoval = Date.now() - this.opts.idleTimeout * 1000;
    let maxRemoval = Math.max(0, this.#idleConnections.length - this.opts.minimumIdle);
    while (maxRemoval > 0) {
      const conn = this.#idleConnections.peek();
      maxRemoval--;
      if (conn && conn.lastUse < idleTimeRemoval) {
        this.#idleConnections.shift();
        conn.forceEnd(
          null,
          () => {},
          () => {}
        );
        continue;
      }
      break;
    }

    if (this.totalConnections() === 0) {
      this._stopReaping();
    }
    this.emit('validateSize');
  }

  _shouldCreateMoreConnections() {
    return (
      !this.#connectionInCreation &&
      this.#idleConnections.length < this.opts.minimumIdle &&
      this.totalConnections() < this.opts.connectionLimit &&
      !this.#closed
    );
  }

  /**
   * Grow pool connections until reaching connection limit.
   */
  _sizeHandler() {
    if (this._shouldCreateMoreConnections() && !this._sizeHandlerTimeout) {
      this.#connectionInCreation = true;
      setImmediate(
        function () {
          const timeoutEnd = Date.now() + this.opts.initializationTimeout;
          new Promise((resolve, reject) => {
            this._doCreateConnection(resolve, reject, timeoutEnd);
          })
            .then(() => {
              this.#initialized = true;
              this.#errorCreatingConnection = null;
              this.#connErrorNumber = 0;
              if (this._shouldCreateMoreConnections()) {
                this.emit('validateSize');
              }
              this._startReaping();
            })
            .catch((err) => {
              this.#connectionInCreation = false;
              if (!this.#closed) {
                if (!this.#initialized) {
                  err.message = 'Error during pool initialization: ' + err.message;
                } else {
                  err.message = 'Pool fails to create connection: ' + err.message;
                }
                this.#errorCreatingConnection = err;
                this.emit('error', err);

                //delay next try
                this._sizeHandlerTimeout = setTimeout(
                  function () {
                    this._sizeHandlerTimeout = null;
                    if (!this.#requests.isEmpty()) {
                      this._sizeHandler();
                    }
                  }.bind(this),
                  Math.min(++this.#connErrorNumber * 500, 10000)
                );
              }
            });
        }.bind(this)
      );
    }
  }

  /**
   * Launch next waiting task request if available connections.
   */
  _requestsHandler() {
    clearTimeout(this.#requestTimeoutId);
    this.#requestTimeoutId = null;
    const request = this.#requests.shift();
    if (request) {
      const conn = this.#idleConnections.shift();
      if (conn) {
        if (this.opts.leakDetectionTimeout > 0) this._checkLeak(conn);
        this.emit('acquire', conn);
        this.#activeConnections[conn.threadId] = conn;
        request.resolver(conn);
      } else {
        this.#requests.unshift(request);
      }
      this._requestTimeoutHandler();
    }
  }

  _hasIdleConnection() {
    return !this.#idleConnections.isEmpty();
  }

  /**
   * Return an idle Connection.
   * If connection has not been used for some time ( minDelayValidation), validate connection status.
   *
   * @returns {Promise<Connection>} connection of null of no valid idle connection.
   */
  async _doAcquire() {
    if (!this._hasIdleConnection() || this.#closed) return Promise.reject();
    let conn;
    let mustRecheckSize = false;
    while ((conn = this.#idleConnections.shift()) != null) {
      //just check connection state first
      if (conn.isValid()) {
        this.#activeConnections[conn.threadId] = conn;
        //if not used for some time, validate connection with a COM_PING
        if (this.opts.minDelayValidation <= 0 || Date.now() - conn.lastUse > this.opts.minDelayValidation) {
          try {
            const cmdParam = new CommandParameter(null, null, { timeout: this.opts.pingTimeout });
            await new Promise(conn.ping.bind(conn, cmdParam));
          } catch (e) {
            delete this.#activeConnections[conn.threadId];
            continue;
          }
        }
        if (this.opts.leakDetectionTimeout > 0) this._checkLeak(conn);
        if (mustRecheckSize) setImmediate(this.emit.bind(this, 'validateSize'));
        return Promise.resolve(conn);
      }
      mustRecheckSize = true;
    }
    setImmediate(this.emit.bind(this, 'validateSize'));
    return Promise.reject();
  }

  _requestTimeoutHandler() {
    //handle next Timer
    this.#requestTimeoutId = null;
    const currTime = Date.now();
    let request;
    while ((request = this.#requests.peekFront())) {
      if (request.timeout <= currTime) {
        this.#requests.shift();

        let err = Errors.createError(
          `retrieve connection from pool timeout after ${Math.abs(
            Date.now() - (request.timeout - this.opts.acquireTimeout)
          )}ms${this._errorMsgAddon()}`,
          Errors.ER_GET_CONNECTION_TIMEOUT,
          null,
          'HY000',
          null,
          false,
          request.stack
        );

        // in order to provide more information when configuration is wrong / server is down
        if (this.activeConnections() === 0 && this.#errorCreatingConnection) {
          const errConnMsg = this.#errorCreatingConnection.message.split('\n')[0];
          err.message = err.message + `\n    connection error: ${errConnMsg}`;
        }
        request.reject(err);
      } else {
        this.#requestTimeoutId = setTimeout(this._requestTimeoutHandler.bind(this), request.timeout - currTime);
        return;
      }
    }
  }

  /**
   * Search info object of an existing connection. to know server type and version.
   * @returns information object if connection available.
   */
  _searchInfo() {
    let info = null;
    let conn = this.#idleConnections.get(0);

    if (!conn) {
      for (const threadId in Object.keys(this.#activeConnections)) {
        conn = this.#activeConnections[threadId];
        if (!conn) {
          break;
        }
      }
    }

    if (conn) {
      info = conn.info;
    }
    return info;
  }

  _rejectTask(task, err) {
    clearTimeout(this.#requestTimeoutId);
    this.#requestTimeoutId = null;
    task.reject(err);
    this._requestTimeoutHandler();
  }

  async _createConnection() {
    const conn = new Connection(this.opts.connOptions);
    await conn.connect();
    const pool = this;
    conn.forceEnd = conn.end;
    conn.release = function (resolve) {
      if (pool.#closed || !conn.isValid()) {
        pool._destroy(conn);
        resolve();
        return;
      }
      if (pool.opts.noControlAfterUse) {
        pool.release(conn);
        resolve();
        return;
      }
      //if server permit it, reset the connection, or rollback only if not
      // COM_RESET_CONNECTION exist since mysql 5.7.3 and mariadb 10.2.4
      // but not possible to use it with mysql waiting for https://bugs.mysql.com/bug.php?id=97633 correction.
      // and mariadb only since https://jira.mariadb.org/browse/MDEV-18281
      let revertFunction;
      if (
        pool.opts.resetAfterUse &&
        conn.info.isMariaDB() &&
        ((conn.info.serverVersion.minor === 2 && conn.info.hasMinVersion(10, 2, 22)) ||
          conn.info.hasMinVersion(10, 3, 13))
      ) {
        revertFunction = conn.reset.bind(conn, new CommandParameter());
      } else revertFunction = conn.changeTransaction.bind(conn, new CommandParameter('ROLLBACK'));

      new Promise(revertFunction).then(pool.release.bind(pool, conn), pool._destroy.bind(pool, conn)).finally(resolve);
    };
    conn.end = conn.release;
    return conn;
  }

  _leakedConnections() {
    let counter = 0;
    for (const connection of Object.values(this.#activeConnections)) {
      if (connection && connection.leaked) counter++;
    }
    return counter;
  }

  _errorMsgAddon() {
    if (this.opts.leakDetectionTimeout > 0) {
      return `\n    (pool connections: active=${this.activeConnections()} idle=${this.idleConnections()} leak=${this._leakedConnections()} limit=${
        this.opts.connectionLimit
      })`;
    }
    return `\n    (pool connections: active=${this.activeConnections()} idle=${this.idleConnections()} limit=${
      this.opts.connectionLimit
    })`;
  }

  //*****************************************************************
  // public methods
  //*****************************************************************

  get closed() {
    return this.#closed;
  }

  /**
   * Get current total connection number.
   * @return {number}
   */
  totalConnections() {
    return this.activeConnections() + this.idleConnections();
  }

  /**
   * Get current active connections.
   * @return {number}
   */
  activeConnections() {
    let counter = 0;
    for (const connection of Object.values(this.#activeConnections)) {
      if (connection) counter++;
    }
    return counter;
  }

  /**
   * Get current idle connection number.
   * @return {number}
   */
  idleConnections() {
    return this.#idleConnections.length;
  }

  /**
   * Get current stacked connection request.
   * @return {number}
   */
  taskQueueSize() {
    return this.#requests.length;
  }

  escape(value) {
    return Utils.escape(this.opts.connOptions, this._searchInfo(), value);
  }

  escapeId(value) {
    return Utils.escapeId(this.opts.connOptions, this._searchInfo(), value);
  }

  //*****************************************************************
  // promise methods
  //*****************************************************************

  /**
   * Retrieve a connection from pool.
   * Create a new one, if limit is not reached.
   * wait until acquireTimeout.
   * @param cmdParam for stackTrace error
   * @return {Promise}
   */
  getConnection(cmdParam) {
    if (this.#closed) {
      return Promise.reject(
        Errors.createError(
          'pool is closed',
          Errors.ER_POOL_ALREADY_CLOSED,
          null,
          'HY000',
          cmdParam === null ? null : cmdParam.sql,
          false,
          cmdParam.stack
        )
      );
    }
    return this._doAcquire().then(
      (conn) => {
        // connection is available. process task
        this.emit('acquire', conn);
        return conn;
      },
      () => {
        if (this.#closed) {
          throw Errors.createError(
            'Cannot add request to pool, pool is closed',
            Errors.ER_POOL_ALREADY_CLOSED,
            null,
            'HY000',
            cmdParam === null ? null : cmdParam.sql,
            false,
            cmdParam.stack
          );
        }
        // no idle connection available
        // create a new connection if limit is not reached
        setImmediate(this.emit.bind(this, 'validateSize'));
        return new Promise(
          function (resolver, rejecter) {
            // stack request
            setImmediate(this.emit.bind(this, 'enqueue'));
            const request = new Request(Date.now() + this.opts.acquireTimeout, cmdParam.stack, resolver, rejecter);
            this.#requests.push(request);
            if (!this.#requestTimeoutId) {
              this.#requestTimeoutId = setTimeout(this._requestTimeoutHandler.bind(this), this.opts.acquireTimeout);
            }
          }.bind(this)
        );
      }
    );
  }

  /**
   * Close all connection in pool
   * Ends in multiple step :
   * - close idle connections
   * - ensure that no new request is possible
   *   (active connection release are automatically closed on release)
   * - if remaining, after 10 seconds, close remaining active connections
   *
   * @return Promise
   */
  end() {
    if (this.#closed) {
      return Promise.reject(Errors.createError('pool is already closed', Errors.ER_POOL_ALREADY_CLOSED));
    }
    this.#closed = true;
    clearInterval(this.#unusedConnectionRemoverId);
    clearInterval(this._sizeHandlerTimeout);
    const cmdParam = new CommandParameter();
    if (this.opts.trace) Error.captureStackTrace(cmdParam);
    //close unused connections
    const idleConnectionsEndings = [];
    let conn;
    while ((conn = this.#idleConnections.shift())) {
      idleConnectionsEndings.push(new Promise(conn.forceEnd.bind(conn, cmdParam)));
    }

    clearTimeout(this.#requestTimeoutId);
    this.#requestTimeoutId = null;

    //reject all waiting task
    if (!this.#requests.isEmpty()) {
      const err = Errors.createError(
        'pool is ending, connection request aborted',
        Errors.ER_CLOSING_POOL,
        null,
        'HY000',
        null,
        false,
        cmdParam.stack
      );
      let task;
      while ((task = this.#requests.shift())) {
        task.reject(err);
      }
    }
    const pool = this;
    return Promise.all(idleConnectionsEndings).then(async () => {
      if (pool.activeConnections() > 0) {
        // wait up to 10 seconds, that active connection are released
        let remaining = 100;
        while (remaining-- > 0) {
          if (pool.activeConnections() > 0) {
            await new Promise((res) => setTimeout(() => res(), 100));
          }
        }

        // force close any remaining active connections
        for (const connection of Object.values(pool.#activeConnections)) {
          if (connection) connection.destroy();
        }
      }
      return Promise.resolve();
    });
  }
}

class Request {
  constructor(timeout, stack, resolver, rejecter) {
    this.timeout = timeout;
    this.stack = stack;
    this.resolver = resolver;
    this.rejecter = rejecter;
  }

  reject(err) {
    process.nextTick(this.rejecter, err);
  }
}

module.exports = Pool;


/***/ }),
/* 100 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const ClusterOptions = __webpack_require__(101);
const PoolOptions = __webpack_require__(102);
const PoolCallback = __webpack_require__(103);
const PoolPromise = __webpack_require__(98);
const FilteredCluster = __webpack_require__(105);
const EventEmitter = __webpack_require__(7);

/**
 * Create a new Cluster.
 * Cluster handle pools with patterns and handle failover / distributed load
 * according to selectors (round-robin / random / ordered )
 *
 * @param args      cluster arguments. see pool-cluster-options.
 * @constructor
 */
class Cluster extends EventEmitter {
  #opts;
  #nodes = {};
  #cachedPatterns = {};
  #nodeCounter = 0;

  constructor(args) {
    super();
    this.#opts = new ClusterOptions(args);
  }

  /**
   * Add a new pool node to cluster.
   *
   * @param id      identifier
   * @param config  pool configuration
   */
  add(id, config) {
    let identifier;
    if (typeof id === 'string' || id instanceof String) {
      identifier = id;
      if (this.#nodes[identifier]) throw new Error(`Node identifier '${identifier}' already exist !`);
    } else {
      identifier = 'PoolNode-' + this.#nodeCounter++;
      config = id;
    }
    const options = new PoolOptions(config);
    this.#nodes[identifier] = this._createPool(options);
  }

  /**
   * End cluster (and underlying pools).
   *
   * @return {Promise<any[]>}
   */
  end() {
    const cluster = this;
    this.#cachedPatterns = {};
    const poolEndPromise = [];
    Object.keys(this.#nodes).forEach((pool) => {
      const res = cluster.#nodes[pool].end();
      if (res) poolEndPromise.push(res);
    });
    this.#nodes = null;
    return Promise.all(poolEndPromise);
  }

  of(pattern, selector) {
    return new FilteredCluster(this, pattern, selector);
  }

  /**
   * Remove nodes according to pattern.
   *
   * @param pattern  pattern
   */
  remove(pattern) {
    if (!pattern) throw new Error('pattern parameter in Cluster.remove(pattern)  is mandatory');

    const regex = RegExp(pattern);
    Object.keys(this.#nodes).forEach(
      function (key) {
        if (regex.test(key)) {
          this.#nodes[key].end();
          delete this.#nodes[key];
          this.#cachedPatterns = {};
        }
      }.bind(this)
    );
  }

  /**
   * Get connection from available pools matching pattern, according to selector
   *
   * @param pattern       pattern filter (not mandatory)
   * @param selector      node selector ('RR','RANDOM' or 'ORDER')
   * @return {Promise}
   */
  getConnection(pattern, selector) {
    return this._getConnection(pattern, selector, undefined, undefined, undefined);
  }

  /**
   * Force using callback methods.
   */
  _setCallback() {
    this.getConnection = this._getConnectionCallback;
    this._createPool = this._createPoolCallback;
  }

  /**
   * Get connection from available pools matching pattern, according to selector
   * with additional parameter to avoid reusing failing node
   *
   * @param pattern       pattern filter (not mandatory)
   * @param selector      node selector ('RR','RANDOM' or 'ORDER')
   * @param avoidNodeKey  failing node
   * @param lastError     last error
   * @param remainingRetry remaining possible retry
   * @return {Promise}
   * @private
   */
  _getConnection(pattern, selector, remainingRetry, avoidNodeKey, lastError) {
    const matchingNodeList = this._matchingNodes(pattern || /^/);

    if (matchingNodeList.length === 0) {
      if (Object.keys(this.#nodes).length === 0 && !lastError) {
        return Promise.reject(
          new Error('No node have been added to cluster or nodes have been removed due to too much connection error')
        );
      }
      if (avoidNodeKey === undefined) return Promise.reject(new Error(`No node found for pattern '${pattern}'`));
      const errMsg = `No Connection available for '${pattern}'${
        lastError ? '. Last connection error was: ' + lastError.message : ''
      }`;
      return Promise.reject(new Error(errMsg));
    }

    if (remainingRetry === undefined) remainingRetry = matchingNodeList.length;
    const retry = --remainingRetry >= 0 ? this._getConnection.bind(this, pattern, selector, remainingRetry) : null;

    try {
      const nodeKey = this._selectPool(matchingNodeList, selector, avoidNodeKey);
      return this._handleConnectionError(matchingNodeList, nodeKey, retry);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  _createPool(options) {
    const pool = new PoolPromise(options);
    pool.on('error', (err) => {});
    return pool;
  }

  _createPoolCallback(options) {
    const pool = new PoolCallback(options);
    pool.on('error', (err) => {});
    return pool;
  }

  /**
   * Get connection from available pools matching pattern, according to selector
   * with additional parameter to avoid reusing failing node
   *
   * @param pattern       pattern filter (not mandatory)
   * @param selector      node selector ('RR','RANDOM' or 'ORDER')
   * @param callback      callback function
   * @param avoidNodeKey  failing node
   * @param lastError     last error
   * @private
   */
  _getConnectionCallback(pattern, selector, callback, avoidNodeKey, lastError) {
    const matchingNodeList = this._matchingNodes(pattern || /^/);

    if (matchingNodeList.length === 0) {
      if (Object.keys(this.#nodes).length === 0 && !lastError) {
        callback(
          new Error('No node have been added to cluster or nodes have been removed due to too much connection error')
        );
        return;
      }

      if (avoidNodeKey === undefined) callback(new Error(`No node found for pattern '${pattern}'`));
      const errMsg = `No Connection available for '${pattern}'${
        lastError ? '. Last connection error was: ' + lastError.message : ''
      }`;
      callback(new Error(errMsg));
      return;
    }

    const retry = this._getConnectionCallback.bind(this, pattern, selector, callback);
    try {
      const nodeKey = this._selectPool(matchingNodeList, selector, avoidNodeKey);
      this._handleConnectionCallbackError(matchingNodeList, nodeKey, retry, callback);
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Selecting nodes according to pattern.
   *
   * @param pattern pattern
   * @return {*}
   * @private
   */
  _matchingNodes(pattern) {
    if (this.#cachedPatterns[pattern]) return this.#cachedPatterns[pattern];

    const regex = RegExp(pattern);
    const matchingNodeList = [];
    Object.keys(this.#nodes).forEach((key) => {
      if (regex.test(key)) {
        matchingNodeList.push(key);
      }
    });

    this.#cachedPatterns[pattern] = matchingNodeList;
    return matchingNodeList;
  }

  /**
   * Select next node to be chosen in nodeList according to selector and failed nodes.
   *
   * @param nodeList        current node list
   * @param selectorParam   selector
   * @param avoidNodeKey    last failing node to avoid selecting this one.
   * @return {Promise}
   * @private
   */
  _selectPool(nodeList, selectorParam, avoidNodeKey) {
    const selector = selectorParam || this.#opts.defaultSelector;

    let selectorFct;
    switch (selector) {
      case 'RR':
        selectorFct = roundRobinSelector;
        break;

      case 'RANDOM':
        selectorFct = randomSelector;
        break;

      case 'ORDER':
        selectorFct = orderedSelector;
        break;

      default:
        throw new Error(`Wrong selector value '${selector}'. Possible values are 'RR','RANDOM' or 'ORDER'`);
    }

    let nodeIdx = 0;
    let nodeKey = selectorFct(nodeList, nodeIdx);
    // first loop : search for node not blacklisted AND not the avoided key
    while (
      (avoidNodeKey === nodeKey ||
        (this.#nodes[nodeKey].blacklistedUntil && this.#nodes[nodeKey].blacklistedUntil > Date.now())) &&
      nodeIdx < nodeList.length - 1
    ) {
      nodeIdx++;
      nodeKey = selectorFct(nodeList, nodeIdx);
    }

    if (avoidNodeKey === nodeKey) {
      // second loop, search even in blacklisted node in order to choose a different node than to be avoided
      nodeIdx = 0;
      while (avoidNodeKey === nodeKey && nodeIdx < nodeList.length - 1) {
        nodeIdx++;
        nodeKey = selectorFct(nodeList, nodeIdx);
      }
    }

    return nodeKey;
  }

  /**
   * Connect, or if fail handle retry / set timeout error
   *
   * @param nodeList    current node list
   * @param nodeKey     node name to connect
   * @param retryFct    retry function
   * @return {Promise}
   * @private
   */
  _handleConnectionError(nodeList, nodeKey, retryFct) {
    const cluster = this;
    const node = this.#nodes[nodeKey];
    return node
      .getConnection()
      .then((conn) => {
        node.blacklistedUntil = null;
        node.errorCount = 0;
        return Promise.resolve(conn);
      })
      .catch((err) => {
        node.errorCount = node.errorCount ? node.errorCount + 1 : 1;
        node.blacklistedUntil = Date.now() + cluster.#opts.restoreNodeTimeout;
        if (
          cluster.#opts.removeNodeErrorCount &&
          node.errorCount >= cluster.#opts.removeNodeErrorCount &&
          cluster.#nodes[nodeKey]
        ) {
          delete cluster.#nodes[nodeKey];
          cluster.#cachedPatterns = {};
          delete nodeList.lastRrIdx;
          setImmediate(cluster.emit.bind(cluster, 'remove', nodeKey));

          //remove node from configuration if not already removed
          node.end().catch((err) => {
            // dismiss error
          });
        }

        if (nodeList.length !== 0 && cluster.#opts.canRetry && retryFct) {
          return retryFct(nodeKey, err);
        }
        return Promise.reject(err);
      });
  }

  /**
   * Connect, or if fail handle retry / set timeout error
   *
   * @param nodeList    current node list
   * @param nodeKey     node name to connect
   * @param retryFct    retry function
   * @param callback    callback function
   * @private
   */
  _handleConnectionCallbackError(nodeList, nodeKey, retryFct, callback) {
    const cluster = this;
    const node = this.#nodes[nodeKey];
    node.getConnection((err, conn) => {
      if (err) {
        node.errorCount = node.errorCount ? node.errorCount + 1 : 1;
        node.blacklistedUntil = Date.now() + cluster.#opts.restoreNodeTimeout;
        if (
          cluster.#opts.removeNodeErrorCount &&
          node.errorCount >= cluster.#opts.removeNodeErrorCount &&
          cluster.#nodes[nodeKey]
        ) {
          delete cluster.#nodes[nodeKey];
          cluster.#cachedPatterns = {};
          delete nodeList.lastRrIdx;
          setImmediate(cluster.emit.bind(cluster, 'remove', nodeKey));

          //remove node from configuration if not already removed
          node.end(() => {
            //dismiss error
          });
        }

        if (nodeList.length !== 0 && cluster.#opts.canRetry && retryFct) {
          return retryFct(nodeKey, err);
        }

        callback(err);
      } else {
        node.errorCount = 0;
        callback(null, conn);
      }
    });
  }

  //*****************************************************************
  // internal public testing methods
  //*****************************************************************

  get __tests() {
    return new TestMethods(this.#nodes);
  }
}

class TestMethods {
  #nodes;

  constructor(nodes) {
    this.#nodes = nodes;
  }
  getNodes() {
    return this.#nodes;
  }
}

/**
 * Round robin selector: using nodes one after the other.
 *
 * @param nodeList  node list
 * @return {String}
 */
const roundRobinSelector = (nodeList) => {
  let lastRoundRobin = nodeList.lastRrIdx;
  if (lastRoundRobin === undefined) lastRoundRobin = -1;
  if (++lastRoundRobin >= nodeList.length) lastRoundRobin = 0;
  nodeList.lastRrIdx = lastRoundRobin;
  return nodeList[lastRoundRobin];
};

/**
 * Random selector: use a random node.
 *
 * @param nodeList  node list
 * @return {String}
 */
const randomSelector = (nodeList) => {
  let randomIdx = Math.floor(Math.random() * nodeList.length);
  return nodeList[randomIdx];
};

/**
 * Ordered selector: always use the nodes in sequence, unless failing.
 *
 * @param nodeList  node list
 * @param retry     sequence number if last node is tagged has failing
 * @return {String}
 */
const orderedSelector = (nodeList, retry) => {
  return nodeList[retry];
};

module.exports = Cluster;


/***/ }),
/* 101 */
/***/ ((module) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



class ClusterOptions {
  constructor(opts) {
    if (opts) {
      this.canRetry = opts.canRetry === undefined ? true : opts.canRetry;
      this.removeNodeErrorCount = opts.removeNodeErrorCount || Infinity;
      this.restoreNodeTimeout = opts.restoreNodeTimeout || 1000;
      this.defaultSelector = opts.defaultSelector || 'RR';
    } else {
      this.canRetry = true;
      this.removeNodeErrorCount = Infinity;
      this.restoreNodeTimeout = 1000;
      this.defaultSelector = 'RR';
    }
  }
}

module.exports = ClusterOptions;


/***/ }),
/* 102 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



let ConnOptions = __webpack_require__(52);

class PoolOptions {
  constructor(opts) {
    if (typeof opts === 'string') {
      opts = ConnOptions.parse(opts);

      //set data type
      if (opts.acquireTimeout) opts.acquireTimeout = parseInt(opts.acquireTimeout);
      if (opts.connectionLimit) opts.connectionLimit = parseInt(opts.connectionLimit);
      if (opts.idleTimeout) opts.idleTimeout = parseInt(opts.idleTimeout);
      if (opts.leakDetectionTimeout) opts.leakDetectionTimeout = parseInt(opts.leakDetectionTimeout);
      if (opts.initializationTimeout) opts.initializationTimeout = parseInt(opts.initializationTimeout);
      if (opts.minDelayValidation) opts.minDelayValidation = parseInt(opts.minDelayValidation);
      if (opts.minimumIdle) opts.minimumIdle = parseInt(opts.minimumIdle);
      if (opts.noControlAfterUse) opts.noControlAfterUse = opts.noControlAfterUse === 'true';
      if (opts.resetAfterUse) opts.resetAfterUse = opts.resetAfterUse === 'true';
      if (opts.pingTimeout) opts.pingTimeout = parseInt(opts.pingTimeout);
    }

    this.acquireTimeout = opts.acquireTimeout === undefined ? 10000 : opts.acquireTimeout;
    this.connectionLimit = opts.connectionLimit === undefined ? 10 : opts.connectionLimit;
    this.idleTimeout = opts.idleTimeout === undefined ? 1800 : opts.idleTimeout;
    this.leakDetectionTimeout = opts.leakDetectionTimeout || 0;
    this.initializationTimeout = opts.initializationTimeout === undefined ? 30000 : opts.initializationTimeout;
    this.minDelayValidation = opts.minDelayValidation === undefined ? 500 : opts.minDelayValidation;
    this.minimumIdle =
      opts.minimumIdle === undefined ? this.connectionLimit : Math.min(opts.minimumIdle, this.connectionLimit);
    this.noControlAfterUse = opts.noControlAfterUse || false;
    this.resetAfterUse = opts.resetAfterUse || false;
    this.pingTimeout = opts.pingTimeout || 250;
    this.connOptions = new ConnOptions(opts);

    if (this.acquireTimeout > 0 && this.connOptions.connectTimeout > this.acquireTimeout) {
      this.connOptions.connectTimeout = this.acquireTimeout;
    }
  }
}

module.exports = PoolOptions;


/***/ }),
/* 103 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const { EventEmitter } = __webpack_require__(7);

const Pool = __webpack_require__(99);
const Errors = __webpack_require__(13);
const ConnectionCallback = __webpack_require__(104);
const CommandParameter = __webpack_require__(87);

class PoolCallback extends EventEmitter {
  #pool;
  constructor(options) {
    super();
    this.#pool = new Pool(options);
    this.#pool.on('acquire', this.emit.bind(this, 'acquire'));
    this.#pool.on('connection', this.emit.bind(this, 'connection'));
    this.#pool.on('enqueue', this.emit.bind(this, 'enqueue'));
    this.#pool.on('release', this.emit.bind(this, 'release'));
    this.#pool.on('error', this.emit.bind(this, 'error'));
  }

  #noop = () => {};

  get closed() {
    return this.#pool.closed;
  }

  /**
   * Get current total connection number.
   * @return {number}
   */
  totalConnections() {
    return this.#pool.totalConnections();
  }

  /**
   * Get current active connections.
   * @return {number}
   */
  activeConnections() {
    return this.#pool.activeConnections();
  }

  /**
   * Get current idle connection number.
   * @return {number}
   */
  idleConnections() {
    return this.#pool.idleConnections();
  }

  /**
   * Get current stacked connection request.
   * @return {number}
   */
  taskQueueSize() {
    return this.#pool.taskQueueSize();
  }

  escape(value) {
    return this.#pool.escape(value);
  }

  escapeId(value) {
    return this.#pool.escapeId(value);
  }

  /**
   * Ends pool
   *
   * @param callback
   */
  end(callback) {
    this.#pool
      .end()
      .then(() => {
        if (callback) callback(null);
      })
      .catch(callback || this.#noop);
  }

  /**
   * Retrieve a connection from pool.
   * Create a new one, if limit is not reached.
   * wait until acquireTimeout.
   *
   * @param cb callback
   */
  getConnection(cb) {
    if (!cb) {
      throw new Errors.createError('missing mandatory callback parameter', Errors.ER_MISSING_PARAMETER);
    }
    const cmdParam = new CommandParameter();
    if (this.#pool.opts.connOptions.trace) Error.captureStackTrace(cmdParam);
    this.#pool
      .getConnection(cmdParam)
      .then((baseConn) => {
        const cc = new ConnectionCallback(baseConn);
        cc.end = (cb) => cc.release(cb);
        cc.close = (cb) => cc.release(cb);
        cb(null, cc);
      })
      .catch(cb);
  }

  /**
   * Execute query using text protocol with callback emit columns/data/end/error
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @param cb      callback
   */
  query(sql, values, cb) {
    const cmdParam = ConnectionCallback._PARAM(this.#pool.opts.connOptions, sql, values, cb);
    this.#pool
      .getConnection(cmdParam)
      .then((baseConn) => {
        const _cb = cmdParam.callback;
        cmdParam.callback = (err, rows, meta) => {
          this.#pool.release(baseConn);
          if (_cb) _cb(err, rows, meta);
        };
        ConnectionCallback._QUERY_CMD(baseConn, cmdParam);
      })
      .catch((err) => {
        if (cmdParam.callback) cmdParam.callback(err);
      });
  }

  /**
   * Execute query using binary protocol with callback emit columns/data/end/error
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @param cb      callback
   */
  execute(sql, values, cb) {
    const cmdParam = ConnectionCallback._PARAM(this.#pool.opts.connOptions, sql, values, cb);

    this.#pool
      .getConnection(cmdParam)
      .then((baseConn) => {
        const _cb = cmdParam.callback;
        cmdParam.callback = (err, rows, meta) => {
          this.#pool.release(baseConn);
          if (_cb) _cb(err, rows, meta);
        };
        ConnectionCallback._EXECUTE_CMD(baseConn, cmdParam);
      })
      .catch((err) => {
        if (cmdParam.callback) cmdParam.callback(err);
      });
  }

  /**
   * execute a batch
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  array of placeholder values
   * @param cb      callback
   */
  batch(sql, values, cb) {
    const cmdParam = ConnectionCallback._PARAM(this.#pool.opts.connOptions, sql, values, cb);
    this.#pool
      .getConnection(cmdParam)
      .then((baseConn) => {
        const _cb = cmdParam.callback;
        cmdParam.callback = (err, rows, meta) => {
          this.#pool.release(baseConn);
          if (_cb) _cb(err, rows, meta);
        };
        ConnectionCallback._BATCH_CMD(baseConn, cmdParam);
      })
      .catch((err) => {
        if (cmdParam.callback) cmdParam.callback(err);
      });
  }

  /**
   * Import sql file.
   *
   * @param opts JSON array with 2 possible fields: file and database
   * @param cb callback
   */
  importFile(opts, cb) {
    if (!opts) {
      if (cb)
        cb(
          Errors.createError(
            'SQL file parameter is mandatory',
            Errors.ER_MISSING_SQL_PARAMETER,
            null,
            'HY000',
            null,
            false,
            null
          )
        );
      return;
    }

    this.#pool
      .getConnection({})
      .then((baseConn) => {
        return new Promise(baseConn.importFile.bind(baseConn, { file: opts.file, database: opts.database })).finally(
          () => {
            this.#pool.release(baseConn);
          }
        );
      })
      .then(() => {
        if (cb) cb();
      })
      .catch((err) => {
        if (cb) cb(err);
      });
  }
}

module.exports = PoolCallback;


/***/ }),
/* 104 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab



const Errors = __webpack_require__(13);
const { Status } = __webpack_require__(93);
const Query = __webpack_require__(73);
const CommandParameter = __webpack_require__(87);

class ConnectionCallback {
  #conn;

  constructor(conn) {
    this.#conn = conn;
  }

  get threadId() {
    return this.#conn.info ? this.#conn.info.threadId : null;
  }

  get info() {
    return this.#conn.info;
  }

  #noop = () => {};

  release = (cb) => {
    this.#conn.release(() => {
      if (cb) cb();
    });
  };

  /**
   * Permit to change user during connection.
   * All user variables will be reset, Prepare commands will be released.
   * !!! mysql has a bug when CONNECT_ATTRS capability is set, that is default !!!!
   *
   * @param options   connection options
   * @param callback  callback function
   */
  changeUser(options, callback) {
    let _options, _cb;
    if (typeof options === 'function') {
      _cb = options;
      _options = undefined;
    } else {
      _options = options;
      _cb = callback;
    }
    const cmdParam = new CommandParameter(null, null, _options, _cb);
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);

    new Promise(this.#conn.changeUser.bind(this.#conn, cmdParam))
      .then(() => {
        if (cmdParam.callback) cmdParam.callback(null, null, null);
      })
      .catch(cmdParam.callback || this.#noop);
  }

  /**
   * Start transaction
   *
   * @param callback  callback function
   */
  beginTransaction(callback) {
    this.query(new CommandParameter('START TRANSACTION'), null, callback);
  }

  /**
   * Commit a transaction.
   *
   * @param callback  callback function
   */
  commit(callback) {
    this.#conn.changeTransaction(
      new CommandParameter('COMMIT'),
      () => {
        if (callback) callback(null, null, null);
      },
      callback || this.#noop
    );
  }

  /**
   * Roll back a transaction.
   *
   * @param callback  callback function
   */
  rollback(callback) {
    this.#conn.changeTransaction(
      new CommandParameter('ROLLBACK'),
      () => {
        if (callback) callback(null, null, null);
      },
      callback || this.#noop
    );
  }

  /**
   * Execute query using text protocol with callback emit columns/data/end/error
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @param callback  callback function
   */
  query(sql, values, callback) {
    const cmdParam = ConnectionCallback._PARAM(this.#conn.opts, sql, values, callback);
    return ConnectionCallback._QUERY_CMD(this.#conn, cmdParam);
  }

  static _QUERY_CMD(conn, cmdParam) {
    let cmd;
    if (cmdParam.callback) {
      cmdParam.opts = cmdParam.opts ? Object.assign(cmdParam.opts, { metaAsArray: true }) : { metaAsArray: true };
      cmd = new Query(
        ([rows, meta]) => {
          cmdParam.callback(null, rows, meta);
        },
        cmdParam.callback,
        conn.opts,
        cmdParam
      );
    } else {
      cmd = new Query(
        () => {},
        () => {},
        conn.opts,
        cmdParam
      );
    }

    cmd.handleNewRows = (row) => {
      cmd._rows[cmd._responseIndex].push(row);
      cmd.emit('data', row);
    };

    conn.addCommand(cmd);
    cmd.stream = (opt) => cmd._stream(conn.socket, opt);
    return cmd;
  }

  execute(sql, values, callback) {
    const cmdParam = ConnectionCallback._PARAM(this.#conn.opts, sql, values, callback);
    return ConnectionCallback._EXECUTE_CMD(this.#conn, cmdParam);
  }

  static _PARAM(options, sql, values, callback) {
    let _cmdOpt,
      _sql,
      _values = values,
      _cb = callback;
    if (typeof values === 'function') {
      _cb = values;
      _values = undefined;
    }
    if (typeof sql === 'object') {
      _cmdOpt = sql;
      _sql = _cmdOpt.sql;
      if (_cmdOpt.values) _values = _cmdOpt.values;
    } else {
      _sql = sql;
    }
    const cmdParam = new CommandParameter(_sql, _values, _cmdOpt, _cb);
    if (options.trace) Error.captureStackTrace(cmdParam);
    return cmdParam;
  }

  static _EXECUTE_CMD(conn, cmdParam) {
    new Promise(conn.prepare.bind(conn, cmdParam))
      .then((prepare) => {
        const opts = cmdParam.opts ? Object.assign(cmdParam.opts, { metaAsArray: true }) : { metaAsArray: true };
        return prepare
          .execute(cmdParam.values, opts, null, cmdParam.stack)
          .then(([rows, meta]) => {
            if (cmdParam.callback) {
              cmdParam.callback(null, rows, meta);
            }
          })
          .finally(() => prepare.close());
      })
      .catch((err) => {
        if (conn.opts.logger.error) conn.opts.logger.error(err);
        if (cmdParam.callback) cmdParam.callback(err);
      });
  }

  prepare(sql, callback) {
    let _cmdOpt, _sql;
    if (typeof sql === 'object') {
      _cmdOpt = sql;
      _sql = _cmdOpt.sql;
    } else {
      _sql = sql;
    }
    const cmdParam = new CommandParameter(_sql, null, _cmdOpt, callback);
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.prepare.bind(this.#conn, cmdParam))
      .then((prepare) => {
        if (callback) callback(null, prepare, null);
      })
      .catch(callback || this.#noop);
  }

  /**
   * Execute a batch
   * events to permit streaming big result-set
   *
   * @param sql     sql parameter Object can be used to supersede default option.
   *                Object must then have sql property.
   * @param values  object / array of placeholder values (not mandatory)
   * @param callback callback
   */
  batch(sql, values, callback) {
    const cmdParam = ConnectionCallback._PARAM(this.#conn.opts, sql, values, callback);
    return ConnectionCallback._BATCH_CMD(this.#conn, cmdParam);
  }

  static _BATCH_CMD(conn, cmdParam) {
    conn
      .batch(cmdParam)
      .then((res) => {
        if (cmdParam.callback) cmdParam.callback(null, res);
      })
      .catch((err) => {
        if (cmdParam.callback) cmdParam.callback(err);
      });
  }

  /**
   * Import sql file.
   *
   * @param opts JSON array with 2 possible fields: file and database
   * @param cb callback
   */
  importFile(opts, cb) {
    if (!opts || !opts.file) {
      if (cb)
        cb(
          Errors.createError(
            'SQL file parameter is mandatory',
            Errors.ER_MISSING_SQL_PARAMETER,
            this.#conn.info,
            'HY000',
            null,
            false,
            null
          )
        );
      return;
    }
    new Promise(this.#conn.importFile.bind(this.#conn, { file: opts.file, database: opts.database }))
      .then(() => {
        if (cb) cb();
      })
      .catch((err) => {
        if (cb) cb(err);
      });
  }

  /**
   * Send an empty MySQL packet to ensure connection is active, and reset @@wait_timeout
   * @param timeout (optional) timeout value in ms. If reached, throw error and close connection
   * @param callback callback
   */
  ping(timeout, callback) {
    let _cmdOpt = {},
      _cb;
    if (typeof timeout === 'function') {
      _cb = timeout;
    } else {
      _cmdOpt.timeout = timeout;
      _cb = callback;
    }
    const cmdParam = new CommandParameter(null, null, _cmdOpt, _cb);
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    new Promise(this.#conn.ping.bind(this.#conn, cmdParam)).then(_cb || this.#noop).catch(_cb || this.#noop);
  }

  /**
   * Send a reset command that will
   * - rollback any open transaction
   * - reset transaction isolation level
   * - reset session variables
   * - delete user variables
   * - remove temporary tables
   * - remove all PREPARE statement
   *
   * @param callback callback
   */
  reset(callback) {
    const cmdParam = new CommandParameter();
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    return new Promise(this.#conn.reset.bind(this.#conn, cmdParam))
      .then(callback || this.#noop)
      .catch(callback || this.#noop);
  }

  /**
   * Indicates the state of the connection as the driver knows it
   * @returns {boolean}
   */
  isValid() {
    return this.#conn.isValid();
  }

  /**
   * Terminate connection gracefully.
   *
   * @param callback callback
   */
  end(callback) {
    const cmdParam = new CommandParameter();
    if (this.#conn.opts.trace) Error.captureStackTrace(cmdParam);
    new Promise(this.#conn.end.bind(this.#conn, cmdParam))
      .then(() => {
        if (callback) callback();
      })
      .catch(callback || this.#noop);
  }

  /**
   * Alias for destroy.
   */
  close() {
    this.destroy();
  }

  /**
   * Force connection termination by closing the underlying socket and killing server process if any.
   */
  destroy() {
    this.#conn.destroy();
  }

  pause() {
    this.#conn.pause();
  }

  resume() {
    this.#conn.resume();
  }

  format(sql, values) {
    this.#conn.format(sql, values);
  }

  /**
   * return current connected server version information.
   *
   * @returns {*}
   */
  serverVersion() {
    return this.#conn.serverVersion();
  }

  /**
   * Change option "debug" during connection.
   * @param val   debug value
   */
  debug(val) {
    return this.#conn.debug(val);
  }

  debugCompress(val) {
    return this.#conn.debugCompress(val);
  }

  escape(val) {
    return this.#conn.escape(val);
  }

  escapeId(val) {
    return this.#conn.escapeId(val);
  }

  //*****************************************************************
  // internal public testing methods
  //*****************************************************************

  get __tests() {
    return this.#conn.__tests;
  }

  connect(callback) {
    if (!callback) {
      throw new Errors.createError(
        'missing mandatory callback parameter',
        Errors.ER_MISSING_PARAMETER,
        this.#conn.info
      );
    }
    switch (this.#conn.status) {
      case Status.NOT_CONNECTED:
      case Status.CONNECTING:
      case Status.AUTHENTICATING:
      case Status.INIT_CMD:
        this.once('connect', callback);
        break;
      case Status.CONNECTED:
        callback.call(this);
        break;
      case Status.CLOSING:
      case Status.CLOSED:
        callback.call(
          this,
          Errors.createError(
            'Connection closed',
            Errors.ER_CONNECTION_ALREADY_CLOSED,
            this.#conn.info,
            '08S01',
            null,
            true
          )
        );
        break;
    }
  }

  //*****************************************************************
  // EventEmitter proxy methods
  //*****************************************************************

  on(eventName, listener) {
    this.#conn.on.call(this.#conn, eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.#conn.off.call(this.#conn, eventName, listener);
    return this;
  }

  once(eventName, listener) {
    this.#conn.once.call(this.#conn, eventName, listener);
    return this;
  }

  listeners(eventName) {
    return this.#conn.listeners.call(this.#conn, eventName);
  }

  addListener(eventName, listener) {
    this.#conn.addListener.call(this.#conn, eventName, listener);
    return this;
  }

  eventNames() {
    return this.#conn.eventNames.call(this.#conn);
  }

  getMaxListeners() {
    return this.#conn.getMaxListeners.call(this.#conn);
  }

  listenerCount(eventName, listener) {
    return this.#conn.listenerCount.call(this.#conn, eventName, listener);
  }

  prependListener(eventName, listener) {
    this.#conn.prependListener.call(this.#conn, eventName, listener);
    return this;
  }

  prependOnceListener(eventName, listener) {
    this.#conn.prependOnceListener.call(this.#conn, eventName, listener);
    return this;
  }

  removeAllListeners(eventName, listener) {
    this.#conn.removeAllListeners.call(this.#conn, eventName, listener);
    return this;
  }

  removeListener(eventName, listener) {
    this.#conn.removeListener.call(this.#conn, eventName, listener);
    return this;
  }

  setMaxListeners(n) {
    this.#conn.setMaxListeners.call(this.#conn, n);
    return this;
  }

  rawListeners(eventName) {
    return this.#conn.rawListeners.call(this.#conn, eventName);
  }
}

module.exports = ConnectionCallback;


/***/ }),
/* 105 */
/***/ ((module) => {

//  SPDX-License-Identifier: LGPL-2.1-or-later
//  Copyright (c) 2015-2023 MariaDB Corporation Ab

/**
 * Similar to pool cluster with pre-set pattern and selector.
 * Additional method query
 *
 * @param poolCluster    cluster
 * @param patternArg     pre-set pattern
 * @param selectorArg    pre-set selector
 * @constructor
 */
class FilteredCluster {
  #cluster;
  #pattern;
  #selector;

  constructor(poolCluster, patternArg, selectorArg) {
    this.#cluster = poolCluster;
    this.#pattern = patternArg;
    this.#selector = selectorArg;
  }

  /**
   * Get a connection according to previously indicated pattern and selector.
   *
   * @return {Promise}
   */
  getConnection() {
    return this.#cluster.getConnection(this.#pattern, this.#selector);
  }

  /**
   * Execute a text query on one connection from available pools matching pattern
   * in cluster.
   *
   * @param sql   sql command
   * @param value parameter value of sql command (not mandatory)
   * @return {Promise}
   */
  query(sql, value) {
    return this.#cluster
      .getConnection(this.#pattern, this.#selector)
      .then((conn) => {
        return conn
          .query(sql, value)
          .then((res) => {
            conn.release();
            return res;
          })
          .catch((err) => {
            conn.release();
            return Promise.reject(err);
          });
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  /**
   * Execute a binary query on one connection from available pools matching pattern
   * in cluster.
   *
   * @param sql   sql command
   * @param value parameter value of sql command (not mandatory)
   * @return {Promise}
   */
  execute(sql, value) {
    return this.#cluster
      .getConnection(this.#pattern, this.#selector)
      .then((conn) => {
        return conn
          .execute(sql, value)
          .then((res) => {
            conn.release();
            return res;
          })
          .catch((err) => {
            conn.release();
            return Promise.reject(err);
          });
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  /**
   * Execute a batch on one connection from available pools matching pattern
   * in cluster.
   *
   * @param sql   sql command
   * @param value parameter value of sql command
   * @return {Promise}
   */
  batch(sql, value) {
    return this.#cluster
      .getConnection(this.#pattern, this.#selector)
      .then((conn) => {
        return conn
          .batch(sql, value)
          .then((res) => {
            conn.release();
            return res;
          })
          .catch((err) => {
            conn.release();
            return Promise.reject(err);
          });
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }
}

module.exports = FilteredCluster;


/***/ }),
/* 106 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.poolConfig = void 0;
const vscode = __importStar(__webpack_require__(1));
const database = vscode.workspace.getConfiguration('codesync').get('database');
exports.poolConfig = {
    "host": "127.0.0.1",
    "user": "root",
    "database": database
};


/***/ }),
/* 107 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findKeyAndValue = exports.parseXMLtoJSON = void 0;
const fs_1 = __importDefault(__webpack_require__(68));
const fast_xml_parser_1 = __webpack_require__(108);
function parseXMLtoJSON(path) {
    const buffer = fs_1.default.readFileSync(path);
    const XMLString = buffer.toString();
    const parser = new fast_xml_parser_1.XMLParser();
    return parser.parse(XMLString);
}
exports.parseXMLtoJSON = parseXMLtoJSON;
function findKeyAndValue(obj, targetKey) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (key === targetKey) {
                return { key, value };
            }
            else if (typeof value === 'object' && value !== null) {
                const result = findKeyAndValue(value, targetKey);
                if (result) {
                    return { key: `${key}.${result.key}`, value: result.value };
                }
            }
        }
    }
    return undefined;
}
exports.findKeyAndValue = findKeyAndValue;


/***/ }),
/* 108 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const validator = __webpack_require__(109);
const XMLParser = __webpack_require__(111);
const XMLBuilder = __webpack_require__(118);

module.exports = {
  XMLParser: XMLParser,
  XMLValidator: validator,
  XMLBuilder: XMLBuilder
}

/***/ }),
/* 109 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


const util = __webpack_require__(110);

const defaultOptions = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  unpairedTags: []
};

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
exports.validate = function (xmlData, options) {
  options = Object.assign({}, defaultOptions, options);

  //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
  const tags = [];
  let tagFound = false;

  //indicates that the root tag has been closed (aka. depth 0 has been reached)
  let reachedRoot = false;

  if (xmlData[0] === '\ufeff') {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }
  
  for (let i = 0; i < xmlData.length; i++) {

    if (xmlData[i] === '<' && xmlData[i+1] === '?') {
      i+=2;
      i = readPI(xmlData,i);
      if (i.err) return i;
    }else if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      let tagStartPos = i;
      i++;
      
      if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        let tagName = '';
        for (; i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r'; i++
        ) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          //continue;
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '"+tagName+"' is an invalid name.";
          }
          return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject('InvalidTag',
                "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                getLineNumberForPosition(xmlData, tagStartPos));
            }

            //when there are no more tags, we reached the root level.
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
          } else if(options.unpairedTags.indexOf(tagName) !== -1){
            //don't push into stack
          } else {
            tags.push({tagName, tagStartPos});
          }
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i+1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else{
              break;
            }
          } else if (xmlData[i] === '&') {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          }else{
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject('InvalidXml', "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if ( isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }

  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  }else if (tags.length == 1) {
      return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  }else if (tags.length > 0) {
      return getErrorObject('InvalidXml', "Invalid '"+
          JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
          "' found.", {line: 1, col: 1});
  }

  return true;
};

function isWhiteSpace(char){
  return char === ' ' || char === '\t' || char === '\n'  || char === '\r';
}
/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}

function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === 'D' &&
    xmlData[i + 2] === 'O' &&
    xmlData[i + 3] === 'C' &&
    xmlData[i + 4] === 'T' &&
    xmlData[i + 5] === 'Y' &&
    xmlData[i + 6] === 'P' &&
    xmlData[i + 7] === 'E'
  ) {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === '[' &&
    xmlData[i + 2] === 'C' &&
    xmlData[i + 3] === 'D' &&
    xmlData[i + 4] === 'A' &&
    xmlData[i + 5] === 'T' &&
    xmlData[i + 6] === 'A' &&
    xmlData[i + 7] === '['
  ) {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }

  return i;
}

const doubleQuote = '"';
const singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData, i) {
  let attrStr = '';
  let startChar = '';
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
        //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
      } else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== '') {
    return false;
  }

  return {
    value: attrStr,
    index: i,
    tagClosed: tagClosed
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};

  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
    }
  }

  return true;
}

function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === 'x') {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ';')
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}

function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';')
    return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ';')
      break;
    return -1;
  }
  return i;
}

function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code: code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col,
    },
  };
}

function validateAttrName(attrName) {
  return util.isName(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return util.isName(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,

    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}


/***/ }),
/* 110 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*'
const regexName = new RegExp('^' + nameRegexp + '$');

const getAllMatches = function(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
};

const isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === 'undefined');
};

exports.isExist = function(v) {
  return typeof v !== 'undefined';
};

exports.isEmptyObject = function(obj) {
  return Object.keys(obj).length === 0;
};

/**
 * Copy all the properties of a into b.
 * @param {*} target
 * @param {*} a
 */
exports.merge = function(target, a, arrayMode) {
  if (a) {
    const keys = Object.keys(a); // will return an array of own properties
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      if (arrayMode === 'strict') {
        target[keys[i]] = [ a[keys[i]] ];
      } else {
        target[keys[i]] = a[keys[i]];
      }
    }
  }
};
/* exports.merge =function (b,a){
  return Object.assign(b,a);
} */

exports.getValue = function(v) {
  if (exports.isExist(v)) {
    return v;
  } else {
    return '';
  }
};

// const fakeCall = function(a) {return a;};
// const fakeCallNoReturn = function() {};

exports.isName = isName;
exports.getAllMatches = getAllMatches;
exports.nameRegexp = nameRegexp;


/***/ }),
/* 111 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { buildOptions} = __webpack_require__(112);
const OrderedObjParser = __webpack_require__(113);
const { prettify} = __webpack_require__(117);
const validator = __webpack_require__(109);

class XMLParser{
    
    constructor(options){
        this.externalEntities = {};
        this.options = buildOptions(options);
        
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Buffer} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData,validationOption){
        if(typeof xmlData === "string"){
        }else if( xmlData.toString){
            xmlData = xmlData.toString();
        }else{
            throw new Error("XML data is accepted in String or Bytes[] form.")
        }
        if( validationOption){
            if(validationOption === true) validationOption = {}; //validate with default options
            
            const result = validator.validate(xmlData, validationOption);
            if (result !== true) {
              throw Error( `${result.err.msg}:${result.err.line}:${result.err.col}` )
            }
          }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if(this.options.preserveOrder || orderedResult === undefined) return orderedResult;
        else return prettify(orderedResult, this.options);
    }

    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value){
        if(value.indexOf("&") !== -1){
            throw new Error("Entity value can't have '&'")
        }else if(key.indexOf("&") !== -1 || key.indexOf(";") !== -1){
            throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'")
        }else if(value === "&"){
            throw new Error("An entity with value '&' is not permitted");
        }else{
            this.externalEntities[key] = value;
        }
    }
}

module.exports = XMLParser;

/***/ }),
/* 112 */
/***/ ((__unused_webpack_module, exports) => {


const defaultOptions = {
    preserveOrder: false,
    attributeNamePrefix: '@_',
    attributesGroupName: false,
    textNodeName: '#text',
    ignoreAttributes: true,
    removeNSPrefix: false, // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false, //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true, //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
      return val;
    },
    stopNodes: [], //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs){
      return tagName
    },
    // skipEmptyListItem: false
};
   
const buildOptions = function(options) {
    return Object.assign({}, defaultOptions, options);
};

exports.buildOptions = buildOptions;
exports.defaultOptions = defaultOptions;

/***/ }),
/* 113 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

///@ts-check

const util = __webpack_require__(110);
const xmlNode = __webpack_require__(114);
const readDocType = __webpack_require__(115);
const toNumber = __webpack_require__(116);

// const regx =
//   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
//   .replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

class OrderedObjParser{
  constructor(options){
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos" : { regex: /&(apos|#39|#x27);/g, val : "'"},
      "gt" : { regex: /&(gt|#62|#x3E);/g, val : ">"},
      "lt" : { regex: /&(lt|#60|#x3C);/g, val : "<"},
      "quot" : { regex: /&(quot|#34|#x22);/g, val : "\""},
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val : "&"};
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent" : { regex: /&(cent|#162);/g, val: "¢" },
      "pound" : { regex: /&(pound|#163);/g, val: "£" },
      "yen" : { regex: /&(yen|#165);/g, val: "¥" },
      "euro" : { regex: /&(euro|#8364);/g, val: "€" },
      "copyright" : { regex: /&(copy|#169);/g, val: "©" },
      "reg" : { regex: /&(reg|#174);/g, val: "®" },
      "inr" : { regex: /&(inr|#8377);/g, val: "₹" },
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
  }

}

function addExternalEntities(externalEntities){
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
       regex: new RegExp("&"+ent+";","g"),
       val : externalEntities[ent]
    }
  }
}

/**
 * @param {string} val
 * @param {string} tagName
 * @param {string} jPath
 * @param {boolean} dontTrim
 * @param {boolean} hasAttributes
 * @param {boolean} isLeafNode
 * @param {boolean} escapeEntities
 */
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if(val.length > 0){
      if(!escapeEntities) val = this.replaceEntitiesValue(val);
      
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if(newval === null || newval === undefined){
        //don't parse
        return val;
      }else if(typeof newval !== typeof val || newval !== val){
        //overwrite
        return newval;
      }else if(this.options.trimValues){
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      }else{
        const trimmedVal = val.trim();
        if(trimmedVal === val){
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        }else{
          return val;
        }
      }
    }
  }
}

function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(':');
    const prefix = tagname.charAt(0) === '/' ? '/' : '';
    if (tags[0] === 'xmlns') {
      return '';
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}

//TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?', 'gm');

function buildAttributesMap(attrStr, jPath, tagName) {
  if (!this.options.ignoreAttributes && typeof attrStr === 'string') {
    // attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = util.getAllMatches(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if(aName === "__proto__") aName  = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if(newVal === null || newVal === undefined){
            //don't parse
            attrs[aName] = oldVal;
          }else if(typeof newVal !== typeof oldVal || newVal !== oldVal){
            //overwrite
            attrs[aName] = newVal;
          }else{
            //parse
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs
  }
}

const parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n"); //TODO: remove this line
  const xmlObj = new xmlNode('!xml');
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for(let i=0; i< xmlData.length; i++){//for each char in XML data
    const ch = xmlData[i];
    if(ch === '<'){
      // const nextIndex = i+1;
      // const _2ndChar = xmlData[nextIndex];
      if( xmlData[i+1] === '/') {//Closing Tag
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.")
        let tagName = xmlData.substring(i+2,closeIndex).trim();

        if(this.options.removeNSPrefix){
          const colonIndex = tagName.indexOf(":");
          if(colonIndex !== -1){
            tagName = tagName.substr(colonIndex+1);
          }
        }

        if(this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }

        if(currentNode){
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }

        //check if last tag of nested tag was unpaired tag
        const lastTagName = jPath.substring(jPath.lastIndexOf(".")+1);
        if(tagName && this.options.unpairedTags.indexOf(tagName) !== -1 ){
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0
        if(lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1 ){
          propIndex = jPath.lastIndexOf('.', jPath.lastIndexOf('.')-1)
          this.tagsNodeStack.pop();
        }else{
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);

        currentNode = this.tagsNodeStack.pop();//avoid recursion, set the parent tag scope
        textData = "";
        i = closeIndex;
      } else if( xmlData[i+1] === '?') {

        let tagData = readTagExp(xmlData,i, false, "?>");
        if(!tagData) throw new Error("Pi Tag is not closed.");

        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if( (this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags){

        }else{
  
          const childNode = new xmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          
          if(tagData.tagName !== tagData.tagExp && tagData.attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath)

        }


        i = tagData.closeIndex + 1;
      } else if(xmlData.substr(i + 1, 3) === '!--') {
        const endIndex = findClosingIndex(xmlData, "-->", i+4, "Comment is not closed.")
        if(this.options.commentPropName){
          const comment = xmlData.substring(i + 4, endIndex - 2);

          textData = this.saveTextToParentTag(textData, currentNode, jPath);

          currentNode.add(this.options.commentPropName, [ { [this.options.textNodeName] : comment } ]);
        }
        i = endIndex;
      } else if( xmlData.substr(i + 1, 2) === '!D') {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      }else if(xmlData.substr(i + 1, 2) === '![') {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9,closeIndex);

        textData = this.saveTextToParentTag(textData, currentNode, jPath);

        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if(val == undefined) val = "";

        //cdata should be set even if it is 0 length string
        if(this.options.cdataPropName){
          currentNode.add(this.options.cdataPropName, [ { [this.options.textNodeName] : tagExp } ]);
        }else{
          currentNode.add(this.options.textNodeName, val);
        }
        
        i = closeIndex + 2;
      }else {//Opening tag
        let result = readTagExp(xmlData,i, this.options.removeNSPrefix);
        let tagName= result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;

        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        
        //save text as child node
        if (currentNode && textData) {
          if(currentNode.tagname !== '!xml'){
            //when nested tag is found
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }

        //check if last tag was unpaired tag
        const lastTag = currentNode;
        if(lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1 ){
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if(tagName !== xmlObj.tagname){
          jPath += jPath ? "." + tagName : tagName;
        }
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          //self-closing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            i = result.closeIndex;
          }
          //unpaired tag
          else if(this.options.unpairedTags.indexOf(tagName) !== -1){
            i = result.closeIndex;
          }
          //normal tag
          else{
            //read until closing tag is found
            const result = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if(!result) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result.i;
            tagContent = result.tagContent;
          }

          const childNode = new xmlNode(tagName);
          if(tagName !== tagExp && attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if(tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          
          this.addChild(currentNode, childNode, jPath)
        }else{
  //selfClosing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else{
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            
            if(this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }

            const childNode = new xmlNode(tagName);
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath)
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          }
    //opening tag
          else{
            const childNode = new xmlNode( tagName);
            this.tagsNodeStack.push(currentNode);
            
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath)
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    }else{
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
}

function addChild(currentNode, childNode, jPath){
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"])
  if(result === false){
  }else if(typeof result === "string"){
    childNode.tagname = result
    currentNode.addChild(childNode);
  }else{
    currentNode.addChild(childNode);
  }
}

const replaceEntitiesValue = function(val){

  if(this.options.processEntities){
    for(let entityName in this.docTypeEntities){
      const entity = this.docTypeEntities[entityName];
      val = val.replace( entity.regx, entity.val);
    }
    for(let entityName in this.lastEntities){
      const entity = this.lastEntities[entityName];
      val = val.replace( entity.regex, entity.val);
    }
    if(this.options.htmlEntities){
      for(let entityName in this.htmlEntities){
        const entity = this.htmlEntities[entityName];
        val = val.replace( entity.regex, entity.val);
      }
    }
    val = val.replace( this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
}
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) { //store previously collected data as textNode
    if(isLeafNode === undefined) isLeafNode = Object.keys(currentNode.child).length === 0
    
    textData = this.parseTextData(textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode);

    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}

//TODO: use jPath to simplify the logic
/**
 * 
 * @param {string[]} stopNodes 
 * @param {string} jPath
 * @param {string} currentTagName 
 */
function isItStopNode(stopNodes, jPath, currentTagName){
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if( allNodesExp === stopNodeExp || jPath === stopNodeExp  ) return true;
  }
  return false;
}

/**
 * Returns the tag Expression and where it is ending handling single-double quotes situation
 * @param {string} xmlData 
 * @param {number} i starting index
 * @returns 
 */
function tagExpWithClosingIndex(xmlData, i, closingChar = ">"){
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
        if (ch === attrBoundary) attrBoundary = "";//reset
    } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if(closingChar[1]){
        if(xmlData[index + 1] === closingChar[1]){
          return {
            data: tagExp,
            index: index
          }
        }
      }else{
        return {
          data: tagExp,
          index: index
        }
      }
    } else if (ch === '\t') {
      ch = " "
    }
    tagExp += ch;
  }
}

function findClosingIndex(xmlData, str, i, errMsg){
  const closingIndex = xmlData.indexOf(str, i);
  if(closingIndex === -1){
    throw new Error(errMsg)
  }else{
    return closingIndex + str.length - 1;
  }
}

function readTagExp(xmlData,i, removeNSPrefix, closingChar = ">"){
  const result = tagExpWithClosingIndex(xmlData, i+1, closingChar);
  if(!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if(separatorIndex !== -1){//separate tag name and attributes expression
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }

  const rawTagName = tagName;
  if(removeNSPrefix){
    const colonIndex = tagName.indexOf(":");
    if(colonIndex !== -1){
      tagName = tagName.substr(colonIndex+1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }

  return {
    tagName: tagName,
    tagExp: tagExp,
    closeIndex: closeIndex,
    attrExpPresent: attrExpPresent,
    rawTagName: rawTagName,
  }
}
/**
 * find paired tag for a stop node
 * @param {string} xmlData 
 * @param {string} tagName 
 * @param {number} i 
 */
function readStopNodeData(xmlData, tagName, i){
  const startIndex = i;
  // Starting at 1 since we already have an open tag
  let openTagCount = 1;

  for (; i < xmlData.length; i++) {
    if( xmlData[i] === "<"){ 
      if (xmlData[i+1] === "/") {//close tag
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i+2,closeIndex).trim();
          if(closeTagName === tagName){
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i : closeIndex
              }
            }
          }
          i=closeIndex;
        } else if(xmlData[i+1] === '?') { 
          const closeIndex = findClosingIndex(xmlData, "?>", i+1, "StopNode is not closed.")
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 3) === '!--') { 
          const closeIndex = findClosingIndex(xmlData, "-->", i+3, "StopNode is not closed.")
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 2) === '![') { 
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i=closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, '>')

          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length-1] !== "/") {
              openTagCount++;
            }
            i=tagData.closeIndex;
          }
        }
      }
  }//end for loop
}

function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    const newval = val.trim();
    if(newval === 'true' ) return true;
    else if(newval === 'false' ) return false;
    else return toNumber(val, options);
  } else {
    if (util.isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}


module.exports = OrderedObjParser;


/***/ }),
/* 114 */
/***/ ((module) => {

"use strict";


class XmlNode{
  constructor(tagname) {
    this.tagname = tagname;
    this.child = []; //nested tags, text, cdata, comments in order
    this[":@"] = {}; //attributes map
  }
  add(key,val){
    // this.child.push( {name : key, val: val, isCdata: isCdata });
    if(key === "__proto__") key = "#__proto__";
    this.child.push( {[key]: val });
  }
  addChild(node) {
    if(node.tagname === "__proto__") node.tagname = "#__proto__";
    if(node[":@"] && Object.keys(node[":@"]).length > 0){
      this.child.push( { [node.tagname]: node.child, [":@"]: node[":@"] });
    }else{
      this.child.push( { [node.tagname]: node.child });
    }
  };
};


module.exports = XmlNode;

/***/ }),
/* 115 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const util = __webpack_require__(110);

//TODO: handle comments
function readDocType(xmlData, i){
    
    const entities = {};
    if( xmlData[i + 3] === 'O' &&
         xmlData[i + 4] === 'C' &&
         xmlData[i + 5] === 'T' &&
         xmlData[i + 6] === 'Y' &&
         xmlData[i + 7] === 'P' &&
         xmlData[i + 8] === 'E')
    {    
        i = i+9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for(;i<xmlData.length;i++){
            if (xmlData[i] === '<' && !comment) { //Determine the tag type
                if( hasBody && isEntity(xmlData, i)){
                    i += 7; 
                    [entityName, val,i] = readEntityExp(xmlData,i+1);
                    if(val.indexOf("&") === -1) //Parameter entities are not supported
                        entities[ validateEntityName(entityName) ] = {
                            regx : RegExp( `&${entityName};`,"g"),
                            val: val
                        };
                }
                else if( hasBody && isElement(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isAttlist(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isNotation(xmlData, i)) i += 9;//Not supported
                else if( isComment)                         comment = true;
                else                                        throw new Error("Invalid DOCTYPE");

                angleBracketsCount++;
                exp = "";
            } else if (xmlData[i] === '>') { //Read tag content
                if(comment){
                    if( xmlData[i - 1] === "-" && xmlData[i - 2] === "-"){
                        comment = false;
                        angleBracketsCount--;
                    }
                }else{
                    angleBracketsCount--;
                }
                if (angleBracketsCount === 0) {
                  break;
                }
            }else if( xmlData[i] === '['){
                hasBody = true;
            }else{
                exp += xmlData[i];
            }
        }
        if(angleBracketsCount !== 0){
            throw new Error(`Unclosed DOCTYPE`);
        }
    }else{
        throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return {entities, i};
}

function readEntityExp(xmlData,i){
    //External entities are not supported
    //    <!ENTITY ext SYSTEM "http://normal-website.com" >

    //Parameter entities are not supported
    //    <!ENTITY entityname "&anotherElement;">

    //Internal entities are supported
    //    <!ENTITY entityname "replacement text">
    
    //read EntityName
    let entityName = "";
    for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"' ); i++) {
        // if(xmlData[i] === " ") continue;
        // else 
        entityName += xmlData[i];
    }
    entityName = entityName.trim();
    if(entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");

    //read Entity Value
    const startChar = xmlData[i++];
    let val = ""
    for (; i < xmlData.length && xmlData[i] !== startChar ; i++) {
        val += xmlData[i];
    }
    return [entityName, val, i];
}

function isComment(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === '-' &&
    xmlData[i+3] === '-') return true
    return false
}
function isEntity(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'N' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'I' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'Y') return true
    return false
}
function isElement(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'L' &&
    xmlData[i+4] === 'E' &&
    xmlData[i+5] === 'M' &&
    xmlData[i+6] === 'E' &&
    xmlData[i+7] === 'N' &&
    xmlData[i+8] === 'T') return true
    return false
}

function isAttlist(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'A' &&
    xmlData[i+3] === 'T' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'L' &&
    xmlData[i+6] === 'I' &&
    xmlData[i+7] === 'S' &&
    xmlData[i+8] === 'T') return true
    return false
}
function isNotation(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'N' &&
    xmlData[i+3] === 'O' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'A' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'I' &&
    xmlData[i+8] === 'O' &&
    xmlData[i+9] === 'N') return true
    return false
}

function validateEntityName(name){
    if (util.isName(name))
	return name;
    else
        throw new Error(`Invalid entity name ${name}`);
}

module.exports = readDocType;


/***/ }),
/* 116 */
/***/ ((module) => {

const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
// const octRegex = /0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;


//polyfill
if (!Number.parseInt && window.parseInt) {
    Number.parseInt = window.parseInt;
}
if (!Number.parseFloat && window.parseFloat) {
    Number.parseFloat = window.parseFloat;
}

  
const consider = {
    hex :  true,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true
    //skipLike: /regex/
};

function toNumber(str, options = {}){
    // const options = Object.assign({}, consider);
    // if(opt.leadingZeros === false){
    //     options.leadingZeros = false;
    // }else if(opt.hex === false){
    //     options.hex = false;
    // }

    options = Object.assign({}, consider, options );
    if(!str || typeof str !== "string" ) return str;
    
    let trimmedStr  = str.trim();
    // if(trimmedStr === "0.0") return 0;
    // else if(trimmedStr === "+0.0") return 0;
    // else if(trimmedStr === "-0.0") return -0;

    if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return Number.parseInt(trimmedStr, 16);
    // } else if (options.parseOct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
    }else{
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        if(match){
            const sign = match[1];
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            //trim ending zeros for floating number
            
            const eNotation = match[4] || match[6];
            if(!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str; //-0123
            else if(!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str; //0123
            else{//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const numStr = "" + num;
                if(numStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(eNotation){ //given number has enotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                    // const decimalPart = match[5].substr(1);
                    // const intPart = trimmedStr.substr(0,trimmedStr.indexOf("."));

                    
                    // const p = numStr.indexOf(".");
                    // const givenIntPart = numStr.substr(0,p);
                    // const givenDecPart = numStr.substr(p+1);
                    if(numStr === "0" && (numTrimmedByZeros === "") ) return num; //0.0
                    else if(numStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if( sign && numStr === "-"+numTrimmedByZeros) return num;
                    else return str;
                }
                
                if(leadingZeros){
                    // if(numTrimmedByZeros === numStr){
                    //     if(options.leadingZeros) return num;
                    //     else return str;
                    // }else return str;
                    if(numTrimmedByZeros === numStr) return num;
                    else if(sign+numTrimmedByZeros === numStr) return num;
                    else return str;
                }

                if(trimmedStr === numStr) return num;
                else if(trimmedStr === sign+numStr) return num;
                // else{
                //     //number with +/- sign
                //     trimmedStr.test(/[-+][0-9]);

                // }
                return str;
            }
            // else if(!eNotation && trimmedStr && trimmedStr !== Number(trimmedStr) ) return str;
            
        }else{ //non-numeric string
            return str;
        }
    }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr){
    if(numStr && numStr.indexOf(".") !== -1){//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if(numStr === ".")  numStr = "0";
        else if(numStr[0] === ".")  numStr = "0"+numStr;
        else if(numStr[numStr.length-1] === ".")  numStr = numStr.substr(0,numStr.length-1);
        return numStr;
    }
    return numStr;
}
module.exports = toNumber


/***/ }),
/* 117 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * 
 * @param {array} node 
 * @param {any} options 
 * @returns 
 */
function prettify(node, options){
  return compress( node, options);
}

/**
 * 
 * @param {array} arr 
 * @param {object} options 
 * @param {string} jPath 
 * @returns object
 */
function compress(arr, options, jPath){
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if(jPath === undefined) newJpath = property;
    else newJpath = jPath + "." + property;

    if(property === options.textNodeName){
      if(text === undefined) text = tagObj[property];
      else text += "" + tagObj[property];
    }else if(property === undefined){
      continue;
    }else if(tagObj[property]){
      
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);

      if(tagObj[":@"]){
        assignAttributes( val, tagObj[":@"], newJpath, options);
      }else if(Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode){
        val = val[options.textNodeName];
      }else if(Object.keys(val).length === 0){
        if(options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }

      if(compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if(!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [ compressedObj[property] ];
        }
        compressedObj[property].push(val);
      }else{
        //TODO: if a node is not an array, then check if it should be an array
        //also determine if it is a leaf node
        if (options.isArray(property, newJpath, isLeaf )) {
          compressedObj[property] = [val];
        }else{
          compressedObj[property] = val;
        }
      }
    }
    
  }
  // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
  if(typeof text === "string"){
    if(text.length > 0) compressedObj[options.textNodeName] = text;
  }else if(text !== undefined) compressedObj[options.textNodeName] = text;
  return compressedObj;
}

function propName(obj){
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if(key !== ":@") return key;
  }
}

function assignAttributes(obj, attrMap, jpath, options){
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [ attrMap[atrrName] ];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}

function isLeafTag(obj, options){
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  
  if (propCount === 0) {
    return true;
  }

  if (
    propCount === 1 &&
    (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)
  ) {
    return true;
  }

  return false;
}
exports.prettify = prettify;


/***/ }),
/* 118 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

//parse Empty Node as self closing node
const buildFromOrderedJs = __webpack_require__(119);

const defaultOptions = {
  attributeNamePrefix: '@_',
  attributesGroupName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  cdataPropName: false,
  format: false,
  indentBy: '  ',
  suppressEmptyNode: false,
  suppressUnpairedNode: true,
  suppressBooleanAttributes: true,
  tagValueProcessor: function(key, a) {
    return a;
  },
  attributeValueProcessor: function(attrName, a) {
    return a;
  },
  preserveOrder: false,
  commentPropName: false,
  unpairedTags: [],
  entities: [
    { regex: new RegExp("&", "g"), val: "&amp;" },//it must be on top
    { regex: new RegExp(">", "g"), val: "&gt;" },
    { regex: new RegExp("<", "g"), val: "&lt;" },
    { regex: new RegExp("\'", "g"), val: "&apos;" },
    { regex: new RegExp("\"", "g"), val: "&quot;" }
  ],
  processEntities: true,
  stopNodes: [],
  // transformTagName: false,
  // transformAttributeName: false,
  oneListGroup: false
};

function Builder(options) {
  this.options = Object.assign({}, defaultOptions, options);
  if (this.options.ignoreAttributes || this.options.attributesGroupName) {
    this.isAttribute = function(/*a*/) {
      return false;
    };
  } else {
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }

  this.processTextOrObjNode = processTextOrObjNode

  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = '>\n';
    this.newLine = '\n';
  } else {
    this.indentate = function() {
      return '';
    };
    this.tagEndChar = '>';
    this.newLine = '';
  }
}

Builder.prototype.build = function(jObj) {
  if(this.options.preserveOrder){
    return buildFromOrderedJs(jObj, this.options);
  }else {
    if(Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1){
      jObj = {
        [this.options.arrayNodeName] : jObj
      }
    }
    return this.j2x(jObj, 0).val;
  }
};

Builder.prototype.j2x = function(jObj, level) {
  let attrStr = '';
  let val = '';
  for (let key in jObj) {
    if(!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
    if (typeof jObj[key] === 'undefined') {
      // supress undefined node only if it is not an attribute
      if (this.isAttribute(key)) {
        val += '';
      }
    } else if (jObj[key] === null) {
      // null attribute should be ignored by the attribute list, but should not cause the tag closing
      if (this.isAttribute(key)) {
        val += '';
      } else if (key[0] === '?') {
        val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
      } else {
        val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
      }
      // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextValNode(jObj[key], key, '', level);
    } else if (typeof jObj[key] !== 'object') {
      //premitive type
      const attr = this.isAttribute(key);
      if (attr) {
        attrStr += this.buildAttrPairStr(attr, '' + jObj[key]);
      }else {
        //tag value
        if (key === this.options.textNodeName) {
          let newval = this.options.tagValueProcessor(key, '' + jObj[key]);
          val += this.replaceEntitiesValue(newval);
        } else {
          val += this.buildTextValNode(jObj[key], key, '', level);
        }
      }
    } else if (Array.isArray(jObj[key])) {
      //repeated nodes
      const arrLen = jObj[key].length;
      let listTagVal = "";
      for (let j = 0; j < arrLen; j++) {
        const item = jObj[key][j];
        if (typeof item === 'undefined') {
          // supress undefined node
        } else if (item === null) {
          if(key[0] === "?") val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
          else val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
        } else if (typeof item === 'object') {
          if(this.options.oneListGroup ){
            listTagVal += this.j2x(item, level + 1).val;
          }else{
            listTagVal += this.processTextOrObjNode(item, key, level)
          }
        } else {
          listTagVal += this.buildTextValNode(item, key, '', level);
        }
      }
      if(this.options.oneListGroup){
        listTagVal = this.buildObjectNode(listTagVal, key, '', level);
      }
      val += listTagVal;
    } else {
      //nested node
      if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
        const Ks = Object.keys(jObj[key]);
        const L = Ks.length;
        for (let j = 0; j < L; j++) {
          attrStr += this.buildAttrPairStr(Ks[j], '' + jObj[key][Ks[j]]);
        }
      } else {
        val += this.processTextOrObjNode(jObj[key], key, level)
      }
    }
  }
  return {attrStr: attrStr, val: val};
};

Builder.prototype.buildAttrPairStr = function(attrName, val){
  val = this.options.attributeValueProcessor(attrName, '' + val);
  val = this.replaceEntitiesValue(val);
  if (this.options.suppressBooleanAttributes && val === "true") {
    return ' ' + attrName;
  } else return ' ' + attrName + '="' + val + '"';
}

function processTextOrObjNode (object, key, level) {
  const result = this.j2x(object, level + 1);
  if (object[this.options.textNodeName] !== undefined && Object.keys(object).length === 1) {
    return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
  } else {
    return this.buildObjectNode(result.val, key, result.attrStr, level);
  }
}

Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
  if(val === ""){
    if(key[0] === "?") return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar;
    else {
      return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
    }
  }else{

    let tagEndExp = '</' + key + this.tagEndChar;
    let piClosingChar = "";
    
    if(key[0] === "?") {
      piClosingChar = "?";
      tagEndExp = "";
    }
  
    // attrStr is an empty string in case the attribute came as undefined or null
    if ((attrStr || attrStr === '') && val.indexOf('<') === -1) {
      return ( this.indentate(level) + '<' +  key + attrStr + piClosingChar + '>' + val + tagEndExp );
    } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
      return this.indentate(level) + `<!--${val}-->` + this.newLine;
    }else {
      return (
        this.indentate(level) + '<' + key + attrStr + piClosingChar + this.tagEndChar +
        val +
        this.indentate(level) + tagEndExp    );
    }
  }
}

Builder.prototype.closeTag = function(key){
  let closeTag = "";
  if(this.options.unpairedTags.indexOf(key) !== -1){ //unpaired
    if(!this.options.suppressUnpairedNode) closeTag = "/"
  }else if(this.options.suppressEmptyNode){ //empty
    closeTag = "/";
  }else{
    closeTag = `></${key}`
  }
  return closeTag;
}

function buildEmptyObjNode(val, key, attrStr, level) {
  if (val !== '') {
    return this.buildObjectNode(val, key, attrStr, level);
  } else {
    if(key[0] === "?") return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar;
    else {
      return  this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
      // return this.buildTagStr(level,key, attrStr);
    }
  }
}

Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
  if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
    return this.indentate(level) + `<![CDATA[${val}]]>` +  this.newLine;
  }else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
    return this.indentate(level) + `<!--${val}-->` +  this.newLine;
  }else if(key[0] === "?") {//PI tag
    return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar; 
  }else{
    let textValue = this.options.tagValueProcessor(key, val);
    textValue = this.replaceEntitiesValue(textValue);
  
    if( textValue === ''){
      return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
    }else{
      return this.indentate(level) + '<' + key + attrStr + '>' +
         textValue +
        '</' + key + this.tagEndChar;
    }
  }
}

Builder.prototype.replaceEntitiesValue = function(textValue){
  if(textValue && textValue.length > 0 && this.options.processEntities){
    for (let i=0; i<this.options.entities.length; i++) {
      const entity = this.options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
}

function indentate(level) {
  return this.options.indentBy.repeat(level);
}

function isAttribute(name /*, options*/) {
  if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}

module.exports = Builder;


/***/ }),
/* 119 */
/***/ ((module) => {

const EOL = "\n";

/**
 * 
 * @param {array} jArray 
 * @param {any} options 
 * @returns 
 */
function toXml(jArray, options) {
    let indentation = "";
    if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
    }
    return arrToStr(jArray, options, "", indentation);
}

function arrToStr(arr, options, jPath, indentation) {
    let xmlStr = "";
    let isPreviousElementTag = false;

    for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if(tagName === undefined) continue;

        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName
        else newJPath = `${jPath}.${tagName}`;

        if (tagName === options.textNodeName) {
            let tagText = tagObj[tagName];
            if (!isStopNode(newJPath, options)) {
                tagText = options.tagValueProcessor(tagName, tagText);
                tagText = replaceEntitiesValue(tagText, options);
            }
            if (isPreviousElementTag) {
                xmlStr += indentation;
            }
            xmlStr += tagText;
            isPreviousElementTag = false;
            continue;
        } else if (tagName === options.cdataPropName) {
            if (isPreviousElementTag) {
                xmlStr += indentation;
            }
            xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
            isPreviousElementTag = false;
            continue;
        } else if (tagName === options.commentPropName) {
            xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
            isPreviousElementTag = true;
            continue;
        } else if (tagName[0] === "?") {
            const attStr = attr_to_str(tagObj[":@"], options);
            const tempInd = tagName === "?xml" ? "" : indentation;
            let piTextNodeName = tagObj[tagName][0][options.textNodeName];
            piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : ""; //remove extra spacing
            xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr}?>`;
            isPreviousElementTag = true;
            continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
            newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
            if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
            else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
            xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
            xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
            xmlStr += tagStart + ">";
            if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
                xmlStr += indentation + options.indentBy + tagValue + indentation;
            } else {
                xmlStr += tagValue;
            }
            xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
    }

    return xmlStr;
}

function propName(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if(!obj.hasOwnProperty(key)) continue;
        if (key !== ":@") return key;
    }
}

function attr_to_str(attrMap, options) {
    let attrStr = "";
    if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
            if(!attrMap.hasOwnProperty(attr)) continue;
            let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
            attrVal = replaceEntitiesValue(attrVal, options);
            if (attrVal === true && options.suppressBooleanAttributes) {
                attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
            } else {
                attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
            }
        }
    }
    return attrStr;
}

function isStopNode(jPath, options) {
    jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
    let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
    for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
    }
    return false;
}

function replaceEntitiesValue(textValue, options) {
    if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
            const entity = options.entities[i];
            textValue = textValue.replace(entity.regex, entity.val);
        }
    }
    return textValue;
}
module.exports = toXml;


/***/ }),
/* 120 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SCRIPT = exports.SYS_CLASS_NAME = exports.SYS_ID = void 0;
exports.SYS_ID = 'sys_id';
exports.SYS_CLASS_NAME = 'sys_class_name';
exports.SCRIPT = 'script';


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map