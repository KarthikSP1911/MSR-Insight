export const __webpack_esm_id__ = "chrome_content_scripts_gmail_native-viewer-pdf-tools-module_js";
export const __webpack_esm_ids__ = ["chrome_content_scripts_gmail_native-viewer-pdf-tools-module_js"];
export const __webpack_esm_modules__ = {

/***/ "./chrome/content_scripts/gmail lazy recursive referencedExports: default":
/*!****************************************************************************************!*\
  !*** ./chrome/content_scripts/gmail/ lazy referencedExports: default namespace object ***!
  \****************************************************************************************/
/***/ ((module) => {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(() => {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = () => ([]);
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./chrome/content_scripts/gmail lazy recursive referencedExports: default";
module.exports = webpackEmptyAsyncContext;

/***/ }),

/***/ "./chrome/content_scripts/gmail/native-viewer-pdf-tools-module.js":
/*!************************************************************************!*\
  !*** ./chrome/content_scripts/gmail/native-viewer-pdf-tools-module.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   removePdfToolsDropdown: () => (/* binding */ removePdfToolsDropdown),
/* harmony export */   renderPdfToolsDropdown: () => (/* binding */ renderPdfToolsDropdown)
/* harmony export */ });
/* harmony import */ var _state_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./state.js */ "./chrome/content_scripts/gmail/state.js");
/* harmony import */ var _utils_util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/util.js */ "./chrome/content_scripts/utils/util.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./util.js */ "./chrome/content_scripts/gmail/util.js");
/* harmony import */ var _utils_fte_utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/fte-utils.js */ "./chrome/content_scripts/utils/fte-utils.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2026 Adobe Systems Incorporated
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

/**
 * PDF Tools Native Viewer Touch Point Module
 *
 * This module contains all PDF Tools dropdown specific logic for Gmail native viewer.
 * It is dynamically imported when the PDF Tools feature flag is enabled.
 */

/* global initDcLocalStorage, gmailPdfToolsFteCoachmark */






// PDF Tools specific constants
var PDF_TOOLS_FTE_TOOLTIP_STORAGE_KEY = "acrobat-gmail-pdf-tools-fte-config";
var DIRECT_VERB_FTE_DISMISSED_ANALYTICS_EVENT = "DCBrowserExt:DirectVerb:Fte:Dismissed";
var PDF_TOOLS_TOUCHPOINT_CLASS = "acrobat-native-viewer-pdf-tools-touchpoint";

/**
 * Handle click outside FTE tooltip for PDF Tools (Shadow DOM aware)
 */
var handleFteClickOutside = function handleFteClickOutside(event, tooltip) {
  var isInShadowDOM = tooltip.getRootNode() instanceof ShadowRoot;
  if (isInShadowDOM) {
    var composedPath = event.composedPath();
    var isInsideTooltip = composedPath.includes(tooltip);
    if (!isInsideTooltip) {
      tooltip.remove();
      _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip.eligibleFte.type = "";
      (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendAnalytics)([[DIRECT_VERB_FTE_DISMISSED_ANALYTICS_EVENT, {
        source: "gmail_chrome",
        workflow: "pdf_tools"
      }]]);
      if (tooltip.clickOutsideHandler) {
        document.removeEventListener("click", tooltip.clickOutsideHandler);
      }
    }
  }
};

/**
 * Add PDF Tools FTE tooltip to the dropdown element
 */
