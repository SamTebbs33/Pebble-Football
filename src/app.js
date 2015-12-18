var UI = require('ui');
var ajax = require("ajax");
var clubID = "MUFC", clubURL = "";
var leagueID = "PL", leagueURL = "";

var menuClubSection = {
	title: "Club",
	items: [
		{
			title: "Fixtures",
			subtitle: "Upcoming fixtures"
		},
		{
			title: "Results",
			subtitle: "Recent results"
		},
		{
			title: "Players",
			subtitle: "The club's players"
		}
	]
};

var menuLeagueSection = {
	title: "League",
	items: [
		{
			title: "Fixtures",
			subtitle: "Upcoming fixtures"
		},
		{
			title: "Results",
			subtitle: "Recent results"
		},
		{
			title: "Table",
			subtitle: "View the league table"
		}
	]
};

var splashscreen = new UI.Card({
	title: "Football",
	subtitle: "Getting data..."
});
splashscreen.show();

var mainMenu = new UI.Menu(
	{
		sections: [
			menuClubSection,
			menuLeagueSection
		]
	}
);

function sendRequest(url, callback) {
	console.log("Sending request to: " + url);
	ajax(
		{
			url: url,
			type: "json",
			headers: { "X-Auth-Token" : "796fd05699414e7381b53d8996bbbaf8" },
			async: false
		}, callback, function(error) {
			console.log("REQUEST ERROR for " + url + " -> " + JSON.stringify(error));
		}
	);
}

function getClub() {
	// Set the club URL to use for club-related API requests
	sendRequest(leagueURL + "/teams", function(data) {
		for(var i = 0; i < data.teams.length; i++) {
			var club = data.teams[i];
			if(club.code == clubID) {
				clubURL = club._links.self.href;
				break;
			}
		}
		splashscreen.hide();
		mainMenu.show();
	});
}

function getFixtures(timeFrame, titleFunc) {
	// Processes and displays the fixtures from start to end
	var displayFixtures = function(fixtures, start, end) {
		var sections = [];
		for(var i = start; i < fixtures.length && i < end; i++) {
			var fixture = fixtures[i];
			var date = fixture.date;
			var day = date.substring(8, 10), month = date.substring(5, 7), year = date.substring(2, 4);
			sections.push({
				title: day + "/" + month + "/" + year + titleFunc(date, fixture),
				items: [
					{
						title: fixture.homeTeamName,
						subtitle: fixture.awayTeamName
					}
				]
			});
		}
		if(end < fixtures.length) {
			sections.push({
				items: [
					{
						title: "Next"
					}
				]
			});
		}
		var fixtureMenu = new UI.Menu({
			sections: sections
		});
		fixtureMenu.on("select", function(event) {
			if(event.item.title == "Next") {
				displayFixtures(fixtures, start + 5, end + 5);
			}
		});
		splashscreen.hide();
		fixtureMenu.show();	
	};
	splashscreen.show();
	sendRequest(clubURL + "/fixtures?timeFrame=" + timeFrame, function(data) {
		displayFixtures(data.fixtures, 0, 5);
	});
}

function getPlayers() {
	splashscreen.show();
	sendRequest(clubURL + "/players", function(data) {
		var players = {"Keeper" : [], "Right-Back" : [], "Centre Back" : [], "Left-Back" : [],
					   "Defensive Midfield" : [], "Central Midfield" : [], "Right Wing" : [],
					   "Attacking Midfield" : [], "Left Wing" : [], "Secondary Striker" : [], "Centre Forward" : []};
		for(var i = 0; i < data.players.length; i++) {
			var player = data.players[i];
			players[player.position].push({
				title: player.name,
				subtitle: "#" + player.jerseyNumber + ", " + player.marketValue
			});
		}
		var sections = [];
		for(var position in players) {
			if(players.hasOwnProperty(position) && players[position].length > 0) {
				sections.push({
					title: position,
					items: players[position]
				});
			}
		}
		var menu = new UI.Menu({
			sections: sections
		});
		splashscreen.hide();
		menu.show();
	});
}

splashscreen.show();
Pebble.addEventListener("showConfiguration", function(event) {
	Pebble.openURL("SamTebbs33.github.io/Pebble-Football");
});

// Set the league URL to use for league-related API requests
sendRequest("http://api.football-data.org/alpha/soccerseasons", function(data) {
	for(var i = 0; i < data.length; i++) {
		var s = data[i];
		if(s.league == leagueID) {
			leagueURL = s._links.self.href;
			break;
		}
	}
	mainMenu.on("select", function(event) {
		if (event.section.title == "Club") {
			switch (event.item.title) {
				case "Players":
					getPlayers();
					break;
				case "Fixtures":
					getFixtures("n99", function(date, fixture) {
						var hour = date.substring(11, 13), minute = date.substring(14, 16);
						return " @ " + hour + ":" + minute;
					});
					break;
				case "Results":
					getFixtures("p99", function(date, fixture) {
						var result = fixture.result;
						return " , " + result.goalsHomeTeam + " - " + result.goalsAwayTeam;
					});
					break;
				default:
					console.log("Unrecognised menu item title");
			}
		} else {
		}
	});
	getClub();
});