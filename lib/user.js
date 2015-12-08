'use strict';

/**
 * User constructor
 * @param {Object}        opts              user propreties
 *        {String}        opts.firstName    user's first name
 *        {String}        opts.lastName     user's last name
 *        {String}        opts.organisation user's organisation
 *        {String}        opts.title        user's title
 *        {Date}          opts.revision     user's revision
 *        {String}        opts.email        user's email
 *        {Object|String} opts.tel          user's phone(s) number(s)
 */
function User (opts) {
    this.firstName    = '';
    this.lastName     = '';
    this.organisation = '';
    this.title        = '';
    this.email        = '';
    this.revision     = '';
    this.tel          = [];

    if (!opts) {
        return;
    }

    // Types and values checking
    var self = this;
    Object.keys(opts)
        .forEach(function (key) {
            if (key !== 'firstName' && key !== 'lastName' && key !== 'organisation'
                && key !== 'title' && key !== 'email' && key !== 'tel' && key !== 'revision') {

                    throw new Error('Unknown opt: ' + key);
            }

            if (key == 'tel') {
                if (typeof opts.tel !== 'object' && typeof opts.tel !== 'string') {
                    throw new TypeError('opts.tel must either be a string or an array of strings');
                }

                self.tel = opts.tel;
            }
            else if (key === 'revision') {
                if (!(opts.revision instanceof Date)) {
                    throw new TypeError('opts.revision must be a Date');
                }

                self.revision = opts.revision;
            }
            else {
                if (typeof opts[key] !== 'string') {
                    throw new TypeError('opts.' + key + ' must be a string');
                }

                self[key] = opts[key];
            }
        });
}

User.ONLY_A = 0;
User.ONLY_B = 1;
User.MERGE  = 2;
User.BOTH   = 3;

/**
 * Get a person full name
 * @return {String} The user full name
 */
User.prototype.getFullName = function () {
    return this.firstName + ' ' + this.lastName;
};

/**
 * Merge 2 users (A/B)
 * @param  {User}   user   The other user to merge
 * @param  {Number} action The action to choose (User.ONLY_A, User.ONLY_B, User.MERGE or User.BOTH)
 * @return {User|UserList} This user, the other user, a merged user or both users
 */
User.prototype.merge = function (user, action) {
    var self = this;

    switch (action) {
        case User.ONLY_A: //Return A
            return this;
        case User.ONLY_B: //Return B
            return user;
        case User.MERGE: //Merge B into A - return A (just tel is mergeable)
            var newUser = new User();

            newUser.tel          = user.tel.slice(); // Clone the tel array
            newUser.firstName    = user.firstName;
            newUser.lastName     = user.lastName;
            newUser.organisation = user.organisation;
            newUser.title        = user.title;
            newUser.email        = user.email;

            this.tel.forEach(function (selfTel) {
                var present = false;

                newUser.tel.forEach(function (newUserTel) {
                    if (newUserTel.value === selfTel.value) {
                        present = true;
                    }
                });

                if (!present) {
                    newUser.tel.push(selfTel);
                }
            });

            newUser.revision = new Date();

            return newUser;
        case User.BOTH: //Add both users into an UserList - return UserList
            var UserList = require('./userList.js');
            var list = UserList.cons(this);
            list.add(user);

            return list;
    }
};

/**
 * Test is equal with user
 * @param  {User} user The other user
 * @return {Boolean} True if both users are the same person
 */
User.prototype.isEquals = function (user) {
    return user.firstName === this.firstName && user.lastName === this.lastName;
};

/**
 * User to classic object
 * @return {Object} The classic object
 */
User.prototype.toJSON = function () {
    return {
        firstName   : this.firstName,
        lastName    : this.lastName,
        organisation: this.organisation,
        title       : this.title,
        email       : this.email,
        revision    : this.revision,
        tel         : this.tel
    };
};

module.exports = User;
