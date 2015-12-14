package luckyguess

var htmlOld = `
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> 
		<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
		<title>Number Guessing Game</title>
		<meta name="description" content="Try to use clues to guess the correct number" />
		<meta name="keywords" content="icons, hover, round, circular, transition, animation, css3" />
		<meta name="author" content="Corey" />
		<link rel="shortcut icon" href="../favicon.ico"> 
		<link rel="stylesheet" type="text/css" href="css/default.css" />
		<link rel="stylesheet" type="text/css" href="css/component.css" />
		<script src="js/numbers.js" type="text/javascript" charset="UTF-8"></script>
		
		<meta name="viewport" content="initial-scale=1.0,  maximum-scale=1.0">
	</head>
	<body>
		<div class="container">
			<!-- Top Navigation -->
			<div class="codrops-top clearfix">
			</div>
			<header>
				<h1 class = "transparent">What Number Am I Thinking Of?</h1>
				<h2 class = "transparent">I give you 3 guesses</h2>	
				<nav id="codrops-demos" class="codrops-demos">
					<a href="#set-1">1</a>
					<a href="#set-2">2</a>
					<a href="#set-3">3</a>
					<a href="#set-4">4</a>
					<a href="#set-5">5</a>
					<a href="#set-6">6</a>
					<a href="#set-7">7</a>
					<a href="#set-8">8</a>
					<a href="#set-9">9</a>
				</nav>
			</header>
			<section id="set-1">
				<canvas id="world" class="transparent"></canvas>
				<div class = "logo-container transparent">
					<h3>Lucky<br><span>Guess</span></h3>
					<h4>by Corey Garvin</h4>
				</div>
				<div class = "hiscore-container transparent">
					<a id = "btn-continue">Again?</a>
					<table cellspacing='0'> <!-- cellspacing='0' is important, must stay -->
						<tr><th>Rank</th><th>Who</th><th>Score</th><th>Wins</th></tr><!-- Table Header -->
					</table>
				</div>
				<div class = "name-container transparent">
					<input type="text" id="player-name" placeholder="Your name?" value="">
					<a id = "btn-done">Done</a>
				</div>
				<div class = "score-container transparent">
					<table cellspacing='0'> <!-- cellspacing='0' is important, must stay -->
						<!-- <tr><th colspan="4">PlayerName</th></tr> -->
						<tr><th>Score</th></tr><!-- Table Header -->
						<tr><td id = "player-score">0</td><!-- <td id = "player-games">1</td> --></tr><!-- Table Row -->

					</table>
				</div>
				<div id = "game-choices" class="hi-icon-wrap hi-icon-effect-1 hi-icon-effect-1a">
					<a class="hi-icon transparent">1</a>
					<a class="hi-icon transparent">2</a>
					<a class="hi-icon transparent">3</a>
					<a class="hi-icon transparent">4</a>
					<a class="hi-icon transparent">5</a>
					<a class="hi-icon transparent">6</a>
					<a class="hi-icon transparent">7</a>
					<a class="hi-icon transparent">8</a>
					<a class="hi-icon transparent">9</a>
					<a class="hi-icon transparent">10</a>
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
