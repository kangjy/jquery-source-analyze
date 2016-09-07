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

    // 在IE9以下的浏览器中\s不匹配不间断的空格\xA0
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

	// 使得jQuery.fn.init的实例可以访问构造函数jQuery的原型和属性
	jQuery.fn.init.prototype = jQuery.fn;
	// 参数列表 [deep] target [object...]
	// deep为是否进行深度合并,如果只有target,直接把方法合并到jQuery或jQuery.fnshang 
	jQuery.extend = jQuery.fn.extend = function() {
	    var options, name, src, copy, copyIsArray, clone,
	        target = arguments[0] || {},
	        i = 1,
	        length = arguments.length,
	        deep = false;

	    // 处理是否需要深度合并
	    if ( typeof target === "boolean" ) {
	        deep = target;
	        target = arguments[1] || {};
	        // 修正源对象的下标
	        i = 2;
	    }

	    // 如果目前对象不是对象和方法，统一替换为{}
	    if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
	        target = {};
	    }

	    // 如果没有传入源对象，则把目标对象置为jquery，同时将传入的对象当作源对象
	    if ( length === i ) {
	        target = this;
	        --i;
	    }

	    for ( ; i < length; i++ ) {
	        // 如果源对象为空，不处理
	        if ( (options = arguments[ i ]) != null ) {
	            for ( name in options ) {
	                src = target[ name ];
	                copy = options[ name ];

	             // 如果复制的值与目标对象相等，为了避免深度遍历死循环，不做操作
	                if ( target === copy ) {
	                    continue;
	                }

	                // 如果为深度合并，复制的值为对象和数组，则递归合并
	                if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
	                    if ( copyIsArray ) {
	                        copyIsArray = false;
	                        clone = src && jQuery.isArray(src) ? src : [];

	                    } else {
	                        clone = src && jQuery.isPlainObject(src) ? src : {};
	                    }

	                    // 源对象和目标对象不覆盖，深度复制
	                    target[ name ] = jQuery.extend( deep, clone, copy );

	                    // 不是深度合并，直接覆盖同名属性
	                } else if ( copy !== undefined ) {
	                    target[ name ] = copy;
	                }
	            }
	        }
	    }

	    // 返回目标源
	    return target;
	};

	jQuery.extend({
		// 用于释放jQuery对全局变量$的控制权，deep表示是否释放对jQuery的控制权
	    noConflict: function( deep ) {
	        if ( window.$ === jQuery ) {
	            window.$ = _$;
	        }

	        if ( deep && window.jQuery === jQuery ) {
	            window.jQuery = _jQuery;
	        }

	        return jQuery;
	    },

	    // Ready状态标记
	    isReady: false,

	    // Ready等待计数器
	    readyWait: 1,

	    // 延迟或恢复Ready触发，hold true为延迟执行， false为恢复
	    holdReady: function( hold ) {
	        if ( hold ) {
	            jQuery.readyWait++;
	        } else {
	            jQuery.ready( true );
	        }
	    },

	    // 执行ready事件监听函数列表readyList
	    ready: function( wait ) {

	        if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {

		        // 有延迟ready或者已经执行过了的情况
	            return;
	        }

	        // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
	        if ( !document.body ) {
	            return setTimeout( jQuery.ready, 1 );
	        }

	        // 标记ready事件就绪
	        jQuery.isReady = true;

	        // 防御性检测，如果jQuery.readyWait-1后仍大于0，说明ready事件延迟尚未全部恢复，则返回，等待再次执行jQuery.holdReady(false)
	        if ( wait !== true && --jQuery.readyWait > 0 ) {
	            return;
	        }

	        // document 事件监听函数上下文  jQuery指定了ready事件监听函数的列表
	        readyList.resolveWith( document, [ jQuery ] );

	        // 执行通过$(document).on("ready",handler)绑定的ready事件监听函数
	        if ( jQuery.fn.trigger ) {
	            jQuery( document ).trigger("ready").off("ready");
	        }
	    },

	    // 判断该obj是否为函数
	    isFunction: function( obj ) {
	        return jQuery.type(obj) === "function";
	    },
	    // 判断该obj是否为函数,在ie9之上可直接使用原生的判断
	    isArray: Array.isArray || function( obj ) {
	        return jQuery.type(obj) === "array";
	    },
	    // 通过检测特征属性window来判断传入的对象是否是window对象
	    isWindow: function( obj ) {
	        return obj != null && obj == obj.window;
	    },
	    // 判断obj是否为一个数字，首先会判断是否是一个数字，然后判断该数字是否是有限数字
	    isNumeric: function( obj ) {
	        return !isNaN( parseFloat(obj) ) && isFinite( obj );
	    },
	    // 用来判断参数内建的Javascript类型,如果参数为null或undefined,返回"null","undefined"
	    // 使用core_toString而不用obj.toString是防止某些obj重写该方法导致判断不准确
	    type: function( obj ) {
	        return obj == null ?
	            String( obj ) :
	        class2type[ core_toString.call(obj) ] || "object";
	    },
	    // 判断obj是否是一个简单对象，即通过对象直接量{}或new object()创建的
	    isPlainObject: function( obj ) {
	        // 必须是一个对象，不通过DOM节点和window对象
	        if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
	            return false;
	        }

	        try {
	            // obj.constructo 为false 对应的是对象直接量
	        	// 默认constructor都是原型属性，hasOwnProperty返回true,则可表明肯定自定义构造函数覆盖了constructor
	        	// isPrototypeOf 是Object原型上的特有属性，如果原型对象上没有该isPrototypeOf，则肯定不是object对象
	            if ( obj.constructor &&
	                !core_hasOwn.call(obj, "constructor") &&
	                !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
	                return false;
	            }
	        } catch ( e ) {
	            // IE8,9 Will throw exceptions on certain host objects #9897
	            return false;
	        }

	        // for in循环是会先循环实例属性，然后循环原型属性，如果循环的最后一个是原型属性，则不是new Object()

	        var key;
	        for ( key in obj ) {}

	        return key === undefined || core_hasOwn.call( obj, key );
	    },
	    // 检测obj是否为空对象
	    isEmptyObject: function( obj ) {
	        var name;
	        for ( name in obj ) {
	            return false;
	        }
	        return true;
	    },
	    //	接收一个字符串，抛出一个错误异常，开发插件可覆盖这个方法，来显示更多的错误信息
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
	    // data为格式良好的json字符串，返回解析后的javascript对象
	    parseJSON: function( data ) {
	        if ( !data || typeof data !== "string") {
	            return null;
	        }

	        // 移除开头和末尾的空白符，在ie6/7中，如果有空白符就不能正确的解析
	        data = jQuery.trim( data );

	        // 如果支持原生的解析，优先使用原生的
	        if ( window.JSON && window.JSON.parse ) {
	            return window.JSON.parse( data );
	        }

	        // 确保传入的字符串是一个真正的json字符串，从json2.js的逻辑中拷贝来的
	        if ( rvalidchars.test( data.replace( rvalidescape, "@" )
	                .replace( rvalidtokens, "]" )
	                .replace( rvalidbraces, "")) ) {

	            return ( new Function( "return " + data ) )();

	        }
	        jQuery.error( "Invalid JSON: " + data );
	    },

	    // 接收一个良好格式的XML字符串，返回解析后的XML文档
	    parseXML: function( data ) {
	        var xml, tmp;
	        if ( !data || typeof data !== "string" ) {
	            return null;
	        }
	        try {
	            if ( window.DOMParser ) { // Standard
	                tmp = new DOMParser();
	                xml = tmp.parseFromString( data , "text/xml" );
	            } else { 
	            	//低版本的ie使用ActiveXObject对象来解析
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
	    // 空函数，可以作为回调函数的默认值
	    noop: function() {},

	    // 全局作用域执行javascript代码
	    globalEval: function( data ) {
	        if ( data && core_rnotwhite.test( data ) ) {
	            // 在ie下直接执行execScript方法让javascript全局作用域执行
	            // 否则用匿名函数执行，上下文设置为window，因为在火狐中上下文为jquery
	            ( window.execScript || function( data ) {
	                window[ "eval" ].call( window, data );
	            } )( data );
	        }
	    },

	    // 转换连字符的字符串为驼峰式，用于CSS模块和数据缓存模块 camelCase('background-color')==>backgroundColor
	    camelCase: function( string ) {
	        return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	    },

	    nodeName: function( elem, name ) {
	        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	    },

	    // 静态方法each是一个通用的遍历迭代的方法，用于遍历数组和类数组对象，obj==>待遍历的对象，callback==>回调函数，数组每个元素都执行，args==>该参数会传递给回调函数
	    each: function( obj, callback, args ) {
	        var name,
	            i = 0,
	            length = obj.length,
	            // 判断obj是对象还是数组
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

	            // 如果没有传入参数参数args，则传入下标和属性名
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

	    // 用于移除字符串开头和结尾的空白符
	    trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
	        function( text ) {
	    		// 使用ES5新增的string方法
	            return text == null ?
	                "" :
	                core_trim.call( text );
	        } :

	        // 如果不支持ES5,则使用字符串替换的方式来移除空白字符
	        function( text ) {
	        	// text +"" 获取到text的字符串表示，然后用正则替换空白字符串
	            return text == null ?
	                "" :
	                ( text + "" ).replace( rtrim, "" );
	        },

	    // 将一个类数组转换成真正的数组 arr==> 待转换类型 results==>仅在jquery内部使用
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
	    // 在数组中查找指定的元素并返回其下标，如果为找到会返回-1 elem==>要查找的值 arr==>待遍历的数组 i==>指定查找的位置，默认为0
	    inArray: function( elem, arr, i ) {
	        var len;

	        if ( arr ) {
	            if ( core_indexOf ) {
	                return core_indexOf.call( arr, elem, i );
	            }

	            len = arr.length;
	            //	修正参数i，默认为0，如果小于0，则加上len
	            i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

	            for ( ; i < len; i++ ) {
	                // 如果i in arr返回false，说明数组是不连续的也就不需要和指定值elem比较了
	                if ( i in arr && arr[ i ] === elem ) {
	                    return i;
	                }
	            }
	        }

	        return -1;
	    },
	    // 合并第二个数组和类数组到第一个数组或类数组中
	    merge: function( first, second ) {
	        var l = second.length,
	            i = first.length,
	            j = 0;

	        if ( typeof l === "number" ) {
	            for ( ; j < l; j++ ) {
	                first[ i++ ] = second[ j ];
	            }

	        } else {
	        	// second 不是类数组，但是含有连续整形属性的对象
	            while ( second[j] !== undefined ) {
	                first[ i++ ] = second[ j++ ];
	            }
	        }

	        first.length = i;

	        return first;
	    },
	    // 用于查找数组中满足过滤函数的元素，原数组不受影响 inv==>为true是则返回一个不满足回调函数的元素数组
	    grep: function( elems, callback, inv ) {
	        var retVal,
	            ret = [],
	            i = 0,
	            length = elems.length;
	        inv = !!inv;

	        for ( ; i < length; i++ ) {
	            retVal = !!callback( elems[ i ], i );
	            if ( inv !== retVal ) {
	                ret.push( elems[ i ] );
	            }
	        }

	        return ret;
	    },

	    // 静态方法对数组中的每个元素或对象的每个属性调用回调函数，并把回调函数的返回值放的 一个新的数组中
	    map: function( elems, callback, arg ) {
	        var value, key,
	            ret = [],
	            i = 0,
	            length = elems.length,
	            // jquery objects are treated as arrays
	            isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

	        // 遍历数组
	        if ( isArray ) {
	            for ( ; i < length; i++ ) {
	                value = callback( elems[ i ], i, arg );

	                if ( value != null ) {
	                    ret[ ret.length ] = value;
	                }
	            }

	        // 遍历对象
	        } else {
	            for ( key in elems ) {
	                value = callback( elems[ key ], key, arg );

	                if ( value != null ) {
	                    ret[ ret.length ] = value;
	                }
	            }
	        }

	        // 优雅的实现数组二位数组降维，可以理解成[].concat([1,1])
	        return ret.concat.apply( [], ret );
	    },

	    //一个全局计数器，用与jquery事件模块和缓存模块
	    guid: 1,

	    // 接收一个函数，返回一个总是持有指定上下文的新函数
	    // proxy(fn,context)===>指定参数fn的上下文始终为参数context
	    // proxy(context,name)===>参数name为context的属性，指定参数name对应函数的上下文始终为context
	    proxy: function( fn, context ) {
	        var tmp, args, proxy;
	        // 针对以上场景的第二种场景
	        if ( typeof context === "string" ) {
	            tmp = fn[ context ];
	            context = fn;
	            fn = tmp;
	        }

	        // 确保fn是一个函数
	        if ( !jQuery.isFunction( fn ) ) {
	            return undefined;
	        }

	        // 收集其他的入参
	        args = core_slice.call( arguments, 2 );
	        // 创建一个代理函数，在函数中调用原生的fn，并通过apply来指定上下文，并通过闭包获取到之前收集到的参数
	        proxy = function() {
	            return fn.apply( context, args.concat( core_slice.call( arguments ) ) );
	        };

	        // 将代理函数和原始函数通过guid关联起来，便于移除函数是使用
	        proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	        return proxy;
	    },

	    //  elems==> 在jq源码中应用场景为this，fn==>函数 ，key==> 属性 ，value==>值，chainable ==>是否可以链式调用 ，emptyGet==> this中没有选中对象的返回值, pass==>是否为原始数据，如果为false，说明value是个函数 
	    access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
	        var exec,
	            bulk = key == null,
	            i = 0,
	            length = elems.length;

	        // 如果参数key是对象，则表示要设置多个属性，遍历参数key，遍历调用access方法，设置为可链式调用
	        if ( key && typeof key === "object" ) {
	            for ( i in key ) {
	                jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
	            }
	            chainable = 1;

	            // 设置一个属性
	        } else if ( value !== undefined ) {
	        	
	            exec = pass === undefined && jQuery.isFunction( value );
	            
	            //是否要批量执行，主要看fn的实现逻辑
	            if ( bulk ) {
	                if ( exec ) {
	                	// 执行$("#id").html(function(){return value})
	                    exec = fn;
	                    fn = function( elem, key, value ) {
	                        return exec.call( jQuery( elem ), value );
	                    };

	                    // fn直接调用整个elems
	                } else {
	                    fn.call( elems, value );
	                    fn = null;
	                }
	            }
	            //如果要批量执行fn，则递归循环elems，针对每个elems依次调用fn
	            if ( fn ) {
	                for (; i < length; i++ ) {
	                    fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
	                }
	            }

	            chainable = 1;
	        }

	        return chainable ?
	            elems :

	            // 为get取值，不要链式调用
	            bulk ?
	                fn.call( elems ) :
	                length ? fn( elems[0], key ) : emptyGet;
	    },
	    // 当前时间的毫秒显示的简写
	    now: function() {
	        return ( new Date() ).getTime();
	    }
	});
	
	jQuery.ready.promise = function( obj ) {
	    if ( !readyList ) {
	    	// 初始化jquery ready回调列表对象readyList
	        readyList = jQuery.Deferred();

	        // 在document加载完后执行ready
	        if ( document.readyState === "complete" ) {
	            // Handle it asynchronously to allow scripts the opportunity to delay ready
	            setTimeout( jQuery.ready, 1 );

	            // 标准浏览器支持DOMContentLoaded事件，使用时间处理
	        } else if ( document.addEventListener ) {
	            // 优先绑定DOMContentLoaded，不需要等所有静态资源都加载
	            document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

	            // 回退到window.onload事件绑定，所有的浏览器都支持
	            window.addEventListener( "load", jQuery.ready, false );

	            // If IE event model is used
	        } else {
	            // 优先绑定onreadystatechange，不需要等所有静态资源都加载
	            document.attachEvent( "onreadystatechange", DOMContentLoaded );

	            // 回退到window.onload事件绑定，所有的浏览器都支持
	            window.attachEvent( "onload", jQuery.ready );

	            //如果IE并且不是一个frame，针对ie9一下的版本
	            //不断地检查，看是否该文件已准备就绪
	            var top = false;

	            try {
	                top = window.frameElement == null && document.documentElement;
	            } catch(e) {}

	            if ( top && top.doScroll ) {
	                (function doScrollCheck() {
	                    if ( !jQuery.isReady ) {

	                        try {
	                            // http://javascript.nwbox.com/IEContentLoaded/
	                            top.doScroll("left");
	                        } catch(e) {
	                            return setTimeout( doScrollCheck, 50 );
	                        }

	                        // 执行回调函数
	                        jQuery.ready();
	                    }
	                })();
	            }
	        }
	    }
	    return readyList.promise( obj );
	};

	// 初始化class2type变量，供jquery.type使用
	jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	    class2type[ "[object " + name + "]" ] = name.toLowerCase();
	});

	// 初始化jquery查找上下文，同时触发document的ready事件 
	rootjQuery = jQuery(document);  

	// 清理回调函数，避免二次触发
	if ( document.addEventListener ) {
	  DOMContentLoaded = function() {
	    document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
	    jQuery.ready();
	  };

	} else if ( document.attachEvent ) {
	  DOMContentLoaded = function() {
	    if ( document.readyState === "complete" ) {
	      document.detachEvent( "onreadystatechange", DOMContentLoaded );
	      jQuery.ready();
	    }
	  };
	}

	return jQuery;

	})();