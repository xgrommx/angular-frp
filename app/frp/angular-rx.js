(function (ng, Rx) {

    var app = ng.module('angular-rx', []);

    app.factory('rx', RxFactory);

    // TODO: It's should be removed if you don't use a lazy loader like an ocLazyLoad.
    // It related https://github.com/ocombe/ocLazyLoad/issues/177
    app.run(function ($rootScope) {
        setProperties($rootScope);
    });

    app.config(Config);

    function setProperties(obj) {
        return Object.defineProperties(obj, {
            '$fromBinderRx': {
                value: fromBinder,
                enumerable: false
            },
            '$fromEventRx': {
                value: fromEvent,
                enumerable: false
            },
            '$fromWatchRx': {
                value: fromWatch,
                enumerable: false
            }
        });
    }

    function fromBinder(functionName, listener) {
        var scope = this;

        return Rx.Observable.create(function (observer) {
            scope[functionName] = function () {
                if (listener) {
                    observer.onNext(listener.apply(this, arguments));
                } else if (arguments.length === 1) {
                    observer.onNext(arguments[0]);
                } else {
                    observer.onNext(arguments);
                }
            };

            return function () {
                delete scope[functionName];
            };
        });
    }

    function fromEvent(eventName) {
        var scope = this;

        return Rx.Observable.create(function (observer) {
            var unSubscribe = scope.$on(eventName, function (ev, data) {
                observer.onNext(data);
            });

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    function fromWatch(watchExpression, objectEquality) {
        var scope = this;

        return Rx.Observable.create(function (observer) {
            function listener(newValue, oldValue) {
                observer.onNext({oldValue: oldValue, newValue: newValue});
            }

            var unSubscribe = scope.$watch(watchExpression, listener, objectEquality);

            scope.$on('$destroy', unSubscribe);

            return unSubscribe;
        });
    }

    /**
     * Rx factory
     * @param $window
     * @param $parse
     * @returns {*}
     * @constructor
     */
    function RxFactory($window, $parse) {
        var rx = $window.Rx;

        rx.Observable.prototype.$assignProperty = function (scope, property) {
            var setter = $parse(property).assign;

            var unSubscribe = this.subscribe(function (value) {
                return !scope.$$phase ? scope.$apply(function () {
                    setter(scope, value);
                }) : setter(scope, value);
            });

            scope.$on('$destroy', unSubscribe.dispose.bind(unSubscribe));

            return this;
        };

        rx.Observable.prototype.$assignProperties = function (scope, properties) {
            var self = this;

            properties.forEach(function (property) {
                self.$assignProperty(scope, property);
            });

            return self;
        };

        return rx;
    }

    RxFactory.$inject = ['$window', '$parse'];

    function Config($provide) {
        $provide.decorator('$rootScope', Decorator);

        function Decorator($delegate) {
            setProperties($delegate.constructor.prototype);

            return $delegate;
        }

        Decorator.$inject = ['$delegate', 'rx'];
    }

    Config.$inject = ['$provide'];

}(angular, Rx));