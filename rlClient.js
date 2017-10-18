var auth = require('./auth.js');

var rls = require('rls-api');
var logger = require('winston');
var unirest = require('unirest');

var RLClient = new rls.Client({
    token: auth.getAuth('rl')
});

// Given (ID, platform), get the current rank information from the RL API.
function getStats(playerId, platform) {
    return new Promise(function (resolve, reject) {
        RLClient.getPlayer(playerId, platform, function (status, data) {
            logger.debug(status);
            if (status === 200) {
                // TODO: Remap season IDs here, rather than in all callers.
                resolve(data);
            }
            else {
                reject(status);
            }
        });
    });
}

// Given a list of [(ID, platform)], get the ranks for all of them.
function getStatsBatch(playerData) {
    return new Promise(function (resolve, reject) {
        let Request = unirest.post('https://api.rocketleaguestats.com/v1/player/batch');

        Request.headers({
            'Authorization': auth.getAuth('rl'),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        });
        Request.send(playerData);
        Request.end(function (response) {
            if (response.status === 429) {
                logger.debug("Request has been ratelimited: '" + response.body.message + "'.");
                reject(response.status);
            } else {
                resolve(response.body);
            }
        });
    });
};

// Remap RL client playlist IDs to our playlist namse.
function playlistNameToID(localName) {
    switch (localName) {
        case 'Duel':
            return '10';
        case 'Doubles':
            return '11';
        case 'Solo':
            return '12';
        case 'Standard':
            return '13';
    }
    logger.error("Unknown playlist: " + localName);
    return '';
}

module.exports = {
    getStats: getStats,
    getStatsBatch: getStatsBatch,
    playlistNameToID: playlistNameToID,
};
