'use strict';

var User    = require('./user.js');
var os      = require('os');
var clone   = require('clone');

/**
 * UserList constructor
 */
function UserList () {
    this.users = [];
}

/**
 * Retrieve UserList from database
 * @param  {DB} db The database
 * @return {Promise} Resolve when the db is loaded to the UserList
 */
UserList.fromDB = function (db) {
    var ul = new UserList();

    return db
        .open()
        .then(function () {
            ul.users = db
                .table('users')
                .slice()
                .map(function (user_) {
                    var user = new User();

                    user.firstName    = user_.firstName;
                    user.lastName     = user_.lastName;
                    user.organisation = user_.organisation;
                    user.title        = user_.title;
                    user.email        = user_.email;
                    user.revision     = user_.revision;
                    user.tel          = user_.tel;

                    return user;
                });

            return ul;
        });
};

/**
 * Create an UserList ith an user
 * @param  {User} user The initial user
 * @return {UserList} A UserList
 */
UserList.cons = function (user) {
    var list = new UserList();

    if (!(user instanceof User)) throw new ReferenceError('user is not a User');

    list.users.push(user);

    return list;
};

/**
 * Get the lenght of the UserList
 * @return {Number} The length of the list
 */
UserList.prototype.length = function () {
    return this.users.length;
};

/**
 * Add an user into the UserList
 * @param {User} user The user to add
 */
UserList.prototype.add = function (user) {
    this.users.push(user);
};

/**
 * Remove an user from the UserList
 * @param {Number} index The user index to remove
 */
UserList.prototype.remove = function (index) {
    if(index === -1) throw new ReferenceError('user not in the list');

    this.users.splice(index, 1);
};

/**
 * Test for doubloons
 * @param  {User} user Check doubloons with this user
 * @return {Boolean} True if user is already in the list, false otherwise
 */
UserList.prototype.verify = function (user) {
    var occurences = 0;

    this.users.forEach(function (auxUser) {
        if (user.isEquals(auxUser)) occurences++;
    });

    return occurences > 0;
};

/**
 * Sort the UserList
 * @param  {Function} fct Optional. Comparison function
 * @return {User[]} The sorted user list
 */
UserList.prototype.sort = function (fct) {
    this.users = this.users.sort(fct);
};

/**
 * Find indexes for an user, return -1 if there is any occurence
 * @param  {User} userToFind The user to find
 * @return {Number[]} The indexes
 */
UserList.prototype.findIndexesUser = function (userToFind) {
    var indexes = [];
    var ind     = -1;

    for (var i = 0; i < this.length(); i++){
         if (this.users[i].isEquals(userToFind)) indexes.push(i);
    }
    return indexes;
};

/**
 * Merge all doubloons for an user
 * @param  {User}   user   The user to merge with
 * @param  {Number} action Merge all contacts
 * @return {UserList} Return itself
 */
UserList.prototype.merge = function (user, action) {
    var self = this;

    if (this.verify(user)) {
        var indexes  = this.findIndexesUser(user);
        var toRemove = indexes.slice(1, indexes.length);

        while (indexes.length > 1) {
            // result is either User or UserList
            var result = self.users[indexes[0]].merge(self.users[indexes[1]], action);
            if (result instanceof User) {
                // If result is User, replace (A B or merge)
                self.users[indexes[0]] = result;
            } else {
                // If result is UserList, insert
                self.users.splice(indexes[0] + 1, 0, result.users[1]);
            }

            indexes.splice(1,1);
        }

        for (var i = 0; i < toRemove.length; i++) {
            self.remove(toRemove[i] - i);
        }
        return this;
    }
    else {
        throw Error('user is singleton');
    }
};

/**
 * Export the list to CSV
 * @param  {String} separator Optional. The separator to use (default ;)
 * @return {String} The CSV result as a string
 */
UserList.prototype.toCSV = function (separator) {
    if (typeof separator !== 'string') separator = ';';

    return this.users
        .map(function (user_) {
            var user = clone(user_);

            user.tel = user.tel
                .map(function (tel) {
                    return tel.value;
                })
                .join(separator);

            var userValues = Object.keys(user).map(function (key) {
                return user[key];
            });

            return userValues.join(separator);
        })
        .join(separator + os.EOL);
};

module.exports = UserList;
