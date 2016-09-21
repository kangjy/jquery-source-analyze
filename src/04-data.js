// Jquery数据缓存Data，源码1509---1847
// 以一种安全的方式为DOM元素附加类型的数据，避免在javascript对象和DOM元素之间出现循环引用而导致的内存泄漏
// 在jquery内部，数据缓存模块为队列模块、动画模块、样式操作模块、事件系统提供基础功能
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;
jQuery.extend({
	// 全局缓存对象
	cache: {},

	deletedIds: [],

	// Remove at next major release (1.9/2.0)
	uuid: 0,

	// 每个jquery副本的唯一标识，值为jQuery+版本号+随机数，去掉其中的非数字字符
	expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
		"applet": true
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},
	// elem==>与数据关联的的DOM元素  name==>设置或读取的数据名 data==>设置的数据值 pvt==>表示设置的数据是内部数据还是自定义数据，该选项值在jq内部使用
	data: function( elem, name, data, pvt /* Internal Use Only */ ) {
		//节点elem是否支持设置数据，如果不支持，直接返回
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var thisCache, ret,
			
			internalKey = jQuery.expando,
			getByName = typeof name === "string",

			// 判断是否是node节点
			isNode = elem.nodeType,

			// 如果是dom元素，为了避免js和DOM元素之间的循环引用，导致内存溢出，使用全局缓存对象
			cache = isNode ? jQuery.cache : elem,

			// 尝试取出关联ID,对于DOM元素，返回elem[jQuery.expando],对于js对象，返回jQuery.expando
			id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

		// getByName && data === undefined 表示在读数据
		// (!id || !cache[id] || (!pvt && !cache[id].data)如果关联id不存在，没有数据，后面的如果为真，即为没有数据，也没有自定义
		if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
			// 尝试在没有任何数据上的对象上读取数据
			return;
		}

		if ( !id ) {
			if ( isNode ) {
				//对于DOM元素，先从删除的id获取 ，如果没有，jQuery.guid自动加1，并附在DOM元素上
				elem[ internalKey ] = id = jQuery.deletedIds.pop() || jQuery.guid++;
			} else {
				//对于javascript对象，关联id就是jQuery.expando
				id = internalKey;
			}
		}

		if ( !cache[ id ] ) {
			//如果缓存对象不存在，则初始化为空对象
			cache[ id ] = {};

			if ( !isNode ) {
				//如果是js对象，重写toJSON方法，避免执行JSON.stringify()时暴露缓存数据
				cache[ id ].toJSON = jQuery.noop;
			}
		}

		// 如果name是对象或函数，则把参数name直接合并到已经缓存的数据对象中
		if ( typeof name === "object" || typeof name === "function" ) {
			if ( pvt ) {
				cache[ id ] = jQuery.extend( cache[ id ], name );
			} else {
				cache[ id ].data = jQuery.extend( cache[ id ].data, name );
			}
		}

		thisCache = cache[ id ];

		// 如果pvt为true，则变量指向cache[ id ]，如果为false，值指向cache[ id ].data,保证变量总是指向正确存储数据的对象
		if ( !pvt ) {
			if ( !thisCache.data ) {
				thisCache.data = {};
			}

			thisCache = thisCache.data;
		}

		if ( data !== undefined ) {
			//转成驼峰式，便于在读取的时候，无论传入连字符还是驼峰式都可以读取到对应的数据
			thisCache[ jQuery.camelCase( name ) ] = data;
		}

		// 如果参数name是字符串，返回该name对应的值，备注这一块好多书写的都是很说有问题，说data是undefined才会走这个逻辑，是错误的，请注意
		if ( getByName ) {

			// 尝试读取参数name的数据
			ret = thisCache[ name ];

			if ( ret == null ) {

				// 如果没有找到，转换参数为驼峰
				ret = thisCache[ jQuery.camelCase( name ) ];
			}
		} else {
			// 如果什么都不传入，返回缓存对象
			ret = thisCache;
		}

		return ret;
	},
	// 移除通过jquery.data设置的数据
	// elem --- > 待移除的DOM元素和javascript对象  name--->待移除的数居名 pvt--移除的是内部数据，还是自定义数据
	removeData: function( elem, name, pvt /* Internal Use Only */ ) {
		// 如果elem不支持设置数据，则立刻返回
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var thisCache, i, l,

			isNode = elem.nodeType,

			// See jQuery.data for more information
			cache = isNode ? jQuery.cache : elem,
			id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

		// 如果数据缓存对象不存在，则返回
		if ( !cache[ id ] ) {
			return;
		}

		if ( name ) {
			// 如果pvt为true，则指向内部数据缓存对象，否则指向自定义数据对象
			thisCache = pvt ? cache[ id ] : cache[ id ].data;

			if ( thisCache ) {

				// Support array or space separated string names for data keys
				if ( !jQuery.isArray( name ) ) {

					// try the string as a key before any manipulation
					if ( name in thisCache ) {
						name = [ name ];
					} else {

						// split the camel cased version by spaces unless a key with the spaces exists
						name = jQuery.camelCase( name );
						if ( name in thisCache ) {
							name = [ name ];
						} else {
							name = name.split(" ");
						}
					}
				}

				for ( i = 0, l = name.length; i < l; i++ ) {
					delete thisCache[ name[i] ];
				}

				// If there is no data left in the cache, we want to continue
				// and let the cache object itself get destroyed
				if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
					return;
				}
			}
		}

		// See jQuery.data for more information
		if ( !pvt ) {
			delete cache[ id ].data;

			// Don't destroy the parent cache unless the internal data object
			// had been the only thing left in it
			if ( !isEmptyDataObject( cache[ id ] ) ) {
				return;
			}
		}

		// Destroy the cache
		if ( isNode ) {
			jQuery.cleanData( [ elem ], true );

		// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
		} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
			delete cache[ id ];

		// When all else fails, null
		} else {
			cache[ id ] = null;
		}
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return jQuery.data( elem, name, data, true );
	},

	// 判断DOM元素是否可以设置数据
	acceptData: function( elem ) {
		//在embed，object(false除外)，applet元素上附加属性会抛出异常
		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// 默认返回true，最后一个判断判断如果为flash，则返回true
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var parts, part, attr, name, l,
			elem = this[0],
			i = 0,
			data = null;

		// 如果未传入参数，则返回匹配元素的第一个上的全部数据
		if ( key === undefined ) {
			if ( this.length ) {
				// 调用JQuery.data: function( elem, name, data, pvt)返回该elem上绑定的全部数据
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					//没有解析第一个匹配元素HTML5的属性data-
					attr = elem.attributes;
					for ( l = attr.length; i < l; i++ ) {
						name = attr[i].name;

						if ( !name.indexOf( "data-" ) ) {
							// 解析属性data-中含有的数据
							name = jQuery.camelCase( name.substring(5) );
							
							dataAttr( elem, name, data[ name ] );
						}
					}
					// 解析完设置自定义数据parsedAttrs为true
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// 如果参数key为对应，则遍历匹配的元素的集合，为每个匹配元素上批量设置数据
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		parts = key.split( ".", 2 );
		parts[1] = parts[1] ? "." + parts[1] : "";
		part = parts[1] + "!";

		return jQuery.access( this, function( value ) {
			//循环为选中的元素调用次方法
			if ( value === undefined ) {
				//如果没有传入value，则认为是读取单个数据，触发自定义数据
				data = this.triggerHandler( "getData" + part, [ parts[0] ] );

				// 事件监听函数没有值，则尝试从自定义数据缓存中获取
				if ( data === undefined && elem ) {
					data = jQuery.data( elem, key );
					data = dataAttr( elem, key, data );
				}
				//如果仍然取不到值，则去掉命名空间在尝试读取
				return data === undefined && parts[1] ?
					this.data( parts[0] ) :
					data;
			}
			//传入key和value的场景，则为每个匹配元素设置任意类型的数据
			parts[1] = value;
			this.each(function() {
				var self = jQuery( this );

				self.triggerHandler( "setData" + part, parts );
				jQuery.data( this, key, value );
				self.triggerHandler( "changeData" + part, parts );
			});
		}, null, value, arguments.length > 1, null, false );
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});
// 解析HTML5属性data-,并把解析结果放到DOM元素关联的自定义数据缓存对象中
function dataAttr( elem, key, data ) {
	// 只有参数data没有值得情况下，才会解析html5属性，优先读取自定义数据对象
	if ( data === undefined && elem.nodeType === 1 ) {
		//增加前缀data-，并把驼峰式参数转换成连字符。
		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
				data === "false" ? false :
				data === "null" ? null :
				// Only convert to a number if it doesn't change the string
				+data + "" === data ? +data :
				rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// 放到关联的自定义对象中，jquery.cache[id].data上
			jQuery.data( elem, key, data );

		} else {
			//如果返回值不是字符串，则返回未定义
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}