var Heroku = require("heroku");
var GitAPI = require('github');
var colors = require("colors");

var heroToken = process.env.HEROKU_TOKEN;
var gitToken = process.env.GITHUB_TOKEN;
//Place token in place process.env.TOKEN or set environmental tokens


// SET OPTIONS TO DESIRED OUPUT: ORG OR USER
//  Examples:
//  {user: "username"}
//  {org: "orgName"}


//My current uses:
var prop = process.argv[2] || 'user';
var options = {};
options[prop] = process.argv[3] || "Cjones90";
// var options = {user: "Cjones90"};
// var options = {org: "RealEstateEconomics"};


///// NOTHING BELOW NEEDS TO BE CONFIGURED //////
// TODO implement error catching
// TODO optimize calls
// TODO create API for npm/node use
// TODO remove change to String.prototype
// TODO modulize
// TODO better documentation


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
      var commitArr = [];
      github.repos.getCommits({
        user: repo.owner.login,
        repo: repo.name
        }, function(err, results) {
        results.forEach(function(elem) {
          commitArr.push(elem.sha.slice(0,7));
        })
        github.repos.getBranches({
          user: repo.owner.login,
          repo: repo.name
          }, function (err, branches) {
          branches.forEach(function (branch) {
            if(branch.name === 'master') {
              gitRepos[gitRepos.length] = {
                name: repo.name,
                commit: branch.commit.sha.slice(0,7),
                branchCount: branches.length-1,
                commitArr: commitArr
              };
              if(gitRepos.length === repos.length) {
                callback(null, gitRepos)
              }
            }
          })
        })
      })
    })
  })
}


function getHeroku(callback) {
  var herokuRepos = [];
  heroku.get_apps(function (err, apps) {
    for(var i in apps) {
      (function (i) {
        heroku.get_releases(apps[i].name, function (err, releaseRes) {
          heroku.get_ps(apps[i].name, function (err, dyno) {
            herokuRepos[herokuRepos.length] = {
              name: apps[i].name,
              commit: releaseRes[releaseRes.length-1].commit,
              dynos: apps[i].dynos,
              dynoSize: dyno[0].size
            }
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
    if(repos[p].heroRepo.name.length > padRepo.MAX_LENGTH) {
      padRepo.MAX_LENGTH = repos[p].heroRepo.name.length;
    }
  }
  var minus = !(padRepo.MAX_LENGTH % 2) ? 2 : 3;
  for(var i = 0; i < (padRepo.MAX_LENGTH/2)-2; i++) {
    padRepo.str += "-";
  }
  padRepo.str += 'Live'
  for(var j = 0; j < (padRepo.MAX_LENGTH/2)-minus; j++) {
    padRepo.str += "-";
  }
  return padRepo;
}


////////////^^^ FUNCTIONS//////// CALLS

getRepos(options, getGit, getHeroku, function (repos) {
  //Result contains all repos from git/heroku as an object in the form of:
  //repos = {gitArr: [{}, {} ...], heroArr: [{}, {} ...]}
  //gitArr = [{name: "RepoName", commit: "7 dig Sha Number"}, {}, {} ...]
  //heroArr = [{name: "RepoName", commit: "7 dig Sha Number"}, {}, {} ...]
  if(repos.gitArr.length && repos.heroArr.length) {
    var matchedArr = [];
    repos.gitArr.forEach(function (gitRepo) {
      var heroRepo = repos.heroArr.filter(function (elem) {
        return gitRepo.commitArr.some(function (elem2) {
          return elem2 === elem.commit;
        })
      })
      if(heroRepo.length) {
        var heroRepo = heroRepo[0];
        matchedArr[matchedArr.length] = {"gitRepo": gitRepo, "heroRepo": heroRepo};
      }
    })
    var maxRepo = padRepoLength(matchedArr);
    console.log(); //// Buffer
    console.log(maxRepo.str+" ||  ---- Git ---  ||  -- Heroku --  ||  --- Dynos ---");
    matchedArr.forEach(function(elem) {
      var str = elem.heroRepo.name.padRight(maxRepo.MAX_LENGTH)+
          " ||  Sha: "+ elem.gitRepo.commit+"  ||  Sha: "+ elem.heroRepo.commit+
          "  ||  #: "+ elem.heroRepo.dynos+ " Size: "+
          String(elem.heroRepo.dynoSize).padRight(2)+"  === ";
      var flag = elem.gitRepo.commit === elem.heroRepo.commit ?
          str.green+"Match".padRight(12).green :
          str.red+"OUT OF DATE".padRight(12).red;
      flag = (elem.gitRepo.branchCount > 0) ?
          flag+String("== "+elem.gitRepo.branchCount).yellow+" branch(es)".yellow :
          flag;
      console.log(flag);
    })
  }
});
