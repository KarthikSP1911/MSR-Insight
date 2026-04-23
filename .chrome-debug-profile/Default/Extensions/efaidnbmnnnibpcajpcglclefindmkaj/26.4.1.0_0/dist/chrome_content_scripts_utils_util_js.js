export const __webpack_esm_id__ = "chrome_content_scripts_utils_util_js";
export const __webpack_esm_ids__ = ["chrome_content_scripts_utils_util_js"];
export const __webpack_esm_modules__ = {

/***/ "./chrome/content_scripts/utils/util.js":
/*!**********************************************!*\
  !*** ./chrome/content_scripts/utils/util.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addFontToDocument: () => (/* binding */ addFontToDocument),
/* harmony export */   buildAcrobatPromotionSource: () => (/* binding */ buildAcrobatPromotionSource),
/* harmony export */   createAcrobatIconElement: () => (/* binding */ createAcrobatIconElement),
/* harmony export */   extractFileIdFromDriveUrl: () => (/* binding */ extractFileIdFromDriveUrl),
/* harmony export */   fetchDefaultViewershipConfig: () => (/* binding */ fetchDefaultViewershipConfig),
/* harmony export */   getClosestElementBySelectors: () => (/* binding */ getClosestElementBySelectors),
/* harmony export */   getDVSessionCountString: () => (/* binding */ getDVSessionCountString),
/* harmony export */   getElementFromParent: () => (/* binding */ getElementFromParent),
/* harmony export */   getElementListForSelectors: () => (/* binding */ getElementListForSelectors),
/* harmony export */   getElementsListBasedOnSelectors: () => (/* binding */ getElementsListBasedOnSelectors),
/* harmony export */   getFileDetails: () => (/* binding */ getFileDetails),
/* harmony export */   getFirstElementBasedOnSelectors: () => (/* binding */ getFirstElementBasedOnSelectors),
/* harmony export */   getParsedJSON: () => (/* binding */ getParsedJSON),
/* harmony export */   incrementDVSessionCount: () => (/* binding */ incrementDVSessionCount),
/* harmony export */   isAnalyticsSentInTheMonthOrSession: () => (/* binding */ isAnalyticsSentInTheMonthOrSession),
/* harmony export */   resetDVSessionCount: () => (/* binding */ resetDVSessionCount),
/* harmony export */   sendAnalytics: () => (/* binding */ sendAnalytics),
/* harmony export */   sendAnalyticsEvent: () => (/* binding */ sendAnalyticsEvent),
/* harmony export */   sendAnalyticsOnce: () => (/* binding */ sendAnalyticsOnce),
/* harmony export */   sendAnalyticsOncePerMonth: () => (/* binding */ sendAnalyticsOncePerMonth),
/* harmony export */   sendErrorLog: () => (/* binding */ sendErrorLog),
/* harmony export */   shouldShowImplicitDefaultViewerToast: () => (/* binding */ shouldShowImplicitDefaultViewerToast)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

var sendAnalytics = function sendAnalytics(analytics) {
  try {
    chrome.runtime.sendMessage({
      main_op: "analytics",
      analytics: analytics
    });
  } catch (e) {
    // genuine error may come when extension context is invalidated
  }
};

// returns date in yyyyMM format
var formatDateForMonthlyAnalyticsEvent = function formatDateForMonthlyAnalyticsEvent(todayDate) {
  if (todayDate instanceof Date) {
    return "".concat(todayDate.getUTCFullYear()).concat((todayDate.getUTCMonth() + 1).toString().padStart(2, "0"));
  }
  return "";
};
var eventsSent = new Set();
var sendAnalyticsOnce = function sendAnalyticsOnce(eventString) {
  if (!(eventsSent !== null && eventsSent !== void 0 && eventsSent.has(eventString))) {
    eventsSent.add(eventString);
    sendAnalyticsEvent([eventString]);
  }
};
var analyticsEvents = new Map();
/**
 * Send analytics event once per month
 * * Checks object in session storage if flag is already sent for the month
 * * Checks local storage for cross tab event status
 * @param eventString
 * @param options
 * @returns {Promise<void>}
 */
