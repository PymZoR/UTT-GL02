/**
 * SCN_1
 * Import of a single user in an empty database. Export to CSV the database.
 */

'use strict';

var assert  = require('assert');
var Promise = require('bluebird');
var fs      = Promise.promisifyAll(require('fs'));
var lib     = require('../../lib/index.js');
var DB      = require('../../db');
var csvdata = require('csvdata');

describe('SCN_1', function () {
    var db = new DB('test/scenario/db.json');
    var user;

    before(function (done) {
        db
            .open()
            .then(function () {
                done();
            });
    });

    it('should import the user in an empty database', function (done) {
        fs.readFileAsync('test/scenario/user1.vCard', 'utf-8')
            .then(function (data) {
                return (new lib.VCardParser(data)).parse();
            })
            .then(function (user_) {
                user = user_
                db.table('users').push(user);

                return db.save();
            })
            .then(function () {
                done();
            })
            .catch(function (err) {
                assert.equal(err, null);
                done();
            });
    });

    it('should have the new user in the database', function (done) {
        db.open()
            .then(function () {
                assert.equal(JSON.stringify(db.table('users')[0]), JSON.stringify(user));
                done();
            });
    });

    it('should export the database into a CSV file', function (done) {
        var userList = new lib.UserList();
        userList.add(user);

        fs
            .writeFileAsync('test/scenario/output.csv', userList.toCSV())
            .then(function () {
                done();
            })
            .catch(function (err) {
                assert.equal(err, undefined);
                done();
            });
    });

    it('should have a valid CSV file', function (done) {
        csvdata
            .check('test/scenario/output.csv', {log: false})
            .then(function (result) {
                assert.equal(result, true);
                done();
            })
            .catch(function (err) {
                assert.equal(err, undefined);
                done();
            });
    });

    after(function (done) {
        fs
            .unlinkAsync('test/scenario/db.json')
            .then(function () {
                done();
            });
    });
});
