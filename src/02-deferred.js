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
	// 在jquery.callbacks基础上，为回调函数增加了状态，并提供多个状态的回调函数
    Deferred: function( func ) {
            var tuples = [
                            // action, add listener, listener list, final state
                            [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
                            [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
                            [ "notify", "progress", jQuery.Callbacks("memory") ]
                    ],
                    state = "pending",
                    // 异步队列的只读副本
                    promise = {
                            // 返回异步队列的状态
            				state: function() {
                                    return state;
                            },
                            // 用于将函数添加到成功队列和失败队列中
                            always: function() {
                                    deferred.done( arguments ).fail( arguments );
                                    return this;
                            },
                            // 接收三个可选的过滤函数为参数，用于过滤当前异步队列的状态和参数，并返回一个新的异步队列只读副本，可以理解为一个defer过滤器
                            then: function( /* fnDone, fnFail, fnProgress */ ) {
                                    var fns = arguments;
                                    return jQuery.Deferred(function( newDefer ) {
                                            jQuery.each( tuples, function( i, tuple ) {
                                                    var action = tuple[ 0 ],
                                                            fn = fns[ i ];
                                                    deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
                                                            function() {
                                                                    var returned = fn.apply( this, arguments );
                                                                    if ( returned && jQuery.isFunction( returned.promise ) ) {
                                                                    	//返回值是defer对象，将newDefer的执行放到该defer对象的的回调函数列表里
                                                                            returned.promise()
                                                                                    .done( newDefer.resolve )
                                                                                    .fail( newDefer.reject )
                                                                                    .progress( newDefer.notify );
                                                                    } else {
                                                                    		// 返回值returned作为参数，newDefer依赖外层执行结果
                                                                            newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
                                                                    }
                                                            } :
                                                            // 如果传入的参数不是函数，newDefer的执行依赖外层调用者的状态
                                                            newDefer[ action ]
                                                    );
                                            });
                                            fns = null;
                                    }).promise();
                            },
                            // 如果没有传入obj，返回当前异步队列只读副本promise ,如果传入参数obj，将只读的副本promise的方法添加到obj中
                            promise: function( obj ) {
                                    return obj != null ? jQuery.extend( obj, promise ) : promise;
                            }
                    },
                    deferred = {};

            // Keep pipe for back-compat
            promise.pipe = promise.then;

            // 为异步队列增加相应得回调函数列表方法
            jQuery.each( tuples, function( i, tuple ) {
                    var list = tuple[ 2 ],
                            stateString = tuple[ 3 ];

                    // promise[ done | fail | progress ] = list.add
                    promise[ tuple[1] ] = list.add;

                    if ( stateString ) {
                    		//在异步队列添加三个成功/失败的回调方法，分别设置其状态，并禁用另外一个回调函数列表，同时锁定通知回调列表
                            list.add(function() {
                                    // state = [ resolved | rejected ]
                                    state = stateString;

                            // 这一块写法很有记录，通过i^1来取反，让另为一个回调列表禁用
                            }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
                    }

                    // 触发成功，失败，通知消息回调函数列表的触发方法
                    deferred[ tuple[0] ] = list.fire;
                    deferred[ tuple[0] + "With" ] = list.fireWith;
            });

            // 为异步队列添加只读方法
            promise.promise( deferred );

            // 如果传入func，把deferred设置为上下文，同时把deferred作为参数传进去，这样在func执行过程，仍然可以调用异步队列
            if ( func ) {
                    func.call( deferred, deferred );
            }

            return deferred;
    },

    // 传入多个异步队列为参数，返回一个新的主异步队列的只读副本，将追踪传入异步队列的所有状态
    when: function( subordinate /* , ..., subordinateN */ ) {
            var i = 0,
                    resolveValues = core_slice.call( arguments ),
                    length = resolveValues.length,

                    // 如果length=1，则remaining=1，如果length不等于1，参数为deferred对象，则返回参数的长度
                    remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

                    // 如果参数只有一个，则使用已有的deferred对象，否则则新建一个
                    deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

                    updateFunc = function( i, contexts, values ) {
                    	    // 返回一个函数，为了创建一个闭包，保持i的值，返回到数组
                            return function( value ) {
                                    contexts[ i ] = this;
                                    // 返回多个参数的情况，则直接转换成数组，返回一个话，直接返回当前值
                                    values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
                                    if( values === progressValues ) {
                                            deferred.notifyWith( contexts, values );
                                    } else if ( !( --remaining ) ) {
                                    		// 所有的Deferred的对象都已经触发完
                                            deferred.resolveWith( contexts, values );
                                    }
                            };
                    },

                    progressValues, progressContexts, resolveContexts;

            // 处理多个参数的情况
            if ( length > 1 ) {
                    progressValues = new Array( length );
                    progressContexts = new Array( length );
                    resolveContexts = new Array( length );
                    for ( ; i < length; i++ ) {
                            if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
                            		// 只处理deferred的对象
                                    resolveValues[ i ].promise()
                                            .done( updateFunc( i, resolveContexts, resolveValues ) )
                                            .fail( deferred.reject )
                                            .progress( updateFunc( i, progressContexts, progressValues ) );
                            } else {
                                    --remaining;
                            }
                    }
            }

            // 针对上面最后一个循环走到else分支的场景，同时可以看到返回回调列表返回值的数组
            if ( !remaining ) {
                    deferred.resolveWith( resolveContexts, resolveValues );
            }

            return deferred.promise();
    }
});