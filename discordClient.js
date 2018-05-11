var auth = require('./auth.js');
var consts = require('./consts.js');
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
    "EROMBO",
    "<:grand_chump:360258827930697729> OMEGALUL <:grand_chump:360258827930697729>",
    "Moi Moi!",
    "Whats up lads!",
    "LMG Mounted & Ready!",
    "All set to jam their meridian",
    "You can stop worrying about grenades now!",
    "Fookin' Laser Sights",
    "Time for some serious protection!"
];

discordClient.on("ready", function () {
    discordClient.user.setGame('all sorts of games');
    var guilds = discordClient.guilds.array();
    guilds.forEach(function (guild) {
        var val = Math.floor(Math.random() * randomFunnyMessages.length);
        guild.channels.find("id", consts.ChannelId).send(randomFunnyMessages[val]);
    });
});

module.exports = discordClient;
