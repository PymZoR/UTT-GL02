'use strict';

var VERSION = '4.0';
var User    = require('./user.js');

/**
 * Constructor
 * @param {string} version vCard standard version
 * @param {object} users User to add
 */
function VCard (version, user) {
    this.version  = '';
    this.revision = 0;
    this.user     = null;

    // Types and values checking
    if (version !== VERSION) {
        throw new Error('opts.version must be 4.0');
    }
    this.version = version;

    if (user instanceof User) {
        this.user = user;
    }
    else if (typeof user === 'undefined') {
        // Default arg
        return;
    }
    else {
        throw new TypeError('users must be either an array of User or a User');
    }
}

VCard.VERSION = VERSION;

/**
 * Test if a contact (VCard) is older than another
 */
VCard.prototype.isOlderThan = function(vcard) {
    return this.revision > vcard.revision;
};

/**
 * Return a user from the vCard. Set the revision.
 */
VCard.prototype.toUser = function () {
    this.user.revision = this.revision;
    return this.user;
};

module.exports = VCard;
