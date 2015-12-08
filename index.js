'use strict';

var inquirer    = require('inquirer');
var Promise     = require('bluebird');
var fs          = Promise.promisifyAll(require('fs'));
var DB          = require('./db');
var User        = require('./lib/user.js');
var UserList    = require('./lib/userList.js');
var VCardParser = require('./lib/vCardParser.js');

var db = new DB('users.json');

// Disable app when running from QUnit
if (module.parent) {
    return;
}

console.log('Bienvenue dans l\'interface de simulation d\'utilisation du logiciel de gestion de conacts de ClearWater.');

var question = {
    type: 'list',
    name: 'main',
    message: 'Que souhaitez vous faire ?',
    choices: [
                { name: 'Transmettre mes contacts au serveur', value: 't'},
                { name: 'Exporter les contacts au format csv', value: 'e'},
            ]
};

/**
 * Save the db after choosing action
 * @param {DB} db The DB instance
 * @param {UserList} ul The UserList instance
 */
function saveUL (db, ul) {
    db.raw().users = [];

    ul.users.forEach(function (user) {
        db.table('users').push(user.toJSON());
    });

    db.save();

    console.log('Enregistré dans users.json');
}

inquirer.prompt(question, function (answer) {
    var questions;

    // Export to csv
    if (answer.main == 'e') {
        questions = [
            {
                type: 'list',
                name: 'order',
                message: 'Comment voullez vous trier le fichier CSV ?',
                choices: [
                    { name: 'Par nom', value: 't'},
                    { name: 'Par prénom', value: 'e'},
                    { name: 'Par organisation', value: 'o'},
                ]
            },
            {
                type: 'list',
                name: 'ascending',
                message: 'Trier de façon',
                choices: [
                    { name: 'Alphabétique', value: 'y'},
                    { name: 'Anti-alphabétique', value: 'n'},
                ]
            },
            {
                type: 'input',
                name: 'path',
                message: 'Nom du fichier',
                default: 'out.csv'
            }
        ];
        inquirer.prompt(questions, function (answer) {
            UserList
                .fromDB(db)
                .then(function (ul) {
                    ul.sort(function (a, b) {
                        if (answer.order === 't') {
                            if (answer.ascending === 'y') {
                                return a.lastName.localeCompare(b.lastName);
                            } else {
                                return b.lastName.localeCompare(a.lastName);
                            }
                        }
                        else if (answer.order === 'e') {
                            if (answer.ascending === 'y') {
                                return a.firstName.localeCompare(b.firstName);
                            } else {
                                return b.firstName.localeCompare(a.firstName);
                            }
                        }
                        else if (answer.order === 'o') {
                            if (answer.ascending === 'y') {
                                return a.organisation.localeCompare(b.organisation);
                            } else {
                                return b.organisation.localeCompare(a.organisation);
                            }
                        }
                    });

                    return ul.toCSV();
                })
                .then(function (csv) {
                    return fs.writeFileAsync(answer.path, csv);
                });
        });
    }
    // Treansmit contacts to server
    else
    {
        console.log('Lors d\'une utilsiation réel de cette bibliothèque les deux questions suivantes ' +
                    'n\'existerons pas car les réponses sont donnés automatiqument par le smartphone');
        console.log('Vous êtes donc un commercial qui veut envoyer ses contacts sur le serveur.');

        // TODO add default values for both questions
        questions = [
            {
                type    : 'input',
                name    : 'name',
                message : 'Quel est votre nom ?',
                default : 'John Doe',
                validate: function (value) {
                    var pass = value.match(/^[\w ]+$/i);
                    if (pass) {
                        return true;
                    }
                    else {
                        return 'Merci d\'enter un nom de commercial valide';
                    }
                }
            },
            {
                type   : 'input',
                name   : 'file',
                message: 'Veuillez entrer le chemin vers le fichier vcard à importer',
                default: 'test/testCard.vCard'
            }
        ];

        inquirer.prompt(questions, function (answer) {
            var ul;

            UserList
                .fromDB(db)
                .then(function (ul_) {
                    ul = ul_;

                    return fs.readFileAsync(answer.file, 'utf8');
                })
                .then(function (vcard) {
                    var parser = new VCardParser(vcard);
                    var user   = parser.parse();

                    if (ul.verify(user)) {
                        var indexes       = ul.findIndexesUser(user);
                        var toComapreWith = ul.users[indexes[0]];

                        console.log('L\'utilisateur est déjà dans la base.\nVersion A (en base, datée du ' + toComapreWith.revision + ') : \n' +
                                    require('util').inspect(toComapreWith.toJSON()) + '\n\nVersion B (en ajout, datée du ' + user.revision + ') : \n' +
                                    require('util').inspect(user.toJSON()));
                        questions = [
                            {
                                type   : 'list',
                                name   : 'action',
                                message: 'Que voulez-vous faire ?',
                                choices: [
                                    { name: 'Garder A', value: User.ONLY_A },
                                    { name: 'Garder B', value: User.ONLY_B },
                                    { name: 'Fusionner', value: User.MERGE },
                                    { name: 'Garder les deux', value: User.BOTH }
                                ]
                            }
                        ];

                        inquirer.prompt(questions, function (answer) {
                            ul.add(user);
                            ul.merge(user, answer.action);
                            saveUL(db, ul);
                        });
                    } else {
                        ul.add(user);
                        saveUL(db, ul);
                    }
                });
        });
    }
});
