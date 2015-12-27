document.addEventListener("DOMContentLoaded", function(event) {
	log("DOMContentLoaded");
	// Start the app
	log("Starting app..")
	appController.begin();
});

function enableConfetti() {
	confettiEnabled = true;

	setTimeout(function() {removeClass(document.getElementById('confetti'), "transparent");}, 500);
}

function disableConfetti() {
	setTimeout(function() {confettiEnabled = false;}, 500);

	addClass(document.getElementById('confetti'), "transparent");
}
