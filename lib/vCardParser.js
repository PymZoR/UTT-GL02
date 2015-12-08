'use strict';

/**
 * Constants
 */

var KEYWORDS = ['BEGIN', 'VERSION', 'N', 'FN', 'ORG', 'TITLE', 'TEL', 'EMAIL', 'REV',
    'END'];
var PARAMS   = ['TYPE', 'VALUE'];

var User  = require('./user.js');
var VCard = require('./vCard.js');

var VERSION = VCard.VERSION;

/**
 * vCard Parser constructor
 * @param {String} data vCard data
 */
function VCardParser (data) {
    if (!data) {
        return;
    }

    this.setData(data);
}


/**
 * Parse VCardParser.data
 * @return {Object} Instance of VCard
 */
VCardParser.prototype.parse = function () {
    // Word and values expected on next line
    var expectedWord  = 'BEGIN';
    var expectedValue = 'VCARD';

    var vCard       = new VCard(VERSION);
    var currentUser = {};

    var self = this;
    this.data
        .forEach(function (line, i) {
            line = line.split(':');

            // A line must be composed by a word and a value, separated by `:`
            if (line.length < 2) {
                throw new Error('Invalid line ' + (i+1));
            }

            var word  = line[0];
            var value = line.slice(1).join(':');

            // A word was expected
            if ((expectedWord !== '') && (word !== expectedWord)) {
                throw new Error('Expected word ' + expectedWord + ' but got ' + word +
                                ' instead on line ' + (i+1));
            }

            // A value was expected
            if ((expectedValue !== '') && (value !== expectedValue)) {
                throw new Error('Expected value ' + expectedValue + ' but got ' + value +
                                ' instead on line ' + (i+1));
            }

            var values;

            // Word analysis
            switch (word) {
                case 'BEGIN': {
                    expectedWord  = 'VERSION';
                    expectedValue = '4.0';
                    break;
                }

                case 'VERSION': {
                    expectedWord  = 'N';
                    expectedValue = '';
                    break;
                }

                case 'N': {
                    values  = value.split(';');
                    currentUser = new User({
                        firstName: values[1],
                        lastName: values[0]
                    });

                    expectedWord  = 'FN';
                    expectedValue = '';
                    break;
                }

                case 'FN': {
                    // Deduced by firstname and lastname; useless
                    expectedWord  = '';
                    expectedValue = '';
                    break;
                }

                case 'ORG': {
                    currentUser.organisation = value;

                    expectedWord  = '';
                    expectedValue = '';
                    break;
                }

                case 'TITLE': {
                    currentUser.title = value;

                    expectedWord  = '';
                    expectedValue = '';
                    break;
                }

                case 'EMAIL': {
                    currentUser.email = value;

                    expectedWord  = '';
                    expectedValue = '';
                    break;
                }

                case 'REV': {
                    values = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);

                    if (values) {
                        vCard.revision = new Date(values[1], values[2], values[3], values[4], values[5], values[6]);
                    }

                    expectedWord  = 'END';
                    expectedValue = 'VCARD';
                    break;
                }

                case 'END': {
                    vCard.user = currentUser;

                    return;
                }

                default: {
                    var params = word.split(';');

                    if (params.length < 2) {
                        throw new Error('Unknown word ' + word + ' on line ' + (i+1));
                    }

                    word   = params[0];
                    params = params.slice(1);

                    switch (word) {
                        case 'TEL': {
                            var tel = {};

                            params.forEach(function (param) {
                                param = param.split('=');

                                if ((param.length < 2) || (PARAMS.indexOf(param[0]) === -1)) {
                                    throw new Error('Unknown param ' + param[0] + ' on line ' + (i+1));
                                }

                                tel[param[0]] = param[1];
                            });

                            tel.value = value;
                            currentUser.tel.push(tel);
                            break;
                        }

                        default: {
                            throw new Error('Unknown word ' + word + ' on line ' + (i+1));
                        }
                    }

                    expectedWord  = '';
                    expectedValue = '';
                }
            }

            if (i === (self.data.length-3)) {
                expectedWord  = 'REV';
                expectedValue = '';
            }
        });

    return vCard.toUser();
};


/**
 * Set parser data
 */
VCardParser.prototype.setData = function (data) {
    this.data = data
        .split('\n')
        .filter(function (line) {
            return (line !== '');
        });
};


module.exports = VCardParser;
