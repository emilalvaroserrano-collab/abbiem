import { i as __require, o as __toESM, r as __exportAll, t as __commonJSMin } from "../../_runtime.mjs";
import { t as textDecode } from "../borewit__text-codec.mjs";
//#region node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region node_modules/debug/src/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
				if (template[templateIndex] === "*") {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++;
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
//#endregion
//#region node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));
//#endregion
//#region node_modules/has-flag/index.js
var require_has_flag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = (flag, argv = process.argv) => {
		const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf("--");
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
}));
//#endregion
//#region node_modules/supports-color/index.js
var require_supports_color = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var os = __require("os");
	var tty$1 = __require("tty");
	var hasFlag = require_has_flag();
	var { env } = process;
	var forceColor;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) forceColor = 0;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = 1;
	if ("FORCE_COLOR" in env) {
		if (env.FORCE_COLOR === "true") forceColor = 1;
		else if (env.FORCE_COLOR === "false") forceColor = 0;
		else forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
	function translateLevel(level) {
		if (level === 0) return false;
		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}
	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
		const min = forceColor || 0;
		if (env.TERM === "dumb") return min;
		if (process.platform === "win32") {
			const osRelease = os.release().split(".");
			if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI",
				"GITHUB_ACTIONS",
				"BUILDKITE"
			].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		if (env.COLORTERM === "truecolor") return 3;
		if ("TERM_PROGRAM" in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env.TERM_PROGRAM) {
				case "iTerm.app": return version >= 3 ? 3 : 2;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
		if ("COLORTERM" in env) return 1;
		return min;
	}
	function getSupportLevel(stream) {
		return translateLevel(supportsColor(stream, stream && stream.isTTY));
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty$1.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty$1.isatty(2)))
	};
}));
//#endregion
//#region node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var tty = __require("tty");
	var util = __require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = require_supports_color();
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common()(exports);
	var { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
}));
//#endregion
//#region node_modules/debug/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));
//#endregion
//#region node_modules/ieee754/index.js
var require_ieee754 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
	exports.read = function(buffer, offset, isLE, mLen, nBytes) {
		var e, m;
		var eLen = nBytes * 8 - mLen - 1;
		var eMax = (1 << eLen) - 1;
		var eBias = eMax >> 1;
		var nBits = -7;
		var i = isLE ? nBytes - 1 : 0;
		var d = isLE ? -1 : 1;
		var s = buffer[offset + i];
		i += d;
		e = s & (1 << -nBits) - 1;
		s >>= -nBits;
		nBits += eLen;
		for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);
		m = e & (1 << -nBits) - 1;
		e >>= -nBits;
		nBits += mLen;
		for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);
		if (e === 0) e = 1 - eBias;
		else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;
		else {
			m = m + Math.pow(2, mLen);
			e = e - eBias;
		}
		return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	};
	exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
		var e, m, c;
		var eLen = nBytes * 8 - mLen - 1;
		var eMax = (1 << eLen) - 1;
		var eBias = eMax >> 1;
		var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
		var i = isLE ? 0 : nBytes - 1;
		var d = isLE ? 1 : -1;
		var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
		value = Math.abs(value);
		if (isNaN(value) || value === Infinity) {
			m = isNaN(value) ? 1 : 0;
			e = eMax;
		} else {
			e = Math.floor(Math.log(value) / Math.LN2);
			if (value * (c = Math.pow(2, -e)) < 1) {
				e--;
				c *= 2;
			}
			if (e + eBias >= 1) value += rt / c;
			else value += rt * Math.pow(2, 1 - eBias);
			if (value * c >= 2) {
				e++;
				c /= 2;
			}
			if (e + eBias >= eMax) {
				m = 0;
				e = eMax;
			} else if (e + eBias >= 1) {
				m = (value * c - 1) * Math.pow(2, mLen);
				e = e + eBias;
			} else {
				m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
				e = 0;
			}
		}
		for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8);
		e = e << mLen | m;
		eLen += mLen;
		for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8);
		buffer[offset + i - d] |= s * 128;
	};
}));
//#endregion
//#region node_modules/token-types/lib/index.js
var lib_exports = /* @__PURE__ */ __exportAll({
	AnsiStringType: () => AnsiStringType,
	Float16_BE: () => Float16_BE,
	Float16_LE: () => Float16_LE,
	Float32_BE: () => Float32_BE,
	Float32_LE: () => Float32_LE,
	Float64_BE: () => Float64_BE,
	Float64_LE: () => Float64_LE,
	Float80_BE: () => Float80_BE,
	Float80_LE: () => Float80_LE,
	INT16_BE: () => INT16_BE,
	INT16_LE: () => INT16_LE,
	INT24_BE: () => INT24_BE,
	INT24_LE: () => INT24_LE,
	INT32_BE: () => INT32_BE,
	INT32_LE: () => INT32_LE,
	INT64_BE: () => INT64_BE,
	INT64_LE: () => INT64_LE,
	INT8: () => INT8,
	IgnoreType: () => IgnoreType,
	StringType: () => StringType,
	UINT16_BE: () => UINT16_BE,
	UINT16_LE: () => UINT16_LE,
	UINT24_BE: () => UINT24_BE,
	UINT24_LE: () => UINT24_LE,
	UINT32_BE: () => UINT32_BE,
	UINT32_LE: () => UINT32_LE,
	UINT64_BE: () => UINT64_BE,
	UINT64_LE: () => UINT64_LE,
	UINT8: () => UINT8,
	Uint8ArrayType: () => Uint8ArrayType
});
var import_ieee754 = /* @__PURE__ */ __toESM(require_ieee754(), 1);
function dv(array) {
	return new DataView(array.buffer, array.byteOffset);
}
var UINT8 = {
	len: 1,
	get(array, offset) {
		return dv(array).getUint8(offset);
	},
	put(array, offset, value) {
		dv(array).setUint8(offset, value);
		return offset + 1;
	}
};
/**
* 16-bit unsigned integer, Little Endian byte order
*/
var UINT16_LE = {
	len: 2,
	get(array, offset) {
		return dv(array).getUint16(offset, true);
	},
	put(array, offset, value) {
		dv(array).setUint16(offset, value, true);
		return offset + 2;
	}
};
/**
* 16-bit unsigned integer, Big Endian byte order
*/
var UINT16_BE = {
	len: 2,
	get(array, offset) {
		return dv(array).getUint16(offset);
	},
	put(array, offset, value) {
		dv(array).setUint16(offset, value);
		return offset + 2;
	}
};
/**
* 24-bit unsigned integer, Little Endian byte order
*/
var UINT24_LE = {
	len: 3,
	get(array, offset) {
		const dataView = dv(array);
		return dataView.getUint8(offset) + (dataView.getUint16(offset + 1, true) << 8);
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint8(offset, value & 255);
		dataView.setUint16(offset + 1, value >> 8, true);
		return offset + 3;
	}
};
/**
* 24-bit unsigned integer, Big Endian byte order
*/
var UINT24_BE = {
	len: 3,
	get(array, offset) {
		const dataView = dv(array);
		return (dataView.getUint16(offset) << 8) + dataView.getUint8(offset + 2);
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint16(offset, value >> 8);
		dataView.setUint8(offset + 2, value & 255);
		return offset + 3;
	}
};
/**
* 32-bit unsigned integer, Little Endian byte order
*/
var UINT32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getUint32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setUint32(offset, value, true);
		return offset + 4;
	}
};
/**
* 32-bit unsigned integer, Big Endian byte order
*/
var UINT32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getUint32(offset);
	},
	put(array, offset, value) {
		dv(array).setUint32(offset, value);
		return offset + 4;
	}
};
/**
* 8-bit signed integer
*/
var INT8 = {
	len: 1,
	get(array, offset) {
		return dv(array).getInt8(offset);
	},
	put(array, offset, value) {
		dv(array).setInt8(offset, value);
		return offset + 1;
	}
};
/**
* 16-bit signed integer, Big Endian byte order
*/
var INT16_BE = {
	len: 2,
	get(array, offset) {
		return dv(array).getInt16(offset);
	},
	put(array, offset, value) {
		dv(array).setInt16(offset, value);
		return offset + 2;
	}
};
/**
* 16-bit signed integer, Little Endian byte order
*/
var INT16_LE = {
	len: 2,
	get(array, offset) {
		return dv(array).getInt16(offset, true);
	},
	put(array, offset, value) {
		dv(array).setInt16(offset, value, true);
		return offset + 2;
	}
};
/**
* 24-bit signed integer, Little Endian byte order
*/
var INT24_LE = {
	len: 3,
	get(array, offset) {
		const unsigned = UINT24_LE.get(array, offset);
		return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint8(offset, value & 255);
		dataView.setUint16(offset + 1, value >> 8, true);
		return offset + 3;
	}
};
/**
* 24-bit signed integer, Big Endian byte order
*/
var INT24_BE = {
	len: 3,
	get(array, offset) {
		const unsigned = UINT24_BE.get(array, offset);
		return unsigned > 8388607 ? unsigned - 16777216 : unsigned;
	},
	put(array, offset, value) {
		const dataView = dv(array);
		dataView.setUint16(offset, value >> 8);
		dataView.setUint8(offset + 2, value & 255);
		return offset + 3;
	}
};
/**
* 32-bit signed integer, Big Endian byte order
*/
var INT32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getInt32(offset);
	},
	put(array, offset, value) {
		dv(array).setInt32(offset, value);
		return offset + 4;
	}
};
/**
* 32-bit signed integer, Big Endian byte order
*/
var INT32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getInt32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setInt32(offset, value, true);
		return offset + 4;
	}
};
/**
* 64-bit unsigned integer, Little Endian byte order
*/
var UINT64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigUint64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setBigUint64(offset, value, true);
		return offset + 8;
	}
};
/**
* 64-bit signed integer, Little Endian byte order
*/
var INT64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigInt64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setBigInt64(offset, value, true);
		return offset + 8;
	}
};
/**
* 64-bit unsigned integer, Big Endian byte order
*/
var UINT64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigUint64(offset);
	},
	put(array, offset, value) {
		dv(array).setBigUint64(offset, value);
		return offset + 8;
	}
};
/**
* 64-bit signed integer, Big Endian byte order
*/
var INT64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getBigInt64(offset);
	},
	put(array, offset, value) {
		dv(array).setBigInt64(offset, value);
		return offset + 8;
	}
};
/**
* IEEE 754 16-bit (half precision) float, big endian
*/
var Float16_BE = {
	len: 2,
	get(dataView, offset) {
		return import_ieee754.read(dataView, offset, false, 10, this.len);
	},
	put(dataView, offset, value) {
		import_ieee754.write(dataView, value, offset, false, 10, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 16-bit (half precision) float, little endian
*/
var Float16_LE = {
	len: 2,
	get(array, offset) {
		return import_ieee754.read(array, offset, true, 10, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, true, 10, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 32-bit (single precision) float, big endian
*/
var Float32_BE = {
	len: 4,
	get(array, offset) {
		return dv(array).getFloat32(offset);
	},
	put(array, offset, value) {
		dv(array).setFloat32(offset, value);
		return offset + 4;
	}
};
/**
* IEEE 754 32-bit (single precision) float, little endian
*/
var Float32_LE = {
	len: 4,
	get(array, offset) {
		return dv(array).getFloat32(offset, true);
	},
	put(array, offset, value) {
		dv(array).setFloat32(offset, value, true);
		return offset + 4;
	}
};
/**
* IEEE 754 64-bit (double precision) float, big endian
*/
var Float64_BE = {
	len: 8,
	get(array, offset) {
		return dv(array).getFloat64(offset);
	},
	put(array, offset, value) {
		dv(array).setFloat64(offset, value);
		return offset + 8;
	}
};
/**
* IEEE 754 64-bit (double precision) float, little endian
*/
var Float64_LE = {
	len: 8,
	get(array, offset) {
		return dv(array).getFloat64(offset, true);
	},
	put(array, offset, value) {
		dv(array).setFloat64(offset, value, true);
		return offset + 8;
	}
};
/**
* IEEE 754 80-bit (extended precision) float, big endian
*/
var Float80_BE = {
	len: 10,
	get(array, offset) {
		return import_ieee754.read(array, offset, false, 63, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, false, 63, this.len);
		return offset + this.len;
	}
};
/**
* IEEE 754 80-bit (extended precision) float, little endian
*/
var Float80_LE = {
	len: 10,
	get(array, offset) {
		return import_ieee754.read(array, offset, true, 63, this.len);
	},
	put(array, offset, value) {
		import_ieee754.write(array, value, offset, true, 63, this.len);
		return offset + this.len;
	}
};
/**
* Ignore a given number of bytes
*/
var IgnoreType = class {
	/**
	* @param len number of bytes to ignore
	*/
	constructor(len) {
		this.len = len;
	}
	get(_array, _off) {}
};
var Uint8ArrayType = class {
	constructor(len) {
		this.len = len;
	}
	get(array, offset) {
		return array.subarray(offset, offset + this.len);
	}
};
/**
* Consume a fixed number of bytes from the stream and return a string with a specified encoding.
* Supports all encodings supported by TextDecoder, plus 'windows-1252'.
*/
var StringType = class {
	constructor(len, encoding) {
		this.len = len;
		this.encoding = encoding;
	}
	get(data, offset = 0) {
		const bytes = data.subarray(offset, offset + this.len);
		return textDecode(bytes, this.encoding);
	}
};
/**
* ANSI Latin 1 String using Windows-1252 (Code Page 1252)
* Windows-1252 is a superset of ISO 8859-1 / Latin-1.
*/
var AnsiStringType = class extends StringType {
	constructor(len) {
		super(len, "windows-1252");
	}
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/ZipToken.js
var import_src = /* @__PURE__ */ __toESM(require_src(), 1);
/**
* Ref https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
*/
var Signature = {
	LocalFileHeader: 67324752,
	DataDescriptor: 134695760,
	CentralFileHeader: 33639248,
	EndOfCentralDirectory: 101010256
};
var DataDescriptor = {
	get(array) {
		return {
			signature: UINT32_LE.get(array, 0),
			compressedSize: UINT32_LE.get(array, 8),
			uncompressedSize: UINT32_LE.get(array, 12)
		};
	},
	len: 16
};
/**
* First part of the ZIP Local File Header
* Offset | Bytes| Description
* -------|------+-------------------------------------------------------------------
*      0 |    4 | Signature (0x04034b50)
*      4 |    2 | Minimum version needed to extract
*      6 |    2 | Bit flag
*      8 |    2 | Compression method
*     10 |    2 | File last modification time (MS-DOS format)
*     12 |    2 | File last modification date (MS-DOS format)
*     14 |    4 | CRC-32 of uncompressed data
*     18 |    4 | Compressed size
*     22 |    4 | Uncompressed size
*     26 |    2 | File name length (n)
*     28 |    2 | Extra field length (m)
*     30 |    n | File name
* 30 + n |    m | Extra field
*/
var LocalFileHeaderToken = {
	get(array) {
		const flags = UINT16_LE.get(array, 6);
		return {
			signature: UINT32_LE.get(array, 0),
			minVersion: UINT16_LE.get(array, 4),
			dataDescriptor: !!(flags & 8),
			compressedMethod: UINT16_LE.get(array, 8),
			compressedSize: UINT32_LE.get(array, 18),
			uncompressedSize: UINT32_LE.get(array, 22),
			filenameLength: UINT16_LE.get(array, 26),
			extraFieldLength: UINT16_LE.get(array, 28),
			filename: null
		};
	},
	len: 30
};
/**
* 4.3.16  End of central directory record:
*  end of central dir signature (0x06064b50)                                      4 bytes
*  number of this disk                                                            2 bytes
*  number of the disk with the start of the central directory                     2 bytes
*  total number of entries in the central directory on this disk                  2 bytes
*  total number of entries in the size of the central directory                   2 bytes
*  sizeOfTheCentralDirectory                                                      4 bytes
*  offset of start of central directory with respect to the starting disk number  4 bytes
*  .ZIP file comment length                                                       2 bytes
*  .ZIP file comment       (variable size)
*/
var EndOfCentralDirectoryRecordToken = {
	get(array) {
		return {
			signature: UINT32_LE.get(array, 0),
			nrOfThisDisk: UINT16_LE.get(array, 4),
			nrOfThisDiskWithTheStart: UINT16_LE.get(array, 6),
			nrOfEntriesOnThisDisk: UINT16_LE.get(array, 8),
			nrOfEntriesOfSize: UINT16_LE.get(array, 10),
			sizeOfCd: UINT32_LE.get(array, 12),
			offsetOfStartOfCd: UINT32_LE.get(array, 16),
			zipFileCommentLength: UINT16_LE.get(array, 20)
		};
	},
	len: 22
};
/**
* File header:
*    central file header signature   4 bytes   0 (0x02014b50)
*    version made by                 2 bytes   4
*    version needed to extract       2 bytes   6
*    general purpose bit flag        2 bytes   8
*    compression method              2 bytes  10
*    last mod file time              2 bytes  12
*    last mod file date              2 bytes  14
*    crc-32                          4 bytes  16
*    compressed size                 4 bytes  20
*    uncompressed size               4 bytes  24
*    file name length                2 bytes  28
*    extra field length              2 bytes  30
*    file comment length             2 bytes  32
*    disk number start               2 bytes  34
*    internal file attributes        2 bytes  36
*    external file attributes        4 bytes  38
*    relative offset of local header 4 bytes  42
*/
var FileHeader = {
	get(array) {
		const flags = UINT16_LE.get(array, 8);
		return {
			signature: UINT32_LE.get(array, 0),
			minVersion: UINT16_LE.get(array, 6),
			dataDescriptor: !!(flags & 8),
			compressedMethod: UINT16_LE.get(array, 10),
			compressedSize: UINT32_LE.get(array, 20),
			uncompressedSize: UINT32_LE.get(array, 24),
			filenameLength: UINT16_LE.get(array, 28),
			extraFieldLength: UINT16_LE.get(array, 30),
			fileCommentLength: UINT16_LE.get(array, 32),
			relativeOffsetOfLocalHeader: UINT32_LE.get(array, 42),
			filename: null
		};
	},
	len: 46
};
//#endregion
//#region node_modules/@tokenizer/inflate/lib/ZipHandler.js
function signatureToArray(signature) {
	const signatureBytes = new Uint8Array(UINT32_LE.len);
	UINT32_LE.put(signatureBytes, 0, signature);
	return signatureBytes;
}
var debug = (0, import_src.default)("tokenizer:inflate");
var syncBufferSize = 262144;
var ddSignatureArray = signatureToArray(Signature.DataDescriptor);
var eocdSignatureBytes = signatureToArray(Signature.EndOfCentralDirectory);
var ZipHandler = class ZipHandler {
	constructor(tokenizer) {
		this.tokenizer = tokenizer;
		this.syncBuffer = new Uint8Array(syncBufferSize);
	}
	async isZip() {
		return await this.peekSignature() === Signature.LocalFileHeader;
	}
	peekSignature() {
		return this.tokenizer.peekToken(UINT32_LE);
	}
	async findEndOfCentralDirectoryLocator() {
		const randomReadTokenizer = this.tokenizer;
		const chunkLength = Math.min(16384, randomReadTokenizer.fileInfo.size);
		const buffer = this.syncBuffer.subarray(0, chunkLength);
		await this.tokenizer.readBuffer(buffer, { position: randomReadTokenizer.fileInfo.size - chunkLength });
		for (let i = buffer.length - 4; i >= 0; i--) if (buffer[i] === eocdSignatureBytes[0] && buffer[i + 1] === eocdSignatureBytes[1] && buffer[i + 2] === eocdSignatureBytes[2] && buffer[i + 3] === eocdSignatureBytes[3]) return randomReadTokenizer.fileInfo.size - chunkLength + i;
		return -1;
	}
	async readCentralDirectory() {
		if (!this.tokenizer.supportsRandomAccess()) {
			debug("Cannot reading central-directory without random-read support");
			return;
		}
		debug("Reading central-directory...");
		const pos = this.tokenizer.position;
		const offset = await this.findEndOfCentralDirectoryLocator();
		if (offset > 0) {
			debug("Central-directory 32-bit signature found");
			const eocdHeader = await this.tokenizer.readToken(EndOfCentralDirectoryRecordToken, offset);
			const files = [];
			this.tokenizer.setPosition(eocdHeader.offsetOfStartOfCd);
			for (let n = 0; n < eocdHeader.nrOfEntriesOfSize; ++n) {
				const entry = await this.tokenizer.readToken(FileHeader);
				if (entry.signature !== Signature.CentralFileHeader) throw new Error("Expected Central-File-Header signature");
				entry.filename = await this.tokenizer.readToken(new StringType(entry.filenameLength, "utf-8"));
				await this.tokenizer.ignore(entry.extraFieldLength);
				await this.tokenizer.ignore(entry.fileCommentLength);
				files.push(entry);
				debug(`Add central-directory file-entry: n=${n + 1}/${files.length}: filename=${files[n].filename}`);
			}
			this.tokenizer.setPosition(pos);
			return files;
		}
		this.tokenizer.setPosition(pos);
	}
	async unzip(fileCb) {
		const entries = await this.readCentralDirectory();
		if (entries) return this.iterateOverCentralDirectory(entries, fileCb);
		let stop = false;
		do {
			const zipHeader = await this.readLocalFileHeader();
			if (!zipHeader) break;
			const next = fileCb(zipHeader);
			stop = !!next.stop;
			let fileData;
			await this.tokenizer.ignore(zipHeader.extraFieldLength);
			if (zipHeader.dataDescriptor && zipHeader.compressedSize === 0) {
				const chunks = [];
				let len = syncBufferSize;
				debug("Compressed-file-size unknown, scanning for next data-descriptor-signature....");
				let nextHeaderIndex = -1;
				while (nextHeaderIndex < 0 && len === syncBufferSize) {
					len = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: true });
					nextHeaderIndex = indexOf(this.syncBuffer.subarray(0, len), ddSignatureArray);
					const size = nextHeaderIndex >= 0 ? nextHeaderIndex : len;
					if (next.handler) {
						const data = new Uint8Array(size);
						await this.tokenizer.readBuffer(data);
						chunks.push(data);
					} else await this.tokenizer.ignore(size);
				}
				debug(`Found data-descriptor-signature at pos=${this.tokenizer.position}`);
				if (next.handler) await this.inflate(zipHeader, mergeArrays(chunks), next.handler);
			} else if (next.handler) {
				debug(`Reading compressed-file-data: ${zipHeader.compressedSize} bytes`);
				fileData = new Uint8Array(zipHeader.compressedSize);
				await this.tokenizer.readBuffer(fileData);
				await this.inflate(zipHeader, fileData, next.handler);
			} else {
				debug(`Ignoring compressed-file-data: ${zipHeader.compressedSize} bytes`);
				await this.tokenizer.ignore(zipHeader.compressedSize);
			}
			debug(`Reading data-descriptor at pos=${this.tokenizer.position}`);
			if (zipHeader.dataDescriptor) {
				if ((await this.tokenizer.readToken(DataDescriptor)).signature !== 134695760) throw new Error(`Expected data-descriptor-signature at position ${this.tokenizer.position - DataDescriptor.len}`);
			}
		} while (!stop);
	}
	async iterateOverCentralDirectory(entries, fileCb) {
		for (const fileHeader of entries) {
			const next = fileCb(fileHeader);
			if (next.handler) {
				this.tokenizer.setPosition(fileHeader.relativeOffsetOfLocalHeader);
				const zipHeader = await this.readLocalFileHeader();
				if (zipHeader) {
					await this.tokenizer.ignore(zipHeader.extraFieldLength);
					const fileData = new Uint8Array(fileHeader.compressedSize);
					await this.tokenizer.readBuffer(fileData);
					await this.inflate(zipHeader, fileData, next.handler);
				}
			}
			if (next.stop) break;
		}
	}
	async inflate(zipHeader, fileData, cb) {
		if (zipHeader.compressedMethod === 0) return cb(fileData);
		if (zipHeader.compressedMethod !== 8) throw new Error(`Unsupported ZIP compression method: ${zipHeader.compressedMethod}`);
		debug(`Decompress filename=${zipHeader.filename}, compressed-size=${fileData.length}`);
		return cb(await ZipHandler.decompressDeflateRaw(fileData));
	}
	static async decompressDeflateRaw(data) {
		const input = new ReadableStream({ start(controller) {
			controller.enqueue(data);
			controller.close();
		} });
		const ds = new DecompressionStream("deflate-raw");
		const output = input.pipeThrough(ds);
		try {
			const buffer = await new Response(output).arrayBuffer();
			return new Uint8Array(buffer);
		} catch (err) {
			const message = err instanceof Error ? `Failed to deflate ZIP entry: ${err.message}` : "Unknown decompression error in ZIP entry";
			throw new TypeError(message);
		}
	}
	async readLocalFileHeader() {
		const signature = await this.tokenizer.peekToken(UINT32_LE);
		if (signature === Signature.LocalFileHeader) {
			const header = await this.tokenizer.readToken(LocalFileHeaderToken);
			header.filename = await this.tokenizer.readToken(new StringType(header.filenameLength, "utf-8"));
			return header;
		}
		if (signature === Signature.CentralFileHeader) return false;
		if (signature === 3759263696) throw new Error("Encrypted ZIP");
		throw new Error("Unexpected signature");
	}
};
function indexOf(buffer, portion) {
	const bufferLength = buffer.length;
	const portionLength = portion.length;
	if (portionLength > bufferLength) return -1;
	for (let i = 0; i <= bufferLength - portionLength; i++) {
		let found = true;
		for (let j = 0; j < portionLength; j++) if (buffer[i + j] !== portion[j]) {
			found = false;
			break;
		}
		if (found) return i;
	}
	return -1;
}
function mergeArrays(chunks) {
	const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
	const mergedArray = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		mergedArray.set(chunk, offset);
		offset += chunk.length;
	}
	return mergedArray;
}
//#endregion
//#region node_modules/@tokenizer/inflate/lib/GzipHandler.js
var GzipHandler = class {
	constructor(tokenizer) {
		this.tokenizer = tokenizer;
	}
	inflate() {
		const tokenizer = this.tokenizer;
		return new ReadableStream({ async pull(controller) {
			const buffer = /* @__PURE__ */ new Uint8Array(1024);
			const size = await tokenizer.readBuffer(buffer, { mayBeLess: true });
			if (size === 0) {
				controller.close();
				return;
			}
			controller.enqueue(buffer.subarray(0, size));
		} }).pipeThrough(new DecompressionStream("gzip"));
	}
};
//#endregion
export { lib_exports as C, Uint8ArrayType as S, UINT32_BE as _, INT16_BE as a, UINT64_LE as b, INT32_LE as c, INT8 as d, StringType as f, UINT24_LE as g, UINT24_BE as h, Float64_BE as i, INT64_BE as l, UINT16_LE as m, ZipHandler as n, INT24_BE as o, UINT16_BE as p, Float32_BE as r, INT32_BE as s, GzipHandler as t, INT64_LE as u, UINT32_LE as v, require_src as w, UINT8 as x, UINT64_BE as y };
