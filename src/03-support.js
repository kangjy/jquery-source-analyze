// 浏览器功能测试   源码 1243---1508行
jQuery.support = (function() {

        var support,
                all,
                a,
                select,
                opt,
                input,
                fragment,
                eventName,
                i,
                isSupported,
                clickFn,
                div = document.createElement("div");

        // Setup
        div.setAttribute( "className", "t" );
        // 字符串前面的空格用于leadingWhitespace，来看浏览器是否会保留空格
        // <table></table>用于tbody测试项
        // <link/>用于htmlSerialize测试项
        // href='/a'用于hrefNormalized测试项
        div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

        // Support tests won't run in some limited or non-browser environments
        all = div.getElementsByTagName("*");
        a = div.getElementsByTagName("a")[ 0 ];
        if ( !all || !a || !all.length ) {
                return {};
        }

        // First batch of tests
        select = document.createElement("select");
        opt = select.appendChild( document.createElement("option") );
        input = div.getElementsByTagName("input")[ 0 ];
        // 用来测试style
        a.style.cssText = "top:1px;float:left;opacity:.5";
        support = {
                // 如果浏览器在使用innerHTML保留空格，则该项测试会返回true，为文本节点，在IE6-IE8为false，应用于clean方法中，具体在6356行
                leadingWhitespace: ( div.firstChild.nodeType === 3 ),
                
                // 在大部分浏览器中，tbody是可选的，只有在IE6,IE7下浏览器会自动插入tbody节点。在ie6-ie7下返回false，也应用于clean方法中
                tbody: !div.getElementsByTagName("tbody").length,

                // 在ie6-ie8下，该返回值为false，如果想要正确序列化link元素，许在外层包装一层div
                htmlSerialize: !!div.getElementsByTagName("link").length,

                // 是否可以通过dom属性style直接返回，在ie6-8中返回false，需要使用style.cssText访问内联样式
                style: /top/.test( a.getAttribute("style") ),

                // 在ie6-ie7下，属性href会返回加上域名的href。该测试项返回false
                hrefNormalized: ( a.getAttribute("href") === "/a" ),

                // 在ie6-ie8下不支持opacity，返回false
                // Use a regex to work around a WebKit issue. See #5145
                opacity: /^0.5/.test( a.style.opacity ),

                // 在IE下需要使用styleFloat来访问，在ie6-8下返回false，其他情况返回true
                cssFloat: !!a.style.cssFloat,

                // 在WebKit该值得默认值为空字符串，其他浏览器下均返回true
                checkOn: ( input.value === "on" ),

                // 在ie下，和早期Safari下，返回false，其他浏览器返回true
                optSelected: opt.selected,

                // 在ie6,7下，或许属性需要传入DOM属性名称，而不是HTML属性名，在ie6,7下返回false
                getSetAttribute: div.className !== "t",

                // 测试表单元素是否支持enctype，在火狐早期版本中返回false
                enctype: !!document.createElement("form").enctype,

                // 测试浏览器是否能正确的复制HTML5元素，在ie6-ie8下返回false
                html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

                // 验证是否支持w3c盒模型，在ie6-9怪癖模式会返回false
                boxModel: ( document.compatMode === "CSS1Compat" ),

                // 在后面的版本中会定义
                submitBubbles: true,
                changeBubbles: true,
                focusinBubbles: false,
                deleteExpando: true,
                noCloneEvent: true,
                inlineBlockNeedsLayout: false,
                shrinkWrapBlocks: false,
                reliableMarginRight: true,
                boxSizingReliable: true,
                pixelPosition: false
        };

       
        input.checked = true;
        // 复制节点是否会复制选中状态，在ie浏览器下不会复制，值返回false
        support.noCloneChecked = input.cloneNode( true ).checked;

       
        select.disabled = true;
        //在早期的Safari中如果select被禁用，子元素option会被自动禁用，只在早期Safari返回false
        support.optDisabled = !opt.disabled;

        // 是否允许删除DOM元素上的属性，在ie6-ie8下，该值为false
        try {
                delete div.test;
        } catch( e ) {
                support.deleteExpando = false;
        }

        if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
                div.attachEvent( "onclick", clickFn = function() {
                        // 检测复制Dom是否会连event一起复制。如果会复制则为false
                        support.noCloneEvent = false;
                });
                div.cloneNode( true ).fireEvent("onclick");
                div.detachEvent( "onclick", clickFn );
        }

        input = document.createElement("input");
        input.value = "t";
        input.setAttribute( "type", "radio" );
        //在ie浏览器下，如果设置input的type属性为radio，会导致value丢失，在ie浏览器下返回false
        support.radioValue = input.value === "t";

        input.setAttribute( "checked", "checked" );

        // #11217 - WebKit loses check when the name is after the checked attribute
        input.setAttribute( "name", "t" );

        div.appendChild( input );
        fragment = document.createDocumentFragment();
        fragment.appendChild( div.lastChild );

        // 在ie6，ie7下，不能正确的复制文档片段中选中的值，返回false
        support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

        // 添加的dom节点是否能保持选中状态，在ie6-7下返回false
        support.appendChecked = input.checked;

        fragment.removeChild( input );
        fragment.appendChild( div );

        // Technique from Juriy Zaytsev
        // http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
        // We only care about the case where non-standard event systems
        // are used, namely in IE. Short-circuiting here helps us to
        // avoid an eval call (in setAttribute) which can cause CSP
        // to go haywire. See: https://developer.mozilla.org/en/Security/CSP
        // 只针对ie测试，在ie6-8上，submit和change事件不会向上冒泡，返回为false，focusin其他浏览器不支持，只有ie6-8支持
        if ( div.attachEvent ) {
                for ( i in {
                        submit: true,
                        change: true,
                        focusin: true
                }) {
                        eventName = "on" + i;
                        isSupported = ( eventName in div );
                        if ( !isSupported ) {
                        		// 设置行内的事件监听函数，如果能转换成函数，则可认为支持事件冒泡
                                div.setAttribute( eventName, "return;" );
                                isSupported = ( typeof div[ eventName ] === "function" );
                        }
                        support[ i + "Bubbles" ] = isSupported;
                }
        }

        // Run tests that need a body at doc ready
        jQuery(function() {
                var container, div, tds, marginDiv,
                        divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;",
                        body = document.getElementsByTagName("body")[0];

                if ( !body ) {
                        // Return for frameset docs that don't have a body
                        return;
                }

                container = document.createElement("div");
                container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px";
                body.insertBefore( container, body.firstChild );

                // Construct the test element
                div = document.createElement("div");
                container.appendChild( div );

                div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
                tds = div.getElementsByTagName("td");
                tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
                // 判断空单元格是否支持可见高度offsetHeight
                isSupported = ( tds[ 0 ].offsetHeight === 0 );

                tds[ 0 ].style.display = "";
                tds[ 1 ].style.display = "none";

                // 测试空单元格的可见高度offsetHeight为0，在ie6-ie8和ie9的怪异模式下，该值为1
                support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

                // Check box-sizing and margin behavior
                div.innerHTML = "";
                div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
                support.boxSizing = ( div.offsetWidth === 4 );
                support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );

                // 向上检测，在jsdom中不支持该方法
                if ( window.getComputedStyle ) {
                        support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
                        support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

                        marginDiv = document.createElement("div");
                        //重置样式，避免不同浏览器下默认的样式，导致测试的结果不一样
                        marginDiv.style.cssText = div.style.cssText = divReset;
                        marginDiv.style.marginRight = marginDiv.style.width = "0";
                        div.style.width = "1px";
                        div.appendChild( marginDiv );
                        // 能否正确计算出样式marginRight(右外边距)，该测试主要用于2011年2月之前的webkit，它的getComputedStyle返回的getComputedStyle的marginRight是右边框距父元素右边框的距离
                        support.reliableMarginRight =
                                !parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
                }

                if ( typeof div.style.zoom !== "undefined" ) {
                        // 预先为元素设置width:1px;padding:1px，然后判断可见宽度是否为3，只有在ie6，ie7下可以通过inline来触发inline-block
                        div.innerHTML = "";
                        div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
                        // 只有在ie6,7下返回true
                        support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

                        // [详见](http://w3help.org/zh-cn/causes/RD1002)
                        div.style.display = "block";
                        div.style.overflow = "visible";
                        div.innerHTML = "<div></div>";
                        div.firstChild.style.width = "5px";
                        // 只有在ie6中，当子元素大于父元素时，父元素会被撑大，该值返回true
                        support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

                        container.style.zoom = 1;
                }

                // Null elements to avoid leaks in IE
                body.removeChild( container );
                container = div = tds = marginDiv = null;
        });

        // Null elements to avoid leaks in IE
        fragment.removeChild( div );
        all = a = select = opt = input = fragment = div = null;

        return support;
})();