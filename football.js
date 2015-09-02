#!/usr/bin/env node


var program = require('commander');

var cli = require('cli-color');

var Table = require('cli-table');

var request = require('request');

var fs = require('fs');

var apiHome = 'http://api.football-data.org/';
var apiRelease = 'alpha/';
var APIURL = apiHome + apiRelease;

program.version("Football CLI version : 0.0.1");

program.command('seasons')
    .description('Get all football seasons')
    .action(getSeasons);

program.command('teams [id]')
    .description('Get all teams in a league. Run football seasons to get IDs of leagues')
    .action(function(id) {
        getTeams(id)
    });

program.command('table [leaqueId]')
    .description('Get current league table for a league. Run football seasons to get IDs of leagues')
    .action(function(leagueId) {
        getStandings(leagueId);
    });

program.command('fixtures [leagueId] [matchday]')
    .description('Get the fixtures for a certain season. Matchday in the range 1-42')
    .action(function(leagueId, matchday) {
        getFixtures(leagueId, matchday);
    });

program.command('json')
    .action(createJsonFile);

program.parse(process.argv);


function getSeasons() {
    var url = APIURL + 'soccerseasons'
    request(url, function(error, response, body) {
        if (error) {
            console.log(cli.red('An error occured. ' + error))
        } else {

            var json = JSON.parse(body);

            var table = new Table({
                head: ['Id', 'League Name', 'League Abbreviation']
            });
            for (var i = 0; i < json.length; i++) {

                var id = getSeasonId(json[i]._links.self.href)
                var name = json[i].caption;
                var league = json[i].league;
                table.push([id, name, league]);
            }
            console.log(table.toString());

            console.log(cli.greenBright("\t To get the teams in a league type football teams id . Id is as given above"));
        }
    });
}

function getTeams(id) {
    var id = id.trim();
    if (id === undefined) {
        Console.log(cli.red("You must give a league id"));
    } else {
        var url = APIURL + 'soccerseasons/' + id + '/teams';

        request(url, function(error, response, body) {
            if (error) {
                console.log(cli.red('An error occured. ' + error));
            } else {
                var json = JSON.parse(body);

                var teams = json.teams;

                console.log('\t Team Code\t\Name\t\t\t Squad Mkt Value')
                for (var i = 0; i < teams.length; i++) {
                    var name = teams[i].name;
                    var code = teams[i].code;
                    var squadValue = teams[i].squadMarketValue
                    console.log('\t  %s \t\ %s \t\t\t %s', cli.greenBright(code), cli.cyanBright(name), cli.greenBright(squadValue));
                }
            }
        });
    }
}

function getSeasonId(url) {
    var arr = url.split('/');
    return arr[arr.length - 1];
}
function getTeamId(url) {
    var arr = url.split('/');
    return arr[arr.length - 1];
}

function getStandings(leagueId) {
    if (leagueId === undefined) {
        Console.log('Please provide leaqueId');
    } else {
        var url = APIURL + 'soccerseasons/' + leagueId + '/leagueTable'

        request(url, function(error, response, body) {
            if (error) {
                console.log(cli.red('An error occurred' + error));
            } else {

                var standing = JSON.parse(body).standing;

                //sort based on position
                standing.sort(function(a, b) {
                    return parseInt(a.position) - parseInt(b.position);
                });
                var table = new Table({
                    head: ['Pos', 'Club', 'Pld', 'Pts', 'Goals', 'Goal Diff']
                });
                for (var i = 0; i < standing.length; i++) {
                    var name = standing[i].teamName;
                    var position = standing[i].position;
                    var pld = standing[i].playedGames;
                    var pts = standing[i].points;
                    var goals = standing[i].points;
                    var diff = standing[i].goalDifference;

                    table.push([position, name, pld, pts, goals, diff]);
                }

                console.log(table.toString());


            }
        });
    }
}

function getFixtures(leagueId, matchday) {
    if (leagueId === undefined) {
        Console.log('Please provide leaqueId');
    } else if (matchday !== undefined) {
        matchday = parseInt(matchday);

        if (matchday < 1 || matchday > 42) {
            console.log('Match must be between 1 and 42');
        } else {
            var url = APIURL + 'soccerseasons/' + leagueId + '/fixtures/' + matchday;

            request(url, function(error, response, body) {
                console.log(body);
            });
        }

    } else {
        var url = APIURL + 'soccerseasons/' + leagueId + '/fixtures';

        console.log(url);

    }
}

/*
 * used to create an updated data.json file
 */
function createJsonFile() {
    //get all fixtures
    var url = APIURL + 'soccerseasons';

    request(url, function(error, response, body) {
        var seasons = JSON.parse(body);
        for (var i = 0; i < seasons.length; i++) {
            var team_url = seasons[i]._links.teams.href;

            request(team_url, function(error, response, body) {
                var teams = JSON.parse(body).teams;
                var full_obj =[];
                for (var i = 0; i < teams.length; i++) {
                    var id = getTeamId(teams[i]._links.self.href);
                    var code = teams[i].code;
                    var name = teams[i].name;
                    var obj = {
                        "id":id,
                        "code":code,
                        "name":name
                    }
                    full_obj.push(obj);
                }
                console.log(full_obj);
                fs.writeFile('data.json', JSON.stringify(full_obj, null, 2) , 'utf-8');
            });
        }
    });
}
