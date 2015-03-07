var Heroku = require("heroku");
var GitAPI = require('github');
var colors = require("colors");

var heroToken = process.env.HEROKU_TOKEN;
var gitToken = process.env.GITHUB_TOKEN;
//Place token in place process.env.TOKEN or set environmental tokens

// MAP TO DESIRED JSON FILE
var heroRepoNames = require('./heroku_github_namemap.json');
/*Map heroku apps to github repos in the file above like so
{
  "Heroku-App-Name": "Github-Repo-Name",
  "HerokuApp2": "MatchingGitHubApp"
}
*/

// SET OPTIONS TO DESIRED OUPUT: ORG OR USER
// var options = {user: "Cjones90"};
//  {user: "username"}

var options = {org: "NAQ"};
//  {org: "orgName"}



///// NOTHING BELOW NEEDS TO BE CONFIGURED //////

var heroku = new Heroku.Heroku({key: heroToken});
var github = new GitAPI({  version: "3.0.0"  });

github.authenticate({
    type: "oauth",
    token: gitToken
});

String.prototype.padRight = function (len) {
  if(this.length < len) {
    return String(this + (Array(len - this.length + 1).join(' ')))
  }
  else {
    return String(this);
  }
}

///TODO implement error catching

function getGit (options, callback) {
  var gitRepos = [];
  if(options.user) {
    getRepos = github.repos.getFromUser;
  }
  else if (options.org) {
    getRepos = github.repos.getFromOrg;
  }
  else {
    console.log("Please be sure to enter the appropriate options");
    return;
  }
  getRepos(options, function (err, repos) {
    repos.forEach(function (repo) {
      github.repos.getBranches({user: repo.owner.login, repo: repo.name}, function (err, branches) {
        branches.forEach(function (branch) {
          if(branch.name === 'master') {
            gitRepos[gitRepos.length] = {name: repo.name, commit: branch.commit.sha.slice(0,7), branchCount: branches.length-1}
          }
        })
        if(gitRepos.length === repos.length) {
          callback(null, gitRepos)
        }
      })
    })
  })
}

// TODO do get_release and get_app at same time, pushing into array if doesnt exist
// or mapping either .commit or .dyno if it doesnt exist, once both functions complete
// call callback
function getHeroku(callback) {
  var herokuRepos = [];
  heroku.get_apps(function (err, apps) {
    for(var i in apps) {
      (function (i) {
        heroku.get_releases(apps[i].name, function (err, releaseRes) {
          heroku.get_app(apps[i].name, function (err, appRes) {
            herokuRepos[herokuRepos.length] = {name: apps[i].name, commit: releaseRes[releaseRes.length-1].commit, dynos: appRes.dynos}
            if(herokuRepos.length === apps.length) {
              callback(null, herokuRepos);
            }
          })
        })
      })(i);
    }
  })
}

function getRepos(userFlag, git, heroku, cb) {
  var REPO = {
    gitArr: [],
    heroArr: []
  }
  git(userFlag, function (err, gitRepos) {
    gitRepos.forEach(function (repo) {
      REPO.gitArr[REPO.gitArr.length] = repo;
      if(REPO.gitArr.length === gitRepos.length) {
          cb(REPO);
      }
    })
  })

  heroku(function (err, herokuRepos) {
    herokuRepos.forEach(function (repo) {
      REPO.heroArr[REPO.heroArr.length] = repo;
      if(REPO.heroArr.length === herokuRepos.length) {
        cb(REPO);
      }
    });
  });

}

function padRepoLength(repos) {
  var padRepo = {
    MAX_LENGTH: 0,
    str: ''
  }
  for(p in repos) {
    if(repos[p].length > padRepo.MAX_LENGTH) {
      padRepo.MAX_LENGTH = repos[p].length;
    }
  }
  for(var i = 0; i < (padRepo.MAX_LENGTH/2)-2; i++) {
    padRepo.str += "-";
  }
  padRepo.str += 'Repo'
  for(var j = 0; j < (padRepo.MAX_LENGTH/2)-2; j++) {
    padRepo.str += "-";
  }
  return padRepo;
}


////////////^^^ FUNCTIONS//////// CALLS

getRepos(options, getGit, getHeroku, function (repos) {
  //Result contains all repos from git/heroku as an object in the form of:
  //  repos = {gitArr: [{}, {} ...], heroArr: [{}, {} ...]}
  //Git array = [{name: "RepoName", commit: "7 dig Sha Number"}, {}, {} ...]
  //Heroku array = [{name: "RepoName", commit: "7 dig Sha Number"}, {}, {} ...]
  if(repos.gitArr.length && repos.heroArr.length) {
    var maxRepo = padRepoLength(heroRepoNames);
    console.log(); //// Buffer
    console.log(maxRepo.str+" ||  ---- Git ---  ||  -- Heroku --  || -- Dynos --");
    repos.gitArr.forEach(function (gitRepo) {
      repos.heroArr.forEach(function (heroRepo) {
        if(gitRepo.name === heroRepoNames[heroRepo.name]) {
          var str = gitRepo.name.padRight(maxRepo.MAX_LENGTH)+" ||  Sha: "+ gitRepo.commit+"  ||  Sha: "+ heroRepo.commit+"  ||  Dynos: "+ heroRepo.dynos+ "  === ";
          var flag = gitRepo.commit === heroRepo.commit ? str.green+"Match".padRight(12).green : str.red+"OUT OF DATE".padRight(12).red;
          flag = (gitRepo.branchCount > 0) ? flag+String("== "+gitRepo.branchCount).yellow+" branch(es)".yellow : flag;
          console.log(flag);
        }
      })
    })
  }
});
