var auth = require('./auth.js');

var rls = require('rls-api');
var logger = require('winston');

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

module.exports = {
  getStats: getStats
};
