var bot = require('../discordClient.js');

var consts = require('../consts.js');
var db = require('../db.js');
var formatting = require('../formatting.js');
var rlClient = require('../rlClient.js');
var batchSize = 10;
var logger = require('winston');

/**
 * Ladder command, !ladder <playlist>
 * Finds all ranked people in the playlist, and shows their cached results them in order.
 */
function run(discordName, discordID, message, args, onComplete) {
    var playlists = formatting.parsePlaylistArgs(args);
    if (playlists.length !== 1) {
        message.channel.send("A single playlist must be provided.");
        onComplete();
        return;
    }
    var playlist = playlists[0];
    var rlPlaylist = rlClient.playlistNameToID(playlist);

    // First step, load all the users:
    logger.info("Finding all users...");
    db.User.find(function (err, users) {
        if (err) {
            logger.error("Error loading users.");
            return;
        }
        var userMap = {};
        var payload = [];
        for (var user of users) {
            userMap[user['steamId']] = user;
            payload.push({"platformId": user.platform, "uniqueId": user.steamId});
        }
        var batchPayload = [];
        for (var i = 0; i < payload.length; i += batchSize) {
            batchPayload.push(payload.slice(i, i + batchSize));
        }

        // Next step, query for all their ranks in one go:
        logger.info("Getting all stats for " + payload.length + " users...");
        var statsPromises = [];
        for (var batch of batchPayload) {
            statsPromises.push(rlClient.getStatsBatch(batch));
        }
        Promise.all(statsPromises).then(
            function (result) {
                var userRatings = [].concat.apply([], result);
                var rankedRatings = [];
                for (var userRating of userRatings) {
                    // Need rating from RL API...
                    var rating = userRating
                        && userRating.rankedSeasons
                        && userRating.rankedSeasons[consts.CurrentSeason]
                        && userRating.rankedSeasons[consts.CurrentSeason][rlPlaylist];
                    // ... and user from Discord
                    var user = userMap[userRating.uniqueId];
                    if (user && rating) {
                        rankedRatings.push({
                            'user': user,
                            'data': rating
                        });
                    }
                }
                logger.info("  ... " + rankedRatings.length + " of those ratings have matching users");
                // Finally, sort by MMR and format the final message:
                rankedRatings.sort(function (a, b) {
                    if (a.data.rankPoints !== b.data.rankPoints) {
                        // Highest MMR name first.
                        return b.data.rankPoints - a.data.rankPoints;
                    } else {
                        // Then lowest name.
                        return a.user.name.localeCompare(b.user.name);
                    }
                });
                var text = formatting.ladderToText(rankedRatings);
                message.channel.send({
                    embed: {
                        color: consts.Color.GREEN,
                        title: "Current ladder for " + playlist + ": ",
                        description: text
                    }
                });
                onComplete();
            },
            function (err) {
                message.channel.send({
                    embed: {
                        color: consts.Color.RED,
                        title: "Couldn't load rankings, try again later"
                    }
                });
                onComplete();
            });
    });
}

module.exports = {
    run: run
};
