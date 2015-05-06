(function (ng, Bacon) {
    var app = ng.module('angular-bacon', []);

    app.factory('bacon', BaconFactory);

    // TODO: It's should be removed if you don't use a lazy loader like an ocLazyLoad.
    // It related https://github.com/ocombe/ocLazyLoad/issues/177
    app.run(function ($rootScope) {
        setProperties($rootScope);
    });

    app.config(Config);

    function setProperties(obj) {
        return Object.defineProperties(obj, {
            '$fromBinderBacon': {
                value: fromBinder,
                enumerable: false
            },
            '$fromEventBacon': {
                value: fromEvent,
                enumerable: false
            },
            '$fromWatchBacon': {
                value: fromWatch,
                enumerable: false
            }
        });
    }

    function fromBinder(functionName, listener) {
        var scope = this;

        return Bacon.fromBinder(function (emitter) {
            scope[functionName] = function () {
                if (listener) {
                    emitter(listener.apply(this, arguments));
                } else if (arguments.length === 1) {
                    emitter(arguments[0]);
                } else {
                    emitter(arguments);
                }
            };

            return function () {
                delete scope[functionName];
            };
        });
    }

    function fromEvent(eventName) {
        var scope = this;

        return Bacon.fromBinder(function (emitter) {
            var unSubscribe = scope.$on(eventName, function (ev, data) {
                emitter(data);
            });

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    function fromWatch(watchExpression, objectEquality) {
        var scope = this;

        return Bacon.fromBinder(function (emitter) {
            function listener(newValue, oldValue) {
                emitter({oldValue: oldValue, newValue: newValue});
            }

            var unSubscribe = scope.$watch(watchExpression, listener, objectEquality);

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    /**
     * Bacon factory
     * @param $window
     * @param $parse
     * @returns {*}
     * @constructor
     */
    function BaconFactory($window, $parse) {
        var bacon = $window.Bacon;

        bacon.Observable.prototype.$assignProperty = function (scope, property) {
            var setter = $parse(property).assign;

            var unSubscribe = this.onValue(function (value) {
                return !scope.$$phase ? scope.$apply(function () {
                    setter(scope, value);
                }) : setter(scope, value);
            });

            scope.$on('$destroy', unSubscribe);

            return this;
        };

        bacon.Observable.prototype.$assignProperties = function (scope, properties) {
            var self = this;

            properties.forEach(function (property) {
                self.$assignProperty(scope, property);
            });

            return self;
        };

        return bacon;
    }

    BaconFactory.$inject = ['$window', '$parse'];

    function Config($provide) {
        $provide.decorator('$rootScope', Decorator);

        function Decorator($delegate, bacon) {
            setProperties($delegate.constructor.prototype);

            return $delegate;
        }

        Decorator.$inject = ['$delegate', 'kefir'];
    }

    Config.$inject = ['$provide'];

}(angular, Bacon));