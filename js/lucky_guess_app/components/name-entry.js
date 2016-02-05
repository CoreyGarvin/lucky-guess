// Component - Player enters their name for record keeping
appController.register(function() {
    var el = null,
        nameInput = null,
        nameSubmit = null,
        currentResolve = null;

    var init = function() {
        el = document.getElementById("name-entry");
        nameInput = document.getElementById("name-input");
        nameSubmit = document.getElementById('name-submit');
        // Handler - Name entry - Handle the 'return' key
        nameInput.addEventListener("keydown", function(event) {
            var keyCode = (window.event) ? event.which : event.keyCode;
            if (event.keyCode == 13) {
                nameSubmit.click();
            }
        });
        nameSubmit.addEventListener("click", function() {
            if (currentResolve != null) {
                var resolve = currentResolve;
                currentResolve = null;
                nameInput.blur();
                resolve(nameInput.value);
            }
        });
    };

    var fadeOut = function() {addClass(el, "transparent");};
    var fadeIn = function() {removeClass(el, "transparent");};
    var nameEntry = function() {
        fadeIn();
        setTimeout(function() {
            nameInput.focus();
        }, 600);
        return new Promise(function(resolve) {
            currentResolve = resolve;
        });
    };

    return new Component("NameEntry",
        {
            init: init,
            presentGame: fadeOut,
            nameEntry: nameEntry
        }
    );
}());