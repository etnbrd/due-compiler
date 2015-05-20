var ghAPI = require('github'),
    gh = new ghAPI({version: "3.0.0"});

// gh.authenticate({
//   type: "token",
//   token: "f1d140ccffc8f8173364a90c1859738c2f186feb"
// });

function displayResults() {
  console.log(arguments)
}

gh.search.repos({
  q: "language:Javascript"
}, function(err, res) {
  console.log("Javascript projects : " + res.total_count + (res.incomplete_results?"+":""));
})

gh.search.repos({
  q: "language:Javascript express"
}, function(err, res) {
  console.log("Javascript projects with the key word express : " + res.total_count + (res.incomplete_results?"+":""));
})

gh.search.repos({
  q: "language:Javascript express web application"
}, function(err, res) {
  console.log("Javascript projects with the key word express : " + res.total_count + (res.incomplete_results?"+":""));
})

/*

  There is 10000+ Javascript projects containing the keywords express (most are framework, boilerplate or plugin)
  There is 139 Javascript projects containing the keywords express web application
  Over this projects, I hand-picked a few that are real (or demo) web applications without mongodb :




Defer pattern

  matzipan/Socket.io-Webchat  -> not conform with our specification (defer pattern)
  mkdskd/StudDetails  -> no fluxions because not conform with our specifications (defer pattern)
    app.get('/',routes.index);
    app.get('/login',routes.login);
    app.get('/home',routes.home);
    app.get('/add',routes.add);
    app.get('/search',routes.search);
    app.get('/delete',routes.delete);
    app.get('/signout',routes.signout);
  RandomiNetworks/hellyeah  -> no fluxions because not conform with our specifications (defer pattern)
    app.get('/', routes.index);
    app.get('/users', user.list);
  balazsbela/restexample ->  no fluxions because not conform with our specifications (defer pattern)
    app.use('/', routes);
    app.use('/users', users);
  jeff-blaisdell/node-deploy  -> no fluxions because not conform with our specifications (defer pattern)
  Thomas-Adams/todo-manager  -> no fluxions because not conform with our specifications (defer pattern)
    app.get('/', routes.index);
    app.post('/categories', category.save);
    app.delete('/categories/:id', category.delete);
    app.get('/categories', category.list);
    app.get('/categories/:id', category.edit);
    app.put('/categories/:id', category.update);
  finspin/todoapp -> no fluxions because not conform with our specifications  (defer pattern)
  icarusysuper/jungle  -> no fluxions because not conform with our specifications (defer pattern)
  rnbennett/node-wdw-services -> no fluxions because not conform with our specifications (defer pattern)

Old express version

  vivek-mishra/node-express   -> use an old express version, code no longer valid/relevant
  fatkahawai/rpi-webapp-express  -> use an old express version, code no longer valid/relevant
  msaads/Express-HelloWorld  -> use an old express version, code no longer valid/relevant

Miscellaneous shit

  gitchandu/demo-expressjs    -> no fluxion : static site.
  brulejr/weather    -> uses hapi instead of express (???)
  hogaur/express  -> use mongodb
  garciadanny/chat-app -> use redis
  gevans22/Utila_Dive_Maps -> passport session management : smells bad
  tgroshon/kyazma-express-demo  -> not conform with our specifications STRANGENESS
    // load controllers
    require('./lib/boot')(app, { verbose: !module.parent });
  





  micahroberson/readyappspush -> only one fluxion
  prateek01/chatty -> poorly maintained codebase





J'ai commencé à faire des recherches de projets susceptible d'être compilé.

Il y a environ 16 800 000 projets sur github (je suis pas sûr du chiffre)
1 000 521 projets dont le langage principale est javascript
10 083 projets Javascript contenant le mot clés express
139 projets Javascript contenant les mots clés express web application

Sur ces 139 projets, j'ai selectionné à la main ceux qui n'utilisaient pas Mongodb, ou qui n'était pas des templates.

Je me retrouve avec 20 projets.
Sur ces 20 projets, j'en ai éliminé 18 pour diverses raisons :

Pour 9 projets, c'est à cause de ce pattern :
app.get('/',routes.index);
Sans inférence de type, je ne peux pas savoir que routes.index contient une fonction, et je ne peux donc pas détecter le point de rupture.
Ce pattern est largement considéré comme une bonne pratique.
3 projets utilisent une vieille version d'Express sans la documenter.
6 projets ont été éliminé pour diverses raisons (site static, redis, mongodb, mauvais design ...)

Il reste 2 projets :
  micahroberson/readyappspush
  prateek01/chatty

Je ne les ai pas encore compilé, mais avec peu de modification sur le compilateur, je peux peut être arriver à quelque chose.

Globalement, je m'aperçois que soit l'application est trop grosse, et donc va utiliser le pattern décrit plus haut, soit l'application est trop petite, et elle perds tout intérêt.

Aucune application n'utilise le pattern
var app = require('express')();
C'est pratique pour le compilateur parce qu'on est sûr que app contient bien un serveur express.
Mais c'est considéré comme une mauvaise pratique.


*/