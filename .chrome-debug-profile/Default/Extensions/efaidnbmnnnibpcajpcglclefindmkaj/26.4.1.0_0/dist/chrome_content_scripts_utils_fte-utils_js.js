export const __webpack_esm_id__ = "chrome_content_scripts_utils_fte-utils_js";
export const __webpack_esm_ids__ = ["chrome_content_scripts_utils_fte-utils_js"];
export const __webpack_esm_modules__ = {

/***/ "./chrome/content_scripts/utils/fte-utils.js":
/*!***************************************************!*\
  !*** ./chrome/content_scripts/utils/fte-utils.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   acrobatTouchPointClicked: () => (/* binding */ acrobatTouchPointClicked),
/* harmony export */   addFteCloseButtonListener: () => (/* binding */ addFteCloseButtonListener),
/* harmony export */   createFteTooltip: () => (/* binding */ createFteTooltip),
/* harmony export */   getAcrobatTouchPointFteEligibility: () => (/* binding */ getAcrobatTouchPointFteEligibility),
/* harmony export */   initFteStateAndConfig: () => (/* binding */ initFteStateAndConfig),
/* harmony export */   removeFteTooltip: () => (/* binding */ removeFteTooltip),
/* harmony export */   shouldShowFteTooltip: () => (/* binding */ shouldShowFteTooltip),
/* harmony export */   updateFteToolTipCoolDown: () => (/* binding */ updateFteToolTipCoolDown),
/* harmony export */   updateOneTimeFteToolTipCoolDown: () => (/* binding */ updateOneTimeFteToolTipCoolDown)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
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

