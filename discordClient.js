var auth = require('./auth.js');

var discord = require('discord.io');
var logger = require('winston');

// Initialize Discord Bot
var discordClient = new discord.Client({
    token: auth.getAuth('discord'),
    autorun: true
});

// For debugging, add some message once connecting.
discordClient.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(discordClient.username + ' - (' + discordClient.id + ')');
});

module.exports = discordClient;
