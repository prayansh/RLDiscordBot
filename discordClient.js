var auth = require('./auth.js');

var Discord = require('discord.js');
var logger = require('winston');

// Initialize Discord Bot
var discordClient = new Discord.Client();
discordClient.login(auth.getAuth('discord'));

// For debugging, add some message once connecting.
discordClient.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(discordClient.username + ' - (' + discordClient.id + ')');
});

var randomFunnyMessages = [
    "I am back!",
    "EROMBO",
    "Moi Moi!",
    "Whats up lads!",
    "Feels good to be back"
];

discordClient.on("ready", function () {
    discordClient.user.setGame('Rocket League');
    var guilds = discordClient.guilds.array();
    guilds.forEach(function (guild) {
        var val = Math.floor(Math.random() * randomFunnyMessages.length);
        guild.defaultChannel.send(randomFunnyMessages[val]);
    });
});

module.exports = discordClient;
