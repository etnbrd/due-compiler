require('jquery');
require('angular');
require('./js/bootstrap.min');
require('angular-animate');
require('moonridge-angular');

angular.module('MRTest', ['Moonridge', 'ngAnimate']).controller('testCtrl', function ($scope, fighter, $log,
                                                                                      moonridgeBackend, user) {

	var fighterLQ = fighter.liveQuery;

	angular.extend($scope, {
		limit: 6,
		oneLQ: fighterLQ().findOne().exec(),
		cLQ: fighterLQ().count().exec()
	});
//    $scope.LQ = fighterLQ().sort('health').limit(limit).skip(1).exec();
    $scope.LQ = fighterLQ().sort('health').limit($scope.limit).exec();

    $scope.LQ.promise.then(function (LQ) {
        console.log(LQ);    //LiveQuery
    });

    fighter.listPaths().then(function (paths) {
        console.log(paths);
    });

    $scope.LQ.on('create', function (LQ) {
        console.log('create event handler called');    //
    });

    $scope.LQ.on('remove', function (LQ) {
        console.log('remove event handler called');    //
    });

    $scope.admin = user.query().findOne().exec();

    $scope.changeQuery = function () {
        $scope.limit += 1;
        $scope.LQ = fighterLQ().sort('health').limit($scope.limit).exec();
    };

    $scope.hit = function (afighter) {
        afighter.health -= 1;
        fighter.update(afighter);
    };

    $scope.heal = function (afighter) {
        afighter.health += 1;
        fighter.update(afighter);
    };

    $scope.remove = fighter.remove;

    $scope.create = function () {
        fighter.create({name: $scope.name, health: $scope.health});
    };

    $scope.dropdownTexts = [
        "fighter's name",
        "fighter's health",
        false,
        "fighter's death",
        "fighter's owner",
        "fighter's _id",
        'version'
    ];

    console.log("user", moonridgeBackend.user);

    $scope.admin = function() {
        moonridgeBackend.auth({nick: 'admin'}).then(function(user){ //user === moonridgeBackend.user
            console.log("user", user);
            fighter.create({name: 'Jon Snow', health: 70});
            fighter.create({name: 'Littlefinger', health: 20});
            fighter.create({name: 'Roose Bolton', health: 35});
            fighter.create({name: 'Arya Stark', health: 50});
        });
    };

    $scope.user = function() {
        moonridgeBackend.auth({nick: 'testUser'});
    };

}).run(function($rootScope, $MR, $q) {
    var dfd = $q.defer();

    //Moonridge backend
    var MRB = $MR('local', dfd.promise, true);  //true indicates, that this backend should be used by default
    MRB.connectPromise.then(function(socket) {
        //you can hook up more events here
        socket.on('disconnect', function() {
            console.log("Ha disconnected!");
        });
    });

    dfd.resolve({url: 'http://localhost:8080'});
    //use an auth prop to be authenticated right from the start
    //dfd.resolve({url: 'http://localhost:8080', auth: {nick: 'admin'}});
    return MRB;


});
