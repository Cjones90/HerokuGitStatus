# About
Are you up to date? Compare your github master commits to your latest heroku deployment.

# Settings
* Currently designed to be run in the terminal
* npm i
* Edit heroku-compare.js to desired settings illustrated below.
* node hero*.js

Place your tokens in place `process.env.TOKEN` or set environmental tokens.

```
var heroToken = process.env.HEROKU_TOKEN;
var gitToken = process.env.GITHUB_TOKEN;
```
Set options to desired output: org or user

```
var options = {user: "Cjones90"};
```
or
```
var options = {org: "RealEstateEconomics"};
```
Now accepts CLI arguments. Example:
```
node hero*.js user Cjones90
node hero*.js org RealEstateEconomics
```

* Example output:

```
kc@kc-acer:~/Templates/herokugit$ node hero*.js
------Live---- ||  ---- Git ---  ||  -- Heroku --  ||  --- Dynos ---
kc-blog        ||  Sha: 9ab1858  ||  Sha: 9ab1858  ||  #: 1 Size: 1   === Match
kc-out-of-date ||  Sha: e07f57d  ||  Sha: 2ceafd9  ||  #: 4 Size: 2   === OUT OF DATE == 1 branch(es)
```


# Latest Releases
* No longer needs .json map file.
* Now accepts command line arguments.

#Future Releases
* More optimized calls
* More cusomization
* More options
* Node API, for example, herogit.call({user: "Cjones90"})
