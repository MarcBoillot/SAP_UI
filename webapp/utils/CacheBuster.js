sap.ui.define(["sap/ui/core/ComponentSupport"], function () {
    "use strict";
    $.ajax({
        method: "get",
        url: "./version.json?" + "&__=" + new Date().getTime()
    }).always((data) => {
    	
        (function () {
        	console.log("version : "+ data._AppVersion)
            var proxied = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function () {
                var url = arguments[1];
                if (url.indexOf("?") == -1) {
                    url = url + "?";
                }
                arguments[1] = url + "&_AppVersion=" + data._AppVersion;
                return proxied.apply(this, [].slice.call(arguments));
            };
            var proxiedDomappend = Element.prototype.appendChild;
            Element.prototype.appendChild = function () {
                if (arguments[0].tagName === "SCRIPT" || arguments[0].tagName === "LINK") {
                    var url = arguments[0].src !== undefined ? arguments[0].src : arguments[0].href;
                    if (url.indexOf("?") == -1) {
                        url = url + "?";
                    }
                    if (arguments[0].src !== undefined) {
                        arguments[0].src = url + "&_AppVersion=" + data._AppVersion;
                    } else if (arguments[0].href !== undefined) {
                        arguments[0].href = url + "&_AppVersion=" + data._AppVersion;
                    }

                    return proxiedDomappend.apply(this, [].slice.call(arguments));
                } else {
                    return proxiedDomappend.apply(this, arguments);
                }
            };
        })();

        return;
    })

});