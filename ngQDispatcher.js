(function(angular) {

    var actionFullNamePrefix = 'qDispatcher:';

    angular
        .module('ngQDispatcher', [])
        .factory('qDispatcher', ['$q', '$rootScope', function($q, $rootScope) {

            function qDispatcher(originalPromise, baseActionName, extra) {
                var self = this;

                self.baseActionName = baseActionName || '';
                self.extra = extra || {};
                var deferred = {
                    'default': $q.defer()
                };

                var getExtendedDispatcher = function(parentValue) {
                    return angular.extend(self, {
                        emit: function(actionName, value) {

                            value = value || parentValue;
                            handleAction(actionName, value);
                        }
                    });
                };

                var handleAction = function(actionName, value) {

                    actionName = actionName || 'default';

                    if (deferred[actionName] != undefined) {
                        var fullActionName = actionName == 'default' ? baseActionName : baseActionName + ':' + actionName;

                        deferred[actionName].promise.then(function(value) {
                            $rootScope.$emit(actionFullNamePrefix + fullActionName, value, getExtendedDispatcher(value));
                        });
                        deferred[actionName].resolve(value);
                    }
                };

                self.on = function(actionName, callback) {
                    actionName = actionName || 'default';

                    if (deferred[actionName] == undefined) {
                        deferred[actionName] = $q.defer();
                    }

                    deferred[actionName].promise.then(callback);
                    return self;
                };

                self.then = function(callback, errback, progressback) {
                    deferred['default'].promise.then(
                        function(value) {
                            callback(value, getExtendedDispatcher(value));
                        },
                        function (reason) {
                            errback(reason, getExtendedDispatcher(reason));
                        },
                        function (info) {
                            progressback(info, getExtendedDispatcher(info));
                        }
                    );
                    return self;
                };

                self['catch'] = function(callback) {
                    deferred['default'].promise.catch(function(reason) {
                        callback(reason, getExtendedDispatcher(reason));
                    });
                    return self;
                };

                self['finally'] = function(callback) {
                    deferred['default'].promise.finally(function(value) {
                        callback(value, getExtendedDispatcher(value));
                    });
                    return self;
                };

                originalPromise
                    .then(function(value) {
                        handleAction(false, value);
                    });
            }

            qDispatcher.defer = function(baseActionName, extra) {
                var defer = $q.defer();
                defer.promise = new qDispatcher(defer.promise, baseActionName, extra);
                return defer;
            };

            // @todo: implement this
            //qDispatcher.syncDefer = function() {
            //
            //};

            qDispatcher.on = function(actionName, callback) {
                $rootScope.$on(actionFullNamePrefix + actionName, function(event, data, qD) {
                    qD = angular.extend({
                        emit: function(aName, value) {

                            qDispatcher.emit(actionName + ':' + aName, value || data);
                        }
                    }, qD);

                    callback(data, qD);
                });

                return qDispatcher;
            };

            qDispatcher.emit = function(fullActionName, value) {
                $rootScope.$emit(actionFullNamePrefix + fullActionName, value);
            };

            return qDispatcher;
        }]);

})(angular);
