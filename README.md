# About
Are you up to date? Compare your github master commits to your latest heroku deployment.

# Settings
* Edit heroku-compare.js to desired settings </li>

```
var heroToken = process.env.HEROKU_TOKEN;
var gitToken = process.env.GITHUB_TOKEN;
```

Place token in place `process.env.TOKEN` or set environmental tokens

* Map to desired JSON file
```
var heroRepoNames = require('./heroku_github_namemap.json');
```
Map heroku apps to github repos in the file above like so
```
{
  "Heroku-App-Name": "Github-Repo-Name",
  "HerokuApp2": "MatchingGitHubRepo"
}
```

* Set options to desired output: org or user
Examples:
```
Form of {user: "username"}
var options = {user: "Cjones90"};
```
or
```
Form of {org: "orgName"}
var options = {org: "NAQ"};
```
