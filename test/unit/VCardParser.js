'use strict';

var assert      = require('assert');
var Promise     = require('bluebird');
var fs          = Promise.promisifyAll(require('fs'));
var VCardParser = require('../../lib/vCardParser.js');
var User        = require('../../lib/user.js');
var VCard       = require('../../lib/vCard.js');

describe('vCardParser', function () {
    describe('VCard', function () {
        describe('#new(Number version, User user)', function () {
            it('should create a vCard', function () {
                new VCard(VCard.VERSION, new User());
            });

            it('should throw a version Error', function () {
                assert.throws(function () {
                    new VCard('3.0');
                }, 'opts.version must be ' + VCard.VERSION);
            });

            it('should throw a typeError', function () {
                assert.throws(function() {
                    new VCard(VCard.VERSION, 'test');
                }, TypeError);
            });
        });

        describe('#isOlderThan(VCard vcard)', function () {
            it('should compare two vcards', function () {
                var v1 = new VCard(VCard.VERSION, new User());
                v1.revision = new Date();
                var v2 = new VCard(VCard.VERSION, new User());
                v2.revision = new Date(Date.now() + 1000 * 60 * 60);

                assert.equal(true, v2.isOlderThan(v1));
            });
        });
    });

    describe('VCardParser', function () {
        describe('#parse()', function () {
            it('should parse a vCard v4', function (done) {
                fs
                    .readFileAsync('./test/testCard.vCard', 'utf-8')
                    .then(function (data) {
                        var parser = new VCardParser(data);
                        var vCard = parser.parse();
                        done();
                    })
                    .catch(function (err) {
                        assert.equal(err, "");
                        done();
                    });
            });
        });

        describe('#setData()', function () {
            it('should set data', function () {
                (new VCardParser()).setData('foo');
            });
        });
    });
});