var addPdfToolsFteTooltipToAttachmentDiv = function addPdfToolsFteTooltipToAttachmentDiv(pdfToolsDropdownElement) {
  var _state$gmailConfig, _state$gmailConfig2, _state$gmailConfig3;
  var tooltipStrings = {
    title: _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 || (_state$gmailConfig = _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].gmailConfig) === null || _state$gmailConfig === void 0 || (_state$gmailConfig = _state$gmailConfig.pdfToolsFteToolTipStrings) === null || _state$gmailConfig === void 0 ? void 0 : _state$gmailConfig.title,
    description: _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 || (_state$gmailConfig2 = _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].gmailConfig) === null || _state$gmailConfig2 === void 0 || (_state$gmailConfig2 = _state$gmailConfig2.pdfToolsFteToolTipStrings) === null || _state$gmailConfig2 === void 0 ? void 0 : _state$gmailConfig2.description,
    button: _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 || (_state$gmailConfig3 = _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].gmailConfig) === null || _state$gmailConfig3 === void 0 || (_state$gmailConfig3 = _state$gmailConfig3.pdfToolsFteToolTipStrings) === null || _state$gmailConfig3 === void 0 ? void 0 : _state$gmailConfig3.button
  };
  var tooltip = (0,_utils_fte_utils_js__WEBPACK_IMPORTED_MODULE_3__.createFteTooltip)(tooltipStrings, "pdfTools");

  // Create bound function to enable proper removeEventListener
  function clickOutsideHandler(event) {
    handleFteClickOutside(event, tooltip);
  }
  tooltip.clickOutsideHandler = clickOutsideHandler;
  (0,_utils_fte_utils_js__WEBPACK_IMPORTED_MODULE_3__.addFteCloseButtonListener)(tooltip, {
    fteType: "pdfTools",
    onClose: function onClose() {
      _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip.eligibleFte.type = "";
      (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendAnalytics)([[DIRECT_VERB_FTE_DISMISSED_ANALYTICS_EVENT, {
        source: "gmail_chrome",
        workflow: "pdf_tools"
      }]]);
    },
    sendErrorLog: _utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendErrorLog
  });

  // Add event listener to the document to detect click outside
  document.addEventListener("click", clickOutsideHandler, {
    once: true,
    signal: _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 ? void 0 : _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].eventControllerSignal
  });
  _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip.eligibleFte.type = "pdfTools";

  // IMPORTANT: Wait for React to render, then append tooltip
  var shadowRoot = pdfToolsDropdownElement.shadowRoot;
  if (!shadowRoot) {
    (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendErrorLog)("Add_PDFToolsFTE_NoShadowRoot", "Shadow root not found on pdfToolsDropdownElement");
    return;
  }

  // Add a slight delay to ensure React has finished rendering and DOM is updated
  setTimeout(function () {
    var _state$gmailConfig4;
    var reactRoot = shadowRoot.querySelector("#pdf-tools-react-root");
    var ctaButton = shadowRoot.querySelector(".cvPdfTools-pdf-entrypoint-button");
    if (!reactRoot || !ctaButton) {
      (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendErrorLog)("PDFToolsFTE_ReactElementsNotFound", "React root or CTA button not found in shadow DOM");
      return;
    }

    // Append tooltip to reactRoot
    // CSS handles all positioning: position (absolute), right (0), top (42px), arrow position (52px from right)
    reactRoot.appendChild(tooltip);

    // Add hover listener to CTA button to dismiss FTE when context menu opens
    var _handleCtaHover = function handleCtaHover() {
      tooltip.remove();
      _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip.eligibleFte.type = "";
      (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendAnalytics)([[DIRECT_VERB_FTE_DISMISSED_ANALYTICS_EVENT, {
        source: "gmail_chrome",
        workflow: "pdf_tools"
      }]]);
      // Remove using the stored handler reference
      if (tooltip.clickOutsideHandler) {
        document.removeEventListener("click", tooltip.clickOutsideHandler);
      }
      ctaButton.removeEventListener("mouseenter", _handleCtaHover);
    };
    ctaButton.addEventListener("mouseenter", _handleCtaHover, {
      once: true
    });

    // Send analytics
    (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendAnalytics)([["DCBrowserExt:DirectVerb:Fte:Shown", {
      source: "gmail_chrome",
      workflow: "pdf_tools"
    }]]);
    (0,_utils_fte_utils_js__WEBPACK_IMPORTED_MODULE_3__.updateFteToolTipCoolDown)(_state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 || (_state$gmailConfig4 = _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].gmailConfig) === null || _state$gmailConfig4 === void 0 || (_state$gmailConfig4 = _state$gmailConfig4.fteConfig) === null || _state$gmailConfig4 === void 0 ? void 0 : _state$gmailConfig4.tooltip, PDF_TOOLS_FTE_TOOLTIP_STORAGE_KEY).then(function (fteState) {
      _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip = _objectSpread(_objectSpread({}, _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === null || _state_js__WEBPACK_IMPORTED_MODULE_0__["default"] === void 0 ? void 0 : _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].fteToolTip), fteState);
    });
  }, 50); // 50ms delay to ensure DOM is updated
};

/**
 * Check eligibility and add PDF Tools FTE tooltip if conditions are met
 */
