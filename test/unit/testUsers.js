'use strict'

var assert   = require('assert');
var User     = require('../../lib/user.js');
var UserList = require('../../lib/userList.js');

describe('User', function () {
    describe('#new(Object opts)', function () {
        it('should create a person', function () {
            new User({
                firstName: 'John',
                lastName: 'Doe'
            });
        });

        it('should throw TypeError', function () {
            assert.throws(function() {
                new User({
                    firstName: 'John',
                    lastName: 1234
                })
            }, TypeError);
        });
    });

    describe('#getFullName()', function () {
        it('should get the full name', function () {
            var u = new User({
                firstName: 'John',
                lastName: 'Doe'
            });

            assert.equal('John Doe', u.getFullName());
        });
    });

    describe('#merge(User user, Number action)', function () {
        var u1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            tel: [
                { value: 'a' },
                { value: 'b' }
            ]
        });

        var u2 = new User({
            firstName: 'John',
            lastName: 'Doe',
            tel: [
                { value: 'c' },
                { value: 'd' }
            ]
        });

        it('should get only A', function () {
            assert.deepEqual(u1, u1.merge(u2, User.ONLY_A));
        });

        it('should get only B', function () {
            assert.deepEqual(u2, u1.merge(u2, User.ONLY_B));
        });

        it('should merge', function () {
            var merged = u1.merge(u2, User.MERGE);

            assert.equal('John', merged.firstName);
            assert.equal('Doe', merged.lastName);
            assert.equal(4, merged.tel.length);
        });
    });

    describe('#isEquals(User user)', function () {
        it('should return true for two equal users', function () {
            var u1 = new User({
                firstName: 'John',
                lastName : 'Doe'
            });

            var u2 = new User({
                firstName: 'John',
                lastName : 'Doe'
            });

            assert.equal(true, u1.isEquals(u2));
        });
        it('should return false otherwise', function () {
            var u1 = new User({
                firstName: 'John',
                lastName : 'Doe'
            });

            var u2 = new User({
                firstName: 'John',
                lastName : 'Doxe'
            });

            assert.equal(false, u1.isEquals(u2));
        });
    });

    describe('#toJSON()', function () {
        it('should create a real object from a User instance', function () {
            var opts = { firstName: 'John',
                lastName: 'Doe',
                organisation: 'A',
                title: 'B',
                email: 'C@D.com',
                revision: new Date(),
                tel: [ { value: 'ok' } ]
            };

            var u = new User(opts);

            assert.deepEqual(opts, u.toJSON());
        });
    });
});

describe('UserList', function () {
    var u1 = new User({
                firstName: 'John',
                lastName: 'Doe'
            });
    var u2 = new User({
                firstName: 'Loic',
                lastName: 'Otm'
            });
    var u3 = new User({
                firstName: 'Mouss',
                lastName: 'ex'
            });

    describe('#new()', function () {
        it('should create an empty list', function () {
            var ul = new UserList();
            assert.deepEqual([], ul.users);
        });
    });

    describe('#cons(User user)', function () {
        it('should create a list with one initial user', function () {
            var ul = UserList.cons(u1);

            assert.deepEqual(u1, ul.users[0]);
        });

        it('should throw if no user is given', function () {
            assert.throws(function () {
                var ul = UserList.cons();
            });
        });
    });

    describe('#length()', function () {
        it('should get the list length', function () {
            var ul = UserList.cons(u1);

            assert.equal(1, ul.length());
        });
    });

    describe('#add(User user)', function () {
        it('should add an user', function () {
            var ul = new UserList();
            ul.add(u1);

            assert.deepEqual(u1, ul.users[0]);
        });
    });

    describe('#remove(Number index)', function () {
        it('should add an user', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.remove(0);
            assert.equal(0, ul.length());
        });
    });

    describe('#verify(User user)', function () {
        it('should find indexes of the same user', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.add(u1);

            assert.equal(true, ul.verify(u1));
        });

        it('should return false if the user is not in the list', function () {
            var ul = new UserList();
            assert.equal(false,ul.verify(u1));
        });
    });

    describe('#sort(Function cmp)', function () {
        it('should sort the user list with the given function', function () {
            var fct = function (a, b) {
                return a.getFullName().localeCompare(b.getFullName());
            };

            var ul = new UserList();
            var ul2 = new UserList();

            ul.add(u2);
            ul.add(u1);
            ul.add(u3);
            ul.sort(fct);

            ul2.add(u1);
            ul2.add(u2);
            ul2.add(u3);

            assert.deepEqual(ul,ul2);
        });
    });

    describe('#findIndexesUser(User user)', function () {
        it('should find all the indexes of the user', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.add(u1);

            assert.deepEqual(ul.findIndexesUser(u1),[0,1]);
        });

        it('should return an empty array if the user is not in the list', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.add(u1);
            assert.deepEqual(ul.findIndexesUser(u2),[]);
        });
    });

     describe('#merge(UserList userList, User user)', function () {
        it('should throw if the user is not in the list', function () {
           var ul = new UserList();
            ul.add(u1);
            ul.add(u1);

            assert.throws(function() {
                ul.merge(u2,0);
            }, Error);
        });

        it('should merge the user with the existents ones', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.add(u1);

            assert.equal((ul.merge(u1,0)).length(),1);
        });
    });

    describe('#toCSV(String separator)', function () {
        it('should export to a CSV string', function () {
            var ul = new UserList();
            ul.add(u1);
            ul.add(u2);
            ul.add(u3);

            var result = 'John;Doe;;;;;;\nLoic;Otm;;;;;;\nMouss;ex;;;;;';

            assert.equal(result, ul.toCSV());
        });
    });
});
