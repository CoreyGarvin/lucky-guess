package luckyguess

var html = `
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Lucky Guess</title>
		<meta name="description" content="Try to use clues to guess the correct number" />
		<meta name="keywords" content="icons, hover, round, circular, transition, animation, css3" />
		<meta name="author" content="Corey Garvin" />
		<link rel="shortcut icon" href="../favicon.ico">
		<link rel="stylesheet" type="text/css" href="css/main.css" />
		<script src="js/lucky_guess_app/promiscuous.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/utils.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/services/luckyguess-service.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/app-controller.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/buttons.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/confetti.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/footer.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/logo.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/name-entry.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/components/score.js" type="text/javascript" charset="UTF-8"></script>
		<script src="js/lucky_guess_app/luckyguess.js" type="text/javascript" charset="UTF-8"></script>
		<meta name="viewport" content="initial-scale=1.0,  maximum-scale=1.0">
	</head>
	<body>
		<div class="container level-0">
			<header class = "transparent">
				<h1 class = "transparent">What Number Am I Thinking Of?</h1>
				<h2 class = "transparent">I give you 3 guesses</h2>
				<div id = "cupcake" class = "idle">
					<image  src = "images/cupcake2.svg"></image>
				</div>
			</header>
			<section id="set-1">
				<canvas id="confetti" class="overlay transparent"></canvas>
				<div id = "logo" class = "overlay transparent">
					<div>
						<h3>Lucky<br><span>Guess</span></h3>
						<h4>by Corey Garvin</h4>
						<image src = "images/cupcake2.svg" />
					</div>
				</div>
				<div id = "highscores" class = "highscores overlay transparent">
					<a id = "btn-continue">Again?</a>
					<table cellspacing='0'> <!-- cellspacing='0' is important, must stay -->
						<tr><th>Rank</th><th>Who</th><th>Score</th><th>Wins</th></tr><!-- Table Header -->
					</table>
				</div>
				<div id = "name-entry" class = "name-entry overlay transparent">
					<input type="text" id="name-input" placeholder="Your name?" value="">
					<a id = "name-submit">Done</a>
				</div>
				<div id = "current-score" class = "current-score overlay transparent">
					<table cellspacing='0'> <!-- cellspacing='0' is important, must stay -->
						<!-- <tr><th colspan="4">PlayerName</th></tr> -->
						<tr><th>Score</th></tr><!-- Table Header -->
						<tr><td id = "player-score">0</td><!-- <td id = "player-games">1</td> --></tr><!-- Table Row -->

					</table>
				</div>
				<div id = "game-choices" class="overlay effect-1 effect-1a">
					<a class="choice transparent">1</a>
					<a class="choice transparent">2</a>
					<a class="choice transparent">3</a>
					<a class="choice transparent">4</a>
					<a class="choice transparent">5</a>
					<a class="choice transparent">6</a>
					<a class="choice transparent">7</a>
					<a class="choice transparent">8</a>
					<a class="choice transparent">9</a>
					<a class="choice transparent">10</a>
			</div>
			<div id = "footer">
				<span class = "attempts-remaining">Guesses:
					<span class="tokens">
						<span class="guess-token"><span class="inner"></span></span>
						<span class="guess-token"><span class="inner"></span></span>
						<span class="guess-token"><span class="inner"></span></span>
					</span>
				</span>
				<span class = "score">Score: <span>454</span></span>
			</div>
			</section>
<!-- 			<section class="info">
				<p>If you enjoyed this game, you might also like:</p>
				<p><a href="http://tympanus.net/Development/CreativeButtons/">Picking Your Nose</a></p>
				<p><a href="http://tympanus.net/Development/CreativeLinkEffects/">Whack-a-Mole</a></p>
			</section> -->
		</div><!-- /container -->
	</body>
</html>

`
