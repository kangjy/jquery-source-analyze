// **jQuery源码分析**
//
// [首页](/jquery-annotated-source/) | [下一章](02-deferred.html)

//     jQuery JavaScript Library v1.8.3
//     http://jquery.com/
//     Includes Sizzle.js
//     http://sizzlejs.com/
//     Copyright 2012 jQuery Foundation and other contributors
//     Released under the MIT license
//     http://jquery.org/license
//     Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)

// ### 第一章: 框架核心
// ----------






// 传入window和undefined可以减少查找作用链，同时在压缩时可优化变量名
(function( window, undefined ) {
	
var
    // 对jQuery(document)的一个主要引用，在框架内使用
    rootjQuery,

 	// Dom Ready的异步队列(deferred)
    readyList,

    // 使用当前window的几个对象,避免window引用到其他作用域下的window下的对象
    document = window.document,
    location = window.location,
    navigator = window.navigator,

    // 临时保存jQuery，防止重写jQuery，主要在noConflict方法里面用到
    _jQuery = window.jQuery,

    // 临时保存$，防止重写$，主要在noConflict方法里面用到
    _$ = window.$,

    // 针对一些核心方法的映射，便于压缩时优化
    core_push = Array.prototype.push,
    core_slice = Array.prototype.slice,
    core_indexOf = Array.prototype.indexOf,
    core_toString = Object.prototype.toString,
    core_hasOwn = Object.prototype.hasOwnProperty,
    core_trim = String.prototype.trim,

    // 定义jQuery变量，在后面9453行中，把这个变量作为全局变量,并定义别名$
    jQuery = function( selector, context ) {
        // 内部完成实例化，省去了jquery构造函数的new，同时也可以看书$()返回的其实是jQuery.fn.init的一个实例
        return new jQuery.fn.init( selector, context, rootjQuery );
    },

    // 返回正则的源文本,匹配数字 
    // [\-+]? -|+|| (?:\d*\.|) .|2.|| 匹配数字 (?:[eE][\-+]?\d+|) 匹配 e+2|E2|e-2||
    core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,

    // 检查或清除空白字符 core_rnotwhite配置一个非空白字符 core_rspace匹配至少一个空白字符
    core_rnotwhite = /\S/,
    core_rspace = /\s+/,

    // Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

    // ^(?:[^#<]*(<[\w\W]+>)[^>]*$ 匹配html字符串，不以#开头,#防止xss注入(#9521), 
    // 没理解了加<的作用 #([\w\-]*)$) 匹配#开头的字符串
    // [xss参见](https://ttmm.io/tech/jquery-xss/)
    rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

    // 匹配独立的html标签</br> ^<(\w+)\s*\/?>  匹配<a/>|<a  >|<a>  (?:<\/\1>|)匹配</a> \1为第一捕获组即为(\w+)匹配的内容或者空内容

    rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

    // JSON转换用的正则表达式
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,

    // 在兼容驼峰式和连字符式样式名时候用到 rmsPrefix匹配-ms-，兼容ie rdashAlpha匹配 -任意数字和字符
    rmsPrefix = /^-ms-/,
    rdashAlpha = /-([\da-z])/gi,

    // 在jQuery.camelCase方法中用来做替换函数
    fcamelCase = function( all, letter ) {
        return ( letter + "" ).toUpperCase();
    },

    // The ready event handler and self cleanup method
    DOMContentLoaded = function() {
        if ( document.addEventListener ) {
            document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
            jQuery.ready();
        } else if ( document.readyState === "complete" ) {
            // 针对IE9一下的浏览器做兼容性bug
            // 在ie9一下只有readyState=complete才能确保dom树加载完成Loaded状态有些情况下回报错


            // [ie readyState详见](https://msdn.microsoft.com/zh-cn/library/system.windows.forms.webbrowserreadystate.aspx?cs-save-lang=1&cs-lang=vb#code-snippet-1)
            document.detachEvent( "onreadystatechange", DOMContentLoaded );
            jQuery.ready();
        }
    },

    // [[Class]] -> type pairs 这个个人感觉对2的理解应该是to,而非二维数组
    class2type = {};

	jQuery.fn = jQuery.prototype = {
		// 为了$("#id") instanceof $ 的结果为true,方便开发人员判断类型
	    constructor: jQuery,
	    init: function( selector, context, rootjQuery ) {
	        var match, elem, ret, doc;

	        // 分支1 可以转化成false，直接返回jQuery对象，length为0 $(""),<br/>
	        // $(null), $(undefined), $(false)
	        if ( !selector ) {
	            return this;
	        }

	        // 分支2 dom元素 Handle $(DOMElement)

	        //[nodeType 详见](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)
	        if ( selector.nodeType ) {
	        	//设置第一个元素和context指向该dom元素
	            this.context = this[0] = selector;
	            this.length = 1;
	            //返回jquery对象
	            return this;
	        }

	        if ( typeof selector === "string" ) {
	            if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
	                // 假设该字符是HTML片段，跳过正则检查，有可能匹配到`<div></p>`
	                match = [ null, selector, null ];

	            } else {
	            	// abch<span>==>[abch<span>,<span>,undefined]
	            	// #aa==>[#aa,undefined,aa]
	                matched = rquickExpr.exec( selector );
	            }

	            // Match html or make sure no context is specified for #id
	            if ( match && (match[1] || !context) ) {

	                // 分支3 单独标签
	                if ( match[1] ) {
	                	// context如果是jquery对象，则返回第一个dom节点
	                    context = context instanceof jQuery ? context[0] : context;
	                    // context 若不存在返回document，若context存在顶层document，则优先使用document
	                    // 这儿修正context为普通对象的doc，避免doc返回对象解决 #8950bug
	                    doc = ( context && context.nodeType ? context.ownerDocument || context : document );

	                    // scripts is true for back-compat
	                    selector = jQuery.parseHTML( match[1], doc, true );
	                    if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
	                    	// 针对 `$('<div>',{'class':test});`的场景，attr的调用场景如下

	                    	// `if ( pass && jQuery.isFunction( jQuery.fn[ name ] ) ) {`
                       		// `return jQuery( elem )[ name ]( value );`
                			// `}`
	                        this.attr.call( selector, context, true );
	                    }

	                    return jQuery.merge( this, selector );

	                    // 分支4 #id
	                } else {
	                    elem = document.getElementById( match[2] );

	                    // 检查parentNode属性，在 Blackberry 4.6 会返回不存在文档中的节点#6963
	                    if ( elem && elem.parentNode ) {
	                        // 在ie6,7等某些浏览器中getElementById可能会按照属性name查找
	                        if ( elem.id !== match[2] ) {
	                            return rootjQuery.find( selector );
	                        }
	                        this.length = 1;
	                        this[0] = elem;
	                    }

	                    this.context = document;
	                    this.selector = selector;
	                    return this;
	                }

	                // 分支5 选择器表达式
	            } else if ( !context || context.jquery ) {
	            	//没有指定上下文，或者上下文是jqueyr对象
	                return ( context || rootjQuery ).find( selector );

	                // 创建一个包含context的jquery对象，然后执行find
	            } else {
	                return this.constructor( context ).find( selector );
	            }

	            // 分支6 函数 是对$(document).ready(fn)的简写
	        } else if ( jQuery.isFunction( selector ) ) {
	            return rootjQuery.ready( selector );
	        }
	        //分支7 jquery对象
	        if ( selector.selector !== undefined ) {
	            this.selector = selector.selector;
	            this.context = selector.context;
	        }
	        //为jquery对象，则返回更新selector和context的jquery对象
	        return jQuery.makeArray( selector, this );
	    },

	    // 用来记录jQuery查找和过滤Dom元素的时的选择表达式，方便调试 $('div').find('p').selector===>div p
	    selector: "",

	    // 当前jquery的版本
	    jquery: "1.8.3",

	    // jquery类数组的长度
	    length: 0,

	    // 和length功能一样，优先使用length
	    size: function() {
	        return this.length;
	    },
	    // 把当前jquery转换成真正的数组，jquery对象是类数组对象，具体看参照(Javascript权威指南7.8节)
	    toArray: function() {
	        return core_slice.call( this );
	    },

	    // 返回当前jquery中指定位置的元素或包含全部元素的数组
	    get: function( num ) {
	        return num == null ?

	            // 如果不传参，返回全部元素的数组
	            this.toArray() :

	            // 如果num为负数，则从元素集合末尾计算
	            ( num < 0 ? this[ this.length + num ] : this[ num ] );
	    },

	    // 创建一个新的空jQuery对象，然后把这个Dom元素放到jquery对象中，返回jquery的引用
	    // elems==>元素数组或类数组对象 name==>产生元素数组的jquery方法名  selector==>修正原型的selector的值 都是便于调试
	    pushStack: function( elems, name, selector ) {

	        
	        var ret = jQuery.merge( this.constructor(), elems );

	        // 形成一个链式栈，新对象位于栈顶
	        ret.prevObject = this;

	        ret.context = this.context;

	        if ( name === "find" ) {
	            ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
	        } else if ( name ) {
	            ret.selector = this.selector + "." + name + "(" + selector + ")";
	        }
	        return ret;
	    },

	    // 遍历当前jquery，在每个元素都执行回调函数
	    each: function( callback, args ) {
	        return jQuery.each( this, callback, args );
	    },
	    // 页面加载完成执行的回调函数
	    ready: function( fn ) {

	        jQuery.ready.promise().done( fn );

	        return this;
	    },
	    // 返回指定指定位置的元素，返回的也是jquery对象
	    eq: function( i ) {
	        i = +i;
	        return i === -1 ?
	            this.slice( i ) :
	            this.slice( i, i + 1 );
	    },
		// 返回第一个元素
	    first: function() {
	        return this.eq( 0 );
	    },
	    // 返回最后一个元素
	    last: function() {
	        return this.eq( -1 );
	    },
	    // 遍历jquery对象，在每个元素
	    slice: function() {
	        return this.pushStack( core_slice.apply( this, arguments ),
	            "slice", core_slice.call(arguments).join(",") );
	    },
	    // 遍历当前jquery对象，在每个元素上执行回调函数，将回调函数的返回值放到一个新的jquery对象
	    map: function( callback ) {
	        return this.pushStack( jQuery.map(this, function( elem, i ) {
	            return callback.call( elem, i, elem );
	        }));
	    },
	    // 结束当前链条中最近的筛选，返回之前的一个操作jquery对象
	    end: function() {
	        return this.prevObject || this.constructor(null);
	    },

	    push: core_push,
	    sort: [].sort,
	    splice: [].splice
	};

	// Give the init function the jQuery prototype for later instantiation
	jQuery.fn.init.prototype = jQuery.fn;

	jQuery.extend = jQuery.fn.extend = function() {
	    var options, name, src, copy, copyIsArray, clone,
	        target = arguments[0] || {},
	        i = 1,
	        length = arguments.length,
	        deep = false;

	    // Handle a deep copy situation
	    if ( typeof target === "boolean" ) {
	        deep = target;
	        target = arguments[1] || {};
	        // skip the boolean and the target
	        i = 2;
	    }

	    // Handle case when target is a string or something (possible in deep copy)
	    if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
	        target = {};
	    }

	    // extend jQuery itself if only one argument is passed
	    if ( length === i ) {
	        target = this;
	        --i;
	    }

	    for ( ; i < length; i++ ) {
	        // Only deal with non-null/undefined values
	        if ( (options = arguments[ i ]) != null ) {
	            // Extend the base object
	            for ( name in options ) {
	                src = target[ name ];
	                copy = options[ name ];

	                // Prevent never-ending loop
	                if ( target === copy ) {
	                    continue;
	                }

	                // Recurse if we're merging plain objects or arrays
	                if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
	                    if ( copyIsArray ) {
	                        copyIsArray = false;
	                        clone = src && jQuery.isArray(src) ? src : [];

	                    } else {
	                        clone = src && jQuery.isPlainObject(src) ? src : {};
	                    }

	                    // Never move original objects, clone them
	                    target[ name ] = jQuery.extend( deep, clone, copy );

	                    // Don't bring in undefined values
	                } else if ( copy !== undefined ) {
	                    target[ name ] = copy;
	                }
	            }
	        }
	    }

	    // Return the modified object
	    return target;
	};

	jQuery.extend({
	    noConflict: function( deep ) {
	        if ( window.$ === jQuery ) {
	            window.$ = _$;
	        }

	        if ( deep && window.jQuery === jQuery ) {
	            window.jQuery = _jQuery;
	        }

	        return jQuery;
	    },

	    // Is the DOM ready to be used? Set to true once it occurs.
	    isReady: false,

	    // A counter to track how many items to wait for before
	    // the ready event fires. See #6781
	    readyWait: 1,

	    // Hold (or release) the ready event
	    holdReady: function( hold ) {
	        if ( hold ) {
	            jQuery.readyWait++;
	        } else {
	            jQuery.ready( true );
	        }
	    },

	    // Handle when the DOM is ready
	    ready: function( wait ) {

	        // Abort if there are pending holds or we're already ready
	        if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
	            return;
	        }

	        // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
	        if ( !document.body ) {
	            return setTimeout( jQuery.ready, 1 );
	        }

	        // Remember that the DOM is ready
	        jQuery.isReady = true;

	        // If a normal DOM Ready event fired, decrement, and wait if need be
	        if ( wait !== true && --jQuery.readyWait > 0 ) {
	            return;
	        }

	        // If there are functions bound, to execute
	        readyList.resolveWith( document, [ jQuery ] );

	        // Trigger any bound ready events
	        if ( jQuery.fn.trigger ) {
	            jQuery( document ).trigger("ready").off("ready");
	        }
	    },

	    // See test/unit/core.js for details concerning isFunction.
	    // Since version 1.3, DOM methods and functions like alert
	    // aren't supported. They return false on IE (#2968).
	    isFunction: function( obj ) {
	        return jQuery.type(obj) === "function";
	    },

	    isArray: Array.isArray || function( obj ) {
	        return jQuery.type(obj) === "array";
	    },

	    isWindow: function( obj ) {
	        return obj != null && obj == obj.window;
	    },

	    isNumeric: function( obj ) {
	        return !isNaN( parseFloat(obj) ) && isFinite( obj );
	    },

	    type: function( obj ) {
	        return obj == null ?
	            String( obj ) :
	        class2type[ core_toString.call(obj) ] || "object";
	    },

	    isPlainObject: function( obj ) {
	        // Must be an Object.
	        // Because of IE, we also have to check the presence of the constructor property.
	        // Make sure that DOM nodes and window objects don't pass through, as well
	        if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
	            return false;
	        }

	        try {
	            // Not own constructor property must be Object
	            if ( obj.constructor &&
	                !core_hasOwn.call(obj, "constructor") &&
	                !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
	                return false;
	            }
	        } catch ( e ) {
	            // IE8,9 Will throw exceptions on certain host objects #9897
	            return false;
	        }

	        // Own properties are enumerated firstly, so to speed up,
	        // if last one is own, then all properties are own.

	        var key;
	        for ( key in obj ) {}

	        return key === undefined || core_hasOwn.call( obj, key );
	    },

	    isEmptyObject: function( obj ) {
	        var name;
	        for ( name in obj ) {
	            return false;
	        }
	        return true;
	    },

	    error: function( msg ) {
	        throw new Error( msg );
	    },

	    // data: string of html
	    // context (optional): If specified, the fragment will be created in this context, defaults to document
	    // scripts (optional): If true, will include scripts passed in the html string
	    parseHTML: function( data, context, scripts ) {
	        var parsed;
	        if ( !data || typeof data !== "string" ) {
	            return null;
	        }
	        // 非常巧妙的处理了parseHTML(data,true)的情况
	        if ( typeof context === "boolean" ) {
	            scripts = context;
	            context = 0;
	        }
	        context = context || document;

	        // 如果是单标签，直接返回创建好的dom节点
	        if ( (parsed = rsingleTag.exec( data )) ) {
	            return [ context.createElement( parsed[1] ) ];
	        }
	        //在DOM操作模块单独说明，
	        parsed = jQuery.buildFragment( [ data ], context, scripts ? null : [] );
	        return jQuery.merge( [],
	            (parsed.cacheable ? jQuery.clone( parsed.fragment ) : parsed.fragment).childNodes );
	    },

	    parseJSON: function( data ) {
	        if ( !data || typeof data !== "string") {
	            return null;
	        }

	        // Make sure leading/trailing whitespace is removed (IE can't handle it)
	        data = jQuery.trim( data );

	        // Attempt to parse using the native JSON parser first
	        if ( window.JSON && window.JSON.parse ) {
	            return window.JSON.parse( data );
	        }

	        // Make sure the incoming data is actual JSON
	        // Logic borrowed from http://json.org/json2.js
	        if ( rvalidchars.test( data.replace( rvalidescape, "@" )
	                .replace( rvalidtokens, "]" )
	                .replace( rvalidbraces, "")) ) {

	            return ( new Function( "return " + data ) )();

	        }
	        jQuery.error( "Invalid JSON: " + data );
	    },

	    // Cross-browser xml parsing
	    parseXML: function( data ) {
	        var xml, tmp;
	        if ( !data || typeof data !== "string" ) {
	            return null;
	        }
	        try {
	            if ( window.DOMParser ) { // Standard
	                tmp = new DOMParser();
	                xml = tmp.parseFromString( data , "text/xml" );
	            } else { // IE
	                xml = new ActiveXObject( "Microsoft.XMLDOM" );
	                xml.async = "false";
	                xml.loadXML( data );
	            }
	        } catch( e ) {
	            xml = undefined;
	        }
	        if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
	            jQuery.error( "Invalid XML: " + data );
	        }
	        return xml;
	    },

	    noop: function() {},

	    // Evaluates a script in a global context
	    // Workarounds based on findings by Jim Driscoll
	    // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	    globalEval: function( data ) {
	        if ( data && core_rnotwhite.test( data ) ) {
	            // We use execScript on Internet Explorer
	            // We use an anonymous function so that context is window
	            // rather than jQuery in Firefox
	            ( window.execScript || function( data ) {
	                window[ "eval" ].call( window, data );
	            } )( data );
	        }
	    },

	    // Convert dashed to camelCase; used by the css and data modules
	    // Microsoft forgot to hump their vendor prefix (#9572)
	    camelCase: function( string ) {
	        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	    },

	    nodeName: function( elem, name ) {
	        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	    },

	    // args is for internal usage only
	    each: function( obj, callback, args ) {
	        var name,
	            i = 0,
	            length = obj.length,
	            isObj = length === undefined || jQuery.isFunction( obj );

	        if ( args ) {
	            if ( isObj ) {
	                for ( name in obj ) {
	                    if ( callback.apply( obj[ name ], args ) === false ) {
	                        break;
	                    }
	                }
	            } else {
	                for ( ; i < length; ) {
	                    if ( callback.apply( obj[ i++ ], args ) === false ) {
	                        break;
	                    }
	                }
	            }

	            // A special, fast, case for the most common use of each
	        } else {
	            if ( isObj ) {
	                for ( name in obj ) {
	                    if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
	                        break;
	                    }
	                }
	            } else {
	                for ( ; i < length; ) {
	                    if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
	                        break;
	                    }
	                }
	            }
	        }

	        return obj;
	    },

	    // Use native String.trim function wherever possible
	    trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
	        function( text ) {
	            return text == null ?
	                "" :
	                core_trim.call( text );
	        } :

	        // Otherwise use our own trimming functionality
	        function( text ) {
	            return text == null ?
	                "" :
	                ( text + "" ).replace( rtrim, "" );
	        },

	    // results is for internal usage only
	    makeArray: function( arr, results ) {
	        var type,
	            ret = results || [];

	        if ( arr != null ) {
	            // The window, strings (and functions) also have 'length'
	            // Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
	            type = jQuery.type( arr );

	            if ( arr.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( arr ) ) {
	                core_push.call( ret, arr );
	            } else {
	                jQuery.merge( ret, arr );
	            }
	        }

	        return ret;
	    },

	    inArray: function( elem, arr, i ) {
	        var len;

	        if ( arr ) {
	            if ( core_indexOf ) {
	                return core_indexOf.call( arr, elem, i );
	            }

	            len = arr.length;
	            i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

	            for ( ; i < len; i++ ) {
	                // Skip accessing in sparse arrays
	                if ( i in arr && arr[ i ] === elem ) {
	                    return i;
	                }
	            }
	        }

	        return -1;
	    },

	    merge: function( first, second ) {
	        var l = second.length,
	            i = first.length,
	            j = 0;

	        if ( typeof l === "number" ) {
	            for ( ; j < l; j++ ) {
	                first[ i++ ] = second[ j ];
	            }

	        } else {
	            while ( second[j] !== undefined ) {
	                first[ i++ ] = second[ j++ ];
	            }
	        }

	        first.length = i;

	        return first;
	    },

	    grep: function( elems, callback, inv ) {
	        var retVal,
	            ret = [],
	            i = 0,
	            length = elems.length;
	        inv = !!inv;

	        // Go through the array, only saving the items
	        // that pass the validator function
	        for ( ; i < length; i++ ) {
	            retVal = !!callback( elems[ i ], i );
	            if ( inv !== retVal ) {
	                ret.push( elems[ i ] );
	            }
	        }

	        return ret;
	    },

	    // arg is for internal usage only
	    map: function( elems, callback, arg ) {
	        var value, key,
	            ret = [],
	            i = 0,
	            length = elems.length,
	            // jquery objects are treated as arrays
	            isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

	        // Go through the array, translating each of the items to their
	        if ( isArray ) {
	            for ( ; i < length; i++ ) {
	                value = callback( elems[ i ], i, arg );

	                if ( value != null ) {
	                    ret[ ret.length ] = value;
	                }
	            }

	            // Go through every key on the object,
	        } else {
	            for ( key in elems ) {
	                value = callback( elems[ key ], key, arg );

	                if ( value != null ) {
	                    ret[ ret.length ] = value;
	                }
	            }
	        }

	        // Flatten any nested arrays
	        return ret.concat.apply( [], ret );
	    },

	    // A global GUID counter for objects
	    guid: 1,

	    // Bind a function to a context, optionally partially applying any
	    // arguments.
	    proxy: function( fn, context ) {
	        var tmp, args, proxy;

	        if ( typeof context === "string" ) {
	            tmp = fn[ context ];
	            context = fn;
	            fn = tmp;
	        }

	        // Quick check to determine if target is callable, in the spec
	        // this throws a TypeError, but we will just return undefined.
	        if ( !jQuery.isFunction( fn ) ) {
	            return undefined;
	        }

	        // Simulated bind
	        args = core_slice.call( arguments, 2 );
	        proxy = function() {
	            return fn.apply( context, args.concat( core_slice.call( arguments ) ) );
	        };

	        // Set the guid of unique handler to the same of original handler, so it can be removed
	        proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	        return proxy;
	    },

	    // Multifunctional method to get and set values of a collection
	    // The value/s can optionally be executed if it's a function
	    access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
	        var exec,
	            bulk = key == null,
	            i = 0,
	            length = elems.length;

	        // Sets many values
	        if ( key && typeof key === "object" ) {
	            for ( i in key ) {
	                jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
	            }
	            chainable = 1;

	            // Sets one value
	        } else if ( value !== undefined ) {
	            // Optionally, function values get executed if exec is true
	            exec = pass === undefined && jQuery.isFunction( value );

	            if ( bulk ) {
	                // Bulk operations only iterate when executing function values
	                if ( exec ) {
	                    exec = fn;
	                    fn = function( elem, key, value ) {
	                        return exec.call( jQuery( elem ), value );
	                    };

	                    // Otherwise they run against the entire set
	                } else {
	                    fn.call( elems, value );
	                    fn = null;
	                }
	            }

	            if ( fn ) {
	                for (; i < length; i++ ) {
	                    fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
	                }
	            }

	            chainable = 1;
	        }

	        return chainable ?
	            elems :

	            // Gets
	            bulk ?
	                fn.call( elems ) :
	                length ? fn( elems[0], key ) : emptyGet;
	    },

	    now: function() {
	        return ( new Date() ).getTime();
	    }
	});

	jQuery.ready.promise = function( obj ) {
	    if ( !readyList ) {

	        readyList = jQuery.Deferred();

	        // Catch cases where $(document).ready() is called after the browser event has already occurred.
	        // we once tried to use readyState "interactive" here, but it caused issues like the one
	        // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
	        if ( document.readyState === "complete" ) {
	            // Handle it asynchronously to allow scripts the opportunity to delay ready
	            setTimeout( jQuery.ready, 1 );

	            // Standards-based browsers support DOMContentLoaded
	        } else if ( document.addEventListener ) {
	            // Use the handy event callback
	            document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

	            // A fallback to window.onload, that will always work
	            window.addEventListener( "load", jQuery.ready, false );

	            // If IE event model is used
	        } else {
	            // Ensure firing before onload, maybe late but safe also for iframes
	            document.attachEvent( "onreadystatechange", DOMContentLoaded );

	            // A fallback to window.onload, that will always work
	            window.attachEvent( "onload", jQuery.ready );

	            // If IE and not a frame
	            // continually check to see if the document is ready
	            var top = false;

	            try {
	                top = window.frameElement == null && document.documentElement;
	            } catch(e) {}

	            if ( top && top.doScroll ) {
	                (function doScrollCheck() {
	                    if ( !jQuery.isReady ) {

	                        try {
	                            // Use the trick by Diego Perini
	                            // http://javascript.nwbox.com/IEContentLoaded/
	                            top.doScroll("left");
	                        } catch(e) {
	                            return setTimeout( doScrollCheck, 50 );
	                        }

	                        // and execute any waiting functions
	                        jQuery.ready();
	                    }
	                })();
	            }
	        }
	    }
	    return readyList.promise( obj );
	};

	// Populate the class2type map
	jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	    class2type[ "[object " + name + "]" ] = name.toLowerCase();
	});

	// All jQuery objects should point back to these
	rootjQuery = jQuery(document);

	// Cleanup functions for the document ready method
	if ( document.addEventListener ) {
	  DOMContentLoaded = function() {
	    document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
	    jQuery.ready();
	  };

	} else if ( document.attachEvent ) {
	  DOMContentLoaded = function() {
	    // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
	    if ( document.readyState === "complete" ) {
	      document.detachEvent( "onreadystatechange", DOMContentLoaded );
	      jQuery.ready();
	    }
	  };
	}

	// The DOM ready check for Internet Explorer
	function doScrollCheck() {
	  if ( jQuery.isReady ) {
	    return;
	  }

	  // If IE is used, use the trick by Diego Perini
	  // http://javascript.nwbox.com/IEContentLoaded/
	  try {
	    document.documentElement.doScroll("left");
	  } catch(e) {
	    setTimeout( doScrollCheck, 1 );
	    return;
	  }

	  // and execute any waiting functions
	  jQuery.ready();
	}

	return jQuery;

	})();