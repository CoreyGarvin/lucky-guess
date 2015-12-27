appController.register(function() {
    var el = null,
        table = null,
        currentResolve = null;

    var init = function() {
        el = document.getElementById("highscores");
        table = el.querySelector('table');
        // Handler - game over continue button
        document.getElementById("btn-continue").addEventListener("click", function() {
            var resolve = currentResolve;
            currentResolve = null;
            resolve();
        });
    }

    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};

    var highScores = function(scores) {
        return new Promise(function(resolve) {
            currentResolve = resolve;
            var html = '<tr><th>Rank</th><th>Who</th><th>Score</th><th>Streak</th></tr>';
            for(var i = 0; i < scores.length; i++) {
                var classes = i % 2 == 0 ? ' class = "even"' : "";
                html += '<tr' + classes + '><td>' + (i + 1) + '</td><td><span class = "player-name">' + scores[i].playerName + '</span></td><td>' + scores[i].score + '</td><td>' + scores[i].longestStreak + '</td></tr>';
            }
            table.innerHTML = html;
            fadeIn();
        });
    };

    return new Component("HighScores",
        {
            init: init,
            createdGame: fadeOut,
            highScores: highScores
        }
    );
}());
