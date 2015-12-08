/**
 * SCN_4
 * Update a user
 */

'use strict';

var assert  = require('assert');
var Promise = require('bluebird');
var fs      = Promise.promisifyAll(require('fs'));
var lib     = require('../../lib');
var DB      = require('../../db');
var csvdata = require('csvdata');

describe('SCN_4', function () {
    var db = new DB('test/scenario/db.json');
    var userList = new lib.UserList();
    var user, userR;

    before(function (done) {
        db
            .open()
            .then(function () {
                done();
            });
    });

    it('should import a user', function (done) {
        fs
            .readFileAsync('test/scenario/user1.vCard', 'utf-8')
            .then(function (data) {
                return (new lib.VCardParser(data)).parse();
            })
            .then(function (user_) {
                user = user_;
                userList.add(user);
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
        db
            .open()
            .then(function () {
                assert.equal(JSON.stringify(db.table('users')[0]), JSON.stringify(user));
                done();
            });
    });

    it('should import a new user w/ different datas', function (done) {
        fs
            .readFileAsync('test/scenario/user1R.vCard', 'utf-8')
            .then(function (data) {
                return (new lib.VCardParser(data)).parse();
            })
            .then(function (user_) {
                userR = user_;
                userList.add(userR);
            })
            .then(function () {
                done();
            })
            .catch(function (err) {
                assert.equal(err, null);
                done();
            });
    });

    it('should choose update. The new revision must be newer than the old one', function () {
        userList = userList.merge(user, lib.User.MERGE);
        assert.equal(userList.length(), 1);
    });

    it('should export the database into a CSV file', function (done) {
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
