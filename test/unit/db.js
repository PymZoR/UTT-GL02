'use strict';

var assert = require('assert');
var DB     = require('../../db');

describe('DB', function () {
    describe('#new(String path)', function () {
        it('should create a memory-only db', function () {
            var db = new DB();

            assert.deepEqual(db._db, {});
            assert.strictEqual(null, db._path);
        });

        it('should create a json-based db', function () {
            var db = new DB('db.json');

            assert.deepEqual(db._db, {});
            assert.equal('db.json', db._path);
        });

        it('should throw if a wrong path is passed', function () {
            assert.throws(function () {
                new DB(false);
            }, Error);
        });
    });

    describe('#open()', function () {
        it('should open a memory-only db', function (done) {
            var db = new DB();

            db.open().then(function () {
                done();
            });
        });

        it('should open a file-based db', function (done) {
            var db = new DB('db.json');

            db.open().then(function () {
                done();
            });
        });

        it('should re-open a file-based db', function (done) {
            var db = new DB('test/testdb.json');

            db
                .open()
                .then(function () {
                    db._db = { foo: 'bar' };

                    return db.save();
                })
                .then(function () {
                    assert.deepEqual({ foo: 'bar' }, db._db);
                    done();
                });
        });
    });

    describe('#save()', function () {
        it('should save to the json file', function (done) {
            var db  = new DB('test/testdb.json');
            var db_ = new DB('test/testdb.json');

            db
                .open()
                .then(function () {
                    // Resets the db
                    db._db = {};

                    return db.save();
                })
                .then(function () {
                    // Inserts batch data
                    db._db = { foo: 'bar' };

                    return db.save();
                })
                .then(function () {
                    // Open with another handler

                    return db_.open();
                })
                .then(function () {
                    assert.deepEqual({ foo: 'bar' }, db_._db);
                    done();
                });
        });

        it('should save in-memory db', function (done) {
            var db = new DB();

            db
                .open()
                .then(function () {
                    db._db = { foo: 'bar' };

                    return db.save();
                })
                .then(function () {
                    assert.deepEqual({ foo: 'bar' }, db._db);
                    done();
                });
        });
    });

    describe('#table(String tableName)', function () {
        it('should create a table if the table does not exists', function (done) {
            var db = new DB();

            db
                .open()
                .then(function () {
                    db.table('foo');

                    assert.deepEqual({ foo: [] }, db._db);

                    done();
                });
        });

        it('should push some values', function (done) {
            var db = new DB();

            db
                .open()
                .then(function () {
                    db.table('foo').push({ item: 'value' });

                    assert.deepEqual({ foo: [ { item: 'value' } ] }, db._db);

                    done();
                });
        });
    });

    describe('#raw()', function () {
        it('should get the raw data', function (done) {
            var db = new DB();

            db
                .open()
                .then(function () {
                    db.table('foo');

                    assert.deepEqual({ foo: [] }, db.raw());

                    done();
                });
        });

        it('should set from the raw data', function (done) {
            var db  = new DB();

            db
                .open()
                .then(function () {
                    db.table('foo');

                    db.raw().foo.push({ item: 'value' });

                    return db.save();
                })
                .then(function () {
                    assert.deepEqual({ foo: [ { item: 'value' } ] }, db.raw());

                    done();
                });
        });
    });
});
