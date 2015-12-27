// Component - Logo
appController.register(function() {
    var el = {};

    var init = function() {el = document.getElementById("logo");};
    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};
    var intro = function(duration) {
        fadeIn();
        return new Promise(function (resolve, reject) {
            setTimeout(function() {
                fadeOut();
                setTimeout(function() {
                    addClass(el, "moved");
                }, 2000);
                resolve();
            }, duration);
        });
    };

    return new Component("GameLogo",
        {
            init: init,
            intro: intro,
            presentGame: fadeOut,
            nameEntry: fadeIn,
        }
    );
}());