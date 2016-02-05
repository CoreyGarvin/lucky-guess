appController.register(function() {
    var scrollTop = function() {
        window.scrollTo(0,0);
    };

    var init = function() {
        scrollTop();
        window.addEventListener('touchstart', function setHasTouch () {
            if (hasClass(document.body, "no-touch")) {
                alert("touch happened!");
                removeClass(document.body, "no-touch");
            }

            // window.removeEventListener('touchstart', setHasTouch);
        }, false);
    };

    return new Component("WindowController",
        {
            // init: init,
            intro: scrollTop,
            createdGame: scrollTop,
            presentGame: scrollTop,
            guessResponse: scrollTop,
            gameWon: scrollTop,
            gameLost: scrollTop
        }
    );
}());
