/**
 * SCN_3
 * Import multiple users from multiple vCards, with redundancies. The merge/choose one/choose both
 * options are chosen. Export to CSV the database.
 */

'use strict';

var DB      = require('../../db');
var assert  = require('assert');
var Promise = require('bluebird');
var fs      = Promise.promisifyAll(require('fs'));
var lib     = require('../../lib');
var csvdata = require('csvdata');

describe('SCN_3', function () {
    var db = new DB('test/scenario/db.json');
    var ul = new lib.UserList();
    var user1;
    var user2;

    before(function (done) {
        db
            .open()
            .then(function () {
                done();
            });
    });

    it('should import a user list from multiple vCards into databse', function (done) {
        fs.readFileAsync('./test/testCard.vCard', 'utf-8')
            .then(function (data) {
                user1 = new lib.VCardParser(data).parse();
                return fs.readFileAsync('./test/testCard2.vCard', 'utf-8');
            })
            .then(function (data) {
                user2 = new lib.VCardParser(data).parse();
            })
            .then(function (user) {
                var dble = false;
                ul.add(user1);
                ul.add(user2);

                if (ul.verify(user1)) {
                    ul.merge(user1, lib.User.CHOOSE_A);
                    dble = true;
                }
                else if (ul.verify(user2)) {
                    ul.merge(user2, lib.User.CHOOSE_B);
                    dble = true;
                }

                for(var i = 0; i < ul.length(); i++) {
                    db.table('users').push(ul.users[i]);
                }

                for(var j = 0; j < ul.length(); j++) {
                    assert.equal(JSON.stringify(db.table('users')[j]), JSON.stringify(ul.users[j]));
                }

                return db.save();
            })
            .then(function () {
                done();
            })
    });


    it('should have all the users in the database', function (done) {
        db
            .open()
            .then(function () {
                assert.equal(JSON.stringify(db.table('users')[0]), JSON.stringify(user1));
                assert.equal(JSON.stringify(db.table('users')[1]), JSON.stringify(user2));
                done();
            });
    });

    it('should have succeeded the merge/choose one/choose both', function (done) {
        // Same test than above, the first was CHOOSE_A and the second one was CHOOSE_B
        db
            .open()
            .then(function () {
                assert.equal(db.table('users').organization, user1.organization);
                assert.equal(db.table('users').organization, user2.organization);
                done();
            });
    });

    it('should export the database into a CSV file', function (done) {
        fs
            .writeFileAsync('test/scenario/output.csv', ul.toCSV())
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