var sendAnalyticsOncePerMonth = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(eventString, options) {
    var _eventDetails$eventSt, todayDate, currentYearMonth, eventDetails, lastSentYearMonth, analyticsPayload, eventDetailsToSave;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          if (!eventString) {
            _context.next = 15;
            break;
          }
          _context.prev = 1;
          if (analyticsEvents !== null && analyticsEvents !== void 0 && analyticsEvents.has(eventString)) {
            _context.next = 11;
            break;
          }
          todayDate = new Date();
          currentYearMonth = formatDateForMonthlyAnalyticsEvent(todayDate);
          analyticsEvents.set(eventString, currentYearMonth);
          _context.next = 8;
          return chrome.storage.local.get([eventString]);
        case 8:
          eventDetails = _context.sent;
          lastSentYearMonth = eventDetails === null || eventDetails === void 0 || (_eventDetails$eventSt = eventDetails[eventString]) === null || _eventDetails$eventSt === void 0 ? void 0 : _eventDetails$eventSt.lastSentYearMonth; //only send analytics if it's not sent in this month
          if (!lastSentYearMonth || currentYearMonth > lastSentYearMonth) {
            analyticsPayload = options ? [[eventString, options]] : [eventString];
            sendAnalytics(analyticsPayload);
            // add to map with date
            eventDetailsToSave = {
              "lastSentYearMonth": currentYearMonth
            };
            chrome.storage.local.set(_defineProperty({}, eventString, eventDetailsToSave));
          }
        case 11:
          _context.next = 15;
          break;
        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](1);
        case 15:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 13]]);
  }));
  return function sendAnalyticsOncePerMonth(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// Gsuite default viewership related methods starts here.
var getDVSessionCountStorageKey = function getDVSessionCountStorageKey(surfaceId) {
  return "".concat(surfaceId, "-pdf-default-viewership-session-count");
};
var getDVStorageKey = function getDVStorageKey(surfaceId) {
  return "".concat(surfaceId, "-pdf-default-viewership");
};
var resetDVSessionCount = function resetDVSessionCount(surfaceId) {
  chrome.storage.local.set(_defineProperty({}, getDVSessionCountStorageKey(surfaceId), 0));
};
var incrementDVSessionCount = function incrementDVSessionCount(surfaceId) {
  getDVSessionCount(surfaceId).then(function (sessionCount) {
    chrome.storage.local.set(_defineProperty({}, getDVSessionCountStorageKey(surfaceId), sessionCount + 1));
  });
};
var getDVSessionCount = function getDVSessionCount(surfaceId) {
  return chrome.storage.local.get(getDVSessionCountStorageKey(surfaceId)).then(function (res) {
    return (res === null || res === void 0 ? void 0 : res[getDVSessionCountStorageKey(surfaceId)]) || 0;
  });
};
var getDVSessionCountString = function getDVSessionCountString(surfaceId) {
  return getDVSessionCount(surfaceId).then(function (sessionCount) {
    if (sessionCount < 3) {
      return sessionCount.toString();
    }
    return "3_or_more";
  });
};
var fetchDefaultViewershipConfig = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(surfaceId) {
    var _yield$chrome$storage;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return chrome.storage.local.get(getDVStorageKey(surfaceId));
        case 2:
          _context2.t2 = _yield$chrome$storage = _context2.sent;
          _context2.t1 = _context2.t2 === null;
          if (_context2.t1) {
            _context2.next = 6;
            break;
          }
          _context2.t1 = _yield$chrome$storage === void 0;
        case 6:
          if (!_context2.t1) {
            _context2.next = 10;
            break;
          }
          _context2.t3 = void 0;
          _context2.next = 11;
          break;
        case 10:
          _context2.t3 = _yield$chrome$storage[getDVStorageKey(surfaceId)];
        case 11:
          _context2.t0 = _context2.t3;
          if (_context2.t0) {
            _context2.next = 14;
            break;
          }
          _context2.t0 = {};
        case 14:
          return _context2.abrupt("return", _context2.t0);
        case 15:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function fetchDefaultViewershipConfig(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Checks if implicit default viewer toast should be shown for a given surface.
 * This should be called as early as possible to prevent FTE from showing.
 * @param {string} surfaceId - e.g. "gmail", "gdrive"
 * @param {Object} state - The state object to update with implicitToastShownInSession flag
 * @returns {Promise<boolean>} true if toast should be shown, false otherwise
 */
var shouldShowImplicitDefaultViewerToast = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(surfaceId, state) {
    var key, result, shouldShowToast;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          key = "".concat(surfaceId, "-show-implicit-dv-toast");
          _context3.next = 3;
          return chrome.storage.local.get(key);
        case 3:
          result = _context3.sent;
          shouldShowToast = result === null || result === void 0 ? void 0 : result[key];
          if (!(shouldShowToast === "true")) {
            _context3.next = 10;
            break;
          }
          _context3.next = 8;
          return chrome.storage.local.remove(key);
        case 8:
          // eslint-disable-next-line no-param-reassign -- state is used as out-parameter
          state.implicitToastShownInSession = true;
          return _context3.abrupt("return", true);
        case 10:
          return _context3.abrupt("return", false);
        case 11:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function shouldShowImplicitDefaultViewerToast(_x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();
// Gsuite default viewership related methods ends here.

/**
 * Create Acrobat icon element
 * @returns {HTMLImageElement}
 */
var createAcrobatIconElement = function createAcrobatIconElement(className, iconPath) {
  var acrobatImage = document.createElement("img");
  var iconUrl = chrome.runtime.getURL(iconPath);
  acrobatImage.setAttribute("src", iconUrl);
  acrobatImage.setAttribute("class", className);
  return acrobatImage;
};
var isAnalyticsSentInTheMonthOrSession = function isAnalyticsSentInTheMonthOrSession(eventString) {
  return analyticsEvents === null || analyticsEvents === void 0 ? void 0 : analyticsEvents.has(eventString);
};
var sendErrorLog = function sendErrorLog(message, error) {
  chrome.runtime.sendMessage({
    main_op: "log-error",
    log: {
      message: message,
      error: error
    }
  });
};
var getParsedJSON = function getParsedJSON(input) {
  var parsedJSON;
  try {
    parsedJSON = JSON.parse(input);
  } catch (e) {}
  return parsedJSON;
};
var extractFileIdFromDriveUrl = function extractFileIdFromDriveUrl(url) {
  var fileId = "";
  if (!url) {
    return fileId;
  }
  try {
    var decodedUrl = decodeURIComponent(url);

    // Case 1: Google Drive links (either `/file/d/` or `/open?id=`)
    if (decodedUrl.startsWith("https://drive.google.com/") || decodedUrl.startsWith("https://docs.google.com/file")) {
      fileId = decodedUrl.split('/')[5] || new URL(decodedUrl).searchParams.get("id");
    }
    // Case 2: Gmail URL with "q" as parameter pointing to a Google Doc
    else if (decodedUrl.startsWith("https://www.google.com/url")) {
      var parsedUrl = new URL(decodedUrl);
      var targetUrl = parsedUrl.searchParams.get('q');
      if (targetUrl) {
        var documentUrl = new URL(targetUrl);
        fileId = documentUrl.pathname.split('/')[3];
      }
    }
  } catch (e) {
    sendErrorLog("Error in GSuite", "Error in extracting file ID from URL");
  }
  return fileId;
};

/**
 * Get elements list in DOM for passed selectors.
 * @param selectors - array of selectors ["a","b"]
 * @param parentElement - parent element to search for selectors
 * @returns {*[]} - array of div elements for the selectors present in the DOM
 */
var getElementListForSelectors = function getElementListForSelectors() {
  var selectors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var parentElement = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var elementList = new Set();
  var parent = parentElement || document;
  var _iterator = _createForOfIteratorHelper(selectors),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var selector = _step.value;
      var elements = parent.getElementsByClassName(selector);
      if ((elements === null || elements === void 0 ? void 0 : elements.length) > 0) {
        var divList = Array.from(elements);
        divList === null || divList === void 0 || divList.forEach(function (div) {
          return elementList.add(div);
        });
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return Array.from(elementList);
};

/**
 * Get file details after parsing the file details element
 * @param {Element} fileDetailsElement - The file details element
 * @returns {Object} - The file details object
 */
var getFileDetails = function getFileDetails(fileDetailsElement) {
  try {
    var _fileDetailsElement$t;
    return JSON.parse(fileDetailsElement === null || fileDetailsElement === void 0 || (_fileDetailsElement$t = fileDetailsElement.textContent) === null || _fileDetailsElement$t === void 0 ? void 0 : _fileDetailsElement$t.replace(/\\/g, ""));
  } catch (ex) {
    return null;
  }
};

/**
 * Returns the first matching child element from the given parent element based on the provided selectors.
 * 
 * @param {string[]} selectors - An array of class names or CSS selectors to match against.
 * @param {Element|null} parentElement - The parent DOM element to search within. If null, the document is used.
 * @returns {Element|null} - The first matching element if found, otherwise null.
 */
var getElementFromParent = function getElementFromParent(selectors, parentElement) {
  var childElements = getElementListForSelectors(selectors, parentElement);
  return childElements.length > 0 ? childElements[0] : null;
};

/**
 * Returns an array of elements matching any of the given selectors within the specified root element.
 *
 * @param {string[]} elementSelectors - An array of CSS selector strings used to match elements.
 * @param {Element|null} rootElement - The root DOM element within which to search.
 * @returns {Element[]|null} - An array of matching elements if found, otherwise null.
 */
var getElementsListBasedOnSelectors = function getElementsListBasedOnSelectors() {
  var elementSelectors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var rootElement = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (!rootElement || !Array.isArray(elementSelectors) || elementSelectors.length === 0) {
    return null;
  }
  var matchedElements = new Set();
  var _iterator2 = _createForOfIteratorHelper(elementSelectors),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var selector = _step2.value;
      var elements = rootElement.querySelectorAll(selector);
      elements.forEach(function (el) {
        return matchedElements.add(el);
      });
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return matchedElements.size > 0 ? Array.from(matchedElements) : null;
};

/**
 * Returns the first element matching any of the given selectors within the specified root element.
 *
 * @param {string[]} elementSelectors - An array of CSS selector strings used to match elements.
 * @param {Element|null} rootElement - The root DOM element within which to search.
 * @returns {Element|null} - The first matching element if found, otherwise null.
 */
var getFirstElementBasedOnSelectors = function getFirstElementBasedOnSelectors() {
  var elementSelectors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var rootElement = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  if (!rootElement || !Array.isArray(elementSelectors) || elementSelectors.length === 0) {
    return null;
  }
  var _iterator3 = _createForOfIteratorHelper(elementSelectors),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var selector = _step3.value;
      var element = rootElement.querySelector(selector);
      if (element) {
        return element; // Return the first matched element
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  return null;
};

/**
 * Finds the closest ancestor matching any selector from the list.
 * @param {Element} element - Element to start from.
 * @param {string[]} [selectorsList=[]] - List of class names.
 * @returns {Element|null} Closest matching ancestor or null.
 */
var getClosestElementBySelectors = function getClosestElementBySelectors() {
  var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var selectorsList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  if (!element || !Array.isArray(selectorsList) || selectorsList.length === 0) {
    return null;
  }
  var _iterator4 = _createForOfIteratorHelper(selectorsList),
    _step4;
  try {
    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
      var selector = _step4.value;
      var containerElement = element.closest(selector);
      if (containerElement) return containerElement;
    }
  } catch (err) {
    _iterator4.e(err);
  } finally {
    _iterator4.f();
  }
  return null;
};

/**
 * The returned string is used to pass xId and xLocation in the iframe url
 * The logic to parse and set the iframe url is written in index.js
 * */
var buildAcrobatPromotionSource = function buildAcrobatPromotionSource(surface, surfaceLocation, suffix) {
  if (surface && surfaceLocation) {
    if (suffix) {
      return "".concat(surface, "-").concat(surfaceLocation, "-").concat(suffix);
    }
    return "".concat(surface, "-").concat(surfaceLocation);
  }
  return "";
};

/**
 * Loads Adobe Clean font for content script usage
 * @param {Object} state - State object to track font loading status
 * @returns {void}
 */
var addFontToDocument = function addFontToDocument(state) {
  if (!(state !== null && state !== void 0 && state.adobeCleanFontAdded)) {
    // load and add the font (if we add the touch point and then load the font, it may re-render text and cause a page reflow)
    var fontURL = chrome.runtime.getURL("browser/css/fonts/AdobeClean-Regular.otf");
    var fontFace = new FontFace("AdobeClean-Regular", "url(".concat(fontURL, ")"));
    fontFace.load().then(function () {
      document.fonts.add(fontFace);
    });
    state.adobeCleanFontAdded = true;
  }
};
var sendAnalyticsEvent = function sendAnalyticsEvent(eventName) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  try {
    chrome.runtime.sendMessage({
      main_op: "analytics",
      analytics: [[eventName, params]]
    });
  } catch (e) {
    // genuine error may come when extension context is invalidated
  }
};


/***/ })

};

//# sourceMappingURL=chrome_content_scripts_utils_util_js.js.map