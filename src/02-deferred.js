// jquery 1.8.3 源码 907---1242行

// 缓存Callbacks中options转换成的缓存对象，属性为标记字符串，属性值为true
var optionsCache = {};

// 将字符串格式的标记转换成对象格式的标记
// createOptions('unique memory')==>{once:true,memory:true}
function createOptions( options ) {
        var object = optionsCache[ options ] = {};
        jQuery.each( options.split( core_rspace ), function( _, flag ) {
                object[ flag ] = true;
        });
        return object;
}
// 根据不同的标记组合创建一个回调函数俩别
// 默认回调函数列表的行为类似于事件监听函数，能够被触发多次，options为以下可选值的组合或者单个

// once==> 确保回调函数只调用1次 即fire只会执行一次
// memory==>记录上一次触发回调函数的列表，之后添加的回调函数都将用记录的参数值立即调用<br/>
// unique==> 确保一个回调函数只能被添加一次  
// stopOnFalse==>当某个回调函数返回false时中断执行  

jQuery.Callbacks = function( options ) {

        // 如果为字符串，则先尝试从缓存对象中获取，如果获取不到，则调用工具函数createOptions做转换
        options = typeof options === "string" ?
                ( optionsCache[ options ] || createOptions( options ) ) :
                jQuery.extend( {}, options );

        var // 最后触发的值(for non-forgettable lists)
                memory,
                // 标识是否已经执行过回调函数
                fired,
                // 标识回调函数是否在执行中
                firing,
                // 待执行的第一个回调函数下标
                firingStart,
                // 待执行的最后一个回调函数下标
                firingLength,
                // 当前正在执行回调函数的下标
                firingIndex,
                // 存放回调函数的数组
                list = [],
                // 在可重复触发，正在执行的列表上，重复触发时，将上下文和参数放在数组中。如果once为true，则stack为空数组
                stack = !options.once && [],
                // 实际触发回调函数的工具函数，data==>data[0] 上下文 data[1] 参数
                fire = function( data ) {
        				//如果设置了memory标识，则该变量存储本次参数，供下次调用
                        memory = options.memory && data;
                        fired = true;
                        firingIndex = firingStart || 0;
                        firingStart = 0;
                        firingLength = list.length;
                        firing = true;
                        for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                                // 如果设置了stopOnFalse，并且某个回调函数返回false，则停止后续回调列表调用
                        		if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
                                        memory = false; // To prevent further calls using add
                                        break;
                                }
                        }
                        firing = false;
                        if ( list ) {
                                if ( stack ) {
                                	    //不是once，并且执行列表上还有重复触发的函数，则依次触发
                                        if ( stack.length ) {
                                                fire( stack.shift() );
                                        }
                                } else if ( memory ) {
                                	    // 如果为momory模式，则清空数组，可使后续添加的回调函数立即执行
                                        list = [];
                                } else {
                                		//为once模式，只执行一次
                                        self.disable();
                                }
                        }
                },
                // 这才是callbacks真身
                self = {
                        // 添加一个或一组回调函数到函数列表里
                        add: function() {
                        		//这儿判断是为了disable后，调用该函数没作用
                                if ( list ) {
                                        // 备份数组的长度，
                                        var start = list.length;
                                        //调用匿名函数添加列表，之前这个函数作为一个工具函数来处理，这样处理，代码逻辑更好理解
                                        (function add( args ) {
                                                jQuery.each( args, function( _, arg ) {
                                                        var type = jQuery.type( arg );
                                                        if ( type === "function" ) {
                                                                if ( !options.unique || !self.has( arg ) ) {
                                                                        list.push( arg );
                                                                }
                                                        } else if ( arg && arg.length && type !== "string" ) {
                                                                // 递归添加函数列表
                                                                add( arg );
                                                        }
                                                });
                                        })( arguments );
                                        // 如果回调函数正在执行中，则修正结束的下标，使得新添加的函数也能执行
                                        if ( firing ) {
                                                firingLength = list.length;
                                        // 如果在momory模式下，并且已经执行完了，修正其实下标，然后直接调用fire执行刚添加的回调函数
                                        } else if ( memory ) {
                                                firingStart = start;
                                                fire( memory );
                                        }
                                }
                                return this;
                        },
                        // 从回调函数列表中移除一个或者一组回调函数
                        remove: function() {
                                if ( list ) {
                                        jQuery.each( arguments, function( _, arg ) {
                                                var index;
                                                while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
                                                        list.splice( index, 1 );
                                                        // 如果回调函数正在执行
                                                        if ( firing ) {
                                                        		// 移除前让长度减一，避免找不到最后一个元素
                                                                if ( index <= firingLength ) {
                                                                        firingLength--;
                                                                }
                                                                // 如果待移除的下标小于正在执行的下标，则修正firingIndex，确保不会漏执行掉回调函数
                                                                if ( index <= firingIndex ) {
                                                                        firingIndex--;
                                                                }
                                                        }
                                                }
                                        });
                                }
                                return this;
                        },
                        // 从回调函数列表中移除一个回调函数
                        has: function( fn ) {
                                return jQuery.inArray( fn, list ) > -1;
                        },
                        // 移除回调函数列表中的所有回调函数
                        empty: function() {
                                list = [];
                                return this;
                        },
                        // 禁用回调函数列表，使它不再做任何事
                        disable: function() {
                                list = stack = memory = undefined;
                                return this;
                        },
                        //返回回调列表是否被禁用
                        disabled: function() {
                                return !list;
                        },
                        // 在非memory直接禁用，所以该lock是针对memory模式的，lock阻止fire内部fire的场景
                        lock: function() {
                                stack = undefined;
                                if ( !memory ) {
                                        self.disable();
                                }
                                return this;
                        },
                        // 判断回调函数是否锁定
                        locked: function() {
                                return !stack;
                        },
                        // 使用知道的上下文和参数触发回调函数列表
                        fireWith: function( context, args ) {
                                args = args || [];
                                args = [ context, args.slice ? args.slice() : args ];
                                //取保没有执行过，或者stack部位空的情况
                                if ( list && ( !fired || stack ) ) {
                                		//正在执行的情况下触发该情况，则说明回调函数中包含了触发的函数，直接把压栈，待执行完递归fire
                                        if ( firing ) {
                                                stack.push( args );
                                        } else {
                                        		//处理stack里面的fire
                                                fire( args );
                                        }
                                }
                                return this;
                        },
                        // 简化调用入参，符合面向对象的接口隔离原则。
                        fire: function() {
                                self.fireWith( this, arguments );
                                return this;
                        },
                        // 返回该回调函数列表是否已经执行
                        fired: function() {
                                return !!fired;
                        }
                };

        return self;
};
jQuery.extend({

    Deferred: function( func ) {
            var tuples = [
                            // action, add listener, listener list, final state
                            [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
                            [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
                            [ "notify", "progress", jQuery.Callbacks("memory") ]
                    ],
                    state = "pending",
                    promise = {
                            state: function() {
                                    return state;
                            },
                            always: function() {
                                    deferred.done( arguments ).fail( arguments );
                                    return this;
                            },
                            then: function( /* fnDone, fnFail, fnProgress */ ) {
                                    var fns = arguments;
                                    return jQuery.Deferred(function( newDefer ) {
                                            jQuery.each( tuples, function( i, tuple ) {
                                                    var action = tuple[ 0 ],
                                                            fn = fns[ i ];
                                                    // deferred[ done | fail | progress ] for forwarding actions to newDefer
                                                    deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
                                                            function() {
                                                                    var returned = fn.apply( this, arguments );
                                                                    if ( returned && jQuery.isFunction( returned.promise ) ) {
                                                                            returned.promise()
                                                                                    .done( newDefer.resolve )
                                                                                    .fail( newDefer.reject )
                                                                                    .progress( newDefer.notify );
                                                                    } else {
                                                                            newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
                                                                    }
                                                            } :
                                                            newDefer[ action ]
                                                    );
                                            });
                                            fns = null;
                                    }).promise();
                            },
                            // Get a promise for this deferred
                            // If obj is provided, the promise aspect is added to the object
                            promise: function( obj ) {
                                    return obj != null ? jQuery.extend( obj, promise ) : promise;
                            }
                    },
                    deferred = {};

            // Keep pipe for back-compat
            promise.pipe = promise.then;

            // Add list-specific methods
            jQuery.each( tuples, function( i, tuple ) {
                    var list = tuple[ 2 ],
                            stateString = tuple[ 3 ];

                    // promise[ done | fail | progress ] = list.add
                    promise[ tuple[1] ] = list.add;

                    // Handle state
                    if ( stateString ) {
                            list.add(function() {
                                    // state = [ resolved | rejected ]
                                    state = stateString;

                            // [ reject_list | resolve_list ].disable; progress_list.lock
                            }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
                    }

                    // deferred[ resolve | reject | notify ] = list.fire
                    deferred[ tuple[0] ] = list.fire;
                    deferred[ tuple[0] + "With" ] = list.fireWith;
            });

            // Make the deferred a promise
            promise.promise( deferred );

            // Call given func if any
            if ( func ) {
                    func.call( deferred, deferred );
            }

            // All done!
            return deferred;
    },

    // Deferred helper
    when: function( subordinate /* , ..., subordinateN */ ) {
            var i = 0,
                    resolveValues = core_slice.call( arguments ),
                    length = resolveValues.length,

                    // the count of uncompleted subordinates
                    remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

                    // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
                    deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

                    // Update function for both resolve and progress values
                    updateFunc = function( i, contexts, values ) {
                            return function( value ) {
                                    contexts[ i ] = this;
                                    values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
                                    if( values === progressValues ) {
                                            deferred.notifyWith( contexts, values );
                                    } else if ( !( --remaining ) ) {
                                            deferred.resolveWith( contexts, values );
                                    }
                            };
                    },

                    progressValues, progressContexts, resolveContexts;

            // add listeners to Deferred subordinates; treat others as resolved
            if ( length > 1 ) {
                    progressValues = new Array( length );
                    progressContexts = new Array( length );
                    resolveContexts = new Array( length );
                    for ( ; i < length; i++ ) {
                            if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
                                    resolveValues[ i ].promise()
                                            .done( updateFunc( i, resolveContexts, resolveValues ) )
                                            .fail( deferred.reject )
                                            .progress( updateFunc( i, progressContexts, progressValues ) );
                            } else {
                                    --remaining;
                            }
                    }
            }

            // if we're not waiting on anything, resolve the master
            if ( !remaining ) {
                    deferred.resolveWith( resolveContexts, resolveValues );
            }

            return deferred.promise();
    }
});