var addPdfToolsFTETooltipIfEligible = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(pdfToolsDropdownElement) {
    var fteConfig;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return initDcLocalStorage();
        case 2:
          _context.next = 4;
          return chrome.storage.local.get(PDF_TOOLS_FTE_TOOLTIP_STORAGE_KEY);
        case 4:
          _context.t0 = PDF_TOOLS_FTE_TOOLTIP_STORAGE_KEY;
          fteConfig = _context.sent[_context.t0];
          if (!((fteConfig === null || fteConfig === void 0 ? void 0 : fteConfig.count) >= 1)) {
            _context.next = 9;
            break;
          }
          // PDF tools FTE only shown once per user
          gmailPdfToolsFteCoachmark.setEligibility(false);
          return _context.abrupt("return");
        case 9:
          gmailPdfToolsFteCoachmark.setEligibility(true, function () {
            addPdfToolsFteTooltipToAttachmentDiv(pdfToolsDropdownElement);
          });
          // Trigger ShowOneChild to render the first eligible FTE
          chrome.runtime.sendMessage({
            main_op: "reRenderShowOneChild"
          });
        case 11:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function addPdfToolsFTETooltipIfEligible(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Main export: Render PDF Tools dropdown in Gmail native viewer
 *
 * @param {string} urlForAttachment - Attachment URL
 * @param {string} attachmentName - Attachment file name
 * @param {Function} getFileDetailsElementInNativeViewer - Function to get file details element
 * @returns {Promise<void>}
 */
var renderPdfToolsDropdown = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(urlForAttachment, attachmentName, getFileDetailsElementInNativeViewer) {
    var _parentElement$childN;
    var parentElement;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          parentElement = (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.getParentElementForNativeViewerPrompt)();
          if (!(parentElement && (parentElement === null || parentElement === void 0 || (_parentElement$childN = parentElement.childNodes) === null || _parentElement$childN === void 0 ? void 0 : _parentElement$childN.length) > 0)) {
            _context2.next = 3;
            break;
          }
          return _context2.abrupt("return", __webpack_require__("./chrome/content_scripts/gmail lazy recursive referencedExports: default")(chrome.runtime.getURL("dist/PdfToolsDropdown.js")).then(function (module) {
            var pdfToolsDropdownManager = module["default"];
            return pdfToolsDropdownManager.render(function (intent) {
              // Handle PDF tool verb clicks
              var promotionSource = (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.buildAcrobatPromotionSource)("gmail_chrome", intent === "openInAcrobat" ? "native_view" : intent);
              var viewerURL = (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.createURLForAttachment)(urlForAttachment, promotionSource, attachmentName, intent === "openInAcrobat" ? "preview" : intent);
              window.open(viewerURL, "_blank");
            }, "gmailNativeViewer");
          }).then(function (pdfDropdownElement) {
            parentElement.insertBefore(pdfDropdownElement, parentElement.childNodes[0]);
            _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].nativeViewerPromptState.nativeViewerAttachmentURL = urlForAttachment;
            _state_js__WEBPACK_IMPORTED_MODULE_0__["default"].nativeViewerPromptState.previousFileDetailsElement = getFileDetailsElementInNativeViewer();
            if (window.innerWidth > 1200) {
              addPdfToolsFTETooltipIfEligible(pdfDropdownElement);
            }
          })["catch"](function (e) {
            (0,_utils_util_js__WEBPACK_IMPORTED_MODULE_1__.sendErrorLog)("PDFTools_ReactRenderError", e.message);
            throw e; // Re-throw so parent can handle cleanup
          }));
        case 3:
          throw new Error("Parent element not found for PDF Tools dropdown");
        case 4:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function renderPdfToolsDropdown(_x2, _x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Remove/cleanup PDF Tools dropdown from native viewer
 * Properly unmounts React component and removes DOM element
 *
 * @returns {Promise<void>}
 */
var removePdfToolsDropdown = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var pdfToolsTouchPoint;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          pdfToolsTouchPoint = document.querySelector(".".concat(PDF_TOOLS_TOUCHPOINT_CLASS));
          if (!pdfToolsTouchPoint) {
            _context3.next = 3;
            break;
          }
          return _context3.abrupt("return", __webpack_require__("./chrome/content_scripts/gmail lazy recursive referencedExports: default")(chrome.runtime.getURL("dist/PdfToolsDropdown.js")).then(function (module) {
            var pdfToolsDropdownManager = module["default"];
            // Only try to unmount if the manager has a shadow root (valid state)
            if (pdfToolsDropdownManager && pdfToolsDropdownManager.isRendered()) {
              pdfToolsDropdownManager.remove();
            }
          })["catch"](function () {
            // Import failed (e.g., extension context invalidated)
            // Element will be cleaned up in finally block
          })["finally"](function () {
            // Always ensure the DOM element is removed
            // This handles edge cases:
            // 1. Extension reloaded: module reconstructed, isRendered() returns false
            // 2. Import failed: dynamic import threw error
            // 3. Manager couldn't unmount: shadow root doesn't exist
            var element = document.querySelector(".".concat(PDF_TOOLS_TOUCHPOINT_CLASS));
            if (element && element.parentElement) {
              element.parentElement.removeChild(element);
            }
          }));
        case 3:
          return _context3.abrupt("return", Promise.resolve());
        case 4:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function removePdfToolsDropdown() {
    return _ref3.apply(this, arguments);
  };
}();


/***/ })

};

//# sourceMappingURL=chrome_content_scripts_gmail_native-viewer-pdf-tools-module_js.js.map