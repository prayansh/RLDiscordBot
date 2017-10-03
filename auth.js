var auth = false;
try {
    auth = require('./auth.json');
} catch (ex) {
    auth = false;
}

var getAuth = function (type) {
    var token = '';
    if (type.toLowerCase() === 'discord') {
        token = (auth) ? auth.discord_token : process.env.DISCORD_TOKEN;
    } else if (type.toLowerCase() === 'rl') {
        token = (auth) ? auth.rl_token : process.env.RL_TOKEN;
    } else if (type.toLowerCase() === 'mongo') {
        token = (auth) ? auth.mongo_pass : process.env.MONGO_PASS;
    }
    return token;
};

module.exports = {
  getAuth: getAuth,
};
