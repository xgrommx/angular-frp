(function (ng, Kefir) {
    var app = ng.module('angular-kefir', []);

    app.factory('kefir', KefirFactory);

    // TODO: It's should be removed if you don't use a lazy loader like an ocLazyLoad.
    // It related https://github.com/ocombe/ocLazyLoad/issues/177
    app.run(function ($rootScope) {
        setProperties($rootScope);
    });

    app.config(Config);

    function setProperties(obj) {
        return Object.defineProperties(obj, {
            '$fromBinderKefir': {
                value: fromBinder,
                enumerable: false
            },
            '$fromEventKefir': {
                value: fromEvent,
                enumerable: false
            },
            '$fromWatchKefir': {
                value: fromWatch,
                enumerable: false
            }
        });
    }

    function fromBinder(functionName, listener) {
        var scope = this;

        return Kefir.stream(function (emitter) {
            scope[functionName] = function () {
                if (listener) {
                    emitter.emit(listener.apply(this, arguments));
                } else if (arguments.length === 1) {
                    emitter.emit(arguments[0]);
                } else {
                    emitter.emit(arguments);
                }
            };

            return function () {
                delete scope[functionName];
            };
        });
    }

    function fromEvent(eventName) {
        var scope = this;

        return Kefir.stream(function (emitter) {
            var unSubscribe = scope.$on(eventName, function (ev, data) {
                emitter.emit(data);
            });

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    function fromWatch(watchExpression, objectEquality) {
        var scope = this;

        return Kefir.stream(function (emitter) {
            function listener(newValue, oldValue) {
                emitter.emit({oldValue: oldValue, newValue: newValue});
            }

            var unSubscribe = scope.$watch(watchExpression, listener, objectEquality);

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    /**
     * Kefir factory
     * @param $window
     * @param $parse
     * @returns {*}
     * @constructor
     */
    function KefirFactory($window, $parse) {
        var kefir = $window.Kefir;

        kefir.Observable.prototype.$assignProperty = function (scope, property) {
            var setter = $parse(property).assign;

            var unSubscribe = this.onValue(function (value) {
                return !scope.$$phase ? scope.$apply(function () {
                    setter(scope, value);
                }) : setter(scope, value);
            });

            scope.$on('$destroy', unSubscribe.offValue.bind(unSubscribe));

            return this;
        };

        kefir.Observable.prototype.$assignProperties = function (scope, properties) {
            var self = this;

            properties.forEach(function (property) {
                self.$assignProperty(scope, property);
            });

            return self;
        };

        return kefir;
    }

    KefirFactory.$inject = ['$window', '$parse'];

    function Config($provide) {
        $provide.decorator('$rootScope', Decorator);

        function Decorator($delegate) {
            setProperties($delegate.constructor.prototype);

            return $delegate;
        }

        Decorator.$inject = ['$delegate', 'kefir'];
    }

    Config.$inject = ['$provide'];

}(angular, Kefir));