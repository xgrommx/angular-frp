(function (ng, Asyncplify) {
    var app = ng.module('angular-asyncplify', []);

    app.factory('asyncplify', AsyncplifyFactory);

    // TODO: It's should be removed if you don't use a lazy loader like an ocLazyLoad.
    // It related https://github.com/ocombe/ocLazyLoad/issues/177
    app.run(function ($rootScope) {
        setProperties($rootScope);
    });

    app.config(Config);

    function setProperties(obj) {
        return Object.defineProperties(obj, {
            '$fromBinderAsyncplify': {
                value: fromBinder,
                enumerable: false
            },
            '$fromEventAsyncplify': {
                value: fromEvent,
                enumerable: false
            },
            '$fromWatchAsyncplify': {
                value: fromWatch,
                enumerable: false
            }
        });
    }

    function fromBinder(functionName, listener) {
        var scope = this;

        var emitter = Asyncplify.subject();

        scope[functionName] = function () {
            if (listener) {
                emitter.emit(listener.apply(this, arguments));
            } else if (arguments.length === 1) {
                emitter.emit(arguments[0]);
            } else {
                emitter.emit(arguments);
            }
        };

        return emitter;
    }

    function fromEvent(eventName) {
        var scope = this;

        var emitter = Asyncplify.subject();

        var unSubscribe = scope.$on(eventName, function (ev, data) {
            emitter.emit(data);
        });

        scope.$on('$destroy', unSubscribe);

        return emitter;
    }

    function fromWatch(watchExpression, objectEquality) {
        var scope = this;

        var emitter = Asyncplify.subject();

        function listener(newValue, oldValue) {
            emitter.emit({oldValue: oldValue, newValue: newValue});
        }

        var unSubscribe = scope.$watch(watchExpression, listener, objectEquality);

        scope.$on('$destroy', unSubscribe);

        return emitter;
    }

    /**
     * Kefir factory
     * @param $window
     * @param $parse
     * @returns {*}
     * @constructor
     */
    function AsyncplifyFactory($window, $parse) {
        var asyncplify = $window.Asyncplify;

        asyncplify.prototype.$assignProperty = function (scope, property) {
            var setter = $parse(property).assign;

            var unSubscribe = this.subscribe(function (value) {
                return !scope.$$phase ? scope.$apply(function () {
                    setter(scope, value);
                }) : setter(scope, value);
            });

            scope.$on('$destroy', unSubscribe.close.bind(unSubscribe));

            return this;
        };

        asyncplify.prototype.$assignProperties = function (scope, properties) {
            var self = this;

            properties.forEach(function (property) {
                self.$assignProperty(scope, property);
            });

            return self;
        };

        return asyncplify;
    }

    AsyncplifyFactory.$inject = ['$window', '$parse'];

    function Config($provide) {
        $provide.decorator('$rootScope', Decorator);

        function Decorator($delegate) {
            setProperties($delegate.constructor.prototype);

            return $delegate;
        }

        Decorator.$inject = ['$delegate', 'kefir'];
    }

    Config.$inject = ['$provide'];

}(angular, Asyncplify));