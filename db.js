// Config
var properties = require('./properties.json');
var auth = require('./auth.js');

// Mongo Code
var mongoose = require('mongoose');

// Mongoose Schema definition
var userSchema = new mongoose.Schema({
    steamId: String,
    discordId: String,
    name: String,
    platform: Number
});

var seasonStatSchema = new mongoose.Schema({
    discordId: String,
    data: Object
});

// Mongo access objects:
User = mongoose.model('UsersDB', userSchema);
Season = mongoose.model('SeasonStatsDB', seasonStatSchema);

var uri = "mongodb://"
        + properties.mongo_user + ":" + auth.getAuth('mongo') + "@"
        + "rldiscordbot-shard-00-00-k9ogi.mongodb.net:27017"
        + ",rldiscordbot-shard-00-01-k9ogi.mongodb.net:27017"
        + ",rldiscordbot-shard-00-02-k9ogi.mongodb.net:27017"
        + "/" + properties.mongo_db
        + "?ssl=true&replicaSet=RLDiscordBot-shard-0&authSource=admin"
    ;

function connect() {
    mongoose.connect(uri, function (err) {
        if (err) console.error(err);
        else console.log('mongo connected');
    });
}


module.exports = {
    User: User,
    Season: Season,
    connect: connect,
};
