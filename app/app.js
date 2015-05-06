(function (ng) {
    "use strict";
    var app = ng.module('app', ['ui.bootstrap', 'ngRoute', 'oc.lazyLoad']);

    app.controller({
        MainCtrl: MainCtrl,
        KefirCtrl: KefirCtrl,
        RxCtrl: RxCtrl,
        BaconCtrl: BaconCtrl,
        AsyncplifyCtrl: AsyncplifyCtrl
    });

    function AsyncplifyCtrl($scope, $http, asyncplify, title) {
        $scope.title = title;
        $scope.results = [];
        $scope.search = 'asyncplify';

        function searchGithub(term) {
            var deferred = $http.get("https://api.github.com/search/repositories", {
                responseType: 'json',
                params: {
                    q: term,
                    sort: 'stars',
                    order: 'desc'
                }
            });

            return asyncplify
                .fromPromise(deferred)
                .map(function(response){ return response.data['items'] });
        }

        $scope.$fromBinderAsyncplify('doSearch')
            .map(function (term) {
                return term;
            })
            .flatMap(searchGithub)
            .$assignProperty($scope, 'results');
    }

    AsyncplifyCtrl.$inject = ['$scope', '$http', 'asyncplify', 'title'];

    function BaconCtrl($scope, $http, bacon, title) {
        $scope.title = title;
        $scope.results = [];
        $scope.search = 'bacon';

        function searchGithub(term) {
            var deferred = $http.get("https://api.github.com/search/repositories", {
                responseType: 'json',
                params: {
                    q: term,
                    sort: 'stars',
                    order: 'desc'
                }
            });

            return bacon
                .fromPromise(deferred)
                .map(function(response){ return response.data['items'] });
        }

        $scope.$fromBinderBacon('doSearch')
            .map(function (term) {
                return term;
            })
            .flatMapLatest(searchGithub)
            .$assignProperty($scope, 'results');
    }

    BaconCtrl.$inject = ['$scope', '$http', 'bacon', 'title'];

    function KefirCtrl($scope, $http, kefir, title) {
        $scope.title = title;
        $scope.results = [];
        $scope.search = 'kefir';

        function searchGithub(term) {
            var deferred = $http.get("https://api.github.com/search/repositories", {
                responseType: 'json',
                params: {
                    q: term,
                    sort: 'stars',
                    order: 'desc'
                }
            });

            return kefir
                .fromPromise(deferred)
                .map(function(response){ return response.data['items'] });
        }

        $scope.$fromBinderKefir('doSearch')
            .map(function (term) {
                return term;
            })
            .flatMapLatest(searchGithub)
            .$assignProperty($scope, 'results');
    }

    KefirCtrl.$inject = ['$scope', '$http', 'kefir', 'title'];

    function RxCtrl($scope, $rootScope, $http, rx, title) {
        $scope.title = title;
        $scope.results = [];
        $scope.search = 'rx';

        function searchGithub(term) {
            var deferred = $http.get("https://api.github.com/search/repositories", {
                responseType: 'json',
                params: {
                    q: term,
                    sort: ['updated', 'stars'],
                    order: 'desc'
                }
            });

            return rx.Observable
                .fromPromise(deferred)
                .map(function(response){ return response.data['items'] });
        }

        $scope.$fromBinderRx('doSearch')
            .map(function (term) {
                return term;
            })
            .flatMapLatest(searchGithub)
            .$assignProperty($scope, 'results');
    }

    RxCtrl.$inject = ['$scope', '$rootScope', '$http', 'rx', 'title'];

    function MainCtrl($scope, $timeout, $location) {
        this.tabs = [
            {
                title: 'Rx',
                url: 'rx'
            },
            {
                title: 'Bacon',
                url: 'bacon'
            },
            {
                title: 'Kefir',
                url: 'kefir'
            },
            {
                title: 'Asyncplify',
                url: 'asyncplify'
            }
        ];

        this.go = go;

        function go(url) {
            $timeout(function () {
                $location.path(url);
            }, 0);
        }
    }

    MainCtrl.$inject = ['$scope', '$timeout', '$location'];

    app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/rx', {
                templateUrl: 'app/partials/frp/view.html',
                controller: 'RxCtrl',
                controllerAs: 'r',
                resolve: {
                    'angular-rx': function ($ocLazyLoad) {
                        return $ocLazyLoad.load(
                            {
                                name: "angular-rx",
                                files: ["app/frp/angular-rx.js"]
                            }
                        )
                    },
                    title: function () {
                        return 'Rx';
                    }
                }
            })
            .when('/bacon', {
                templateUrl: 'app/partials/frp/view.html',
                controller: 'BaconCtrl',
                controllerAs: 'b',
                resolve: {
                    'angular-bacon': function ($ocLazyLoad) {
                        return $ocLazyLoad.load(
                            {
                                name: "angular-bacon",
                                files: ["app/frp/angular-bacon.js"]
                            }
                        )
                    },
                    title: function () {
                        return 'Bacon';
                    }
                }
            })
            .when('/kefir', {
                templateUrl: 'app/partials/frp/view.html',
                controller: 'KefirCtrl',
                controllerAs: 'k',
                resolve: {
                    'angular-kefir': function ($ocLazyLoad) {
                        return $ocLazyLoad.load(
                            {
                                name: "angular-kefir",
                                files: ["app/frp/angular-kefir.js"]
                            }
                        )
                    },
                    title: function () {
                        return 'Kefir'
                    }
                }
            })
            .when('/asyncplify', {
                templateUrl: 'app/partials/frp/view.html',
                controller: 'AsyncplifyCtrl',
                controllerAs: 'a',
                resolve: {
                    'angular-asyncplify': function ($ocLazyLoad) {
                        return $ocLazyLoad.load(
                            {
                                name: "angular-asyncplify",
                                files: ["app/frp/angular-asyncplify.js"]
                            }
                        )
                    },
                    title: function () {
                        return 'Asyncplify';
                    }
                }
            })
            .otherwise({redirectTo: '/rx'});
    }]);

}(angular));