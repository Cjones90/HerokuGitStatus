# About
Are you up to date? Compare your github master commits to your latest heroku deployment.

# Settings
* Edit heroku-compare.js to desired settings

`var heroToken = process.env.HEROKU_TOKEN;
var gitToken = process.env.GITHUB_TOKEN;`
Place token in place `process.env.TOKEN` or set environmental tokens

* MAP TO DESIRED JSON FILE
`var heroRepoNames = require('./heroku_github_namemap.json');`
Map heroku apps to github repos in the file above like so
`{
  "Heroku-App-Name": "Github-Repo-Name",
  "HerokuApp2": "MatchingGitHubRepo"
}`

* SET OPTIONS TO DESIRED OUPUT: ORG OR USER
As examples:
`var options = {user: "Cjones90"};`
{user: "username"}
or
`var options = {org: "NAQ"};`
{org: "orgName"}