var FTE_TOOLTIP_CONTAINER_CLASS = "acrobat-fte-tooltip-container";
var FTE_TOOLTIP_ELIGIBLE_EVAR = "FteEligible";
var EXTENSION_ENVIRONMENT_KEY = "env";
var createFteToolTipDivObject = function createFteToolTipDivObject(className, textContent) {
  var element = document.createElement('div');
  element.setAttribute('class', className);
  if (textContent && textContent.length > 0) {
    element.textContent = textContent;
  }
  return element;
};
var createFteTooltipObject = function createFteTooltipObject(fteTooltipStrings, tooltipContainerClass, arrowClass) {
  var _fteTooltipStrings$ti, _fteTooltipStrings$de, _fteTooltipStrings$bu;
  var fteTooltip = createFteToolTipDivObject(tooltipContainerClass, "");
  fteTooltip.setAttribute("class", tooltipContainerClass);
  fteTooltip.id = FTE_TOOLTIP_CONTAINER_CLASS;

  // Create the tooltip element
  var tooltip = createFteToolTipDivObject("acrobat-fte-tooltip", "");

  // Create the arrow element
  var arrow = createFteToolTipDivObject(arrowClass, "");
  tooltip.appendChild(arrow);

  // Create the title element
  if ((fteTooltipStrings === null || fteTooltipStrings === void 0 || (_fteTooltipStrings$ti = fteTooltipStrings.title) === null || _fteTooltipStrings$ti === void 0 ? void 0 : _fteTooltipStrings$ti.length) > 0) {
    var title = createFteToolTipDivObject("acrobat-fte-tooltip-title", fteTooltipStrings.title);
    tooltip.appendChild(title);
  }

  // Create the description element
  if ((fteTooltipStrings === null || fteTooltipStrings === void 0 || (_fteTooltipStrings$de = fteTooltipStrings.description) === null || _fteTooltipStrings$de === void 0 ? void 0 : _fteTooltipStrings$de.length) > 0) {
    var description = createFteToolTipDivObject("acrobat-fte-tooltip-description", fteTooltipStrings.description);
    tooltip.appendChild(description);
  }

  // Create the button element
  if ((fteTooltipStrings === null || fteTooltipStrings === void 0 || (_fteTooltipStrings$bu = fteTooltipStrings.button) === null || _fteTooltipStrings$bu === void 0 ? void 0 : _fteTooltipStrings$bu.length) > 0) {
    var button = document.createElement('button');
    button.setAttribute('class', 'acrobat-fte-tooltip-button');
    button.textContent = fteTooltipStrings.button;
    tooltip.appendChild(button);
  }

  // Append the tooltip to the container
  fteTooltip.appendChild(tooltip);
  return fteTooltip;
};
var createFteTooltip = function createFteTooltip(fteTooltipStrings, fteType) {
  var tooltipContainerClass = "acrobat-fte-tooltip-container-".concat(fteType, " acrobat-fte-tooltip-container");
  var arrowClass = "acrobat-fte-tooltip-arrow-".concat(fteType, " acrobat-fte-tooltip-arrow");
  var fteTooltip = createFteTooltipObject(fteTooltipStrings, tooltipContainerClass, arrowClass);
  fteTooltip.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
  return fteTooltip;
};
var getFteCustomCoolDownTime = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var _yield$getLocalStorag, env, value;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return getLocalStorageValue(EXTENSION_ENVIRONMENT_KEY);
        case 2:
          _yield$getLocalStorag = _context.sent;
          env = _yield$getLocalStorag.env;
          if (!(env === "prod")) {
            _context.next = 6;
            break;
          }
          return _context.abrupt("return", 0);
        case 6:
          value = new URLSearchParams(window.location.search).get('acrobatTouchPointFteDay');
          return _context.abrupt("return", value ? parseInt(value) : 0);
        case 8:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function getFteCustomCoolDownTime() {
    return _ref.apply(this, arguments);
  };
}();
var shouldShowFteTooltip = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(tooltipConfig, fteState, enableFte) {
    var currentDate, fteTooltip;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          currentDate = new Date().getTime(); // If acrobat touchpoint clicked
          // or - fte is disabled
          if (!(fteState !== null && fteState !== void 0 && fteState.touchPointClicked || !enableFte)) {
            _context2.next = 3;
            break;
          }
          return _context2.abrupt("return", false);
        case 3:
          // if fte is already visible
          fteTooltip = document.getElementsByClassName(FTE_TOOLTIP_CONTAINER_CLASS);
          if (!(fteTooltip.length > 0)) {
            _context2.next = 6;
            break;
          }
          return _context2.abrupt("return", false);
        case 6:
          return _context2.abrupt("return", currentDate > (fteState === null || fteState === void 0 ? void 0 : fteState.nextDate) && ((fteState === null || fteState === void 0 ? void 0 : fteState.count) < (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.maxFteCount) || (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.maxFteCount) === -1));
        case 7:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function shouldShowFteTooltip(_x, _x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

// Define the applyCoolDown function as a standalone function
var applyCoolDown = function applyCoolDown(date, coolDown, isSeconds) {
  if (isSeconds) {
    date.setSeconds(date.getSeconds() + coolDown);
  } else {
    date.setDate(date.getDate() + coolDown);
  }
};

// Define a function to get the cooldown value based on the configuration
var getCoolDown = function getCoolDown(totalCount, fteCustomCoolDown, tooltipConfig) {
  var coolDown;
  var isSeconds;
  if (fteCustomCoolDown > 0) {
    coolDown = totalCount % 3 > 0 ? tooltipConfig.shortCoolDown * fteCustomCoolDown : tooltipConfig.longCoolDown * fteCustomCoolDown;
    isSeconds = true;
  } else {
    coolDown = totalCount % 3 > 0 ? tooltipConfig.shortCoolDown : tooltipConfig.longCoolDown;
    isSeconds = false;
  }
  return {
    coolDown: coolDown,
    isSeconds: isSeconds
  };
};
var updateFteToolTipCoolDown = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(tooltipConfig, storageKey) {
    var result, currentDate, fteState, totalCount, fteCustomCoolDown, _getCoolDown, coolDown, isSeconds;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return getLocalStorageValue(storageKey);
        case 2:
          result = _context3.sent;
          currentDate = new Date();
          fteState = (result === null || result === void 0 ? void 0 : result[storageKey]) || {
            count: 0,
            nextDate: currentDate.toISOString()
          };
          totalCount = fteState.count + 1; // Fetch custom cooldown time
          _context3.next = 8;
          return getFteCustomCoolDownTime();
        case 8:
          fteCustomCoolDown = _context3.sent;
          // Get the cooldown value and whether it's in seconds or days
          _getCoolDown = getCoolDown(totalCount, fteCustomCoolDown, tooltipConfig), coolDown = _getCoolDown.coolDown, isSeconds = _getCoolDown.isSeconds; // Apply the cooldown to the current date
          applyCoolDown(currentDate, coolDown, isSeconds);

          // Update configuration and save it to local storage
          fteState.nextDate = currentDate.getTime();
          fteState.count = totalCount;
          _context3.next = 15;
          return setLocalStorageValue(storageKey, fteState);
        case 15:
          return _context3.abrupt("return", fteState);
        case 16:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function updateFteToolTipCoolDown(_x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Updates the cooldown state for a one-time FTE (First Time Experience) tooltip.
 * This function increments the count, next date of the first storage key.
 * When an additional storage key is provided, this optionally applies cooldown logic to the next date of the additional storage key.
 * This ensures the other storage key is updated to the same next date as the first one.
 * 
 * @param {string} storageKey - The primary storage key used to store and retrieve the FTE state
 * @param {Object} [tooltipConfig={}] - Configuration object for tooltip cooldown behavior
 * @param {string|null} [otherStorageKey=null] - Optional secondary storage key to synchronize cooldown state with
 * @returns {Promise<void>} A promise that resolves when the storage operations are complete
 */
var updateOneTimeFteToolTipCoolDown = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(storageKey) {
    var tooltipConfig,
      otherStorageKey,
      currentDate,
      result,
      fteState,
      totalCount,
      fteCustomCoolDown,
      _getCoolDown2,
      coolDown,
      isSeconds,
      result_otherStorageKey,
      fteState_otherStorageKey,
      _args4 = arguments;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          tooltipConfig = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : {};
          otherStorageKey = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : null;
          currentDate = new Date();
          _context4.next = 5;
          return getLocalStorageValue(storageKey);
        case 5:
          result = _context4.sent;
          fteState = (result === null || result === void 0 ? void 0 : result[storageKey]) || {
            count: 0,
            nextDate: currentDate
          };
          totalCount = (fteState.count || 0) + 1;
          fteState.count = totalCount;
          if (!otherStorageKey) {
            _context4.next = 23;
            break;
          }
          _context4.next = 12;
          return getFteCustomCoolDownTime();
        case 12:
          fteCustomCoolDown = _context4.sent;
          _getCoolDown2 = getCoolDown(totalCount, fteCustomCoolDown, tooltipConfig), coolDown = _getCoolDown2.coolDown, isSeconds = _getCoolDown2.isSeconds;
          applyCoolDown(currentDate, coolDown, isSeconds);
          fteState.nextDate = currentDate.getTime();
          _context4.next = 18;
          return getLocalStorageValue(otherStorageKey);
        case 18:
          result_otherStorageKey = _context4.sent;
          fteState_otherStorageKey = (result_otherStorageKey === null || result_otherStorageKey === void 0 ? void 0 : result_otherStorageKey[otherStorageKey]) || {
            count: 0,
            nextDate: currentDate
          };
          fteState_otherStorageKey.nextDate = currentDate.getTime();
          _context4.next = 23;
          return setLocalStorageValue(otherStorageKey, fteState_otherStorageKey);
        case 23:
          _context4.next = 25;
          return setLocalStorageValue(storageKey, fteState);
        case 25:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function updateOneTimeFteToolTipCoolDown(_x6) {
    return _ref4.apply(this, arguments);
  };
}();
var removeFteTooltip = function removeFteTooltip() {
  var fteTooltipContainerClass = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : FTE_TOOLTIP_CONTAINER_CLASS;
  var fteTooltip = document.getElementsByClassName(fteTooltipContainerClass);
  if (fteTooltip.length > 0) {
    fteTooltip[0].remove();
  }
};
var initFteStateAndConfig = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(storageKey) {
    var _yield$chrome$storage;
    var currentDate, fteState;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          currentDate = new Date().getTime();
          fteState = {
            count: 0,
            nextDate: currentDate
          };
          _context5.next = 4;
          return chrome.storage.local.get(storageKey);
        case 4:
          _context5.t2 = _yield$chrome$storage = _context5.sent;
          _context5.t1 = _context5.t2 === null;
          if (_context5.t1) {
            _context5.next = 8;
            break;
          }
          _context5.t1 = _yield$chrome$storage === void 0;
        case 8:
          if (!_context5.t1) {
            _context5.next = 12;
            break;
          }
          _context5.t3 = void 0;
          _context5.next = 13;
          break;
        case 12:
          _context5.t3 = _yield$chrome$storage[storageKey];
        case 13:
          _context5.t0 = _context5.t3;
          if (_context5.t0) {
            _context5.next = 16;
            break;
          }
          _context5.t0 = fteState;
        case 16:
          fteState = _context5.t0;
          chrome.storage.local.set(_defineProperty({}, storageKey, fteState));
          return _context5.abrupt("return", fteState);
        case 19:
        case "end":
          return _context5.stop();
      }
    }, _callee5);
  }));
  return function initFteStateAndConfig(_x7) {
    return _ref5.apply(this, arguments);
  };
}();
var acrobatTouchPointClicked = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(storageKey) {
    var result, fteState;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return getLocalStorageValue(storageKey);
        case 2:
          result = _context6.sent;
          fteState = (result === null || result === void 0 ? void 0 : result[storageKey]) || {};
          if (!(fteState !== null && fteState !== void 0 && fteState.touchPointClicked)) {
            removeFteTooltip(FTE_TOOLTIP_CONTAINER_CLASS);
            fteState.touchPointClicked = true;
            setLocalStorageValue(storageKey, fteState);
          }
        case 5:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function acrobatTouchPointClicked(_x8) {
    return _ref6.apply(this, arguments);
  };
}();
var getAcrobatTouchPointFteEligibility = function getAcrobatTouchPointFteEligibility() {
  return FTE_TOOLTIP_ELIGIBLE_EVAR;
};
var getLocalStorageValue = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(storageKey) {
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return chrome.storage.local.get(storageKey);
        case 2:
          return _context7.abrupt("return", _context7.sent);
        case 3:
        case "end":
          return _context7.stop();
      }
    }, _callee7);
  }));
  return function getLocalStorageValue(_x9) {
    return _ref7.apply(this, arguments);
  };
}();
var setLocalStorageValue = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(storageKey, value) {
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return chrome.storage.local.set(_defineProperty({}, storageKey, value), function () {
            var _chrome$runtime;
            (_chrome$runtime = chrome.runtime) === null || _chrome$runtime === void 0 || _chrome$runtime.sendMessage({
              "main_op": storageKey,
              fteState: value
            });
          });
        case 2:
          return _context8.abrupt("return", _context8.sent);
        case 3:
        case "end":
          return _context8.stop();
      }
    }, _callee8);
  }));
  return function setLocalStorageValue(_x0, _x1) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * Adds click event listener to FTE tooltip close button
 * Used by PDF Tools FTE tooltip for consistent close button behavior
 * @param {HTMLElement} tooltip - The FTE tooltip element
 * @param {Object} options - Configuration options
 * @param {string} options.fteType - Type of FTE (e.g., "pdfTools")
 * @param {Function} options.onClose - Callback function to execute when close button is clicked
 * @param {Function} options.sendAnalytics - Analytics function to call
 * @param {Function} options.sendErrorLog - Error logging function
 */
var addFteCloseButtonListener = function addFteCloseButtonListener(tooltip) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$fteType = options.fteType,
    fteType = _options$fteType === void 0 ? "pdfTools" : _options$fteType,
    onClose = options.onClose,
    sendErrorLog = options.sendErrorLog;
  var button = tooltip.querySelector(".acrobat-fte-tooltip-button");
  if (button) {
    button.addEventListener("click", function () {
      // Remove tooltip
      tooltip.remove();

      // Execute custom close handler
      if (onClose) {
        onClose();
      }

      // Remove click-outside listener using stored reference
      if (tooltip.clickOutsideHandler) {
        document.removeEventListener("click", tooltip.clickOutsideHandler);
      }
    });
  } else if (sendErrorLog) {
    sendErrorLog("FTE_CloseButtonNotFound_".concat(fteType), "Close button not found in tooltip");
  }
};


/***/ })

};

//# sourceMappingURL=chrome_content_scripts_utils_fte-utils_js.js.map