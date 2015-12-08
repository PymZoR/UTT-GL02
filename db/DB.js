'use strict';

var Promise = require('bluebird');
var fs      = Promise.promisifyAll(require('fs'));
var os      = require('os');

/**
 * Creates a new DB object
 * @param {String} [path] The path to a json file to make a file-based database
 */
function DB (path) {
    this._path = path;

    if (typeof path !== 'undefined' && typeof path !== 'string') {
        throw new Error('Invalid path type. Must be string or undefined.');
    }

    if (typeof path === 'undefined') {
        this._path = null;
    }

    this._db  = {};

    this._isOpen = false;
}

/**
 * Opens the database
 * @return {Promise} Resolves when the database is opened
 */
DB.prototype.open = function () {
    var self = this;

    // In-memory database
    if (!this._path) {
        return new Promise(function (resolve) {
            self._isOpen = true;
            resolve();
        });
    }

    // File based database but file does not exist yet
    if (!fs.existsSync(this._path)) {
        return new Promise(function (resolve) {
            self._db = {};
            self._isOpen = true;
            resolve();
        });
    }

    // File based database with existing database
    return fs
        .readFileAsync(this._path, 'utf8')
        .then(function (content) {
            return Promise.resolve(JSON.parse(content));
        })
        .then(function (db) {
            self._db = db;
            self._isOpen = true;
        })
        .catch(function (err) {
            throw err;
        });
};

/**
 * Saves the database to the file or in the memory
 * @return {Promise} Resolves when the database is saved
 */
DB.prototype.save = function () {
    if (!this._isOpen) {
        throw new Error('DB is not opened.');
    }

    if (!this._path) {
        return new Promise(function (resolve) {
            resolve();
        });
    }

    return fs.writeFileAsync(this._path, JSON.stringify(this._db, null, 4) + os.EOL);
};

/**
 * Opens a table on the database
 * @param  {String} tableName The table name. If the table doesn't exist, the table is initialized to []
 * @return {Array}            The table
 */
DB.prototype.table = function (tableName) {
    if (!this._isOpen) {
        throw new Error('DB is not opened.');
    }

    if (!this._db.hasOwnProperty(tableName)) {
        this._db[tableName] = [];
    }

    return this._db[tableName];
};

/**
 * Gets the raw database
 * @return {Object} The database
 */
DB.prototype.raw = function () {
    return this._db;
};

module.exports = DB;
