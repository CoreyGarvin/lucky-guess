// Component - contains the circular game buttons
appController.register(function() {
    var el = null,
        score = null,
        frameTime = 16;

    var init = function() {
        el = document.getElementById("current-score");
        score = document.getElementById("player-score");
    };
    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};

    var presentGame = function() {
        fadeOut();
        setTimeout(function() {
            addClass(el, "moved");
        }, 2000);
    };

    var showScore = function(oldScore, newScore, duration) {
        return new Promise(function(resolve) {
            score.textContent = oldScore;
            fadeIn();
            var delta = newScore - oldScore;
            var inc = delta / (duration / frameTime);
            setTimeout(function() {
                var timerId = setInterval(function () {
                    if (oldScore < newScore) {
                        oldScore = Math.min(oldScore + inc, newScore);
                        score.textContent = Math.floor(oldScore);
                    } else {
                        clearInterval(timerId);
                        setTimeout(function() {
                            fadeOut();
                            resolve();
                        }, 600);
                    }
                }, frameTime);
            }, 300);
        });
    };

    return new Component("ScoreDisplay",
        {
            init: init,
            presentGame: fadeOut,
            showScore: showScore
        }
    );
}());
