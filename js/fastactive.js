document.addEventListener("DOMContentLoaded", function(event) {
    (function(d, w, fastActiveClassName, isFastActiveTarget) {
        if ((('ontouchstart' in w) || w.DocumentTouch && d instanceof DocumentTouch)) {
            var activeElement = null,
            clearActive = function(e) {
                // e.preventDefault()
                if (activeElement) {
                    activeElement.classList.remove(fastActiveClassName);
                    activeElement = null;
                }
            },
            setActive = function(e) {
                clearActive(e);
                if (isFastActiveTarget(e)) {
                    activeElement = e.target;
                    if (activeElement != null) {
                        activeElement.classList.add(fastActiveClassName);
                        window.setTimeout(function() {
                            activeElement.classList.remove(fastActiveClassName);
                            activeElement = null;
                        }, 500);
                    }
                    window.setTimeout(function() {
                        removeClass(document.body, "no-touch");
                    }, 500);
                }
            };
            d.body.addEventListener('touchstart', setActive, false);
        }
    })(document, window, 'active', function(e) {
        // return true;
        return ['A', 'INPUT'].indexOf(e.target.tagName) > -1; // Put your conditional logic here
    });
});
