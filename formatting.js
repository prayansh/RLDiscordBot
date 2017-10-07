var ALL_PLAYLISTS = ["Duel", "Doubles", "Solo", "Standard"];
var FORMAT_START = '-----------------------------\n';

const tierNames = [
    '<:unranked:360259883443945472>',
    '<:bronze1:360258827293032450>', '<:bronze2:360258828647792640>', '<:bronze3:360258827838423040>',
    '<:silver1:360258826882252800>', '<:silver2:360258827716788225>', '<:silver3:360258827855200256>',
    '<:gold1:360258826697441281>', '<:gold2:360258827804737566>', ': <:gold3:360258827125260291>',
    '<:plat1:360258827863457792>', '<:plat2:360258827859394560>', '<:plat3:360258827851137024>',
    '<:diamond1:360258827481776129>', '<:diamond2:360258827427250183>', '<:diamond3:360258827750342658>',
    '<:champ1:360258826642915328>', '<:champ2:360258826928259074>', '<:champ3:360258826127147009>',
    '<:grand_chump:360258827930697729>'
];

function emojiForTier(tier) {
    tier = tier | 0;
    return tierNames[tier];
}

function rankOrEmpty(name, obj) {
    if (!obj) {
        return '';
    }
    return name + emojiForTier(obj.tier) + ' , div ' + (obj.division + 1) + " (" + obj.rankPoints + " mmr) " + '\n';
}

// If provided, let actions restrict the playlist by mentioning "1s" or "Doubles" etc in args.
function parsePlaylistArgs(argsLeft) {
    var playlists = [];
    if (argsLeft.indexOf("Duel") > -1 || argsLeft.indexOf("1s") > -1) {
        playlists.push("Duel");
    }
    if (argsLeft.indexOf("Doubles") > -1 || argsLeft.indexOf("2s") > -1) {
        playlists.push("Doubles");
    }
    if (argsLeft.indexOf("Solo") > -1) {
        playlists.push("Solo");
    }
    if (argsLeft.indexOf("Standard") > -1 || argsLeft.indexOf("3s") > -1) {
        playlists.push("Standard");
    }
    // If none provided, use all playlists.
    return playlists.length == 0 ? ALL_PLAYLISTS : playlists;
}

// Format a collection of current season MMR ranks into the correct rating tier and division.
function seasonRankToText(currentSeasonData, argsLeft) {
    var formatted = FORMAT_START;
    if (currentSeasonData) {
        var playlists = parsePlaylistArgs(argsLeft);
        if (playlists.indexOf("Duel") > -1) {
            formatted += rankOrEmpty("Duel: ", currentSeasonData["Duel"]);
        }
        if (playlists.indexOf("Doubles") > -1) {
            formatted += rankOrEmpty("Doubles: ", currentSeasonData["Doubles"]);
        }
        if (playlists.indexOf("Solo") > -1) {
            formatted += rankOrEmpty("Solo: ", currentSeasonData["Solo"]);
        }
        if (playlists.indexOf("Standard") > -1) {
            formatted += rankOrEmpty("Standard: ", currentSeasonData["Standard"]);
        }
    }
    if (formatted == FORMAT_START) {
        formatted += 'No ranks for current season';
    }
    return formatted;
}

// Given previous and current stats, format the different for a collection of playlists.
function old2newText(oldStats, newStats, argsLeft) {
    var playlists = parsePlaylistArgs(argsLeft);

    var formatted = FORMAT_START;
    for (var playlist in oldStats) {
        if (playlists.indexOf(playlist) == -1) {
            continue;
        }
        var oldStat = oldStats[playlist];
        var newStat = newStats[playlist];
        var matchesPlayedSince = newStat["matchesPlayed"] - oldStat["matchesPlayed"];
        var pointsChange = newStat["rankPoints"] - oldStat["rankPoints"];
        if (matchesPlayedSince > 0) {
            formatted += playlist + ": "
                + 'You have ' + ((pointsChange > 0) ? 'gained' : 'lost') + ' ' + Math.abs(pointsChange) + ' points '
                + ' in ' + matchesPlayedSince + ' matches'
                + '\n';
        }
    }
    if (formatted == FORMAT_START) {
        formatted += 'No updates since last time';
    }
    return formatted;
}

// Given sorted list of {id, user name, playlist rank}, format them as a table
function ladderToText(ladder) {
    if (ladder.length === 0) {
        return "No players in rank";
    }
    var formatted = FORMAT_START;
    for (rank of ladder) {
        formatted += rankOrEmpty(rank.user, rank.data);
    }
    return formatted;
}

module.exports = {
  ladderToText: ladderToText,
  old2newText: old2newText,
  parsePlaylistArgs: parsePlaylistArgs,
  seasonRankToText: seasonRankToText,
}
