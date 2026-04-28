import { jsxs as N, jsx as M } from "react/jsx-runtime";
import { useState as se, useEffect as Qe, useRef as e0, useCallback as le, isValidElement as jl, cloneElement as fn, Children as gn } from "react";
import { useTranslation as Ul } from "react-i18next";
class E extends Error {
  // Error start position based on passed-in Token or ParseNode.
  // Length of affected text based on passed-in Token or ParseNode.
  // The underlying error message without any context added.
  constructor(e, t) {
    var a = "KaTeX parse error: " + e, n, i, o = t && t.loc;
    if (o && o.start <= o.end) {
      var u = o.lexer.input;
      n = o.start, i = o.end, n === u.length ? a += " at end of input: " : a += " at position " + (n + 1) + ": ";
      var d = u.slice(n, i).replace(/[^]/g, "$&̲"), p;
      n > 15 ? p = "…" + u.slice(n - 15, n) : p = u.slice(0, n);
      var b;
      i + 15 < u.length ? b = u.slice(i, i + 15) + "…" : b = u.slice(i), a += p + d + b;
    }
    super(a), this.name = "ParseError", Object.setPrototypeOf(this, E.prototype), this.position = n, n != null && i != null && (this.length = i - n), this.rawMessage = e;
  }
}
var Vl = /([A-Z])/g, qa = (r) => r.replace(Vl, "-$1").toLowerCase(), Yl = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  '"': "&quot;",
  "'": "&#x27;"
}, Xl = /[&><"']/g, Pe = (r) => String(r).replace(Xl, (e) => Yl[e]), gr = (r) => r.type === "ordgroup" || r.type === "color" ? r.body.length === 1 ? gr(r.body[0]) : r : r.type === "font" ? gr(r.body) : r, Kl = /* @__PURE__ */ new Set(["mathord", "textord", "atom"]), L0 = (r) => Kl.has(gr(r).type), Zl = (r) => {
  var e = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(r);
  return e ? e[2] !== ":" || !/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(e[1]) ? null : e[1].toLowerCase() : "_relative";
}, ba = {
  displayMode: {
    type: "boolean",
    description: "Render math in display mode, which puts the math in display style (so \\int and \\sum are large, for example), and centers the math on the page on its own line.",
    cli: "-d, --display-mode"
  },
  output: {
    type: {
      enum: ["htmlAndMathml", "html", "mathml"]
    },
    description: "Determines the markup language of the output.",
    cli: "-F, --format <type>"
  },
  leqno: {
    type: "boolean",
    description: "Render display math in leqno style (left-justified tags)."
  },
  fleqn: {
    type: "boolean",
    description: "Render display math flush left."
  },
  throwOnError: {
    type: "boolean",
    default: !0,
    cli: "-t, --no-throw-on-error",
    cliDescription: "Render errors (in the color given by --error-color) instead of throwing a ParseError exception when encountering an error."
  },
  errorColor: {
    type: "string",
    default: "#cc0000",
    cli: "-c, --error-color <color>",
    cliDescription: "A color string given in the format 'rgb' or 'rrggbb' (no #). This option determines the color of errors rendered by the -t option.",
    cliProcessor: (r) => "#" + r
  },
  macros: {
    type: "object",
    cli: "-m, --macro <def>",
    cliDescription: "Define custom macro of the form '\\foo:expansion' (use multiple -m arguments for multiple macros).",
    cliDefault: [],
    cliProcessor: (r, e) => (e.push(r), e)
  },
  minRuleThickness: {
    type: "number",
    description: "Specifies a minimum thickness, in ems, for fraction lines, `\\sqrt` top lines, `{array}` vertical lines, `\\hline`, `\\hdashline`, `\\underline`, `\\overline`, and the borders of `\\fbox`, `\\boxed`, and `\\fcolorbox`.",
    processor: (r) => Math.max(0, r),
    cli: "--min-rule-thickness <size>",
    cliProcessor: parseFloat
  },
  colorIsTextColor: {
    type: "boolean",
    description: "Makes \\color behave like LaTeX's 2-argument \\textcolor, instead of LaTeX's one-argument \\color mode change.",
    cli: "-b, --color-is-text-color"
  },
  strict: {
    type: [{
      enum: ["warn", "ignore", "error"]
    }, "boolean", "function"],
    description: "Turn on strict / LaTeX faithfulness mode, which throws an error if the input uses features that are not supported by LaTeX.",
    cli: "-S, --strict",
    cliDefault: !1
  },
  trust: {
    type: ["boolean", "function"],
    description: "Trust the input, enabling all HTML features such as \\url.",
    cli: "-T, --trust"
  },
  maxSize: {
    type: "number",
    default: 1 / 0,
    description: "If non-zero, all user-specified sizes, e.g. in \\rule{500em}{500em}, will be capped to maxSize ems. Otherwise, elements and spaces can be arbitrarily large",
    processor: (r) => Math.max(0, r),
    cli: "-s, --max-size <n>",
    cliProcessor: parseInt
  },
  maxExpand: {
    type: "number",
    default: 1e3,
    description: "Limit the number of macro expansions to the specified number, to prevent e.g. infinite macro loops. If set to Infinity, the macro expander will try to fully expand as in LaTeX.",
    processor: (r) => Math.max(0, r),
    cli: "-e, --max-expand <n>",
    cliProcessor: (r) => r === "Infinity" ? 1 / 0 : parseInt(r)
  },
  globalGroup: {
    type: "boolean",
    cli: !1
  }
};
function Jl(r) {
  if ("default" in r)
    return r.default;
  var e = r.type, t = Array.isArray(e) ? e[0] : e;
  if (typeof t != "string")
    return t.enum[0];
  switch (t) {
    case "boolean":
      return !1;
    case "string":
      return "";
    case "number":
      return 0;
    case "object":
      return {};
  }
}
class Oa {
  constructor(e) {
    e === void 0 && (e = {}), e = e || {};
    for (var t of Object.keys(ba)) {
      var a = ba[t], n = e[t];
      this[t] = n !== void 0 ? a.processor ? a.processor(n) : n : Jl(a);
    }
  }
  /**
   * Report nonstrict (non-LaTeX-compatible) input.
   * Can safely not be called if `this.strict` is false in JavaScript.
   */
  reportNonstrict(e, t, a) {
    var n = this.strict;
    if (typeof n == "function" && (n = n(e, t, a)), !(!n || n === "ignore")) {
      if (n === !0 || n === "error")
        throw new E("LaTeX-incompatible input and strict mode is set to 'error': " + (t + " [" + e + "]"), a);
      n === "warn" ? typeof console < "u" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (t + " [" + e + "]")) : typeof console < "u" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + n + "': " + t + " [" + e + "]"));
    }
  }
  /**
   * Check whether to apply strict (LaTeX-adhering) behavior for unusual
   * input (like `\\`).  Unlike `nonstrict`, will not throw an error;
   * instead, "error" translates to a return value of `true`, while "ignore"
   * translates to a return value of `false`.  May still print a warning:
   * "warn" prints a warning and returns `false`.
   * This is for the second category of `errorCode`s listed in the README.
   */
  useStrictBehavior(e, t, a) {
    var n = this.strict;
    if (typeof n == "function")
      try {
        n = n(e, t, a);
      } catch {
        n = "error";
      }
    return !n || n === "ignore" ? !1 : n === !0 || n === "error" ? !0 : n === "warn" ? (typeof console < "u" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (t + " [" + e + "]")), !1) : (typeof console < "u" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + n + "': " + t + " [" + e + "]")), !1);
  }
  /**
   * Check whether to test potentially dangerous input, and return
   * `true` (trusted) or `false` (untrusted).  The sole argument `context`
   * should be an object with `command` field specifying the relevant LaTeX
   * command (as a string starting with `\`), and any other arguments, etc.
   * If `context` has a `url` field, a `protocol` field will automatically
   * get added by this function (changing the specified object).
   */
  isTrusted(e) {
    if ("url" in e && e.url && !e.protocol) {
      var t = Zl(e.url);
      if (t == null)
        return !1;
      e.protocol = t;
    }
    var a = typeof this.trust == "function" ? this.trust(e) : this.trust;
    return !!a;
  }
}
class V0 {
  constructor(e, t, a) {
    this.id = e, this.size = t, this.cramped = a;
  }
  /**
   * Get the style of a superscript given a base in the current style.
   */
  sup() {
    return S0[Ql[this.id]];
  }
  /**
   * Get the style of a subscript given a base in the current style.
   */
  sub() {
    return S0[es[this.id]];
  }
  /**
   * Get the style of a fraction numerator given the fraction in the current
   * style.
   */
  fracNum() {
    return S0[ts[this.id]];
  }
  /**
   * Get the style of a fraction denominator given the fraction in the current
   * style.
   */
  fracDen() {
    return S0[rs[this.id]];
  }
  /**
   * Get the cramped version of a style (in particular, cramping a cramped style
   * doesn't change the style).
   */
  cramp() {
    return S0[as[this.id]];
  }
  /**
   * Get a text or display version of this style.
   */
  text() {
    return S0[ns[this.id]];
  }
  /**
   * Return true if this style is tightly spaced (scriptstyle/scriptscriptstyle)
   */
  isTight() {
    return this.size >= 2;
  }
}
var La = 0, wr = 1, vt = 2, D0 = 3, Lt = 4, o0 = 5, yt = 6, Ue = 7, S0 = [new V0(La, 0, !1), new V0(wr, 0, !0), new V0(vt, 1, !1), new V0(D0, 1, !0), new V0(Lt, 2, !1), new V0(o0, 2, !0), new V0(yt, 3, !1), new V0(Ue, 3, !0)], Ql = [Lt, o0, Lt, o0, yt, Ue, yt, Ue], es = [o0, o0, o0, o0, Ue, Ue, Ue, Ue], ts = [vt, D0, Lt, o0, yt, Ue, yt, Ue], rs = [D0, D0, o0, o0, Ue, Ue, Ue, Ue], as = [wr, wr, D0, D0, o0, o0, Ue, Ue], ns = [La, wr, vt, D0, vt, D0, vt, D0], K = {
  DISPLAY: S0[La],
  TEXT: S0[vt],
  SCRIPT: S0[Lt],
  SCRIPTSCRIPT: S0[yt]
}, ya = [{
  // Latin characters beyond the Latin-1 characters we have metrics for.
  // Needed for Czech, Hungarian and Turkish text, for example.
  name: "latin",
  blocks: [
    [256, 591],
    // Latin Extended-A and Latin Extended-B
    [768, 879]
    // Combining Diacritical marks
  ]
}, {
  // The Cyrillic script used by Russian and related languages.
  // A Cyrillic subset used to be supported as explicitly defined
  // symbols in symbols.js
  name: "cyrillic",
  blocks: [[1024, 1279]]
}, {
  // Armenian
  name: "armenian",
  blocks: [[1328, 1423]]
}, {
  // The Brahmic scripts of South and Southeast Asia
  // Devanagari (0900–097F)
  // Bengali (0980–09FF)
  // Gurmukhi (0A00–0A7F)
  // Gujarati (0A80–0AFF)
  // Oriya (0B00–0B7F)
  // Tamil (0B80–0BFF)
  // Telugu (0C00–0C7F)
  // Kannada (0C80–0CFF)
  // Malayalam (0D00–0D7F)
  // Sinhala (0D80–0DFF)
  // Thai (0E00–0E7F)
  // Lao (0E80–0EFF)
  // Tibetan (0F00–0FFF)
  // Myanmar (1000–109F)
  name: "brahmic",
  blocks: [[2304, 4255]]
}, {
  name: "georgian",
  blocks: [[4256, 4351]]
}, {
  // Chinese and Japanese.
  // The "k" in cjk is for Korean, but we've separated Korean out
  name: "cjk",
  blocks: [
    [12288, 12543],
    // CJK symbols and punctuation, Hiragana, Katakana
    [19968, 40879],
    // CJK ideograms
    [65280, 65376]
    // Fullwidth punctuation
    // TODO: add halfwidth Katakana and Romanji glyphs
  ]
}, {
  // Korean
  name: "hangul",
  blocks: [[44032, 55215]]
}];
function is(r) {
  for (var e = 0; e < ya.length; e++)
    for (var t = ya[e], a = 0; a < t.blocks.length; a++) {
      var n = t.blocks[a];
      if (r >= n[0] && r <= n[1])
        return t.name;
    }
  return null;
}
var vr = [];
ya.forEach((r) => r.blocks.forEach((e) => vr.push(...e)));
function oi(r) {
  for (var e = 0; e < vr.length; e += 2)
    if (r >= vr[e] && r <= vr[e + 1])
      return !0;
  return !1;
}
var Be = (r) => r + " " + r, gt = 80, ls = function(e, t) {
  return "M95," + (622 + e + t) + `
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l` + e / 2.075 + " -" + e + `
c5.3,-9.3,12,-14,20,-14
H400000v` + (40 + e) + `H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M` + (834 + e) + " " + t + "h400000v" + (40 + e) + "h-400000z";
}, ss = function(e, t) {
  return "M263," + (601 + e + t) + `c0.7,0,18,39.7,52,119
c34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120
c340,-704.7,510.7,-1060.3,512,-1067
l` + e / 2.084 + " -" + e + `
c4.7,-7.3,11,-11,19,-11
H40000v` + (40 + e) + `H1012.3
s-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232
c-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1
s-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26
c-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z
M` + (1001 + e) + " " + t + "h400000v" + (40 + e) + "h-400000z";
}, os = function(e, t) {
  return "M983 " + (10 + e + t) + `
l` + e / 3.13 + " -" + e + `
c4,-6.7,10,-10,18,-10 H400000v` + (40 + e) + `
H1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7
s-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744
c-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30
c26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722
c56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5
c53.7,-170.3,84.5,-266.8,92.5,-289.5z
M` + (1001 + e) + " " + t + "h400000v" + (40 + e) + "h-400000z";
}, us = function(e, t) {
  return "M424," + (2398 + e + t) + `
c-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514
c0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20
s-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121
s209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081
l` + e / 4.223 + " -" + e + `c4,-6.7,10,-10,18,-10 H400000
v` + (40 + e) + `H1014.6
s-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185
c-2,6,-10,9,-24,9
c-8,0,-12,-0.7,-12,-2z M` + (1001 + e) + " " + t + `
h400000v` + (40 + e) + "h-400000z";
}, cs = function(e, t) {
  return "M473," + (2713 + e + t) + `
c339.3,-1799.3,509.3,-2700,510,-2702 l` + e / 5.298 + " -" + e + `
c3.3,-7.3,9.3,-11,18,-11 H400000v` + (40 + e) + `H1017.7
s-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9
c-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200
c0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26
s76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,
606zM` + (1001 + e) + " " + t + "h400000v" + (40 + e) + "H1017.7z";
}, ds = function(e) {
  var t = e / 2;
  return "M400000 " + e + " H0 L" + t + " 0 l65 45 L145 " + (e - 80) + " H400000z";
}, hs = function(e, t, a) {
  var n = a - 54 - t - e;
  return "M702 " + (e + t) + "H400000" + (40 + e) + `
H742v` + n + `l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1
h-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170
c-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667
219 661 l218 661zM702 ` + t + "H400000v" + (40 + e) + "H742z";
}, ms = function(e, t, a) {
  t = 1e3 * t;
  var n = "";
  switch (e) {
    case "sqrtMain":
      n = ls(t, gt);
      break;
    case "sqrtSize1":
      n = ss(t, gt);
      break;
    case "sqrtSize2":
      n = os(t, gt);
      break;
    case "sqrtSize3":
      n = us(t, gt);
      break;
    case "sqrtSize4":
      n = cs(t, gt);
      break;
    case "sqrtTall":
      n = hs(t, gt, a);
  }
  return n;
}, ps = function(e, t) {
  switch (e) {
    case "⎜":
      return Be("M291 0 H417 V" + t + " H291z");
    case "∣":
      return Be("M145 0 H188 V" + t + " H145z");
    case "∥":
      return Be("M145 0 H188 V" + t + " H145z") + Be("M367 0 H410 V" + t + " H367z");
    case "⎟":
      return Be("M457 0 H583 V" + t + " H457z");
    case "⎢":
      return Be("M319 0 H403 V" + t + " H319z");
    case "⎥":
      return Be("M263 0 H347 V" + t + " H263z");
    case "⎪":
      return Be("M384 0 H504 V" + t + " H384z");
    case "⏐":
      return Be("M312 0 H355 V" + t + " H312z");
    case "‖":
      return Be("M257 0 H300 V" + t + " H257z") + Be("M478 0 H521 V" + t + " H478z");
    default:
      return "";
  }
}, vn = {
  // The doubleleftarrow geometry is from glyph U+21D0 in the font KaTeX Main
  doubleleftarrow: `M262 157
l10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3
 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28
 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5
c2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5
 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87
-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7
-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z
m8 0v40h399730v-40zm0 194v40h399730v-40z`,
  // doublerightarrow is from glyph U+21D2 in font KaTeX Main
  doublerightarrow: `M399738 392l
-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5
 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88
-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68
-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18
-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782
c-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3
-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z`,
  // leftarrow is from glyph U+2190 in font KaTeX Main
  leftarrow: `M400000 241H110l3-3c68.7-52.7 113.7-120
 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8
-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247
c-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208
 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3
 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202
 l-3-3h399890zM100 241v40h399900v-40z`,
  // overbrace is from glyphs U+23A9/23A8/23A7 in font KaTeX_Size4-Regular
  leftbrace: `M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117
-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7
 5-6 9-10 13-.7 1-7.3 1-20 1H6z`,
  leftbraceunder: `M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13
 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688
 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7
-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z`,
  // overgroup is from the MnSymbol package (public domain)
  leftgroup: `M400000 80
H435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0
 435 0h399565z`,
  leftgroupunder: `M400000 262
H435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219
 435 219h399565z`,
  // Harpoons are from glyph U+21BD in font KaTeX Main
  leftharpoon: `M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3
-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5
-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7
-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z`,
  leftharpoonplus: `M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5
 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3
-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7
-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z
m0 0v40h400000v-40z`,
  leftharpoondown: `M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333
 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5
 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667
-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z`,
  leftharpoondownplus: `M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12
 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7
-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0
v40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z`,
  // hook is from glyph U+21A9 in font KaTeX Main
  lefthook: `M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5
-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3
-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21
 71.5 23h399859zM103 281v-40h399897v40z`,
  leftlinesegment: Be("M40 281 V428 H0 V94 H40 V241 H400000 v40z"),
  leftbracketunder: Be("M0 0 h120 V290 H399995 v120 H0z"),
  leftbracketover: Be("M0 440 h120 V150 H399995 v-120 H0z"),
  leftmapsto: Be("M40 281 V448H0V74H40V241H400000v40z"),
  // tofrom is from glyph U+21C4 in font KaTeX AMS Regular
  leftToFrom: `M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23
-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8
c28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3
 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z`,
  longequal: Be("M0 50 h400000 v40H0z m0 194h40000v40H0z"),
  midbrace: `M200428 334
c-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14
-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7
 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11
 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z`,
  midbraceunder: `M199572 214
c100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14
 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3
 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0
-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z`,
  oiintSize1: `M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6
-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z
m368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8
60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z`,
  oiintSize2: `M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8
-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z
m502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2
c0 110 84 276 504 276s502.4-166 502.4-276z`,
  oiiintSize1: `M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6
-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z
m525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0
85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z`,
  oiiintSize2: `M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8
-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z
m770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1
c0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z`,
  rightarrow: `M0 241v40h399891c-47.3 35.3-84 78-110 128
-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20
 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7
 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85
-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5
-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67
 151.7 139 205zm0 0v40h399900v-40z`,
  rightbrace: `M400000 542l
-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5
s-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1
c124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z`,
  rightbraceunder: `M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3
 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237
-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z`,
  rightgroup: `M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0
 3-1 3-3v-38c-76-158-257-219-435-219H0z`,
  rightgroupunder: `M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18
 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z`,
  rightharpoon: `M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3
-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2
-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58
 69.2 92 94.5zm0 0v40h399900v-40z`,
  rightharpoonplus: `M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11
-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7
 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z
m0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z`,
  rightharpoondown: `M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8
 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5
-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95
-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z`,
  rightharpoondownplus: `M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8
 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3
 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3
-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z
m0-194v40h400000v-40zm0 0v40h400000v-40z`,
  righthook: `M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3
 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0
-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21
 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z`,
  rightlinesegment: Be("M399960 241 V94 h40 V428 h-40 V281 H0 v-40z"),
  rightbracketunder: Be("M399995 0 h-120 V290 H0 v120 H400000z"),
  rightbracketover: Be("M399995 440 h-120 V150 H0 v-120 H399995z"),
  rightToFrom: `M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23
 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32
-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142
-167z M100 147v40h399900v-40zM0 341v40h399900v-40z`,
  // twoheadleftarrow is from glyph U+219E in font KaTeX AMS Regular
  twoheadleftarrow: `M0 167c68 40
 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69
-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3
-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19
-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101
 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z`,
  twoheadrightarrow: `M400000 167
c-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3
 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42
 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333
-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70
 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z`,
  // tilde1 is a modified version of a glyph from the MnSymbol package
  tilde1: `M200 55.538c-77 0-168 73.953-177 73.953-3 0-7
-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0
 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0
 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128
-68.267.847-113-73.952-191-73.952z`,
  // ditto tilde2, tilde3, & tilde4
  tilde2: `M344 55.266c-142 0-300.638 81.316-311.5 86.418
-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9
 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114
c1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751
 181.476 676 181.476c-149 0-189-126.21-332-126.21z`,
  tilde3: `M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457
-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0
 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697
 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696
 -338 0-409-156.573-744-156.573z`,
  tilde4: `M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345
-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409
 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9
 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409
 -175.236-744-175.236z`,
  // vec is from glyph U+20D7 in font KaTeX Main
  vec: `M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5
3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11
10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63
-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1
-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59
H213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359
c-16-25.333-24-45-24-59z`,
  // widehat1 is a modified version of a glyph from the MnSymbol package
  widehat1: `M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22
c-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z`,
  // ditto widehat2, widehat3, & widehat4
  widehat2: `M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`,
  widehat3: `M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`,
  widehat4: `M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`,
  // widecheck paths are all inverted versions of widehat
  widecheck1: `M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,
-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z`,
  widecheck2: `M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`,
  widecheck3: `M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`,
  widecheck4: `M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`,
  // The next ten paths support reaction arrows from the mhchem package.
  // Arrows for \ce{<-->} are offset from xAxis by 0.22ex, per mhchem in LaTeX
  // baraboveleftarrow is mostly from glyph U+2190 in font KaTeX Main
  baraboveleftarrow: `M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202
c4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5
c-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130
s-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47
121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6
s2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11
c0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z
M100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z`,
  // rightarrowabovebar is mostly from glyph U+2192, KaTeX Main
  rightarrowabovebar: `M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32
-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0
13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39
-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5
-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5
-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67
151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z`,
  // The short left harpoon has 0.5em (i.e. 500 units) kern on the left end.
  // Ref from mhchem.sty: \rlap{\raisebox{-.22ex}{$\kern0.5em
  baraboveshortleftharpoon: `M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11
c1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17
c2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21
c-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40
c-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z
M0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z`,
  rightharpoonaboveshortbar: `M0,241 l0,40c399126,0,399993,0,399993,0
c4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,
-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6
c-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z
M0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z`,
  shortbaraboveleftharpoon: `M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11
c1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,
1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,
-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z
M93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z`,
  shortrightharpoonabovebar: `M53,241l0,40c398570,0,399437,0,399437,0
c4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,
-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6
c-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z
M500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z`
}, fs = function(e, t) {
  switch (e) {
    case "lbrack":
      return "M403 1759 V84 H666 V0 H319 V1759 v" + t + ` v1759 h347 v-84
H403z M403 1759 V0 H319 V1759 v` + t + " v1759 h84z";
    case "rbrack":
      return "M347 1759 V0 H0 V84 H263 V1759 v" + t + ` v1759 H0 v84 H347z
M347 1759 V0 H263 V1759 v` + t + " v1759 h84z";
    case "vert":
      return "M145 15 v585 v" + t + ` v585 c2.667,10,9.667,15,21,15
c10,0,16.667,-5,20,-15 v-585 v` + -t + ` v-585 c-2.667,-10,-9.667,-15,-21,-15
c-10,0,-16.667,5,-20,15z M188 15 H145 v585 v` + t + " v585 h43z";
    case "doublevert":
      return "M145 15 v585 v" + t + ` v585 c2.667,10,9.667,15,21,15
c10,0,16.667,-5,20,-15 v-585 v` + -t + ` v-585 c-2.667,-10,-9.667,-15,-21,-15
c-10,0,-16.667,5,-20,15z M188 15 H145 v585 v` + t + ` v585 h43z
M367 15 v585 v` + t + ` v585 c2.667,10,9.667,15,21,15
c10,0,16.667,-5,20,-15 v-585 v` + -t + ` v-585 c-2.667,-10,-9.667,-15,-21,-15
c-10,0,-16.667,5,-20,15z M410 15 H367 v585 v` + t + " v585 h43z";
    case "lfloor":
      return "M319 602 V0 H403 V602 v" + t + ` v1715 h263 v84 H319z
MM319 602 V0 H403 V602 v` + t + " v1715 H319z";
    case "rfloor":
      return "M319 602 V0 H403 V602 v" + t + ` v1799 H0 v-84 H319z
MM319 602 V0 H403 V602 v` + t + " v1715 H319z";
    case "lceil":
      return "M403 1759 V84 H666 V0 H319 V1759 v" + t + ` v602 h84z
M403 1759 V0 H319 V1759 v` + t + " v602 h84z";
    case "rceil":
      return "M347 1759 V0 H0 V84 H263 V1759 v" + t + ` v602 h84z
M347 1759 V0 h-84 V1759 v` + t + " v602 h84z";
    case "lparen":
      return `M863,9c0,-2,-2,-5,-6,-9c0,0,-17,0,-17,0c-12.7,0,-19.3,0.3,-20,1
c-5.3,5.3,-10.3,11,-15,17c-242.7,294.7,-395.3,682,-458,1162c-21.3,163.3,-33.3,349,
-36,557 l0,` + (t + 84) + `c0.2,6,0,26,0,60c2,159.3,10,310.7,24,454c53.3,528,210,
949.7,470,1265c4.7,6,9.7,11.7,15,17c0.7,0.7,7,1,19,1c0,0,18,0,18,0c4,-4,6,-7,6,-9
c0,-2.7,-3.3,-8.7,-10,-18c-135.3,-192.7,-235.5,-414.3,-300.5,-665c-65,-250.7,-102.5,
-544.7,-112.5,-882c-2,-104,-3,-167,-3,-189
l0,-` + (t + 92) + `c0,-162.7,5.7,-314,17,-454c20.7,-272,63.7,-513,129,-723c65.3,
-210,155.3,-396.3,270,-559c6.7,-9.3,10,-15.3,10,-18z`;
    case "rparen":
      return `M76,0c-16.7,0,-25,3,-25,9c0,2,2,6.3,6,13c21.3,28.7,42.3,60.3,
63,95c96.7,156.7,172.8,332.5,228.5,527.5c55.7,195,92.8,416.5,111.5,664.5
c11.3,139.3,17,290.7,17,454c0,28,1.7,43,3.3,45l0,` + (t + 9) + `
c-3,4,-3.3,16.7,-3.3,38c0,162,-5.7,313.7,-17,455c-18.7,248,-55.8,469.3,-111.5,664
c-55.7,194.7,-131.8,370.3,-228.5,527c-20.7,34.7,-41.7,66.3,-63,95c-2,3.3,-4,7,-6,11
c0,7.3,5.7,11,17,11c0,0,11,0,11,0c9.3,0,14.3,-0.3,15,-1c5.3,-5.3,10.3,-11,15,-17
c242.7,-294.7,395.3,-681.7,458,-1161c21.3,-164.7,33.3,-350.7,36,-558
l0,-` + (t + 144) + `c-2,-159.3,-10,-310.7,-24,-454c-53.3,-528,-210,-949.7,
-470,-1265c-4.7,-6,-9.7,-11.7,-15,-17c-0.7,-0.7,-6.7,-1,-18,-1z`;
    default:
      throw new Error("Unknown stretchy delimiter.");
  }
};
class St {
  // Never used; needed for satisfying interface.
  constructor(e) {
    this.children = e, this.classes = [], this.height = 0, this.depth = 0, this.maxFontSize = 0, this.style = {};
  }
  hasClass(e) {
    return this.classes.includes(e);
  }
  /** Convert the fragment into a node. */
  toNode() {
    for (var e = document.createDocumentFragment(), t = 0; t < this.children.length; t++)
      e.appendChild(this.children[t].toNode());
    return e;
  }
  /** Convert the fragment into HTML markup. */
  toMarkup() {
    for (var e = "", t = 0; t < this.children.length; t++)
      e += this.children[t].toMarkup();
    return e;
  }
  /**
   * Converts the math node into a string, similar to innerText. Applies to
   * MathDomNode's only.
   */
  toText() {
    var e = (t) => t.toText();
    return this.children.map(e).join("");
  }
}
var xa = {
  // https://en.wikibooks.org/wiki/LaTeX/Lengths and
  // https://tex.stackexchange.com/a/8263
  pt: 1,
  // TeX point
  mm: 7227 / 2540,
  // millimeter
  cm: 7227 / 254,
  // centimeter
  in: 72.27,
  // inch
  bp: 803 / 800,
  // big (PostScript) points
  pc: 12,
  // pica
  dd: 1238 / 1157,
  // didot
  cc: 14856 / 1157,
  // cicero (12 didot)
  nd: 685 / 642,
  // new didot
  nc: 1370 / 107,
  // new cicero (12 new didot)
  sp: 1 / 65536,
  // scaled point (TeX's internal smallest unit)
  // https://tex.stackexchange.com/a/41371
  px: 803 / 800
  // \pdfpxdimen defaults to 1 bp in pdfTeX and LuaTeX
}, gs = {
  ex: !0,
  em: !0,
  mu: !0
}, ui = function(e) {
  return typeof e != "string" && (e = e.unit), e in xa || e in gs || e === "ex";
}, we = function(e, t) {
  var a;
  if (e.unit in xa)
    a = xa[e.unit] / t.fontMetrics().ptPerEm / t.sizeMultiplier;
  else if (e.unit === "mu")
    a = t.fontMetrics().cssEmPerMu;
  else {
    var n;
    if (t.style.isTight() ? n = t.havingStyle(t.style.text()) : n = t, e.unit === "ex")
      a = n.fontMetrics().xHeight;
    else if (e.unit === "em")
      a = n.fontMetrics().quad;
    else
      throw new E("Invalid unit: '" + e.unit + "'");
    n !== t && (a *= n.sizeMultiplier / t.sizeMultiplier);
  }
  return Math.min(e.number * a, t.maxSize);
}, q = function(e) {
  return +e.toFixed(4) + "em";
}, K0 = function(e) {
  return e.filter((t) => t).join(" ");
}, ci = function(e, t, a) {
  if (this.classes = e || [], this.attributes = {}, this.height = 0, this.depth = 0, this.maxFontSize = 0, this.style = a || {}, t) {
    t.style.isTight() && this.classes.push("mtight");
    var n = t.getColor();
    n && (this.style.color = n);
  }
}, di = function(e) {
  var t = document.createElement(e);
  t.className = K0(this.classes);
  for (var a of Object.keys(this.style))
    t.style[a] = this.style[a];
  for (var n of Object.keys(this.attributes))
    t.setAttribute(n, this.attributes[n]);
  for (var i = 0; i < this.children.length; i++)
    t.appendChild(this.children[i].toNode());
  return t;
}, vs = /[\s"'>/=\x00-\x1f]/, hi = function(e) {
  var t = "<" + e;
  this.classes.length && (t += ' class="' + Pe(K0(this.classes)) + '"');
  var a = "";
  for (var n of Object.keys(this.style))
    a += qa(n) + ":" + this.style[n] + ";";
  a && (t += ' style="' + Pe(a) + '"');
  for (var i of Object.keys(this.attributes)) {
    if (vs.test(i))
      throw new E("Invalid attribute name '" + i + "'");
    t += " " + i + '="' + Pe(this.attributes[i]) + '"';
  }
  t += ">";
  for (var o = 0; o < this.children.length; o++)
    t += this.children[o].toMarkup();
  return t += "</" + e + ">", t;
};
class kt {
  constructor(e, t, a, n) {
    ci.call(this, e, a, n), this.children = t || [];
  }
  /**
   * Sets an arbitrary attribute on the span. Warning: use this wisely. Not
   * all browsers support attributes the same, and having too many custom
   * attributes is probably bad.
   */
  setAttribute(e, t) {
    this.attributes[e] = t;
  }
  hasClass(e) {
    return this.classes.includes(e);
  }
  toNode() {
    return di.call(this, "span");
  }
  toMarkup() {
    return hi.call(this, "span");
  }
}
class Ar {
  constructor(e, t, a, n) {
    ci.call(this, t, n), this.children = a || [], this.setAttribute("href", e);
  }
  setAttribute(e, t) {
    this.attributes[e] = t;
  }
  hasClass(e) {
    return this.classes.includes(e);
  }
  toNode() {
    return di.call(this, "a");
  }
  toMarkup() {
    return hi.call(this, "a");
  }
}
class bs {
  constructor(e, t, a) {
    this.alt = t, this.src = e, this.classes = ["mord"], this.height = 0, this.depth = 0, this.maxFontSize = 0, this.style = a;
  }
  hasClass(e) {
    return this.classes.includes(e);
  }
  toNode() {
    var e = document.createElement("img");
    e.src = this.src, e.alt = this.alt, e.className = "mord";
    for (var t of Object.keys(this.style))
      e.style[t] = this.style[t];
    return e;
  }
  toMarkup() {
    var e = '<img src="' + Pe(this.src) + '"' + (' alt="' + Pe(this.alt) + '"'), t = "";
    for (var a of Object.keys(this.style))
      t += qa(a) + ":" + this.style[a] + ";";
    return t && (e += ' style="' + Pe(t) + '"'), e += "'/>", e;
  }
}
var ys = {
  î: "ı̂",
  ï: "ı̈",
  í: "ı́",
  // 'ī': '\u0131\u0304', // enable when we add Extended Latin
  ì: "ı̀"
};
class r0 {
  constructor(e, t, a, n, i, o, u, d) {
    this.text = e, this.height = t || 0, this.depth = a || 0, this.italic = n || 0, this.skew = i || 0, this.width = o || 0, this.classes = u || [], this.style = d || {}, this.maxFontSize = 0;
    var p = is(this.text.charCodeAt(0));
    p && this.classes.push(p + "_fallback"), /[îïíì]/.test(this.text) && (this.text = ys[this.text]);
  }
  hasClass(e) {
    return this.classes.includes(e);
  }
  /**
   * Creates a text node or span from a symbol node. Note that a span is only
   * created if it is needed.
   */
  toNode() {
    var e = document.createTextNode(this.text), t = null;
    this.italic > 0 && (t = document.createElement("span"), t.style.marginRight = q(this.italic)), this.classes.length > 0 && (t = t || document.createElement("span"), t.className = K0(this.classes));
    for (var a of Object.keys(this.style))
      t = t || document.createElement("span"), t.style[a] = this.style[a];
    return t ? (t.appendChild(e), t) : e;
  }
  /**
   * Creates markup for a symbol node.
   */
  toMarkup() {
    var e = !1, t = "<span";
    this.classes.length && (e = !0, t += ' class="', t += Pe(K0(this.classes)), t += '"');
    var a = "";
    this.italic > 0 && (a += "margin-right:" + q(this.italic) + ";");
    for (var n of Object.keys(this.style))
      a += qa(n) + ":" + this.style[n] + ";";
    a && (e = !0, t += ' style="' + Pe(a) + '"');
    var i = Pe(this.text);
    return e ? (t += ">", t += i, t += "</span>", t) : i;
  }
}
class O0 {
  constructor(e, t) {
    this.children = e || [], this.attributes = t || {};
  }
  toNode() {
    var e = "http://www.w3.org/2000/svg", t = document.createElementNS(e, "svg");
    for (var a of Object.keys(this.attributes))
      t.setAttribute(a, this.attributes[a]);
    for (var n = 0; n < this.children.length; n++)
      t.appendChild(this.children[n].toNode());
    return t;
  }
  toMarkup() {
    var e = '<svg xmlns="http://www.w3.org/2000/svg"';
    for (var t of Object.keys(this.attributes))
      e += " " + t + '="' + Pe(this.attributes[t]) + '"';
    e += ">";
    for (var a = 0; a < this.children.length; a++)
      e += this.children[a].toMarkup();
    return e += "</svg>", e;
  }
}
class Z0 {
  constructor(e, t) {
    this.pathName = e, this.alternate = t;
  }
  toNode() {
    var e = "http://www.w3.org/2000/svg", t = document.createElementNS(e, "path");
    return this.alternate ? t.setAttribute("d", this.alternate) : t.setAttribute("d", vn[this.pathName]), t;
  }
  toMarkup() {
    return this.alternate ? '<path d="' + Pe(this.alternate) + '"/>' : '<path d="' + Pe(vn[this.pathName]) + '"/>';
  }
}
class wa {
  constructor(e) {
    this.attributes = e || {};
  }
  toNode() {
    var e = "http://www.w3.org/2000/svg", t = document.createElementNS(e, "line");
    for (var a of Object.keys(this.attributes))
      t.setAttribute(a, this.attributes[a]);
    return t;
  }
  toMarkup() {
    var e = "<line";
    for (var t of Object.keys(this.attributes))
      e += " " + t + '="' + Pe(this.attributes[t]) + '"';
    return e += "/>", e;
  }
}
function xs(r) {
  if (r instanceof r0)
    return r;
  throw new Error("Expected symbolNode but got " + String(r) + ".");
}
function ws(r) {
  if (r instanceof kt)
    return r;
  throw new Error("Expected span<HtmlDomNode> but got " + String(r) + ".");
}
var Ss = (r) => r instanceof kt || r instanceof Ar || r instanceof St, k0 = {
  "AMS-Regular": {
    32: [0, 0, 0, 0, 0.25],
    65: [0, 0.68889, 0, 0, 0.72222],
    66: [0, 0.68889, 0, 0, 0.66667],
    67: [0, 0.68889, 0, 0, 0.72222],
    68: [0, 0.68889, 0, 0, 0.72222],
    69: [0, 0.68889, 0, 0, 0.66667],
    70: [0, 0.68889, 0, 0, 0.61111],
    71: [0, 0.68889, 0, 0, 0.77778],
    72: [0, 0.68889, 0, 0, 0.77778],
    73: [0, 0.68889, 0, 0, 0.38889],
    74: [0.16667, 0.68889, 0, 0, 0.5],
    75: [0, 0.68889, 0, 0, 0.77778],
    76: [0, 0.68889, 0, 0, 0.66667],
    77: [0, 0.68889, 0, 0, 0.94445],
    78: [0, 0.68889, 0, 0, 0.72222],
    79: [0.16667, 0.68889, 0, 0, 0.77778],
    80: [0, 0.68889, 0, 0, 0.61111],
    81: [0.16667, 0.68889, 0, 0, 0.77778],
    82: [0, 0.68889, 0, 0, 0.72222],
    83: [0, 0.68889, 0, 0, 0.55556],
    84: [0, 0.68889, 0, 0, 0.66667],
    85: [0, 0.68889, 0, 0, 0.72222],
    86: [0, 0.68889, 0, 0, 0.72222],
    87: [0, 0.68889, 0, 0, 1],
    88: [0, 0.68889, 0, 0, 0.72222],
    89: [0, 0.68889, 0, 0, 0.72222],
    90: [0, 0.68889, 0, 0, 0.66667],
    107: [0, 0.68889, 0, 0, 0.55556],
    160: [0, 0, 0, 0, 0.25],
    165: [0, 0.675, 0.025, 0, 0.75],
    174: [0.15559, 0.69224, 0, 0, 0.94666],
    240: [0, 0.68889, 0, 0, 0.55556],
    295: [0, 0.68889, 0, 0, 0.54028],
    710: [0, 0.825, 0, 0, 2.33334],
    732: [0, 0.9, 0, 0, 2.33334],
    770: [0, 0.825, 0, 0, 2.33334],
    771: [0, 0.9, 0, 0, 2.33334],
    989: [0.08167, 0.58167, 0, 0, 0.77778],
    1008: [0, 0.43056, 0.04028, 0, 0.66667],
    8245: [0, 0.54986, 0, 0, 0.275],
    8463: [0, 0.68889, 0, 0, 0.54028],
    8487: [0, 0.68889, 0, 0, 0.72222],
    8498: [0, 0.68889, 0, 0, 0.55556],
    8502: [0, 0.68889, 0, 0, 0.66667],
    8503: [0, 0.68889, 0, 0, 0.44445],
    8504: [0, 0.68889, 0, 0, 0.66667],
    8513: [0, 0.68889, 0, 0, 0.63889],
    8592: [-0.03598, 0.46402, 0, 0, 0.5],
    8594: [-0.03598, 0.46402, 0, 0, 0.5],
    8602: [-0.13313, 0.36687, 0, 0, 1],
    8603: [-0.13313, 0.36687, 0, 0, 1],
    8606: [0.01354, 0.52239, 0, 0, 1],
    8608: [0.01354, 0.52239, 0, 0, 1],
    8610: [0.01354, 0.52239, 0, 0, 1.11111],
    8611: [0.01354, 0.52239, 0, 0, 1.11111],
    8619: [0, 0.54986, 0, 0, 1],
    8620: [0, 0.54986, 0, 0, 1],
    8621: [-0.13313, 0.37788, 0, 0, 1.38889],
    8622: [-0.13313, 0.36687, 0, 0, 1],
    8624: [0, 0.69224, 0, 0, 0.5],
    8625: [0, 0.69224, 0, 0, 0.5],
    8630: [0, 0.43056, 0, 0, 1],
    8631: [0, 0.43056, 0, 0, 1],
    8634: [0.08198, 0.58198, 0, 0, 0.77778],
    8635: [0.08198, 0.58198, 0, 0, 0.77778],
    8638: [0.19444, 0.69224, 0, 0, 0.41667],
    8639: [0.19444, 0.69224, 0, 0, 0.41667],
    8642: [0.19444, 0.69224, 0, 0, 0.41667],
    8643: [0.19444, 0.69224, 0, 0, 0.41667],
    8644: [0.1808, 0.675, 0, 0, 1],
    8646: [0.1808, 0.675, 0, 0, 1],
    8647: [0.1808, 0.675, 0, 0, 1],
    8648: [0.19444, 0.69224, 0, 0, 0.83334],
    8649: [0.1808, 0.675, 0, 0, 1],
    8650: [0.19444, 0.69224, 0, 0, 0.83334],
    8651: [0.01354, 0.52239, 0, 0, 1],
    8652: [0.01354, 0.52239, 0, 0, 1],
    8653: [-0.13313, 0.36687, 0, 0, 1],
    8654: [-0.13313, 0.36687, 0, 0, 1],
    8655: [-0.13313, 0.36687, 0, 0, 1],
    8666: [0.13667, 0.63667, 0, 0, 1],
    8667: [0.13667, 0.63667, 0, 0, 1],
    8669: [-0.13313, 0.37788, 0, 0, 1],
    8672: [-0.064, 0.437, 0, 0, 1.334],
    8674: [-0.064, 0.437, 0, 0, 1.334],
    8705: [0, 0.825, 0, 0, 0.5],
    8708: [0, 0.68889, 0, 0, 0.55556],
    8709: [0.08167, 0.58167, 0, 0, 0.77778],
    8717: [0, 0.43056, 0, 0, 0.42917],
    8722: [-0.03598, 0.46402, 0, 0, 0.5],
    8724: [0.08198, 0.69224, 0, 0, 0.77778],
    8726: [0.08167, 0.58167, 0, 0, 0.77778],
    8733: [0, 0.69224, 0, 0, 0.77778],
    8736: [0, 0.69224, 0, 0, 0.72222],
    8737: [0, 0.69224, 0, 0, 0.72222],
    8738: [0.03517, 0.52239, 0, 0, 0.72222],
    8739: [0.08167, 0.58167, 0, 0, 0.22222],
    8740: [0.25142, 0.74111, 0, 0, 0.27778],
    8741: [0.08167, 0.58167, 0, 0, 0.38889],
    8742: [0.25142, 0.74111, 0, 0, 0.5],
    8756: [0, 0.69224, 0, 0, 0.66667],
    8757: [0, 0.69224, 0, 0, 0.66667],
    8764: [-0.13313, 0.36687, 0, 0, 0.77778],
    8765: [-0.13313, 0.37788, 0, 0, 0.77778],
    8769: [-0.13313, 0.36687, 0, 0, 0.77778],
    8770: [-0.03625, 0.46375, 0, 0, 0.77778],
    8774: [0.30274, 0.79383, 0, 0, 0.77778],
    8776: [-0.01688, 0.48312, 0, 0, 0.77778],
    8778: [0.08167, 0.58167, 0, 0, 0.77778],
    8782: [0.06062, 0.54986, 0, 0, 0.77778],
    8783: [0.06062, 0.54986, 0, 0, 0.77778],
    8785: [0.08198, 0.58198, 0, 0, 0.77778],
    8786: [0.08198, 0.58198, 0, 0, 0.77778],
    8787: [0.08198, 0.58198, 0, 0, 0.77778],
    8790: [0, 0.69224, 0, 0, 0.77778],
    8791: [0.22958, 0.72958, 0, 0, 0.77778],
    8796: [0.08198, 0.91667, 0, 0, 0.77778],
    8806: [0.25583, 0.75583, 0, 0, 0.77778],
    8807: [0.25583, 0.75583, 0, 0, 0.77778],
    8808: [0.25142, 0.75726, 0, 0, 0.77778],
    8809: [0.25142, 0.75726, 0, 0, 0.77778],
    8812: [0.25583, 0.75583, 0, 0, 0.5],
    8814: [0.20576, 0.70576, 0, 0, 0.77778],
    8815: [0.20576, 0.70576, 0, 0, 0.77778],
    8816: [0.30274, 0.79383, 0, 0, 0.77778],
    8817: [0.30274, 0.79383, 0, 0, 0.77778],
    8818: [0.22958, 0.72958, 0, 0, 0.77778],
    8819: [0.22958, 0.72958, 0, 0, 0.77778],
    8822: [0.1808, 0.675, 0, 0, 0.77778],
    8823: [0.1808, 0.675, 0, 0, 0.77778],
    8828: [0.13667, 0.63667, 0, 0, 0.77778],
    8829: [0.13667, 0.63667, 0, 0, 0.77778],
    8830: [0.22958, 0.72958, 0, 0, 0.77778],
    8831: [0.22958, 0.72958, 0, 0, 0.77778],
    8832: [0.20576, 0.70576, 0, 0, 0.77778],
    8833: [0.20576, 0.70576, 0, 0, 0.77778],
    8840: [0.30274, 0.79383, 0, 0, 0.77778],
    8841: [0.30274, 0.79383, 0, 0, 0.77778],
    8842: [0.13597, 0.63597, 0, 0, 0.77778],
    8843: [0.13597, 0.63597, 0, 0, 0.77778],
    8847: [0.03517, 0.54986, 0, 0, 0.77778],
    8848: [0.03517, 0.54986, 0, 0, 0.77778],
    8858: [0.08198, 0.58198, 0, 0, 0.77778],
    8859: [0.08198, 0.58198, 0, 0, 0.77778],
    8861: [0.08198, 0.58198, 0, 0, 0.77778],
    8862: [0, 0.675, 0, 0, 0.77778],
    8863: [0, 0.675, 0, 0, 0.77778],
    8864: [0, 0.675, 0, 0, 0.77778],
    8865: [0, 0.675, 0, 0, 0.77778],
    8872: [0, 0.69224, 0, 0, 0.61111],
    8873: [0, 0.69224, 0, 0, 0.72222],
    8874: [0, 0.69224, 0, 0, 0.88889],
    8876: [0, 0.68889, 0, 0, 0.61111],
    8877: [0, 0.68889, 0, 0, 0.61111],
    8878: [0, 0.68889, 0, 0, 0.72222],
    8879: [0, 0.68889, 0, 0, 0.72222],
    8882: [0.03517, 0.54986, 0, 0, 0.77778],
    8883: [0.03517, 0.54986, 0, 0, 0.77778],
    8884: [0.13667, 0.63667, 0, 0, 0.77778],
    8885: [0.13667, 0.63667, 0, 0, 0.77778],
    8888: [0, 0.54986, 0, 0, 1.11111],
    8890: [0.19444, 0.43056, 0, 0, 0.55556],
    8891: [0.19444, 0.69224, 0, 0, 0.61111],
    8892: [0.19444, 0.69224, 0, 0, 0.61111],
    8901: [0, 0.54986, 0, 0, 0.27778],
    8903: [0.08167, 0.58167, 0, 0, 0.77778],
    8905: [0.08167, 0.58167, 0, 0, 0.77778],
    8906: [0.08167, 0.58167, 0, 0, 0.77778],
    8907: [0, 0.69224, 0, 0, 0.77778],
    8908: [0, 0.69224, 0, 0, 0.77778],
    8909: [-0.03598, 0.46402, 0, 0, 0.77778],
    8910: [0, 0.54986, 0, 0, 0.76042],
    8911: [0, 0.54986, 0, 0, 0.76042],
    8912: [0.03517, 0.54986, 0, 0, 0.77778],
    8913: [0.03517, 0.54986, 0, 0, 0.77778],
    8914: [0, 0.54986, 0, 0, 0.66667],
    8915: [0, 0.54986, 0, 0, 0.66667],
    8916: [0, 0.69224, 0, 0, 0.66667],
    8918: [0.0391, 0.5391, 0, 0, 0.77778],
    8919: [0.0391, 0.5391, 0, 0, 0.77778],
    8920: [0.03517, 0.54986, 0, 0, 1.33334],
    8921: [0.03517, 0.54986, 0, 0, 1.33334],
    8922: [0.38569, 0.88569, 0, 0, 0.77778],
    8923: [0.38569, 0.88569, 0, 0, 0.77778],
    8926: [0.13667, 0.63667, 0, 0, 0.77778],
    8927: [0.13667, 0.63667, 0, 0, 0.77778],
    8928: [0.30274, 0.79383, 0, 0, 0.77778],
    8929: [0.30274, 0.79383, 0, 0, 0.77778],
    8934: [0.23222, 0.74111, 0, 0, 0.77778],
    8935: [0.23222, 0.74111, 0, 0, 0.77778],
    8936: [0.23222, 0.74111, 0, 0, 0.77778],
    8937: [0.23222, 0.74111, 0, 0, 0.77778],
    8938: [0.20576, 0.70576, 0, 0, 0.77778],
    8939: [0.20576, 0.70576, 0, 0, 0.77778],
    8940: [0.30274, 0.79383, 0, 0, 0.77778],
    8941: [0.30274, 0.79383, 0, 0, 0.77778],
    8994: [0.19444, 0.69224, 0, 0, 0.77778],
    8995: [0.19444, 0.69224, 0, 0, 0.77778],
    9416: [0.15559, 0.69224, 0, 0, 0.90222],
    9484: [0, 0.69224, 0, 0, 0.5],
    9488: [0, 0.69224, 0, 0, 0.5],
    9492: [0, 0.37788, 0, 0, 0.5],
    9496: [0, 0.37788, 0, 0, 0.5],
    9585: [0.19444, 0.68889, 0, 0, 0.88889],
    9586: [0.19444, 0.74111, 0, 0, 0.88889],
    9632: [0, 0.675, 0, 0, 0.77778],
    9633: [0, 0.675, 0, 0, 0.77778],
    9650: [0, 0.54986, 0, 0, 0.72222],
    9651: [0, 0.54986, 0, 0, 0.72222],
    9654: [0.03517, 0.54986, 0, 0, 0.77778],
    9660: [0, 0.54986, 0, 0, 0.72222],
    9661: [0, 0.54986, 0, 0, 0.72222],
    9664: [0.03517, 0.54986, 0, 0, 0.77778],
    9674: [0.11111, 0.69224, 0, 0, 0.66667],
    9733: [0.19444, 0.69224, 0, 0, 0.94445],
    10003: [0, 0.69224, 0, 0, 0.83334],
    10016: [0, 0.69224, 0, 0, 0.83334],
    10731: [0.11111, 0.69224, 0, 0, 0.66667],
    10846: [0.19444, 0.75583, 0, 0, 0.61111],
    10877: [0.13667, 0.63667, 0, 0, 0.77778],
    10878: [0.13667, 0.63667, 0, 0, 0.77778],
    10885: [0.25583, 0.75583, 0, 0, 0.77778],
    10886: [0.25583, 0.75583, 0, 0, 0.77778],
    10887: [0.13597, 0.63597, 0, 0, 0.77778],
    10888: [0.13597, 0.63597, 0, 0, 0.77778],
    10889: [0.26167, 0.75726, 0, 0, 0.77778],
    10890: [0.26167, 0.75726, 0, 0, 0.77778],
    10891: [0.48256, 0.98256, 0, 0, 0.77778],
    10892: [0.48256, 0.98256, 0, 0, 0.77778],
    10901: [0.13667, 0.63667, 0, 0, 0.77778],
    10902: [0.13667, 0.63667, 0, 0, 0.77778],
    10933: [0.25142, 0.75726, 0, 0, 0.77778],
    10934: [0.25142, 0.75726, 0, 0, 0.77778],
    10935: [0.26167, 0.75726, 0, 0, 0.77778],
    10936: [0.26167, 0.75726, 0, 0, 0.77778],
    10937: [0.26167, 0.75726, 0, 0, 0.77778],
    10938: [0.26167, 0.75726, 0, 0, 0.77778],
    10949: [0.25583, 0.75583, 0, 0, 0.77778],
    10950: [0.25583, 0.75583, 0, 0, 0.77778],
    10955: [0.28481, 0.79383, 0, 0, 0.77778],
    10956: [0.28481, 0.79383, 0, 0, 0.77778],
    57350: [0.08167, 0.58167, 0, 0, 0.22222],
    57351: [0.08167, 0.58167, 0, 0, 0.38889],
    57352: [0.08167, 0.58167, 0, 0, 0.77778],
    57353: [0, 0.43056, 0.04028, 0, 0.66667],
    57356: [0.25142, 0.75726, 0, 0, 0.77778],
    57357: [0.25142, 0.75726, 0, 0, 0.77778],
    57358: [0.41951, 0.91951, 0, 0, 0.77778],
    57359: [0.30274, 0.79383, 0, 0, 0.77778],
    57360: [0.30274, 0.79383, 0, 0, 0.77778],
    57361: [0.41951, 0.91951, 0, 0, 0.77778],
    57366: [0.25142, 0.75726, 0, 0, 0.77778],
    57367: [0.25142, 0.75726, 0, 0, 0.77778],
    57368: [0.25142, 0.75726, 0, 0, 0.77778],
    57369: [0.25142, 0.75726, 0, 0, 0.77778],
    57370: [0.13597, 0.63597, 0, 0, 0.77778],
    57371: [0.13597, 0.63597, 0, 0, 0.77778]
  },
  "Caligraphic-Regular": {
    32: [0, 0, 0, 0, 0.25],
    65: [0, 0.68333, 0, 0.19445, 0.79847],
    66: [0, 0.68333, 0.03041, 0.13889, 0.65681],
    67: [0, 0.68333, 0.05834, 0.13889, 0.52653],
    68: [0, 0.68333, 0.02778, 0.08334, 0.77139],
    69: [0, 0.68333, 0.08944, 0.11111, 0.52778],
    70: [0, 0.68333, 0.09931, 0.11111, 0.71875],
    71: [0.09722, 0.68333, 0.0593, 0.11111, 0.59487],
    72: [0, 0.68333, 965e-5, 0.11111, 0.84452],
    73: [0, 0.68333, 0.07382, 0, 0.54452],
    74: [0.09722, 0.68333, 0.18472, 0.16667, 0.67778],
    75: [0, 0.68333, 0.01445, 0.05556, 0.76195],
    76: [0, 0.68333, 0, 0.13889, 0.68972],
    77: [0, 0.68333, 0, 0.13889, 1.2009],
    78: [0, 0.68333, 0.14736, 0.08334, 0.82049],
    79: [0, 0.68333, 0.02778, 0.11111, 0.79611],
    80: [0, 0.68333, 0.08222, 0.08334, 0.69556],
    81: [0.09722, 0.68333, 0, 0.11111, 0.81667],
    82: [0, 0.68333, 0, 0.08334, 0.8475],
    83: [0, 0.68333, 0.075, 0.13889, 0.60556],
    84: [0, 0.68333, 0.25417, 0, 0.54464],
    85: [0, 0.68333, 0.09931, 0.08334, 0.62583],
    86: [0, 0.68333, 0.08222, 0, 0.61278],
    87: [0, 0.68333, 0.08222, 0.08334, 0.98778],
    88: [0, 0.68333, 0.14643, 0.13889, 0.7133],
    89: [0.09722, 0.68333, 0.08222, 0.08334, 0.66834],
    90: [0, 0.68333, 0.07944, 0.13889, 0.72473],
    160: [0, 0, 0, 0, 0.25]
  },
  "Fraktur-Regular": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69141, 0, 0, 0.29574],
    34: [0, 0.69141, 0, 0, 0.21471],
    38: [0, 0.69141, 0, 0, 0.73786],
    39: [0, 0.69141, 0, 0, 0.21201],
    40: [0.24982, 0.74947, 0, 0, 0.38865],
    41: [0.24982, 0.74947, 0, 0, 0.38865],
    42: [0, 0.62119, 0, 0, 0.27764],
    43: [0.08319, 0.58283, 0, 0, 0.75623],
    44: [0, 0.10803, 0, 0, 0.27764],
    45: [0.08319, 0.58283, 0, 0, 0.75623],
    46: [0, 0.10803, 0, 0, 0.27764],
    47: [0.24982, 0.74947, 0, 0, 0.50181],
    48: [0, 0.47534, 0, 0, 0.50181],
    49: [0, 0.47534, 0, 0, 0.50181],
    50: [0, 0.47534, 0, 0, 0.50181],
    51: [0.18906, 0.47534, 0, 0, 0.50181],
    52: [0.18906, 0.47534, 0, 0, 0.50181],
    53: [0.18906, 0.47534, 0, 0, 0.50181],
    54: [0, 0.69141, 0, 0, 0.50181],
    55: [0.18906, 0.47534, 0, 0, 0.50181],
    56: [0, 0.69141, 0, 0, 0.50181],
    57: [0.18906, 0.47534, 0, 0, 0.50181],
    58: [0, 0.47534, 0, 0, 0.21606],
    59: [0.12604, 0.47534, 0, 0, 0.21606],
    61: [-0.13099, 0.36866, 0, 0, 0.75623],
    63: [0, 0.69141, 0, 0, 0.36245],
    65: [0, 0.69141, 0, 0, 0.7176],
    66: [0, 0.69141, 0, 0, 0.88397],
    67: [0, 0.69141, 0, 0, 0.61254],
    68: [0, 0.69141, 0, 0, 0.83158],
    69: [0, 0.69141, 0, 0, 0.66278],
    70: [0.12604, 0.69141, 0, 0, 0.61119],
    71: [0, 0.69141, 0, 0, 0.78539],
    72: [0.06302, 0.69141, 0, 0, 0.7203],
    73: [0, 0.69141, 0, 0, 0.55448],
    74: [0.12604, 0.69141, 0, 0, 0.55231],
    75: [0, 0.69141, 0, 0, 0.66845],
    76: [0, 0.69141, 0, 0, 0.66602],
    77: [0, 0.69141, 0, 0, 1.04953],
    78: [0, 0.69141, 0, 0, 0.83212],
    79: [0, 0.69141, 0, 0, 0.82699],
    80: [0.18906, 0.69141, 0, 0, 0.82753],
    81: [0.03781, 0.69141, 0, 0, 0.82699],
    82: [0, 0.69141, 0, 0, 0.82807],
    83: [0, 0.69141, 0, 0, 0.82861],
    84: [0, 0.69141, 0, 0, 0.66899],
    85: [0, 0.69141, 0, 0, 0.64576],
    86: [0, 0.69141, 0, 0, 0.83131],
    87: [0, 0.69141, 0, 0, 1.04602],
    88: [0, 0.69141, 0, 0, 0.71922],
    89: [0.18906, 0.69141, 0, 0, 0.83293],
    90: [0.12604, 0.69141, 0, 0, 0.60201],
    91: [0.24982, 0.74947, 0, 0, 0.27764],
    93: [0.24982, 0.74947, 0, 0, 0.27764],
    94: [0, 0.69141, 0, 0, 0.49965],
    97: [0, 0.47534, 0, 0, 0.50046],
    98: [0, 0.69141, 0, 0, 0.51315],
    99: [0, 0.47534, 0, 0, 0.38946],
    100: [0, 0.62119, 0, 0, 0.49857],
    101: [0, 0.47534, 0, 0, 0.40053],
    102: [0.18906, 0.69141, 0, 0, 0.32626],
    103: [0.18906, 0.47534, 0, 0, 0.5037],
    104: [0.18906, 0.69141, 0, 0, 0.52126],
    105: [0, 0.69141, 0, 0, 0.27899],
    106: [0, 0.69141, 0, 0, 0.28088],
    107: [0, 0.69141, 0, 0, 0.38946],
    108: [0, 0.69141, 0, 0, 0.27953],
    109: [0, 0.47534, 0, 0, 0.76676],
    110: [0, 0.47534, 0, 0, 0.52666],
    111: [0, 0.47534, 0, 0, 0.48885],
    112: [0.18906, 0.52396, 0, 0, 0.50046],
    113: [0.18906, 0.47534, 0, 0, 0.48912],
    114: [0, 0.47534, 0, 0, 0.38919],
    115: [0, 0.47534, 0, 0, 0.44266],
    116: [0, 0.62119, 0, 0, 0.33301],
    117: [0, 0.47534, 0, 0, 0.5172],
    118: [0, 0.52396, 0, 0, 0.5118],
    119: [0, 0.52396, 0, 0, 0.77351],
    120: [0.18906, 0.47534, 0, 0, 0.38865],
    121: [0.18906, 0.47534, 0, 0, 0.49884],
    122: [0.18906, 0.47534, 0, 0, 0.39054],
    160: [0, 0, 0, 0, 0.25],
    8216: [0, 0.69141, 0, 0, 0.21471],
    8217: [0, 0.69141, 0, 0, 0.21471],
    58112: [0, 0.62119, 0, 0, 0.49749],
    58113: [0, 0.62119, 0, 0, 0.4983],
    58114: [0.18906, 0.69141, 0, 0, 0.33328],
    58115: [0.18906, 0.69141, 0, 0, 0.32923],
    58116: [0.18906, 0.47534, 0, 0, 0.50343],
    58117: [0, 0.69141, 0, 0, 0.33301],
    58118: [0, 0.62119, 0, 0, 0.33409],
    58119: [0, 0.47534, 0, 0, 0.50073]
  },
  "Main-Bold": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0, 0, 0.35],
    34: [0, 0.69444, 0, 0, 0.60278],
    35: [0.19444, 0.69444, 0, 0, 0.95833],
    36: [0.05556, 0.75, 0, 0, 0.575],
    37: [0.05556, 0.75, 0, 0, 0.95833],
    38: [0, 0.69444, 0, 0, 0.89444],
    39: [0, 0.69444, 0, 0, 0.31944],
    40: [0.25, 0.75, 0, 0, 0.44722],
    41: [0.25, 0.75, 0, 0, 0.44722],
    42: [0, 0.75, 0, 0, 0.575],
    43: [0.13333, 0.63333, 0, 0, 0.89444],
    44: [0.19444, 0.15556, 0, 0, 0.31944],
    45: [0, 0.44444, 0, 0, 0.38333],
    46: [0, 0.15556, 0, 0, 0.31944],
    47: [0.25, 0.75, 0, 0, 0.575],
    48: [0, 0.64444, 0, 0, 0.575],
    49: [0, 0.64444, 0, 0, 0.575],
    50: [0, 0.64444, 0, 0, 0.575],
    51: [0, 0.64444, 0, 0, 0.575],
    52: [0, 0.64444, 0, 0, 0.575],
    53: [0, 0.64444, 0, 0, 0.575],
    54: [0, 0.64444, 0, 0, 0.575],
    55: [0, 0.64444, 0, 0, 0.575],
    56: [0, 0.64444, 0, 0, 0.575],
    57: [0, 0.64444, 0, 0, 0.575],
    58: [0, 0.44444, 0, 0, 0.31944],
    59: [0.19444, 0.44444, 0, 0, 0.31944],
    60: [0.08556, 0.58556, 0, 0, 0.89444],
    61: [-0.10889, 0.39111, 0, 0, 0.89444],
    62: [0.08556, 0.58556, 0, 0, 0.89444],
    63: [0, 0.69444, 0, 0, 0.54305],
    64: [0, 0.69444, 0, 0, 0.89444],
    65: [0, 0.68611, 0, 0, 0.86944],
    66: [0, 0.68611, 0, 0, 0.81805],
    67: [0, 0.68611, 0, 0, 0.83055],
    68: [0, 0.68611, 0, 0, 0.88194],
    69: [0, 0.68611, 0, 0, 0.75555],
    70: [0, 0.68611, 0, 0, 0.72361],
    71: [0, 0.68611, 0, 0, 0.90416],
    72: [0, 0.68611, 0, 0, 0.9],
    73: [0, 0.68611, 0, 0, 0.43611],
    74: [0, 0.68611, 0, 0, 0.59444],
    75: [0, 0.68611, 0, 0, 0.90138],
    76: [0, 0.68611, 0, 0, 0.69166],
    77: [0, 0.68611, 0, 0, 1.09166],
    78: [0, 0.68611, 0, 0, 0.9],
    79: [0, 0.68611, 0, 0, 0.86388],
    80: [0, 0.68611, 0, 0, 0.78611],
    81: [0.19444, 0.68611, 0, 0, 0.86388],
    82: [0, 0.68611, 0, 0, 0.8625],
    83: [0, 0.68611, 0, 0, 0.63889],
    84: [0, 0.68611, 0, 0, 0.8],
    85: [0, 0.68611, 0, 0, 0.88472],
    86: [0, 0.68611, 0.01597, 0, 0.86944],
    87: [0, 0.68611, 0.01597, 0, 1.18888],
    88: [0, 0.68611, 0, 0, 0.86944],
    89: [0, 0.68611, 0.02875, 0, 0.86944],
    90: [0, 0.68611, 0, 0, 0.70277],
    91: [0.25, 0.75, 0, 0, 0.31944],
    92: [0.25, 0.75, 0, 0, 0.575],
    93: [0.25, 0.75, 0, 0, 0.31944],
    94: [0, 0.69444, 0, 0, 0.575],
    95: [0.31, 0.13444, 0.03194, 0, 0.575],
    97: [0, 0.44444, 0, 0, 0.55902],
    98: [0, 0.69444, 0, 0, 0.63889],
    99: [0, 0.44444, 0, 0, 0.51111],
    100: [0, 0.69444, 0, 0, 0.63889],
    101: [0, 0.44444, 0, 0, 0.52708],
    102: [0, 0.69444, 0.10903, 0, 0.35139],
    103: [0.19444, 0.44444, 0.01597, 0, 0.575],
    104: [0, 0.69444, 0, 0, 0.63889],
    105: [0, 0.69444, 0, 0, 0.31944],
    106: [0.19444, 0.69444, 0, 0, 0.35139],
    107: [0, 0.69444, 0, 0, 0.60694],
    108: [0, 0.69444, 0, 0, 0.31944],
    109: [0, 0.44444, 0, 0, 0.95833],
    110: [0, 0.44444, 0, 0, 0.63889],
    111: [0, 0.44444, 0, 0, 0.575],
    112: [0.19444, 0.44444, 0, 0, 0.63889],
    113: [0.19444, 0.44444, 0, 0, 0.60694],
    114: [0, 0.44444, 0, 0, 0.47361],
    115: [0, 0.44444, 0, 0, 0.45361],
    116: [0, 0.63492, 0, 0, 0.44722],
    117: [0, 0.44444, 0, 0, 0.63889],
    118: [0, 0.44444, 0.01597, 0, 0.60694],
    119: [0, 0.44444, 0.01597, 0, 0.83055],
    120: [0, 0.44444, 0, 0, 0.60694],
    121: [0.19444, 0.44444, 0.01597, 0, 0.60694],
    122: [0, 0.44444, 0, 0, 0.51111],
    123: [0.25, 0.75, 0, 0, 0.575],
    124: [0.25, 0.75, 0, 0, 0.31944],
    125: [0.25, 0.75, 0, 0, 0.575],
    126: [0.35, 0.34444, 0, 0, 0.575],
    160: [0, 0, 0, 0, 0.25],
    163: [0, 0.69444, 0, 0, 0.86853],
    168: [0, 0.69444, 0, 0, 0.575],
    172: [0, 0.44444, 0, 0, 0.76666],
    176: [0, 0.69444, 0, 0, 0.86944],
    177: [0.13333, 0.63333, 0, 0, 0.89444],
    184: [0.17014, 0, 0, 0, 0.51111],
    198: [0, 0.68611, 0, 0, 1.04166],
    215: [0.13333, 0.63333, 0, 0, 0.89444],
    216: [0.04861, 0.73472, 0, 0, 0.89444],
    223: [0, 0.69444, 0, 0, 0.59722],
    230: [0, 0.44444, 0, 0, 0.83055],
    247: [0.13333, 0.63333, 0, 0, 0.89444],
    248: [0.09722, 0.54167, 0, 0, 0.575],
    305: [0, 0.44444, 0, 0, 0.31944],
    338: [0, 0.68611, 0, 0, 1.16944],
    339: [0, 0.44444, 0, 0, 0.89444],
    567: [0.19444, 0.44444, 0, 0, 0.35139],
    710: [0, 0.69444, 0, 0, 0.575],
    711: [0, 0.63194, 0, 0, 0.575],
    713: [0, 0.59611, 0, 0, 0.575],
    714: [0, 0.69444, 0, 0, 0.575],
    715: [0, 0.69444, 0, 0, 0.575],
    728: [0, 0.69444, 0, 0, 0.575],
    729: [0, 0.69444, 0, 0, 0.31944],
    730: [0, 0.69444, 0, 0, 0.86944],
    732: [0, 0.69444, 0, 0, 0.575],
    733: [0, 0.69444, 0, 0, 0.575],
    915: [0, 0.68611, 0, 0, 0.69166],
    916: [0, 0.68611, 0, 0, 0.95833],
    920: [0, 0.68611, 0, 0, 0.89444],
    923: [0, 0.68611, 0, 0, 0.80555],
    926: [0, 0.68611, 0, 0, 0.76666],
    928: [0, 0.68611, 0, 0, 0.9],
    931: [0, 0.68611, 0, 0, 0.83055],
    933: [0, 0.68611, 0, 0, 0.89444],
    934: [0, 0.68611, 0, 0, 0.83055],
    936: [0, 0.68611, 0, 0, 0.89444],
    937: [0, 0.68611, 0, 0, 0.83055],
    8211: [0, 0.44444, 0.03194, 0, 0.575],
    8212: [0, 0.44444, 0.03194, 0, 1.14999],
    8216: [0, 0.69444, 0, 0, 0.31944],
    8217: [0, 0.69444, 0, 0, 0.31944],
    8220: [0, 0.69444, 0, 0, 0.60278],
    8221: [0, 0.69444, 0, 0, 0.60278],
    8224: [0.19444, 0.69444, 0, 0, 0.51111],
    8225: [0.19444, 0.69444, 0, 0, 0.51111],
    8242: [0, 0.55556, 0, 0, 0.34444],
    8407: [0, 0.72444, 0.15486, 0, 0.575],
    8463: [0, 0.69444, 0, 0, 0.66759],
    8465: [0, 0.69444, 0, 0, 0.83055],
    8467: [0, 0.69444, 0, 0, 0.47361],
    8472: [0.19444, 0.44444, 0, 0, 0.74027],
    8476: [0, 0.69444, 0, 0, 0.83055],
    8501: [0, 0.69444, 0, 0, 0.70277],
    8592: [-0.10889, 0.39111, 0, 0, 1.14999],
    8593: [0.19444, 0.69444, 0, 0, 0.575],
    8594: [-0.10889, 0.39111, 0, 0, 1.14999],
    8595: [0.19444, 0.69444, 0, 0, 0.575],
    8596: [-0.10889, 0.39111, 0, 0, 1.14999],
    8597: [0.25, 0.75, 0, 0, 0.575],
    8598: [0.19444, 0.69444, 0, 0, 1.14999],
    8599: [0.19444, 0.69444, 0, 0, 1.14999],
    8600: [0.19444, 0.69444, 0, 0, 1.14999],
    8601: [0.19444, 0.69444, 0, 0, 1.14999],
    8636: [-0.10889, 0.39111, 0, 0, 1.14999],
    8637: [-0.10889, 0.39111, 0, 0, 1.14999],
    8640: [-0.10889, 0.39111, 0, 0, 1.14999],
    8641: [-0.10889, 0.39111, 0, 0, 1.14999],
    8656: [-0.10889, 0.39111, 0, 0, 1.14999],
    8657: [0.19444, 0.69444, 0, 0, 0.70277],
    8658: [-0.10889, 0.39111, 0, 0, 1.14999],
    8659: [0.19444, 0.69444, 0, 0, 0.70277],
    8660: [-0.10889, 0.39111, 0, 0, 1.14999],
    8661: [0.25, 0.75, 0, 0, 0.70277],
    8704: [0, 0.69444, 0, 0, 0.63889],
    8706: [0, 0.69444, 0.06389, 0, 0.62847],
    8707: [0, 0.69444, 0, 0, 0.63889],
    8709: [0.05556, 0.75, 0, 0, 0.575],
    8711: [0, 0.68611, 0, 0, 0.95833],
    8712: [0.08556, 0.58556, 0, 0, 0.76666],
    8715: [0.08556, 0.58556, 0, 0, 0.76666],
    8722: [0.13333, 0.63333, 0, 0, 0.89444],
    8723: [0.13333, 0.63333, 0, 0, 0.89444],
    8725: [0.25, 0.75, 0, 0, 0.575],
    8726: [0.25, 0.75, 0, 0, 0.575],
    8727: [-0.02778, 0.47222, 0, 0, 0.575],
    8728: [-0.02639, 0.47361, 0, 0, 0.575],
    8729: [-0.02639, 0.47361, 0, 0, 0.575],
    8730: [0.18, 0.82, 0, 0, 0.95833],
    8733: [0, 0.44444, 0, 0, 0.89444],
    8734: [0, 0.44444, 0, 0, 1.14999],
    8736: [0, 0.69224, 0, 0, 0.72222],
    8739: [0.25, 0.75, 0, 0, 0.31944],
    8741: [0.25, 0.75, 0, 0, 0.575],
    8743: [0, 0.55556, 0, 0, 0.76666],
    8744: [0, 0.55556, 0, 0, 0.76666],
    8745: [0, 0.55556, 0, 0, 0.76666],
    8746: [0, 0.55556, 0, 0, 0.76666],
    8747: [0.19444, 0.69444, 0.12778, 0, 0.56875],
    8764: [-0.10889, 0.39111, 0, 0, 0.89444],
    8768: [0.19444, 0.69444, 0, 0, 0.31944],
    8771: [222e-5, 0.50222, 0, 0, 0.89444],
    8773: [0.027, 0.638, 0, 0, 0.894],
    8776: [0.02444, 0.52444, 0, 0, 0.89444],
    8781: [222e-5, 0.50222, 0, 0, 0.89444],
    8801: [222e-5, 0.50222, 0, 0, 0.89444],
    8804: [0.19667, 0.69667, 0, 0, 0.89444],
    8805: [0.19667, 0.69667, 0, 0, 0.89444],
    8810: [0.08556, 0.58556, 0, 0, 1.14999],
    8811: [0.08556, 0.58556, 0, 0, 1.14999],
    8826: [0.08556, 0.58556, 0, 0, 0.89444],
    8827: [0.08556, 0.58556, 0, 0, 0.89444],
    8834: [0.08556, 0.58556, 0, 0, 0.89444],
    8835: [0.08556, 0.58556, 0, 0, 0.89444],
    8838: [0.19667, 0.69667, 0, 0, 0.89444],
    8839: [0.19667, 0.69667, 0, 0, 0.89444],
    8846: [0, 0.55556, 0, 0, 0.76666],
    8849: [0.19667, 0.69667, 0, 0, 0.89444],
    8850: [0.19667, 0.69667, 0, 0, 0.89444],
    8851: [0, 0.55556, 0, 0, 0.76666],
    8852: [0, 0.55556, 0, 0, 0.76666],
    8853: [0.13333, 0.63333, 0, 0, 0.89444],
    8854: [0.13333, 0.63333, 0, 0, 0.89444],
    8855: [0.13333, 0.63333, 0, 0, 0.89444],
    8856: [0.13333, 0.63333, 0, 0, 0.89444],
    8857: [0.13333, 0.63333, 0, 0, 0.89444],
    8866: [0, 0.69444, 0, 0, 0.70277],
    8867: [0, 0.69444, 0, 0, 0.70277],
    8868: [0, 0.69444, 0, 0, 0.89444],
    8869: [0, 0.69444, 0, 0, 0.89444],
    8900: [-0.02639, 0.47361, 0, 0, 0.575],
    8901: [-0.02639, 0.47361, 0, 0, 0.31944],
    8902: [-0.02778, 0.47222, 0, 0, 0.575],
    8968: [0.25, 0.75, 0, 0, 0.51111],
    8969: [0.25, 0.75, 0, 0, 0.51111],
    8970: [0.25, 0.75, 0, 0, 0.51111],
    8971: [0.25, 0.75, 0, 0, 0.51111],
    8994: [-0.13889, 0.36111, 0, 0, 1.14999],
    8995: [-0.13889, 0.36111, 0, 0, 1.14999],
    9651: [0.19444, 0.69444, 0, 0, 1.02222],
    9657: [-0.02778, 0.47222, 0, 0, 0.575],
    9661: [0.19444, 0.69444, 0, 0, 1.02222],
    9667: [-0.02778, 0.47222, 0, 0, 0.575],
    9711: [0.19444, 0.69444, 0, 0, 1.14999],
    9824: [0.12963, 0.69444, 0, 0, 0.89444],
    9825: [0.12963, 0.69444, 0, 0, 0.89444],
    9826: [0.12963, 0.69444, 0, 0, 0.89444],
    9827: [0.12963, 0.69444, 0, 0, 0.89444],
    9837: [0, 0.75, 0, 0, 0.44722],
    9838: [0.19444, 0.69444, 0, 0, 0.44722],
    9839: [0.19444, 0.69444, 0, 0, 0.44722],
    10216: [0.25, 0.75, 0, 0, 0.44722],
    10217: [0.25, 0.75, 0, 0, 0.44722],
    10815: [0, 0.68611, 0, 0, 0.9],
    10927: [0.19667, 0.69667, 0, 0, 0.89444],
    10928: [0.19667, 0.69667, 0, 0, 0.89444],
    57376: [0.19444, 0.69444, 0, 0, 0]
  },
  "Main-BoldItalic": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0.11417, 0, 0.38611],
    34: [0, 0.69444, 0.07939, 0, 0.62055],
    35: [0.19444, 0.69444, 0.06833, 0, 0.94444],
    37: [0.05556, 0.75, 0.12861, 0, 0.94444],
    38: [0, 0.69444, 0.08528, 0, 0.88555],
    39: [0, 0.69444, 0.12945, 0, 0.35555],
    40: [0.25, 0.75, 0.15806, 0, 0.47333],
    41: [0.25, 0.75, 0.03306, 0, 0.47333],
    42: [0, 0.75, 0.14333, 0, 0.59111],
    43: [0.10333, 0.60333, 0.03306, 0, 0.88555],
    44: [0.19444, 0.14722, 0, 0, 0.35555],
    45: [0, 0.44444, 0.02611, 0, 0.41444],
    46: [0, 0.14722, 0, 0, 0.35555],
    47: [0.25, 0.75, 0.15806, 0, 0.59111],
    48: [0, 0.64444, 0.13167, 0, 0.59111],
    49: [0, 0.64444, 0.13167, 0, 0.59111],
    50: [0, 0.64444, 0.13167, 0, 0.59111],
    51: [0, 0.64444, 0.13167, 0, 0.59111],
    52: [0.19444, 0.64444, 0.13167, 0, 0.59111],
    53: [0, 0.64444, 0.13167, 0, 0.59111],
    54: [0, 0.64444, 0.13167, 0, 0.59111],
    55: [0.19444, 0.64444, 0.13167, 0, 0.59111],
    56: [0, 0.64444, 0.13167, 0, 0.59111],
    57: [0, 0.64444, 0.13167, 0, 0.59111],
    58: [0, 0.44444, 0.06695, 0, 0.35555],
    59: [0.19444, 0.44444, 0.06695, 0, 0.35555],
    61: [-0.10889, 0.39111, 0.06833, 0, 0.88555],
    63: [0, 0.69444, 0.11472, 0, 0.59111],
    64: [0, 0.69444, 0.09208, 0, 0.88555],
    65: [0, 0.68611, 0, 0, 0.86555],
    66: [0, 0.68611, 0.0992, 0, 0.81666],
    67: [0, 0.68611, 0.14208, 0, 0.82666],
    68: [0, 0.68611, 0.09062, 0, 0.87555],
    69: [0, 0.68611, 0.11431, 0, 0.75666],
    70: [0, 0.68611, 0.12903, 0, 0.72722],
    71: [0, 0.68611, 0.07347, 0, 0.89527],
    72: [0, 0.68611, 0.17208, 0, 0.8961],
    73: [0, 0.68611, 0.15681, 0, 0.47166],
    74: [0, 0.68611, 0.145, 0, 0.61055],
    75: [0, 0.68611, 0.14208, 0, 0.89499],
    76: [0, 0.68611, 0, 0, 0.69777],
    77: [0, 0.68611, 0.17208, 0, 1.07277],
    78: [0, 0.68611, 0.17208, 0, 0.8961],
    79: [0, 0.68611, 0.09062, 0, 0.85499],
    80: [0, 0.68611, 0.0992, 0, 0.78721],
    81: [0.19444, 0.68611, 0.09062, 0, 0.85499],
    82: [0, 0.68611, 0.02559, 0, 0.85944],
    83: [0, 0.68611, 0.11264, 0, 0.64999],
    84: [0, 0.68611, 0.12903, 0, 0.7961],
    85: [0, 0.68611, 0.17208, 0, 0.88083],
    86: [0, 0.68611, 0.18625, 0, 0.86555],
    87: [0, 0.68611, 0.18625, 0, 1.15999],
    88: [0, 0.68611, 0.15681, 0, 0.86555],
    89: [0, 0.68611, 0.19803, 0, 0.86555],
    90: [0, 0.68611, 0.14208, 0, 0.70888],
    91: [0.25, 0.75, 0.1875, 0, 0.35611],
    93: [0.25, 0.75, 0.09972, 0, 0.35611],
    94: [0, 0.69444, 0.06709, 0, 0.59111],
    95: [0.31, 0.13444, 0.09811, 0, 0.59111],
    97: [0, 0.44444, 0.09426, 0, 0.59111],
    98: [0, 0.69444, 0.07861, 0, 0.53222],
    99: [0, 0.44444, 0.05222, 0, 0.53222],
    100: [0, 0.69444, 0.10861, 0, 0.59111],
    101: [0, 0.44444, 0.085, 0, 0.53222],
    102: [0.19444, 0.69444, 0.21778, 0, 0.4],
    103: [0.19444, 0.44444, 0.105, 0, 0.53222],
    104: [0, 0.69444, 0.09426, 0, 0.59111],
    105: [0, 0.69326, 0.11387, 0, 0.35555],
    106: [0.19444, 0.69326, 0.1672, 0, 0.35555],
    107: [0, 0.69444, 0.11111, 0, 0.53222],
    108: [0, 0.69444, 0.10861, 0, 0.29666],
    109: [0, 0.44444, 0.09426, 0, 0.94444],
    110: [0, 0.44444, 0.09426, 0, 0.64999],
    111: [0, 0.44444, 0.07861, 0, 0.59111],
    112: [0.19444, 0.44444, 0.07861, 0, 0.59111],
    113: [0.19444, 0.44444, 0.105, 0, 0.53222],
    114: [0, 0.44444, 0.11111, 0, 0.50167],
    115: [0, 0.44444, 0.08167, 0, 0.48694],
    116: [0, 0.63492, 0.09639, 0, 0.385],
    117: [0, 0.44444, 0.09426, 0, 0.62055],
    118: [0, 0.44444, 0.11111, 0, 0.53222],
    119: [0, 0.44444, 0.11111, 0, 0.76777],
    120: [0, 0.44444, 0.12583, 0, 0.56055],
    121: [0.19444, 0.44444, 0.105, 0, 0.56166],
    122: [0, 0.44444, 0.13889, 0, 0.49055],
    126: [0.35, 0.34444, 0.11472, 0, 0.59111],
    160: [0, 0, 0, 0, 0.25],
    168: [0, 0.69444, 0.11473, 0, 0.59111],
    176: [0, 0.69444, 0, 0, 0.94888],
    184: [0.17014, 0, 0, 0, 0.53222],
    198: [0, 0.68611, 0.11431, 0, 1.02277],
    216: [0.04861, 0.73472, 0.09062, 0, 0.88555],
    223: [0.19444, 0.69444, 0.09736, 0, 0.665],
    230: [0, 0.44444, 0.085, 0, 0.82666],
    248: [0.09722, 0.54167, 0.09458, 0, 0.59111],
    305: [0, 0.44444, 0.09426, 0, 0.35555],
    338: [0, 0.68611, 0.11431, 0, 1.14054],
    339: [0, 0.44444, 0.085, 0, 0.82666],
    567: [0.19444, 0.44444, 0.04611, 0, 0.385],
    710: [0, 0.69444, 0.06709, 0, 0.59111],
    711: [0, 0.63194, 0.08271, 0, 0.59111],
    713: [0, 0.59444, 0.10444, 0, 0.59111],
    714: [0, 0.69444, 0.08528, 0, 0.59111],
    715: [0, 0.69444, 0, 0, 0.59111],
    728: [0, 0.69444, 0.10333, 0, 0.59111],
    729: [0, 0.69444, 0.12945, 0, 0.35555],
    730: [0, 0.69444, 0, 0, 0.94888],
    732: [0, 0.69444, 0.11472, 0, 0.59111],
    733: [0, 0.69444, 0.11472, 0, 0.59111],
    915: [0, 0.68611, 0.12903, 0, 0.69777],
    916: [0, 0.68611, 0, 0, 0.94444],
    920: [0, 0.68611, 0.09062, 0, 0.88555],
    923: [0, 0.68611, 0, 0, 0.80666],
    926: [0, 0.68611, 0.15092, 0, 0.76777],
    928: [0, 0.68611, 0.17208, 0, 0.8961],
    931: [0, 0.68611, 0.11431, 0, 0.82666],
    933: [0, 0.68611, 0.10778, 0, 0.88555],
    934: [0, 0.68611, 0.05632, 0, 0.82666],
    936: [0, 0.68611, 0.10778, 0, 0.88555],
    937: [0, 0.68611, 0.0992, 0, 0.82666],
    8211: [0, 0.44444, 0.09811, 0, 0.59111],
    8212: [0, 0.44444, 0.09811, 0, 1.18221],
    8216: [0, 0.69444, 0.12945, 0, 0.35555],
    8217: [0, 0.69444, 0.12945, 0, 0.35555],
    8220: [0, 0.69444, 0.16772, 0, 0.62055],
    8221: [0, 0.69444, 0.07939, 0, 0.62055]
  },
  "Main-Italic": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0.12417, 0, 0.30667],
    34: [0, 0.69444, 0.06961, 0, 0.51444],
    35: [0.19444, 0.69444, 0.06616, 0, 0.81777],
    37: [0.05556, 0.75, 0.13639, 0, 0.81777],
    38: [0, 0.69444, 0.09694, 0, 0.76666],
    39: [0, 0.69444, 0.12417, 0, 0.30667],
    40: [0.25, 0.75, 0.16194, 0, 0.40889],
    41: [0.25, 0.75, 0.03694, 0, 0.40889],
    42: [0, 0.75, 0.14917, 0, 0.51111],
    43: [0.05667, 0.56167, 0.03694, 0, 0.76666],
    44: [0.19444, 0.10556, 0, 0, 0.30667],
    45: [0, 0.43056, 0.02826, 0, 0.35778],
    46: [0, 0.10556, 0, 0, 0.30667],
    47: [0.25, 0.75, 0.16194, 0, 0.51111],
    48: [0, 0.64444, 0.13556, 0, 0.51111],
    49: [0, 0.64444, 0.13556, 0, 0.51111],
    50: [0, 0.64444, 0.13556, 0, 0.51111],
    51: [0, 0.64444, 0.13556, 0, 0.51111],
    52: [0.19444, 0.64444, 0.13556, 0, 0.51111],
    53: [0, 0.64444, 0.13556, 0, 0.51111],
    54: [0, 0.64444, 0.13556, 0, 0.51111],
    55: [0.19444, 0.64444, 0.13556, 0, 0.51111],
    56: [0, 0.64444, 0.13556, 0, 0.51111],
    57: [0, 0.64444, 0.13556, 0, 0.51111],
    58: [0, 0.43056, 0.0582, 0, 0.30667],
    59: [0.19444, 0.43056, 0.0582, 0, 0.30667],
    61: [-0.13313, 0.36687, 0.06616, 0, 0.76666],
    63: [0, 0.69444, 0.1225, 0, 0.51111],
    64: [0, 0.69444, 0.09597, 0, 0.76666],
    65: [0, 0.68333, 0, 0, 0.74333],
    66: [0, 0.68333, 0.10257, 0, 0.70389],
    67: [0, 0.68333, 0.14528, 0, 0.71555],
    68: [0, 0.68333, 0.09403, 0, 0.755],
    69: [0, 0.68333, 0.12028, 0, 0.67833],
    70: [0, 0.68333, 0.13305, 0, 0.65277],
    71: [0, 0.68333, 0.08722, 0, 0.77361],
    72: [0, 0.68333, 0.16389, 0, 0.74333],
    73: [0, 0.68333, 0.15806, 0, 0.38555],
    74: [0, 0.68333, 0.14028, 0, 0.525],
    75: [0, 0.68333, 0.14528, 0, 0.76888],
    76: [0, 0.68333, 0, 0, 0.62722],
    77: [0, 0.68333, 0.16389, 0, 0.89666],
    78: [0, 0.68333, 0.16389, 0, 0.74333],
    79: [0, 0.68333, 0.09403, 0, 0.76666],
    80: [0, 0.68333, 0.10257, 0, 0.67833],
    81: [0.19444, 0.68333, 0.09403, 0, 0.76666],
    82: [0, 0.68333, 0.03868, 0, 0.72944],
    83: [0, 0.68333, 0.11972, 0, 0.56222],
    84: [0, 0.68333, 0.13305, 0, 0.71555],
    85: [0, 0.68333, 0.16389, 0, 0.74333],
    86: [0, 0.68333, 0.18361, 0, 0.74333],
    87: [0, 0.68333, 0.18361, 0, 0.99888],
    88: [0, 0.68333, 0.15806, 0, 0.74333],
    89: [0, 0.68333, 0.19383, 0, 0.74333],
    90: [0, 0.68333, 0.14528, 0, 0.61333],
    91: [0.25, 0.75, 0.1875, 0, 0.30667],
    93: [0.25, 0.75, 0.10528, 0, 0.30667],
    94: [0, 0.69444, 0.06646, 0, 0.51111],
    95: [0.31, 0.12056, 0.09208, 0, 0.51111],
    97: [0, 0.43056, 0.07671, 0, 0.51111],
    98: [0, 0.69444, 0.06312, 0, 0.46],
    99: [0, 0.43056, 0.05653, 0, 0.46],
    100: [0, 0.69444, 0.10333, 0, 0.51111],
    101: [0, 0.43056, 0.07514, 0, 0.46],
    102: [0.19444, 0.69444, 0.21194, 0, 0.30667],
    103: [0.19444, 0.43056, 0.08847, 0, 0.46],
    104: [0, 0.69444, 0.07671, 0, 0.51111],
    105: [0, 0.65536, 0.1019, 0, 0.30667],
    106: [0.19444, 0.65536, 0.14467, 0, 0.30667],
    107: [0, 0.69444, 0.10764, 0, 0.46],
    108: [0, 0.69444, 0.10333, 0, 0.25555],
    109: [0, 0.43056, 0.07671, 0, 0.81777],
    110: [0, 0.43056, 0.07671, 0, 0.56222],
    111: [0, 0.43056, 0.06312, 0, 0.51111],
    112: [0.19444, 0.43056, 0.06312, 0, 0.51111],
    113: [0.19444, 0.43056, 0.08847, 0, 0.46],
    114: [0, 0.43056, 0.10764, 0, 0.42166],
    115: [0, 0.43056, 0.08208, 0, 0.40889],
    116: [0, 0.61508, 0.09486, 0, 0.33222],
    117: [0, 0.43056, 0.07671, 0, 0.53666],
    118: [0, 0.43056, 0.10764, 0, 0.46],
    119: [0, 0.43056, 0.10764, 0, 0.66444],
    120: [0, 0.43056, 0.12042, 0, 0.46389],
    121: [0.19444, 0.43056, 0.08847, 0, 0.48555],
    122: [0, 0.43056, 0.12292, 0, 0.40889],
    126: [0.35, 0.31786, 0.11585, 0, 0.51111],
    160: [0, 0, 0, 0, 0.25],
    168: [0, 0.66786, 0.10474, 0, 0.51111],
    176: [0, 0.69444, 0, 0, 0.83129],
    184: [0.17014, 0, 0, 0, 0.46],
    198: [0, 0.68333, 0.12028, 0, 0.88277],
    216: [0.04861, 0.73194, 0.09403, 0, 0.76666],
    223: [0.19444, 0.69444, 0.10514, 0, 0.53666],
    230: [0, 0.43056, 0.07514, 0, 0.71555],
    248: [0.09722, 0.52778, 0.09194, 0, 0.51111],
    338: [0, 0.68333, 0.12028, 0, 0.98499],
    339: [0, 0.43056, 0.07514, 0, 0.71555],
    710: [0, 0.69444, 0.06646, 0, 0.51111],
    711: [0, 0.62847, 0.08295, 0, 0.51111],
    713: [0, 0.56167, 0.10333, 0, 0.51111],
    714: [0, 0.69444, 0.09694, 0, 0.51111],
    715: [0, 0.69444, 0, 0, 0.51111],
    728: [0, 0.69444, 0.10806, 0, 0.51111],
    729: [0, 0.66786, 0.11752, 0, 0.30667],
    730: [0, 0.69444, 0, 0, 0.83129],
    732: [0, 0.66786, 0.11585, 0, 0.51111],
    733: [0, 0.69444, 0.1225, 0, 0.51111],
    915: [0, 0.68333, 0.13305, 0, 0.62722],
    916: [0, 0.68333, 0, 0, 0.81777],
    920: [0, 0.68333, 0.09403, 0, 0.76666],
    923: [0, 0.68333, 0, 0, 0.69222],
    926: [0, 0.68333, 0.15294, 0, 0.66444],
    928: [0, 0.68333, 0.16389, 0, 0.74333],
    931: [0, 0.68333, 0.12028, 0, 0.71555],
    933: [0, 0.68333, 0.11111, 0, 0.76666],
    934: [0, 0.68333, 0.05986, 0, 0.71555],
    936: [0, 0.68333, 0.11111, 0, 0.76666],
    937: [0, 0.68333, 0.10257, 0, 0.71555],
    8211: [0, 0.43056, 0.09208, 0, 0.51111],
    8212: [0, 0.43056, 0.09208, 0, 1.02222],
    8216: [0, 0.69444, 0.12417, 0, 0.30667],
    8217: [0, 0.69444, 0.12417, 0, 0.30667],
    8220: [0, 0.69444, 0.1685, 0, 0.51444],
    8221: [0, 0.69444, 0.06961, 0, 0.51444],
    8463: [0, 0.68889, 0, 0, 0.54028]
  },
  "Main-Regular": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0, 0, 0.27778],
    34: [0, 0.69444, 0, 0, 0.5],
    35: [0.19444, 0.69444, 0, 0, 0.83334],
    36: [0.05556, 0.75, 0, 0, 0.5],
    37: [0.05556, 0.75, 0, 0, 0.83334],
    38: [0, 0.69444, 0, 0, 0.77778],
    39: [0, 0.69444, 0, 0, 0.27778],
    40: [0.25, 0.75, 0, 0, 0.38889],
    41: [0.25, 0.75, 0, 0, 0.38889],
    42: [0, 0.75, 0, 0, 0.5],
    43: [0.08333, 0.58333, 0, 0, 0.77778],
    44: [0.19444, 0.10556, 0, 0, 0.27778],
    45: [0, 0.43056, 0, 0, 0.33333],
    46: [0, 0.10556, 0, 0, 0.27778],
    47: [0.25, 0.75, 0, 0, 0.5],
    48: [0, 0.64444, 0, 0, 0.5],
    49: [0, 0.64444, 0, 0, 0.5],
    50: [0, 0.64444, 0, 0, 0.5],
    51: [0, 0.64444, 0, 0, 0.5],
    52: [0, 0.64444, 0, 0, 0.5],
    53: [0, 0.64444, 0, 0, 0.5],
    54: [0, 0.64444, 0, 0, 0.5],
    55: [0, 0.64444, 0, 0, 0.5],
    56: [0, 0.64444, 0, 0, 0.5],
    57: [0, 0.64444, 0, 0, 0.5],
    58: [0, 0.43056, 0, 0, 0.27778],
    59: [0.19444, 0.43056, 0, 0, 0.27778],
    60: [0.0391, 0.5391, 0, 0, 0.77778],
    61: [-0.13313, 0.36687, 0, 0, 0.77778],
    62: [0.0391, 0.5391, 0, 0, 0.77778],
    63: [0, 0.69444, 0, 0, 0.47222],
    64: [0, 0.69444, 0, 0, 0.77778],
    65: [0, 0.68333, 0, 0, 0.75],
    66: [0, 0.68333, 0, 0, 0.70834],
    67: [0, 0.68333, 0, 0, 0.72222],
    68: [0, 0.68333, 0, 0, 0.76389],
    69: [0, 0.68333, 0, 0, 0.68056],
    70: [0, 0.68333, 0, 0, 0.65278],
    71: [0, 0.68333, 0, 0, 0.78472],
    72: [0, 0.68333, 0, 0, 0.75],
    73: [0, 0.68333, 0, 0, 0.36111],
    74: [0, 0.68333, 0, 0, 0.51389],
    75: [0, 0.68333, 0, 0, 0.77778],
    76: [0, 0.68333, 0, 0, 0.625],
    77: [0, 0.68333, 0, 0, 0.91667],
    78: [0, 0.68333, 0, 0, 0.75],
    79: [0, 0.68333, 0, 0, 0.77778],
    80: [0, 0.68333, 0, 0, 0.68056],
    81: [0.19444, 0.68333, 0, 0, 0.77778],
    82: [0, 0.68333, 0, 0, 0.73611],
    83: [0, 0.68333, 0, 0, 0.55556],
    84: [0, 0.68333, 0, 0, 0.72222],
    85: [0, 0.68333, 0, 0, 0.75],
    86: [0, 0.68333, 0.01389, 0, 0.75],
    87: [0, 0.68333, 0.01389, 0, 1.02778],
    88: [0, 0.68333, 0, 0, 0.75],
    89: [0, 0.68333, 0.025, 0, 0.75],
    90: [0, 0.68333, 0, 0, 0.61111],
    91: [0.25, 0.75, 0, 0, 0.27778],
    92: [0.25, 0.75, 0, 0, 0.5],
    93: [0.25, 0.75, 0, 0, 0.27778],
    94: [0, 0.69444, 0, 0, 0.5],
    95: [0.31, 0.12056, 0.02778, 0, 0.5],
    97: [0, 0.43056, 0, 0, 0.5],
    98: [0, 0.69444, 0, 0, 0.55556],
    99: [0, 0.43056, 0, 0, 0.44445],
    100: [0, 0.69444, 0, 0, 0.55556],
    101: [0, 0.43056, 0, 0, 0.44445],
    102: [0, 0.69444, 0.07778, 0, 0.30556],
    103: [0.19444, 0.43056, 0.01389, 0, 0.5],
    104: [0, 0.69444, 0, 0, 0.55556],
    105: [0, 0.66786, 0, 0, 0.27778],
    106: [0.19444, 0.66786, 0, 0, 0.30556],
    107: [0, 0.69444, 0, 0, 0.52778],
    108: [0, 0.69444, 0, 0, 0.27778],
    109: [0, 0.43056, 0, 0, 0.83334],
    110: [0, 0.43056, 0, 0, 0.55556],
    111: [0, 0.43056, 0, 0, 0.5],
    112: [0.19444, 0.43056, 0, 0, 0.55556],
    113: [0.19444, 0.43056, 0, 0, 0.52778],
    114: [0, 0.43056, 0, 0, 0.39167],
    115: [0, 0.43056, 0, 0, 0.39445],
    116: [0, 0.61508, 0, 0, 0.38889],
    117: [0, 0.43056, 0, 0, 0.55556],
    118: [0, 0.43056, 0.01389, 0, 0.52778],
    119: [0, 0.43056, 0.01389, 0, 0.72222],
    120: [0, 0.43056, 0, 0, 0.52778],
    121: [0.19444, 0.43056, 0.01389, 0, 0.52778],
    122: [0, 0.43056, 0, 0, 0.44445],
    123: [0.25, 0.75, 0, 0, 0.5],
    124: [0.25, 0.75, 0, 0, 0.27778],
    125: [0.25, 0.75, 0, 0, 0.5],
    126: [0.35, 0.31786, 0, 0, 0.5],
    160: [0, 0, 0, 0, 0.25],
    163: [0, 0.69444, 0, 0, 0.76909],
    167: [0.19444, 0.69444, 0, 0, 0.44445],
    168: [0, 0.66786, 0, 0, 0.5],
    172: [0, 0.43056, 0, 0, 0.66667],
    176: [0, 0.69444, 0, 0, 0.75],
    177: [0.08333, 0.58333, 0, 0, 0.77778],
    182: [0.19444, 0.69444, 0, 0, 0.61111],
    184: [0.17014, 0, 0, 0, 0.44445],
    198: [0, 0.68333, 0, 0, 0.90278],
    215: [0.08333, 0.58333, 0, 0, 0.77778],
    216: [0.04861, 0.73194, 0, 0, 0.77778],
    223: [0, 0.69444, 0, 0, 0.5],
    230: [0, 0.43056, 0, 0, 0.72222],
    247: [0.08333, 0.58333, 0, 0, 0.77778],
    248: [0.09722, 0.52778, 0, 0, 0.5],
    305: [0, 0.43056, 0, 0, 0.27778],
    338: [0, 0.68333, 0, 0, 1.01389],
    339: [0, 0.43056, 0, 0, 0.77778],
    567: [0.19444, 0.43056, 0, 0, 0.30556],
    710: [0, 0.69444, 0, 0, 0.5],
    711: [0, 0.62847, 0, 0, 0.5],
    713: [0, 0.56778, 0, 0, 0.5],
    714: [0, 0.69444, 0, 0, 0.5],
    715: [0, 0.69444, 0, 0, 0.5],
    728: [0, 0.69444, 0, 0, 0.5],
    729: [0, 0.66786, 0, 0, 0.27778],
    730: [0, 0.69444, 0, 0, 0.75],
    732: [0, 0.66786, 0, 0, 0.5],
    733: [0, 0.69444, 0, 0, 0.5],
    915: [0, 0.68333, 0, 0, 0.625],
    916: [0, 0.68333, 0, 0, 0.83334],
    920: [0, 0.68333, 0, 0, 0.77778],
    923: [0, 0.68333, 0, 0, 0.69445],
    926: [0, 0.68333, 0, 0, 0.66667],
    928: [0, 0.68333, 0, 0, 0.75],
    931: [0, 0.68333, 0, 0, 0.72222],
    933: [0, 0.68333, 0, 0, 0.77778],
    934: [0, 0.68333, 0, 0, 0.72222],
    936: [0, 0.68333, 0, 0, 0.77778],
    937: [0, 0.68333, 0, 0, 0.72222],
    8211: [0, 0.43056, 0.02778, 0, 0.5],
    8212: [0, 0.43056, 0.02778, 0, 1],
    8216: [0, 0.69444, 0, 0, 0.27778],
    8217: [0, 0.69444, 0, 0, 0.27778],
    8220: [0, 0.69444, 0, 0, 0.5],
    8221: [0, 0.69444, 0, 0, 0.5],
    8224: [0.19444, 0.69444, 0, 0, 0.44445],
    8225: [0.19444, 0.69444, 0, 0, 0.44445],
    8230: [0, 0.123, 0, 0, 1.172],
    8242: [0, 0.55556, 0, 0, 0.275],
    8407: [0, 0.71444, 0.15382, 0, 0.5],
    8463: [0, 0.68889, 0, 0, 0.54028],
    8465: [0, 0.69444, 0, 0, 0.72222],
    8467: [0, 0.69444, 0, 0.11111, 0.41667],
    8472: [0.19444, 0.43056, 0, 0.11111, 0.63646],
    8476: [0, 0.69444, 0, 0, 0.72222],
    8501: [0, 0.69444, 0, 0, 0.61111],
    8592: [-0.13313, 0.36687, 0, 0, 1],
    8593: [0.19444, 0.69444, 0, 0, 0.5],
    8594: [-0.13313, 0.36687, 0, 0, 1],
    8595: [0.19444, 0.69444, 0, 0, 0.5],
    8596: [-0.13313, 0.36687, 0, 0, 1],
    8597: [0.25, 0.75, 0, 0, 0.5],
    8598: [0.19444, 0.69444, 0, 0, 1],
    8599: [0.19444, 0.69444, 0, 0, 1],
    8600: [0.19444, 0.69444, 0, 0, 1],
    8601: [0.19444, 0.69444, 0, 0, 1],
    8614: [0.011, 0.511, 0, 0, 1],
    8617: [0.011, 0.511, 0, 0, 1.126],
    8618: [0.011, 0.511, 0, 0, 1.126],
    8636: [-0.13313, 0.36687, 0, 0, 1],
    8637: [-0.13313, 0.36687, 0, 0, 1],
    8640: [-0.13313, 0.36687, 0, 0, 1],
    8641: [-0.13313, 0.36687, 0, 0, 1],
    8652: [0.011, 0.671, 0, 0, 1],
    8656: [-0.13313, 0.36687, 0, 0, 1],
    8657: [0.19444, 0.69444, 0, 0, 0.61111],
    8658: [-0.13313, 0.36687, 0, 0, 1],
    8659: [0.19444, 0.69444, 0, 0, 0.61111],
    8660: [-0.13313, 0.36687, 0, 0, 1],
    8661: [0.25, 0.75, 0, 0, 0.61111],
    8704: [0, 0.69444, 0, 0, 0.55556],
    8706: [0, 0.69444, 0.05556, 0.08334, 0.5309],
    8707: [0, 0.69444, 0, 0, 0.55556],
    8709: [0.05556, 0.75, 0, 0, 0.5],
    8711: [0, 0.68333, 0, 0, 0.83334],
    8712: [0.0391, 0.5391, 0, 0, 0.66667],
    8715: [0.0391, 0.5391, 0, 0, 0.66667],
    8722: [0.08333, 0.58333, 0, 0, 0.77778],
    8723: [0.08333, 0.58333, 0, 0, 0.77778],
    8725: [0.25, 0.75, 0, 0, 0.5],
    8726: [0.25, 0.75, 0, 0, 0.5],
    8727: [-0.03472, 0.46528, 0, 0, 0.5],
    8728: [-0.05555, 0.44445, 0, 0, 0.5],
    8729: [-0.05555, 0.44445, 0, 0, 0.5],
    8730: [0.2, 0.8, 0, 0, 0.83334],
    8733: [0, 0.43056, 0, 0, 0.77778],
    8734: [0, 0.43056, 0, 0, 1],
    8736: [0, 0.69224, 0, 0, 0.72222],
    8739: [0.25, 0.75, 0, 0, 0.27778],
    8741: [0.25, 0.75, 0, 0, 0.5],
    8743: [0, 0.55556, 0, 0, 0.66667],
    8744: [0, 0.55556, 0, 0, 0.66667],
    8745: [0, 0.55556, 0, 0, 0.66667],
    8746: [0, 0.55556, 0, 0, 0.66667],
    8747: [0.19444, 0.69444, 0.11111, 0, 0.41667],
    8764: [-0.13313, 0.36687, 0, 0, 0.77778],
    8768: [0.19444, 0.69444, 0, 0, 0.27778],
    8771: [-0.03625, 0.46375, 0, 0, 0.77778],
    8773: [-0.022, 0.589, 0, 0, 0.778],
    8776: [-0.01688, 0.48312, 0, 0, 0.77778],
    8781: [-0.03625, 0.46375, 0, 0, 0.77778],
    8784: [-0.133, 0.673, 0, 0, 0.778],
    8801: [-0.03625, 0.46375, 0, 0, 0.77778],
    8804: [0.13597, 0.63597, 0, 0, 0.77778],
    8805: [0.13597, 0.63597, 0, 0, 0.77778],
    8810: [0.0391, 0.5391, 0, 0, 1],
    8811: [0.0391, 0.5391, 0, 0, 1],
    8826: [0.0391, 0.5391, 0, 0, 0.77778],
    8827: [0.0391, 0.5391, 0, 0, 0.77778],
    8834: [0.0391, 0.5391, 0, 0, 0.77778],
    8835: [0.0391, 0.5391, 0, 0, 0.77778],
    8838: [0.13597, 0.63597, 0, 0, 0.77778],
    8839: [0.13597, 0.63597, 0, 0, 0.77778],
    8846: [0, 0.55556, 0, 0, 0.66667],
    8849: [0.13597, 0.63597, 0, 0, 0.77778],
    8850: [0.13597, 0.63597, 0, 0, 0.77778],
    8851: [0, 0.55556, 0, 0, 0.66667],
    8852: [0, 0.55556, 0, 0, 0.66667],
    8853: [0.08333, 0.58333, 0, 0, 0.77778],
    8854: [0.08333, 0.58333, 0, 0, 0.77778],
    8855: [0.08333, 0.58333, 0, 0, 0.77778],
    8856: [0.08333, 0.58333, 0, 0, 0.77778],
    8857: [0.08333, 0.58333, 0, 0, 0.77778],
    8866: [0, 0.69444, 0, 0, 0.61111],
    8867: [0, 0.69444, 0, 0, 0.61111],
    8868: [0, 0.69444, 0, 0, 0.77778],
    8869: [0, 0.69444, 0, 0, 0.77778],
    8872: [0.249, 0.75, 0, 0, 0.867],
    8900: [-0.05555, 0.44445, 0, 0, 0.5],
    8901: [-0.05555, 0.44445, 0, 0, 0.27778],
    8902: [-0.03472, 0.46528, 0, 0, 0.5],
    8904: [5e-3, 0.505, 0, 0, 0.9],
    8942: [0.03, 0.903, 0, 0, 0.278],
    8943: [-0.19, 0.313, 0, 0, 1.172],
    8945: [-0.1, 0.823, 0, 0, 1.282],
    8968: [0.25, 0.75, 0, 0, 0.44445],
    8969: [0.25, 0.75, 0, 0, 0.44445],
    8970: [0.25, 0.75, 0, 0, 0.44445],
    8971: [0.25, 0.75, 0, 0, 0.44445],
    8994: [-0.14236, 0.35764, 0, 0, 1],
    8995: [-0.14236, 0.35764, 0, 0, 1],
    9136: [0.244, 0.744, 0, 0, 0.412],
    9137: [0.244, 0.745, 0, 0, 0.412],
    9651: [0.19444, 0.69444, 0, 0, 0.88889],
    9657: [-0.03472, 0.46528, 0, 0, 0.5],
    9661: [0.19444, 0.69444, 0, 0, 0.88889],
    9667: [-0.03472, 0.46528, 0, 0, 0.5],
    9711: [0.19444, 0.69444, 0, 0, 1],
    9824: [0.12963, 0.69444, 0, 0, 0.77778],
    9825: [0.12963, 0.69444, 0, 0, 0.77778],
    9826: [0.12963, 0.69444, 0, 0, 0.77778],
    9827: [0.12963, 0.69444, 0, 0, 0.77778],
    9837: [0, 0.75, 0, 0, 0.38889],
    9838: [0.19444, 0.69444, 0, 0, 0.38889],
    9839: [0.19444, 0.69444, 0, 0, 0.38889],
    10216: [0.25, 0.75, 0, 0, 0.38889],
    10217: [0.25, 0.75, 0, 0, 0.38889],
    10222: [0.244, 0.744, 0, 0, 0.412],
    10223: [0.244, 0.745, 0, 0, 0.412],
    10229: [0.011, 0.511, 0, 0, 1.609],
    10230: [0.011, 0.511, 0, 0, 1.638],
    10231: [0.011, 0.511, 0, 0, 1.859],
    10232: [0.024, 0.525, 0, 0, 1.609],
    10233: [0.024, 0.525, 0, 0, 1.638],
    10234: [0.024, 0.525, 0, 0, 1.858],
    10236: [0.011, 0.511, 0, 0, 1.638],
    10815: [0, 0.68333, 0, 0, 0.75],
    10927: [0.13597, 0.63597, 0, 0, 0.77778],
    10928: [0.13597, 0.63597, 0, 0, 0.77778],
    57376: [0.19444, 0.69444, 0, 0, 0]
  },
  "Math-BoldItalic": {
    32: [0, 0, 0, 0, 0.25],
    48: [0, 0.44444, 0, 0, 0.575],
    49: [0, 0.44444, 0, 0, 0.575],
    50: [0, 0.44444, 0, 0, 0.575],
    51: [0.19444, 0.44444, 0, 0, 0.575],
    52: [0.19444, 0.44444, 0, 0, 0.575],
    53: [0.19444, 0.44444, 0, 0, 0.575],
    54: [0, 0.64444, 0, 0, 0.575],
    55: [0.19444, 0.44444, 0, 0, 0.575],
    56: [0, 0.64444, 0, 0, 0.575],
    57: [0.19444, 0.44444, 0, 0, 0.575],
    65: [0, 0.68611, 0, 0, 0.86944],
    66: [0, 0.68611, 0.04835, 0, 0.8664],
    67: [0, 0.68611, 0.06979, 0, 0.81694],
    68: [0, 0.68611, 0.03194, 0, 0.93812],
    69: [0, 0.68611, 0.05451, 0, 0.81007],
    70: [0, 0.68611, 0.15972, 0, 0.68889],
    71: [0, 0.68611, 0, 0, 0.88673],
    72: [0, 0.68611, 0.08229, 0, 0.98229],
    73: [0, 0.68611, 0.07778, 0, 0.51111],
    74: [0, 0.68611, 0.10069, 0, 0.63125],
    75: [0, 0.68611, 0.06979, 0, 0.97118],
    76: [0, 0.68611, 0, 0, 0.75555],
    77: [0, 0.68611, 0.11424, 0, 1.14201],
    78: [0, 0.68611, 0.11424, 0, 0.95034],
    79: [0, 0.68611, 0.03194, 0, 0.83666],
    80: [0, 0.68611, 0.15972, 0, 0.72309],
    81: [0.19444, 0.68611, 0, 0, 0.86861],
    82: [0, 0.68611, 421e-5, 0, 0.87235],
    83: [0, 0.68611, 0.05382, 0, 0.69271],
    84: [0, 0.68611, 0.15972, 0, 0.63663],
    85: [0, 0.68611, 0.11424, 0, 0.80027],
    86: [0, 0.68611, 0.25555, 0, 0.67778],
    87: [0, 0.68611, 0.15972, 0, 1.09305],
    88: [0, 0.68611, 0.07778, 0, 0.94722],
    89: [0, 0.68611, 0.25555, 0, 0.67458],
    90: [0, 0.68611, 0.06979, 0, 0.77257],
    97: [0, 0.44444, 0, 0, 0.63287],
    98: [0, 0.69444, 0, 0, 0.52083],
    99: [0, 0.44444, 0, 0, 0.51342],
    100: [0, 0.69444, 0, 0, 0.60972],
    101: [0, 0.44444, 0, 0, 0.55361],
    102: [0.19444, 0.69444, 0.11042, 0, 0.56806],
    103: [0.19444, 0.44444, 0.03704, 0, 0.5449],
    104: [0, 0.69444, 0, 0, 0.66759],
    105: [0, 0.69326, 0, 0, 0.4048],
    106: [0.19444, 0.69326, 0.0622, 0, 0.47083],
    107: [0, 0.69444, 0.01852, 0, 0.6037],
    108: [0, 0.69444, 88e-4, 0, 0.34815],
    109: [0, 0.44444, 0, 0, 1.0324],
    110: [0, 0.44444, 0, 0, 0.71296],
    111: [0, 0.44444, 0, 0, 0.58472],
    112: [0.19444, 0.44444, 0, 0, 0.60092],
    113: [0.19444, 0.44444, 0.03704, 0, 0.54213],
    114: [0, 0.44444, 0.03194, 0, 0.5287],
    115: [0, 0.44444, 0, 0, 0.53125],
    116: [0, 0.63492, 0, 0, 0.41528],
    117: [0, 0.44444, 0, 0, 0.68102],
    118: [0, 0.44444, 0.03704, 0, 0.56666],
    119: [0, 0.44444, 0.02778, 0, 0.83148],
    120: [0, 0.44444, 0, 0, 0.65903],
    121: [0.19444, 0.44444, 0.03704, 0, 0.59028],
    122: [0, 0.44444, 0.04213, 0, 0.55509],
    160: [0, 0, 0, 0, 0.25],
    915: [0, 0.68611, 0.15972, 0, 0.65694],
    916: [0, 0.68611, 0, 0, 0.95833],
    920: [0, 0.68611, 0.03194, 0, 0.86722],
    923: [0, 0.68611, 0, 0, 0.80555],
    926: [0, 0.68611, 0.07458, 0, 0.84125],
    928: [0, 0.68611, 0.08229, 0, 0.98229],
    931: [0, 0.68611, 0.05451, 0, 0.88507],
    933: [0, 0.68611, 0.15972, 0, 0.67083],
    934: [0, 0.68611, 0, 0, 0.76666],
    936: [0, 0.68611, 0.11653, 0, 0.71402],
    937: [0, 0.68611, 0.04835, 0, 0.8789],
    945: [0, 0.44444, 0, 0, 0.76064],
    946: [0.19444, 0.69444, 0.03403, 0, 0.65972],
    947: [0.19444, 0.44444, 0.06389, 0, 0.59003],
    948: [0, 0.69444, 0.03819, 0, 0.52222],
    949: [0, 0.44444, 0, 0, 0.52882],
    950: [0.19444, 0.69444, 0.06215, 0, 0.50833],
    951: [0.19444, 0.44444, 0.03704, 0, 0.6],
    952: [0, 0.69444, 0.03194, 0, 0.5618],
    953: [0, 0.44444, 0, 0, 0.41204],
    954: [0, 0.44444, 0, 0, 0.66759],
    955: [0, 0.69444, 0, 0, 0.67083],
    956: [0.19444, 0.44444, 0, 0, 0.70787],
    957: [0, 0.44444, 0.06898, 0, 0.57685],
    958: [0.19444, 0.69444, 0.03021, 0, 0.50833],
    959: [0, 0.44444, 0, 0, 0.58472],
    960: [0, 0.44444, 0.03704, 0, 0.68241],
    961: [0.19444, 0.44444, 0, 0, 0.6118],
    962: [0.09722, 0.44444, 0.07917, 0, 0.42361],
    963: [0, 0.44444, 0.03704, 0, 0.68588],
    964: [0, 0.44444, 0.13472, 0, 0.52083],
    965: [0, 0.44444, 0.03704, 0, 0.63055],
    966: [0.19444, 0.44444, 0, 0, 0.74722],
    967: [0.19444, 0.44444, 0, 0, 0.71805],
    968: [0.19444, 0.69444, 0.03704, 0, 0.75833],
    969: [0, 0.44444, 0.03704, 0, 0.71782],
    977: [0, 0.69444, 0, 0, 0.69155],
    981: [0.19444, 0.69444, 0, 0, 0.7125],
    982: [0, 0.44444, 0.03194, 0, 0.975],
    1009: [0.19444, 0.44444, 0, 0, 0.6118],
    1013: [0, 0.44444, 0, 0, 0.48333],
    57649: [0, 0.44444, 0, 0, 0.39352],
    57911: [0.19444, 0.44444, 0, 0, 0.43889]
  },
  "Math-Italic": {
    32: [0, 0, 0, 0, 0.25],
    48: [0, 0.43056, 0, 0, 0.5],
    49: [0, 0.43056, 0, 0, 0.5],
    50: [0, 0.43056, 0, 0, 0.5],
    51: [0.19444, 0.43056, 0, 0, 0.5],
    52: [0.19444, 0.43056, 0, 0, 0.5],
    53: [0.19444, 0.43056, 0, 0, 0.5],
    54: [0, 0.64444, 0, 0, 0.5],
    55: [0.19444, 0.43056, 0, 0, 0.5],
    56: [0, 0.64444, 0, 0, 0.5],
    57: [0.19444, 0.43056, 0, 0, 0.5],
    65: [0, 0.68333, 0, 0.13889, 0.75],
    66: [0, 0.68333, 0.05017, 0.08334, 0.75851],
    67: [0, 0.68333, 0.07153, 0.08334, 0.71472],
    68: [0, 0.68333, 0.02778, 0.05556, 0.82792],
    69: [0, 0.68333, 0.05764, 0.08334, 0.7382],
    70: [0, 0.68333, 0.13889, 0.08334, 0.64306],
    71: [0, 0.68333, 0, 0.08334, 0.78625],
    72: [0, 0.68333, 0.08125, 0.05556, 0.83125],
    73: [0, 0.68333, 0.07847, 0.11111, 0.43958],
    74: [0, 0.68333, 0.09618, 0.16667, 0.55451],
    75: [0, 0.68333, 0.07153, 0.05556, 0.84931],
    76: [0, 0.68333, 0, 0.02778, 0.68056],
    77: [0, 0.68333, 0.10903, 0.08334, 0.97014],
    78: [0, 0.68333, 0.10903, 0.08334, 0.80347],
    79: [0, 0.68333, 0.02778, 0.08334, 0.76278],
    80: [0, 0.68333, 0.13889, 0.08334, 0.64201],
    81: [0.19444, 0.68333, 0, 0.08334, 0.79056],
    82: [0, 0.68333, 773e-5, 0.08334, 0.75929],
    83: [0, 0.68333, 0.05764, 0.08334, 0.6132],
    84: [0, 0.68333, 0.13889, 0.08334, 0.58438],
    85: [0, 0.68333, 0.10903, 0.02778, 0.68278],
    86: [0, 0.68333, 0.22222, 0, 0.58333],
    87: [0, 0.68333, 0.13889, 0, 0.94445],
    88: [0, 0.68333, 0.07847, 0.08334, 0.82847],
    89: [0, 0.68333, 0.22222, 0, 0.58056],
    90: [0, 0.68333, 0.07153, 0.08334, 0.68264],
    97: [0, 0.43056, 0, 0, 0.52859],
    98: [0, 0.69444, 0, 0, 0.42917],
    99: [0, 0.43056, 0, 0.05556, 0.43276],
    100: [0, 0.69444, 0, 0.16667, 0.52049],
    101: [0, 0.43056, 0, 0.05556, 0.46563],
    102: [0.19444, 0.69444, 0.10764, 0.16667, 0.48959],
    103: [0.19444, 0.43056, 0.03588, 0.02778, 0.47697],
    104: [0, 0.69444, 0, 0, 0.57616],
    105: [0, 0.65952, 0, 0, 0.34451],
    106: [0.19444, 0.65952, 0.05724, 0, 0.41181],
    107: [0, 0.69444, 0.03148, 0, 0.5206],
    108: [0, 0.69444, 0.01968, 0.08334, 0.29838],
    109: [0, 0.43056, 0, 0, 0.87801],
    110: [0, 0.43056, 0, 0, 0.60023],
    111: [0, 0.43056, 0, 0.05556, 0.48472],
    112: [0.19444, 0.43056, 0, 0.08334, 0.50313],
    113: [0.19444, 0.43056, 0.03588, 0.08334, 0.44641],
    114: [0, 0.43056, 0.02778, 0.05556, 0.45116],
    115: [0, 0.43056, 0, 0.05556, 0.46875],
    116: [0, 0.61508, 0, 0.08334, 0.36111],
    117: [0, 0.43056, 0, 0.02778, 0.57246],
    118: [0, 0.43056, 0.03588, 0.02778, 0.48472],
    119: [0, 0.43056, 0.02691, 0.08334, 0.71592],
    120: [0, 0.43056, 0, 0.02778, 0.57153],
    121: [0.19444, 0.43056, 0.03588, 0.05556, 0.49028],
    122: [0, 0.43056, 0.04398, 0.05556, 0.46505],
    160: [0, 0, 0, 0, 0.25],
    915: [0, 0.68333, 0.13889, 0.08334, 0.61528],
    916: [0, 0.68333, 0, 0.16667, 0.83334],
    920: [0, 0.68333, 0.02778, 0.08334, 0.76278],
    923: [0, 0.68333, 0, 0.16667, 0.69445],
    926: [0, 0.68333, 0.07569, 0.08334, 0.74236],
    928: [0, 0.68333, 0.08125, 0.05556, 0.83125],
    931: [0, 0.68333, 0.05764, 0.08334, 0.77986],
    933: [0, 0.68333, 0.13889, 0.05556, 0.58333],
    934: [0, 0.68333, 0, 0.08334, 0.66667],
    936: [0, 0.68333, 0.11, 0.05556, 0.61222],
    937: [0, 0.68333, 0.05017, 0.08334, 0.7724],
    945: [0, 0.43056, 37e-4, 0.02778, 0.6397],
    946: [0.19444, 0.69444, 0.05278, 0.08334, 0.56563],
    947: [0.19444, 0.43056, 0.05556, 0, 0.51773],
    948: [0, 0.69444, 0.03785, 0.05556, 0.44444],
    949: [0, 0.43056, 0, 0.08334, 0.46632],
    950: [0.19444, 0.69444, 0.07378, 0.08334, 0.4375],
    951: [0.19444, 0.43056, 0.03588, 0.05556, 0.49653],
    952: [0, 0.69444, 0.02778, 0.08334, 0.46944],
    953: [0, 0.43056, 0, 0.05556, 0.35394],
    954: [0, 0.43056, 0, 0, 0.57616],
    955: [0, 0.69444, 0, 0, 0.58334],
    956: [0.19444, 0.43056, 0, 0.02778, 0.60255],
    957: [0, 0.43056, 0.06366, 0.02778, 0.49398],
    958: [0.19444, 0.69444, 0.04601, 0.11111, 0.4375],
    959: [0, 0.43056, 0, 0.05556, 0.48472],
    960: [0, 0.43056, 0.03588, 0, 0.57003],
    961: [0.19444, 0.43056, 0, 0.08334, 0.51702],
    962: [0.09722, 0.43056, 0.07986, 0.08334, 0.36285],
    963: [0, 0.43056, 0.03588, 0, 0.57141],
    964: [0, 0.43056, 0.1132, 0.02778, 0.43715],
    965: [0, 0.43056, 0.03588, 0.02778, 0.54028],
    966: [0.19444, 0.43056, 0, 0.08334, 0.65417],
    967: [0.19444, 0.43056, 0, 0.05556, 0.62569],
    968: [0.19444, 0.69444, 0.03588, 0.11111, 0.65139],
    969: [0, 0.43056, 0.03588, 0, 0.62245],
    977: [0, 0.69444, 0, 0.08334, 0.59144],
    981: [0.19444, 0.69444, 0, 0.08334, 0.59583],
    982: [0, 0.43056, 0.02778, 0, 0.82813],
    1009: [0.19444, 0.43056, 0, 0.08334, 0.51702],
    1013: [0, 0.43056, 0, 0.05556, 0.4059],
    57649: [0, 0.43056, 0, 0.02778, 0.32246],
    57911: [0.19444, 0.43056, 0, 0.08334, 0.38403]
  },
  "SansSerif-Bold": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0, 0, 0.36667],
    34: [0, 0.69444, 0, 0, 0.55834],
    35: [0.19444, 0.69444, 0, 0, 0.91667],
    36: [0.05556, 0.75, 0, 0, 0.55],
    37: [0.05556, 0.75, 0, 0, 1.02912],
    38: [0, 0.69444, 0, 0, 0.83056],
    39: [0, 0.69444, 0, 0, 0.30556],
    40: [0.25, 0.75, 0, 0, 0.42778],
    41: [0.25, 0.75, 0, 0, 0.42778],
    42: [0, 0.75, 0, 0, 0.55],
    43: [0.11667, 0.61667, 0, 0, 0.85556],
    44: [0.10556, 0.13056, 0, 0, 0.30556],
    45: [0, 0.45833, 0, 0, 0.36667],
    46: [0, 0.13056, 0, 0, 0.30556],
    47: [0.25, 0.75, 0, 0, 0.55],
    48: [0, 0.69444, 0, 0, 0.55],
    49: [0, 0.69444, 0, 0, 0.55],
    50: [0, 0.69444, 0, 0, 0.55],
    51: [0, 0.69444, 0, 0, 0.55],
    52: [0, 0.69444, 0, 0, 0.55],
    53: [0, 0.69444, 0, 0, 0.55],
    54: [0, 0.69444, 0, 0, 0.55],
    55: [0, 0.69444, 0, 0, 0.55],
    56: [0, 0.69444, 0, 0, 0.55],
    57: [0, 0.69444, 0, 0, 0.55],
    58: [0, 0.45833, 0, 0, 0.30556],
    59: [0.10556, 0.45833, 0, 0, 0.30556],
    61: [-0.09375, 0.40625, 0, 0, 0.85556],
    63: [0, 0.69444, 0, 0, 0.51945],
    64: [0, 0.69444, 0, 0, 0.73334],
    65: [0, 0.69444, 0, 0, 0.73334],
    66: [0, 0.69444, 0, 0, 0.73334],
    67: [0, 0.69444, 0, 0, 0.70278],
    68: [0, 0.69444, 0, 0, 0.79445],
    69: [0, 0.69444, 0, 0, 0.64167],
    70: [0, 0.69444, 0, 0, 0.61111],
    71: [0, 0.69444, 0, 0, 0.73334],
    72: [0, 0.69444, 0, 0, 0.79445],
    73: [0, 0.69444, 0, 0, 0.33056],
    74: [0, 0.69444, 0, 0, 0.51945],
    75: [0, 0.69444, 0, 0, 0.76389],
    76: [0, 0.69444, 0, 0, 0.58056],
    77: [0, 0.69444, 0, 0, 0.97778],
    78: [0, 0.69444, 0, 0, 0.79445],
    79: [0, 0.69444, 0, 0, 0.79445],
    80: [0, 0.69444, 0, 0, 0.70278],
    81: [0.10556, 0.69444, 0, 0, 0.79445],
    82: [0, 0.69444, 0, 0, 0.70278],
    83: [0, 0.69444, 0, 0, 0.61111],
    84: [0, 0.69444, 0, 0, 0.73334],
    85: [0, 0.69444, 0, 0, 0.76389],
    86: [0, 0.69444, 0.01528, 0, 0.73334],
    87: [0, 0.69444, 0.01528, 0, 1.03889],
    88: [0, 0.69444, 0, 0, 0.73334],
    89: [0, 0.69444, 0.0275, 0, 0.73334],
    90: [0, 0.69444, 0, 0, 0.67223],
    91: [0.25, 0.75, 0, 0, 0.34306],
    93: [0.25, 0.75, 0, 0, 0.34306],
    94: [0, 0.69444, 0, 0, 0.55],
    95: [0.35, 0.10833, 0.03056, 0, 0.55],
    97: [0, 0.45833, 0, 0, 0.525],
    98: [0, 0.69444, 0, 0, 0.56111],
    99: [0, 0.45833, 0, 0, 0.48889],
    100: [0, 0.69444, 0, 0, 0.56111],
    101: [0, 0.45833, 0, 0, 0.51111],
    102: [0, 0.69444, 0.07639, 0, 0.33611],
    103: [0.19444, 0.45833, 0.01528, 0, 0.55],
    104: [0, 0.69444, 0, 0, 0.56111],
    105: [0, 0.69444, 0, 0, 0.25556],
    106: [0.19444, 0.69444, 0, 0, 0.28611],
    107: [0, 0.69444, 0, 0, 0.53056],
    108: [0, 0.69444, 0, 0, 0.25556],
    109: [0, 0.45833, 0, 0, 0.86667],
    110: [0, 0.45833, 0, 0, 0.56111],
    111: [0, 0.45833, 0, 0, 0.55],
    112: [0.19444, 0.45833, 0, 0, 0.56111],
    113: [0.19444, 0.45833, 0, 0, 0.56111],
    114: [0, 0.45833, 0.01528, 0, 0.37222],
    115: [0, 0.45833, 0, 0, 0.42167],
    116: [0, 0.58929, 0, 0, 0.40417],
    117: [0, 0.45833, 0, 0, 0.56111],
    118: [0, 0.45833, 0.01528, 0, 0.5],
    119: [0, 0.45833, 0.01528, 0, 0.74445],
    120: [0, 0.45833, 0, 0, 0.5],
    121: [0.19444, 0.45833, 0.01528, 0, 0.5],
    122: [0, 0.45833, 0, 0, 0.47639],
    126: [0.35, 0.34444, 0, 0, 0.55],
    160: [0, 0, 0, 0, 0.25],
    168: [0, 0.69444, 0, 0, 0.55],
    176: [0, 0.69444, 0, 0, 0.73334],
    180: [0, 0.69444, 0, 0, 0.55],
    184: [0.17014, 0, 0, 0, 0.48889],
    305: [0, 0.45833, 0, 0, 0.25556],
    567: [0.19444, 0.45833, 0, 0, 0.28611],
    710: [0, 0.69444, 0, 0, 0.55],
    711: [0, 0.63542, 0, 0, 0.55],
    713: [0, 0.63778, 0, 0, 0.55],
    728: [0, 0.69444, 0, 0, 0.55],
    729: [0, 0.69444, 0, 0, 0.30556],
    730: [0, 0.69444, 0, 0, 0.73334],
    732: [0, 0.69444, 0, 0, 0.55],
    733: [0, 0.69444, 0, 0, 0.55],
    915: [0, 0.69444, 0, 0, 0.58056],
    916: [0, 0.69444, 0, 0, 0.91667],
    920: [0, 0.69444, 0, 0, 0.85556],
    923: [0, 0.69444, 0, 0, 0.67223],
    926: [0, 0.69444, 0, 0, 0.73334],
    928: [0, 0.69444, 0, 0, 0.79445],
    931: [0, 0.69444, 0, 0, 0.79445],
    933: [0, 0.69444, 0, 0, 0.85556],
    934: [0, 0.69444, 0, 0, 0.79445],
    936: [0, 0.69444, 0, 0, 0.85556],
    937: [0, 0.69444, 0, 0, 0.79445],
    8211: [0, 0.45833, 0.03056, 0, 0.55],
    8212: [0, 0.45833, 0.03056, 0, 1.10001],
    8216: [0, 0.69444, 0, 0, 0.30556],
    8217: [0, 0.69444, 0, 0, 0.30556],
    8220: [0, 0.69444, 0, 0, 0.55834],
    8221: [0, 0.69444, 0, 0, 0.55834]
  },
  "SansSerif-Italic": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0.05733, 0, 0.31945],
    34: [0, 0.69444, 316e-5, 0, 0.5],
    35: [0.19444, 0.69444, 0.05087, 0, 0.83334],
    36: [0.05556, 0.75, 0.11156, 0, 0.5],
    37: [0.05556, 0.75, 0.03126, 0, 0.83334],
    38: [0, 0.69444, 0.03058, 0, 0.75834],
    39: [0, 0.69444, 0.07816, 0, 0.27778],
    40: [0.25, 0.75, 0.13164, 0, 0.38889],
    41: [0.25, 0.75, 0.02536, 0, 0.38889],
    42: [0, 0.75, 0.11775, 0, 0.5],
    43: [0.08333, 0.58333, 0.02536, 0, 0.77778],
    44: [0.125, 0.08333, 0, 0, 0.27778],
    45: [0, 0.44444, 0.01946, 0, 0.33333],
    46: [0, 0.08333, 0, 0, 0.27778],
    47: [0.25, 0.75, 0.13164, 0, 0.5],
    48: [0, 0.65556, 0.11156, 0, 0.5],
    49: [0, 0.65556, 0.11156, 0, 0.5],
    50: [0, 0.65556, 0.11156, 0, 0.5],
    51: [0, 0.65556, 0.11156, 0, 0.5],
    52: [0, 0.65556, 0.11156, 0, 0.5],
    53: [0, 0.65556, 0.11156, 0, 0.5],
    54: [0, 0.65556, 0.11156, 0, 0.5],
    55: [0, 0.65556, 0.11156, 0, 0.5],
    56: [0, 0.65556, 0.11156, 0, 0.5],
    57: [0, 0.65556, 0.11156, 0, 0.5],
    58: [0, 0.44444, 0.02502, 0, 0.27778],
    59: [0.125, 0.44444, 0.02502, 0, 0.27778],
    61: [-0.13, 0.37, 0.05087, 0, 0.77778],
    63: [0, 0.69444, 0.11809, 0, 0.47222],
    64: [0, 0.69444, 0.07555, 0, 0.66667],
    65: [0, 0.69444, 0, 0, 0.66667],
    66: [0, 0.69444, 0.08293, 0, 0.66667],
    67: [0, 0.69444, 0.11983, 0, 0.63889],
    68: [0, 0.69444, 0.07555, 0, 0.72223],
    69: [0, 0.69444, 0.11983, 0, 0.59722],
    70: [0, 0.69444, 0.13372, 0, 0.56945],
    71: [0, 0.69444, 0.11983, 0, 0.66667],
    72: [0, 0.69444, 0.08094, 0, 0.70834],
    73: [0, 0.69444, 0.13372, 0, 0.27778],
    74: [0, 0.69444, 0.08094, 0, 0.47222],
    75: [0, 0.69444, 0.11983, 0, 0.69445],
    76: [0, 0.69444, 0, 0, 0.54167],
    77: [0, 0.69444, 0.08094, 0, 0.875],
    78: [0, 0.69444, 0.08094, 0, 0.70834],
    79: [0, 0.69444, 0.07555, 0, 0.73611],
    80: [0, 0.69444, 0.08293, 0, 0.63889],
    81: [0.125, 0.69444, 0.07555, 0, 0.73611],
    82: [0, 0.69444, 0.08293, 0, 0.64584],
    83: [0, 0.69444, 0.09205, 0, 0.55556],
    84: [0, 0.69444, 0.13372, 0, 0.68056],
    85: [0, 0.69444, 0.08094, 0, 0.6875],
    86: [0, 0.69444, 0.1615, 0, 0.66667],
    87: [0, 0.69444, 0.1615, 0, 0.94445],
    88: [0, 0.69444, 0.13372, 0, 0.66667],
    89: [0, 0.69444, 0.17261, 0, 0.66667],
    90: [0, 0.69444, 0.11983, 0, 0.61111],
    91: [0.25, 0.75, 0.15942, 0, 0.28889],
    93: [0.25, 0.75, 0.08719, 0, 0.28889],
    94: [0, 0.69444, 0.0799, 0, 0.5],
    95: [0.35, 0.09444, 0.08616, 0, 0.5],
    97: [0, 0.44444, 981e-5, 0, 0.48056],
    98: [0, 0.69444, 0.03057, 0, 0.51667],
    99: [0, 0.44444, 0.08336, 0, 0.44445],
    100: [0, 0.69444, 0.09483, 0, 0.51667],
    101: [0, 0.44444, 0.06778, 0, 0.44445],
    102: [0, 0.69444, 0.21705, 0, 0.30556],
    103: [0.19444, 0.44444, 0.10836, 0, 0.5],
    104: [0, 0.69444, 0.01778, 0, 0.51667],
    105: [0, 0.67937, 0.09718, 0, 0.23889],
    106: [0.19444, 0.67937, 0.09162, 0, 0.26667],
    107: [0, 0.69444, 0.08336, 0, 0.48889],
    108: [0, 0.69444, 0.09483, 0, 0.23889],
    109: [0, 0.44444, 0.01778, 0, 0.79445],
    110: [0, 0.44444, 0.01778, 0, 0.51667],
    111: [0, 0.44444, 0.06613, 0, 0.5],
    112: [0.19444, 0.44444, 0.0389, 0, 0.51667],
    113: [0.19444, 0.44444, 0.04169, 0, 0.51667],
    114: [0, 0.44444, 0.10836, 0, 0.34167],
    115: [0, 0.44444, 0.0778, 0, 0.38333],
    116: [0, 0.57143, 0.07225, 0, 0.36111],
    117: [0, 0.44444, 0.04169, 0, 0.51667],
    118: [0, 0.44444, 0.10836, 0, 0.46111],
    119: [0, 0.44444, 0.10836, 0, 0.68334],
    120: [0, 0.44444, 0.09169, 0, 0.46111],
    121: [0.19444, 0.44444, 0.10836, 0, 0.46111],
    122: [0, 0.44444, 0.08752, 0, 0.43472],
    126: [0.35, 0.32659, 0.08826, 0, 0.5],
    160: [0, 0, 0, 0, 0.25],
    168: [0, 0.67937, 0.06385, 0, 0.5],
    176: [0, 0.69444, 0, 0, 0.73752],
    184: [0.17014, 0, 0, 0, 0.44445],
    305: [0, 0.44444, 0.04169, 0, 0.23889],
    567: [0.19444, 0.44444, 0.04169, 0, 0.26667],
    710: [0, 0.69444, 0.0799, 0, 0.5],
    711: [0, 0.63194, 0.08432, 0, 0.5],
    713: [0, 0.60889, 0.08776, 0, 0.5],
    714: [0, 0.69444, 0.09205, 0, 0.5],
    715: [0, 0.69444, 0, 0, 0.5],
    728: [0, 0.69444, 0.09483, 0, 0.5],
    729: [0, 0.67937, 0.07774, 0, 0.27778],
    730: [0, 0.69444, 0, 0, 0.73752],
    732: [0, 0.67659, 0.08826, 0, 0.5],
    733: [0, 0.69444, 0.09205, 0, 0.5],
    915: [0, 0.69444, 0.13372, 0, 0.54167],
    916: [0, 0.69444, 0, 0, 0.83334],
    920: [0, 0.69444, 0.07555, 0, 0.77778],
    923: [0, 0.69444, 0, 0, 0.61111],
    926: [0, 0.69444, 0.12816, 0, 0.66667],
    928: [0, 0.69444, 0.08094, 0, 0.70834],
    931: [0, 0.69444, 0.11983, 0, 0.72222],
    933: [0, 0.69444, 0.09031, 0, 0.77778],
    934: [0, 0.69444, 0.04603, 0, 0.72222],
    936: [0, 0.69444, 0.09031, 0, 0.77778],
    937: [0, 0.69444, 0.08293, 0, 0.72222],
    8211: [0, 0.44444, 0.08616, 0, 0.5],
    8212: [0, 0.44444, 0.08616, 0, 1],
    8216: [0, 0.69444, 0.07816, 0, 0.27778],
    8217: [0, 0.69444, 0.07816, 0, 0.27778],
    8220: [0, 0.69444, 0.14205, 0, 0.5],
    8221: [0, 0.69444, 316e-5, 0, 0.5]
  },
  "SansSerif-Regular": {
    32: [0, 0, 0, 0, 0.25],
    33: [0, 0.69444, 0, 0, 0.31945],
    34: [0, 0.69444, 0, 0, 0.5],
    35: [0.19444, 0.69444, 0, 0, 0.83334],
    36: [0.05556, 0.75, 0, 0, 0.5],
    37: [0.05556, 0.75, 0, 0, 0.83334],
    38: [0, 0.69444, 0, 0, 0.75834],
    39: [0, 0.69444, 0, 0, 0.27778],
    40: [0.25, 0.75, 0, 0, 0.38889],
    41: [0.25, 0.75, 0, 0, 0.38889],
    42: [0, 0.75, 0, 0, 0.5],
    43: [0.08333, 0.58333, 0, 0, 0.77778],
    44: [0.125, 0.08333, 0, 0, 0.27778],
    45: [0, 0.44444, 0, 0, 0.33333],
    46: [0, 0.08333, 0, 0, 0.27778],
    47: [0.25, 0.75, 0, 0, 0.5],
    48: [0, 0.65556, 0, 0, 0.5],
    49: [0, 0.65556, 0, 0, 0.5],
    50: [0, 0.65556, 0, 0, 0.5],
    51: [0, 0.65556, 0, 0, 0.5],
    52: [0, 0.65556, 0, 0, 0.5],
    53: [0, 0.65556, 0, 0, 0.5],
    54: [0, 0.65556, 0, 0, 0.5],
    55: [0, 0.65556, 0, 0, 0.5],
    56: [0, 0.65556, 0, 0, 0.5],
    57: [0, 0.65556, 0, 0, 0.5],
    58: [0, 0.44444, 0, 0, 0.27778],
    59: [0.125, 0.44444, 0, 0, 0.27778],
    61: [-0.13, 0.37, 0, 0, 0.77778],
    63: [0, 0.69444, 0, 0, 0.47222],
    64: [0, 0.69444, 0, 0, 0.66667],
    65: [0, 0.69444, 0, 0, 0.66667],
    66: [0, 0.69444, 0, 0, 0.66667],
    67: [0, 0.69444, 0, 0, 0.63889],
    68: [0, 0.69444, 0, 0, 0.72223],
    69: [0, 0.69444, 0, 0, 0.59722],
    70: [0, 0.69444, 0, 0, 0.56945],
    71: [0, 0.69444, 0, 0, 0.66667],
    72: [0, 0.69444, 0, 0, 0.70834],
    73: [0, 0.69444, 0, 0, 0.27778],
    74: [0, 0.69444, 0, 0, 0.47222],
    75: [0, 0.69444, 0, 0, 0.69445],
    76: [0, 0.69444, 0, 0, 0.54167],
    77: [0, 0.69444, 0, 0, 0.875],
    78: [0, 0.69444, 0, 0, 0.70834],
    79: [0, 0.69444, 0, 0, 0.73611],
    80: [0, 0.69444, 0, 0, 0.63889],
    81: [0.125, 0.69444, 0, 0, 0.73611],
    82: [0, 0.69444, 0, 0, 0.64584],
    83: [0, 0.69444, 0, 0, 0.55556],
    84: [0, 0.69444, 0, 0, 0.68056],
    85: [0, 0.69444, 0, 0, 0.6875],
    86: [0, 0.69444, 0.01389, 0, 0.66667],
    87: [0, 0.69444, 0.01389, 0, 0.94445],
    88: [0, 0.69444, 0, 0, 0.66667],
    89: [0, 0.69444, 0.025, 0, 0.66667],
    90: [0, 0.69444, 0, 0, 0.61111],
    91: [0.25, 0.75, 0, 0, 0.28889],
    93: [0.25, 0.75, 0, 0, 0.28889],
    94: [0, 0.69444, 0, 0, 0.5],
    95: [0.35, 0.09444, 0.02778, 0, 0.5],
    97: [0, 0.44444, 0, 0, 0.48056],
    98: [0, 0.69444, 0, 0, 0.51667],
    99: [0, 0.44444, 0, 0, 0.44445],
    100: [0, 0.69444, 0, 0, 0.51667],
    101: [0, 0.44444, 0, 0, 0.44445],
    102: [0, 0.69444, 0.06944, 0, 0.30556],
    103: [0.19444, 0.44444, 0.01389, 0, 0.5],
    104: [0, 0.69444, 0, 0, 0.51667],
    105: [0, 0.67937, 0, 0, 0.23889],
    106: [0.19444, 0.67937, 0, 0, 0.26667],
    107: [0, 0.69444, 0, 0, 0.48889],
    108: [0, 0.69444, 0, 0, 0.23889],
    109: [0, 0.44444, 0, 0, 0.79445],
    110: [0, 0.44444, 0, 0, 0.51667],
    111: [0, 0.44444, 0, 0, 0.5],
    112: [0.19444, 0.44444, 0, 0, 0.51667],
    113: [0.19444, 0.44444, 0, 0, 0.51667],
    114: [0, 0.44444, 0.01389, 0, 0.34167],
    115: [0, 0.44444, 0, 0, 0.38333],
    116: [0, 0.57143, 0, 0, 0.36111],
    117: [0, 0.44444, 0, 0, 0.51667],
    118: [0, 0.44444, 0.01389, 0, 0.46111],
    119: [0, 0.44444, 0.01389, 0, 0.68334],
    120: [0, 0.44444, 0, 0, 0.46111],
    121: [0.19444, 0.44444, 0.01389, 0, 0.46111],
    122: [0, 0.44444, 0, 0, 0.43472],
    126: [0.35, 0.32659, 0, 0, 0.5],
    160: [0, 0, 0, 0, 0.25],
    168: [0, 0.67937, 0, 0, 0.5],
    176: [0, 0.69444, 0, 0, 0.66667],
    184: [0.17014, 0, 0, 0, 0.44445],
    305: [0, 0.44444, 0, 0, 0.23889],
    567: [0.19444, 0.44444, 0, 0, 0.26667],
    710: [0, 0.69444, 0, 0, 0.5],
    711: [0, 0.63194, 0, 0, 0.5],
    713: [0, 0.60889, 0, 0, 0.5],
    714: [0, 0.69444, 0, 0, 0.5],
    715: [0, 0.69444, 0, 0, 0.5],
    728: [0, 0.69444, 0, 0, 0.5],
    729: [0, 0.67937, 0, 0, 0.27778],
    730: [0, 0.69444, 0, 0, 0.66667],
    732: [0, 0.67659, 0, 0, 0.5],
    733: [0, 0.69444, 0, 0, 0.5],
    915: [0, 0.69444, 0, 0, 0.54167],
    916: [0, 0.69444, 0, 0, 0.83334],
    920: [0, 0.69444, 0, 0, 0.77778],
    923: [0, 0.69444, 0, 0, 0.61111],
    926: [0, 0.69444, 0, 0, 0.66667],
    928: [0, 0.69444, 0, 0, 0.70834],
    931: [0, 0.69444, 0, 0, 0.72222],
    933: [0, 0.69444, 0, 0, 0.77778],
    934: [0, 0.69444, 0, 0, 0.72222],
    936: [0, 0.69444, 0, 0, 0.77778],
    937: [0, 0.69444, 0, 0, 0.72222],
    8211: [0, 0.44444, 0.02778, 0, 0.5],
    8212: [0, 0.44444, 0.02778, 0, 1],
    8216: [0, 0.69444, 0, 0, 0.27778],
    8217: [0, 0.69444, 0, 0, 0.27778],
    8220: [0, 0.69444, 0, 0, 0.5],
    8221: [0, 0.69444, 0, 0, 0.5]
  },
  "Script-Regular": {
    32: [0, 0, 0, 0, 0.25],
    65: [0, 0.7, 0.22925, 0, 0.80253],
    66: [0, 0.7, 0.04087, 0, 0.90757],
    67: [0, 0.7, 0.1689, 0, 0.66619],
    68: [0, 0.7, 0.09371, 0, 0.77443],
    69: [0, 0.7, 0.18583, 0, 0.56162],
    70: [0, 0.7, 0.13634, 0, 0.89544],
    71: [0, 0.7, 0.17322, 0, 0.60961],
    72: [0, 0.7, 0.29694, 0, 0.96919],
    73: [0, 0.7, 0.19189, 0, 0.80907],
    74: [0.27778, 0.7, 0.19189, 0, 1.05159],
    75: [0, 0.7, 0.31259, 0, 0.91364],
    76: [0, 0.7, 0.19189, 0, 0.87373],
    77: [0, 0.7, 0.15981, 0, 1.08031],
    78: [0, 0.7, 0.3525, 0, 0.9015],
    79: [0, 0.7, 0.08078, 0, 0.73787],
    80: [0, 0.7, 0.08078, 0, 1.01262],
    81: [0, 0.7, 0.03305, 0, 0.88282],
    82: [0, 0.7, 0.06259, 0, 0.85],
    83: [0, 0.7, 0.19189, 0, 0.86767],
    84: [0, 0.7, 0.29087, 0, 0.74697],
    85: [0, 0.7, 0.25815, 0, 0.79996],
    86: [0, 0.7, 0.27523, 0, 0.62204],
    87: [0, 0.7, 0.27523, 0, 0.80532],
    88: [0, 0.7, 0.26006, 0, 0.94445],
    89: [0, 0.7, 0.2939, 0, 0.70961],
    90: [0, 0.7, 0.24037, 0, 0.8212],
    160: [0, 0, 0, 0, 0.25]
  },
  "Size1-Regular": {
    32: [0, 0, 0, 0, 0.25],
    40: [0.35001, 0.85, 0, 0, 0.45834],
    41: [0.35001, 0.85, 0, 0, 0.45834],
    47: [0.35001, 0.85, 0, 0, 0.57778],
    91: [0.35001, 0.85, 0, 0, 0.41667],
    92: [0.35001, 0.85, 0, 0, 0.57778],
    93: [0.35001, 0.85, 0, 0, 0.41667],
    123: [0.35001, 0.85, 0, 0, 0.58334],
    125: [0.35001, 0.85, 0, 0, 0.58334],
    160: [0, 0, 0, 0, 0.25],
    710: [0, 0.72222, 0, 0, 0.55556],
    732: [0, 0.72222, 0, 0, 0.55556],
    770: [0, 0.72222, 0, 0, 0.55556],
    771: [0, 0.72222, 0, 0, 0.55556],
    8214: [-99e-5, 0.601, 0, 0, 0.77778],
    8593: [1e-5, 0.6, 0, 0, 0.66667],
    8595: [1e-5, 0.6, 0, 0, 0.66667],
    8657: [1e-5, 0.6, 0, 0, 0.77778],
    8659: [1e-5, 0.6, 0, 0, 0.77778],
    8719: [0.25001, 0.75, 0, 0, 0.94445],
    8720: [0.25001, 0.75, 0, 0, 0.94445],
    8721: [0.25001, 0.75, 0, 0, 1.05556],
    8730: [0.35001, 0.85, 0, 0, 1],
    8739: [-599e-5, 0.606, 0, 0, 0.33333],
    8741: [-599e-5, 0.606, 0, 0, 0.55556],
    8747: [0.30612, 0.805, 0.19445, 0, 0.47222],
    8748: [0.306, 0.805, 0.19445, 0, 0.47222],
    8749: [0.306, 0.805, 0.19445, 0, 0.47222],
    8750: [0.30612, 0.805, 0.19445, 0, 0.47222],
    8896: [0.25001, 0.75, 0, 0, 0.83334],
    8897: [0.25001, 0.75, 0, 0, 0.83334],
    8898: [0.25001, 0.75, 0, 0, 0.83334],
    8899: [0.25001, 0.75, 0, 0, 0.83334],
    8968: [0.35001, 0.85, 0, 0, 0.47222],
    8969: [0.35001, 0.85, 0, 0, 0.47222],
    8970: [0.35001, 0.85, 0, 0, 0.47222],
    8971: [0.35001, 0.85, 0, 0, 0.47222],
    9168: [-99e-5, 0.601, 0, 0, 0.66667],
    10216: [0.35001, 0.85, 0, 0, 0.47222],
    10217: [0.35001, 0.85, 0, 0, 0.47222],
    10752: [0.25001, 0.75, 0, 0, 1.11111],
    10753: [0.25001, 0.75, 0, 0, 1.11111],
    10754: [0.25001, 0.75, 0, 0, 1.11111],
    10756: [0.25001, 0.75, 0, 0, 0.83334],
    10758: [0.25001, 0.75, 0, 0, 0.83334]
  },
  "Size2-Regular": {
    32: [0, 0, 0, 0, 0.25],
    40: [0.65002, 1.15, 0, 0, 0.59722],
    41: [0.65002, 1.15, 0, 0, 0.59722],
    47: [0.65002, 1.15, 0, 0, 0.81111],
    91: [0.65002, 1.15, 0, 0, 0.47222],
    92: [0.65002, 1.15, 0, 0, 0.81111],
    93: [0.65002, 1.15, 0, 0, 0.47222],
    123: [0.65002, 1.15, 0, 0, 0.66667],
    125: [0.65002, 1.15, 0, 0, 0.66667],
    160: [0, 0, 0, 0, 0.25],
    710: [0, 0.75, 0, 0, 1],
    732: [0, 0.75, 0, 0, 1],
    770: [0, 0.75, 0, 0, 1],
    771: [0, 0.75, 0, 0, 1],
    8719: [0.55001, 1.05, 0, 0, 1.27778],
    8720: [0.55001, 1.05, 0, 0, 1.27778],
    8721: [0.55001, 1.05, 0, 0, 1.44445],
    8730: [0.65002, 1.15, 0, 0, 1],
    8747: [0.86225, 1.36, 0.44445, 0, 0.55556],
    8748: [0.862, 1.36, 0.44445, 0, 0.55556],
    8749: [0.862, 1.36, 0.44445, 0, 0.55556],
    8750: [0.86225, 1.36, 0.44445, 0, 0.55556],
    8896: [0.55001, 1.05, 0, 0, 1.11111],
    8897: [0.55001, 1.05, 0, 0, 1.11111],
    8898: [0.55001, 1.05, 0, 0, 1.11111],
    8899: [0.55001, 1.05, 0, 0, 1.11111],
    8968: [0.65002, 1.15, 0, 0, 0.52778],
    8969: [0.65002, 1.15, 0, 0, 0.52778],
    8970: [0.65002, 1.15, 0, 0, 0.52778],
    8971: [0.65002, 1.15, 0, 0, 0.52778],
    10216: [0.65002, 1.15, 0, 0, 0.61111],
    10217: [0.65002, 1.15, 0, 0, 0.61111],
    10752: [0.55001, 1.05, 0, 0, 1.51112],
    10753: [0.55001, 1.05, 0, 0, 1.51112],
    10754: [0.55001, 1.05, 0, 0, 1.51112],
    10756: [0.55001, 1.05, 0, 0, 1.11111],
    10758: [0.55001, 1.05, 0, 0, 1.11111]
  },
  "Size3-Regular": {
    32: [0, 0, 0, 0, 0.25],
    40: [0.95003, 1.45, 0, 0, 0.73611],
    41: [0.95003, 1.45, 0, 0, 0.73611],
    47: [0.95003, 1.45, 0, 0, 1.04445],
    91: [0.95003, 1.45, 0, 0, 0.52778],
    92: [0.95003, 1.45, 0, 0, 1.04445],
    93: [0.95003, 1.45, 0, 0, 0.52778],
    123: [0.95003, 1.45, 0, 0, 0.75],
    125: [0.95003, 1.45, 0, 0, 0.75],
    160: [0, 0, 0, 0, 0.25],
    710: [0, 0.75, 0, 0, 1.44445],
    732: [0, 0.75, 0, 0, 1.44445],
    770: [0, 0.75, 0, 0, 1.44445],
    771: [0, 0.75, 0, 0, 1.44445],
    8730: [0.95003, 1.45, 0, 0, 1],
    8968: [0.95003, 1.45, 0, 0, 0.58334],
    8969: [0.95003, 1.45, 0, 0, 0.58334],
    8970: [0.95003, 1.45, 0, 0, 0.58334],
    8971: [0.95003, 1.45, 0, 0, 0.58334],
    10216: [0.95003, 1.45, 0, 0, 0.75],
    10217: [0.95003, 1.45, 0, 0, 0.75]
  },
  "Size4-Regular": {
    32: [0, 0, 0, 0, 0.25],
    40: [1.25003, 1.75, 0, 0, 0.79167],
    41: [1.25003, 1.75, 0, 0, 0.79167],
    47: [1.25003, 1.75, 0, 0, 1.27778],
    91: [1.25003, 1.75, 0, 0, 0.58334],
    92: [1.25003, 1.75, 0, 0, 1.27778],
    93: [1.25003, 1.75, 0, 0, 0.58334],
    123: [1.25003, 1.75, 0, 0, 0.80556],
    125: [1.25003, 1.75, 0, 0, 0.80556],
    160: [0, 0, 0, 0, 0.25],
    710: [0, 0.825, 0, 0, 1.8889],
    732: [0, 0.825, 0, 0, 1.8889],
    770: [0, 0.825, 0, 0, 1.8889],
    771: [0, 0.825, 0, 0, 1.8889],
    8730: [1.25003, 1.75, 0, 0, 1],
    8968: [1.25003, 1.75, 0, 0, 0.63889],
    8969: [1.25003, 1.75, 0, 0, 0.63889],
    8970: [1.25003, 1.75, 0, 0, 0.63889],
    8971: [1.25003, 1.75, 0, 0, 0.63889],
    9115: [0.64502, 1.155, 0, 0, 0.875],
    9116: [1e-5, 0.6, 0, 0, 0.875],
    9117: [0.64502, 1.155, 0, 0, 0.875],
    9118: [0.64502, 1.155, 0, 0, 0.875],
    9119: [1e-5, 0.6, 0, 0, 0.875],
    9120: [0.64502, 1.155, 0, 0, 0.875],
    9121: [0.64502, 1.155, 0, 0, 0.66667],
    9122: [-99e-5, 0.601, 0, 0, 0.66667],
    9123: [0.64502, 1.155, 0, 0, 0.66667],
    9124: [0.64502, 1.155, 0, 0, 0.66667],
    9125: [-99e-5, 0.601, 0, 0, 0.66667],
    9126: [0.64502, 1.155, 0, 0, 0.66667],
    9127: [1e-5, 0.9, 0, 0, 0.88889],
    9128: [0.65002, 1.15, 0, 0, 0.88889],
    9129: [0.90001, 0, 0, 0, 0.88889],
    9130: [0, 0.3, 0, 0, 0.88889],
    9131: [1e-5, 0.9, 0, 0, 0.88889],
    9132: [0.65002, 1.15, 0, 0, 0.88889],
    9133: [0.90001, 0, 0, 0, 0.88889],
    9143: [0.88502, 0.915, 0, 0, 1.05556],
    10216: [1.25003, 1.75, 0, 0, 0.80556],
    10217: [1.25003, 1.75, 0, 0, 0.80556],
    57344: [-499e-5, 0.605, 0, 0, 1.05556],
    57345: [-499e-5, 0.605, 0, 0, 1.05556],
    57680: [0, 0.12, 0, 0, 0.45],
    57681: [0, 0.12, 0, 0, 0.45],
    57682: [0, 0.12, 0, 0, 0.45],
    57683: [0, 0.12, 0, 0, 0.45]
  },
  "Typewriter-Regular": {
    32: [0, 0, 0, 0, 0.525],
    33: [0, 0.61111, 0, 0, 0.525],
    34: [0, 0.61111, 0, 0, 0.525],
    35: [0, 0.61111, 0, 0, 0.525],
    36: [0.08333, 0.69444, 0, 0, 0.525],
    37: [0.08333, 0.69444, 0, 0, 0.525],
    38: [0, 0.61111, 0, 0, 0.525],
    39: [0, 0.61111, 0, 0, 0.525],
    40: [0.08333, 0.69444, 0, 0, 0.525],
    41: [0.08333, 0.69444, 0, 0, 0.525],
    42: [0, 0.52083, 0, 0, 0.525],
    43: [-0.08056, 0.53055, 0, 0, 0.525],
    44: [0.13889, 0.125, 0, 0, 0.525],
    45: [-0.08056, 0.53055, 0, 0, 0.525],
    46: [0, 0.125, 0, 0, 0.525],
    47: [0.08333, 0.69444, 0, 0, 0.525],
    48: [0, 0.61111, 0, 0, 0.525],
    49: [0, 0.61111, 0, 0, 0.525],
    50: [0, 0.61111, 0, 0, 0.525],
    51: [0, 0.61111, 0, 0, 0.525],
    52: [0, 0.61111, 0, 0, 0.525],
    53: [0, 0.61111, 0, 0, 0.525],
    54: [0, 0.61111, 0, 0, 0.525],
    55: [0, 0.61111, 0, 0, 0.525],
    56: [0, 0.61111, 0, 0, 0.525],
    57: [0, 0.61111, 0, 0, 0.525],
    58: [0, 0.43056, 0, 0, 0.525],
    59: [0.13889, 0.43056, 0, 0, 0.525],
    60: [-0.05556, 0.55556, 0, 0, 0.525],
    61: [-0.19549, 0.41562, 0, 0, 0.525],
    62: [-0.05556, 0.55556, 0, 0, 0.525],
    63: [0, 0.61111, 0, 0, 0.525],
    64: [0, 0.61111, 0, 0, 0.525],
    65: [0, 0.61111, 0, 0, 0.525],
    66: [0, 0.61111, 0, 0, 0.525],
    67: [0, 0.61111, 0, 0, 0.525],
    68: [0, 0.61111, 0, 0, 0.525],
    69: [0, 0.61111, 0, 0, 0.525],
    70: [0, 0.61111, 0, 0, 0.525],
    71: [0, 0.61111, 0, 0, 0.525],
    72: [0, 0.61111, 0, 0, 0.525],
    73: [0, 0.61111, 0, 0, 0.525],
    74: [0, 0.61111, 0, 0, 0.525],
    75: [0, 0.61111, 0, 0, 0.525],
    76: [0, 0.61111, 0, 0, 0.525],
    77: [0, 0.61111, 0, 0, 0.525],
    78: [0, 0.61111, 0, 0, 0.525],
    79: [0, 0.61111, 0, 0, 0.525],
    80: [0, 0.61111, 0, 0, 0.525],
    81: [0.13889, 0.61111, 0, 0, 0.525],
    82: [0, 0.61111, 0, 0, 0.525],
    83: [0, 0.61111, 0, 0, 0.525],
    84: [0, 0.61111, 0, 0, 0.525],
    85: [0, 0.61111, 0, 0, 0.525],
    86: [0, 0.61111, 0, 0, 0.525],
    87: [0, 0.61111, 0, 0, 0.525],
    88: [0, 0.61111, 0, 0, 0.525],
    89: [0, 0.61111, 0, 0, 0.525],
    90: [0, 0.61111, 0, 0, 0.525],
    91: [0.08333, 0.69444, 0, 0, 0.525],
    92: [0.08333, 0.69444, 0, 0, 0.525],
    93: [0.08333, 0.69444, 0, 0, 0.525],
    94: [0, 0.61111, 0, 0, 0.525],
    95: [0.09514, 0, 0, 0, 0.525],
    96: [0, 0.61111, 0, 0, 0.525],
    97: [0, 0.43056, 0, 0, 0.525],
    98: [0, 0.61111, 0, 0, 0.525],
    99: [0, 0.43056, 0, 0, 0.525],
    100: [0, 0.61111, 0, 0, 0.525],
    101: [0, 0.43056, 0, 0, 0.525],
    102: [0, 0.61111, 0, 0, 0.525],
    103: [0.22222, 0.43056, 0, 0, 0.525],
    104: [0, 0.61111, 0, 0, 0.525],
    105: [0, 0.61111, 0, 0, 0.525],
    106: [0.22222, 0.61111, 0, 0, 0.525],
    107: [0, 0.61111, 0, 0, 0.525],
    108: [0, 0.61111, 0, 0, 0.525],
    109: [0, 0.43056, 0, 0, 0.525],
    110: [0, 0.43056, 0, 0, 0.525],
    111: [0, 0.43056, 0, 0, 0.525],
    112: [0.22222, 0.43056, 0, 0, 0.525],
    113: [0.22222, 0.43056, 0, 0, 0.525],
    114: [0, 0.43056, 0, 0, 0.525],
    115: [0, 0.43056, 0, 0, 0.525],
    116: [0, 0.55358, 0, 0, 0.525],
    117: [0, 0.43056, 0, 0, 0.525],
    118: [0, 0.43056, 0, 0, 0.525],
    119: [0, 0.43056, 0, 0, 0.525],
    120: [0, 0.43056, 0, 0, 0.525],
    121: [0.22222, 0.43056, 0, 0, 0.525],
    122: [0, 0.43056, 0, 0, 0.525],
    123: [0.08333, 0.69444, 0, 0, 0.525],
    124: [0.08333, 0.69444, 0, 0, 0.525],
    125: [0.08333, 0.69444, 0, 0, 0.525],
    126: [0, 0.61111, 0, 0, 0.525],
    127: [0, 0.61111, 0, 0, 0.525],
    160: [0, 0, 0, 0, 0.525],
    176: [0, 0.61111, 0, 0, 0.525],
    184: [0.19445, 0, 0, 0, 0.525],
    305: [0, 0.43056, 0, 0, 0.525],
    567: [0.22222, 0.43056, 0, 0, 0.525],
    711: [0, 0.56597, 0, 0, 0.525],
    713: [0, 0.56555, 0, 0, 0.525],
    714: [0, 0.61111, 0, 0, 0.525],
    715: [0, 0.61111, 0, 0, 0.525],
    728: [0, 0.61111, 0, 0, 0.525],
    730: [0, 0.61111, 0, 0, 0.525],
    770: [0, 0.61111, 0, 0, 0.525],
    771: [0, 0.61111, 0, 0, 0.525],
    776: [0, 0.61111, 0, 0, 0.525],
    915: [0, 0.61111, 0, 0, 0.525],
    916: [0, 0.61111, 0, 0, 0.525],
    920: [0, 0.61111, 0, 0, 0.525],
    923: [0, 0.61111, 0, 0, 0.525],
    926: [0, 0.61111, 0, 0, 0.525],
    928: [0, 0.61111, 0, 0, 0.525],
    931: [0, 0.61111, 0, 0, 0.525],
    933: [0, 0.61111, 0, 0, 0.525],
    934: [0, 0.61111, 0, 0, 0.525],
    936: [0, 0.61111, 0, 0, 0.525],
    937: [0, 0.61111, 0, 0, 0.525],
    8216: [0, 0.61111, 0, 0, 0.525],
    8217: [0, 0.61111, 0, 0, 0.525],
    8242: [0, 0.61111, 0, 0, 0.525],
    9251: [0.11111, 0.21944, 0, 0, 0.525]
  }
}, lr = {
  slant: [0.25, 0.25, 0.25],
  // sigma1
  space: [0, 0, 0],
  // sigma2
  stretch: [0, 0, 0],
  // sigma3
  shrink: [0, 0, 0],
  // sigma4
  xHeight: [0.431, 0.431, 0.431],
  // sigma5
  quad: [1, 1.171, 1.472],
  // sigma6
  extraSpace: [0, 0, 0],
  // sigma7
  num1: [0.677, 0.732, 0.925],
  // sigma8
  num2: [0.394, 0.384, 0.387],
  // sigma9
  num3: [0.444, 0.471, 0.504],
  // sigma10
  denom1: [0.686, 0.752, 1.025],
  // sigma11
  denom2: [0.345, 0.344, 0.532],
  // sigma12
  sup1: [0.413, 0.503, 0.504],
  // sigma13
  sup2: [0.363, 0.431, 0.404],
  // sigma14
  sup3: [0.289, 0.286, 0.294],
  // sigma15
  sub1: [0.15, 0.143, 0.2],
  // sigma16
  sub2: [0.247, 0.286, 0.4],
  // sigma17
  supDrop: [0.386, 0.353, 0.494],
  // sigma18
  subDrop: [0.05, 0.071, 0.1],
  // sigma19
  delim1: [2.39, 1.7, 1.98],
  // sigma20
  delim2: [1.01, 1.157, 1.42],
  // sigma21
  axisHeight: [0.25, 0.25, 0.25],
  // sigma22
  // These font metrics are extracted from TeX by using tftopl on cmex10.tfm;
  // they correspond to the font parameters of the extension fonts (family 3).
  // See the TeXbook, page 441. In AMSTeX, the extension fonts scale; to
  // match cmex7, we'd use cmex7.tfm values for script and scriptscript
  // values.
  defaultRuleThickness: [0.04, 0.049, 0.049],
  // xi8; cmex7: 0.049
  bigOpSpacing1: [0.111, 0.111, 0.111],
  // xi9
  bigOpSpacing2: [0.166, 0.166, 0.166],
  // xi10
  bigOpSpacing3: [0.2, 0.2, 0.2],
  // xi11
  bigOpSpacing4: [0.6, 0.611, 0.611],
  // xi12; cmex7: 0.611
  bigOpSpacing5: [0.1, 0.143, 0.143],
  // xi13; cmex7: 0.143
  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.
  sqrtRuleThickness: [0.04, 0.04, 0.04],
  // This value determines how large a pt is, for metrics which are defined
  // in terms of pts.
  // This value is also used in katex.scss; if you change it make sure the
  // values match.
  ptPerEm: [10, 10, 10],
  // The space between adjacent `|` columns in an array definition. From
  // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
  doubleRuleSep: [0.2, 0.2, 0.2],
  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  arrayRuleWidth: [0.04, 0.04, 0.04],
  // Two values from LaTeX source2e:
  fboxsep: [0.3, 0.3, 0.3],
  //        3 pt / ptPerEm
  fboxrule: [0.04, 0.04, 0.04]
  // 0.4 pt / ptPerEm
}, bn = {
  // Latin-1
  Å: "A",
  Ð: "D",
  Þ: "o",
  å: "a",
  ð: "d",
  þ: "o",
  // Cyrillic
  А: "A",
  Б: "B",
  В: "B",
  Г: "F",
  Д: "A",
  Е: "E",
  Ж: "K",
  З: "3",
  И: "N",
  Й: "N",
  К: "K",
  Л: "N",
  М: "M",
  Н: "H",
  О: "O",
  П: "N",
  Р: "P",
  С: "C",
  Т: "T",
  У: "y",
  Ф: "O",
  Х: "X",
  Ц: "U",
  Ч: "h",
  Ш: "W",
  Щ: "W",
  Ъ: "B",
  Ы: "X",
  Ь: "B",
  Э: "3",
  Ю: "X",
  Я: "R",
  а: "a",
  б: "b",
  в: "a",
  г: "r",
  д: "y",
  е: "e",
  ж: "m",
  з: "e",
  и: "n",
  й: "n",
  к: "n",
  л: "n",
  м: "m",
  н: "n",
  о: "o",
  п: "n",
  р: "p",
  с: "c",
  т: "o",
  у: "y",
  ф: "b",
  х: "x",
  ц: "n",
  ч: "n",
  ш: "w",
  щ: "w",
  ъ: "a",
  ы: "m",
  ь: "a",
  э: "e",
  ю: "m",
  я: "r"
};
function ks(r, e) {
  k0[r] = e;
}
function Ha(r, e, t) {
  if (!k0[e])
    throw new Error("Font metrics not found for font: " + e + ".");
  var a = r.charCodeAt(0), n = k0[e][a];
  if (!n && r[0] in bn && (a = bn[r[0]].charCodeAt(0), n = k0[e][a]), !n && t === "text" && oi(a) && (n = k0[e][77]), n)
    return {
      depth: n[0],
      height: n[1],
      italic: n[2],
      skew: n[3],
      width: n[4]
    };
}
var Xr = {};
function Ms(r) {
  var e;
  if (r >= 5 ? e = 0 : r >= 3 ? e = 1 : e = 2, !Xr[e]) {
    var t = Xr[e] = {
      cssEmPerMu: lr.quad[e] / 18
    };
    for (var a in lr)
      lr.hasOwnProperty(a) && (t[a] = lr[a][e]);
  }
  return Xr[e];
}
var Ts = {
  bin: 1,
  close: 1,
  inner: 1,
  open: 1,
  punct: 1,
  rel: 1
}, As = {
  "accent-token": 1,
  mathord: 1,
  "op-token": 1,
  spacing: 1,
  textord: 1
}, be = {
  math: {},
  text: {}
};
function l(r, e, t, a, n, i) {
  be[r][n] = {
    font: e,
    group: t,
    replace: a
  }, i && a && (be[r][a] = be[r][n]);
}
var s = "math", C = "text", c = "main", f = "ams", ye = "accent-token", F = "bin", Ve = "close", Mt = "inner", j = "mathord", Ae = "op-token", a0 = "open", Nt = "punct", g = "rel", H0 = "spacing", y = "textord";
l(s, c, g, "≡", "\\equiv", !0);
l(s, c, g, "≺", "\\prec", !0);
l(s, c, g, "≻", "\\succ", !0);
l(s, c, g, "∼", "\\sim", !0);
l(s, c, g, "⊥", "\\perp");
l(s, c, g, "⪯", "\\preceq", !0);
l(s, c, g, "⪰", "\\succeq", !0);
l(s, c, g, "≃", "\\simeq", !0);
l(s, c, g, "∣", "\\mid", !0);
l(s, c, g, "≪", "\\ll", !0);
l(s, c, g, "≫", "\\gg", !0);
l(s, c, g, "≍", "\\asymp", !0);
l(s, c, g, "∥", "\\parallel");
l(s, c, g, "⋈", "\\bowtie", !0);
l(s, c, g, "⌣", "\\smile", !0);
l(s, c, g, "⊑", "\\sqsubseteq", !0);
l(s, c, g, "⊒", "\\sqsupseteq", !0);
l(s, c, g, "≐", "\\doteq", !0);
l(s, c, g, "⌢", "\\frown", !0);
l(s, c, g, "∋", "\\ni", !0);
l(s, c, g, "∝", "\\propto", !0);
l(s, c, g, "⊢", "\\vdash", !0);
l(s, c, g, "⊣", "\\dashv", !0);
l(s, c, g, "∋", "\\owns");
l(s, c, Nt, ".", "\\ldotp");
l(s, c, Nt, "⋅", "\\cdotp");
l(s, c, Nt, "⋅", "·");
l(C, c, y, "⋅", "·");
l(s, c, y, "#", "\\#");
l(C, c, y, "#", "\\#");
l(s, c, y, "&", "\\&");
l(C, c, y, "&", "\\&");
l(s, c, y, "ℵ", "\\aleph", !0);
l(s, c, y, "∀", "\\forall", !0);
l(s, c, y, "ℏ", "\\hbar", !0);
l(s, c, y, "∃", "\\exists", !0);
l(s, c, y, "∇", "\\nabla", !0);
l(s, c, y, "♭", "\\flat", !0);
l(s, c, y, "ℓ", "\\ell", !0);
l(s, c, y, "♮", "\\natural", !0);
l(s, c, y, "♣", "\\clubsuit", !0);
l(s, c, y, "℘", "\\wp", !0);
l(s, c, y, "♯", "\\sharp", !0);
l(s, c, y, "♢", "\\diamondsuit", !0);
l(s, c, y, "ℜ", "\\Re", !0);
l(s, c, y, "♡", "\\heartsuit", !0);
l(s, c, y, "ℑ", "\\Im", !0);
l(s, c, y, "♠", "\\spadesuit", !0);
l(s, c, y, "§", "\\S", !0);
l(C, c, y, "§", "\\S");
l(s, c, y, "¶", "\\P", !0);
l(C, c, y, "¶", "\\P");
l(s, c, y, "†", "\\dag");
l(C, c, y, "†", "\\dag");
l(C, c, y, "†", "\\textdagger");
l(s, c, y, "‡", "\\ddag");
l(C, c, y, "‡", "\\ddag");
l(C, c, y, "‡", "\\textdaggerdbl");
l(s, c, Ve, "⎱", "\\rmoustache", !0);
l(s, c, a0, "⎰", "\\lmoustache", !0);
l(s, c, Ve, "⟯", "\\rgroup", !0);
l(s, c, a0, "⟮", "\\lgroup", !0);
l(s, c, F, "∓", "\\mp", !0);
l(s, c, F, "⊖", "\\ominus", !0);
l(s, c, F, "⊎", "\\uplus", !0);
l(s, c, F, "⊓", "\\sqcap", !0);
l(s, c, F, "∗", "\\ast");
l(s, c, F, "⊔", "\\sqcup", !0);
l(s, c, F, "◯", "\\bigcirc", !0);
l(s, c, F, "∙", "\\bullet", !0);
l(s, c, F, "‡", "\\ddagger");
l(s, c, F, "≀", "\\wr", !0);
l(s, c, F, "⨿", "\\amalg");
l(s, c, F, "&", "\\And");
l(s, c, g, "⟵", "\\longleftarrow", !0);
l(s, c, g, "⇐", "\\Leftarrow", !0);
l(s, c, g, "⟸", "\\Longleftarrow", !0);
l(s, c, g, "⟶", "\\longrightarrow", !0);
l(s, c, g, "⇒", "\\Rightarrow", !0);
l(s, c, g, "⟹", "\\Longrightarrow", !0);
l(s, c, g, "↔", "\\leftrightarrow", !0);
l(s, c, g, "⟷", "\\longleftrightarrow", !0);
l(s, c, g, "⇔", "\\Leftrightarrow", !0);
l(s, c, g, "⟺", "\\Longleftrightarrow", !0);
l(s, c, g, "↦", "\\mapsto", !0);
l(s, c, g, "⟼", "\\longmapsto", !0);
l(s, c, g, "↗", "\\nearrow", !0);
l(s, c, g, "↩", "\\hookleftarrow", !0);
l(s, c, g, "↪", "\\hookrightarrow", !0);
l(s, c, g, "↘", "\\searrow", !0);
l(s, c, g, "↼", "\\leftharpoonup", !0);
l(s, c, g, "⇀", "\\rightharpoonup", !0);
l(s, c, g, "↙", "\\swarrow", !0);
l(s, c, g, "↽", "\\leftharpoondown", !0);
l(s, c, g, "⇁", "\\rightharpoondown", !0);
l(s, c, g, "↖", "\\nwarrow", !0);
l(s, c, g, "⇌", "\\rightleftharpoons", !0);
l(s, f, g, "≮", "\\nless", !0);
l(s, f, g, "", "\\@nleqslant");
l(s, f, g, "", "\\@nleqq");
l(s, f, g, "⪇", "\\lneq", !0);
l(s, f, g, "≨", "\\lneqq", !0);
l(s, f, g, "", "\\@lvertneqq");
l(s, f, g, "⋦", "\\lnsim", !0);
l(s, f, g, "⪉", "\\lnapprox", !0);
l(s, f, g, "⊀", "\\nprec", !0);
l(s, f, g, "⋠", "\\npreceq", !0);
l(s, f, g, "⋨", "\\precnsim", !0);
l(s, f, g, "⪹", "\\precnapprox", !0);
l(s, f, g, "≁", "\\nsim", !0);
l(s, f, g, "", "\\@nshortmid");
l(s, f, g, "∤", "\\nmid", !0);
l(s, f, g, "⊬", "\\nvdash", !0);
l(s, f, g, "⊭", "\\nvDash", !0);
l(s, f, g, "⋪", "\\ntriangleleft");
l(s, f, g, "⋬", "\\ntrianglelefteq", !0);
l(s, f, g, "⊊", "\\subsetneq", !0);
l(s, f, g, "", "\\@varsubsetneq");
l(s, f, g, "⫋", "\\subsetneqq", !0);
l(s, f, g, "", "\\@varsubsetneqq");
l(s, f, g, "≯", "\\ngtr", !0);
l(s, f, g, "", "\\@ngeqslant");
l(s, f, g, "", "\\@ngeqq");
l(s, f, g, "⪈", "\\gneq", !0);
l(s, f, g, "≩", "\\gneqq", !0);
l(s, f, g, "", "\\@gvertneqq");
l(s, f, g, "⋧", "\\gnsim", !0);
l(s, f, g, "⪊", "\\gnapprox", !0);
l(s, f, g, "⊁", "\\nsucc", !0);
l(s, f, g, "⋡", "\\nsucceq", !0);
l(s, f, g, "⋩", "\\succnsim", !0);
l(s, f, g, "⪺", "\\succnapprox", !0);
l(s, f, g, "≆", "\\ncong", !0);
l(s, f, g, "", "\\@nshortparallel");
l(s, f, g, "∦", "\\nparallel", !0);
l(s, f, g, "⊯", "\\nVDash", !0);
l(s, f, g, "⋫", "\\ntriangleright");
l(s, f, g, "⋭", "\\ntrianglerighteq", !0);
l(s, f, g, "", "\\@nsupseteqq");
l(s, f, g, "⊋", "\\supsetneq", !0);
l(s, f, g, "", "\\@varsupsetneq");
l(s, f, g, "⫌", "\\supsetneqq", !0);
l(s, f, g, "", "\\@varsupsetneqq");
l(s, f, g, "⊮", "\\nVdash", !0);
l(s, f, g, "⪵", "\\precneqq", !0);
l(s, f, g, "⪶", "\\succneqq", !0);
l(s, f, g, "", "\\@nsubseteqq");
l(s, f, F, "⊴", "\\unlhd");
l(s, f, F, "⊵", "\\unrhd");
l(s, f, g, "↚", "\\nleftarrow", !0);
l(s, f, g, "↛", "\\nrightarrow", !0);
l(s, f, g, "⇍", "\\nLeftarrow", !0);
l(s, f, g, "⇏", "\\nRightarrow", !0);
l(s, f, g, "↮", "\\nleftrightarrow", !0);
l(s, f, g, "⇎", "\\nLeftrightarrow", !0);
l(s, f, g, "△", "\\vartriangle");
l(s, f, y, "ℏ", "\\hslash");
l(s, f, y, "▽", "\\triangledown");
l(s, f, y, "◊", "\\lozenge");
l(s, f, y, "Ⓢ", "\\circledS");
l(s, f, y, "®", "\\circledR");
l(C, f, y, "®", "\\circledR");
l(s, f, y, "∡", "\\measuredangle", !0);
l(s, f, y, "∄", "\\nexists");
l(s, f, y, "℧", "\\mho");
l(s, f, y, "Ⅎ", "\\Finv", !0);
l(s, f, y, "⅁", "\\Game", !0);
l(s, f, y, "‵", "\\backprime");
l(s, f, y, "▲", "\\blacktriangle");
l(s, f, y, "▼", "\\blacktriangledown");
l(s, f, y, "■", "\\blacksquare");
l(s, f, y, "⧫", "\\blacklozenge");
l(s, f, y, "★", "\\bigstar");
l(s, f, y, "∢", "\\sphericalangle", !0);
l(s, f, y, "∁", "\\complement", !0);
l(s, f, y, "ð", "\\eth", !0);
l(C, c, y, "ð", "ð");
l(s, f, y, "╱", "\\diagup");
l(s, f, y, "╲", "\\diagdown");
l(s, f, y, "□", "\\square");
l(s, f, y, "□", "\\Box");
l(s, f, y, "◊", "\\Diamond");
l(s, f, y, "¥", "\\yen", !0);
l(C, f, y, "¥", "\\yen", !0);
l(s, f, y, "✓", "\\checkmark", !0);
l(C, f, y, "✓", "\\checkmark");
l(s, f, y, "ℶ", "\\beth", !0);
l(s, f, y, "ℸ", "\\daleth", !0);
l(s, f, y, "ℷ", "\\gimel", !0);
l(s, f, y, "ϝ", "\\digamma", !0);
l(s, f, y, "ϰ", "\\varkappa");
l(s, f, a0, "┌", "\\@ulcorner", !0);
l(s, f, Ve, "┐", "\\@urcorner", !0);
l(s, f, a0, "└", "\\@llcorner", !0);
l(s, f, Ve, "┘", "\\@lrcorner", !0);
l(s, f, g, "≦", "\\leqq", !0);
l(s, f, g, "⩽", "\\leqslant", !0);
l(s, f, g, "⪕", "\\eqslantless", !0);
l(s, f, g, "≲", "\\lesssim", !0);
l(s, f, g, "⪅", "\\lessapprox", !0);
l(s, f, g, "≊", "\\approxeq", !0);
l(s, f, F, "⋖", "\\lessdot");
l(s, f, g, "⋘", "\\lll", !0);
l(s, f, g, "≶", "\\lessgtr", !0);
l(s, f, g, "⋚", "\\lesseqgtr", !0);
l(s, f, g, "⪋", "\\lesseqqgtr", !0);
l(s, f, g, "≑", "\\doteqdot");
l(s, f, g, "≓", "\\risingdotseq", !0);
l(s, f, g, "≒", "\\fallingdotseq", !0);
l(s, f, g, "∽", "\\backsim", !0);
l(s, f, g, "⋍", "\\backsimeq", !0);
l(s, f, g, "⫅", "\\subseteqq", !0);
l(s, f, g, "⋐", "\\Subset", !0);
l(s, f, g, "⊏", "\\sqsubset", !0);
l(s, f, g, "≼", "\\preccurlyeq", !0);
l(s, f, g, "⋞", "\\curlyeqprec", !0);
l(s, f, g, "≾", "\\precsim", !0);
l(s, f, g, "⪷", "\\precapprox", !0);
l(s, f, g, "⊲", "\\vartriangleleft");
l(s, f, g, "⊴", "\\trianglelefteq");
l(s, f, g, "⊨", "\\vDash", !0);
l(s, f, g, "⊪", "\\Vvdash", !0);
l(s, f, g, "⌣", "\\smallsmile");
l(s, f, g, "⌢", "\\smallfrown");
l(s, f, g, "≏", "\\bumpeq", !0);
l(s, f, g, "≎", "\\Bumpeq", !0);
l(s, f, g, "≧", "\\geqq", !0);
l(s, f, g, "⩾", "\\geqslant", !0);
l(s, f, g, "⪖", "\\eqslantgtr", !0);
l(s, f, g, "≳", "\\gtrsim", !0);
l(s, f, g, "⪆", "\\gtrapprox", !0);
l(s, f, F, "⋗", "\\gtrdot");
l(s, f, g, "⋙", "\\ggg", !0);
l(s, f, g, "≷", "\\gtrless", !0);
l(s, f, g, "⋛", "\\gtreqless", !0);
l(s, f, g, "⪌", "\\gtreqqless", !0);
l(s, f, g, "≖", "\\eqcirc", !0);
l(s, f, g, "≗", "\\circeq", !0);
l(s, f, g, "≜", "\\triangleq", !0);
l(s, f, g, "∼", "\\thicksim");
l(s, f, g, "≈", "\\thickapprox");
l(s, f, g, "⫆", "\\supseteqq", !0);
l(s, f, g, "⋑", "\\Supset", !0);
l(s, f, g, "⊐", "\\sqsupset", !0);
l(s, f, g, "≽", "\\succcurlyeq", !0);
l(s, f, g, "⋟", "\\curlyeqsucc", !0);
l(s, f, g, "≿", "\\succsim", !0);
l(s, f, g, "⪸", "\\succapprox", !0);
l(s, f, g, "⊳", "\\vartriangleright");
l(s, f, g, "⊵", "\\trianglerighteq");
l(s, f, g, "⊩", "\\Vdash", !0);
l(s, f, g, "∣", "\\shortmid");
l(s, f, g, "∥", "\\shortparallel");
l(s, f, g, "≬", "\\between", !0);
l(s, f, g, "⋔", "\\pitchfork", !0);
l(s, f, g, "∝", "\\varpropto");
l(s, f, g, "◀", "\\blacktriangleleft");
l(s, f, g, "∴", "\\therefore", !0);
l(s, f, g, "∍", "\\backepsilon");
l(s, f, g, "▶", "\\blacktriangleright");
l(s, f, g, "∵", "\\because", !0);
l(s, f, g, "⋘", "\\llless");
l(s, f, g, "⋙", "\\gggtr");
l(s, f, F, "⊲", "\\lhd");
l(s, f, F, "⊳", "\\rhd");
l(s, f, g, "≂", "\\eqsim", !0);
l(s, c, g, "⋈", "\\Join");
l(s, f, g, "≑", "\\Doteq", !0);
l(s, f, F, "∔", "\\dotplus", !0);
l(s, f, F, "∖", "\\smallsetminus");
l(s, f, F, "⋒", "\\Cap", !0);
l(s, f, F, "⋓", "\\Cup", !0);
l(s, f, F, "⩞", "\\doublebarwedge", !0);
l(s, f, F, "⊟", "\\boxminus", !0);
l(s, f, F, "⊞", "\\boxplus", !0);
l(s, f, F, "⋇", "\\divideontimes", !0);
l(s, f, F, "⋉", "\\ltimes", !0);
l(s, f, F, "⋊", "\\rtimes", !0);
l(s, f, F, "⋋", "\\leftthreetimes", !0);
l(s, f, F, "⋌", "\\rightthreetimes", !0);
l(s, f, F, "⋏", "\\curlywedge", !0);
l(s, f, F, "⋎", "\\curlyvee", !0);
l(s, f, F, "⊝", "\\circleddash", !0);
l(s, f, F, "⊛", "\\circledast", !0);
l(s, f, F, "⋅", "\\centerdot");
l(s, f, F, "⊺", "\\intercal", !0);
l(s, f, F, "⋒", "\\doublecap");
l(s, f, F, "⋓", "\\doublecup");
l(s, f, F, "⊠", "\\boxtimes", !0);
l(s, f, g, "⇢", "\\dashrightarrow", !0);
l(s, f, g, "⇠", "\\dashleftarrow", !0);
l(s, f, g, "⇇", "\\leftleftarrows", !0);
l(s, f, g, "⇆", "\\leftrightarrows", !0);
l(s, f, g, "⇚", "\\Lleftarrow", !0);
l(s, f, g, "↞", "\\twoheadleftarrow", !0);
l(s, f, g, "↢", "\\leftarrowtail", !0);
l(s, f, g, "↫", "\\looparrowleft", !0);
l(s, f, g, "⇋", "\\leftrightharpoons", !0);
l(s, f, g, "↶", "\\curvearrowleft", !0);
l(s, f, g, "↺", "\\circlearrowleft", !0);
l(s, f, g, "↰", "\\Lsh", !0);
l(s, f, g, "⇈", "\\upuparrows", !0);
l(s, f, g, "↿", "\\upharpoonleft", !0);
l(s, f, g, "⇃", "\\downharpoonleft", !0);
l(s, c, g, "⊶", "\\origof", !0);
l(s, c, g, "⊷", "\\imageof", !0);
l(s, f, g, "⊸", "\\multimap", !0);
l(s, f, g, "↭", "\\leftrightsquigarrow", !0);
l(s, f, g, "⇉", "\\rightrightarrows", !0);
l(s, f, g, "⇄", "\\rightleftarrows", !0);
l(s, f, g, "↠", "\\twoheadrightarrow", !0);
l(s, f, g, "↣", "\\rightarrowtail", !0);
l(s, f, g, "↬", "\\looparrowright", !0);
l(s, f, g, "↷", "\\curvearrowright", !0);
l(s, f, g, "↻", "\\circlearrowright", !0);
l(s, f, g, "↱", "\\Rsh", !0);
l(s, f, g, "⇊", "\\downdownarrows", !0);
l(s, f, g, "↾", "\\upharpoonright", !0);
l(s, f, g, "⇂", "\\downharpoonright", !0);
l(s, f, g, "⇝", "\\rightsquigarrow", !0);
l(s, f, g, "⇝", "\\leadsto");
l(s, f, g, "⇛", "\\Rrightarrow", !0);
l(s, f, g, "↾", "\\restriction");
l(s, c, y, "‘", "`");
l(s, c, y, "$", "\\$");
l(C, c, y, "$", "\\$");
l(C, c, y, "$", "\\textdollar");
l(s, c, y, "%", "\\%");
l(C, c, y, "%", "\\%");
l(s, c, y, "_", "\\_");
l(C, c, y, "_", "\\_");
l(C, c, y, "_", "\\textunderscore");
l(s, c, y, "∠", "\\angle", !0);
l(s, c, y, "∞", "\\infty", !0);
l(s, c, y, "′", "\\prime");
l(s, c, y, "△", "\\triangle");
l(s, c, y, "Γ", "\\Gamma", !0);
l(s, c, y, "Δ", "\\Delta", !0);
l(s, c, y, "Θ", "\\Theta", !0);
l(s, c, y, "Λ", "\\Lambda", !0);
l(s, c, y, "Ξ", "\\Xi", !0);
l(s, c, y, "Π", "\\Pi", !0);
l(s, c, y, "Σ", "\\Sigma", !0);
l(s, c, y, "Υ", "\\Upsilon", !0);
l(s, c, y, "Φ", "\\Phi", !0);
l(s, c, y, "Ψ", "\\Psi", !0);
l(s, c, y, "Ω", "\\Omega", !0);
l(s, c, y, "A", "Α");
l(s, c, y, "B", "Β");
l(s, c, y, "E", "Ε");
l(s, c, y, "Z", "Ζ");
l(s, c, y, "H", "Η");
l(s, c, y, "I", "Ι");
l(s, c, y, "K", "Κ");
l(s, c, y, "M", "Μ");
l(s, c, y, "N", "Ν");
l(s, c, y, "O", "Ο");
l(s, c, y, "P", "Ρ");
l(s, c, y, "T", "Τ");
l(s, c, y, "X", "Χ");
l(s, c, y, "¬", "\\neg", !0);
l(s, c, y, "¬", "\\lnot");
l(s, c, y, "⊤", "\\top");
l(s, c, y, "⊥", "\\bot");
l(s, c, y, "∅", "\\emptyset");
l(s, f, y, "∅", "\\varnothing");
l(s, c, j, "α", "\\alpha", !0);
l(s, c, j, "β", "\\beta", !0);
l(s, c, j, "γ", "\\gamma", !0);
l(s, c, j, "δ", "\\delta", !0);
l(s, c, j, "ϵ", "\\epsilon", !0);
l(s, c, j, "ζ", "\\zeta", !0);
l(s, c, j, "η", "\\eta", !0);
l(s, c, j, "θ", "\\theta", !0);
l(s, c, j, "ι", "\\iota", !0);
l(s, c, j, "κ", "\\kappa", !0);
l(s, c, j, "λ", "\\lambda", !0);
l(s, c, j, "μ", "\\mu", !0);
l(s, c, j, "ν", "\\nu", !0);
l(s, c, j, "ξ", "\\xi", !0);
l(s, c, j, "ο", "\\omicron", !0);
l(s, c, j, "π", "\\pi", !0);
l(s, c, j, "ρ", "\\rho", !0);
l(s, c, j, "σ", "\\sigma", !0);
l(s, c, j, "τ", "\\tau", !0);
l(s, c, j, "υ", "\\upsilon", !0);
l(s, c, j, "ϕ", "\\phi", !0);
l(s, c, j, "χ", "\\chi", !0);
l(s, c, j, "ψ", "\\psi", !0);
l(s, c, j, "ω", "\\omega", !0);
l(s, c, j, "ε", "\\varepsilon", !0);
l(s, c, j, "ϑ", "\\vartheta", !0);
l(s, c, j, "ϖ", "\\varpi", !0);
l(s, c, j, "ϱ", "\\varrho", !0);
l(s, c, j, "ς", "\\varsigma", !0);
l(s, c, j, "φ", "\\varphi", !0);
l(s, c, F, "∗", "*", !0);
l(s, c, F, "+", "+");
l(s, c, F, "−", "-", !0);
l(s, c, F, "⋅", "\\cdot", !0);
l(s, c, F, "∘", "\\circ", !0);
l(s, c, F, "÷", "\\div", !0);
l(s, c, F, "±", "\\pm", !0);
l(s, c, F, "×", "\\times", !0);
l(s, c, F, "∩", "\\cap", !0);
l(s, c, F, "∪", "\\cup", !0);
l(s, c, F, "∖", "\\setminus", !0);
l(s, c, F, "∧", "\\land");
l(s, c, F, "∨", "\\lor");
l(s, c, F, "∧", "\\wedge", !0);
l(s, c, F, "∨", "\\vee", !0);
l(s, c, y, "√", "\\surd");
l(s, c, a0, "⟨", "\\langle", !0);
l(s, c, a0, "∣", "\\lvert");
l(s, c, a0, "∥", "\\lVert");
l(s, c, Ve, "?", "?");
l(s, c, Ve, "!", "!");
l(s, c, Ve, "⟩", "\\rangle", !0);
l(s, c, Ve, "∣", "\\rvert");
l(s, c, Ve, "∥", "\\rVert");
l(s, c, g, "=", "=");
l(s, c, g, ":", ":");
l(s, c, g, "≈", "\\approx", !0);
l(s, c, g, "≅", "\\cong", !0);
l(s, c, g, "≥", "\\ge");
l(s, c, g, "≥", "\\geq", !0);
l(s, c, g, "←", "\\gets");
l(s, c, g, ">", "\\gt", !0);
l(s, c, g, "∈", "\\in", !0);
l(s, c, g, "", "\\@not");
l(s, c, g, "⊂", "\\subset", !0);
l(s, c, g, "⊃", "\\supset", !0);
l(s, c, g, "⊆", "\\subseteq", !0);
l(s, c, g, "⊇", "\\supseteq", !0);
l(s, f, g, "⊈", "\\nsubseteq", !0);
l(s, f, g, "⊉", "\\nsupseteq", !0);
l(s, c, g, "⊨", "\\models");
l(s, c, g, "←", "\\leftarrow", !0);
l(s, c, g, "≤", "\\le");
l(s, c, g, "≤", "\\leq", !0);
l(s, c, g, "<", "\\lt", !0);
l(s, c, g, "→", "\\rightarrow", !0);
l(s, c, g, "→", "\\to");
l(s, f, g, "≱", "\\ngeq", !0);
l(s, f, g, "≰", "\\nleq", !0);
l(s, c, H0, " ", "\\ ");
l(s, c, H0, " ", "\\space");
l(s, c, H0, " ", "\\nobreakspace");
l(C, c, H0, " ", "\\ ");
l(C, c, H0, " ", " ");
l(C, c, H0, " ", "\\space");
l(C, c, H0, " ", "\\nobreakspace");
l(s, c, H0, null, "\\nobreak");
l(s, c, H0, null, "\\allowbreak");
l(s, c, Nt, ",", ",");
l(s, c, Nt, ";", ";");
l(s, f, F, "⊼", "\\barwedge", !0);
l(s, f, F, "⊻", "\\veebar", !0);
l(s, c, F, "⊙", "\\odot", !0);
l(s, c, F, "⊕", "\\oplus", !0);
l(s, c, F, "⊗", "\\otimes", !0);
l(s, c, y, "∂", "\\partial", !0);
l(s, c, F, "⊘", "\\oslash", !0);
l(s, f, F, "⊚", "\\circledcirc", !0);
l(s, f, F, "⊡", "\\boxdot", !0);
l(s, c, F, "△", "\\bigtriangleup");
l(s, c, F, "▽", "\\bigtriangledown");
l(s, c, F, "†", "\\dagger");
l(s, c, F, "⋄", "\\diamond");
l(s, c, F, "⋆", "\\star");
l(s, c, F, "◃", "\\triangleleft");
l(s, c, F, "▹", "\\triangleright");
l(s, c, a0, "{", "\\{");
l(C, c, y, "{", "\\{");
l(C, c, y, "{", "\\textbraceleft");
l(s, c, Ve, "}", "\\}");
l(C, c, y, "}", "\\}");
l(C, c, y, "}", "\\textbraceright");
l(s, c, a0, "{", "\\lbrace");
l(s, c, Ve, "}", "\\rbrace");
l(s, c, a0, "[", "\\lbrack", !0);
l(C, c, y, "[", "\\lbrack", !0);
l(s, c, Ve, "]", "\\rbrack", !0);
l(C, c, y, "]", "\\rbrack", !0);
l(s, c, a0, "(", "\\lparen", !0);
l(s, c, Ve, ")", "\\rparen", !0);
l(C, c, y, "<", "\\textless", !0);
l(C, c, y, ">", "\\textgreater", !0);
l(s, c, a0, "⌊", "\\lfloor", !0);
l(s, c, Ve, "⌋", "\\rfloor", !0);
l(s, c, a0, "⌈", "\\lceil", !0);
l(s, c, Ve, "⌉", "\\rceil", !0);
l(s, c, y, "\\", "\\backslash");
l(s, c, y, "∣", "|");
l(s, c, y, "∣", "\\vert");
l(C, c, y, "|", "\\textbar", !0);
l(s, c, y, "∥", "\\|");
l(s, c, y, "∥", "\\Vert");
l(C, c, y, "∥", "\\textbardbl");
l(C, c, y, "~", "\\textasciitilde");
l(C, c, y, "\\", "\\textbackslash");
l(C, c, y, "^", "\\textasciicircum");
l(s, c, g, "↑", "\\uparrow", !0);
l(s, c, g, "⇑", "\\Uparrow", !0);
l(s, c, g, "↓", "\\downarrow", !0);
l(s, c, g, "⇓", "\\Downarrow", !0);
l(s, c, g, "↕", "\\updownarrow", !0);
l(s, c, g, "⇕", "\\Updownarrow", !0);
l(s, c, Ae, "∐", "\\coprod");
l(s, c, Ae, "⋁", "\\bigvee");
l(s, c, Ae, "⋀", "\\bigwedge");
l(s, c, Ae, "⨄", "\\biguplus");
l(s, c, Ae, "⋂", "\\bigcap");
l(s, c, Ae, "⋃", "\\bigcup");
l(s, c, Ae, "∫", "\\int");
l(s, c, Ae, "∫", "\\intop");
l(s, c, Ae, "∬", "\\iint");
l(s, c, Ae, "∭", "\\iiint");
l(s, c, Ae, "∏", "\\prod");
l(s, c, Ae, "∑", "\\sum");
l(s, c, Ae, "⨂", "\\bigotimes");
l(s, c, Ae, "⨁", "\\bigoplus");
l(s, c, Ae, "⨀", "\\bigodot");
l(s, c, Ae, "∮", "\\oint");
l(s, c, Ae, "∯", "\\oiint");
l(s, c, Ae, "∰", "\\oiiint");
l(s, c, Ae, "⨆", "\\bigsqcup");
l(s, c, Ae, "∫", "\\smallint");
l(C, c, Mt, "…", "\\textellipsis");
l(s, c, Mt, "…", "\\mathellipsis");
l(C, c, Mt, "…", "\\ldots", !0);
l(s, c, Mt, "…", "\\ldots", !0);
l(s, c, Mt, "⋯", "\\@cdots", !0);
l(s, c, Mt, "⋱", "\\ddots", !0);
l(s, c, y, "⋮", "\\varvdots");
l(C, c, y, "⋮", "\\varvdots");
l(s, c, ye, "ˊ", "\\acute");
l(s, c, ye, "ˋ", "\\grave");
l(s, c, ye, "¨", "\\ddot");
l(s, c, ye, "~", "\\tilde");
l(s, c, ye, "ˉ", "\\bar");
l(s, c, ye, "˘", "\\breve");
l(s, c, ye, "ˇ", "\\check");
l(s, c, ye, "^", "\\hat");
l(s, c, ye, "⃗", "\\vec");
l(s, c, ye, "˙", "\\dot");
l(s, c, ye, "˚", "\\mathring");
l(s, c, j, "", "\\@imath");
l(s, c, j, "", "\\@jmath");
l(s, c, y, "ı", "ı");
l(s, c, y, "ȷ", "ȷ");
l(C, c, y, "ı", "\\i", !0);
l(C, c, y, "ȷ", "\\j", !0);
l(C, c, y, "ß", "\\ss", !0);
l(C, c, y, "æ", "\\ae", !0);
l(C, c, y, "œ", "\\oe", !0);
l(C, c, y, "ø", "\\o", !0);
l(C, c, y, "Æ", "\\AE", !0);
l(C, c, y, "Œ", "\\OE", !0);
l(C, c, y, "Ø", "\\O", !0);
l(C, c, ye, "ˊ", "\\'");
l(C, c, ye, "ˋ", "\\`");
l(C, c, ye, "ˆ", "\\^");
l(C, c, ye, "˜", "\\~");
l(C, c, ye, "ˉ", "\\=");
l(C, c, ye, "˘", "\\u");
l(C, c, ye, "˙", "\\.");
l(C, c, ye, "¸", "\\c");
l(C, c, ye, "˚", "\\r");
l(C, c, ye, "ˇ", "\\v");
l(C, c, ye, "¨", '\\"');
l(C, c, ye, "˝", "\\H");
l(C, c, ye, "◯", "\\textcircled");
var mi = {
  "--": !0,
  "---": !0,
  "``": !0,
  "''": !0
};
l(C, c, y, "–", "--", !0);
l(C, c, y, "–", "\\textendash");
l(C, c, y, "—", "---", !0);
l(C, c, y, "—", "\\textemdash");
l(C, c, y, "‘", "`", !0);
l(C, c, y, "‘", "\\textquoteleft");
l(C, c, y, "’", "'", !0);
l(C, c, y, "’", "\\textquoteright");
l(C, c, y, "“", "``", !0);
l(C, c, y, "“", "\\textquotedblleft");
l(C, c, y, "”", "''", !0);
l(C, c, y, "”", "\\textquotedblright");
l(s, c, y, "°", "\\degree", !0);
l(C, c, y, "°", "\\degree");
l(C, c, y, "°", "\\textdegree", !0);
l(s, c, y, "£", "\\pounds");
l(s, c, y, "£", "\\mathsterling", !0);
l(C, c, y, "£", "\\pounds");
l(C, c, y, "£", "\\textsterling", !0);
l(s, f, y, "✠", "\\maltese");
l(C, f, y, "✠", "\\maltese");
var yn = '0123456789/@."';
for (var Kr = 0; Kr < yn.length; Kr++) {
  var xn = yn.charAt(Kr);
  l(s, c, y, xn, xn);
}
var wn = '0123456789!@*()-=+";:?/.,';
for (var Zr = 0; Zr < wn.length; Zr++) {
  var Sn = wn.charAt(Zr);
  l(C, c, y, Sn, Sn);
}
var Sr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
for (var Jr = 0; Jr < Sr.length; Jr++) {
  var sr = Sr.charAt(Jr);
  l(s, c, j, sr, sr), l(C, c, y, sr, sr);
}
l(s, f, y, "C", "ℂ");
l(C, f, y, "C", "ℂ");
l(s, f, y, "H", "ℍ");
l(C, f, y, "H", "ℍ");
l(s, f, y, "N", "ℕ");
l(C, f, y, "N", "ℕ");
l(s, f, y, "P", "ℙ");
l(C, f, y, "P", "ℙ");
l(s, f, y, "Q", "ℚ");
l(C, f, y, "Q", "ℚ");
l(s, f, y, "R", "ℝ");
l(C, f, y, "R", "ℝ");
l(s, f, y, "Z", "ℤ");
l(C, f, y, "Z", "ℤ");
l(s, c, j, "h", "ℎ");
l(C, c, j, "h", "ℎ");
var X = "";
for (var Ge = 0; Ge < Sr.length; Ge++) {
  var Se = Sr.charAt(Ge);
  X = String.fromCharCode(55349, 56320 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56372 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56424 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56580 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56684 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56736 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56788 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56840 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56944 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), Ge < 26 && (X = String.fromCharCode(55349, 56632 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X), X = String.fromCharCode(55349, 56476 + Ge), l(s, c, j, Se, X), l(C, c, y, Se, X));
}
X = "𝕜";
l(s, c, j, "k", X);
l(C, c, y, "k", X);
for (var it = 0; it < 10; it++) {
  var Y0 = it.toString();
  X = String.fromCharCode(55349, 57294 + it), l(s, c, j, Y0, X), l(C, c, y, Y0, X), X = String.fromCharCode(55349, 57314 + it), l(s, c, j, Y0, X), l(C, c, y, Y0, X), X = String.fromCharCode(55349, 57324 + it), l(s, c, j, Y0, X), l(C, c, y, Y0, X), X = String.fromCharCode(55349, 57334 + it), l(s, c, j, Y0, X), l(C, c, y, Y0, X);
}
var Sa = "ÐÞþ";
for (var Qr = 0; Qr < Sa.length; Qr++) {
  var or = Sa.charAt(Qr);
  l(s, c, j, or, or), l(C, c, y, or, or);
}
var ur = [
  ["mathbf", "textbf", "Main-Bold"],
  // A-Z bold upright
  ["mathbf", "textbf", "Main-Bold"],
  // a-z bold upright
  ["mathnormal", "textit", "Math-Italic"],
  // A-Z italic
  ["mathnormal", "textit", "Math-Italic"],
  // a-z italic
  ["boldsymbol", "boldsymbol", "Main-BoldItalic"],
  // A-Z bold italic
  ["boldsymbol", "boldsymbol", "Main-BoldItalic"],
  // a-z bold italic
  // Map fancy A-Z letters to script, not calligraphic.
  // This aligns with unicode-math and math fonts (except Cambria Math).
  ["mathscr", "textscr", "Script-Regular"],
  // A-Z script
  ["", "", ""],
  // a-z script.  No font
  ["", "", ""],
  // A-Z bold script. No font
  ["", "", ""],
  // a-z bold script. No font
  ["mathfrak", "textfrak", "Fraktur-Regular"],
  // A-Z Fraktur
  ["mathfrak", "textfrak", "Fraktur-Regular"],
  // a-z Fraktur
  ["mathbb", "textbb", "AMS-Regular"],
  // A-Z double-struck
  ["mathbb", "textbb", "AMS-Regular"],
  // k double-struck
  // Note that we are using a bold font, but font metrics for regular Fraktur.
  ["mathboldfrak", "textboldfrak", "Fraktur-Regular"],
  // A-Z bold Fraktur
  ["mathboldfrak", "textboldfrak", "Fraktur-Regular"],
  // a-z bold Fraktur
  ["mathsf", "textsf", "SansSerif-Regular"],
  // A-Z sans-serif
  ["mathsf", "textsf", "SansSerif-Regular"],
  // a-z sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // A-Z bold sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // a-z bold sans-serif
  ["mathitsf", "textitsf", "SansSerif-Italic"],
  // A-Z italic sans-serif
  ["mathitsf", "textitsf", "SansSerif-Italic"],
  // a-z italic sans-serif
  ["", "", ""],
  // A-Z bold italic sans. No font
  ["", "", ""],
  // a-z bold italic sans. No font
  ["mathtt", "texttt", "Typewriter-Regular"],
  // A-Z monospace
  ["mathtt", "texttt", "Typewriter-Regular"]
  // a-z monospace
], kn = [
  ["mathbf", "textbf", "Main-Bold"],
  // 0-9 bold
  ["", "", ""],
  // 0-9 double-struck. No KaTeX font.
  ["mathsf", "textsf", "SansSerif-Regular"],
  // 0-9 sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // 0-9 bold sans-serif
  ["mathtt", "texttt", "Typewriter-Regular"]
  // 0-9 monospace
], zs = (r, e) => {
  var t = r.charCodeAt(0), a = r.charCodeAt(1), n = (t - 55296) * 1024 + (a - 56320) + 65536, i = e === "math" ? 0 : 1;
  if (119808 <= n && n < 120484) {
    var o = Math.floor((n - 119808) / 26);
    return [ur[o][2], ur[o][i]];
  } else if (120782 <= n && n <= 120831) {
    var u = Math.floor((n - 120782) / 10);
    return [kn[u][2], kn[u][i]];
  } else {
    if (n === 120485 || n === 120486)
      return [ur[0][2], ur[0][i]];
    if (120486 < n && n < 120782)
      return ["", ""];
    throw new E("Unsupported character: " + r);
  }
}, zr = function(e, t, a) {
  if (be[a][e]) {
    var n = be[a][e].replace;
    n && (e = n);
  }
  return {
    value: e,
    metrics: Ha(e, t, a)
  };
}, je = function(e, t, a, n, i) {
  var o = zr(e, t, a), u = o.metrics;
  e = o.value;
  var d;
  if (u) {
    var p = u.italic;
    (a === "text" || n && n.font === "mathit") && (p = 0), d = new r0(e, u.height, u.depth, p, u.skew, u.width, i);
  } else
    typeof console < "u" && console.warn("No character metrics " + ("for '" + e + "' in style '" + t + "' and mode '" + a + "'")), d = new r0(e, 0, 0, 0, 0, 0, i);
  if (n) {
    d.maxFontSize = n.sizeMultiplier, n.style.isTight() && d.classes.push("mtight");
    var b = n.getColor();
    b && (d.style.color = b);
  }
  return d;
}, Na = function(e, t, a, n) {
  return n === void 0 && (n = []), a.font === "boldsymbol" && zr(e, "Main-Bold", t).metrics ? je(e, "Main-Bold", t, a, n.concat(["mathbf"])) : e === "\\" || be[t][e].font === "main" ? je(e, "Main-Regular", t, a, n) : je(e, "AMS-Regular", t, a, n.concat(["amsrm"]));
}, Cs = function(e, t, a, n, i) {
  return i !== "textord" && zr(e, "Math-BoldItalic", t).metrics ? {
    fontName: "Math-BoldItalic",
    fontClass: "boldsymbol"
  } : {
    fontName: "Main-Bold",
    fontClass: "mathbf"
  };
}, Cr = function(e, t, a) {
  var n = e.mode, i = e.text, o = ["mord"], u = n === "math" || n === "text" && t.font, d = u ? t.font : t.fontFamily, p = "", b = "";
  if (i.charCodeAt(0) === 55349 && ([p, b] = zs(i, n)), p.length > 0)
    return je(i, p, n, t, o.concat(b));
  if (d) {
    var w, S;
    if (d === "boldsymbol") {
      var k = Cs(i, n, t, o, a);
      w = k.fontName, S = [k.fontClass];
    } else u ? (w = ka[d].fontName, S = [d]) : (w = cr(d, t.fontWeight, t.fontShape), S = [d, t.fontWeight, t.fontShape]);
    if (zr(i, w, n).metrics)
      return je(i, w, n, t, o.concat(S));
    if (mi.hasOwnProperty(i) && w.slice(0, 10) === "Typewriter") {
      for (var A = [], z = 0; z < i.length; z++)
        A.push(je(i[z], w, n, t, o.concat(S)));
      return N0(A);
    }
  }
  if (a === "mathord")
    return je(i, "Math-Italic", n, t, o.concat(["mathnormal"]));
  if (a === "textord") {
    var D = be[n][i] && be[n][i].font;
    if (D === "ams") {
      var O = cr("amsrm", t.fontWeight, t.fontShape);
      return je(i, O, n, t, o.concat("amsrm", t.fontWeight, t.fontShape));
    } else if (D === "main" || !D) {
      var $ = cr("textrm", t.fontWeight, t.fontShape);
      return je(i, $, n, t, o.concat(t.fontWeight, t.fontShape));
    } else {
      var P = cr(D, t.fontWeight, t.fontShape);
      return je(i, P, n, t, o.concat(P, t.fontWeight, t.fontShape));
    }
  } else
    throw new Error("unexpected type: " + a + " in makeOrd");
}, Bs = (r, e) => {
  if (K0(r.classes) !== K0(e.classes) || r.skew !== e.skew || r.maxFontSize !== e.maxFontSize || r.italic !== 0 && r.hasClass("mathnormal"))
    return !1;
  if (r.classes.length === 1) {
    var t = r.classes[0];
    if (t === "mbin" || t === "mord")
      return !1;
  }
  for (var a of Object.keys(r.style))
    if (r.style[a] !== e.style[a])
      return !1;
  for (var n of Object.keys(e.style))
    if (r.style[n] !== e.style[n])
      return !1;
  return !0;
}, pi = (r) => {
  for (var e = 0; e < r.length - 1; e++) {
    var t = r[e], a = r[e + 1];
    t instanceof r0 && a instanceof r0 && Bs(t, a) && (t.text += a.text, t.height = Math.max(t.height, a.height), t.depth = Math.max(t.depth, a.depth), t.italic = a.italic, r.splice(e + 1, 1), e--);
  }
  return r;
}, Fa = function(e) {
  for (var t = 0, a = 0, n = 0, i = 0; i < e.children.length; i++) {
    var o = e.children[i];
    o.height > t && (t = o.height), o.depth > a && (a = o.depth), o.maxFontSize > n && (n = o.maxFontSize);
  }
  e.height = t, e.depth = a, e.maxFontSize = n;
}, I = function(e, t, a, n) {
  var i = new kt(e, t, a, n);
  return Fa(i), i;
}, J0 = (r, e, t, a) => new kt(r, e, t, a), xt = function(e, t, a) {
  var n = I([e], [], t);
  return n.height = Math.max(a || t.fontMetrics().defaultRuleThickness, t.minRuleThickness), n.style.borderBottomWidth = q(n.height), n.maxFontSize = 1, n;
}, Is = function(e, t, a, n) {
  var i = new Ar(e, t, a, n);
  return Fa(i), i;
}, N0 = function(e) {
  var t = new St(e);
  return Fa(t), t;
}, wt = function(e, t) {
  return e instanceof St ? I([], [e], t) : e;
}, Es = function(e) {
  if (e.positionType === "individualShift") {
    for (var t = e.children, a = [t[0]], n = -t[0].shift - t[0].elem.depth, i = n, o = 1; o < t.length; o++) {
      var u = -t[o].shift - i - t[o].elem.depth, d = u - (t[o - 1].elem.height + t[o - 1].elem.depth);
      i = i + u, a.push({
        type: "kern",
        size: d
      }), a.push(t[o]);
    }
    return {
      children: a,
      depth: n
    };
  }
  var p;
  if (e.positionType === "top") {
    for (var b = e.positionData, w = 0; w < e.children.length; w++) {
      var S = e.children[w];
      b -= S.type === "kern" ? S.size : S.elem.height + S.elem.depth;
    }
    p = b;
  } else if (e.positionType === "bottom")
    p = -e.positionData;
  else {
    var k = e.children[0];
    if (k.type !== "elem")
      throw new Error('First child must have type "elem".');
    if (e.positionType === "shift")
      p = -k.elem.depth - e.positionData;
    else if (e.positionType === "firstBaseline")
      p = -k.elem.depth;
    else
      throw new Error("Invalid positionType " + e.positionType + ".");
  }
  return {
    children: e.children,
    depth: p
  };
}, oe = function(e, t) {
  for (var {
    children: a,
    depth: n
  } = Es(e), i = 0, o = 0; o < a.length; o++) {
    var u = a[o];
    if (u.type === "elem") {
      var d = u.elem;
      i = Math.max(i, d.maxFontSize, d.height);
    }
  }
  i += 2;
  var p = I(["pstrut"], []);
  p.style.height = q(i);
  for (var b = [], w = n, S = n, k = n, A = 0; A < a.length; A++) {
    var z = a[A];
    if (z.type === "kern")
      k += z.size;
    else {
      var D = z.elem, O = z.wrapperClasses || [], $ = z.wrapperStyle || {}, P = I(O, [p, D], void 0, $);
      P.style.top = q(-i - k - D.depth), z.marginLeft && (P.style.marginLeft = z.marginLeft), z.marginRight && (P.style.marginRight = z.marginRight), b.push(P), k += D.height + D.depth;
    }
    w = Math.min(w, k), S = Math.max(S, k);
  }
  var G = I(["vlist"], b);
  G.style.height = q(S);
  var W;
  if (w < 0) {
    var V = I([], []), Y = I(["vlist"], [V]);
    Y.style.height = q(-w);
    var ie = I(["vlist-s"], [new r0("​")]);
    W = [I(["vlist-r"], [G, ie]), I(["vlist-r"], [Y])];
  } else
    W = [I(["vlist-r"], [G])];
  var re = I(["vlist-t"], W);
  return W.length === 2 && re.classes.push("vlist-t2"), re.height = S, re.depth = -w, re;
}, fi = (r, e) => {
  var t = I(["mspace"], [], e), a = we(r, e);
  return t.style.marginRight = q(a), t;
}, cr = function(e, t, a) {
  var n = "";
  switch (e) {
    case "amsrm":
      n = "AMS";
      break;
    case "textrm":
      n = "Main";
      break;
    case "textsf":
      n = "SansSerif";
      break;
    case "texttt":
      n = "Typewriter";
      break;
    default:
      n = e;
  }
  var i;
  return t === "textbf" && a === "textit" ? i = "BoldItalic" : t === "textbf" ? i = "Bold" : t === "textit" ? i = "Italic" : i = "Regular", n + "-" + i;
}, ka = {
  // styles
  mathbf: {
    variant: "bold",
    fontName: "Main-Bold"
  },
  mathrm: {
    variant: "normal",
    fontName: "Main-Regular"
  },
  textit: {
    variant: "italic",
    fontName: "Main-Italic"
  },
  mathit: {
    variant: "italic",
    fontName: "Main-Italic"
  },
  mathnormal: {
    variant: "italic",
    fontName: "Math-Italic"
  },
  mathsfit: {
    variant: "sans-serif-italic",
    fontName: "SansSerif-Italic"
  },
  // "boldsymbol" is missing because they require the use of multiple fonts:
  // Math-BoldItalic and Main-Bold.  This is handled by a special case in
  // makeOrd which ends up calling boldsymbol.
  // families
  mathbb: {
    variant: "double-struck",
    fontName: "AMS-Regular"
  },
  mathcal: {
    variant: "script",
    fontName: "Caligraphic-Regular"
  },
  mathfrak: {
    variant: "fraktur",
    fontName: "Fraktur-Regular"
  },
  mathscr: {
    variant: "script",
    fontName: "Script-Regular"
  },
  mathsf: {
    variant: "sans-serif",
    fontName: "SansSerif-Regular"
  },
  mathtt: {
    variant: "monospace",
    fontName: "Typewriter-Regular"
  }
}, gi = {
  //   path, width, height
  vec: ["vec", 0.471, 0.714],
  // values from the font glyph
  oiintSize1: ["oiintSize1", 0.957, 0.499],
  // oval to overlay the integrand
  oiintSize2: ["oiintSize2", 1.472, 0.659],
  oiiintSize1: ["oiiintSize1", 1.304, 0.499],
  oiiintSize2: ["oiiintSize2", 1.98, 0.659]
}, vi = function(e, t) {
  var [a, n, i] = gi[e], o = new Z0(a), u = new O0([o], {
    width: q(n),
    height: q(i),
    // Override CSS rule `.katex svg { width: 100% }`
    style: "width:" + q(n),
    viewBox: "0 0 " + 1e3 * n + " " + 1e3 * i,
    preserveAspectRatio: "xMinYMin"
  }), d = J0(["overlay"], [u], t);
  return d.height = i, d.style.height = q(i), d.style.width = q(n), d;
}, xe = {
  number: 3,
  unit: "mu"
}, lt = {
  number: 4,
  unit: "mu"
}, E0 = {
  number: 5,
  unit: "mu"
}, Rs = {
  mord: {
    mop: xe,
    mbin: lt,
    mrel: E0,
    minner: xe
  },
  mop: {
    mord: xe,
    mop: xe,
    mrel: E0,
    minner: xe
  },
  mbin: {
    mord: lt,
    mop: lt,
    mopen: lt,
    minner: lt
  },
  mrel: {
    mord: E0,
    mop: E0,
    mopen: E0,
    minner: E0
  },
  mopen: {},
  mclose: {
    mop: xe,
    mbin: lt,
    mrel: E0,
    minner: xe
  },
  mpunct: {
    mord: xe,
    mop: xe,
    mrel: E0,
    mopen: xe,
    mclose: xe,
    mpunct: xe,
    minner: xe
  },
  minner: {
    mord: xe,
    mop: xe,
    mbin: lt,
    mrel: E0,
    mopen: xe,
    mpunct: xe,
    minner: xe
  }
}, Ds = {
  mord: {
    mop: xe
  },
  mop: {
    mord: xe,
    mop: xe
  },
  mbin: {},
  mrel: {},
  mopen: {},
  mclose: {
    mop: xe
  },
  mpunct: {},
  minner: {
    mop: xe
  }
}, bi = {}, kr = {}, Mr = {};
function H(r) {
  for (var {
    type: e,
    names: t,
    props: a,
    handler: n,
    htmlBuilder: i,
    mathmlBuilder: o
  } = r, u = {
    type: e,
    numArgs: a.numArgs,
    argTypes: a.argTypes,
    allowedInArgument: !!a.allowedInArgument,
    allowedInText: !!a.allowedInText,
    allowedInMath: a.allowedInMath === void 0 ? !0 : a.allowedInMath,
    numOptionalArgs: a.numOptionalArgs || 0,
    infix: !!a.infix,
    primitive: !!a.primitive,
    handler: n
  }, d = 0; d < t.length; ++d)
    bi[t[d]] = u;
  e && (i && (kr[e] = i), o && (Mr[e] = o));
}
function ut(r) {
  var {
    type: e,
    htmlBuilder: t,
    mathmlBuilder: a
  } = r;
  H({
    type: e,
    names: [],
    props: {
      numArgs: 0
    },
    handler() {
      throw new Error("Should never be called.");
    },
    htmlBuilder: t,
    mathmlBuilder: a
  });
}
var Tr = function(e) {
  return e.type === "ordgroup" && e.body.length === 1 ? e.body[0] : e;
}, Me = function(e) {
  return e.type === "ordgroup" ? e.body : [e];
}, qs = /* @__PURE__ */ new Set(["leftmost", "mbin", "mopen", "mrel", "mop", "mpunct"]), Os = /* @__PURE__ */ new Set(["rightmost", "mrel", "mclose", "mpunct"]), Ls = {
  display: K.DISPLAY,
  text: K.TEXT,
  script: K.SCRIPT,
  scriptscript: K.SCRIPTSCRIPT
}, Hs = {
  mord: "mord",
  mop: "mop",
  mbin: "mbin",
  mrel: "mrel",
  mopen: "mopen",
  mclose: "mclose",
  mpunct: "mpunct",
  minner: "minner"
}, Ie = function(e, t, a, n) {
  n === void 0 && (n = [null, null]);
  for (var i = [], o = 0; o < e.length; o++) {
    var u = ue(e[o], t);
    if (u instanceof St) {
      var d = u.children;
      i.push(...d);
    } else
      i.push(u);
  }
  if (pi(i), !a)
    return i;
  var p = t;
  if (e.length === 1) {
    var b = e[0];
    b.type === "sizing" ? p = t.havingSize(b.size) : b.type === "styling" && (p = t.havingStyle(Ls[b.style]));
  }
  var w = I([n[0] || "leftmost"], [], t), S = I([n[1] || "rightmost"], [], t), k = a === "root";
  return Ma(i, (A, z) => {
    var D = z.classes[0], O = A.classes[0];
    D === "mbin" && Os.has(O) ? z.classes[0] = "mord" : O === "mbin" && qs.has(D) && (A.classes[0] = "mord");
  }, {
    node: w
  }, S, k), Ma(i, (A, z) => {
    var D, O, $ = Aa(z), P = Aa(A), G = $ && P ? A.hasClass("mtight") ? (D = Ds[$]) == null ? void 0 : D[P] : (O = Rs[$]) == null ? void 0 : O[P] : null;
    if (G)
      return fi(G, p);
  }, {
    node: w
  }, S, k), i;
}, Ma = function(e, t, a, n, i) {
  n && e.push(n);
  for (var o = 0; o < e.length; o++) {
    var u = e[o], d = yi(u);
    if (d) {
      Ma(d.children, t, a, null, i);
      continue;
    }
    var p = !u.hasClass("mspace");
    if (p) {
      var b = t(u, a.node);
      b && (a.insertAfter ? a.insertAfter(b) : (e.unshift(b), o++));
    }
    p ? a.node = u : i && u.hasClass("newline") && (a.node = I(["leftmost"])), a.insertAfter = /* @__PURE__ */ ((w) => (S) => {
      e.splice(w + 1, 0, S), o++;
    })(o);
  }
  n && e.pop();
}, yi = function(e) {
  return e instanceof St || e instanceof Ar || e instanceof kt && e.hasClass("enclosing") ? e : null;
}, Ta = function(e, t) {
  var a = yi(e);
  if (a) {
    var n = a.children;
    if (n.length) {
      if (t === "right")
        return Ta(n[n.length - 1], "right");
      if (t === "left")
        return Ta(n[0], "left");
    }
  }
  return e;
}, Aa = function(e, t) {
  if (!e)
    return null;
  t && (e = Ta(e, t));
  var a = e.classes[0];
  return Hs[a] || null;
}, Ht = function(e, t) {
  var a = ["nulldelimiter"].concat(e.baseSizingClasses());
  return I(t.concat(a));
}, ue = function(e, t, a) {
  if (!e)
    return I();
  if (kr[e.type]) {
    var n = kr[e.type](e, t);
    if (a && t.size !== a.size) {
      n = I(t.sizingClasses(a), [n], t);
      var i = t.sizeMultiplier / a.sizeMultiplier;
      n.height *= i, n.depth *= i;
    }
    return n;
  } else
    throw new E("Got group of unknown type: '" + e.type + "'");
};
function dr(r, e) {
  var t = I(["base"], r, e), a = I(["strut"]);
  return a.style.height = q(t.height + t.depth), t.depth && (a.style.verticalAlign = q(-t.depth)), t.children.unshift(a), t;
}
function za(r, e) {
  var t = null;
  r.length === 1 && r[0].type === "tag" && (t = r[0].tag, r = r[0].body);
  var a = Ie(r, e, "root"), n;
  a.length === 2 && a[1].hasClass("tag") && (n = a.pop());
  for (var i = [], o = [], u = 0; u < a.length; u++)
    if (o.push(a[u]), a[u].hasClass("mbin") || a[u].hasClass("mrel") || a[u].hasClass("allowbreak")) {
      for (var d = !1; u < a.length - 1 && a[u + 1].hasClass("mspace") && !a[u + 1].hasClass("newline"); )
        u++, o.push(a[u]), a[u].hasClass("nobreak") && (d = !0);
      d || (i.push(dr(o, e)), o = []);
    } else a[u].hasClass("newline") && (o.pop(), o.length > 0 && (i.push(dr(o, e)), o = []), i.push(a[u]));
  o.length > 0 && i.push(dr(o, e));
  var p;
  t ? (p = dr(Ie(t, e, !0), e), p.classes = ["tag"], i.push(p)) : n && i.push(n);
  var b = I(["katex-html"], i);
  if (b.setAttribute("aria-hidden", "true"), p) {
    var w = p.children[0];
    w.style.height = q(b.height + b.depth), b.depth && (w.style.verticalAlign = q(-b.depth));
  }
  return b;
}
function xi(r) {
  return new St(r);
}
class R {
  constructor(e, t, a) {
    this.type = e, this.attributes = {}, this.children = t || [], this.classes = a || [];
  }
  /**
   * Sets an attribute on a MathML node. MathML depends on attributes to convey a
   * semantic content, so this is used heavily.
   */
  setAttribute(e, t) {
    this.attributes[e] = t;
  }
  /**
   * Gets an attribute on a MathML node.
   */
  getAttribute(e) {
    return this.attributes[e];
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  toNode() {
    var e = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
    for (var t in this.attributes)
      Object.prototype.hasOwnProperty.call(this.attributes, t) && e.setAttribute(t, this.attributes[t]);
    this.classes.length > 0 && (e.className = K0(this.classes));
    for (var a = 0; a < this.children.length; a++)
      if (this.children[a] instanceof Te && this.children[a + 1] instanceof Te) {
        for (var n = this.children[a].toText() + this.children[++a].toText(); this.children[a + 1] instanceof Te; )
          n += this.children[++a].toText();
        e.appendChild(new Te(n).toNode());
      } else
        e.appendChild(this.children[a].toNode());
    return e;
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  toMarkup() {
    var e = "<" + this.type;
    for (var t in this.attributes)
      Object.prototype.hasOwnProperty.call(this.attributes, t) && (e += " " + t + '="', e += Pe(this.attributes[t]), e += '"');
    this.classes.length > 0 && (e += ' class ="' + Pe(K0(this.classes)) + '"'), e += ">";
    for (var a = 0; a < this.children.length; a++)
      e += this.children[a].toMarkup();
    return e += "</" + this.type + ">", e;
  }
  /**
   * Converts the math node into a string, similar to innerText, but escaped.
   */
  toText() {
    return this.children.map((e) => e.toText()).join("");
  }
}
class Te {
  constructor(e) {
    this.text = e;
  }
  /**
   * Converts the text node into a DOM text node.
   */
  toNode() {
    return document.createTextNode(this.text);
  }
  /**
   * Converts the text node into escaped HTML markup
   * (representing the text itself).
   */
  toMarkup() {
    return Pe(this.toText());
  }
  /**
   * Converts the text node into a string
   * (representing the text itself).
   */
  toText() {
    return this.text;
  }
}
class wi {
  /**
   * Create a Space node with width given in CSS ems.
   */
  constructor(e) {
    this.width = e, e >= 0.05555 && e <= 0.05556 ? this.character = " " : e >= 0.1666 && e <= 0.1667 ? this.character = " " : e >= 0.2222 && e <= 0.2223 ? this.character = " " : e >= 0.2777 && e <= 0.2778 ? this.character = "  " : e >= -0.05556 && e <= -0.05555 ? this.character = " ⁣" : e >= -0.1667 && e <= -0.1666 ? this.character = " ⁣" : e >= -0.2223 && e <= -0.2222 ? this.character = " ⁣" : e >= -0.2778 && e <= -0.2777 ? this.character = " ⁣" : this.character = null;
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  toNode() {
    if (this.character)
      return document.createTextNode(this.character);
    var e = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
    return e.setAttribute("width", q(this.width)), e;
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  toMarkup() {
    return this.character ? "<mtext>" + this.character + "</mtext>" : '<mspace width="' + q(this.width) + '"/>';
  }
  /**
   * Converts the math node into a string, similar to innerText.
   */
  toText() {
    return this.character ? this.character : " ";
  }
}
var Ns = /* @__PURE__ */ new Set(["\\imath", "\\jmath"]), Fs = /* @__PURE__ */ new Set(["mrow", "mtable"]), u0 = function(e, t, a) {
  return be[t][e] && be[t][e].replace && e.charCodeAt(0) !== 55349 && !(mi.hasOwnProperty(e) && a && (a.fontFamily && a.fontFamily.slice(4, 6) === "tt" || a.font && a.font.slice(4, 6) === "tt")) && (e = be[t][e].replace), new Te(e);
}, Pa = function(e) {
  return e.length === 1 ? e[0] : new R("mrow", e);
}, $a = function(e, t) {
  if (t.fontFamily === "texttt")
    return "monospace";
  if (t.fontFamily === "textsf")
    return t.fontShape === "textit" && t.fontWeight === "textbf" ? "sans-serif-bold-italic" : t.fontShape === "textit" ? "sans-serif-italic" : t.fontWeight === "textbf" ? "bold-sans-serif" : "sans-serif";
  if (t.fontShape === "textit" && t.fontWeight === "textbf")
    return "bold-italic";
  if (t.fontShape === "textit")
    return "italic";
  if (t.fontWeight === "textbf")
    return "bold";
  var a = t.font;
  if (!a || a === "mathnormal")
    return null;
  var n = e.mode;
  if (a === "mathit")
    return "italic";
  if (a === "boldsymbol")
    return e.type === "textord" ? "bold" : "bold-italic";
  if (a === "mathbf")
    return "bold";
  if (a === "mathbb")
    return "double-struck";
  if (a === "mathsfit")
    return "sans-serif-italic";
  if (a === "mathfrak")
    return "fraktur";
  if (a === "mathscr" || a === "mathcal")
    return "script";
  if (a === "mathsf")
    return "sans-serif";
  if (a === "mathtt")
    return "monospace";
  var i = e.text;
  if (Ns.has(i))
    return null;
  if (be[n][i]) {
    var o = be[n][i].replace;
    o && (i = o);
  }
  var u = ka[a].fontName;
  return Ha(i, u, n) ? ka[a].variant : null;
};
function ea(r) {
  if (!r)
    return !1;
  if (r.type === "mi" && r.children.length === 1) {
    var e = r.children[0];
    return e instanceof Te && e.text === ".";
  } else if (r.type === "mo" && r.children.length === 1 && r.getAttribute("separator") === "true" && r.getAttribute("lspace") === "0em" && r.getAttribute("rspace") === "0em") {
    var t = r.children[0];
    return t instanceof Te && t.text === ",";
  } else
    return !1;
}
var n0 = function(e, t, a) {
  if (e.length === 1) {
    var n = pe(e[0], t);
    return a && n instanceof R && n.type === "mo" && (n.setAttribute("lspace", "0em"), n.setAttribute("rspace", "0em")), [n];
  }
  for (var i = [], o, u = 0; u < e.length; u++) {
    var d = pe(e[u], t);
    if (d instanceof R && o instanceof R) {
      if (d.type === "mtext" && o.type === "mtext" && d.getAttribute("mathvariant") === o.getAttribute("mathvariant")) {
        o.children.push(...d.children);
        continue;
      } else if (d.type === "mn" && o.type === "mn") {
        o.children.push(...d.children);
        continue;
      } else if (ea(d) && o.type === "mn") {
        o.children.push(...d.children);
        continue;
      } else if (d.type === "mn" && ea(o))
        d.children = [...o.children, ...d.children], i.pop();
      else if ((d.type === "msup" || d.type === "msub") && d.children.length >= 1 && (o.type === "mn" || ea(o))) {
        var p = d.children[0];
        p instanceof R && p.type === "mn" && (p.children = [...o.children, ...p.children], i.pop());
      } else if (o.type === "mi" && o.children.length === 1) {
        var b = o.children[0];
        if (b instanceof Te && b.text === "̸" && (d.type === "mo" || d.type === "mi" || d.type === "mn")) {
          var w = d.children[0];
          w instanceof Te && w.text.length > 0 && (w.text = w.text.slice(0, 1) + "̸" + w.text.slice(1), i.pop());
        }
      }
    }
    i.push(d), o = d;
  }
  return i;
}, Q0 = function(e, t, a) {
  return Pa(n0(e, t, a));
}, pe = function(e, t) {
  if (!e)
    return new R("mrow");
  if (Mr[e.type]) {
    var a = Mr[e.type](e, t);
    return a;
  } else
    throw new E("Got group of unknown type: '" + e.type + "'");
};
function Mn(r, e, t, a, n) {
  var i = n0(r, t), o;
  i.length === 1 && i[0] instanceof R && Fs.has(i[0].type) ? o = i[0] : o = new R("mrow", i);
  var u = new R("annotation", [new Te(e)]);
  u.setAttribute("encoding", "application/x-tex");
  var d = new R("semantics", [o, u]), p = new R("math", [d]);
  p.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"), a && p.setAttribute("display", "block");
  var b = n ? "katex" : "katex-mathml";
  return I([b], [p]);
}
var Ps = [
  // Each element contains [textsize, scriptsize, scriptscriptsize].
  // The size mappings are taken from TeX with \normalsize=10pt.
  [1, 1, 1],
  // size1: [5, 5, 5]              \tiny
  [2, 1, 1],
  // size2: [6, 5, 5]
  [3, 1, 1],
  // size3: [7, 5, 5]              \scriptsize
  [4, 2, 1],
  // size4: [8, 6, 5]              \footnotesize
  [5, 2, 1],
  // size5: [9, 6, 5]              \small
  [6, 3, 1],
  // size6: [10, 7, 5]             \normalsize
  [7, 4, 2],
  // size7: [12, 8, 6]             \large
  [8, 6, 3],
  // size8: [14.4, 10, 7]          \Large
  [9, 7, 6],
  // size9: [17.28, 12, 10]        \LARGE
  [10, 8, 7],
  // size10: [20.74, 14.4, 12]     \huge
  [11, 10, 9]
  // size11: [24.88, 20.74, 17.28] \HUGE
], Tn = [
  // fontMetrics.js:getGlobalMetrics also uses size indexes, so if
  // you change size indexes, change that function.
  0.5,
  0.6,
  0.7,
  0.8,
  0.9,
  1,
  1.2,
  1.44,
  1.728,
  2.074,
  2.488
], An = function(e, t) {
  return t.size < 2 ? e : Ps[e - 1][t.size - 1];
};
class R0 {
  constructor(e) {
    this.style = e.style, this.color = e.color, this.size = e.size || R0.BASESIZE, this.textSize = e.textSize || this.size, this.phantom = !!e.phantom, this.font = e.font || "", this.fontFamily = e.fontFamily || "", this.fontWeight = e.fontWeight || "", this.fontShape = e.fontShape || "", this.sizeMultiplier = Tn[this.size - 1], this.maxSize = e.maxSize, this.minRuleThickness = e.minRuleThickness, this._fontMetrics = void 0;
  }
  /**
   * Returns a new options object with the same properties as "this".  Properties
   * from "extension" will be copied to the new options object.
   */
  extend(e) {
    var t = {
      style: this.style,
      size: this.size,
      textSize: this.textSize,
      color: this.color,
      phantom: this.phantom,
      font: this.font,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontShape: this.fontShape,
      maxSize: this.maxSize,
      minRuleThickness: this.minRuleThickness
    };
    return Object.assign(t, e), new R0(t);
  }
  /**
   * Return an options object with the given style. If `this.style === style`,
   * returns `this`.
   */
  havingStyle(e) {
    return this.style === e ? this : this.extend({
      style: e,
      size: An(this.textSize, e)
    });
  }
  /**
   * Return an options object with a cramped version of the current style. If
   * the current style is cramped, returns `this`.
   */
  havingCrampedStyle() {
    return this.havingStyle(this.style.cramp());
  }
  /**
   * Return an options object with the given size and in at least `\textstyle`.
   * Returns `this` if appropriate.
   */
  havingSize(e) {
    return this.size === e && this.textSize === e ? this : this.extend({
      style: this.style.text(),
      size: e,
      textSize: e,
      sizeMultiplier: Tn[e - 1]
    });
  }
  /**
   * Like `this.havingSize(BASESIZE).havingStyle(style)`. If `style` is omitted,
   * changes to at least `\textstyle`.
   */
  havingBaseStyle(e) {
    e = e || this.style.text();
    var t = An(R0.BASESIZE, e);
    return this.size === t && this.textSize === R0.BASESIZE && this.style === e ? this : this.extend({
      style: e,
      size: t
    });
  }
  /**
   * Remove the effect of sizing changes such as \Huge.
   * Keep the effect of the current style, such as \scriptstyle.
   */
  havingBaseSizing() {
    var e;
    switch (this.style.id) {
      case 4:
      case 5:
        e = 3;
        break;
      case 6:
      case 7:
        e = 1;
        break;
      default:
        e = 6;
    }
    return this.extend({
      style: this.style.text(),
      size: e
    });
  }
  /**
   * Create a new options object with the given color.
   */
  withColor(e) {
    return this.extend({
      color: e
    });
  }
  /**
   * Create a new options object with "phantom" set to true.
   */
  withPhantom() {
    return this.extend({
      phantom: !0
    });
  }
  /**
   * Creates a new options object with the given math font or old text font.
   * @type {[type]}
   */
  withFont(e) {
    return this.extend({
      font: e
    });
  }
  /**
   * Create a new options objects with the given fontFamily.
   */
  withTextFontFamily(e) {
    return this.extend({
      fontFamily: e,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  withTextFontWeight(e) {
    return this.extend({
      fontWeight: e,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  withTextFontShape(e) {
    return this.extend({
      fontShape: e,
      font: ""
    });
  }
  /**
   * Return the CSS sizing classes required to switch from enclosing options
   * `oldOptions` to `this`. Returns an array of classes.
   */
  sizingClasses(e) {
    return e.size !== this.size ? ["sizing", "reset-size" + e.size, "size" + this.size] : [];
  }
  /**
   * Return the CSS sizing classes required to switch to the base size. Like
   * `this.havingSize(BASESIZE).sizingClasses(this)`.
   */
  baseSizingClasses() {
    return this.size !== R0.BASESIZE ? ["sizing", "reset-size" + this.size, "size" + R0.BASESIZE] : [];
  }
  /**
   * Return the font metrics for this size.
   */
  fontMetrics() {
    return this._fontMetrics || (this._fontMetrics = Ms(this.size)), this._fontMetrics;
  }
  /**
   * Gets the CSS color of the current options object
   */
  getColor() {
    return this.phantom ? "transparent" : this.color;
  }
}
R0.BASESIZE = 6;
var Si = function(e) {
  return new R0({
    style: e.displayMode ? K.DISPLAY : K.TEXT,
    maxSize: e.maxSize,
    minRuleThickness: e.minRuleThickness
  });
}, ki = function(e, t) {
  if (t.displayMode) {
    var a = ["katex-display"];
    t.leqno && a.push("leqno"), t.fleqn && a.push("fleqn"), e = I(a, [e]);
  }
  return e;
}, $s = function(e, t, a) {
  var n = Si(a), i;
  if (a.output === "mathml")
    return Mn(e, t, n, a.displayMode, !0);
  if (a.output === "html") {
    var o = za(e, n);
    i = I(["katex"], [o]);
  } else {
    var u = Mn(e, t, n, a.displayMode, !1), d = za(e, n);
    i = I(["katex"], [u, d]);
  }
  return ki(i, a);
}, Ws = function(e, t, a) {
  var n = Si(a), i = za(e, n), o = I(["katex"], [i]);
  return ki(o, a);
}, Gs = {
  widehat: "^",
  widecheck: "ˇ",
  widetilde: "~",
  utilde: "~",
  overleftarrow: "←",
  underleftarrow: "←",
  xleftarrow: "←",
  overrightarrow: "→",
  underrightarrow: "→",
  xrightarrow: "→",
  underbrace: "⏟",
  overbrace: "⏞",
  underbracket: "⎵",
  overbracket: "⎴",
  overgroup: "⏠",
  undergroup: "⏡",
  overleftrightarrow: "↔",
  underleftrightarrow: "↔",
  xleftrightarrow: "↔",
  Overrightarrow: "⇒",
  xRightarrow: "⇒",
  overleftharpoon: "↼",
  xleftharpoonup: "↼",
  overrightharpoon: "⇀",
  xrightharpoonup: "⇀",
  xLeftarrow: "⇐",
  xLeftrightarrow: "⇔",
  xhookleftarrow: "↩",
  xhookrightarrow: "↪",
  xmapsto: "↦",
  xrightharpoondown: "⇁",
  xleftharpoondown: "↽",
  xrightleftharpoons: "⇌",
  xleftrightharpoons: "⇋",
  xtwoheadleftarrow: "↞",
  xtwoheadrightarrow: "↠",
  xlongequal: "=",
  xtofrom: "⇄",
  xrightleftarrows: "⇄",
  xrightequilibrium: "⇌",
  // Not a perfect match.
  xleftequilibrium: "⇋",
  // None better available.
  "\\cdrightarrow": "→",
  "\\cdleftarrow": "←",
  "\\cdlongequal": "="
}, Br = function(e) {
  var t = new R("mo", [new Te(Gs[e.replace(/^\\/, "")])]);
  return t.setAttribute("stretchy", "true"), t;
}, _s = {
  //   path(s), minWidth, height, align
  overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"],
  "\\cdrightarrow": [["rightarrow"], 3, 522, "xMaxYMin"],
  // CD minwwidth2.5pc
  xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"],
  "\\cdleftarrow": [["leftarrow"], 3, 522, "xMinYMin"],
  Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"],
  xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"],
  xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"],
  overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"],
  overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"],
  xlongequal: [["longequal"], 0.888, 334, "xMinYMin"],
  "\\cdlongequal": [["longequal"], 3, 334, "xMinYMin"],
  xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"],
  xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"],
  overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548],
  underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548],
  underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522],
  xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560],
  xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716],
  xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716],
  xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522],
  xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522],
  overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  overbracket: [["leftbracketover", "rightbracketover"], 1.6, 440],
  underbracket: [["leftbracketunder", "rightbracketunder"], 1.6, 410],
  overgroup: [["leftgroup", "rightgroup"], 0.888, 342],
  undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342],
  xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522],
  xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528],
  // The next three arrows are from the mhchem package.
  // In mhchem.sty, min-length is 2.0em. But these arrows might appear in the
  // document as \xrightarrow or \xrightleftharpoons. Those have
  // min-length = 1.75em, so we set min-length on these next three to match.
  xrightleftarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901],
  xrightequilibrium: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716],
  xleftequilibrium: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716]
}, js = /* @__PURE__ */ new Set(["widehat", "widecheck", "widetilde", "utilde"]), Ir = function(e, t) {
  function a() {
    var u = 4e5, d = e.label.slice(1);
    if (js.has(d)) {
      var p = e, b = p.base.type === "ordgroup" ? p.base.body.length : 1, w, S, k;
      if (b > 5)
        d === "widehat" || d === "widecheck" ? (w = 420, u = 2364, k = 0.42, S = d + "4") : (w = 312, u = 2340, k = 0.34, S = "tilde4");
      else {
        var A = [1, 1, 2, 2, 3, 3][b];
        d === "widehat" || d === "widecheck" ? (u = [0, 1062, 2364, 2364, 2364][A], w = [0, 239, 300, 360, 420][A], k = [0, 0.24, 0.3, 0.3, 0.36, 0.42][A], S = d + A) : (u = [0, 600, 1033, 2339, 2340][A], w = [0, 260, 286, 306, 312][A], k = [0, 0.26, 0.286, 0.3, 0.306, 0.34][A], S = "tilde" + A);
      }
      var z = new Z0(S), D = new O0([z], {
        width: "100%",
        height: q(k),
        viewBox: "0 0 " + u + " " + w,
        preserveAspectRatio: "none"
      });
      return {
        span: J0([], [D], t),
        minWidth: 0,
        height: k
      };
    } else {
      var O = [], $ = _s[d], [P, G, W] = $, V = W / 1e3, Y = P.length, ie, re;
      if (Y === 1) {
        var U = $[3];
        ie = ["hide-tail"], re = [U];
      } else if (Y === 2)
        ie = ["halfarrow-left", "halfarrow-right"], re = ["xMinYMin", "xMaxYMin"];
      else if (Y === 3)
        ie = ["brace-left", "brace-center", "brace-right"], re = ["xMinYMin", "xMidYMin", "xMaxYMin"];
      else
        throw new Error(`Correct katexImagesData or update code here to support
                    ` + Y + " children.");
      for (var J = 0; J < Y; J++) {
        var Q = new Z0(P[J]), ze = new O0([Q], {
          width: "400em",
          height: q(V),
          viewBox: "0 0 " + u + " " + W,
          preserveAspectRatio: re[J] + " slice"
        }), ce = J0([ie[J]], [ze], t);
        if (Y === 1)
          return {
            span: ce,
            minWidth: G,
            height: V
          };
        ce.style.height = q(V), O.push(ce);
      }
      return {
        span: I(["stretchy"], O, t),
        minWidth: G,
        height: V
      };
    }
  }
  var {
    span: n,
    minWidth: i,
    height: o
  } = a();
  return n.height = o, n.style.height = q(o), i > 0 && (n.style.minWidth = q(i)), n;
}, Us = function(e, t, a, n, i) {
  var o, u = e.height + e.depth + a + n;
  if (/fbox|color|angl/.test(t)) {
    if (o = I(["stretchy", t], [], i), t === "fbox") {
      var d = i.color && i.getColor();
      d && (o.style.borderColor = d);
    }
  } else {
    var p = [];
    /^[bx]cancel$/.test(t) && p.push(new wa({
      x1: "0",
      y1: "0",
      x2: "100%",
      y2: "100%",
      "stroke-width": "0.046em"
    })), /^x?cancel$/.test(t) && p.push(new wa({
      x1: "0",
      y1: "100%",
      x2: "100%",
      y2: "0",
      "stroke-width": "0.046em"
    }));
    var b = new O0(p, {
      width: "100%",
      height: q(u)
    });
    o = J0([], [b], i);
  }
  return o.height = u, o.style.height = q(u), o;
};
function te(r, e) {
  if (!r || r.type !== e)
    throw new Error("Expected node of type " + e + ", but got " + (r ? "node of type " + r.type : String(r)));
  return r;
}
function Er(r) {
  var e = Rr(r);
  if (!e)
    throw new Error("Expected node of symbol group type, but got " + (r ? "node of type " + r.type : String(r)));
  return e;
}
function Rr(r) {
  return r && (r.type === "atom" || As.hasOwnProperty(r.type)) ? r : null;
}
var Mi = (r) => {
  if (r instanceof r0)
    return r;
  if (Ss(r) && r.children.length === 1)
    return Mi(r.children[0]);
}, Wa = (r, e) => {
  var t, a, n;
  r && r.type === "supsub" ? (a = te(r.base, "accent"), t = a.base, r.base = t, n = ws(ue(r, e)), r.base = a) : (a = te(r, "accent"), t = a.base);
  var i = ue(t, e.havingCrampedStyle()), o = a.isShifty && L0(t), u = 0;
  if (o) {
    var d, p;
    u = (d = (p = Mi(i)) == null ? void 0 : p.skew) != null ? d : 0;
  }
  var b = a.label === "\\c", w = b ? i.height + i.depth : Math.min(i.height, e.fontMetrics().xHeight), S;
  if (a.isStretchy)
    S = Ir(a, e), S = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: i
      }, {
        type: "elem",
        elem: S,
        wrapperClasses: ["svg-align"],
        wrapperStyle: u > 0 ? {
          width: "calc(100% - " + q(2 * u) + ")",
          marginLeft: q(2 * u)
        } : void 0
      }]
    });
  else {
    var k, A;
    a.label === "\\vec" ? (k = vi("vec", e), A = gi.vec[1]) : (k = Cr({
      mode: a.mode,
      text: a.label
    }, e, "textord"), k = xs(k), k.italic = 0, A = k.width, b && (w += k.depth)), S = I(["accent-body"], [k]);
    var z = a.label === "\\textcircled";
    z && (S.classes.push("accent-full"), w = i.height);
    var D = u;
    z || (D -= A / 2), S.style.left = q(D), a.label === "\\textcircled" && (S.style.top = ".2em"), S = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: i
      }, {
        type: "kern",
        size: -w
      }, {
        type: "elem",
        elem: S
      }]
    });
  }
  var O = I(["mord", "accent"], [S], e);
  return n ? (n.children[0] = O, n.height = Math.max(O.height, n.height), n.classes[0] = "mord", n) : O;
}, Ti = (r, e) => {
  var t = r.isStretchy ? Br(r.label) : new R("mo", [u0(r.label, r.mode)]), a = new R("mover", [pe(r.base, e), t]);
  return a.setAttribute("accent", "true"), a;
}, Vs = new RegExp(["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring"].map((r) => "\\" + r).join("|"));
H({
  type: "accent",
  names: ["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring", "\\widecheck", "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow", "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup", "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon"],
  props: {
    numArgs: 1
  },
  handler: (r, e) => {
    var t = Tr(e[0]), a = !Vs.test(r.funcName), n = !a || r.funcName === "\\widehat" || r.funcName === "\\widetilde" || r.funcName === "\\widecheck";
    return {
      type: "accent",
      mode: r.parser.mode,
      label: r.funcName,
      isStretchy: a,
      isShifty: n,
      base: t
    };
  },
  htmlBuilder: Wa,
  mathmlBuilder: Ti
});
H({
  type: "accent",
  names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"', "\\c", "\\r", "\\H", "\\v", "\\textcircled"],
  props: {
    numArgs: 1,
    allowedInText: !0,
    allowedInMath: !0,
    // unless in strict mode
    argTypes: ["primitive"]
  },
  handler: (r, e) => {
    var t = e[0], a = r.parser.mode;
    return a === "math" && (r.parser.settings.reportNonstrict("mathVsTextAccents", "LaTeX's accent " + r.funcName + " works only in text mode"), a = "text"), {
      type: "accent",
      mode: a,
      label: r.funcName,
      isStretchy: !1,
      isShifty: !0,
      base: t
    };
  },
  htmlBuilder: Wa,
  mathmlBuilder: Ti
});
H({
  type: "accentUnder",
  names: ["\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow", "\\undergroup", "\\underlinesegment", "\\utilde"],
  props: {
    numArgs: 1
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "accentUnder",
      mode: t.mode,
      label: a,
      base: n
    };
  },
  htmlBuilder: (r, e) => {
    var t = ue(r.base, e), a = Ir(r, e), n = r.label === "\\utilde" ? 0.12 : 0, i = oe({
      positionType: "top",
      positionData: t.height,
      children: [{
        type: "elem",
        elem: a,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: n
      }, {
        type: "elem",
        elem: t
      }]
    });
    return I(["mord", "accentunder"], [i], e);
  },
  mathmlBuilder: (r, e) => {
    var t = Br(r.label), a = new R("munder", [pe(r.base, e), t]);
    return a.setAttribute("accentunder", "true"), a;
  }
});
var hr = (r) => {
  var e = new R("mpadded", r ? [r] : []);
  return e.setAttribute("width", "+0.6em"), e.setAttribute("lspace", "0.3em"), e;
};
H({
  type: "xArrow",
  names: [
    "\\xleftarrow",
    "\\xrightarrow",
    "\\xLeftarrow",
    "\\xRightarrow",
    "\\xleftrightarrow",
    "\\xLeftrightarrow",
    "\\xhookleftarrow",
    "\\xhookrightarrow",
    "\\xmapsto",
    "\\xrightharpoondown",
    "\\xrightharpoonup",
    "\\xleftharpoondown",
    "\\xleftharpoonup",
    "\\xrightleftharpoons",
    "\\xleftrightharpoons",
    "\\xlongequal",
    "\\xtwoheadrightarrow",
    "\\xtwoheadleftarrow",
    "\\xtofrom",
    // The next 3 functions are here to support the mhchem extension.
    // Direct use of these functions is discouraged and may break someday.
    "\\xrightleftarrows",
    "\\xrightequilibrium",
    "\\xleftequilibrium",
    // The next 3 functions are here only to support the {CD} environment.
    "\\\\cdrightarrow",
    "\\\\cdleftarrow",
    "\\\\cdlongequal"
  ],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler(r, e, t) {
    var {
      parser: a,
      funcName: n
    } = r;
    return {
      type: "xArrow",
      mode: a.mode,
      label: n,
      body: e[0],
      below: t[0]
    };
  },
  htmlBuilder(r, e) {
    var t = e.style, a = e.havingStyle(t.sup()), n = wt(ue(r.body, a, e), e), i = r.label.slice(0, 2) === "\\x" ? "x" : "cd";
    n.classes.push(i + "-arrow-pad");
    var o;
    r.below && (a = e.havingStyle(t.sub()), o = wt(ue(r.below, a, e), e), o.classes.push(i + "-arrow-pad"));
    var u = Ir(r, e), d = -e.fontMetrics().axisHeight + 0.5 * u.height, p = -e.fontMetrics().axisHeight - 0.5 * u.height - 0.111;
    (n.depth > 0.25 || r.label === "\\xleftequilibrium") && (p -= n.depth);
    var b;
    if (o) {
      var w = -e.fontMetrics().axisHeight + o.height + 0.5 * u.height + 0.111;
      b = oe({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: n,
          shift: p
        }, {
          type: "elem",
          elem: u,
          shift: d
        }, {
          type: "elem",
          elem: o,
          shift: w
        }]
      });
    } else
      b = oe({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: n,
          shift: p
        }, {
          type: "elem",
          elem: u,
          shift: d
        }]
      });
    return b.children[0].children[0].children[1].classes.push("svg-align"), I(["mrel", "x-arrow"], [b], e);
  },
  mathmlBuilder(r, e) {
    var t = Br(r.label);
    t.setAttribute("minsize", r.label.charAt(0) === "x" ? "1.75em" : "3.0em");
    var a;
    if (r.body) {
      var n = hr(pe(r.body, e));
      if (r.below) {
        var i = hr(pe(r.below, e));
        a = new R("munderover", [t, i, n]);
      } else
        a = new R("mover", [t, n]);
    } else if (r.below) {
      var o = hr(pe(r.below, e));
      a = new R("munder", [t, o]);
    } else
      a = hr(), a = new R("mover", [t, a]);
    return a;
  }
});
function Ai(r, e) {
  var t = Ie(r.body, e, !0);
  return I([r.mclass], t, e);
}
function zi(r, e) {
  var t, a = n0(r.body, e);
  return r.mclass === "minner" ? t = new R("mpadded", a) : r.mclass === "mord" ? r.isCharacterBox ? (t = a[0], t.type = "mi") : t = new R("mi", a) : (r.isCharacterBox ? (t = a[0], t.type = "mo") : t = new R("mo", a), r.mclass === "mbin" ? (t.attributes.lspace = "0.22em", t.attributes.rspace = "0.22em") : r.mclass === "mpunct" ? (t.attributes.lspace = "0em", t.attributes.rspace = "0.17em") : r.mclass === "mopen" || r.mclass === "mclose" ? (t.attributes.lspace = "0em", t.attributes.rspace = "0em") : r.mclass === "minner" && (t.attributes.lspace = "0.0556em", t.attributes.width = "+0.1111em")), t;
}
H({
  type: "mclass",
  names: ["\\mathord", "\\mathbin", "\\mathrel", "\\mathopen", "\\mathclose", "\\mathpunct", "\\mathinner"],
  props: {
    numArgs: 1,
    primitive: !0
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "mclass",
      mode: t.mode,
      mclass: "m" + a.slice(5),
      // TODO(kevinb): don't prefix with 'm'
      body: Me(n),
      isCharacterBox: L0(n)
    };
  },
  htmlBuilder: Ai,
  mathmlBuilder: zi
});
var Dr = (r) => {
  var e = r.type === "ordgroup" && r.body.length ? r.body[0] : r;
  return e.type === "atom" && (e.family === "bin" || e.family === "rel") ? "m" + e.family : "mord";
};
H({
  type: "mclass",
  names: ["\\@binrel"],
  props: {
    numArgs: 2
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "mclass",
      mode: t.mode,
      mclass: Dr(e[0]),
      body: Me(e[1]),
      isCharacterBox: L0(e[1])
    };
  }
});
H({
  type: "mclass",
  names: ["\\stackrel", "\\overset", "\\underset"],
  props: {
    numArgs: 2
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = e[1], i = e[0], o;
    a !== "\\stackrel" ? o = Dr(n) : o = "mrel";
    var u = {
      type: "op",
      mode: n.mode,
      limits: !0,
      alwaysHandleSupSub: !0,
      parentIsSupSub: !1,
      symbol: !1,
      suppressBaseShift: a !== "\\stackrel",
      body: Me(n)
    }, d = {
      type: "supsub",
      mode: i.mode,
      base: u,
      sup: a === "\\underset" ? null : i,
      sub: a === "\\underset" ? i : null
    };
    return {
      type: "mclass",
      mode: t.mode,
      mclass: o,
      body: [d],
      isCharacterBox: L0(d)
    };
  },
  htmlBuilder: Ai,
  mathmlBuilder: zi
});
H({
  type: "pmb",
  names: ["\\pmb"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "pmb",
      mode: t.mode,
      mclass: Dr(e[0]),
      body: Me(e[0])
    };
  },
  htmlBuilder(r, e) {
    var t = Ie(r.body, e, !0), a = I([r.mclass], t, e);
    return a.style.textShadow = "0.02em 0.01em 0.04px", a;
  },
  mathmlBuilder(r, e) {
    var t = n0(r.body, e), a = new R("mstyle", t);
    return a.setAttribute("style", "text-shadow: 0.02em 0.01em 0.04px"), a;
  }
});
var Ys = {
  ">": "\\\\cdrightarrow",
  "<": "\\\\cdleftarrow",
  "=": "\\\\cdlongequal",
  A: "\\uparrow",
  V: "\\downarrow",
  "|": "\\Vert",
  ".": "no arrow"
}, zn = () => ({
  type: "styling",
  body: [],
  mode: "math",
  style: "display"
}), Cn = (r) => r.type === "textord" && r.text === "@", Xs = (r, e) => (r.type === "mathord" || r.type === "atom") && r.text === e;
function Ks(r, e, t) {
  var a = Ys[r];
  switch (a) {
    case "\\\\cdrightarrow":
    case "\\\\cdleftarrow":
      return t.callFunction(a, [e[0]], [e[1]]);
    case "\\uparrow":
    case "\\downarrow": {
      var n = t.callFunction("\\\\cdleft", [e[0]], []), i = {
        type: "atom",
        text: a,
        mode: "math",
        family: "rel"
      }, o = t.callFunction("\\Big", [i], []), u = t.callFunction("\\\\cdright", [e[1]], []), d = {
        type: "ordgroup",
        mode: "math",
        body: [n, o, u]
      };
      return t.callFunction("\\\\cdparent", [d], []);
    }
    case "\\\\cdlongequal":
      return t.callFunction("\\\\cdlongequal", [], []);
    case "\\Vert": {
      var p = {
        type: "textord",
        text: "\\Vert",
        mode: "math"
      };
      return t.callFunction("\\Big", [p], []);
    }
    default:
      return {
        type: "textord",
        text: " ",
        mode: "math"
      };
  }
}
function Zs(r) {
  var e = [];
  for (r.gullet.beginGroup(), r.gullet.macros.set("\\cr", "\\\\\\relax"), r.gullet.beginGroup(); ; ) {
    e.push(r.parseExpression(!1, "\\\\")), r.gullet.endGroup(), r.gullet.beginGroup();
    var t = r.fetch().text;
    if (t === "&" || t === "\\\\")
      r.consume();
    else if (t === "\\end") {
      e[e.length - 1].length === 0 && e.pop();
      break;
    } else
      throw new E("Expected \\\\ or \\cr or \\end", r.nextToken);
  }
  for (var a = [], n = [a], i = 0; i < e.length; i++) {
    for (var o = e[i], u = zn(), d = 0; d < o.length; d++)
      if (!Cn(o[d]))
        u.body.push(o[d]);
      else {
        a.push(u), d += 1;
        var p = Er(o[d]).text, b = new Array(2);
        if (b[0] = {
          type: "ordgroup",
          mode: "math",
          body: []
        }, b[1] = {
          type: "ordgroup",
          mode: "math",
          body: []
        }, !"=|.".includes(p)) if ("<>AV".includes(p))
          for (var w = 0; w < 2; w++) {
            for (var S = !0, k = d + 1; k < o.length; k++) {
              if (Xs(o[k], p)) {
                S = !1, d = k;
                break;
              }
              if (Cn(o[k]))
                throw new E("Missing a " + p + " character to complete a CD arrow.", o[k]);
              b[w].body.push(o[k]);
            }
            if (S)
              throw new E("Missing a " + p + " character to complete a CD arrow.", o[d]);
          }
        else
          throw new E('Expected one of "<>AV=|." after @', o[d]);
        var A = Ks(p, b, r), z = {
          type: "styling",
          body: [A],
          mode: "math",
          style: "display"
          // CD is always displaystyle.
        };
        a.push(z), u = zn();
      }
    i % 2 === 0 ? a.push(u) : a.shift(), a = [], n.push(a);
  }
  r.gullet.endGroup(), r.gullet.endGroup();
  var D = new Array(n[0].length).fill({
    type: "align",
    align: "c",
    pregap: 0.25,
    // CD package sets \enskip between columns.
    postgap: 0.25
    // So pre and post each get half an \enskip, i.e. 0.25em.
  });
  return {
    type: "array",
    mode: "math",
    body: n,
    arraystretch: 1,
    addJot: !0,
    rowGaps: [null],
    cols: D,
    colSeparationType: "CD",
    hLinesBeforeRow: new Array(n.length + 1).fill([])
  };
}
H({
  type: "cdlabel",
  names: ["\\\\cdleft", "\\\\cdright"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r;
    return {
      type: "cdlabel",
      mode: t.mode,
      side: a.slice(4),
      label: e[0]
    };
  },
  htmlBuilder(r, e) {
    var t = e.havingStyle(e.style.sup()), a = wt(ue(r.label, t, e), e);
    return a.classes.push("cd-label-" + r.side), a.style.bottom = q(0.8 - a.depth), a.height = 0, a.depth = 0, a;
  },
  mathmlBuilder(r, e) {
    var t = new R("mrow", [pe(r.label, e)]);
    return t = new R("mpadded", [t]), t.setAttribute("width", "0"), r.side === "left" && t.setAttribute("lspace", "-1width"), t.setAttribute("voffset", "0.7em"), t = new R("mstyle", [t]), t.setAttribute("displaystyle", "false"), t.setAttribute("scriptlevel", "1"), t;
  }
});
H({
  type: "cdlabelparent",
  names: ["\\\\cdparent"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "cdlabelparent",
      mode: t.mode,
      fragment: e[0]
    };
  },
  htmlBuilder(r, e) {
    var t = wt(ue(r.fragment, e), e);
    return t.classes.push("cd-vert-arrow"), t;
  },
  mathmlBuilder(r, e) {
    return new R("mrow", [pe(r.fragment, e)]);
  }
});
H({
  type: "textord",
  names: ["\\@char"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler(r, e) {
    for (var {
      parser: t
    } = r, a = te(e[0], "ordgroup"), n = a.body, i = "", o = 0; o < n.length; o++) {
      var u = te(n[o], "textord");
      i += u.text;
    }
    var d = parseInt(i), p;
    if (isNaN(d))
      throw new E("\\@char has non-numeric argument " + i);
    if (d < 0 || d >= 1114111)
      throw new E("\\@char with invalid code point " + i);
    return d <= 65535 ? p = String.fromCharCode(d) : (d -= 65536, p = String.fromCharCode((d >> 10) + 55296, (d & 1023) + 56320)), {
      type: "textord",
      mode: t.mode,
      text: p
    };
  }
});
var Ci = (r, e) => {
  var t = Ie(r.body, e.withColor(r.color), !1);
  return N0(t);
}, Bi = (r, e) => {
  var t = n0(r.body, e.withColor(r.color)), a = new R("mstyle", t);
  return a.setAttribute("mathcolor", r.color), a;
};
H({
  type: "color",
  names: ["\\textcolor"],
  props: {
    numArgs: 2,
    allowedInText: !0,
    argTypes: ["color", "original"]
  },
  handler(r, e) {
    var {
      parser: t
    } = r, a = te(e[0], "color-token").color, n = e[1];
    return {
      type: "color",
      mode: t.mode,
      color: a,
      body: Me(n)
    };
  },
  htmlBuilder: Ci,
  mathmlBuilder: Bi
});
H({
  type: "color",
  names: ["\\color"],
  props: {
    numArgs: 1,
    allowedInText: !0,
    argTypes: ["color"]
  },
  handler(r, e) {
    var {
      parser: t,
      breakOnTokenText: a
    } = r, n = te(e[0], "color-token").color;
    t.gullet.macros.set("\\current@color", n);
    var i = t.parseExpression(!0, a);
    return {
      type: "color",
      mode: t.mode,
      color: n,
      body: i
    };
  },
  htmlBuilder: Ci,
  mathmlBuilder: Bi
});
H({
  type: "cr",
  names: ["\\\\"],
  props: {
    numArgs: 0,
    numOptionalArgs: 0,
    allowedInText: !0
  },
  handler(r, e, t) {
    var {
      parser: a
    } = r, n = a.gullet.future().text === "[" ? a.parseSizeGroup(!0) : null, i = !a.settings.displayMode || !a.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline does nothing in display mode");
    return {
      type: "cr",
      mode: a.mode,
      newLine: i,
      size: n && te(n, "size").value
    };
  },
  // The following builders are called only at the top level,
  // not within tabular/array environments.
  htmlBuilder(r, e) {
    var t = I(["mspace"], [], e);
    return r.newLine && (t.classes.push("newline"), r.size && (t.style.marginTop = q(we(r.size, e)))), t;
  },
  mathmlBuilder(r, e) {
    var t = new R("mspace");
    return r.newLine && (t.setAttribute("linebreak", "newline"), r.size && t.setAttribute("height", q(we(r.size, e)))), t;
  }
});
var Ca = {
  "\\global": "\\global",
  "\\long": "\\\\globallong",
  "\\\\globallong": "\\\\globallong",
  "\\def": "\\gdef",
  "\\gdef": "\\gdef",
  "\\edef": "\\xdef",
  "\\xdef": "\\xdef",
  "\\let": "\\\\globallet",
  "\\futurelet": "\\\\globalfuture"
}, Ii = (r) => {
  var e = r.text;
  if (/^(?:[\\{}$&#^_]|EOF)$/.test(e))
    throw new E("Expected a control sequence", r);
  return e;
}, Js = (r) => {
  var e = r.gullet.popToken();
  return e.text === "=" && (e = r.gullet.popToken(), e.text === " " && (e = r.gullet.popToken())), e;
}, Ei = (r, e, t, a) => {
  var n = r.gullet.macros.get(t.text);
  n == null && (t.noexpand = !0, n = {
    tokens: [t],
    numArgs: 0,
    // reproduce the same behavior in expansion
    unexpandable: !r.gullet.isExpandable(t.text)
  }), r.gullet.macros.set(e, n, a);
};
H({
  type: "internal",
  names: [
    "\\global",
    "\\long",
    "\\\\globallong"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r;
    e.consumeSpaces();
    var a = e.fetch();
    if (Ca[a.text])
      return (t === "\\global" || t === "\\\\globallong") && (a.text = Ca[a.text]), te(e.parseFunction(), "internal");
    throw new E("Invalid token after macro prefix", a);
  }
});
H({
  type: "internal",
  names: ["\\def", "\\gdef", "\\edef", "\\xdef"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    primitive: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r, a = e.gullet.popToken(), n = a.text;
    if (/^(?:[\\{}$&#^_]|EOF)$/.test(n))
      throw new E("Expected a control sequence", a);
    for (var i = 0, o, u = [[]]; e.gullet.future().text !== "{"; )
      if (a = e.gullet.popToken(), a.text === "#") {
        if (e.gullet.future().text === "{") {
          o = e.gullet.future(), u[i].push("{");
          break;
        }
        if (a = e.gullet.popToken(), !/^[1-9]$/.test(a.text))
          throw new E('Invalid argument number "' + a.text + '"');
        if (parseInt(a.text) !== i + 1)
          throw new E('Argument number "' + a.text + '" out of order');
        i++, u.push([]);
      } else {
        if (a.text === "EOF")
          throw new E("Expected a macro definition");
        u[i].push(a.text);
      }
    var {
      tokens: d
    } = e.gullet.consumeArg();
    return o && d.unshift(o), (t === "\\edef" || t === "\\xdef") && (d = e.gullet.expandTokens(d), d.reverse()), e.gullet.macros.set(n, {
      tokens: d,
      numArgs: i,
      delimiters: u
    }, t === Ca[t]), {
      type: "internal",
      mode: e.mode
    };
  }
});
H({
  type: "internal",
  names: [
    "\\let",
    "\\\\globallet"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: !0,
    primitive: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r, a = Ii(e.gullet.popToken());
    e.gullet.consumeSpaces();
    var n = Js(e);
    return Ei(e, a, n, t === "\\\\globallet"), {
      type: "internal",
      mode: e.mode
    };
  }
});
H({
  type: "internal",
  names: [
    "\\futurelet",
    "\\\\globalfuture"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: !0,
    primitive: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r, a = Ii(e.gullet.popToken()), n = e.gullet.popToken(), i = e.gullet.popToken();
    return Ei(e, a, i, t === "\\\\globalfuture"), e.gullet.pushToken(i), e.gullet.pushToken(n), {
      type: "internal",
      mode: e.mode
    };
  }
});
var Dt = function(e, t, a) {
  var n = be.math[e] && be.math[e].replace, i = Ha(n || e, t, a);
  if (!i)
    throw new Error("Unsupported symbol " + e + " and font size " + t + ".");
  return i;
}, Ga = function(e, t, a, n) {
  var i = a.havingBaseStyle(t), o = I(n.concat(i.sizingClasses(a)), [e], a), u = i.sizeMultiplier / a.sizeMultiplier;
  return o.height *= u, o.depth *= u, o.maxFontSize = i.sizeMultiplier, o;
}, Ri = function(e, t, a) {
  var n = t.havingBaseStyle(a), i = (1 - t.sizeMultiplier / n.sizeMultiplier) * t.fontMetrics().axisHeight;
  e.classes.push("delimcenter"), e.style.top = q(i), e.height -= i, e.depth += i;
}, Qs = function(e, t, a, n, i, o) {
  var u = je(e, "Main-Regular", i, n), d = Ga(u, t, n, o);
  return Ri(d, n, t), d;
}, eo = function(e, t, a, n) {
  return je(e, "Size" + t + "-Regular", a, n);
}, Di = function(e, t, a, n, i, o) {
  var u = eo(e, t, i, n), d = Ga(I(["delimsizing", "size" + t], [u], n), K.TEXT, n, o);
  return a && Ri(d, n, K.TEXT), d;
}, ta = function(e, t, a) {
  var n;
  t === "Size1-Regular" ? n = "delim-size1" : n = "delim-size4";
  var i = I(["delimsizinginner", n], [I([], [je(e, t, a)])]);
  return {
    type: "elem",
    elem: i
  };
}, ra = function(e, t, a) {
  var n = k0["Size4-Regular"][e.charCodeAt(0)] ? k0["Size4-Regular"][e.charCodeAt(0)][4] : k0["Size1-Regular"][e.charCodeAt(0)][4], i = new Z0("inner", ps(e, Math.round(1e3 * t))), o = new O0([i], {
    width: q(n),
    height: q(t),
    // Override CSS rule `.katex svg { width: 100% }`
    style: "width:" + q(n),
    viewBox: "0 0 " + 1e3 * n + " " + Math.round(1e3 * t),
    preserveAspectRatio: "xMinYMin"
  }), u = J0([], [o], a);
  return u.height = t, u.style.height = q(t), u.style.width = q(n), {
    type: "elem",
    elem: u
  };
}, Ba = 8e-3, mr = {
  type: "kern",
  size: -1 * Ba
}, to = /* @__PURE__ */ new Set(["|", "\\lvert", "\\rvert", "\\vert"]), ro = /* @__PURE__ */ new Set(["\\|", "\\lVert", "\\rVert", "\\Vert"]), qi = function(e, t, a, n, i, o) {
  var u, d, p, b, w = "", S = 0;
  u = p = b = e, d = null;
  var k = "Size1-Regular";
  e === "\\uparrow" ? p = b = "⏐" : e === "\\Uparrow" ? p = b = "‖" : e === "\\downarrow" ? u = p = "⏐" : e === "\\Downarrow" ? u = p = "‖" : e === "\\updownarrow" ? (u = "\\uparrow", p = "⏐", b = "\\downarrow") : e === "\\Updownarrow" ? (u = "\\Uparrow", p = "‖", b = "\\Downarrow") : to.has(e) ? (p = "∣", w = "vert", S = 333) : ro.has(e) ? (p = "∥", w = "doublevert", S = 556) : e === "[" || e === "\\lbrack" ? (u = "⎡", p = "⎢", b = "⎣", k = "Size4-Regular", w = "lbrack", S = 667) : e === "]" || e === "\\rbrack" ? (u = "⎤", p = "⎥", b = "⎦", k = "Size4-Regular", w = "rbrack", S = 667) : e === "\\lfloor" || e === "⌊" ? (p = u = "⎢", b = "⎣", k = "Size4-Regular", w = "lfloor", S = 667) : e === "\\lceil" || e === "⌈" ? (u = "⎡", p = b = "⎢", k = "Size4-Regular", w = "lceil", S = 667) : e === "\\rfloor" || e === "⌋" ? (p = u = "⎥", b = "⎦", k = "Size4-Regular", w = "rfloor", S = 667) : e === "\\rceil" || e === "⌉" ? (u = "⎤", p = b = "⎥", k = "Size4-Regular", w = "rceil", S = 667) : e === "(" || e === "\\lparen" ? (u = "⎛", p = "⎜", b = "⎝", k = "Size4-Regular", w = "lparen", S = 875) : e === ")" || e === "\\rparen" ? (u = "⎞", p = "⎟", b = "⎠", k = "Size4-Regular", w = "rparen", S = 875) : e === "\\{" || e === "\\lbrace" ? (u = "⎧", d = "⎨", b = "⎩", p = "⎪", k = "Size4-Regular") : e === "\\}" || e === "\\rbrace" ? (u = "⎫", d = "⎬", b = "⎭", p = "⎪", k = "Size4-Regular") : e === "\\lgroup" || e === "⟮" ? (u = "⎧", b = "⎩", p = "⎪", k = "Size4-Regular") : e === "\\rgroup" || e === "⟯" ? (u = "⎫", b = "⎭", p = "⎪", k = "Size4-Regular") : e === "\\lmoustache" || e === "⎰" ? (u = "⎧", b = "⎭", p = "⎪", k = "Size4-Regular") : (e === "\\rmoustache" || e === "⎱") && (u = "⎫", b = "⎩", p = "⎪", k = "Size4-Regular");
  var A = Dt(u, k, i), z = A.height + A.depth, D = Dt(p, k, i), O = D.height + D.depth, $ = Dt(b, k, i), P = $.height + $.depth, G = 0, W = 1;
  if (d !== null) {
    var V = Dt(d, k, i);
    G = V.height + V.depth, W = 2;
  }
  var Y = z + P + G, ie = Math.max(0, Math.ceil((t - Y) / (W * O))), re = Y + ie * W * O, U = n.fontMetrics().axisHeight;
  a && (U *= n.sizeMultiplier);
  var J = re / 2 - U, Q = [];
  if (w.length > 0) {
    var ze = re - z - P, ce = Math.round(re * 1e3), Ce = fs(w, Math.round(ze * 1e3)), Ee = new Z0(w, Ce), He = q(S / 1e3), Ne = q(ce / 1e3), $e = new O0([Ee], {
      width: He,
      height: Ne,
      viewBox: "0 0 " + S + " " + ce
    }), Ye = J0([], [$e], n);
    Ye.height = ce / 1e3, Ye.style.width = He, Ye.style.height = Ne, Q.push({
      type: "elem",
      elem: Ye
    });
  } else {
    if (Q.push(ta(b, k, i)), Q.push(mr), d === null) {
      var de = re - z - P + 2 * Ba;
      Q.push(ra(p, de, n));
    } else {
      var i0 = (re - z - P - G) / 2 + 2 * Ba;
      Q.push(ra(p, i0, n)), Q.push(mr), Q.push(ta(d, k, i)), Q.push(mr), Q.push(ra(p, i0, n));
    }
    Q.push(mr), Q.push(ta(u, k, i));
  }
  var ke = n.havingBaseStyle(K.TEXT), z0 = oe({
    positionType: "bottom",
    positionData: J,
    children: Q
  });
  return Ga(I(["delimsizing", "mult"], [z0], ke), K.TEXT, n, o);
}, aa = 80, na = 0.08, ia = function(e, t, a, n, i) {
  var o = ms(e, n, a), u = new Z0(e, o), d = new O0([u], {
    // Note: 1000:1 ratio of viewBox to document em width.
    width: "400em",
    height: q(t),
    viewBox: "0 0 400000 " + a,
    preserveAspectRatio: "xMinYMin slice"
  });
  return J0(["hide-tail"], [d], i);
}, ao = function(e, t) {
  var a = t.havingBaseSizing(), n = Fi("\\surd", e * a.sizeMultiplier, Ni, a), i = a.sizeMultiplier, o = Math.max(0, t.minRuleThickness - t.fontMetrics().sqrtRuleThickness), u, d = 0, p = 0, b = 0, w;
  return n.type === "small" ? (b = 1e3 + 1e3 * o + aa, e < 1 ? i = 1 : e < 1.4 && (i = 0.7), d = (1 + o + na) / i, p = (1 + o) / i, u = ia("sqrtMain", d, b, o, t), u.style.minWidth = "0.853em", w = 0.833 / i) : n.type === "large" ? (b = (1e3 + aa) * Ot[n.size], p = (Ot[n.size] + o) / i, d = (Ot[n.size] + o + na) / i, u = ia("sqrtSize" + n.size, d, b, o, t), u.style.minWidth = "1.02em", w = 1 / i) : (d = e + o + na, p = e + o, b = Math.floor(1e3 * e + o) + aa, u = ia("sqrtTall", d, b, o, t), u.style.minWidth = "0.742em", w = 1.056), u.height = p, u.style.height = q(d), {
    span: u,
    advanceWidth: w,
    // Calculate the actual line width.
    // This actually should depend on the chosen font -- e.g. \boldmath
    // should use the thicker surd symbols from e.g. KaTeX_Main-Bold, and
    // have thicker rules.
    ruleWidth: (t.fontMetrics().sqrtRuleThickness + o) * i
  };
}, Oi = /* @__PURE__ */ new Set(["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "⌊", "⌋", "\\lceil", "\\rceil", "⌈", "⌉", "\\surd"]), no = /* @__PURE__ */ new Set(["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "⟮", "⟯", "\\lmoustache", "\\rmoustache", "⎰", "⎱"]), Li = /* @__PURE__ */ new Set(["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"]), Ot = [0, 1.2, 1.8, 2.4, 3], Hi = function(e, t, a, n, i) {
  if (e === "<" || e === "\\lt" || e === "⟨" ? e = "\\langle" : (e === ">" || e === "\\gt" || e === "⟩") && (e = "\\rangle"), Oi.has(e) || Li.has(e))
    return Di(e, t, !1, a, n, i);
  if (no.has(e))
    return qi(e, Ot[t], !1, a, n, i);
  throw new E("Illegal delimiter: '" + e + "'");
}, io = [{
  type: "small",
  style: K.SCRIPTSCRIPT
}, {
  type: "small",
  style: K.SCRIPT
}, {
  type: "small",
  style: K.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}], lo = [{
  type: "small",
  style: K.SCRIPTSCRIPT
}, {
  type: "small",
  style: K.SCRIPT
}, {
  type: "small",
  style: K.TEXT
}, {
  type: "stack"
}], Ni = [{
  type: "small",
  style: K.SCRIPTSCRIPT
}, {
  type: "small",
  style: K.SCRIPT
}, {
  type: "small",
  style: K.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}, {
  type: "stack"
}], so = function(e) {
  if (e.type === "small")
    return "Main-Regular";
  if (e.type === "large")
    return "Size" + e.size + "-Regular";
  if (e.type === "stack")
    return "Size4-Regular";
  var t = e.type;
  throw new Error("Add support for delim type '" + t + "' here.");
}, Fi = function(e, t, a, n) {
  for (var i = Math.min(2, 3 - n.style.size), o = i; o < a.length; o++) {
    var u = a[o];
    if (u.type === "stack")
      break;
    var d = Dt(e, so(u), "math"), p = d.height + d.depth;
    if (u.type === "small") {
      var b = n.havingBaseStyle(u.style);
      p *= b.sizeMultiplier;
    }
    if (p > t)
      return u;
  }
  return a[a.length - 1];
}, Ia = function(e, t, a, n, i, o) {
  e === "<" || e === "\\lt" || e === "⟨" ? e = "\\langle" : (e === ">" || e === "\\gt" || e === "⟩") && (e = "\\rangle");
  var u;
  Li.has(e) ? u = io : Oi.has(e) ? u = Ni : u = lo;
  var d = Fi(e, t, u, n);
  return d.type === "small" ? Qs(e, d.style, a, n, i, o) : d.type === "large" ? Di(e, d.size, a, n, i, o) : qi(e, t, a, n, i, o);
}, la = function(e, t, a, n, i, o) {
  var u = n.fontMetrics().axisHeight * n.sizeMultiplier, d = 901, p = 5 / n.fontMetrics().ptPerEm, b = Math.max(t - u, a + u), w = Math.max(
    // In real TeX, calculations are done using integral values which are
    // 65536 per pt, or 655360 per em. So, the division here truncates in
    // TeX but doesn't here, producing different results. If we wanted to
    // exactly match TeX's calculation, we could do
    //   Math.floor(655360 * maxDistFromAxis / 500) *
    //    delimiterFactor / 655360
    // (To see the difference, compare
    //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
    // in TeX and KaTeX)
    b / 500 * d,
    2 * b - p
  );
  return Ia(e, w, !0, n, i, o);
}, Bn = {
  "\\bigl": {
    mclass: "mopen",
    size: 1
  },
  "\\Bigl": {
    mclass: "mopen",
    size: 2
  },
  "\\biggl": {
    mclass: "mopen",
    size: 3
  },
  "\\Biggl": {
    mclass: "mopen",
    size: 4
  },
  "\\bigr": {
    mclass: "mclose",
    size: 1
  },
  "\\Bigr": {
    mclass: "mclose",
    size: 2
  },
  "\\biggr": {
    mclass: "mclose",
    size: 3
  },
  "\\Biggr": {
    mclass: "mclose",
    size: 4
  },
  "\\bigm": {
    mclass: "mrel",
    size: 1
  },
  "\\Bigm": {
    mclass: "mrel",
    size: 2
  },
  "\\biggm": {
    mclass: "mrel",
    size: 3
  },
  "\\Biggm": {
    mclass: "mrel",
    size: 4
  },
  "\\big": {
    mclass: "mord",
    size: 1
  },
  "\\Big": {
    mclass: "mord",
    size: 2
  },
  "\\bigg": {
    mclass: "mord",
    size: 3
  },
  "\\Bigg": {
    mclass: "mord",
    size: 4
  }
}, oo = /* @__PURE__ */ new Set(["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "⌊", "⌋", "\\lceil", "\\rceil", "⌈", "⌉", "<", ">", "\\langle", "⟨", "\\rangle", "⟩", "\\lt", "\\gt", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "⟮", "⟯", "\\lmoustache", "\\rmoustache", "⎰", "⎱", "/", "\\backslash", "|", "\\vert", "\\|", "\\Vert", "\\uparrow", "\\Uparrow", "\\downarrow", "\\Downarrow", "\\updownarrow", "\\Updownarrow", "."]);
function qr(r, e) {
  var t = Rr(r);
  if (t && oo.has(t.text))
    return t;
  throw t ? new E("Invalid delimiter '" + t.text + "' after '" + e.funcName + "'", r) : new E("Invalid delimiter type '" + r.type + "'", r);
}
H({
  type: "delimsizing",
  names: ["\\bigl", "\\Bigl", "\\biggl", "\\Biggl", "\\bigr", "\\Bigr", "\\biggr", "\\Biggr", "\\bigm", "\\Bigm", "\\biggm", "\\Biggm", "\\big", "\\Big", "\\bigg", "\\Bigg"],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (r, e) => {
    var t = qr(e[0], r);
    return {
      type: "delimsizing",
      mode: r.parser.mode,
      size: Bn[r.funcName].size,
      mclass: Bn[r.funcName].mclass,
      delim: t.text
    };
  },
  htmlBuilder: (r, e) => r.delim === "." ? I([r.mclass]) : Hi(r.delim, r.size, e, r.mode, [r.mclass]),
  mathmlBuilder: (r) => {
    var e = [];
    r.delim !== "." && e.push(u0(r.delim, r.mode));
    var t = new R("mo", e);
    r.mclass === "mopen" || r.mclass === "mclose" ? t.setAttribute("fence", "true") : t.setAttribute("fence", "false"), t.setAttribute("stretchy", "true");
    var a = q(Ot[r.size]);
    return t.setAttribute("minsize", a), t.setAttribute("maxsize", a), t;
  }
});
function In(r) {
  if (!r.body)
    throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
}
H({
  type: "leftright-right",
  names: ["\\right"],
  props: {
    numArgs: 1,
    primitive: !0
  },
  handler: (r, e) => {
    var t = r.parser.gullet.macros.get("\\current@color");
    if (t && typeof t != "string")
      throw new E("\\current@color set to non-string in \\right");
    return {
      type: "leftright-right",
      mode: r.parser.mode,
      delim: qr(e[0], r).text,
      color: t
      // undefined if not set via \color
    };
  }
});
H({
  type: "leftright",
  names: ["\\left"],
  props: {
    numArgs: 1,
    primitive: !0
  },
  handler: (r, e) => {
    var t = qr(e[0], r), a = r.parser;
    ++a.leftrightDepth;
    var n = a.parseExpression(!1);
    --a.leftrightDepth, a.expect("\\right", !1);
    var i = te(a.parseFunction(), "leftright-right");
    return {
      type: "leftright",
      mode: a.mode,
      body: n,
      left: t.text,
      right: i.delim,
      rightColor: i.color
    };
  },
  htmlBuilder: (r, e) => {
    In(r);
    for (var t = Ie(r.body, e, !0, ["mopen", "mclose"]), a = 0, n = 0, i = !1, o = 0; o < t.length; o++)
      t[o].isMiddle ? i = !0 : (a = Math.max(t[o].height, a), n = Math.max(t[o].depth, n));
    a *= e.sizeMultiplier, n *= e.sizeMultiplier;
    var u;
    if (r.left === "." ? u = Ht(e, ["mopen"]) : u = la(r.left, a, n, e, r.mode, ["mopen"]), t.unshift(u), i)
      for (var d = 1; d < t.length; d++) {
        var p = t[d], b = p.isMiddle;
        b && (t[d] = la(b.delim, a, n, b.options, r.mode, []));
      }
    var w;
    if (r.right === ".")
      w = Ht(e, ["mclose"]);
    else {
      var S = r.rightColor ? e.withColor(r.rightColor) : e;
      w = la(r.right, a, n, S, r.mode, ["mclose"]);
    }
    return t.push(w), I(["minner"], t, e);
  },
  mathmlBuilder: (r, e) => {
    In(r);
    var t = n0(r.body, e);
    if (r.left !== ".") {
      var a = new R("mo", [u0(r.left, r.mode)]);
      a.setAttribute("fence", "true"), t.unshift(a);
    }
    if (r.right !== ".") {
      var n = new R("mo", [u0(r.right, r.mode)]);
      n.setAttribute("fence", "true"), r.rightColor && n.setAttribute("mathcolor", r.rightColor), t.push(n);
    }
    return Pa(t);
  }
});
H({
  type: "middle",
  names: ["\\middle"],
  props: {
    numArgs: 1,
    primitive: !0
  },
  handler: (r, e) => {
    var t = qr(e[0], r);
    if (!r.parser.leftrightDepth)
      throw new E("\\middle without preceding \\left", t);
    return {
      type: "middle",
      mode: r.parser.mode,
      delim: t.text
    };
  },
  htmlBuilder: (r, e) => {
    var t;
    if (r.delim === ".")
      t = Ht(e, []);
    else {
      t = Hi(r.delim, 1, e, r.mode, []);
      var a = {
        delim: r.delim,
        options: e
      };
      t.isMiddle = a;
    }
    return t;
  },
  mathmlBuilder: (r, e) => {
    var t = r.delim === "\\vert" || r.delim === "|" ? u0("|", "text") : u0(r.delim, r.mode), a = new R("mo", [t]);
    return a.setAttribute("fence", "true"), a.setAttribute("lspace", "0.05em"), a.setAttribute("rspace", "0.05em"), a;
  }
});
var Or = (r, e) => {
  var t = wt(ue(r.body, e), e), a = r.label.slice(1), n = e.sizeMultiplier, i, o = 0, u = L0(r.body);
  if (a === "sout")
    i = I(["stretchy", "sout"]), i.height = e.fontMetrics().defaultRuleThickness / n, o = -0.5 * e.fontMetrics().xHeight;
  else if (a === "phase") {
    var d = we({
      number: 0.6,
      unit: "pt"
    }, e), p = we({
      number: 0.35,
      unit: "ex"
    }, e), b = e.havingBaseSizing();
    n = n / b.sizeMultiplier;
    var w = t.height + t.depth + d + p;
    t.style.paddingLeft = q(w / 2 + d);
    var S = Math.floor(1e3 * w * n), k = ds(S), A = new O0([new Z0("phase", k)], {
      width: "400em",
      height: q(S / 1e3),
      viewBox: "0 0 400000 " + S,
      preserveAspectRatio: "xMinYMin slice"
    });
    i = J0(["hide-tail"], [A], e), i.style.height = q(w), o = t.depth + d + p;
  } else {
    /cancel/.test(a) ? u || t.classes.push("cancel-pad") : a === "angl" ? t.classes.push("anglpad") : t.classes.push("boxpad");
    var z = 0, D = 0, O = 0;
    /box/.test(a) ? (O = Math.max(
      e.fontMetrics().fboxrule,
      // default
      e.minRuleThickness
    ), z = e.fontMetrics().fboxsep + (a === "colorbox" ? 0 : O), D = z) : a === "angl" ? (O = Math.max(e.fontMetrics().defaultRuleThickness, e.minRuleThickness), z = 4 * O, D = Math.max(0, 0.25 - t.depth)) : (z = u ? 0.2 : 0, D = z), i = Us(t, a, z, D, e), /fbox|boxed|fcolorbox/.test(a) ? (i.style.borderStyle = "solid", i.style.borderWidth = q(O)) : a === "angl" && O !== 0.049 && (i.style.borderTopWidth = q(O), i.style.borderRightWidth = q(O)), o = t.depth + D, r.backgroundColor && (i.style.backgroundColor = r.backgroundColor, r.borderColor && (i.style.borderColor = r.borderColor));
  }
  var $;
  if (r.backgroundColor)
    $ = oe({
      positionType: "individualShift",
      children: [
        // Put the color background behind inner;
        {
          type: "elem",
          elem: i,
          shift: o
        },
        {
          type: "elem",
          elem: t,
          shift: 0
        }
      ]
    });
  else {
    var P = /cancel|phase/.test(a) ? ["svg-align"] : [];
    $ = oe({
      positionType: "individualShift",
      children: [
        // Write the \cancel stroke on top of inner.
        {
          type: "elem",
          elem: t,
          shift: 0
        },
        {
          type: "elem",
          elem: i,
          shift: o,
          wrapperClasses: P
        }
      ]
    });
  }
  return /cancel/.test(a) && ($.height = t.height, $.depth = t.depth), /cancel/.test(a) && !u ? I(["mord", "cancel-lap"], [$], e) : I(["mord"], [$], e);
}, Lr = (r, e) => {
  var t = 0, a = new R(r.label.includes("colorbox") ? "mpadded" : "menclose", [pe(r.body, e)]);
  switch (r.label) {
    case "\\cancel":
      a.setAttribute("notation", "updiagonalstrike");
      break;
    case "\\bcancel":
      a.setAttribute("notation", "downdiagonalstrike");
      break;
    case "\\phase":
      a.setAttribute("notation", "phasorangle");
      break;
    case "\\sout":
      a.setAttribute("notation", "horizontalstrike");
      break;
    case "\\fbox":
      a.setAttribute("notation", "box");
      break;
    case "\\angl":
      a.setAttribute("notation", "actuarial");
      break;
    case "\\fcolorbox":
    case "\\colorbox":
      if (t = e.fontMetrics().fboxsep * e.fontMetrics().ptPerEm, a.setAttribute("width", "+" + 2 * t + "pt"), a.setAttribute("height", "+" + 2 * t + "pt"), a.setAttribute("lspace", t + "pt"), a.setAttribute("voffset", t + "pt"), r.label === "\\fcolorbox") {
        var n = Math.max(
          e.fontMetrics().fboxrule,
          // default
          e.minRuleThickness
        );
        a.setAttribute("style", "border: " + q(n) + " solid " + r.borderColor);
      }
      break;
    case "\\xcancel":
      a.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
      break;
  }
  return r.backgroundColor && a.setAttribute("mathbackground", r.backgroundColor), a;
};
H({
  type: "enclose",
  names: ["\\colorbox"],
  props: {
    numArgs: 2,
    allowedInText: !0,
    argTypes: ["color", "text"]
  },
  handler(r, e, t) {
    var {
      parser: a,
      funcName: n
    } = r, i = te(e[0], "color-token").color, o = e[1];
    return {
      type: "enclose",
      mode: a.mode,
      label: n,
      backgroundColor: i,
      body: o
    };
  },
  htmlBuilder: Or,
  mathmlBuilder: Lr
});
H({
  type: "enclose",
  names: ["\\fcolorbox"],
  props: {
    numArgs: 3,
    allowedInText: !0,
    argTypes: ["color", "color", "text"]
  },
  handler(r, e, t) {
    var {
      parser: a,
      funcName: n
    } = r, i = te(e[0], "color-token").color, o = te(e[1], "color-token").color, u = e[2];
    return {
      type: "enclose",
      mode: a.mode,
      label: n,
      backgroundColor: o,
      borderColor: i,
      body: u
    };
  },
  htmlBuilder: Or,
  mathmlBuilder: Lr
});
H({
  type: "enclose",
  names: ["\\fbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "enclose",
      mode: t.mode,
      label: "\\fbox",
      body: e[0]
    };
  }
});
H({
  type: "enclose",
  names: ["\\cancel", "\\bcancel", "\\xcancel", "\\phase"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "enclose",
      mode: t.mode,
      label: a,
      body: n
    };
  },
  htmlBuilder: Or,
  mathmlBuilder: Lr
});
H({
  type: "enclose",
  names: ["\\sout"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r;
    t.mode === "math" && t.settings.reportNonstrict("mathVsSout", "LaTeX's \\sout works only in text mode");
    var n = e[0];
    return {
      type: "enclose",
      mode: t.mode,
      label: a,
      body: n
    };
  },
  htmlBuilder: Or,
  mathmlBuilder: Lr
});
H({
  type: "enclose",
  names: ["\\angl"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: !1
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "enclose",
      mode: t.mode,
      label: "\\angl",
      body: e[0]
    };
  }
});
var Pi = {};
function M0(r) {
  for (var {
    type: e,
    names: t,
    props: a,
    handler: n,
    htmlBuilder: i,
    mathmlBuilder: o
  } = r, u = {
    type: e,
    numArgs: a.numArgs || 0,
    allowedInText: !1,
    numOptionalArgs: 0,
    handler: n
  }, d = 0; d < t.length; ++d)
    Pi[t[d]] = u;
  i && (kr[e] = i), o && (Mr[e] = o);
}
var $i = {};
function h(r, e) {
  $i[r] = e;
}
class Ze {
  // The + prefix indicates that these fields aren't writeable
  // Lexer holding the input string.
  // Start offset, zero-based inclusive.
  // End offset, zero-based exclusive.
  constructor(e, t, a) {
    this.lexer = e, this.start = t, this.end = a;
  }
  /**
   * Merges two `SourceLocation`s from location providers, given they are
   * provided in order of appearance.
   * - Returns the first one's location if only the first is provided.
   * - Returns a merged range of the first and the last if both are provided
   *   and their lexers match.
   * - Otherwise, returns null.
   */
  static range(e, t) {
    return t ? !e || !e.loc || !t.loc || e.loc.lexer !== t.loc.lexer ? null : new Ze(e.loc.lexer, e.loc.start, t.loc.end) : e && e.loc;
  }
}
class t0 {
  // don't expand the token
  // used in \noexpand
  constructor(e, t) {
    this.text = e, this.loc = t;
  }
  /**
   * Given a pair of tokens (this and endToken), compute a `Token` encompassing
   * the whole input range enclosed by these two.
   */
  range(e, t) {
    return new t0(t, Ze.range(this, e));
  }
}
function En(r) {
  var e = [];
  r.consumeSpaces();
  var t = r.fetch().text;
  for (t === "\\relax" && (r.consume(), r.consumeSpaces(), t = r.fetch().text); t === "\\hline" || t === "\\hdashline"; )
    r.consume(), e.push(t === "\\hdashline"), r.consumeSpaces(), t = r.fetch().text;
  return e;
}
var Hr = (r) => {
  var e = r.parser.settings;
  if (!e.displayMode)
    throw new E("{" + r.envName + "} can be used only in display mode.");
}, uo = /* @__PURE__ */ new Set(["gather", "gather*"]);
function _a(r) {
  if (!r.includes("ed"))
    return !r.includes("*");
}
function et(r, e, t) {
  var {
    hskipBeforeAndAfter: a,
    addJot: n,
    cols: i,
    arraystretch: o,
    colSeparationType: u,
    autoTag: d,
    singleRow: p,
    emptySingleRow: b,
    maxNumCols: w,
    leqno: S
  } = e;
  if (r.gullet.beginGroup(), p || r.gullet.macros.set("\\cr", "\\\\\\relax"), !o) {
    var k = r.gullet.expandMacroAsText("\\arraystretch");
    if (k == null)
      o = 1;
    else if (o = parseFloat(k), !o || o < 0)
      throw new E("Invalid \\arraystretch: " + k);
  }
  r.gullet.beginGroup();
  var A = [], z = [A], D = [], O = [], $ = d != null ? [] : void 0;
  function P() {
    d && r.gullet.macros.set("\\@eqnsw", "1", !0);
  }
  function G() {
    $ && (r.gullet.macros.get("\\df@tag") ? ($.push(r.subparse([new t0("\\df@tag")])), r.gullet.macros.set("\\df@tag", void 0, !0)) : $.push(!!d && r.gullet.macros.get("\\@eqnsw") === "1"));
  }
  for (P(), O.push(En(r)); ; ) {
    var W = r.parseExpression(!1, p ? "\\end" : "\\\\");
    r.gullet.endGroup(), r.gullet.beginGroup();
    var V = {
      type: "ordgroup",
      mode: r.mode,
      body: W
    };
    t && (V = {
      type: "styling",
      mode: r.mode,
      style: t,
      body: [V]
    }), A.push(V);
    var Y = r.fetch().text;
    if (Y === "&") {
      if (w && A.length === w) {
        if (p || u)
          throw new E("Too many tab characters: &", r.nextToken);
        r.settings.reportNonstrict("textEnv", "Too few columns specified in the {array} column argument.");
      }
      r.consume();
    } else if (Y === "\\end") {
      G(), A.length === 1 && V.type === "styling" && V.body.length === 1 && V.body[0].type === "ordgroup" && V.body[0].body.length === 0 && (z.length > 1 || !b) && z.pop(), O.length < z.length + 1 && O.push([]);
      break;
    } else if (Y === "\\\\") {
      r.consume();
      var ie = void 0;
      r.gullet.future().text !== " " && (ie = r.parseSizeGroup(!0)), D.push(ie ? ie.value : null), G(), O.push(En(r)), A = [], z.push(A), P();
    } else
      throw new E("Expected & or \\\\ or \\cr or \\end", r.nextToken);
  }
  return r.gullet.endGroup(), r.gullet.endGroup(), {
    type: "array",
    mode: r.mode,
    addJot: n,
    arraystretch: o,
    body: z,
    cols: i,
    rowGaps: D,
    hskipBeforeAndAfter: a,
    hLinesBeforeRow: O,
    colSeparationType: u,
    tags: $,
    leqno: S
  };
}
function ja(r) {
  return r.slice(0, 1) === "d" ? "display" : "text";
}
var T0 = function(e, t) {
  var a, n, i = e.body.length, o = e.hLinesBeforeRow, u = 0, d = new Array(i), p = [], b = Math.max(
    // From LaTeX \showthe\arrayrulewidth. Equals 0.04 em.
    t.fontMetrics().arrayRuleWidth,
    t.minRuleThickness
  ), w = 1 / t.fontMetrics().ptPerEm, S = 5 * w;
  if (e.colSeparationType && e.colSeparationType === "small") {
    var k = t.havingStyle(K.SCRIPT).sizeMultiplier;
    S = 0.2778 * (k / t.sizeMultiplier);
  }
  var A = e.colSeparationType === "CD" ? we({
    number: 3,
    unit: "ex"
  }, t) : 12 * w, z = 3 * w, D = e.arraystretch * A, O = 0.7 * D, $ = 0.3 * D, P = 0;
  function G(W0) {
    for (var d0 = 0; d0 < W0.length; ++d0)
      d0 > 0 && (P += 0.25), p.push({
        pos: P,
        isDashed: W0[d0]
      });
  }
  for (G(o[0]), a = 0; a < e.body.length; ++a) {
    var W = e.body[a], V = O, Y = $;
    u < W.length && (u = W.length);
    var ie = new Array(W.length);
    for (n = 0; n < W.length; ++n) {
      var re = ue(W[n], t);
      Y < re.depth && (Y = re.depth), V < re.height && (V = re.height), ie[n] = re;
    }
    var U = e.rowGaps[a], J = 0;
    U && (J = we(U, t), J > 0 && (J += $, Y < J && (Y = J), J = 0)), e.addJot && a < e.body.length - 1 && (Y += z), ie.height = V, ie.depth = Y, P += V, ie.pos = P, P += Y + J, d[a] = ie, G(o[a + 1]);
  }
  var Q = P / 2 + t.fontMetrics().axisHeight, ze = e.cols || [], ce = [], Ce, Ee, He = [];
  if (e.tags && e.tags.some((W0) => W0))
    for (a = 0; a < i; ++a) {
      var Ne = d[a], $e = Ne.pos - Q, Ye = e.tags[a], de = void 0;
      Ye === !0 ? de = I(["eqn-num"], [], t) : Ye === !1 ? de = I([], [], t) : de = I([], Ie(Ye, t, !0), t), de.depth = Ne.depth, de.height = Ne.height, He.push({
        type: "elem",
        elem: de,
        shift: $e
      });
    }
  for (
    n = 0, Ee = 0;
    // Continue while either there are more columns or more column
    // descriptions, so trailing separators don't get lost.
    n < u || Ee < ze.length;
    ++n, ++Ee
  ) {
    for (var i0, ke = ze[Ee], z0 = !0; ((Pt = ke) == null ? void 0 : Pt.type) === "separator"; ) {
      var Pt;
      if (z0 || (Ce = I(["arraycolsep"], []), Ce.style.width = q(t.fontMetrics().doubleRuleSep), ce.push(Ce)), ke.separator === "|" || ke.separator === ":") {
        var At = ke.separator === "|" ? "solid" : "dashed", Fe = I(["vertical-separator"], [], t);
        Fe.style.height = q(P), Fe.style.borderRightWidth = q(b), Fe.style.borderRightStyle = At, Fe.style.margin = "0 " + q(-b / 2);
        var $t = P - Q;
        $t && (Fe.style.verticalAlign = q(-$t)), ce.push(Fe);
      } else
        throw new E("Invalid separator type: " + ke.separator);
      Ee++, ke = ze[Ee], z0 = !1;
    }
    if (!(n >= u)) {
      var v0 = void 0;
      if (n > 0 || e.hskipBeforeAndAfter) {
        var Wt, c0;
        v0 = (Wt = (c0 = ke) == null ? void 0 : c0.pregap) != null ? Wt : S, v0 !== 0 && (Ce = I(["arraycolsep"], []), Ce.style.width = q(v0), ce.push(Ce));
      }
      var Gt = [];
      for (a = 0; a < i; ++a) {
        var b0 = d[a], ne = b0[n];
        if (ne) {
          var F0 = b0.pos - Q;
          ne.depth = b0.depth, ne.height = b0.height, Gt.push({
            type: "elem",
            elem: ne,
            shift: F0
          });
        }
      }
      var ge = oe({
        positionType: "individualShift",
        children: Gt
      }), dt = I(["col-align-" + (((i0 = ke) == null ? void 0 : i0.align) || "c")], [ge]);
      if (ce.push(dt), n < u - 1 || e.hskipBeforeAndAfter) {
        var P0, _t;
        v0 = (P0 = (_t = ke) == null ? void 0 : _t.postgap) != null ? P0 : S, v0 !== 0 && (Ce = I(["arraycolsep"], []), Ce.style.width = q(v0), ce.push(Ce));
      }
    }
  }
  var C0 = I(["mtable"], ce);
  if (p.length > 0) {
    for (var jt = xt("hline", t, b), $0 = xt("hdashline", t, b), ee = [{
      type: "elem",
      elem: C0,
      shift: 0
    }]; p.length > 0; ) {
      var Ut = p.pop(), zt = Ut.pos - Q;
      Ut.isDashed ? ee.push({
        type: "elem",
        elem: $0,
        shift: zt
      }) : ee.push({
        type: "elem",
        elem: jt,
        shift: zt
      });
    }
    C0 = oe({
      positionType: "individualShift",
      children: ee
    });
  }
  if (He.length === 0)
    return I(["mord"], [C0], t);
  var Za = oe({
    positionType: "individualShift",
    children: He
  }), Vt = I(["tag"], [Za], t);
  return N0([C0, Vt]);
}, co = {
  c: "center ",
  l: "left ",
  r: "right "
}, A0 = function(e, t) {
  for (var a = [], n = new R("mtd", [], ["mtr-glue"]), i = new R("mtd", [], ["mml-eqn-num"]), o = 0; o < e.body.length; o++) {
    for (var u = e.body[o], d = [], p = 0; p < u.length; p++)
      d.push(new R("mtd", [pe(u[p], t)]));
    e.tags && e.tags[o] && (d.unshift(n), d.push(n), e.leqno ? d.unshift(i) : d.push(i)), a.push(new R("mtr", d));
  }
  var b = new R("mtable", a), w = e.arraystretch === 0.5 ? 0.1 : 0.16 + e.arraystretch - 1 + (e.addJot ? 0.09 : 0);
  b.setAttribute("rowspacing", q(w));
  var S = "", k = "";
  if (e.cols && e.cols.length > 0) {
    var A = e.cols, z = "", D = !1, O = 0, $ = A.length;
    A[0].type === "separator" && (S += "top ", O = 1), A[A.length - 1].type === "separator" && (S += "bottom ", $ -= 1);
    for (var P = O; P < $; P++) {
      var G = A[P];
      G.type === "align" ? (k += co[G.align], D && (z += "none "), D = !0) : G.type === "separator" && D && (z += G.separator === "|" ? "solid " : "dashed ", D = !1);
    }
    b.setAttribute("columnalign", k.trim()), /[sd]/.test(z) && b.setAttribute("columnlines", z.trim());
  }
  if (e.colSeparationType === "align") {
    for (var W = e.cols || [], V = "", Y = 1; Y < W.length; Y++)
      V += Y % 2 ? "0em " : "1em ";
    b.setAttribute("columnspacing", V.trim());
  } else e.colSeparationType === "alignat" || e.colSeparationType === "gather" ? b.setAttribute("columnspacing", "0em") : e.colSeparationType === "small" ? b.setAttribute("columnspacing", "0.2778em") : e.colSeparationType === "CD" ? b.setAttribute("columnspacing", "0.5em") : b.setAttribute("columnspacing", "1em");
  var ie = "", re = e.hLinesBeforeRow;
  S += re[0].length > 0 ? "left " : "", S += re[re.length - 1].length > 0 ? "right " : "";
  for (var U = 1; U < re.length - 1; U++)
    ie += re[U].length === 0 ? "none " : re[U][0] ? "dashed " : "solid ";
  return /[sd]/.test(ie) && b.setAttribute("rowlines", ie.trim()), S !== "" && (b = new R("menclose", [b]), b.setAttribute("notation", S.trim())), e.arraystretch && e.arraystretch < 1 && (b = new R("mstyle", [b]), b.setAttribute("scriptlevel", "1")), b;
}, Wi = function(e, t) {
  e.envName.includes("ed") || Hr(e);
  var a = [], n = e.envName.includes("at") ? "alignat" : "align", i = e.envName === "split", o = et(e.parser, {
    cols: a,
    addJot: !0,
    autoTag: i ? void 0 : _a(e.envName),
    emptySingleRow: !0,
    colSeparationType: n,
    maxNumCols: i ? 2 : void 0,
    leqno: e.parser.settings.leqno
  }, "display"), u = 0, d = 0, p = {
    type: "ordgroup",
    mode: e.mode,
    body: []
  };
  if (t[0] && t[0].type === "ordgroup") {
    for (var b = "", w = 0; w < t[0].body.length; w++) {
      var S = te(t[0].body[w], "textord");
      b += S.text;
    }
    u = Number(b), d = u * 2;
  }
  var k = !d;
  o.body.forEach(function(O) {
    for (var $ = 1; $ < O.length; $ += 2) {
      var P = te(O[$], "styling"), G = te(P.body[0], "ordgroup");
      G.body.unshift(p);
    }
    if (k)
      d < O.length && (d = O.length);
    else {
      var W = O.length / 2;
      if (u < W)
        throw new E("Too many math in a row: " + ("expected " + u + ", but got " + W), O[0]);
    }
  });
  for (var A = 0; A < d; ++A) {
    var z = "r", D = 0;
    A % 2 === 1 ? z = "l" : A > 0 && k && (D = 1), a[A] = {
      type: "align",
      align: z,
      pregap: D,
      postgap: 0
    };
  }
  return o.colSeparationType = k ? "align" : "alignat", o;
};
M0({
  type: "array",
  names: ["array", "darray"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var t = Rr(e[0]), a = t ? [e[0]] : te(e[0], "ordgroup").body, n = a.map(function(o) {
      var u = Er(o), d = u.text;
      if ("lcr".includes(d))
        return {
          type: "align",
          align: d
        };
      if (d === "|")
        return {
          type: "separator",
          separator: "|"
        };
      if (d === ":")
        return {
          type: "separator",
          separator: ":"
        };
      throw new E("Unknown column alignment: " + d, o);
    }), i = {
      cols: n,
      hskipBeforeAndAfter: !0,
      // \@preamble in lttab.dtx
      maxNumCols: n.length
    };
    return et(r.parser, i, ja(r.envName));
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix*", "pmatrix*", "bmatrix*", "Bmatrix*", "vmatrix*", "Vmatrix*"],
  props: {
    numArgs: 0
  },
  handler(r) {
    var e = {
      matrix: null,
      pmatrix: ["(", ")"],
      bmatrix: ["[", "]"],
      Bmatrix: ["\\{", "\\}"],
      vmatrix: ["|", "|"],
      Vmatrix: ["\\Vert", "\\Vert"]
    }[r.envName.replace("*", "")], t = "c", a = {
      hskipBeforeAndAfter: !1,
      cols: [{
        type: "align",
        align: t
      }]
    };
    if (r.envName.charAt(r.envName.length - 1) === "*") {
      var n = r.parser;
      if (n.consumeSpaces(), n.fetch().text === "[") {
        if (n.consume(), n.consumeSpaces(), t = n.fetch().text, !"lcr".includes(t))
          throw new E("Expected l or c or r", n.nextToken);
        n.consume(), n.consumeSpaces(), n.expect("]"), n.consume(), a.cols = [{
          type: "align",
          align: t
        }];
      }
    }
    var i = et(r.parser, a, ja(r.envName)), o = Math.max(0, ...i.body.map((u) => u.length));
    return i.cols = new Array(o).fill({
      type: "align",
      align: t
    }), e ? {
      type: "leftright",
      mode: r.mode,
      body: [i],
      left: e[0],
      right: e[1],
      rightColor: void 0
      // \right uninfluenced by \color in array
    } : i;
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["smallmatrix"],
  props: {
    numArgs: 0
  },
  handler(r) {
    var e = {
      arraystretch: 0.5
    }, t = et(r.parser, e, "script");
    return t.colSeparationType = "small", t;
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["subarray"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var t = Rr(e[0]), a = t ? [e[0]] : te(e[0], "ordgroup").body, n = a.map(function(u) {
      var d = Er(u), p = d.text;
      if ("lc".includes(p))
        return {
          type: "align",
          align: p
        };
      throw new E("Unknown column alignment: " + p, u);
    });
    if (n.length > 1)
      throw new E("{subarray} can contain only one column");
    var i = {
      cols: n,
      hskipBeforeAndAfter: !1,
      arraystretch: 0.5
    }, o = et(r.parser, i, "script");
    if (o.body.length > 0 && o.body[0].length > 1)
      throw new E("{subarray} can contain only one column");
    return o;
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["cases", "dcases", "rcases", "drcases"],
  props: {
    numArgs: 0
  },
  handler(r) {
    var e = {
      arraystretch: 1.2,
      cols: [{
        type: "align",
        align: "l",
        pregap: 0,
        // TODO(kevinb) get the current style.
        // For now we use the metrics for TEXT style which is what we were
        // doing before.  Before attempting to get the current style we
        // should look at TeX's behavior especially for \over and matrices.
        postgap: 1
        /* 1em quad */
      }, {
        type: "align",
        align: "l",
        pregap: 0,
        postgap: 0
      }]
    }, t = et(r.parser, e, ja(r.envName));
    return {
      type: "leftright",
      mode: r.mode,
      body: [t],
      left: r.envName.includes("r") ? "." : "\\{",
      right: r.envName.includes("r") ? "\\}" : ".",
      rightColor: void 0
    };
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["align", "align*", "aligned", "split"],
  props: {
    numArgs: 0
  },
  handler: Wi,
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["gathered", "gather", "gather*"],
  props: {
    numArgs: 0
  },
  handler(r) {
    uo.has(r.envName) && Hr(r);
    var e = {
      cols: [{
        type: "align",
        align: "c"
      }],
      addJot: !0,
      colSeparationType: "gather",
      autoTag: _a(r.envName),
      emptySingleRow: !0,
      leqno: r.parser.settings.leqno
    };
    return et(r.parser, e, "display");
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["alignat", "alignat*", "alignedat"],
  props: {
    numArgs: 1
  },
  handler: Wi,
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["equation", "equation*"],
  props: {
    numArgs: 0
  },
  handler(r) {
    Hr(r);
    var e = {
      autoTag: _a(r.envName),
      emptySingleRow: !0,
      singleRow: !0,
      maxNumCols: 1,
      leqno: r.parser.settings.leqno
    };
    return et(r.parser, e, "display");
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
M0({
  type: "array",
  names: ["CD"],
  props: {
    numArgs: 0
  },
  handler(r) {
    return Hr(r), Zs(r.parser);
  },
  htmlBuilder: T0,
  mathmlBuilder: A0
});
h("\\nonumber", "\\gdef\\@eqnsw{0}");
h("\\notag", "\\nonumber");
H({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\hline", "\\hdashline"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    allowedInMath: !0
  },
  handler(r, e) {
    throw new E(r.funcName + " valid only within array environment");
  }
});
var Rn = Pi;
H({
  type: "environment",
  names: ["\\begin", "\\end"],
  props: {
    numArgs: 1,
    argTypes: ["text"]
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    if (n.type !== "ordgroup")
      throw new E("Invalid environment name", n);
    for (var i = "", o = 0; o < n.body.length; ++o)
      i += te(n.body[o], "textord").text;
    if (a === "\\begin") {
      if (!Rn.hasOwnProperty(i))
        throw new E("No such environment: " + i, n);
      var u = Rn[i], {
        args: d,
        optArgs: p
      } = t.parseArguments("\\begin{" + i + "}", u), b = {
        mode: t.mode,
        envName: i,
        parser: t
      }, w = u.handler(b, d, p);
      t.expect("\\end", !1);
      var S = t.nextToken, k = te(t.parseFunction(), "environment");
      if (k.name !== i)
        throw new E("Mismatch: \\begin{" + i + "} matched by \\end{" + k.name + "}", S);
      return w;
    }
    return {
      type: "environment",
      mode: t.mode,
      name: i,
      nameGroup: n
    };
  }
});
var Gi = (r, e) => {
  var t = r.font, a = e.withFont(t);
  return ue(r.body, a);
}, _i = (r, e) => {
  var t = r.font, a = e.withFont(t);
  return pe(r.body, a);
}, Dn = {
  "\\Bbb": "\\mathbb",
  "\\bold": "\\mathbf",
  "\\frak": "\\mathfrak",
  "\\bm": "\\boldsymbol"
};
H({
  type: "font",
  names: [
    // styles, except \boldsymbol defined below
    "\\mathrm",
    "\\mathit",
    "\\mathbf",
    "\\mathnormal",
    "\\mathsfit",
    // families
    "\\mathbb",
    "\\mathcal",
    "\\mathfrak",
    "\\mathscr",
    "\\mathsf",
    "\\mathtt",
    // aliases, except \bm defined below
    "\\Bbb",
    "\\bold",
    "\\frak"
  ],
  props: {
    numArgs: 1,
    allowedInArgument: !0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = Tr(e[0]), i = a;
    return i in Dn && (i = Dn[i]), {
      type: "font",
      mode: t.mode,
      font: i.slice(1),
      body: n
    };
  },
  htmlBuilder: Gi,
  mathmlBuilder: _i
});
H({
  type: "mclass",
  names: ["\\boldsymbol", "\\bm"],
  props: {
    numArgs: 1
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = e[0];
    return {
      type: "mclass",
      mode: t.mode,
      mclass: Dr(a),
      body: [{
        type: "font",
        mode: t.mode,
        font: "boldsymbol",
        body: a
      }],
      isCharacterBox: L0(a)
    };
  }
});
H({
  type: "font",
  names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
  props: {
    numArgs: 0,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a,
      breakOnTokenText: n
    } = r, {
      mode: i
    } = t, o = t.parseExpression(!0, n), u = "math" + a.slice(1);
    return {
      type: "font",
      mode: i,
      font: u,
      body: {
        type: "ordgroup",
        mode: t.mode,
        body: o
      }
    };
  },
  htmlBuilder: Gi,
  mathmlBuilder: _i
});
var ho = (r, e) => {
  var t = e.style, a = t.fracNum(), n = t.fracDen(), i;
  i = e.havingStyle(a);
  var o = ue(r.numer, i, e);
  if (r.continued) {
    var u = 8.5 / e.fontMetrics().ptPerEm, d = 3.5 / e.fontMetrics().ptPerEm;
    o.height = o.height < u ? u : o.height, o.depth = o.depth < d ? d : o.depth;
  }
  i = e.havingStyle(n);
  var p = ue(r.denom, i, e), b, w, S;
  r.hasBarLine ? (r.barSize ? (w = we(r.barSize, e), b = xt("frac-line", e, w)) : b = xt("frac-line", e), w = b.height, S = b.height) : (b = null, w = 0, S = e.fontMetrics().defaultRuleThickness);
  var k, A, z;
  t.size === K.DISPLAY.size ? (k = e.fontMetrics().num1, w > 0 ? A = 3 * S : A = 7 * S, z = e.fontMetrics().denom1) : (w > 0 ? (k = e.fontMetrics().num2, A = S) : (k = e.fontMetrics().num3, A = 3 * S), z = e.fontMetrics().denom2);
  var D;
  if (b) {
    var $ = e.fontMetrics().axisHeight;
    k - o.depth - ($ + 0.5 * w) < A && (k += A - (k - o.depth - ($ + 0.5 * w))), $ - 0.5 * w - (p.height - z) < A && (z += A - ($ - 0.5 * w - (p.height - z)));
    var P = -($ - 0.5 * w);
    D = oe({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: p,
        shift: z
      }, {
        type: "elem",
        elem: b,
        shift: P
      }, {
        type: "elem",
        elem: o,
        shift: -k
      }]
    });
  } else {
    var O = k - o.depth - (p.height - z);
    O < A && (k += 0.5 * (A - O), z += 0.5 * (A - O)), D = oe({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: p,
        shift: z
      }, {
        type: "elem",
        elem: o,
        shift: -k
      }]
    });
  }
  i = e.havingStyle(t), D.height *= i.sizeMultiplier / e.sizeMultiplier, D.depth *= i.sizeMultiplier / e.sizeMultiplier;
  var G;
  t.size === K.DISPLAY.size ? G = e.fontMetrics().delim1 : t.size === K.SCRIPTSCRIPT.size ? G = e.havingStyle(K.SCRIPT).fontMetrics().delim2 : G = e.fontMetrics().delim2;
  var W, V;
  return r.leftDelim == null ? W = Ht(e, ["mopen"]) : W = Ia(r.leftDelim, G, !0, e.havingStyle(t), r.mode, ["mopen"]), r.continued ? V = I([]) : r.rightDelim == null ? V = Ht(e, ["mclose"]) : V = Ia(r.rightDelim, G, !0, e.havingStyle(t), r.mode, ["mclose"]), I(["mord"].concat(i.sizingClasses(e)), [W, I(["mfrac"], [D]), V], e);
}, mo = (r, e) => {
  var t = new R("mfrac", [pe(r.numer, e), pe(r.denom, e)]);
  if (!r.hasBarLine)
    t.setAttribute("linethickness", "0px");
  else if (r.barSize) {
    var a = we(r.barSize, e);
    t.setAttribute("linethickness", q(a));
  }
  if (r.leftDelim != null || r.rightDelim != null) {
    var n = [];
    if (r.leftDelim != null) {
      var i = new R("mo", [new Te(r.leftDelim.replace("\\", ""))]);
      i.setAttribute("fence", "true"), n.push(i);
    }
    if (n.push(t), r.rightDelim != null) {
      var o = new R("mo", [new Te(r.rightDelim.replace("\\", ""))]);
      o.setAttribute("fence", "true"), n.push(o);
    }
    return Pa(n);
  }
  return t;
}, ji = (r, e) => {
  if (!e)
    return r;
  var t = {
    type: "styling",
    mode: r.mode,
    style: e,
    body: [r]
  };
  return t;
};
H({
  type: "genfrac",
  names: [
    "\\cfrac",
    "\\dfrac",
    "\\frac",
    "\\tfrac",
    "\\dbinom",
    "\\binom",
    "\\tbinom",
    "\\\\atopfrac",
    // can’t be entered directly
    "\\\\bracefrac",
    "\\\\brackfrac"
    // ditto
  ],
  props: {
    numArgs: 2,
    allowedInArgument: !0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0], i = e[1], o, u = null, d = null;
    switch (a) {
      case "\\cfrac":
      case "\\dfrac":
      case "\\frac":
      case "\\tfrac":
        o = !0;
        break;
      case "\\\\atopfrac":
        o = !1;
        break;
      case "\\dbinom":
      case "\\binom":
      case "\\tbinom":
        o = !1, u = "(", d = ")";
        break;
      case "\\\\bracefrac":
        o = !1, u = "\\{", d = "\\}";
        break;
      case "\\\\brackfrac":
        o = !1, u = "[", d = "]";
        break;
      default:
        throw new Error("Unrecognized genfrac command");
    }
    var p = a === "\\cfrac", b = null;
    return p || a.startsWith("\\d") ? b = "display" : a.startsWith("\\t") && (b = "text"), ji({
      type: "genfrac",
      mode: t.mode,
      numer: n,
      denom: i,
      continued: p,
      hasBarLine: o,
      leftDelim: u,
      rightDelim: d,
      barSize: null
    }, b);
  },
  htmlBuilder: ho,
  mathmlBuilder: mo
});
H({
  type: "infix",
  names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
  props: {
    numArgs: 0,
    infix: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t,
      token: a
    } = r, n;
    switch (t) {
      case "\\over":
        n = "\\frac";
        break;
      case "\\choose":
        n = "\\binom";
        break;
      case "\\atop":
        n = "\\\\atopfrac";
        break;
      case "\\brace":
        n = "\\\\bracefrac";
        break;
      case "\\brack":
        n = "\\\\brackfrac";
        break;
      default:
        throw new Error("Unrecognized infix genfrac command");
    }
    return {
      type: "infix",
      mode: e.mode,
      replaceWith: n,
      token: a
    };
  }
});
var qn = ["display", "text", "script", "scriptscript"], On = function(e) {
  var t = null;
  return e.length > 0 && (t = e, t = t === "." ? null : t), t;
};
H({
  type: "genfrac",
  names: ["\\genfrac"],
  props: {
    numArgs: 6,
    allowedInArgument: !0,
    argTypes: ["math", "math", "size", "text", "math", "math"]
  },
  handler(r, e) {
    var {
      parser: t
    } = r, a = e[4], n = e[5], i = Tr(e[0]), o = i.type === "atom" && i.family === "open" ? On(i.text) : null, u = Tr(e[1]), d = u.type === "atom" && u.family === "close" ? On(u.text) : null, p = te(e[2], "size"), b, w = null;
    p.isBlank ? b = !0 : (w = p.value, b = w.number > 0);
    var S = null, k = e[3];
    if (k.type === "ordgroup") {
      if (k.body.length > 0) {
        var A = te(k.body[0], "textord");
        S = qn[Number(A.text)];
      }
    } else
      k = te(k, "textord"), S = qn[Number(k.text)];
    return ji({
      type: "genfrac",
      mode: t.mode,
      numer: a,
      denom: n,
      continued: !1,
      hasBarLine: b,
      barSize: w,
      leftDelim: o,
      rightDelim: d
    }, S);
  }
});
H({
  type: "infix",
  names: ["\\above"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    infix: !0
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a,
      token: n
    } = r;
    return {
      type: "infix",
      mode: t.mode,
      replaceWith: "\\\\abovefrac",
      size: te(e[0], "size").value,
      token: n
    };
  }
});
H({
  type: "genfrac",
  names: ["\\\\abovefrac"],
  props: {
    numArgs: 3,
    argTypes: ["math", "size", "math"]
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0], i = te(e[1], "infix").size;
    if (!i)
      throw new Error("\\\\abovefrac expected size, but got " + String(i));
    var o = e[2], u = i.number > 0;
    return {
      type: "genfrac",
      mode: t.mode,
      numer: n,
      denom: o,
      continued: !1,
      hasBarLine: u,
      barSize: i,
      leftDelim: null,
      rightDelim: null
    };
  }
});
var Ui = (r, e) => {
  var t = e.style, a, n;
  r.type === "supsub" ? (a = r.sup ? ue(r.sup, e.havingStyle(t.sup()), e) : ue(r.sub, e.havingStyle(t.sub()), e), n = te(r.base, "horizBrace")) : n = te(r, "horizBrace");
  var i = ue(n.base, e.havingBaseStyle(K.DISPLAY)), o = Ir(n, e), u;
  if (n.isOver ? (u = oe({
    positionType: "firstBaseline",
    children: [{
      type: "elem",
      elem: i
    }, {
      type: "kern",
      size: 0.1
    }, {
      type: "elem",
      elem: o
    }]
  }), u.children[0].children[0].children[1].classes.push("svg-align")) : (u = oe({
    positionType: "bottom",
    positionData: i.depth + 0.1 + o.height,
    children: [{
      type: "elem",
      elem: o
    }, {
      type: "kern",
      size: 0.1
    }, {
      type: "elem",
      elem: i
    }]
  }), u.children[0].children[0].children[0].classes.push("svg-align")), a) {
    var d = I(["minner", n.isOver ? "mover" : "munder"], [u], e);
    n.isOver ? u = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: d
      }, {
        type: "kern",
        size: 0.2
      }, {
        type: "elem",
        elem: a
      }]
    }) : u = oe({
      positionType: "bottom",
      positionData: d.depth + 0.2 + a.height + a.depth,
      children: [{
        type: "elem",
        elem: a
      }, {
        type: "kern",
        size: 0.2
      }, {
        type: "elem",
        elem: d
      }]
    });
  }
  return I(["minner", n.isOver ? "mover" : "munder"], [u], e);
}, po = (r, e) => {
  var t = Br(r.label);
  return new R(r.isOver ? "mover" : "munder", [pe(r.base, e), t]);
};
H({
  type: "horizBrace",
  names: ["\\overbrace", "\\underbrace", "\\overbracket", "\\underbracket"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r;
    return {
      type: "horizBrace",
      mode: t.mode,
      label: a,
      isOver: a.includes("\\over"),
      base: e[0]
    };
  },
  htmlBuilder: Ui,
  mathmlBuilder: po
});
H({
  type: "href",
  names: ["\\href"],
  props: {
    numArgs: 2,
    argTypes: ["url", "original"],
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = e[1], n = te(e[0], "url").url;
    return t.settings.isTrusted({
      command: "\\href",
      url: n
    }) ? {
      type: "href",
      mode: t.mode,
      href: n,
      body: Me(a)
    } : t.formatUnsupportedCmd("\\href");
  },
  htmlBuilder: (r, e) => {
    var t = Ie(r.body, e, !1);
    return Is(r.href, [], t, e);
  },
  mathmlBuilder: (r, e) => {
    var t = Q0(r.body, e);
    return t instanceof R || (t = new R("mrow", [t])), t.setAttribute("href", r.href), t;
  }
});
H({
  type: "href",
  names: ["\\url"],
  props: {
    numArgs: 1,
    argTypes: ["url"],
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = te(e[0], "url").url;
    if (!t.settings.isTrusted({
      command: "\\url",
      url: a
    }))
      return t.formatUnsupportedCmd("\\url");
    for (var n = [], i = 0; i < a.length; i++) {
      var o = a[i];
      o === "~" && (o = "\\textasciitilde"), n.push({
        type: "textord",
        mode: "text",
        text: o
      });
    }
    var u = {
      type: "text",
      mode: t.mode,
      font: "\\texttt",
      body: n
    };
    return {
      type: "href",
      mode: t.mode,
      href: a,
      body: Me(u)
    };
  }
});
H({
  type: "hbox",
  names: ["\\hbox"],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInText: !0,
    primitive: !0
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "hbox",
      mode: t.mode,
      body: Me(e[0])
    };
  },
  htmlBuilder(r, e) {
    var t = Ie(r.body, e, !1);
    return N0(t);
  },
  mathmlBuilder(r, e) {
    return new R("mrow", n0(r.body, e));
  }
});
H({
  type: "html",
  names: ["\\htmlClass", "\\htmlId", "\\htmlStyle", "\\htmlData"],
  props: {
    numArgs: 2,
    argTypes: ["raw", "original"],
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a,
      token: n
    } = r, i = te(e[0], "raw").string, o = e[1];
    t.settings.strict && t.settings.reportNonstrict("htmlExtension", "HTML extension is disabled on strict mode");
    var u, d = {};
    switch (a) {
      case "\\htmlClass":
        d.class = i, u = {
          command: "\\htmlClass",
          class: i
        };
        break;
      case "\\htmlId":
        d.id = i, u = {
          command: "\\htmlId",
          id: i
        };
        break;
      case "\\htmlStyle":
        d.style = i, u = {
          command: "\\htmlStyle",
          style: i
        };
        break;
      case "\\htmlData": {
        for (var p = i.split(","), b = 0; b < p.length; b++) {
          var w = p[b], S = w.indexOf("=");
          if (S < 0)
            throw new E("\\htmlData key/value '" + w + "' missing equals sign");
          var k = w.slice(0, S), A = w.slice(S + 1);
          d["data-" + k.trim()] = A;
        }
        u = {
          command: "\\htmlData",
          attributes: d
        };
        break;
      }
      default:
        throw new Error("Unrecognized html command");
    }
    return t.settings.isTrusted(u) ? {
      type: "html",
      mode: t.mode,
      attributes: d,
      body: Me(o)
    } : t.formatUnsupportedCmd(a);
  },
  htmlBuilder: (r, e) => {
    var t = Ie(r.body, e, !1), a = ["enclosing"];
    r.attributes.class && a.push(...r.attributes.class.trim().split(/\s+/));
    var n = I(a, t, e);
    for (var i in r.attributes)
      i !== "class" && r.attributes.hasOwnProperty(i) && n.setAttribute(i, r.attributes[i]);
    return n;
  },
  mathmlBuilder: (r, e) => Q0(r.body, e)
});
H({
  type: "htmlmathml",
  names: ["\\html@mathml"],
  props: {
    numArgs: 2,
    allowedInArgument: !0,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r;
    return {
      type: "htmlmathml",
      mode: t.mode,
      html: Me(e[0]),
      mathml: Me(e[1])
    };
  },
  htmlBuilder: (r, e) => {
    var t = Ie(r.html, e, !1);
    return N0(t);
  },
  mathmlBuilder: (r, e) => Q0(r.mathml, e)
});
var sa = function(e) {
  if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(e))
    return {
      number: +e,
      unit: "bp"
    };
  var t = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(e);
  if (!t)
    throw new E("Invalid size: '" + e + "' in \\includegraphics");
  var a = {
    number: +(t[1] + t[2]),
    // sign + magnitude, cast to number
    unit: t[3]
  };
  if (!ui(a))
    throw new E("Invalid unit: '" + a.unit + "' in \\includegraphics.");
  return a;
};
H({
  type: "includegraphics",
  names: ["\\includegraphics"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    argTypes: ["raw", "url"],
    allowedInText: !1
  },
  handler: (r, e, t) => {
    var {
      parser: a
    } = r, n = {
      number: 0,
      unit: "em"
    }, i = {
      number: 0.9,
      unit: "em"
    }, o = {
      number: 0,
      unit: "em"
    }, u = "";
    if (t[0])
      for (var d = te(t[0], "raw").string, p = d.split(","), b = 0; b < p.length; b++) {
        var w = p[b].split("=");
        if (w.length === 2) {
          var S = w[1].trim();
          switch (w[0].trim()) {
            case "alt":
              u = S;
              break;
            case "width":
              n = sa(S);
              break;
            case "height":
              i = sa(S);
              break;
            case "totalheight":
              o = sa(S);
              break;
            default:
              throw new E("Invalid key: '" + w[0] + "' in \\includegraphics.");
          }
        }
      }
    var k = te(e[0], "url").url;
    return u === "" && (u = k, u = u.replace(/^.*[\\/]/, ""), u = u.substring(0, u.lastIndexOf("."))), a.settings.isTrusted({
      command: "\\includegraphics",
      url: k
    }) ? {
      type: "includegraphics",
      mode: a.mode,
      alt: u,
      width: n,
      height: i,
      totalheight: o,
      src: k
    } : a.formatUnsupportedCmd("\\includegraphics");
  },
  htmlBuilder: (r, e) => {
    var t = we(r.height, e), a = 0;
    r.totalheight.number > 0 && (a = we(r.totalheight, e) - t);
    var n = 0;
    r.width.number > 0 && (n = we(r.width, e));
    var i = {
      height: q(t + a)
    };
    n > 0 && (i.width = q(n)), a > 0 && (i.verticalAlign = q(-a));
    var o = new bs(r.src, r.alt, i);
    return o.height = t, o.depth = a, o;
  },
  mathmlBuilder: (r, e) => {
    var t = new R("mglyph", []);
    t.setAttribute("alt", r.alt);
    var a = we(r.height, e), n = 0;
    if (r.totalheight.number > 0 && (n = we(r.totalheight, e) - a, t.setAttribute("valign", q(-n))), t.setAttribute("height", q(a + n)), r.width.number > 0) {
      var i = we(r.width, e);
      t.setAttribute("width", q(i));
    }
    return t.setAttribute("src", r.src), t;
  }
});
H({
  type: "kern",
  names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    primitive: !0,
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = te(e[0], "size");
    if (t.settings.strict) {
      var i = a[1] === "m", o = n.value.unit === "mu";
      i ? (o || t.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + a + " supports only mu units, " + ("not " + n.value.unit + " units")), t.mode !== "math" && t.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + a + " works only in math mode")) : o && t.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + a + " doesn't support mu units");
    }
    return {
      type: "kern",
      mode: t.mode,
      dimension: n.value
    };
  },
  htmlBuilder(r, e) {
    return fi(r.dimension, e);
  },
  mathmlBuilder(r, e) {
    var t = we(r.dimension, e);
    return new wi(t);
  }
});
H({
  type: "lap",
  names: ["\\mathllap", "\\mathrlap", "\\mathclap"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "lap",
      mode: t.mode,
      alignment: a.slice(5),
      body: n
    };
  },
  htmlBuilder: (r, e) => {
    var t;
    r.alignment === "clap" ? (t = I([], [ue(r.body, e)]), t = I(["inner"], [t], e)) : t = I(["inner"], [ue(r.body, e)]);
    var a = I(["fix"], []), n = I([r.alignment], [t, a], e), i = I(["strut"]);
    return i.style.height = q(n.height + n.depth), n.depth && (i.style.verticalAlign = q(-n.depth)), n.children.unshift(i), n = I(["thinbox"], [n], e), I(["mord", "vbox"], [n], e);
  },
  mathmlBuilder: (r, e) => {
    var t = new R("mpadded", [pe(r.body, e)]);
    if (r.alignment !== "rlap") {
      var a = r.alignment === "llap" ? "-1" : "-0.5";
      t.setAttribute("lspace", a + "width");
    }
    return t.setAttribute("width", "0px"), t;
  }
});
H({
  type: "styling",
  names: ["\\(", "$"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    allowedInMath: !1
  },
  handler(r, e) {
    var {
      funcName: t,
      parser: a
    } = r, n = a.mode;
    a.switchMode("math");
    var i = t === "\\(" ? "\\)" : "$", o = a.parseExpression(!1, i);
    return a.expect(i), a.switchMode(n), {
      type: "styling",
      mode: a.mode,
      style: "text",
      body: o
    };
  }
});
H({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\)", "\\]"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    allowedInMath: !1
  },
  handler(r, e) {
    throw new E("Mismatched " + r.funcName);
  }
});
var Ln = (r, e) => {
  switch (e.style.size) {
    case K.DISPLAY.size:
      return r.display;
    case K.TEXT.size:
      return r.text;
    case K.SCRIPT.size:
      return r.script;
    case K.SCRIPTSCRIPT.size:
      return r.scriptscript;
    default:
      return r.text;
  }
};
H({
  type: "mathchoice",
  names: ["\\mathchoice"],
  props: {
    numArgs: 4,
    primitive: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r;
    return {
      type: "mathchoice",
      mode: t.mode,
      display: Me(e[0]),
      text: Me(e[1]),
      script: Me(e[2]),
      scriptscript: Me(e[3])
    };
  },
  htmlBuilder: (r, e) => {
    var t = Ln(r, e), a = Ie(t, e, !1);
    return N0(a);
  },
  mathmlBuilder: (r, e) => {
    var t = Ln(r, e);
    return Q0(t, e);
  }
});
var Vi = (r, e, t, a, n, i, o) => {
  r = I([], [r]);
  var u = t && L0(t), d, p;
  if (e) {
    var b = ue(e, a.havingStyle(n.sup()), a);
    p = {
      elem: b,
      kern: Math.max(a.fontMetrics().bigOpSpacing1, a.fontMetrics().bigOpSpacing3 - b.depth)
    };
  }
  if (t) {
    var w = ue(t, a.havingStyle(n.sub()), a);
    d = {
      elem: w,
      kern: Math.max(a.fontMetrics().bigOpSpacing2, a.fontMetrics().bigOpSpacing4 - w.height)
    };
  }
  var S;
  if (p && d) {
    var k = a.fontMetrics().bigOpSpacing5 + d.elem.height + d.elem.depth + d.kern + r.depth + o;
    S = oe({
      positionType: "bottom",
      positionData: k,
      children: [{
        type: "kern",
        size: a.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: d.elem,
        marginLeft: q(-i)
      }, {
        type: "kern",
        size: d.kern
      }, {
        type: "elem",
        elem: r
      }, {
        type: "kern",
        size: p.kern
      }, {
        type: "elem",
        elem: p.elem,
        marginLeft: q(i)
      }, {
        type: "kern",
        size: a.fontMetrics().bigOpSpacing5
      }]
    });
  } else if (d) {
    var A = r.height - o;
    S = oe({
      positionType: "top",
      positionData: A,
      children: [{
        type: "kern",
        size: a.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: d.elem,
        marginLeft: q(-i)
      }, {
        type: "kern",
        size: d.kern
      }, {
        type: "elem",
        elem: r
      }]
    });
  } else if (p) {
    var z = r.depth + o;
    S = oe({
      positionType: "bottom",
      positionData: z,
      children: [{
        type: "elem",
        elem: r
      }, {
        type: "kern",
        size: p.kern
      }, {
        type: "elem",
        elem: p.elem,
        marginLeft: q(i)
      }, {
        type: "kern",
        size: a.fontMetrics().bigOpSpacing5
      }]
    });
  } else
    return r;
  var D = [S];
  if (d && i !== 0 && !u) {
    var O = I(["mspace"], [], a);
    O.style.marginRight = q(i), D.unshift(O);
  }
  return I(["mop", "op-limits"], D, a);
}, Yi = /* @__PURE__ */ new Set(["\\smallint"]), Tt = (r, e) => {
  var t, a, n = !1, i;
  r.type === "supsub" ? (t = r.sup, a = r.sub, i = te(r.base, "op"), n = !0) : i = te(r, "op");
  var o = e.style, u = !1;
  o.size === K.DISPLAY.size && i.symbol && !Yi.has(i.name) && (u = !0);
  var d;
  if (i.symbol) {
    var p = u ? "Size2-Regular" : "Size1-Regular", b = "";
    if ((i.name === "\\oiint" || i.name === "\\oiiint") && (b = i.name.slice(1), i.name = b === "oiint" ? "\\iint" : "\\iiint"), d = je(i.name, p, "math", e, ["mop", "op-symbol", u ? "large-op" : "small-op"]), b.length > 0) {
      var w = d.italic, S = vi(b + "Size" + (u ? "2" : "1"), e);
      d = oe({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: d,
          shift: 0
        }, {
          type: "elem",
          elem: S,
          shift: u ? 0.08 : 0
        }]
      }), i.name = "\\" + b, d.classes.unshift("mop"), d.italic = w;
    }
  } else if (i.body) {
    var k = Ie(i.body, e, !0);
    k.length === 1 && k[0] instanceof r0 ? (d = k[0], d.classes[0] = "mop") : d = I(["mop"], k, e);
  } else {
    for (var A = [], z = 1; z < i.name.length; z++)
      A.push(Na(i.name[z], i.mode, e));
    d = I(["mop"], A, e);
  }
  var D = 0, O = 0;
  return (d instanceof r0 || i.name === "\\oiint" || i.name === "\\oiiint") && !i.suppressBaseShift && (D = (d.height - d.depth) / 2 - e.fontMetrics().axisHeight, O = d.italic || 0), n ? Vi(d, t, a, e, o, O, D) : (D && (d.style.position = "relative", d.style.top = q(D)), d);
}, Ft = (r, e) => {
  var t;
  if (r.symbol)
    t = new R("mo", [u0(r.name, r.mode)]), Yi.has(r.name) && t.setAttribute("largeop", "false");
  else if (r.body)
    t = new R("mo", n0(r.body, e));
  else {
    t = new R("mi", [new Te(r.name.slice(1))]);
    var a = new R("mo", [u0("⁡", "text")]);
    r.parentIsSupSub ? t = new R("mrow", [t, a]) : t = xi([t, a]);
  }
  return t;
}, fo = {
  "∏": "\\prod",
  "∐": "\\coprod",
  "∑": "\\sum",
  "⋀": "\\bigwedge",
  "⋁": "\\bigvee",
  "⋂": "\\bigcap",
  "⋃": "\\bigcup",
  "⨀": "\\bigodot",
  "⨁": "\\bigoplus",
  "⨂": "\\bigotimes",
  "⨄": "\\biguplus",
  "⨆": "\\bigsqcup"
};
H({
  type: "op",
  names: ["\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap", "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes", "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint", "∏", "∐", "∑", "⋀", "⋁", "⋂", "⋃", "⨀", "⨁", "⨂", "⨄", "⨆"],
  props: {
    numArgs: 0
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = a;
    return n.length === 1 && (n = fo[n]), {
      type: "op",
      mode: t.mode,
      limits: !0,
      parentIsSupSub: !1,
      symbol: !0,
      name: n
    };
  },
  htmlBuilder: Tt,
  mathmlBuilder: Ft
});
H({
  type: "op",
  names: ["\\mathop"],
  props: {
    numArgs: 1,
    primitive: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = e[0];
    return {
      type: "op",
      mode: t.mode,
      limits: !1,
      parentIsSupSub: !1,
      symbol: !1,
      body: Me(a)
    };
  },
  htmlBuilder: Tt,
  mathmlBuilder: Ft
});
var go = {
  "∫": "\\int",
  "∬": "\\iint",
  "∭": "\\iiint",
  "∮": "\\oint",
  "∯": "\\oiint",
  "∰": "\\oiiint"
};
H({
  type: "op",
  names: ["\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg", "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp", "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th"],
  props: {
    numArgs: 0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r;
    return {
      type: "op",
      mode: e.mode,
      limits: !1,
      parentIsSupSub: !1,
      symbol: !1,
      name: t
    };
  },
  htmlBuilder: Tt,
  mathmlBuilder: Ft
});
H({
  type: "op",
  names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
  props: {
    numArgs: 0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r;
    return {
      type: "op",
      mode: e.mode,
      limits: !0,
      parentIsSupSub: !1,
      symbol: !1,
      name: t
    };
  },
  htmlBuilder: Tt,
  mathmlBuilder: Ft
});
H({
  type: "op",
  names: ["\\int", "\\iint", "\\iiint", "\\oint", "\\oiint", "\\oiiint", "∫", "∬", "∭", "∮", "∯", "∰"],
  props: {
    numArgs: 0,
    allowedInArgument: !0
  },
  handler(r) {
    var {
      parser: e,
      funcName: t
    } = r, a = t;
    return a.length === 1 && (a = go[a]), {
      type: "op",
      mode: e.mode,
      limits: !1,
      parentIsSupSub: !1,
      symbol: !0,
      name: a
    };
  },
  htmlBuilder: Tt,
  mathmlBuilder: Ft
});
var Xi = (r, e) => {
  var t, a, n = !1, i;
  r.type === "supsub" ? (t = r.sup, a = r.sub, i = te(r.base, "operatorname"), n = !0) : i = te(r, "operatorname");
  var o;
  if (i.body.length > 0) {
    for (var u = i.body.map((w) => {
      var S = "text" in w ? w.text : void 0;
      return typeof S == "string" ? {
        type: "textord",
        mode: w.mode,
        text: S
      } : w;
    }), d = Ie(u, e.withFont("mathrm"), !0), p = 0; p < d.length; p++) {
      var b = d[p];
      b instanceof r0 && (b.text = b.text.replace(/\u2212/, "-").replace(/\u2217/, "*"));
    }
    o = I(["mop"], d, e);
  } else
    o = I(["mop"], [], e);
  return n ? Vi(o, t, a, e, e.style, 0, 0) : o;
}, vo = (r, e) => {
  for (var t = n0(r.body, e.withFont("mathrm")), a = !0, n = 0; n < t.length; n++) {
    var i = t[n];
    if (!(i instanceof wi)) if (i instanceof R)
      switch (i.type) {
        case "mi":
        case "mn":
        case "mspace":
        case "mtext":
          break;
        // Do nothing yet.
        case "mo": {
          var o = i.children[0];
          i.children.length === 1 && o instanceof Te ? o.text = o.text.replace(/\u2212/, "-").replace(/\u2217/, "*") : a = !1;
          break;
        }
        default:
          a = !1;
      }
    else
      a = !1;
  }
  if (a) {
    var u = t.map((b) => b.toText()).join("");
    t = [new Te(u)];
  }
  var d = new R("mi", t);
  d.setAttribute("mathvariant", "normal");
  var p = new R("mo", [u0("⁡", "text")]);
  return r.parentIsSupSub ? new R("mrow", [d, p]) : xi([d, p]);
};
H({
  type: "operatorname",
  names: ["\\operatorname@", "\\operatornamewithlimits"],
  props: {
    numArgs: 1
  },
  handler: (r, e) => {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "operatorname",
      mode: t.mode,
      body: Me(n),
      alwaysHandleSupSub: a === "\\operatornamewithlimits",
      limits: !1,
      parentIsSupSub: !1
    };
  },
  htmlBuilder: Xi,
  mathmlBuilder: vo
});
h("\\operatorname", "\\@ifstar\\operatornamewithlimits\\operatorname@");
ut({
  type: "ordgroup",
  htmlBuilder(r, e) {
    return r.semisimple ? N0(Ie(r.body, e, !1)) : I(["mord"], Ie(r.body, e, !0), e);
  },
  mathmlBuilder(r, e) {
    return Q0(r.body, e, !0);
  }
});
H({
  type: "overline",
  names: ["\\overline"],
  props: {
    numArgs: 1
  },
  handler(r, e) {
    var {
      parser: t
    } = r, a = e[0];
    return {
      type: "overline",
      mode: t.mode,
      body: a
    };
  },
  htmlBuilder(r, e) {
    var t = ue(r.body, e.havingCrampedStyle()), a = xt("overline-line", e), n = e.fontMetrics().defaultRuleThickness, i = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: t
      }, {
        type: "kern",
        size: 3 * n
      }, {
        type: "elem",
        elem: a
      }, {
        type: "kern",
        size: n
      }]
    });
    return I(["mord", "overline"], [i], e);
  },
  mathmlBuilder(r, e) {
    var t = new R("mo", [new Te("‾")]);
    t.setAttribute("stretchy", "true");
    var a = new R("mover", [pe(r.body, e), t]);
    return a.setAttribute("accent", "true"), a;
  }
});
H({
  type: "phantom",
  names: ["\\phantom"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = e[0];
    return {
      type: "phantom",
      mode: t.mode,
      body: Me(a)
    };
  },
  htmlBuilder: (r, e) => {
    var t = Ie(r.body, e.withPhantom(), !1);
    return N0(t);
  },
  mathmlBuilder: (r, e) => {
    var t = n0(r.body, e);
    return new R("mphantom", t);
  }
});
h("\\hphantom", "\\smash{\\phantom{#1}}");
H({
  type: "vphantom",
  names: ["\\vphantom"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      parser: t
    } = r, a = e[0];
    return {
      type: "vphantom",
      mode: t.mode,
      body: a
    };
  },
  htmlBuilder: (r, e) => {
    var t = I(["inner"], [ue(r.body, e.withPhantom())]), a = I(["fix"], []);
    return I(["mord", "rlap"], [t, a], e);
  },
  mathmlBuilder: (r, e) => {
    var t = n0(Me(r.body), e), a = new R("mphantom", t), n = new R("mpadded", [a]);
    return n.setAttribute("width", "0px"), n;
  }
});
H({
  type: "raisebox",
  names: ["\\raisebox"],
  props: {
    numArgs: 2,
    argTypes: ["size", "hbox"],
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t
    } = r, a = te(e[0], "size").value, n = e[1];
    return {
      type: "raisebox",
      mode: t.mode,
      dy: a,
      body: n
    };
  },
  htmlBuilder(r, e) {
    var t = ue(r.body, e), a = we(r.dy, e);
    return oe({
      positionType: "shift",
      positionData: -a,
      children: [{
        type: "elem",
        elem: t
      }]
    });
  },
  mathmlBuilder(r, e) {
    var t = new R("mpadded", [pe(r.body, e)]), a = r.dy.number + r.dy.unit;
    return t.setAttribute("voffset", a), t;
  }
});
H({
  type: "internal",
  names: ["\\relax"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    allowedInArgument: !0
  },
  handler(r) {
    var {
      parser: e
    } = r;
    return {
      type: "internal",
      mode: e.mode
    };
  }
});
H({
  type: "rule",
  names: ["\\rule"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    allowedInText: !0,
    allowedInMath: !0,
    argTypes: ["size", "size", "size"]
  },
  handler(r, e, t) {
    var {
      parser: a
    } = r, n = t[0], i = te(e[0], "size"), o = te(e[1], "size");
    return {
      type: "rule",
      mode: a.mode,
      shift: n && te(n, "size").value,
      width: i.value,
      height: o.value
    };
  },
  htmlBuilder(r, e) {
    var t = I(["mord", "rule"], [], e), a = we(r.width, e), n = we(r.height, e), i = r.shift ? we(r.shift, e) : 0;
    return t.style.borderRightWidth = q(a), t.style.borderTopWidth = q(n), t.style.bottom = q(i), t.width = a, t.height = n + i, t.depth = -i, t.maxFontSize = n * 1.125 * e.sizeMultiplier, t;
  },
  mathmlBuilder(r, e) {
    var t = we(r.width, e), a = we(r.height, e), n = r.shift ? we(r.shift, e) : 0, i = e.color && e.getColor() || "black", o = new R("mspace");
    o.setAttribute("mathbackground", i), o.setAttribute("width", q(t)), o.setAttribute("height", q(a));
    var u = new R("mpadded", [o]);
    return n >= 0 ? u.setAttribute("height", q(n)) : (u.setAttribute("height", q(n)), u.setAttribute("depth", q(-n))), u.setAttribute("voffset", q(n)), u;
  }
});
function Ki(r, e, t) {
  for (var a = Ie(r, e, !1), n = e.sizeMultiplier / t.sizeMultiplier, i = 0; i < a.length; i++) {
    var o = a[i].classes.indexOf("sizing");
    o < 0 ? Array.prototype.push.apply(a[i].classes, e.sizingClasses(t)) : a[i].classes[o + 1] === "reset-size" + e.size && (a[i].classes[o + 1] = "reset-size" + t.size), a[i].height *= n, a[i].depth *= n;
  }
  return N0(a);
}
var Hn = ["\\tiny", "\\sixptsize", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"], bo = (r, e) => {
  var t = e.havingSize(r.size);
  return Ki(r.body, t, e);
};
H({
  type: "sizing",
  names: Hn,
  props: {
    numArgs: 0,
    allowedInText: !0
  },
  handler: (r, e) => {
    var {
      breakOnTokenText: t,
      funcName: a,
      parser: n
    } = r, i = n.parseExpression(!1, t);
    return {
      type: "sizing",
      mode: n.mode,
      // Figure out what size to use based on the list of functions above
      size: Hn.indexOf(a) + 1,
      body: i
    };
  },
  htmlBuilder: bo,
  mathmlBuilder: (r, e) => {
    var t = e.havingSize(r.size), a = n0(r.body, t), n = new R("mstyle", a);
    return n.setAttribute("mathsize", q(t.sizeMultiplier)), n;
  }
});
H({
  type: "smash",
  names: ["\\smash"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: !0
  },
  handler: (r, e, t) => {
    var {
      parser: a
    } = r, n = !1, i = !1, o = t[0] && te(t[0], "ordgroup");
    if (o)
      for (var u = "", d = 0; d < o.body.length; ++d) {
        var p = o.body[d];
        if (u = Er(p).text, u === "t")
          n = !0;
        else if (u === "b")
          i = !0;
        else {
          n = !1, i = !1;
          break;
        }
      }
    else
      n = !0, i = !0;
    var b = e[0];
    return {
      type: "smash",
      mode: a.mode,
      body: b,
      smashHeight: n,
      smashDepth: i
    };
  },
  htmlBuilder: (r, e) => {
    var t = I([], [ue(r.body, e)]);
    if (!r.smashHeight && !r.smashDepth)
      return t;
    if (r.smashHeight && (t.height = 0), r.smashDepth && (t.depth = 0), r.smashHeight && r.smashDepth)
      return I(["mord", "smash"], [t], e);
    if (t.children)
      for (var a = 0; a < t.children.length; a++)
        r.smashHeight && (t.children[a].height = 0), r.smashDepth && (t.children[a].depth = 0);
    var n = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: t
      }]
    });
    return I(["mord"], [n], e);
  },
  mathmlBuilder: (r, e) => {
    var t = new R("mpadded", [pe(r.body, e)]);
    return r.smashHeight && t.setAttribute("height", "0px"), r.smashDepth && t.setAttribute("depth", "0px"), t;
  }
});
H({
  type: "sqrt",
  names: ["\\sqrt"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler(r, e, t) {
    var {
      parser: a
    } = r, n = t[0], i = e[0];
    return {
      type: "sqrt",
      mode: a.mode,
      body: i,
      index: n
    };
  },
  htmlBuilder(r, e) {
    var t = ue(r.body, e.havingCrampedStyle());
    t.height === 0 && (t.height = e.fontMetrics().xHeight), t = wt(t, e);
    var a = e.fontMetrics(), n = a.defaultRuleThickness, i = n;
    e.style.id < K.TEXT.id && (i = e.fontMetrics().xHeight);
    var o = n + i / 4, u = t.height + t.depth + o + n, {
      span: d,
      ruleWidth: p,
      advanceWidth: b
    } = ao(u, e), w = d.height - p;
    w > t.height + t.depth + o && (o = (o + w - t.height - t.depth) / 2);
    var S = d.height - t.height - o - p;
    t.style.paddingLeft = q(b);
    var k = oe({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: t,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: -(t.height + S)
      }, {
        type: "elem",
        elem: d
      }, {
        type: "kern",
        size: p
      }]
    });
    if (r.index) {
      var A = e.havingStyle(K.SCRIPTSCRIPT), z = ue(r.index, A, e), D = 0.6 * (k.height - k.depth), O = oe({
        positionType: "shift",
        positionData: -D,
        children: [{
          type: "elem",
          elem: z
        }]
      }), $ = I(["root"], [O]);
      return I(["mord", "sqrt"], [$, k], e);
    } else
      return I(["mord", "sqrt"], [k], e);
  },
  mathmlBuilder(r, e) {
    var {
      body: t,
      index: a
    } = r;
    return a ? new R("mroot", [pe(t, e), pe(a, e)]) : new R("msqrt", [pe(t, e)]);
  }
});
var Nn = {
  display: K.DISPLAY,
  text: K.TEXT,
  script: K.SCRIPT,
  scriptscript: K.SCRIPTSCRIPT
};
H({
  type: "styling",
  names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
  props: {
    numArgs: 0,
    allowedInText: !0,
    primitive: !0
  },
  handler(r, e) {
    var {
      breakOnTokenText: t,
      funcName: a,
      parser: n
    } = r, i = n.parseExpression(!0, t), o = a.slice(1, a.length - 5);
    return {
      type: "styling",
      mode: n.mode,
      // Figure out what style to use by pulling out the style from
      // the function name
      style: o,
      body: i
    };
  },
  htmlBuilder(r, e) {
    var t = Nn[r.style], a = e.havingStyle(t).withFont("");
    return Ki(r.body, a, e);
  },
  mathmlBuilder(r, e) {
    var t = Nn[r.style], a = e.havingStyle(t), n = n0(r.body, a), i = new R("mstyle", n), o = {
      display: ["0", "true"],
      text: ["0", "false"],
      script: ["1", "false"],
      scriptscript: ["2", "false"]
    }, u = o[r.style];
    return i.setAttribute("scriptlevel", u[0]), i.setAttribute("displaystyle", u[1]), i;
  }
});
var yo = function(e, t) {
  var a = e.base;
  if (a)
    if (a.type === "op") {
      var n = a.limits && (t.style.size === K.DISPLAY.size || a.alwaysHandleSupSub);
      return n ? Tt : null;
    } else if (a.type === "operatorname") {
      var i = a.alwaysHandleSupSub && (t.style.size === K.DISPLAY.size || a.limits);
      return i ? Xi : null;
    } else {
      if (a.type === "accent")
        return L0(a.base) ? Wa : null;
      if (a.type === "horizBrace") {
        var o = !e.sub;
        return o === a.isOver ? Ui : null;
      } else
        return null;
    }
  else return null;
};
ut({
  type: "supsub",
  htmlBuilder(r, e) {
    var t = yo(r, e);
    if (t)
      return t(r, e);
    var {
      base: a,
      sup: n,
      sub: i
    } = r, o = ue(a, e), u, d, p = e.fontMetrics(), b = 0, w = 0, S = a && L0(a);
    if (n) {
      var k = e.havingStyle(e.style.sup());
      u = ue(n, k, e), S || (b = o.height - k.fontMetrics().supDrop * k.sizeMultiplier / e.sizeMultiplier);
    }
    if (i) {
      var A = e.havingStyle(e.style.sub());
      d = ue(i, A, e), S || (w = o.depth + A.fontMetrics().subDrop * A.sizeMultiplier / e.sizeMultiplier);
    }
    var z;
    e.style === K.DISPLAY ? z = p.sup1 : e.style.cramped ? z = p.sup3 : z = p.sup2;
    var D = e.sizeMultiplier, O = q(0.5 / p.ptPerEm / D), $ = null;
    if (d) {
      var P = r.base && r.base.type === "op" && r.base.name && (r.base.name === "\\oiint" || r.base.name === "\\oiiint");
      (o instanceof r0 || P) && ($ = q(-o.italic));
    }
    var G;
    if (u && d) {
      b = Math.max(b, z, u.depth + 0.25 * p.xHeight), w = Math.max(w, p.sub2);
      var W = p.defaultRuleThickness, V = 4 * W;
      if (b - u.depth - (d.height - w) < V) {
        w = V - (b - u.depth) + d.height;
        var Y = 0.8 * p.xHeight - (b - u.depth);
        Y > 0 && (b += Y, w -= Y);
      }
      var ie = [{
        type: "elem",
        elem: d,
        shift: w,
        marginRight: O,
        marginLeft: $
      }, {
        type: "elem",
        elem: u,
        shift: -b,
        marginRight: O
      }];
      G = oe({
        positionType: "individualShift",
        children: ie
      });
    } else if (d) {
      w = Math.max(w, p.sub1, d.height - 0.8 * p.xHeight);
      var re = [{
        type: "elem",
        elem: d,
        marginLeft: $,
        marginRight: O
      }];
      G = oe({
        positionType: "shift",
        positionData: w,
        children: re
      });
    } else if (u)
      b = Math.max(b, z, u.depth + 0.25 * p.xHeight), G = oe({
        positionType: "shift",
        positionData: -b,
        children: [{
          type: "elem",
          elem: u,
          marginRight: O
        }]
      });
    else
      throw new Error("supsub must have either sup or sub.");
    var U = Aa(o, "right") || "mord";
    return I([U], [o, I(["msupsub"], [G])], e);
  },
  mathmlBuilder(r, e) {
    var t = !1, a, n;
    r.base && r.base.type === "horizBrace" && (n = !!r.sup, n === r.base.isOver && (t = !0, a = r.base.isOver)), r.base && (r.base.type === "op" || r.base.type === "operatorname") && (r.base.parentIsSupSub = !0);
    var i = [pe(r.base, e)];
    r.sub && i.push(pe(r.sub, e)), r.sup && i.push(pe(r.sup, e));
    var o;
    if (t)
      o = a ? "mover" : "munder";
    else if (r.sub)
      if (r.sup) {
        var p = r.base;
        p && p.type === "op" && p.limits && e.style === K.DISPLAY || p && p.type === "operatorname" && p.alwaysHandleSupSub && (e.style === K.DISPLAY || p.limits) ? o = "munderover" : o = "msubsup";
      } else {
        var d = r.base;
        d && d.type === "op" && d.limits && (e.style === K.DISPLAY || d.alwaysHandleSupSub) || d && d.type === "operatorname" && d.alwaysHandleSupSub && (d.limits || e.style === K.DISPLAY) ? o = "munder" : o = "msub";
      }
    else {
      var u = r.base;
      u && u.type === "op" && u.limits && (e.style === K.DISPLAY || u.alwaysHandleSupSub) || u && u.type === "operatorname" && u.alwaysHandleSupSub && (u.limits || e.style === K.DISPLAY) ? o = "mover" : o = "msup";
    }
    return new R(o, i);
  }
});
ut({
  type: "atom",
  htmlBuilder(r, e) {
    return Na(r.text, r.mode, e, ["m" + r.family]);
  },
  mathmlBuilder(r, e) {
    var t = new R("mo", [u0(r.text, r.mode)]);
    if (r.family === "bin") {
      var a = $a(r, e);
      a === "bold-italic" && t.setAttribute("mathvariant", a);
    } else r.family === "punct" ? t.setAttribute("separator", "true") : (r.family === "open" || r.family === "close") && t.setAttribute("stretchy", "false");
    return t;
  }
});
var Zi = {
  mi: "italic",
  mn: "normal",
  mtext: "normal"
};
ut({
  type: "mathord",
  htmlBuilder(r, e) {
    return Cr(r, e, "mathord");
  },
  mathmlBuilder(r, e) {
    var t = new R("mi", [u0(r.text, r.mode, e)]), a = $a(r, e) || "italic";
    return a !== Zi[t.type] && t.setAttribute("mathvariant", a), t;
  }
});
ut({
  type: "textord",
  htmlBuilder(r, e) {
    return Cr(r, e, "textord");
  },
  mathmlBuilder(r, e) {
    var t = u0(r.text, r.mode, e), a = $a(r, e) || "normal", n;
    return r.mode === "text" ? n = new R("mtext", [t]) : /[0-9]/.test(r.text) ? n = new R("mn", [t]) : r.text === "\\prime" ? n = new R("mo", [t]) : n = new R("mi", [t]), a !== Zi[n.type] && n.setAttribute("mathvariant", a), n;
  }
});
var oa = {
  "\\nobreak": "nobreak",
  "\\allowbreak": "allowbreak"
}, ua = {
  " ": {},
  "\\ ": {},
  "~": {
    className: "nobreak"
  },
  "\\space": {},
  "\\nobreakspace": {
    className: "nobreak"
  }
};
ut({
  type: "spacing",
  htmlBuilder(r, e) {
    if (ua.hasOwnProperty(r.text)) {
      var t = ua[r.text].className || "";
      if (r.mode === "text") {
        var a = Cr(r, e, "textord");
        return a.classes.push(t), a;
      } else
        return I(["mspace", t], [Na(r.text, r.mode, e)], e);
    } else {
      if (oa.hasOwnProperty(r.text))
        return I(["mspace", oa[r.text]], [], e);
      throw new E('Unknown type of space "' + r.text + '"');
    }
  },
  mathmlBuilder(r, e) {
    var t;
    if (ua.hasOwnProperty(r.text))
      t = new R("mtext", [new Te(" ")]);
    else {
      if (oa.hasOwnProperty(r.text))
        return new R("mspace");
      throw new E('Unknown type of space "' + r.text + '"');
    }
    return t;
  }
});
var Fn = () => {
  var r = new R("mtd", []);
  return r.setAttribute("width", "50%"), r;
};
ut({
  type: "tag",
  mathmlBuilder(r, e) {
    var t = new R("mtable", [new R("mtr", [Fn(), new R("mtd", [Q0(r.body, e)]), Fn(), new R("mtd", [Q0(r.tag, e)])])]);
    return t.setAttribute("width", "100%"), t;
  }
});
var Pn = {
  "\\text": void 0,
  "\\textrm": "textrm",
  "\\textsf": "textsf",
  "\\texttt": "texttt",
  "\\textnormal": "textrm"
}, $n = {
  "\\textbf": "textbf",
  "\\textmd": "textmd"
}, xo = {
  "\\textit": "textit",
  "\\textup": "textup"
}, Wn = (r, e) => {
  var t = r.font;
  if (t) {
    if (Pn[t])
      return e.withTextFontFamily(Pn[t]);
    if ($n[t])
      return e.withTextFontWeight($n[t]);
    if (t === "\\emph")
      return e.fontShape === "textit" ? e.withTextFontShape("textup") : e.withTextFontShape("textit");
  } else return e;
  return e.withTextFontShape(xo[t]);
};
H({
  type: "text",
  names: [
    // Font families
    "\\text",
    "\\textrm",
    "\\textsf",
    "\\texttt",
    "\\textnormal",
    // Font weights
    "\\textbf",
    "\\textmd",
    // Font Shapes
    "\\textit",
    "\\textup",
    "\\emph"
  ],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInArgument: !0,
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t,
      funcName: a
    } = r, n = e[0];
    return {
      type: "text",
      mode: t.mode,
      body: Me(n),
      font: a
    };
  },
  htmlBuilder(r, e) {
    var t = Wn(r, e), a = Ie(r.body, t, !0);
    return I(["mord", "text"], a, t);
  },
  mathmlBuilder(r, e) {
    var t = Wn(r, e);
    return Q0(r.body, t);
  }
});
H({
  type: "underline",
  names: ["\\underline"],
  props: {
    numArgs: 1,
    allowedInText: !0
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "underline",
      mode: t.mode,
      body: e[0]
    };
  },
  htmlBuilder(r, e) {
    var t = ue(r.body, e), a = xt("underline-line", e), n = e.fontMetrics().defaultRuleThickness, i = oe({
      positionType: "top",
      positionData: t.height,
      children: [{
        type: "kern",
        size: n
      }, {
        type: "elem",
        elem: a
      }, {
        type: "kern",
        size: 3 * n
      }, {
        type: "elem",
        elem: t
      }]
    });
    return I(["mord", "underline"], [i], e);
  },
  mathmlBuilder(r, e) {
    var t = new R("mo", [new Te("‾")]);
    t.setAttribute("stretchy", "true");
    var a = new R("munder", [pe(r.body, e), t]);
    return a.setAttribute("accentunder", "true"), a;
  }
});
H({
  type: "vcenter",
  names: ["\\vcenter"],
  props: {
    numArgs: 1,
    argTypes: ["original"],
    // In LaTeX, \vcenter can act only on a box.
    allowedInText: !1
  },
  handler(r, e) {
    var {
      parser: t
    } = r;
    return {
      type: "vcenter",
      mode: t.mode,
      body: e[0]
    };
  },
  htmlBuilder(r, e) {
    var t = ue(r.body, e), a = e.fontMetrics().axisHeight, n = 0.5 * (t.height - a - (t.depth + a));
    return oe({
      positionType: "shift",
      positionData: n,
      children: [{
        type: "elem",
        elem: t
      }]
    });
  },
  mathmlBuilder(r, e) {
    var t = new R("mpadded", [pe(r.body, e)], ["vcenter"]);
    return new R("mrow", [t]);
  }
});
H({
  type: "verb",
  names: ["\\verb"],
  props: {
    numArgs: 0,
    allowedInText: !0
  },
  handler(r, e, t) {
    throw new E("\\verb ended by end of line instead of matching delimiter");
  },
  htmlBuilder(r, e) {
    for (var t = Gn(r), a = [], n = e.havingStyle(e.style.text()), i = 0; i < t.length; i++) {
      var o = t[i];
      o === "~" && (o = "\\textasciitilde"), a.push(je(o, "Typewriter-Regular", r.mode, n, ["mord", "texttt"]));
    }
    return I(["mord", "text"].concat(n.sizingClasses(e)), pi(a), n);
  },
  mathmlBuilder(r, e) {
    var t = new Te(Gn(r)), a = new R("mtext", [t]);
    return a.setAttribute("mathvariant", "monospace"), a;
  }
});
var Gn = (r) => r.body.replace(/ /g, r.star ? "␣" : " "), X0 = bi, Ji = `[ \r
	]`, wo = "\\\\[a-zA-Z@]+", So = "\\\\[^\uD800-\uDFFF]", ko = "(" + wo + ")" + Ji + "*", Mo = `\\\\(
|[ \r	]+
?)[ \r	]*`, Ea = "[̀-ͯ]", To = new RegExp(Ea + "+$"), Ao = "(" + Ji + "+)|" + // whitespace
(Mo + "|") + // \whitespace
"([!-\\[\\]-‧‪-퟿豈-￿]" + // single codepoint
(Ea + "*") + // ...plus accents
"|[\uD800-\uDBFF][\uDC00-\uDFFF]" + // surrogate pair
(Ea + "*") + // ...plus accents
"|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5" + // \verb unstarred
("|" + ko) + // \macroName + spaces
("|" + So + ")");
class _n {
  // Category codes. The lexer only supports comment characters (14) for now.
  // MacroExpander additionally distinguishes active (13).
  constructor(e, t) {
    this.input = e, this.settings = t, this.tokenRegex = new RegExp(Ao, "g"), this.catcodes = {
      "%": 14,
      // comment character
      "~": 13
      // active character
    };
  }
  setCatcode(e, t) {
    this.catcodes[e] = t;
  }
  /**
   * This function lexes a single token.
   */
  lex() {
    var e = this.input, t = this.tokenRegex.lastIndex;
    if (t === e.length)
      return new t0("EOF", new Ze(this, t, t));
    var a = this.tokenRegex.exec(e);
    if (a === null || a.index !== t)
      throw new E("Unexpected character: '" + e[t] + "'", new t0(e[t], new Ze(this, t, t + 1)));
    var n = a[6] || a[3] || (a[2] ? "\\ " : " ");
    if (this.catcodes[n] === 14) {
      var i = e.indexOf(`
`, this.tokenRegex.lastIndex);
      return i === -1 ? (this.tokenRegex.lastIndex = e.length, this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)")) : this.tokenRegex.lastIndex = i + 1, this.lex();
    }
    return new t0(n, new Ze(this, t, this.tokenRegex.lastIndex));
  }
}
class zo {
  /**
   * Both arguments are optional.  The first argument is an object of
   * built-in mappings which never change.  The second argument is an object
   * of initial (global-level) mappings, which will constantly change
   * according to any global/top-level `set`s done.
   */
  constructor(e, t) {
    e === void 0 && (e = {}), t === void 0 && (t = {}), this.current = t, this.builtins = e, this.undefStack = [];
  }
  /**
   * Start a new nested group, affecting future local `set`s.
   */
  beginGroup() {
    this.undefStack.push({});
  }
  /**
   * End current nested group, restoring values before the group began.
   */
  endGroup() {
    if (this.undefStack.length === 0)
      throw new E("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");
    var e = this.undefStack.pop();
    for (var t in e)
      e.hasOwnProperty(t) && (e[t] == null ? delete this.current[t] : this.current[t] = e[t]);
  }
  /**
   * Ends all currently nested groups (if any), restoring values before the
   * groups began.  Useful in case of an error in the middle of parsing.
   */
  endGroups() {
    for (; this.undefStack.length > 0; )
      this.endGroup();
  }
  /**
   * Detect whether `name` has a definition.  Equivalent to
   * `get(name) != null`.
   */
  has(e) {
    return this.current.hasOwnProperty(e) || this.builtins.hasOwnProperty(e);
  }
  /**
   * Get the current value of a name, or `undefined` if there is no value.
   *
   * Note: Do not use `if (namespace.get(...))` to detect whether a macro
   * is defined, as the definition may be the empty string which evaluates
   * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
   * `if (namespace.has(...))`.
   */
  get(e) {
    return this.current.hasOwnProperty(e) ? this.current[e] : this.builtins[e];
  }
  /**
   * Set the current value of a name, and optionally set it globally too.
   * Local set() sets the current value and (when appropriate) adds an undo
   * operation to the undo stack.  Global set() may change the undo
   * operation at every level, so takes time linear in their number.
   * A value of undefined means to delete existing definitions.
   */
  set(e, t, a) {
    if (a === void 0 && (a = !1), a) {
      for (var n = 0; n < this.undefStack.length; n++)
        delete this.undefStack[n][e];
      this.undefStack.length > 0 && (this.undefStack[this.undefStack.length - 1][e] = t);
    } else {
      var i = this.undefStack[this.undefStack.length - 1];
      i && !i.hasOwnProperty(e) && (i[e] = this.current[e]);
    }
    t == null ? delete this.current[e] : this.current[e] = t;
  }
}
var Co = $i;
h("\\noexpand", function(r) {
  var e = r.popToken();
  return r.isExpandable(e.text) && (e.noexpand = !0, e.treatAsRelax = !0), {
    tokens: [e],
    numArgs: 0
  };
});
h("\\expandafter", function(r) {
  var e = r.popToken();
  return r.expandOnce(!0), {
    tokens: [e],
    numArgs: 0
  };
});
h("\\@firstoftwo", function(r) {
  var e = r.consumeArgs(2);
  return {
    tokens: e[0],
    numArgs: 0
  };
});
h("\\@secondoftwo", function(r) {
  var e = r.consumeArgs(2);
  return {
    tokens: e[1],
    numArgs: 0
  };
});
h("\\@ifnextchar", function(r) {
  var e = r.consumeArgs(3);
  r.consumeSpaces();
  var t = r.future();
  return e[0].length === 1 && e[0][0].text === t.text ? {
    tokens: e[1],
    numArgs: 0
  } : {
    tokens: e[2],
    numArgs: 0
  };
});
h("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");
h("\\TextOrMath", function(r) {
  var e = r.consumeArgs(2);
  return r.mode === "text" ? {
    tokens: e[0],
    numArgs: 0
  } : {
    tokens: e[1],
    numArgs: 0
  };
});
var jn = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15
};
h("\\char", function(r) {
  var e = r.popToken(), t, a = 0;
  if (e.text === "'")
    t = 8, e = r.popToken();
  else if (e.text === '"')
    t = 16, e = r.popToken();
  else if (e.text === "`")
    if (e = r.popToken(), e.text[0] === "\\")
      a = e.text.charCodeAt(1);
    else {
      if (e.text === "EOF")
        throw new E("\\char` missing argument");
      a = e.text.charCodeAt(0);
    }
  else
    t = 10;
  if (t) {
    if (a = jn[e.text], a == null || a >= t)
      throw new E("Invalid base-" + t + " digit " + e.text);
    for (var n; (n = jn[r.future().text]) != null && n < t; )
      a *= t, a += n, r.popToken();
  }
  return "\\@char{" + a + "}";
});
var Ua = (r, e, t, a) => {
  var n = r.consumeArg().tokens;
  if (n.length !== 1)
    throw new E("\\newcommand's first argument must be a macro name");
  var i = n[0].text, o = r.isDefined(i);
  if (o && !e)
    throw new E("\\newcommand{" + i + "} attempting to redefine " + (i + "; use \\renewcommand"));
  if (!o && !t)
    throw new E("\\renewcommand{" + i + "} when command " + i + " does not yet exist; use \\newcommand");
  var u = 0;
  if (n = r.consumeArg().tokens, n.length === 1 && n[0].text === "[") {
    for (var d = "", p = r.expandNextToken(); p.text !== "]" && p.text !== "EOF"; )
      d += p.text, p = r.expandNextToken();
    if (!d.match(/^\s*[0-9]+\s*$/))
      throw new E("Invalid number of arguments: " + d);
    u = parseInt(d), n = r.consumeArg().tokens;
  }
  return o && a || r.macros.set(i, {
    tokens: n,
    numArgs: u
  }), "";
};
h("\\newcommand", (r) => Ua(r, !1, !0, !1));
h("\\renewcommand", (r) => Ua(r, !0, !1, !1));
h("\\providecommand", (r) => Ua(r, !0, !0, !0));
h("\\message", (r) => {
  var e = r.consumeArgs(1)[0];
  return console.log(e.reverse().map((t) => t.text).join("")), "";
});
h("\\errmessage", (r) => {
  var e = r.consumeArgs(1)[0];
  return console.error(e.reverse().map((t) => t.text).join("")), "";
});
h("\\show", (r) => {
  var e = r.popToken(), t = e.text;
  return console.log(e, r.macros.get(t), X0[t], be.math[t], be.text[t]), "";
});
h("\\bgroup", "{");
h("\\egroup", "}");
h("~", "\\nobreakspace");
h("\\lq", "`");
h("\\rq", "'");
h("\\aa", "\\r a");
h("\\AA", "\\r A");
h("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`©}");
h("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}");
h("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`®}");
h("ℬ", "\\mathscr{B}");
h("ℰ", "\\mathscr{E}");
h("ℱ", "\\mathscr{F}");
h("ℋ", "\\mathscr{H}");
h("ℐ", "\\mathscr{I}");
h("ℒ", "\\mathscr{L}");
h("ℳ", "\\mathscr{M}");
h("ℛ", "\\mathscr{R}");
h("ℭ", "\\mathfrak{C}");
h("ℌ", "\\mathfrak{H}");
h("ℨ", "\\mathfrak{Z}");
h("\\Bbbk", "\\Bbb{k}");
h("\\llap", "\\mathllap{\\textrm{#1}}");
h("\\rlap", "\\mathrlap{\\textrm{#1}}");
h("\\clap", "\\mathclap{\\textrm{#1}}");
h("\\mathstrut", "\\vphantom{(}");
h("\\underbar", "\\underline{\\text{#1}}");
h("\\not", '\\html@mathml{\\mathrel{\\mathrlap\\@not}\\nobreak}{\\char"338}');
h("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`≠}}");
h("\\ne", "\\neq");
h("≠", "\\neq");
h("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`∉}}");
h("∉", "\\notin");
h("≘", "\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`≘}}");
h("≙", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`≘}}");
h("≚", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`≚}}");
h("≛", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`≛}}");
h("≝", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`≝}}");
h("≞", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`≞}}");
h("≟", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`≟}}");
h("⟂", "\\perp");
h("‼", "\\mathclose{!\\mkern-0.8mu!}");
h("∌", "\\notni");
h("⌜", "\\ulcorner");
h("⌝", "\\urcorner");
h("⌞", "\\llcorner");
h("⌟", "\\lrcorner");
h("©", "\\copyright");
h("®", "\\textregistered");
h("\\ulcorner", '\\html@mathml{\\@ulcorner}{\\mathop{\\char"231c}}');
h("\\urcorner", '\\html@mathml{\\@urcorner}{\\mathop{\\char"231d}}');
h("\\llcorner", '\\html@mathml{\\@llcorner}{\\mathop{\\char"231e}}');
h("\\lrcorner", '\\html@mathml{\\@lrcorner}{\\mathop{\\char"231f}}');
h("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
h("⋮", "\\vdots");
h("\\varGamma", "\\mathit{\\Gamma}");
h("\\varDelta", "\\mathit{\\Delta}");
h("\\varTheta", "\\mathit{\\Theta}");
h("\\varLambda", "\\mathit{\\Lambda}");
h("\\varXi", "\\mathit{\\Xi}");
h("\\varPi", "\\mathit{\\Pi}");
h("\\varSigma", "\\mathit{\\Sigma}");
h("\\varUpsilon", "\\mathit{\\Upsilon}");
h("\\varPhi", "\\mathit{\\Phi}");
h("\\varPsi", "\\mathit{\\Psi}");
h("\\varOmega", "\\mathit{\\Omega}");
h("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");
h("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu\\relax");
h("\\boxed", "\\fbox{$\\displaystyle{#1}$}");
h("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
h("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
h("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
h("\\dddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ...}}{#1}}");
h("\\ddddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ....}}{#1}}");
var Un = {
  ",": "\\dotsc",
  "\\not": "\\dotsb",
  // \keybin@ checks for the following:
  "+": "\\dotsb",
  "=": "\\dotsb",
  "<": "\\dotsb",
  ">": "\\dotsb",
  "-": "\\dotsb",
  "*": "\\dotsb",
  ":": "\\dotsb",
  // Symbols whose definition starts with \DOTSB:
  "\\DOTSB": "\\dotsb",
  "\\coprod": "\\dotsb",
  "\\bigvee": "\\dotsb",
  "\\bigwedge": "\\dotsb",
  "\\biguplus": "\\dotsb",
  "\\bigcap": "\\dotsb",
  "\\bigcup": "\\dotsb",
  "\\prod": "\\dotsb",
  "\\sum": "\\dotsb",
  "\\bigotimes": "\\dotsb",
  "\\bigoplus": "\\dotsb",
  "\\bigodot": "\\dotsb",
  "\\bigsqcup": "\\dotsb",
  "\\And": "\\dotsb",
  "\\longrightarrow": "\\dotsb",
  "\\Longrightarrow": "\\dotsb",
  "\\longleftarrow": "\\dotsb",
  "\\Longleftarrow": "\\dotsb",
  "\\longleftrightarrow": "\\dotsb",
  "\\Longleftrightarrow": "\\dotsb",
  "\\mapsto": "\\dotsb",
  "\\longmapsto": "\\dotsb",
  "\\hookrightarrow": "\\dotsb",
  "\\doteq": "\\dotsb",
  // Symbols whose definition starts with \mathbin:
  "\\mathbin": "\\dotsb",
  // Symbols whose definition starts with \mathrel:
  "\\mathrel": "\\dotsb",
  "\\relbar": "\\dotsb",
  "\\Relbar": "\\dotsb",
  "\\xrightarrow": "\\dotsb",
  "\\xleftarrow": "\\dotsb",
  // Symbols whose definition starts with \DOTSI:
  "\\DOTSI": "\\dotsi",
  "\\int": "\\dotsi",
  "\\oint": "\\dotsi",
  "\\iint": "\\dotsi",
  "\\iiint": "\\dotsi",
  "\\iiiint": "\\dotsi",
  "\\idotsint": "\\dotsi",
  // Symbols whose definition starts with \DOTSX:
  "\\DOTSX": "\\dotsx"
}, Bo = /* @__PURE__ */ new Set(["bin", "rel"]);
h("\\dots", function(r) {
  var e = "\\dotso", t = r.expandAfterFuture().text;
  return t in Un ? e = Un[t] : (t.slice(0, 4) === "\\not" || t in be.math && Bo.has(be.math[t].group)) && (e = "\\dotsb"), e;
});
var Va = {
  // \rightdelim@ checks for the following:
  ")": !0,
  "]": !0,
  "\\rbrack": !0,
  "\\}": !0,
  "\\rbrace": !0,
  "\\rangle": !0,
  "\\rceil": !0,
  "\\rfloor": !0,
  "\\rgroup": !0,
  "\\rmoustache": !0,
  "\\right": !0,
  "\\bigr": !0,
  "\\biggr": !0,
  "\\Bigr": !0,
  "\\Biggr": !0,
  // \extra@ also tests for the following:
  $: !0,
  // \extrap@ checks for the following:
  ";": !0,
  ".": !0,
  ",": !0
};
h("\\dotso", function(r) {
  var e = r.future().text;
  return e in Va ? "\\ldots\\," : "\\ldots";
});
h("\\dotsc", function(r) {
  var e = r.future().text;
  return e in Va && e !== "," ? "\\ldots\\," : "\\ldots";
});
h("\\cdots", function(r) {
  var e = r.future().text;
  return e in Va ? "\\@cdots\\," : "\\@cdots";
});
h("\\dotsb", "\\cdots");
h("\\dotsm", "\\cdots");
h("\\dotsi", "\\!\\cdots");
h("\\dotsx", "\\ldots\\,");
h("\\DOTSI", "\\relax");
h("\\DOTSB", "\\relax");
h("\\DOTSX", "\\relax");
h("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
h("\\,", "\\tmspace+{3mu}{.1667em}");
h("\\thinspace", "\\,");
h("\\>", "\\mskip{4mu}");
h("\\:", "\\tmspace+{4mu}{.2222em}");
h("\\medspace", "\\:");
h("\\;", "\\tmspace+{5mu}{.2777em}");
h("\\thickspace", "\\;");
h("\\!", "\\tmspace-{3mu}{.1667em}");
h("\\negthinspace", "\\!");
h("\\negmedspace", "\\tmspace-{4mu}{.2222em}");
h("\\negthickspace", "\\tmspace-{5mu}{.277em}");
h("\\enspace", "\\kern.5em ");
h("\\enskip", "\\hskip.5em\\relax");
h("\\quad", "\\hskip1em\\relax");
h("\\qquad", "\\hskip2em\\relax");
h("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
h("\\tag@paren", "\\tag@literal{({#1})}");
h("\\tag@literal", (r) => {
  if (r.macros.get("\\df@tag"))
    throw new E("Multiple \\tag");
  return "\\gdef\\df@tag{\\text{#1}}";
});
h("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}");
h("\\pod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)");
h("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
h("\\mod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1");
h("\\newline", "\\\\\\relax");
h("\\TeX", "\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");
var Qi = q(k0["Main-Regular"][84][1] - 0.7 * k0["Main-Regular"][65][1]);
h("\\LaTeX", "\\textrm{\\html@mathml{" + ("L\\kern-.36em\\raisebox{" + Qi + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{LaTeX}}");
h("\\KaTeX", "\\textrm{\\html@mathml{" + ("K\\kern-.17em\\raisebox{" + Qi + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{KaTeX}}");
h("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
h("\\@hspace", "\\hskip #1\\relax");
h("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");
h("\\ordinarycolon", ":");
h("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}");
h("\\dblcolon", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char"2237}}');
h("\\coloneqq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2254}}');
h("\\Coloneqq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2237\\char"3d}}');
h("\\coloneq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"3a\\char"2212}}');
h("\\Coloneq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"2237\\char"2212}}');
h("\\eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2255}}');
h("\\Eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"3d\\char"2237}}');
h("\\eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2239}}');
h("\\Eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"2212\\char"2237}}');
h("\\colonapprox", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"3a\\char"2248}}');
h("\\Colonapprox", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"2237\\char"2248}}');
h("\\colonsim", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"3a\\char"223c}}');
h("\\Colonsim", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"2237\\char"223c}}');
h("∷", "\\dblcolon");
h("∹", "\\eqcolon");
h("≔", "\\coloneqq");
h("≕", "\\eqqcolon");
h("⩴", "\\Coloneqq");
h("\\ratio", "\\vcentcolon");
h("\\coloncolon", "\\dblcolon");
h("\\colonequals", "\\coloneqq");
h("\\coloncolonequals", "\\Coloneqq");
h("\\equalscolon", "\\eqqcolon");
h("\\equalscoloncolon", "\\Eqqcolon");
h("\\colonminus", "\\coloneq");
h("\\coloncolonminus", "\\Coloneq");
h("\\minuscolon", "\\eqcolon");
h("\\minuscoloncolon", "\\Eqcolon");
h("\\coloncolonapprox", "\\Colonapprox");
h("\\coloncolonsim", "\\Colonsim");
h("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
h("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}");
h("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
h("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}");
h("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`∌}}");
h("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
h("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");
h("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
h("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
h("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{lim}}");
h("\\varliminf", "\\DOTSB\\operatorname*{\\underline{lim}}");
h("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{lim}}");
h("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{lim}}");
h("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{≩}");
h("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{≨}");
h("\\ngeqq", "\\html@mathml{\\@ngeqq}{≱}");
h("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{≱}");
h("\\nleqq", "\\html@mathml{\\@nleqq}{≰}");
h("\\nleqslant", "\\html@mathml{\\@nleqslant}{≰}");
h("\\nshortmid", "\\html@mathml{\\@nshortmid}{∤}");
h("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{∦}");
h("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{⊈}");
h("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{⊉}");
h("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{⊊}");
h("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{⫋}");
h("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{⊋}");
h("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{⫌}");
h("\\imath", "\\html@mathml{\\@imath}{ı}");
h("\\jmath", "\\html@mathml{\\@jmath}{ȷ}");
h("\\llbracket", "\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`⟦}}");
h("\\rrbracket", "\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`⟧}}");
h("⟦", "\\llbracket");
h("⟧", "\\rrbracket");
h("\\lBrace", "\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`⦃}}");
h("\\rBrace", "\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`⦄}}");
h("⦃", "\\lBrace");
h("⦄", "\\rBrace");
h("\\minuso", "\\mathbin{\\html@mathml{{\\mathrlap{\\mathchoice{\\kern{0.145em}}{\\kern{0.145em}}{\\kern{0.1015em}}{\\kern{0.0725em}}\\circ}{-}}}{\\char`⦵}}");
h("⦵", "\\minuso");
h("\\darr", "\\downarrow");
h("\\dArr", "\\Downarrow");
h("\\Darr", "\\Downarrow");
h("\\lang", "\\langle");
h("\\rang", "\\rangle");
h("\\uarr", "\\uparrow");
h("\\uArr", "\\Uparrow");
h("\\Uarr", "\\Uparrow");
h("\\N", "\\mathbb{N}");
h("\\R", "\\mathbb{R}");
h("\\Z", "\\mathbb{Z}");
h("\\alef", "\\aleph");
h("\\alefsym", "\\aleph");
h("\\Alpha", "\\mathrm{A}");
h("\\Beta", "\\mathrm{B}");
h("\\bull", "\\bullet");
h("\\Chi", "\\mathrm{X}");
h("\\clubs", "\\clubsuit");
h("\\cnums", "\\mathbb{C}");
h("\\Complex", "\\mathbb{C}");
h("\\Dagger", "\\ddagger");
h("\\diamonds", "\\diamondsuit");
h("\\empty", "\\emptyset");
h("\\Epsilon", "\\mathrm{E}");
h("\\Eta", "\\mathrm{H}");
h("\\exist", "\\exists");
h("\\harr", "\\leftrightarrow");
h("\\hArr", "\\Leftrightarrow");
h("\\Harr", "\\Leftrightarrow");
h("\\hearts", "\\heartsuit");
h("\\image", "\\Im");
h("\\infin", "\\infty");
h("\\Iota", "\\mathrm{I}");
h("\\isin", "\\in");
h("\\Kappa", "\\mathrm{K}");
h("\\larr", "\\leftarrow");
h("\\lArr", "\\Leftarrow");
h("\\Larr", "\\Leftarrow");
h("\\lrarr", "\\leftrightarrow");
h("\\lrArr", "\\Leftrightarrow");
h("\\Lrarr", "\\Leftrightarrow");
h("\\Mu", "\\mathrm{M}");
h("\\natnums", "\\mathbb{N}");
h("\\Nu", "\\mathrm{N}");
h("\\Omicron", "\\mathrm{O}");
h("\\plusmn", "\\pm");
h("\\rarr", "\\rightarrow");
h("\\rArr", "\\Rightarrow");
h("\\Rarr", "\\Rightarrow");
h("\\real", "\\Re");
h("\\reals", "\\mathbb{R}");
h("\\Reals", "\\mathbb{R}");
h("\\Rho", "\\mathrm{P}");
h("\\sdot", "\\cdot");
h("\\sect", "\\S");
h("\\spades", "\\spadesuit");
h("\\sub", "\\subset");
h("\\sube", "\\subseteq");
h("\\supe", "\\supseteq");
h("\\Tau", "\\mathrm{T}");
h("\\thetasym", "\\vartheta");
h("\\weierp", "\\wp");
h("\\Zeta", "\\mathrm{Z}");
h("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
h("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
h("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits");
h("\\bra", "\\mathinner{\\langle{#1}|}");
h("\\ket", "\\mathinner{|{#1}\\rangle}");
h("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
h("\\Bra", "\\left\\langle#1\\right|");
h("\\Ket", "\\left|#1\\right\\rangle");
var el = (r) => (e) => {
  var t = e.consumeArg().tokens, a = e.consumeArg().tokens, n = e.consumeArg().tokens, i = e.consumeArg().tokens, o = e.macros.get("|"), u = e.macros.get("\\|");
  e.macros.beginGroup();
  var d = (w) => (S) => {
    r && (S.macros.set("|", o), n.length && S.macros.set("\\|", u));
    var k = w;
    if (!w && n.length) {
      var A = S.future();
      A.text === "|" && (S.popToken(), k = !0);
    }
    return {
      tokens: k ? n : a,
      numArgs: 0
    };
  };
  e.macros.set("|", d(!1)), n.length && e.macros.set("\\|", d(!0));
  var p = e.consumeArg().tokens, b = e.expandTokens([
    ...i,
    ...p,
    ...t
    // reversed
  ]);
  return e.macros.endGroup(), {
    tokens: b.reverse(),
    numArgs: 0
  };
};
h("\\bra@ket", el(!1));
h("\\bra@set", el(!0));
h("\\Braket", "\\bra@ket{\\left\\langle}{\\,\\middle\\vert\\,}{\\,\\middle\\vert\\,}{\\right\\rangle}");
h("\\Set", "\\bra@set{\\left\\{\\:}{\\;\\middle\\vert\\;}{\\;\\middle\\Vert\\;}{\\:\\right\\}}");
h("\\set", "\\bra@set{\\{\\,}{\\mid}{}{\\,\\}}");
h("\\angln", "{\\angl n}");
h("\\blue", "\\textcolor{##6495ed}{#1}");
h("\\orange", "\\textcolor{##ffa500}{#1}");
h("\\pink", "\\textcolor{##ff00af}{#1}");
h("\\red", "\\textcolor{##df0030}{#1}");
h("\\green", "\\textcolor{##28ae7b}{#1}");
h("\\gray", "\\textcolor{gray}{#1}");
h("\\purple", "\\textcolor{##9d38bd}{#1}");
h("\\blueA", "\\textcolor{##ccfaff}{#1}");
h("\\blueB", "\\textcolor{##80f6ff}{#1}");
h("\\blueC", "\\textcolor{##63d9ea}{#1}");
h("\\blueD", "\\textcolor{##11accd}{#1}");
h("\\blueE", "\\textcolor{##0c7f99}{#1}");
h("\\tealA", "\\textcolor{##94fff5}{#1}");
h("\\tealB", "\\textcolor{##26edd5}{#1}");
h("\\tealC", "\\textcolor{##01d1c1}{#1}");
h("\\tealD", "\\textcolor{##01a995}{#1}");
h("\\tealE", "\\textcolor{##208170}{#1}");
h("\\greenA", "\\textcolor{##b6ffb0}{#1}");
h("\\greenB", "\\textcolor{##8af281}{#1}");
h("\\greenC", "\\textcolor{##74cf70}{#1}");
h("\\greenD", "\\textcolor{##1fab54}{#1}");
h("\\greenE", "\\textcolor{##0d923f}{#1}");
h("\\goldA", "\\textcolor{##ffd0a9}{#1}");
h("\\goldB", "\\textcolor{##ffbb71}{#1}");
h("\\goldC", "\\textcolor{##ff9c39}{#1}");
h("\\goldD", "\\textcolor{##e07d10}{#1}");
h("\\goldE", "\\textcolor{##a75a05}{#1}");
h("\\redA", "\\textcolor{##fca9a9}{#1}");
h("\\redB", "\\textcolor{##ff8482}{#1}");
h("\\redC", "\\textcolor{##f9685d}{#1}");
h("\\redD", "\\textcolor{##e84d39}{#1}");
h("\\redE", "\\textcolor{##bc2612}{#1}");
h("\\maroonA", "\\textcolor{##ffbde0}{#1}");
h("\\maroonB", "\\textcolor{##ff92c6}{#1}");
h("\\maroonC", "\\textcolor{##ed5fa6}{#1}");
h("\\maroonD", "\\textcolor{##ca337c}{#1}");
h("\\maroonE", "\\textcolor{##9e034e}{#1}");
h("\\purpleA", "\\textcolor{##ddd7ff}{#1}");
h("\\purpleB", "\\textcolor{##c6b9fc}{#1}");
h("\\purpleC", "\\textcolor{##aa87ff}{#1}");
h("\\purpleD", "\\textcolor{##7854ab}{#1}");
h("\\purpleE", "\\textcolor{##543b78}{#1}");
h("\\mintA", "\\textcolor{##f5f9e8}{#1}");
h("\\mintB", "\\textcolor{##edf2df}{#1}");
h("\\mintC", "\\textcolor{##e0e5cc}{#1}");
h("\\grayA", "\\textcolor{##f6f7f7}{#1}");
h("\\grayB", "\\textcolor{##f0f1f2}{#1}");
h("\\grayC", "\\textcolor{##e3e5e6}{#1}");
h("\\grayD", "\\textcolor{##d6d8da}{#1}");
h("\\grayE", "\\textcolor{##babec2}{#1}");
h("\\grayF", "\\textcolor{##888d93}{#1}");
h("\\grayG", "\\textcolor{##626569}{#1}");
h("\\grayH", "\\textcolor{##3b3e40}{#1}");
h("\\grayI", "\\textcolor{##21242c}{#1}");
h("\\kaBlue", "\\textcolor{##314453}{#1}");
h("\\kaGreen", "\\textcolor{##71B307}{#1}");
var tl = {
  "^": !0,
  // Parser.js
  _: !0,
  // Parser.js
  "\\limits": !0,
  // Parser.js
  "\\nolimits": !0
  // Parser.js
};
class Io {
  constructor(e, t, a) {
    this.settings = t, this.expansionCount = 0, this.feed(e), this.macros = new zo(Co, t.macros), this.mode = a, this.stack = [];
  }
  /**
   * Feed a new input string to the same MacroExpander
   * (with existing macros etc.).
   */
  feed(e) {
    this.lexer = new _n(e, this.settings);
  }
  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(e) {
    this.mode = e;
  }
  /**
   * Start a new group nesting within all namespaces.
   */
  beginGroup() {
    this.macros.beginGroup();
  }
  /**
   * End current group nesting within all namespaces.
   */
  endGroup() {
    this.macros.endGroup();
  }
  /**
   * Ends all currently nested groups (if any), restoring values before the
   * groups began.  Useful in case of an error in the middle of parsing.
   */
  endGroups() {
    this.macros.endGroups();
  }
  /**
   * Returns the topmost token on the stack, without expanding it.
   * Similar in behavior to TeX's `\futurelet`.
   */
  future() {
    return this.stack.length === 0 && this.pushToken(this.lexer.lex()), this.stack[this.stack.length - 1];
  }
  /**
   * Remove and return the next unexpanded token.
   */
  popToken() {
    return this.future(), this.stack.pop();
  }
  /**
   * Add a given token to the token stack.  In particular, this get be used
   * to put back a token returned from one of the other methods.
   */
  pushToken(e) {
    this.stack.push(e);
  }
  /**
   * Append an array of tokens to the token stack.
   */
  pushTokens(e) {
    this.stack.push(...e);
  }
  /**
   * Find an macro argument without expanding tokens and append the array of
   * tokens to the token stack. Uses Token as a container for the result.
   */
  scanArgument(e) {
    var t, a, n;
    if (e) {
      if (this.consumeSpaces(), this.future().text !== "[")
        return null;
      t = this.popToken(), {
        tokens: n,
        end: a
      } = this.consumeArg(["]"]);
    } else
      ({
        tokens: n,
        start: t,
        end: a
      } = this.consumeArg());
    return this.pushToken(new t0("EOF", a.loc)), this.pushTokens(n), new t0("", Ze.range(t, a));
  }
  /**
   * Consume all following space tokens, without expansion.
   */
  consumeSpaces() {
    for (; ; ) {
      var e = this.future();
      if (e.text === " ")
        this.stack.pop();
      else
        break;
    }
  }
  /**
   * Consume an argument from the token stream, and return the resulting array
   * of tokens and start/end token.
   */
  consumeArg(e) {
    var t = [], a = e && e.length > 0;
    a || this.consumeSpaces();
    var n = this.future(), i, o = 0, u = 0;
    do {
      if (i = this.popToken(), t.push(i), i.text === "{")
        ++o;
      else if (i.text === "}") {
        if (--o, o === -1)
          throw new E("Extra }", i);
      } else if (i.text === "EOF")
        throw new E("Unexpected end of input in a macro argument, expected '" + (e && a ? e[u] : "}") + "'", i);
      if (e && a)
        if ((o === 0 || o === 1 && e[u] === "{") && i.text === e[u]) {
          if (++u, u === e.length) {
            t.splice(-u, u);
            break;
          }
        } else
          u = 0;
    } while (o !== 0 || a);
    return n.text === "{" && t[t.length - 1].text === "}" && (t.pop(), t.shift()), t.reverse(), {
      tokens: t,
      start: n,
      end: i
    };
  }
  /**
   * Consume the specified number of (delimited) arguments from the token
   * stream and return the resulting array of arguments.
   */
  consumeArgs(e, t) {
    if (t) {
      if (t.length !== e + 1)
        throw new E("The length of delimiters doesn't match the number of args!");
      for (var a = t[0], n = 0; n < a.length; n++) {
        var i = this.popToken();
        if (a[n] !== i.text)
          throw new E("Use of the macro doesn't match its definition", i);
      }
    }
    for (var o = [], u = 0; u < e; u++)
      o.push(this.consumeArg(t && t[u + 1]).tokens);
    return o;
  }
  /**
   * Increment `expansionCount` by the specified amount.
   * Throw an error if it exceeds `maxExpand`.
   */
  countExpansion(e) {
    if (this.expansionCount += e, this.expansionCount > this.settings.maxExpand)
      throw new E("Too many expansions: infinite loop or need to increase maxExpand setting");
  }
  /**
   * Expand the next token only once if possible.
   *
   * If the token is expanded, the resulting tokens will be pushed onto
   * the stack in reverse order, and the number of such tokens will be
   * returned.  This number might be zero or positive.
   *
   * If not, the return value is `false`, and the next token remains at the
   * top of the stack.
   *
   * In either case, the next token will be on the top of the stack,
   * or the stack will be empty (in case of empty expansion
   * and no other tokens).
   *
   * Used to implement `expandAfterFuture` and `expandNextToken`.
   *
   * If expandableOnly, only expandable tokens are expanded and
   * an undefined control sequence results in an error.
   */
  expandOnce(e) {
    var t = this.popToken(), a = t.text, n = t.noexpand ? null : this._getExpansion(a);
    if (n == null || e && n.unexpandable) {
      if (e && n == null && a[0] === "\\" && !this.isDefined(a))
        throw new E("Undefined control sequence: " + a);
      return this.pushToken(t), !1;
    }
    this.countExpansion(1);
    var i = n.tokens, o = this.consumeArgs(n.numArgs, n.delimiters);
    if (n.numArgs) {
      i = i.slice();
      for (var u = i.length - 1; u >= 0; --u) {
        var d = i[u];
        if (d.text === "#") {
          if (u === 0)
            throw new E("Incomplete placeholder at end of macro body", d);
          if (d = i[--u], d.text === "#")
            i.splice(u + 1, 1);
          else if (/^[1-9]$/.test(d.text))
            i.splice(u, 2, ...o[+d.text - 1]);
          else
            throw new E("Not a valid argument number", d);
        }
      }
    }
    return this.pushTokens(i), i.length;
  }
  /**
   * Expand the next token only once (if possible), and return the resulting
   * top token on the stack (without removing anything from the stack).
   * Similar in behavior to TeX's `\expandafter\futurelet`.
   * Equivalent to expandOnce() followed by future().
   */
  expandAfterFuture() {
    return this.expandOnce(), this.future();
  }
  /**
   * Recursively expand first token, then return first non-expandable token.
   */
  expandNextToken() {
    for (; ; )
      if (this.expandOnce() === !1) {
        var e = this.stack.pop();
        return e.treatAsRelax && (e.text = "\\relax"), e;
      }
  }
  /**
   * Fully expand the given macro name and return the resulting list of
   * tokens, or return `undefined` if no such macro is defined.
   */
  expandMacro(e) {
    return this.macros.has(e) ? this.expandTokens([new t0(e)]) : void 0;
  }
  /**
   * Fully expand the given token stream and return the resulting list of
   * tokens.  Note that the input tokens are in reverse order, but the
   * output tokens are in forward order.
   */
  expandTokens(e) {
    var t = [], a = this.stack.length;
    for (this.pushTokens(e); this.stack.length > a; )
      if (this.expandOnce(!0) === !1) {
        var n = this.stack.pop();
        n.treatAsRelax && (n.noexpand = !1, n.treatAsRelax = !1), t.push(n);
      }
    return this.countExpansion(t.length), t;
  }
  /**
   * Fully expand the given macro name and return the result as a string,
   * or return `undefined` if no such macro is defined.
   */
  expandMacroAsText(e) {
    var t = this.expandMacro(e);
    return t && t.map((a) => a.text).join("");
  }
  /**
   * Returns the expanded macro as a reversed array of tokens and a macro
   * argument count.  Or returns `null` if no such macro.
   */
  _getExpansion(e) {
    var t = this.macros.get(e);
    if (t == null)
      return t;
    if (e.length === 1) {
      var a = this.lexer.catcodes[e];
      if (a != null && a !== 13)
        return;
    }
    var n = typeof t == "function" ? t(this) : t;
    if (typeof n == "string") {
      var i = 0;
      if (n.includes("#"))
        for (var o = n.replace(/##/g, ""); o.includes("#" + (i + 1)); )
          ++i;
      for (var u = new _n(n, this.settings), d = [], p = u.lex(); p.text !== "EOF"; )
        d.push(p), p = u.lex();
      d.reverse();
      var b = {
        tokens: d,
        numArgs: i
      };
      return b;
    }
    return n;
  }
  /**
   * Determine whether a command is currently "defined" (has some
   * functionality), meaning that it's a macro (in the current group),
   * a function, a symbol, or one of the special commands listed in
   * `implicitCommands`.
   */
  isDefined(e) {
    return this.macros.has(e) || X0.hasOwnProperty(e) || be.math.hasOwnProperty(e) || be.text.hasOwnProperty(e) || tl.hasOwnProperty(e);
  }
  /**
   * Determine whether a command is expandable.
   */
  isExpandable(e) {
    var t = this.macros.get(e);
    return t != null ? typeof t == "string" || typeof t == "function" || !t.unexpandable : X0.hasOwnProperty(e) && !X0[e].primitive;
  }
}
var Vn = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/, pr = Object.freeze({
  "₊": "+",
  "₋": "-",
  "₌": "=",
  "₍": "(",
  "₎": ")",
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "ₐ": "a",
  "ₑ": "e",
  "ₕ": "h",
  "ᵢ": "i",
  "ⱼ": "j",
  "ₖ": "k",
  "ₗ": "l",
  "ₘ": "m",
  "ₙ": "n",
  "ₒ": "o",
  "ₚ": "p",
  "ᵣ": "r",
  "ₛ": "s",
  "ₜ": "t",
  "ᵤ": "u",
  "ᵥ": "v",
  "ₓ": "x",
  "ᵦ": "β",
  "ᵧ": "γ",
  "ᵨ": "ρ",
  "ᵩ": "ϕ",
  "ᵪ": "χ",
  "⁺": "+",
  "⁻": "-",
  "⁼": "=",
  "⁽": "(",
  "⁾": ")",
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "ᴬ": "A",
  "ᴮ": "B",
  "ᴰ": "D",
  "ᴱ": "E",
  "ᴳ": "G",
  "ᴴ": "H",
  "ᴵ": "I",
  "ᴶ": "J",
  "ᴷ": "K",
  "ᴸ": "L",
  "ᴹ": "M",
  "ᴺ": "N",
  "ᴼ": "O",
  "ᴾ": "P",
  "ᴿ": "R",
  "ᵀ": "T",
  "ᵁ": "U",
  "ⱽ": "V",
  "ᵂ": "W",
  "ᵃ": "a",
  "ᵇ": "b",
  "ᶜ": "c",
  "ᵈ": "d",
  "ᵉ": "e",
  "ᶠ": "f",
  "ᵍ": "g",
  ʰ: "h",
  "ⁱ": "i",
  ʲ: "j",
  "ᵏ": "k",
  ˡ: "l",
  "ᵐ": "m",
  ⁿ: "n",
  "ᵒ": "o",
  "ᵖ": "p",
  ʳ: "r",
  ˢ: "s",
  "ᵗ": "t",
  "ᵘ": "u",
  "ᵛ": "v",
  ʷ: "w",
  ˣ: "x",
  ʸ: "y",
  "ᶻ": "z",
  "ᵝ": "β",
  "ᵞ": "γ",
  "ᵟ": "δ",
  "ᵠ": "ϕ",
  "ᵡ": "χ",
  "ᶿ": "θ"
}), ca = {
  "́": {
    text: "\\'",
    math: "\\acute"
  },
  "̀": {
    text: "\\`",
    math: "\\grave"
  },
  "̈": {
    text: '\\"',
    math: "\\ddot"
  },
  "̃": {
    text: "\\~",
    math: "\\tilde"
  },
  "̄": {
    text: "\\=",
    math: "\\bar"
  },
  "̆": {
    text: "\\u",
    math: "\\breve"
  },
  "̌": {
    text: "\\v",
    math: "\\check"
  },
  "̂": {
    text: "\\^",
    math: "\\hat"
  },
  "̇": {
    text: "\\.",
    math: "\\dot"
  },
  "̊": {
    text: "\\r",
    math: "\\mathring"
  },
  "̋": {
    text: "\\H"
  },
  "̧": {
    text: "\\c"
  }
}, Yn = {
  á: "á",
  à: "à",
  ä: "ä",
  ǟ: "ǟ",
  ã: "ã",
  ā: "ā",
  ă: "ă",
  ắ: "ắ",
  ằ: "ằ",
  ẵ: "ẵ",
  ǎ: "ǎ",
  â: "â",
  ấ: "ấ",
  ầ: "ầ",
  ẫ: "ẫ",
  ȧ: "ȧ",
  ǡ: "ǡ",
  å: "å",
  ǻ: "ǻ",
  ḃ: "ḃ",
  ć: "ć",
  ḉ: "ḉ",
  č: "č",
  ĉ: "ĉ",
  ċ: "ċ",
  ç: "ç",
  ď: "ď",
  ḋ: "ḋ",
  ḑ: "ḑ",
  é: "é",
  è: "è",
  ë: "ë",
  ẽ: "ẽ",
  ē: "ē",
  ḗ: "ḗ",
  ḕ: "ḕ",
  ĕ: "ĕ",
  ḝ: "ḝ",
  ě: "ě",
  ê: "ê",
  ế: "ế",
  ề: "ề",
  ễ: "ễ",
  ė: "ė",
  ȩ: "ȩ",
  ḟ: "ḟ",
  ǵ: "ǵ",
  ḡ: "ḡ",
  ğ: "ğ",
  ǧ: "ǧ",
  ĝ: "ĝ",
  ġ: "ġ",
  ģ: "ģ",
  ḧ: "ḧ",
  ȟ: "ȟ",
  ĥ: "ĥ",
  ḣ: "ḣ",
  ḩ: "ḩ",
  í: "í",
  ì: "ì",
  ï: "ï",
  ḯ: "ḯ",
  ĩ: "ĩ",
  ī: "ī",
  ĭ: "ĭ",
  ǐ: "ǐ",
  î: "î",
  ǰ: "ǰ",
  ĵ: "ĵ",
  ḱ: "ḱ",
  ǩ: "ǩ",
  ķ: "ķ",
  ĺ: "ĺ",
  ľ: "ľ",
  ļ: "ļ",
  ḿ: "ḿ",
  ṁ: "ṁ",
  ń: "ń",
  ǹ: "ǹ",
  ñ: "ñ",
  ň: "ň",
  ṅ: "ṅ",
  ņ: "ņ",
  ó: "ó",
  ò: "ò",
  ö: "ö",
  ȫ: "ȫ",
  õ: "õ",
  ṍ: "ṍ",
  ṏ: "ṏ",
  ȭ: "ȭ",
  ō: "ō",
  ṓ: "ṓ",
  ṑ: "ṑ",
  ŏ: "ŏ",
  ǒ: "ǒ",
  ô: "ô",
  ố: "ố",
  ồ: "ồ",
  ỗ: "ỗ",
  ȯ: "ȯ",
  ȱ: "ȱ",
  ő: "ő",
  ṕ: "ṕ",
  ṗ: "ṗ",
  ŕ: "ŕ",
  ř: "ř",
  ṙ: "ṙ",
  ŗ: "ŗ",
  ś: "ś",
  ṥ: "ṥ",
  š: "š",
  ṧ: "ṧ",
  ŝ: "ŝ",
  ṡ: "ṡ",
  ş: "ş",
  ẗ: "ẗ",
  ť: "ť",
  ṫ: "ṫ",
  ţ: "ţ",
  ú: "ú",
  ù: "ù",
  ü: "ü",
  ǘ: "ǘ",
  ǜ: "ǜ",
  ǖ: "ǖ",
  ǚ: "ǚ",
  ũ: "ũ",
  ṹ: "ṹ",
  ū: "ū",
  ṻ: "ṻ",
  ŭ: "ŭ",
  ǔ: "ǔ",
  û: "û",
  ů: "ů",
  ű: "ű",
  ṽ: "ṽ",
  ẃ: "ẃ",
  ẁ: "ẁ",
  ẅ: "ẅ",
  ŵ: "ŵ",
  ẇ: "ẇ",
  ẘ: "ẘ",
  ẍ: "ẍ",
  ẋ: "ẋ",
  ý: "ý",
  ỳ: "ỳ",
  ÿ: "ÿ",
  ỹ: "ỹ",
  ȳ: "ȳ",
  ŷ: "ŷ",
  ẏ: "ẏ",
  ẙ: "ẙ",
  ź: "ź",
  ž: "ž",
  ẑ: "ẑ",
  ż: "ż",
  Á: "Á",
  À: "À",
  Ä: "Ä",
  Ǟ: "Ǟ",
  Ã: "Ã",
  Ā: "Ā",
  Ă: "Ă",
  Ắ: "Ắ",
  Ằ: "Ằ",
  Ẵ: "Ẵ",
  Ǎ: "Ǎ",
  Â: "Â",
  Ấ: "Ấ",
  Ầ: "Ầ",
  Ẫ: "Ẫ",
  Ȧ: "Ȧ",
  Ǡ: "Ǡ",
  Å: "Å",
  Ǻ: "Ǻ",
  Ḃ: "Ḃ",
  Ć: "Ć",
  Ḉ: "Ḉ",
  Č: "Č",
  Ĉ: "Ĉ",
  Ċ: "Ċ",
  Ç: "Ç",
  Ď: "Ď",
  Ḋ: "Ḋ",
  Ḑ: "Ḑ",
  É: "É",
  È: "È",
  Ë: "Ë",
  Ẽ: "Ẽ",
  Ē: "Ē",
  Ḗ: "Ḗ",
  Ḕ: "Ḕ",
  Ĕ: "Ĕ",
  Ḝ: "Ḝ",
  Ě: "Ě",
  Ê: "Ê",
  Ế: "Ế",
  Ề: "Ề",
  Ễ: "Ễ",
  Ė: "Ė",
  Ȩ: "Ȩ",
  Ḟ: "Ḟ",
  Ǵ: "Ǵ",
  Ḡ: "Ḡ",
  Ğ: "Ğ",
  Ǧ: "Ǧ",
  Ĝ: "Ĝ",
  Ġ: "Ġ",
  Ģ: "Ģ",
  Ḧ: "Ḧ",
  Ȟ: "Ȟ",
  Ĥ: "Ĥ",
  Ḣ: "Ḣ",
  Ḩ: "Ḩ",
  Í: "Í",
  Ì: "Ì",
  Ï: "Ï",
  Ḯ: "Ḯ",
  Ĩ: "Ĩ",
  Ī: "Ī",
  Ĭ: "Ĭ",
  Ǐ: "Ǐ",
  Î: "Î",
  İ: "İ",
  Ĵ: "Ĵ",
  Ḱ: "Ḱ",
  Ǩ: "Ǩ",
  Ķ: "Ķ",
  Ĺ: "Ĺ",
  Ľ: "Ľ",
  Ļ: "Ļ",
  Ḿ: "Ḿ",
  Ṁ: "Ṁ",
  Ń: "Ń",
  Ǹ: "Ǹ",
  Ñ: "Ñ",
  Ň: "Ň",
  Ṅ: "Ṅ",
  Ņ: "Ņ",
  Ó: "Ó",
  Ò: "Ò",
  Ö: "Ö",
  Ȫ: "Ȫ",
  Õ: "Õ",
  Ṍ: "Ṍ",
  Ṏ: "Ṏ",
  Ȭ: "Ȭ",
  Ō: "Ō",
  Ṓ: "Ṓ",
  Ṑ: "Ṑ",
  Ŏ: "Ŏ",
  Ǒ: "Ǒ",
  Ô: "Ô",
  Ố: "Ố",
  Ồ: "Ồ",
  Ỗ: "Ỗ",
  Ȯ: "Ȯ",
  Ȱ: "Ȱ",
  Ő: "Ő",
  Ṕ: "Ṕ",
  Ṗ: "Ṗ",
  Ŕ: "Ŕ",
  Ř: "Ř",
  Ṙ: "Ṙ",
  Ŗ: "Ŗ",
  Ś: "Ś",
  Ṥ: "Ṥ",
  Š: "Š",
  Ṧ: "Ṧ",
  Ŝ: "Ŝ",
  Ṡ: "Ṡ",
  Ş: "Ş",
  Ť: "Ť",
  Ṫ: "Ṫ",
  Ţ: "Ţ",
  Ú: "Ú",
  Ù: "Ù",
  Ü: "Ü",
  Ǘ: "Ǘ",
  Ǜ: "Ǜ",
  Ǖ: "Ǖ",
  Ǚ: "Ǚ",
  Ũ: "Ũ",
  Ṹ: "Ṹ",
  Ū: "Ū",
  Ṻ: "Ṻ",
  Ŭ: "Ŭ",
  Ǔ: "Ǔ",
  Û: "Û",
  Ů: "Ů",
  Ű: "Ű",
  Ṽ: "Ṽ",
  Ẃ: "Ẃ",
  Ẁ: "Ẁ",
  Ẅ: "Ẅ",
  Ŵ: "Ŵ",
  Ẇ: "Ẇ",
  Ẍ: "Ẍ",
  Ẋ: "Ẋ",
  Ý: "Ý",
  Ỳ: "Ỳ",
  Ÿ: "Ÿ",
  Ỹ: "Ỹ",
  Ȳ: "Ȳ",
  Ŷ: "Ŷ",
  Ẏ: "Ẏ",
  Ź: "Ź",
  Ž: "Ž",
  Ẑ: "Ẑ",
  Ż: "Ż",
  ά: "ά",
  ὰ: "ὰ",
  ᾱ: "ᾱ",
  ᾰ: "ᾰ",
  έ: "έ",
  ὲ: "ὲ",
  ή: "ή",
  ὴ: "ὴ",
  ί: "ί",
  ὶ: "ὶ",
  ϊ: "ϊ",
  ΐ: "ΐ",
  ῒ: "ῒ",
  ῑ: "ῑ",
  ῐ: "ῐ",
  ό: "ό",
  ὸ: "ὸ",
  ύ: "ύ",
  ὺ: "ὺ",
  ϋ: "ϋ",
  ΰ: "ΰ",
  ῢ: "ῢ",
  ῡ: "ῡ",
  ῠ: "ῠ",
  ώ: "ώ",
  ὼ: "ὼ",
  Ύ: "Ύ",
  Ὺ: "Ὺ",
  Ϋ: "Ϋ",
  Ῡ: "Ῡ",
  Ῠ: "Ῠ",
  Ώ: "Ώ",
  Ὼ: "Ὼ"
};
class Nr {
  constructor(e, t) {
    this.mode = "math", this.gullet = new Io(e, t, this.mode), this.settings = t, this.leftrightDepth = 0, this.nextToken = null;
  }
  /**
   * Checks a result to make sure it has the right type, and throws an
   * appropriate error otherwise.
   */
  expect(e, t) {
    if (t === void 0 && (t = !0), this.fetch().text !== e)
      throw new E("Expected '" + e + "', got '" + this.fetch().text + "'", this.fetch());
    t && this.consume();
  }
  /**
   * Discards the current lookahead token, considering it consumed.
   */
  consume() {
    this.nextToken = null;
  }
  /**
   * Return the current lookahead token, or if there isn't one (at the
   * beginning, or if the previous lookahead token was consume()d),
   * fetch the next token as the new lookahead token and return it.
   */
  fetch() {
    return this.nextToken == null && (this.nextToken = this.gullet.expandNextToken()), this.nextToken;
  }
  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(e) {
    this.mode = e, this.gullet.switchMode(e);
  }
  /**
   * Main parsing function, which parses an entire input.
   */
  parse() {
    this.settings.globalGroup || this.gullet.beginGroup(), this.settings.colorIsTextColor && this.gullet.macros.set("\\color", "\\textcolor");
    try {
      var e = this.parseExpression(!1);
      return this.expect("EOF"), this.settings.globalGroup || this.gullet.endGroup(), e;
    } finally {
      this.gullet.endGroups();
    }
  }
  /**
   * Fully parse a separate sequence of tokens as a separate job.
   * Tokens should be specified in reverse order, as in a MacroDefinition.
   */
  subparse(e) {
    var t = this.nextToken;
    this.consume(), this.gullet.pushToken(new t0("}")), this.gullet.pushTokens(e);
    var a = this.parseExpression(!1);
    return this.expect("}"), this.nextToken = t, a;
  }
  /**
   * Parses an "expression", which is a list of atoms.
   *
   * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
   *                 happens when functions have higher precedence than infix
   *                 nodes in implicit parses.
   *
   * `breakOnTokenText`: The text of the token that the expression should end
   *                     with, or `null` if something else should end the
   *                     expression.
   */
  parseExpression(e, t) {
    for (var a = []; ; ) {
      this.mode === "math" && this.consumeSpaces();
      var n = this.fetch();
      if (Nr.endOfExpression.has(n.text) || t && n.text === t || e && X0[n.text] && X0[n.text].infix)
        break;
      var i = this.parseAtom(t);
      if (i) {
        if (i.type === "internal")
          continue;
      } else break;
      a.push(i);
    }
    return this.mode === "text" && this.formLigatures(a), this.handleInfixNodes(a);
  }
  /**
   * Rewrites infix operators such as \over with corresponding commands such
   * as \frac.
   *
   * There can only be one infix operator per group.  If there's more than one
   * then the expression is ambiguous.  This can be resolved by adding {}.
   */
  handleInfixNodes(e) {
    for (var t = -1, a, n = 0; n < e.length; n++) {
      var i = e[n];
      if (i.type === "infix") {
        if (t !== -1)
          throw new E("only one infix operator per group", i.token);
        t = n, a = i.replaceWith;
      }
    }
    if (t !== -1 && a) {
      var o, u, d = e.slice(0, t), p = e.slice(t + 1);
      d.length === 1 && d[0].type === "ordgroup" ? o = d[0] : o = {
        type: "ordgroup",
        mode: this.mode,
        body: d
      }, p.length === 1 && p[0].type === "ordgroup" ? u = p[0] : u = {
        type: "ordgroup",
        mode: this.mode,
        body: p
      };
      var b;
      return a === "\\\\abovefrac" ? b = this.callFunction(a, [o, e[t], u], []) : b = this.callFunction(a, [o, u], []), [b];
    } else
      return e;
  }
  /**
   * Handle a subscript or superscript with nice errors.
   */
  handleSupSubscript(e) {
    var t = this.fetch(), a = t.text;
    this.consume(), this.consumeSpaces();
    var n;
    do {
      var i;
      n = this.parseGroup(e);
    } while (((i = n) == null ? void 0 : i.type) === "internal");
    if (!n)
      throw new E("Expected group after '" + a + "'", t);
    return n;
  }
  /**
   * Converts the textual input of an unsupported command into a text node
   * contained within a color node whose color is determined by errorColor
   */
  formatUnsupportedCmd(e) {
    for (var t = [], a = 0; a < e.length; a++)
      t.push({
        type: "textord",
        mode: "text",
        text: e[a]
      });
    var n = {
      type: "text",
      mode: this.mode,
      body: t
    }, i = {
      type: "color",
      mode: this.mode,
      color: this.settings.errorColor,
      body: [n]
    };
    return i;
  }
  /**
   * Parses a group with optional super/subscripts.
   */
  parseAtom(e) {
    var t = this.parseGroup("atom", e);
    if ((t == null ? void 0 : t.type) === "internal" || this.mode === "text")
      return t;
    for (var a, n; ; ) {
      this.consumeSpaces();
      var i = this.fetch();
      if (i.text === "\\limits" || i.text === "\\nolimits") {
        if (t && t.type === "op") {
          var o = i.text === "\\limits";
          t.limits = o, t.alwaysHandleSupSub = !0;
        } else if (t && t.type === "operatorname")
          t.alwaysHandleSupSub && (t.limits = i.text === "\\limits");
        else
          throw new E("Limit controls must follow a math operator", i);
        this.consume();
      } else if (i.text === "^") {
        if (a)
          throw new E("Double superscript", i);
        a = this.handleSupSubscript("superscript");
      } else if (i.text === "_") {
        if (n)
          throw new E("Double subscript", i);
        n = this.handleSupSubscript("subscript");
      } else if (i.text === "'") {
        if (a)
          throw new E("Double superscript", i);
        var u = {
          type: "textord",
          mode: this.mode,
          text: "\\prime"
        }, d = [u];
        for (this.consume(); this.fetch().text === "'"; )
          d.push(u), this.consume();
        this.fetch().text === "^" && d.push(this.handleSupSubscript("superscript")), a = {
          type: "ordgroup",
          mode: this.mode,
          body: d
        };
      } else if (pr[i.text]) {
        var p = Vn.test(i.text), b = [];
        for (b.push(new t0(pr[i.text])), this.consume(); ; ) {
          var w = this.fetch().text;
          if (!pr[w] || Vn.test(w) !== p)
            break;
          b.unshift(new t0(pr[w])), this.consume();
        }
        var S = this.subparse(b);
        p ? n = {
          type: "ordgroup",
          mode: "math",
          body: S
        } : a = {
          type: "ordgroup",
          mode: "math",
          body: S
        };
      } else
        break;
    }
    return a || n ? {
      type: "supsub",
      mode: this.mode,
      base: t,
      sup: a,
      sub: n
    } : t;
  }
  /**
   * Parses an entire function, including its base and all of its arguments.
   */
  parseFunction(e, t) {
    var a = this.fetch(), n = a.text, i = X0[n];
    if (!i)
      return null;
    if (this.consume(), t && t !== "atom" && !i.allowedInArgument)
      throw new E("Got function '" + n + "' with no arguments" + (t ? " as " + t : ""), a);
    if (this.mode === "text" && !i.allowedInText)
      throw new E("Can't use function '" + n + "' in text mode", a);
    if (this.mode === "math" && i.allowedInMath === !1)
      throw new E("Can't use function '" + n + "' in math mode", a);
    var {
      args: o,
      optArgs: u
    } = this.parseArguments(n, i);
    return this.callFunction(n, o, u, a, e);
  }
  /**
   * Call a function handler with a suitable context and arguments.
   */
  callFunction(e, t, a, n, i) {
    var o = {
      funcName: e,
      parser: this,
      token: n,
      breakOnTokenText: i
    }, u = X0[e];
    if (u && u.handler)
      return u.handler(o, t, a);
    throw new E("No function handler for " + e);
  }
  /**
   * Parses the arguments of a function or environment
   */
  parseArguments(e, t) {
    var a = t.numArgs + t.numOptionalArgs;
    if (a === 0)
      return {
        args: [],
        optArgs: []
      };
    for (var n = [], i = [], o = 0; o < a; o++) {
      var u = t.argTypes && t.argTypes[o], d = o < t.numOptionalArgs;
      ("primitive" in t && t.primitive && u == null || // \sqrt expands into primitive if optional argument doesn't exist
      t.type === "sqrt" && o === 1 && i[0] == null) && (u = "primitive");
      var p = this.parseGroupOfType("argument to '" + e + "'", u, d);
      if (d)
        i.push(p);
      else if (p != null)
        n.push(p);
      else
        throw new E("Null argument, please report this as a bug");
    }
    return {
      args: n,
      optArgs: i
    };
  }
  /**
   * Parses a group when the mode is changing.
   */
  parseGroupOfType(e, t, a) {
    switch (t) {
      case "color":
        return this.parseColorGroup(a);
      case "size":
        return this.parseSizeGroup(a);
      case "url":
        return this.parseUrlGroup(a);
      case "math":
      case "text":
        return this.parseArgumentGroup(a, t);
      case "hbox": {
        var n = this.parseArgumentGroup(a, "text");
        return n != null ? {
          type: "styling",
          mode: n.mode,
          body: [n],
          style: "text"
          // simulate \textstyle
        } : null;
      }
      case "raw": {
        var i = this.parseStringGroup("raw", a);
        return i != null ? {
          type: "raw",
          mode: "text",
          string: i.text
        } : null;
      }
      case "primitive": {
        if (a)
          throw new E("A primitive argument cannot be optional");
        var o = this.parseGroup(e);
        if (o == null)
          throw new E("Expected group as " + e, this.fetch());
        return o;
      }
      case "original":
      case null:
      case void 0:
        return this.parseArgumentGroup(a);
      default:
        throw new E("Unknown group type as " + e, this.fetch());
    }
  }
  /**
   * Discard any space tokens, fetching the next non-space token.
   */
  consumeSpaces() {
    for (; this.fetch().text === " "; )
      this.consume();
  }
  /**
   * Parses a group, essentially returning the string formed by the
   * brace-enclosed tokens plus some position information.
   */
  parseStringGroup(e, t) {
    var a = this.gullet.scanArgument(t);
    if (a == null)
      return null;
    for (var n = "", i; (i = this.fetch()).text !== "EOF"; )
      n += i.text, this.consume();
    return this.consume(), a.text = n, a;
  }
  /**
   * Parses a regex-delimited group: the largest sequence of tokens
   * whose concatenated strings match `regex`. Returns the string
   * formed by the tokens plus some position information.
   */
  parseRegexGroup(e, t) {
    for (var a = this.fetch(), n = a, i = "", o; (o = this.fetch()).text !== "EOF" && e.test(i + o.text); )
      n = o, i += n.text, this.consume();
    if (i === "")
      throw new E("Invalid " + t + ": '" + a.text + "'", a);
    return a.range(n, i);
  }
  /**
   * Parses a color description.
   */
  parseColorGroup(e) {
    var t = this.parseStringGroup("color", e);
    if (t == null)
      return null;
    var a = /^(#[a-f0-9]{3,4}|#[a-f0-9]{6}|#[a-f0-9]{8}|[a-f0-9]{6}|[a-z]+)$/i.exec(t.text);
    if (!a)
      throw new E("Invalid color: '" + t.text + "'", t);
    var n = a[0];
    return /^[0-9a-f]{6}$/i.test(n) && (n = "#" + n), {
      type: "color-token",
      mode: this.mode,
      color: n
    };
  }
  /**
   * Parses a size specification, consisting of magnitude and unit.
   */
  parseSizeGroup(e) {
    var t, a = !1;
    if (this.gullet.consumeSpaces(), !e && this.gullet.future().text !== "{" ? t = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size") : t = this.parseStringGroup("size", e), !t)
      return null;
    !e && t.text.length === 0 && (t.text = "0pt", a = !0);
    var n = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(t.text);
    if (!n)
      throw new E("Invalid size: '" + t.text + "'", t);
    var i = {
      number: +(n[1] + n[2]),
      // sign + magnitude, cast to number
      unit: n[3]
    };
    if (!ui(i))
      throw new E("Invalid unit: '" + i.unit + "'", t);
    return {
      type: "size",
      mode: this.mode,
      value: i,
      isBlank: a
    };
  }
  /**
   * Parses an URL, checking escaped letters and allowed protocols,
   * and setting the catcode of % as an active character (as in \hyperref).
   */
  parseUrlGroup(e) {
    this.gullet.lexer.setCatcode("%", 13), this.gullet.lexer.setCatcode("~", 12);
    var t = this.parseStringGroup("url", e);
    if (this.gullet.lexer.setCatcode("%", 14), this.gullet.lexer.setCatcode("~", 13), t == null)
      return null;
    var a = t.text.replace(/\\([#$%&~_^{}])/g, "$1");
    return {
      type: "url",
      mode: this.mode,
      url: a
    };
  }
  /**
   * Parses an argument with the mode specified.
   */
  parseArgumentGroup(e, t) {
    var a = this.gullet.scanArgument(e);
    if (a == null)
      return null;
    var n = this.mode;
    t && this.switchMode(t), this.gullet.beginGroup();
    var i = this.parseExpression(!1, "EOF");
    this.expect("EOF"), this.gullet.endGroup();
    var o = {
      type: "ordgroup",
      mode: this.mode,
      loc: a.loc,
      body: i
    };
    return t && this.switchMode(n), o;
  }
  /**
   * Parses an ordinary group, which is either a single nucleus (like "x")
   * or an expression in braces (like "{x+y}") or an implicit group, a group
   * that starts at the current position, and ends right before a higher explicit
   * group ends, or at EOF.
   */
  parseGroup(e, t) {
    var a = this.fetch(), n = a.text, i;
    if (n === "{" || n === "\\begingroup") {
      this.consume();
      var o = n === "{" ? "}" : "\\endgroup";
      this.gullet.beginGroup();
      var u = this.parseExpression(!1, o), d = this.fetch();
      this.expect(o), this.gullet.endGroup(), i = {
        type: "ordgroup",
        mode: this.mode,
        loc: Ze.range(a, d),
        body: u,
        // A group formed by \begingroup...\endgroup is a semi-simple group
        // which doesn't affect spacing in math mode, i.e., is transparent.
        // https://tex.stackexchange.com/questions/1930/when-should-one-
        // use-begingroup-instead-of-bgroup
        semisimple: n === "\\begingroup" || void 0
      };
    } else if (i = this.parseFunction(t, e) || this.parseSymbol(), i == null && n[0] === "\\" && !tl.hasOwnProperty(n)) {
      if (this.settings.throwOnError)
        throw new E("Undefined control sequence: " + n, a);
      i = this.formatUnsupportedCmd(n), this.consume();
    }
    return i;
  }
  /**
   * Form ligature-like combinations of characters for text mode.
   * This includes inputs like "--", "---", "``" and "''".
   * The result will simply replace multiple textord nodes with a single
   * character in each value by a single textord node having multiple
   * characters in its value.  The representation is still ASCII source.
   * The group will be modified in place.
   */
  formLigatures(e) {
    for (var t = e.length - 1, a = 0; a < t; ++a) {
      var n = e[a];
      if (n.type === "textord") {
        var i = n.text, o = e[a + 1];
        if (!(!o || o.type !== "textord")) {
          if (i === "-" && o.text === "-") {
            var u = e[a + 2];
            a + 1 < t && u && u.type === "textord" && u.text === "-" ? (e.splice(a, 3, {
              type: "textord",
              mode: "text",
              loc: Ze.range(n, u),
              text: "---"
            }), t -= 2) : (e.splice(a, 2, {
              type: "textord",
              mode: "text",
              loc: Ze.range(n, o),
              text: "--"
            }), t -= 1);
          }
          (i === "'" || i === "`") && o.text === i && (e.splice(a, 2, {
            type: "textord",
            mode: "text",
            loc: Ze.range(n, o),
            text: i + i
          }), t -= 1);
        }
      }
    }
  }
  /**
   * Parse a single symbol out of the string. Here, we handle single character
   * symbols and special functions like \verb.
   */
  parseSymbol() {
    var e = this.fetch(), t = e.text;
    if (/^\\verb[^a-zA-Z]/.test(t)) {
      this.consume();
      var a = t.slice(5), n = a.charAt(0) === "*";
      if (n && (a = a.slice(1)), a.length < 2 || a.charAt(0) !== a.slice(-1))
        throw new E(`\\verb assertion failed --
                    please report what input caused this bug`);
      return a = a.slice(1, -1), {
        type: "verb",
        mode: "text",
        body: a,
        star: n
      };
    }
    Yn.hasOwnProperty(t[0]) && !be[this.mode][t[0]] && (this.settings.strict && this.mode === "math" && this.settings.reportNonstrict("unicodeTextInMathMode", 'Accented Unicode text character "' + t[0] + '" used in math mode', e), t = Yn[t[0]] + t.slice(1));
    var i = To.exec(t);
    i && (t = t.substring(0, i.index), t === "i" ? t = "ı" : t === "j" && (t = "ȷ"));
    var o;
    if (be[this.mode][t]) {
      this.settings.strict && this.mode === "math" && Sa.includes(t) && this.settings.reportNonstrict("unicodeTextInMathMode", 'Latin-1/Unicode text character "' + t[0] + '" used in math mode', e);
      var u = be[this.mode][t].group, d = Ze.range(e), p;
      if (Ts.hasOwnProperty(u)) {
        var b = u;
        p = {
          type: "atom",
          mode: this.mode,
          family: b,
          loc: d,
          text: t
        };
      } else
        p = {
          type: u,
          mode: this.mode,
          loc: d,
          text: t
        };
      o = p;
    } else if (t.charCodeAt(0) >= 128)
      this.settings.strict && (oi(t.charCodeAt(0)) ? this.mode === "math" && this.settings.reportNonstrict("unicodeTextInMathMode", 'Unicode text character "' + t[0] + '" used in math mode', e) : this.settings.reportNonstrict("unknownSymbol", 'Unrecognized Unicode character "' + t[0] + '"' + (" (" + t.charCodeAt(0) + ")"), e)), o = {
        type: "textord",
        mode: "text",
        loc: Ze.range(e),
        text: t
      };
    else
      return null;
    if (this.consume(), i)
      for (var w = 0; w < i[0].length; w++) {
        var S = i[0][w];
        if (!ca[S])
          throw new E("Unknown accent ' " + S + "'", e);
        var k = ca[S][this.mode] || ca[S].text;
        if (!k)
          throw new E("Accent " + S + " unsupported in " + this.mode + " mode", e);
        o = {
          type: "accent",
          mode: this.mode,
          loc: Ze.range(e),
          label: k,
          isStretchy: !1,
          isShifty: !0,
          // TODO(ts)
          base: o
        };
      }
    return o;
  }
}
Nr.endOfExpression = /* @__PURE__ */ new Set(["}", "\\endgroup", "\\end", "\\right", "&"]);
var Ya = function(e, t) {
  if (!(typeof e == "string" || e instanceof String))
    throw new TypeError("KaTeX can only parse string typed expression");
  var a = new Nr(e, t);
  delete a.gullet.macros.current["\\df@tag"];
  var n = a.parse();
  if (delete a.gullet.macros.current["\\current@color"], delete a.gullet.macros.current["\\color"], a.gullet.macros.get("\\df@tag")) {
    if (!t.displayMode)
      throw new E("\\tag works only in display equations");
    n = [{
      type: "tag",
      mode: "text",
      body: n,
      tag: a.subparse([new t0("\\df@tag")])
    }];
  }
  return n;
}, rl = function(e, t, a) {
  t.textContent = "";
  var n = Xa(e, a).toNode();
  t.appendChild(n);
};
typeof document < "u" && document.compatMode !== "CSS1Compat" && (typeof console < "u" && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype."), rl = function() {
  throw new E("KaTeX doesn't work in quirks mode.");
});
var Eo = function(e, t) {
  var a = Xa(e, t).toMarkup();
  return a;
}, Ro = function(e, t) {
  var a = new Oa(t);
  return Ya(e, a);
}, al = function(e, t, a) {
  if (a.throwOnError || !(e instanceof E))
    throw e;
  var n = I(["katex-error"], [new r0(t)]);
  return n.setAttribute("title", e.toString()), n.setAttribute("style", "color:" + a.errorColor), n;
}, Xa = function(e, t) {
  var a = new Oa(t);
  try {
    var n = Ya(e, a);
    return $s(n, e, a);
  } catch (i) {
    return al(i, e, a);
  }
}, Do = function(e, t) {
  var a = new Oa(t);
  try {
    var n = Ya(e, a);
    return Ws(n, e, a);
  } catch (i) {
    return al(i, e, a);
  }
}, qo = "0.16.45", Oo = {
  Span: kt,
  Anchor: Ar,
  SymbolNode: r0,
  SvgNode: O0,
  PathNode: Z0,
  LineNode: wa
}, Lo = {
  /**
   * Current KaTeX version
   */
  version: qo,
  /**
   * Renders the given LaTeX into an HTML+MathML combination, and adds
   * it as a child to the specified DOM node.
   */
  render: rl,
  /**
   * Renders the given LaTeX into an HTML+MathML combination string,
   * for sending to the client.
   */
  renderToString: Eo,
  /**
   * KaTeX error, usually during parsing.
   */
  ParseError: E,
  /**
   * The schema of Settings
   */
  SETTINGS_SCHEMA: ba,
  /**
   * Parses the given LaTeX into KaTeX's internal parse tree structure,
   * without rendering to HTML or MathML.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __parse: Ro,
  /**
   * Renders the given LaTeX into an HTML+MathML internal DOM tree
   * representation, without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToDomTree: Xa,
  /**
   * Renders the given LaTeX into an HTML internal DOM tree representation,
   * without MathML and without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToHTMLTree: Do,
  /**
   * extends internal font metrics object with a new object
   * each key in the new object represents a font name
  */
  __setFontMetrics: ks,
  /**
   * adds a new symbol to builtin symbols table
   */
  __defineSymbol: l,
  /**
   * adds a new function to builtin function list,
   * which directly produce parse tree elements
   * and have their own html/mathml builders
   */
  __defineFunction: H,
  /**
   * adds a new macro to builtin macro list
   */
  __defineMacro: h,
  /**
   * Expose the dom tree node types, which can be useful for type checking nodes.
   *
   * NOTE: These methods are not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __domTree: Oo
};
const nl = {
  primary: "#3ecfb4",
  primaryHover: "#62dcc4",
  primarySubtle: "rgba(62, 207, 180, 0.08)",
  primaryGlow: "rgba(62, 207, 180, 0.14)",
  success: "#34d399",
  successSubtle: "rgba(52, 211, 153, 0.12)",
  warning: "#fbbf24",
  warningSubtle: "rgba(251, 191, 36, 0.12)",
  danger: "#fb7185",
  dangerSubtle: "rgba(251, 113, 133, 0.12)",
  info: "#7dd3fc",
  infoSubtle: "rgba(125, 211, 252, 0.12)",
  // 背景：深蓝黑，带微蓝底调增加深度感
  bgDeep: "#06080e",
  bg: "#0c0f17",
  bgElevated: "#131722",
  bgSurface: "#1a1e2a",
  bgHover: "#232836",
  bgActive: "#2c3240",
  // 边框：蓝调透明
  border: "rgba(148, 175, 225, 0.08)",
  borderSubtle: "rgba(148, 175, 225, 0.05)",
  borderFocus: "rgba(62, 207, 180, 0.40)",
  // 文字：微蓝白，长时间阅读更舒适
  text: "#e2e6f0",
  textSecondary: "#8d93a8",
  textTertiary: "#565d73",
  textInverse: "#06080e",
  glass: "rgba(148, 175, 225, 0.03)",
  glassBorder: "rgba(148, 175, 225, 0.06)",
  shadowSm: "0 2px 8px rgba(0, 0, 0, 0.36)",
  shadowMd: "0 8px 24px rgba(0, 0, 0, 0.48)",
  shadowLg: "0 20px 48px rgba(0, 0, 0, 0.60)",
  shadowGlow: "0 0 0 1px rgba(62, 207, 180, 0.08), 0 8px 32px rgba(62, 207, 180, 0.10)"
}, Ho = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, No = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, Ka = {
  ...Ho,
  ...No
}, il = {
  dark: nl
};
function Fo(r) {
  return r.replace(/[A-Z]/g, (e) => "-" + e.toLowerCase());
}
function ll(r = "ag") {
  return r.trim() || "ag";
}
function Fr(r, e) {
  return `--${r}-${Fo(e)}`;
}
Object.keys(il.dark).reduce((r, e) => (r[e] = Fr("ag", e), r), {});
Object.keys(Ka).reduce((r, e) => (r[e] = Fr("ag", e), r), {});
function sl(r = {}) {
  const e = ll(r.prefix);
  return Object.keys(il.dark).reduce((t, a) => (t[a] = Fr(e, a), t), {});
}
function ol(r = {}) {
  const e = ll(r.prefix);
  return Object.keys(Ka).reduce((t, a) => (t[a] = Fr(e, a), t), {});
}
const Po = sl(), $o = ol();
function m(r, e = {}) {
  const t = e.prefix ? sl(e) : Po, a = e.prefix ? ol(e) : $o;
  if (r in t) {
    const i = r;
    return `var(${t[i]}, ${nl[i]})`;
  }
  const n = r;
  return `var(${a[n]}, ${Ka[n]})`;
}
const Pr = "/api/v1/ext-user/airgate-playground", Wo = "/api/v1";
function $r() {
  const r = {}, e = localStorage.getItem("token");
  return e && (r.Authorization = `Bearer ${e}`), r;
}
async function w0(r, e, t, a = Pr) {
  const n = { ...$r() };
  t !== void 0 && (n["Content-Type"] = "application/json");
  const i = await fetch(a + e, {
    method: r,
    headers: n,
    body: t ? JSON.stringify(t) : void 0
  });
  if (!i.ok) {
    const u = await i.text();
    let d = `HTTP ${i.status}`;
    try {
      const p = JSON.parse(u);
      d = p.error || p.message || d;
    } catch {
    }
    throw i.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login"), new Error(d);
  }
  const o = await i.text();
  return o ? JSON.parse(o) : null;
}
async function Go(r, e, t) {
  const a = await w0(r, e, t, Wo);
  if (a.code !== 0)
    throw new Error(a.message || "request failed");
  return a.data;
}
const s0 = {
  listConversations: () => w0("GET", "/conversations"),
  createConversation: (r) => w0("POST", "/conversations", r),
  getConversation: (r) => w0("GET", `/conversations/${r}`),
  updateConversation: (r, e) => w0("PUT", `/conversations/${r}`, e),
  deleteConversation: (r) => w0("DELETE", `/conversations/${r}`),
  listMessages: (r) => w0("GET", `/messages/${r}`),
  persistMessage: (r) => w0("POST", "/messages", r),
  listPlatforms: async () => (await w0("GET", "/platforms")).map((e) => {
    const t = e.name || e.Name || "", a = e.display_name || e.DisplayName || t;
    return { name: t, display_name: a };
  }).filter((e) => e.name),
  listModels: async (r) => {
    const e = await w0("GET", `/models?platform=${encodeURIComponent(r)}`);
    return (Array.isArray(e) ? e : e.data || []).map((a) => {
      const n = a.id || a.ID || "";
      return {
        id: n,
        name: a.name || a.Name || n,
        platform: r,
        input_price: a.input_price ?? a.InputPrice ?? 0,
        output_price: a.output_price ?? a.OutputPrice ?? 0,
        context_window: a.context_window ?? a.ContextWindow ?? 0,
        max_output_tokens: a.max_output_tokens ?? a.MaxOutputTokens ?? 0,
        image_only: !!(a.image_only ?? a.ImageOnly),
        capabilities: a.capabilities || a.Capabilities || []
      };
    }).filter((a) => a.id);
  },
  getUserInfo: () => Go("GET", "/users/me")
};
async function _o(r, e, t) {
  var o;
  const a = await fetch(`${Pr}/chat/completions`, {
    method: "POST",
    headers: {
      ...$r(),
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Airgate-Platform": r
    },
    body: JSON.stringify({ ...e, stream: !1 }),
    signal: t
  }), n = await a.text();
  let i = null;
  try {
    i = n ? JSON.parse(n) : null;
  } catch {
  }
  if (!a.ok) {
    a.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login");
    const u = i, d = typeof (u == null ? void 0 : u.error) == "string" ? u.error : ((o = u == null ? void 0 : u.error) == null ? void 0 : o.message) || (u == null ? void 0 : u.message) || `HTTP ${a.status}`;
    throw new Error(d);
  }
  return i || {};
}
async function jo(r, e, t) {
  var o;
  const a = await fetch(`${Pr}/images/edits`, {
    method: "POST",
    headers: {
      ...$r(),
      Accept: "application/json",
      "X-Airgate-Platform": r
    },
    body: e,
    signal: t
  }), n = await a.text();
  let i = null;
  try {
    i = n ? JSON.parse(n) : null;
  } catch {
  }
  if (!a.ok) {
    a.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login");
    const u = i, d = typeof (u == null ? void 0 : u.error) == "string" ? u.error : ((o = u == null ? void 0 : u.error) == null ? void 0 : o.message) || (u == null ? void 0 : u.message) || `HTTP ${a.status}`;
    throw new Error(d);
  }
  return i || {};
}
async function Xn(r, e, t, a) {
  var b, w, S;
  const n = {
    ...e,
    stream_options: {
      include_usage: !0,
      ...e.stream_options
    }
  }, i = await fetch(`${Pr}/chat/completions`, {
    method: "POST",
    headers: {
      ...$r(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Airgate-Platform": r
    },
    body: JSON.stringify(n),
    signal: a
  });
  if (!i.ok || !i.body) {
    const k = await i.text();
    let A = `HTTP ${i.status}`;
    try {
      const z = JSON.parse(k);
      A = ((b = z.error) == null ? void 0 : b.message) || z.error || z.message || A;
    } catch {
    }
    t.onError(A);
    return;
  }
  const o = i.body.getReader(), u = new TextDecoder();
  let d = "", p = { input_tokens: 0, output_tokens: 0, model: e.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: k, value: A } = await o.read();
      if (k) break;
      d += u.decode(A, { stream: !0 });
      const z = d.split(`
`);
      d = z.pop() || "";
      for (const D of z) {
        const O = D.trim();
        if (!O.startsWith("data: ")) continue;
        const $ = O.slice(6);
        if ($ === "[DONE]") {
          t.onDone(p);
          return;
        }
        try {
          const P = JSON.parse($);
          if (P.error) {
            t.onError(P.error.message || P.error);
            return;
          }
          const G = (S = (w = P.choices) == null ? void 0 : w[0]) == null ? void 0 : S.delta, W = G == null ? void 0 : G.reasoning_content;
          W && t.onReasoning(W);
          const V = G == null ? void 0 : G.content;
          V && t.onData(V), P.usage && (p = {
            input_tokens: P.usage.prompt_tokens || P.usage.input_tokens || 0,
            output_tokens: P.usage.completion_tokens || P.usage.output_tokens || 0,
            model: P.model || p.model,
            cost: P.usage.cost || 0
          });
        } catch {
        }
      }
    }
    t.onDone(p);
  } catch (k) {
    if (a != null && a.aborted) return;
    t.onError(k instanceof Error ? k.message : "stream failed");
  }
}
m("bgDeep"), m("text"), m("fontSans"), `${m("borderSubtle")}`, m("bg"), `${m("borderSubtle")}`, m("radiusSm"), m("textSecondary"), m("radiusSm"), m("bgHover"), m("text"), m("textTertiary"), m("text"), `${m("borderSubtle")}`, m("bg"), m("textTertiary"), `${m("borderSubtle")}`, m("radiusSm"), m("bgSurface"), m("text"), m("textTertiary"), `${m("borderSubtle")}`, m("radiusSm"), m("bgSurface"), m("textSecondary"), m("transition"), m("bgHover"), m("text"), `${m("borderSubtle")}`, m("bgSurface"), m("textSecondary"), m("transition"), m("bgHover"), m("text"), m("border"), m("textTertiary"), `${m("borderSubtle")}`, m("radiusSm"), m("bgSurface"), m("transition"), m("border"), m("textTertiary"), m("bgDeep"), m("textTertiary"), m("bgSurface"), `${m("borderSubtle")}`, m("radiusMd"), m("text"), m("textTertiary"), m("textTertiary"), m("radiusSm"), m("text"), m("bg"), m("transition"), `${m("borderSubtle")}`, m("radiusSm"), m("textSecondary"), m("danger"), m("radiusSm"), m("text"), m("textTertiary"), m("textTertiary"), m("textTertiary"), `${m("borderSubtle")}`, m("radiusMd"), m("bg"), m("textTertiary"), m("bgSurface"), `${m("borderSubtle")}`, m("radiusSm"), m("bgDeep"), `${m("borderSubtle")}`, m("bg"), m("textSecondary"), m("transition"), m("text"), m("textTertiary"), m("radiusSm");
const da = "airgate.playground.studioMode", Kn = !1, Zn = 960, _e = -1, Uo = /data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+/g, q0 = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+|\/api\/v1\/ext-user\/airgate-playground\/assets\/[^\s)]+|blob:[^\s)]+)\)/g, bt = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+|\/api\/v1\/ext-user\/airgate-playground\/assets\/[^\s)]+|blob:[^\s)]+)\)/g, Vo = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+|\/api\/v1\/ext-user\/airgate-playground\/assets\/[^\s)]+|blob:[^\s)]+)\)/, br = /<!--airgate:image-edit:([A-Za-z0-9+/=]+)-->/g, ul = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, Yo = /(^|[-_])(?:gpt-?5|o[134]|codex)(?:[-_.]|$)/i, Jn = /(^|[-_])(?:gpt[-_]?image|image)(?:[-_.]|\d|$)/i, cl = 10 * 1024 * 1024, Qn = 8, Xo = "gpt-5.5", yr = "airgate.playground.activeConversationId", Ra = "airgate.playground.selectedModel", Ko = "openai", ei = "gpt-5.4-mini", dl = 4, Wr = "auto", Zo = [
  { value: Wr, label: "Auto" },
  { value: "1024x1024", label: "1024×1024 (1K)" },
  { value: "1536x1024", label: "1536×1024 (1K)" },
  { value: "1024x1536", label: "1024×1536 (1K)" },
  { value: "2048x2048", label: "2048×2048 (2K)" },
  { value: "2048x1152", label: "2048×1152 (2K)" },
  { value: "1152x2048", label: "1152×2048 (2K)" },
  { value: "3840x2160", label: "3840×2160 (4K)" },
  { value: "2160x3840", label: "2160×3840 (4K)" }
], Jo = {
  value: Wr
};
function ti(r, e, t) {
  return Math.min(t, Math.max(e, r));
}
function Qo(r) {
  const e = r.indexOf(",");
  if (e < 0) return null;
  const t = r.slice(5, e), a = /^([^;]+)/.exec(t), n = (a == null ? void 0 : a[1]) || "application/octet-stream", i = r.slice(e + 1);
  try {
    const o = atob(i), u = new Uint8Array(o.length);
    for (let d = 0; d < o.length; d++) u[d] = o.charCodeAt(d);
    return new Blob([u], { type: n });
  } catch {
    return null;
  }
}
function ha(r, e) {
  return !r || !r.includes("data:image/") ? r : r.replace(Uo, (t) => {
    const a = Qo(t);
    if (!a) return t;
    const n = URL.createObjectURL(a);
    return e.set(n, t), n;
  });
}
function ma(r, e) {
  return !r || !r.includes("blob:") ? r : r.replace(/blob:[^\s)"']+/g, (t) => e.get(t) || t);
}
function e1(r) {
  r.forEach((e, t) => URL.revokeObjectURL(t)), r.clear();
}
function ri(r, e) {
  const t = Math.min(r.x, e.x), a = Math.min(r.y, e.y);
  return {
    x: t,
    y: a,
    width: Math.abs(e.x - r.x),
    height: Math.abs(e.y - r.y)
  };
}
function t1(r) {
  return !!(r && r.width >= Qn && r.height >= Qn);
}
function r1(r) {
  return r.value === Wr ? void 0 : r.value;
}
function ct(r) {
  return r.replace(br, "");
}
function hl(r) {
  return ct(r).replace(q0, "[Image generated]").trim() || "[Image generated]";
}
function a1(r) {
  return ct(r).replace(q0, "[Image]").trim() || "[Image]";
}
function pa(r) {
  return Vo.test(r);
}
function n1(r) {
  return `<!--airgate:image-edit:${btoa(encodeURIComponent(JSON.stringify(r)))}-->`;
}
function i1(r) {
  const e = [];
  let t;
  for (br.lastIndex = 0; (t = br.exec(r)) !== null; )
    try {
      const a = JSON.parse(decodeURIComponent(atob(t[1])));
      a && Number.isInteger(a.imageIndex) && a.rect && [a.rect.x, a.rect.y, a.rect.width, a.rect.height].every((n) => typeof n == "number") && e.push(a);
    } catch {
    }
  return br.lastIndex = 0, e;
}
function l1(r) {
  bt.lastIndex = 0;
  const e = bt.exec(r);
  return bt.lastIndex = 0, e ? { alt: e[1], url: e[2] } : null;
}
function s1(r) {
  return ct(r).replace(q0, "").trim().length > 0;
}
function ml(r) {
  return r.replace(/[\]\\]/g, "");
}
function Da(r) {
  const e = r.match(ul);
  if (e) return e[1].toLowerCase() === "jpeg" ? "jpg" : e[1].toLowerCase();
  try {
    const a = new URL(r).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return a ? a[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}
function pl(r, e) {
  return `${(r || "generated-image").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80) || "generated-image"}.${Da(e)}`;
}
function fa(r, e) {
  const t = document.createElement("a");
  t.href = r, t.download = e, t.rel = "noreferrer", document.body.appendChild(t), t.click(), t.remove();
}
async function o1(r, e) {
  const t = pl(e, r);
  if (ul.test(r)) {
    fa(r, t);
    return;
  }
  try {
    const a = await fetch(r);
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    const n = URL.createObjectURL(await a.blob());
    try {
      fa(n, t);
    } finally {
      URL.revokeObjectURL(n);
    }
  } catch {
    fa(r, t);
  }
}
async function u1(r) {
  var a;
  if ((a = navigator.clipboard) != null && a.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(r);
    return;
  }
  const e = document.createElement("textarea");
  e.value = r, e.style.position = "fixed", e.style.opacity = "0", e.style.pointerEvents = "none", document.body.appendChild(e), e.select();
  const t = document.execCommand("copy");
  if (e.remove(), !t) throw new Error("copy failed");
}
function fl(r) {
  return new Promise((e, t) => {
    const a = new FileReader();
    a.onload = () => e(String(a.result || "")), a.onerror = () => t(a.error || new Error("Failed to read image")), a.readAsDataURL(r);
  });
}
function c1(r) {
  return new Promise((e, t) => {
    r.toBlob((a) => {
      if (a) {
        e(a);
        return;
      }
      t(new Error("Failed to create mask"));
    }, "image/png");
  });
}
function ai(r) {
  return new Promise((e, t) => {
    const a = new Image();
    a.onload = () => e(a), a.onerror = () => t(new Error("Failed to load image")), a.src = r;
  });
}
function ni(r, e, t = []) {
  const a = r.trim(), n = e.map((o) => `![${ml(o.name)}](${o.url})`).join(`
`), i = t.map(n1).join(`
`);
  return [a, n, i].filter(Boolean).join(`

`);
}
async function d1(r) {
  const e = r.filter((t) => t.type.startsWith("image/"));
  if (e.some((t) => t.size > cl))
    throw new Error("Images must be 10MB or smaller");
  return Promise.all(e.map(async (t) => ({
    id: `${t.name}-${t.lastModified}-${t.size}`,
    name: t.name || "pasted-image",
    url: await fl(t)
  })));
}
async function gl(r) {
  if (!r.type.startsWith("image/"))
    throw new Error("Select an image file");
  if (r.size > cl)
    throw new Error("Images must be 10MB or smaller");
  return {
    id: `${r.name}-${r.lastModified}-${r.size}`,
    name: r.name || "source-image",
    url: await fl(r),
    file: r
  };
}
async function h1(r, e) {
  let t;
  try {
    t = await fetch(r, r.startsWith("data:") ? void 0 : { credentials: "omit" });
  } catch {
    throw new Error("Failed to fetch image — it may be hosted on a server that blocks cross-origin reads.");
  }
  if (!t.ok) throw new Error(`Failed to fetch image (HTTP ${t.status})`);
  const a = await t.blob(), n = a.type && a.type.startsWith("image/") ? a.type : `image/${Da(r) === "jpg" ? "jpeg" : Da(r)}`, i = pl(e || "generated-image", r), o = new File([a], i, { type: n });
  return gl(o);
}
function m1(r) {
  var t;
  const e = (t = r.data) == null ? void 0 : t[0];
  return e ? e.url ? e.url : e.b64_json ? `data:image/png;base64,${e.b64_json}` : "" : "";
}
function p1(r, e) {
  var n, i, o;
  const t = m1(r);
  return t ? [(o = (i = (n = r.data) == null ? void 0 : n[0]) == null ? void 0 : i.revised_prompt) == null ? void 0 : o.trim(), `![${ml(e)}](${t})`].filter(Boolean).join(`

`) : "";
}
function f1(r) {
  var e, t, a, n, i;
  return {
    input_tokens: ((e = r.usage) == null ? void 0 : e.prompt_tokens) || ((t = r.usage) == null ? void 0 : t.input_tokens) || 0,
    output_tokens: ((a = r.usage) == null ? void 0 : a.completion_tokens) || ((n = r.usage) == null ? void 0 : n.output_tokens) || 0,
    cost: ((i = r.usage) == null ? void 0 : i.cost) || 0
  };
}
function g1(r, e) {
  return [r.trim(), e.trim()].filter(Boolean).join(`

`);
}
function v1(r) {
  return r.map((e) => e.trim()).filter(Boolean).slice(0, dl).map((e, t, a) => [
    `Shot ${t + 1} of ${a.length}. Generate exactly one standalone image for this shot.`,
    "Do not create a collage, grid, contact sheet, split-screen, infographic, or multi-panel layout.",
    e
  ].join(" "));
}
function b1(r) {
  if (!r) return [];
  try {
    const e = JSON.parse(r);
    return Array.isArray(e.shots) ? v1(e.shots.map((t) => typeof t == "string" ? t : "")) : [];
  } catch {
    return [];
  }
}
function y1(r, e) {
  q0.lastIndex = 0;
  const t = q0.exec(r);
  return q0.lastIndex = 0, t ? [e, r.slice(t.index).trim()].filter(Boolean).join(`

`) : e;
}
function x1(r, e) {
  const t = r.map((n) => ({ ...n })), a = t.map((n) => n.role).lastIndexOf("user");
  return a >= 0 && (t[a] = {
    ...t[a],
    content: y1(t[a].content, e)
  }), t;
}
function ii(r) {
  const e = ct(r).replace(q0, "[Image]").trim() || "[Image]";
  return e.slice(0, 30) + (e.length > 30 ? "..." : "");
}
function li(r, e) {
  const t = ct(e);
  if (r !== "user") return hl(t);
  const a = [];
  let n = 0, i;
  for (q0.lastIndex = 0; (i = q0.exec(t)) !== null; ) {
    const u = t.slice(n, i.index).trim();
    u && a.push({ type: "text", text: u }), a.push({ type: "image_url", image_url: { url: i[1] } }), n = i.index + i[0].length;
  }
  const o = t.slice(n).trim();
  return o && a.push({ type: "text", text: o }), a.length ? a : t;
}
function vl(r, e) {
  return !!(r && Jn.test(r) || e && Jn.test(e));
}
function qt(r) {
  var e;
  return !!(r && (r.image_only || (e = r.capabilities) != null && e.includes("image_generation") || vl(r.id, r.name)));
}
function ga(r) {
  var e, t;
  return !r || qt(r) ? !1 : !!((e = r.capabilities) != null && e.includes("reasoning") || (t = r.capabilities) != null && t.includes("thinking") || Yo.test(r.id));
}
function st(r) {
  return `${encodeURIComponent(r.platform || "")}:${encodeURIComponent(r.id)}`;
}
function va(r) {
  return (r || "").toLowerCase().replace(/[-_\s]/g, "");
}
function w1(r) {
  const e = va(Xo), t = r.find((a) => va(a.id) === e || va(a.name) === e);
  return t ? st(t) : r[0] ? st(r[0]) : "";
}
function S1() {
  if (typeof window > "u") return null;
  const r = window.localStorage.getItem(yr);
  if (!r) return null;
  const e = Number(r);
  return Number.isInteger(e) && e > 0 ? e : null;
}
function k1() {
  return typeof window > "u" ? "" : window.localStorage.getItem(Ra) || "";
}
function M1(r, e) {
  var t;
  return ((t = r.find((a) => a.name === e)) == null ? void 0 : t.display_name) || e || "";
}
function T1(r) {
  return /^(https?:|mailto:|#)/i.test(r);
}
function A1(r) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:|blob:)/i.test(r);
}
function si(r, e, t) {
  e.split(`
`).forEach((n, i) => {
    i > 0 && r.push(/* @__PURE__ */ M("br", {}, `${t}-br-${i}`)), n && r.push(n);
  });
}
function bl(r, e, t, a) {
  var b, w;
  const n = ((b = a.takeImageIndex) == null ? void 0 : b.call(a)) ?? -1, i = (w = a.imageEditAnnotations) == null ? void 0 : w.find((S) => S.imageIndex === n), o = /* @__PURE__ */ M("img", { src: e, alt: t, style: x.generatedImage, loading: "lazy" }), u = i ? /* @__PURE__ */ N("span", { style: x.generatedImageOverlayWrap, children: [
    o,
    /* @__PURE__ */ M("span", { style: x.generatedImageDimOverlay }),
    /* @__PURE__ */ M(
      "span",
      {
        style: {
          ...x.generatedImageSelection,
          left: `${i.rect.x * 100}%`,
          top: `${i.rect.y * 100}%`,
          width: `${i.rect.width * 100}%`,
          height: `${i.rect.height * 100}%`
        }
      }
    )
  ] }) : o, d = a.imagePreviewTitle || "Preview image", p = a.onImagePreview ? /* @__PURE__ */ M(
    "button",
    {
      type: "button",
      style: x.generatedImagePreviewBtn,
      title: d,
      "aria-label": d,
      onClick: () => {
        var S;
        return (S = a.onImagePreview) == null ? void 0 : S.call(a, e, t);
      },
      children: u
    }
  ) : u;
  return /* @__PURE__ */ M("span", { style: { ...x.generatedImageFrame, ...a.isMobile ? x.generatedImageFrameMobile : null }, children: p }, r);
}
function ot(r, e, t = {}) {
  const a = [], n = new RegExp("(`([^`]+)`|\\\\\\(([\\s\\S]*?)\\\\\\)|(?<!\\\\)\\$(?!\\s)([^\\n$]*?\\S)(?<!\\\\)\\$|!\\[([^\\]]*)\\]\\(([^)\\s]+)\\)|\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|\\*\\*([^*]+)\\*\\*|__([^_]+)__|\\*([^*]+)\\*|_([^_]+)_)", "g");
  let i = 0, o;
  for (; (o = n.exec(r)) !== null; ) {
    o.index > i && si(a, r.slice(i, o.index), `${e}-text-${i}`);
    const u = `${e}-${o.index}`, d = o[2], p = o[3], b = o[4], w = o[5], S = o[6], k = o[7], A = o[8], z = o[9] || o[10], D = o[11] || o[12];
    d ? a.push(/* @__PURE__ */ M("code", { style: x.markdownInlineCode, children: d }, u)) : p || b ? a.push(xr(p || b, u, !1)) : S && A1(S) ? a.push(bl(u, S, w || t.generatedImageAlt || "Generated image", t)) : A && T1(A) ? a.push(
      /* @__PURE__ */ M("a", { href: A, style: x.markdownLink, target: "_blank", rel: "noreferrer", children: ot(k, `${u}-link`, t) }, u)
    ) : z ? a.push(/* @__PURE__ */ M("strong", { children: ot(z, `${u}-bold`, t) }, u)) : D ? a.push(/* @__PURE__ */ M("em", { children: ot(D, `${u}-em`, t) }, u)) : a.push(o[0]), i = o.index + o[0].length;
  }
  return i < r.length && si(a, r.slice(i), `${e}-text-${i}`), a.length > 0 ? a : r;
}
function xr(r, e, t) {
  const a = Lo.renderToString(r, {
    displayMode: t,
    throwOnError: !1,
    strict: "ignore",
    trust: !1
  });
  return /* @__PURE__ */ M(t ? "div" : "span", { style: t ? x.markdownBlockMath : x.markdownInlineMath, dangerouslySetInnerHTML: { __html: a } }, e);
}
function z1(r, e, t, a = {}) {
  const n = ot(e, `${t}-inline`, a);
  return r === 1 ? /* @__PURE__ */ M("h1", { style: x.markdownH1, children: n }, t) : r === 2 ? /* @__PURE__ */ M("h2", { style: x.markdownH2, children: n }, t) : r === 3 ? /* @__PURE__ */ M("h3", { style: x.markdownH3, children: n }, t) : /* @__PURE__ */ M("h4", { style: x.markdownH4, children: n }, t);
}
function C1(r) {
  const e = [];
  let t;
  for (bt.lastIndex = 0; (t = bt.exec(r)) !== null; )
    e.push({ alt: t[1], url: t[2] });
  const a = r.replace(bt, "").trim();
  return !e.length || a ? null : e;
}
function B1(r, e, t = {}) {
  return /* @__PURE__ */ M("div", { style: { ...x.imageGroup, ...t.isMobile ? x.imageGroupMobile : null }, children: r.map((a, n) => bl(`${e}-${n}`, a.url, a.alt || t.generatedImageAlt || "Generated image", t)) }, e);
}
const I1 = /* @__PURE__ */ new Set(["p", "h1", "h2", "h3", "h4", "blockquote", "li"]);
function yl(r, e) {
  if (!jl(r) || typeof r.type != "string") return null;
  if (I1.has(r.type))
    return fn(r, void 0, ...gn.toArray(r.props.children), e);
  if (r.type === "ol" || r.type === "ul") {
    const t = gn.toArray(r.props.children);
    for (let a = t.length - 1; a >= 0; a--) {
      const n = yl(t[a], e);
      if (n) {
        const i = [...t];
        return i[a] = n, fn(r, void 0, ...i);
      }
    }
  }
  return null;
}
function E1(r, e) {
  if (!e) return r;
  for (let t = r.length - 1; t >= 0; t--) {
    const a = yl(r[t], e);
    if (a) {
      const n = [...r];
      return n[t] = a, n;
    }
  }
  return r;
}
function fr(r, e = {}) {
  const t = ct(r);
  let a = -1;
  const n = {
    ...e,
    imageEditAnnotations: e.imageEditAnnotations || i1(r),
    takeImageIndex: () => (a += 1, a)
  }, i = t.replace(/\r\n?/g, `
`).split(`
`), o = [];
  let u = [], d = [], p = [], b = [], w = [], S = [], k = !1, A = null, z = 0;
  const D = (U) => `${U}-${z++}`, O = () => {
    S.length && (o.push(B1(S, D("images"), n)), S = []);
  }, $ = () => {
    if (!u.length) return;
    const U = u.join(`
`), J = C1(U);
    if (J)
      S.push(...J);
    else {
      O();
      const Q = D("p");
      o.push(/* @__PURE__ */ M("p", { style: x.markdownParagraph, children: ot(U, Q, n) }, Q));
    }
    u = [];
  }, P = () => {
    if (!d.length) return;
    O();
    const U = D("quote");
    o.push(/* @__PURE__ */ M("blockquote", { style: x.markdownBlockquote, children: ot(d.join(`
`), U, n) }, U)), d = [];
  }, G = () => {
    if (!p.length) return;
    O();
    const U = D("list"), J = p.map((Q, ze) => /* @__PURE__ */ M("li", { style: x.markdownListItem, children: ot(Q.text, `${U}-${ze}`, n) }, `${U}-${ze}`));
    o.push(p[0].ordered ? /* @__PURE__ */ M("ol", { style: x.markdownList, children: J }, U) : /* @__PURE__ */ M("ul", { style: x.markdownList, children: J }, U)), p = [];
  }, W = () => {
    $(), P(), G();
  }, V = () => {
    W(), O();
  }, Y = () => {
    O();
    const U = D("code");
    o.push(/* @__PURE__ */ M("pre", { style: x.markdownCodeBlock, children: /* @__PURE__ */ M("code", { children: b.join(`
`) }) }, U)), b = [];
  }, ie = () => {
    O();
    const U = D("math");
    o.push(xr(w.join(`
`).trim(), U, !0)), w = [];
  };
  for (const U of i) {
    if (A) {
      const $e = A === "$$" ? U.indexOf("$$") : U.indexOf("\\]");
      if ($e >= 0) {
        const Ye = A.length;
        w.push(U.slice(0, $e)), ie(), A = null;
        const de = U.slice($e + Ye).trim();
        de && u.push(de);
      } else
        w.push(U);
      continue;
    }
    if (U.match(/^```/)) {
      k ? (Y(), k = !1) : (V(), k = !0);
      continue;
    }
    if (k) {
      b.push(U);
      continue;
    }
    if (!U.trim()) {
      W();
      continue;
    }
    const Q = U.trim(), ze = Q.match(/^\$\$([\s\S]*?)\$\$$/), ce = Q.match(/^\\\[([\s\S]*?)\\\]$/);
    if (ze || ce) {
      V(), o.push(xr(((ze == null ? void 0 : ze[1]) || (ce == null ? void 0 : ce[1]) || "").trim(), D("math"), !0));
      continue;
    }
    if (Q.startsWith("$$") || Q.startsWith("\\[")) {
      V();
      const $e = Q.startsWith("$$"), Ye = $e ? "$$" : "\\[", de = $e ? "$$" : "\\]", i0 = Q.slice(Ye.length), ke = i0.indexOf(de);
      ke >= 0 ? o.push(xr(i0.slice(0, ke).trim(), D("math"), !0)) : (w.push(i0), A = de);
      continue;
    }
    const Ce = U.match(/^(#{1,6})\s+(.+)$/);
    if (Ce) {
      V(), o.push(z1(Math.min(Ce[1].length, 4), Ce[2].trim(), D("heading"), n));
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(U)) {
      V(), o.push(/* @__PURE__ */ M("hr", { style: x.markdownDivider }, D("hr")));
      continue;
    }
    const Ee = U.match(/^>\s?(.*)$/);
    if (Ee) {
      $(), G(), d.push(Ee[1]);
      continue;
    }
    const He = U.match(/^\s*[-*+]\s+(.+)$/), Ne = U.match(/^\s*\d+[.)]\s+(.+)$/);
    if (He || Ne) {
      $(), P();
      const $e = !!Ne;
      p.length && p[0].ordered !== $e && G(), p.push({ ordered: $e, text: ((Ne == null ? void 0 : Ne[1]) || (He == null ? void 0 : He[1]) || "").trim() });
      continue;
    }
    P(), G(), u.push(U);
  }
  k && Y(), A && ie(), W(), O();
  const re = E1(o, e.trailingInlineAction);
  return re.length > 0 ? re : t;
}
function R1() {
  const { t: r } = Ul(), [e, t] = se([]), [a, n] = se(!1), [i, o] = se(null), [u, d] = se([]), [p, b] = se(null), [w, S] = se(""), [k, A] = se(""), [z, D] = se(!1), [O, $] = se(""), [P, G] = se([]), [W, V] = se(null), [Y, ie] = se(!1), [re, U] = se(!1), [J, Q] = se(null), [ze, ce] = se(null), [Ce, Ee] = se(null), [He, Ne] = se(null), [$e, Ye] = se([]), [de, i0] = se([]), [ke, z0] = se(""), [Pt, At] = se(null), [Fe, $t] = se("medium"), [v0, Wt] = se(() => ({ ...Jo })), [c0, Gt] = se(null), [b0, ne] = se(""), [F0, ge] = se(null), [dt, P0] = se(""), [_t, C0] = se(null), [jt, $0] = se(!0), [ee, Ut] = se(() => typeof window < "u" ? window.innerWidth <= Zn : !1), [zt, Za] = se(() => typeof window > "u" ? !1 : localStorage.getItem(da) === "1");
  Qe(() => {
    typeof window > "u" || (zt ? localStorage.setItem(da, "1") : localStorage.removeItem(da));
  }, [zt]);
  const Vt = e0(null), W0 = e0(null), d0 = e0(null), Yt = e0(null), Ja = e0(null), Ct = e0(null), Xt = e0(null), tt = e0(null), We = e0(null), l0 = e0(null), Kt = e0(null), ht = e0(!1), rt = e0(/* @__PURE__ */ new Map()), Je = le((v) => {
    const T = (B) => B.map((L) => !L.content || !L.content.includes("data:image/") ? L : { ...L, content: ha(L.content, rt.current) });
    d(typeof v == "function" ? (B) => T(v(B)) : T(v));
  }, []);
  Qe(() => {
    !z && !re && ht.current && (ht.current = !1, requestAnimationFrame(() => {
      var v;
      (v = d0.current) == null || v.focus();
    }));
  }, [z, re]), Qe(() => {
    s0.listConversations().then((T) => {
      t(T), n(!0);
      const B = S1();
      B && T.some((L) => L.id === B) ? o(B) : window.localStorage.removeItem(yr);
    }).catch(() => {
    }), s0.getUserInfo().then(Gt).catch(() => {
    });
    let v = !1;
    return s0.listPlatforms().then(async (T) => {
      if (v) return;
      Ye(T);
      const B = await Promise.all(T.map((Z) => s0.listModels(Z.name).catch(() => [])));
      if (v) return;
      const L = B.flat(), _ = k1();
      i0(L), z0((Z) => {
        const ae = Z || _;
        return L.some((he) => st(he) === ae) ? ae : w1(L);
      });
    }).catch((T) => {
      v || (i0([]), z0(""), ge(null), ne(T instanceof Error ? T.message : "Failed to load models"));
    }), () => {
      v = !0;
    };
  }, []), Qe(() => {
    We.current = i, !(typeof window > "u" || !a) && (i && i !== _e ? window.localStorage.setItem(yr, String(i)) : window.localStorage.removeItem(yr));
  }, [i, a]), Qe(() => {
    typeof window > "u" || de.length === 0 || (ke && de.some((v) => st(v) === ke) ? window.localStorage.setItem(Ra, ke) : window.localStorage.removeItem(Ra));
  }, [de, ke]), Qe(() => {
    if (!i || i === _e) {
      Je([]);
      return;
    }
    if (Kt.current === i) {
      Kt.current = null;
      return;
    }
    s0.listMessages(i).then(Je).catch(() => {
    });
  }, [i, Je]), Qe(() => {
    const v = rt.current;
    return () => {
      e1(v);
    };
  }, []), Qe(() => {
    var v;
    (v = Vt.current) == null || v.scrollIntoView({ behavior: "smooth" });
  }, [u, w, k]), Qe(() => {
    if (typeof window > "u") return;
    const v = window.matchMedia(`(max-width: ${Zn}px)`), T = (B) => {
      Ut(B ? B.matches : v.matches);
    };
    return T(), v.addEventListener ? (v.addEventListener("change", T), () => v.removeEventListener("change", T)) : (v.addListener(T), () => v.removeListener(T));
  }, []), Qe(() => {
    $0(!ee);
  }, [ee]), Qe(() => {
    if (!dt) return;
    const v = window.setTimeout(() => P0(""), 1400);
    return () => window.clearTimeout(v);
  }, [dt]), Qe(() => {
    if (!W || !Y) return;
    let v = !1;
    const T = async () => {
      const L = Ct.current, _ = Xt.current;
      if (!L || !_) return;
      const Z = await ai(W.url);
      if (v) return;
      const ae = _.clientWidth || Z.naturalWidth, he = typeof window < "u" ? window.innerHeight : 800, Re = ee ? Math.min(he * 0.45, 360) : Math.min(he * 0.62, 720), m0 = Math.min(1, ae / Z.naturalWidth, Re / Z.naturalHeight), fe = Math.max(1, Math.round(Z.naturalWidth * m0)), Xe = Math.max(1, Math.round(Z.naturalHeight * m0));
      L.width = fe, L.height = Xe, L.style.width = `${fe}px`, L.style.height = `${Xe}px`, Ee({ width: fe, height: Xe });
      const j0 = L.getContext("2d");
      j0 && (j0.clearRect(0, 0, fe, Xe), Q(null), ce(null), tt.current = null);
    };
    if (T().catch((L) => ne(L instanceof Error ? L.message : "Failed to load image")), typeof ResizeObserver > "u")
      return () => {
        v = !0;
      };
    const B = new ResizeObserver(() => {
      T().catch((L) => ne(L instanceof Error ? L.message : "Failed to load image"));
    });
    return Xt.current && B.observe(Xt.current), () => {
      v = !0, B.disconnect();
    };
  }, [W, Y, ee]);
  const y0 = le(() => 0, []), xl = le((v) => {
    Wt((T) => ({ ...T, ...v }));
  }, []), G0 = de.find((v) => st(v) === ke), me = (G0 == null ? void 0 : G0.id) || "", wl = (G0 == null ? void 0 : G0.platform) || "", h0 = qt(G0), Bt = ga(G0), B0 = r1(v0), ve = wl, Sl = de.map((v) => ({
    value: st(v),
    label: `${v.name || v.id} · ${M1($e, v.platform)}`
  })), Gr = ({
    id: v,
    value: T,
    options: B,
    onChange: L,
    ariaLabel: _,
    variant: Z = "chip"
  }) => {
    const ae = B.find((fe) => fe.value === T), he = Pt === v, Re = Z === "model" ? { ...x.selectTrigger, ...x.modelSelectTrigger, ...ee ? x.modelSelectTriggerMobile : null } : { ...x.selectTrigger, ...x.chipSelectTrigger, ...ee ? x.chipSelectTriggerMobile : null }, m0 = /* @__PURE__ */ M(
      "div",
      {
        style: {
          ...x.selectPopover,
          ...Z === "model" ? x.selectPopoverModel : x.selectPopoverChip,
          ...ee ? x.selectPopoverMobile : null
        },
        role: "listbox",
        "aria-label": _,
        children: B.map((fe) => {
          const Xe = fe.value === T;
          return /* @__PURE__ */ M(
            "button",
            {
              type: "button",
              style: {
                ...x.selectOption,
                ...Xe ? x.selectOptionActive : null,
                ...Z === "model" ? x.selectOptionModel : null
              },
              role: "option",
              "aria-selected": Xe,
              onClick: () => {
                L(fe.value), At(null);
              },
              children: fe.label
            },
            fe.value
          );
        })
      }
    );
    return /* @__PURE__ */ N("div", { style: { ...x.selectWrap, ...Z === "model" ? x.modelSelectWrap : null }, children: [
      /* @__PURE__ */ N(
        "button",
        {
          type: "button",
          style: { ...Re, ...he ? x.selectTriggerOpen : null },
          "aria-label": _,
          "aria-haspopup": "listbox",
          "aria-expanded": he,
          onClick: () => At((fe) => fe === v ? null : v),
          children: [
            /* @__PURE__ */ M("span", { style: x.selectTriggerText, children: (ae == null ? void 0 : ae.label) || _ }),
            /* @__PURE__ */ M("span", { "aria-hidden": "true", style: x.selectTriggerCaret, children: "v" })
          ]
        }
      ),
      he && (ee ? /* @__PURE__ */ M("div", { style: x.selectOverlay, onClick: () => At(null), children: /* @__PURE__ */ N("div", { style: x.selectSheet, onClick: (fe) => fe.stopPropagation(), children: [
        /* @__PURE__ */ M("div", { style: x.selectSheetHeader, children: _ }),
        m0
      ] }) }) : m0)
    ] });
  }, Qa = le(() => {
    const v = (/* @__PURE__ */ new Date()).toISOString(), T = {
      id: _e,
      user_id: (c0 == null ? void 0 : c0.id) || 0,
      title: "",
      group_id: y0(),
      platform: ve,
      model: me,
      created_at: v,
      updated_at: v
    };
    t((B) => [T, ...B.filter((L) => L.id !== _e)]), o(_e), Je([]), G([]), V(null), ie(!1), Q(null), ce(null), Ee(null), ne(""), ge(null), ee && $0(!1);
  }, [ee, y0, ve, me, c0 == null ? void 0 : c0.id]), kl = le(async (v) => {
    var B, L;
    if (await ((L = (B = window.airgate) == null ? void 0 : B.confirm) == null ? void 0 : L.call(B, r("playground.delete_conversation_confirm"), {
      title: r("playground.delete_conversation"),
      danger: !0
    }))) {
      if (v === _e) {
        t((_) => _.filter((Z) => Z.id !== v)), i === v && (o(null), Je([]));
        return;
      }
      try {
        await s0.deleteConversation(v), t((_) => _.filter((Z) => Z.id !== v)), i === v && (o(null), Je([]));
      } catch {
      }
    }
  }, [i, r]), _0 = le(async ({
    conversationID: v,
    requestMessages: T,
    model: B,
    groupID: L,
    platform: _,
    isImageRequest: Z,
    imageSize: ae,
    supportsReasoning: he,
    reasoningEffort: Re,
    titleContent: m0
  }) => {
    var Xe, j0, pt, tr, qe, Ke, ft, on;
    const fe = {
      conversationID: v,
      requestMessages: T.map((p0) => ({ ...p0 })),
      model: B,
      groupID: L,
      platform: _,
      isImageRequest: Z,
      imageSize: ae,
      supportsReasoning: he,
      reasoningEffort: Re
    };
    ne(""), ge(null), D(!0), b(v), l0.current = { conversationId: v, model: B }, S(""), A("");
    try {
      const p0 = new AbortController();
      W0.current = p0;
      let I0 = "", Rt = "";
      const un = {
        model: B,
        // user message 可能含 blob URL（参考图被前端转过），上游需要原 base64，
        // 调 toChatMessageContent 之前先反转。
        messages: T.map((Oe) => ({
          role: Oe.role,
          content: li(Oe.role, ma(Oe.content, rt.current))
        })),
        stream: !0,
        ...Z && ae ? { size: ae } : {},
        ...he ? { reasoning_effort: Re ?? Fe } : {}
      }, cn = async (Oe) => {
        if (!I0) {
          We.current === v && (ne(r("playground.no_response")), ge(fe)), S(""), A(""), b(null), l0.current = null, D(!1);
          return;
        }
        const rr = ma(I0, rt.current), at = await s0.persistMessage({
          conversation_id: v,
          role: "assistant",
          content: rr,
          reasoning: Rt,
          platform: _,
          model: Oe.model || B,
          group_id: L,
          input_tokens: Oe.input_tokens,
          output_tokens: Oe.output_tokens,
          cost: Oe.cost
        });
        We.current === v && d((f0) => [...f0, { ...at, content: I0 }]), ge(null), m0 && t((f0) => f0.map(
          (nt) => nt.id === v && !nt.title ? { ...nt, title: ii(m0), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : nt
        )), S(""), A(""), b(null), l0.current = null, D(!1);
      };
      if (Z) {
        const Oe = T.filter((Le) => Le.role === "user").at(-1), rr = Oe ? hl(ct(Oe.content)).trim() : "";
        let at = [rr || "Generate the requested image."];
        const f0 = await _o(
          Ko,
          {
            model: ei,
            messages: [
              {
                role: "system",
                content: [
                  `Analyze the user's intent and convert the image-generation request into 1 to ${dl} standalone image prompts.`,
                  "Return only JSON with a shots array of strings.",
                  "The number of strings in shots is the number of images to generate: one string means one image, multiple strings mean multiple separate images.",
                  "Use one shot only when the user wants one final image/composite. Use multiple shots when the user wants multiple deliverables, separate scenes, separate assets, variants, product angles, lifestyle scenes, feature diagrams, packaging views, story frames, or a set/series of images.",
                  "Do not merge separate requested images into one collage, grid, contact sheet, split-screen, infographic, poster, or multi-panel layout unless the user explicitly asks for a single combined image.",
                  "Each shot must be a complete prompt for exactly one standalone image."
                ].join(" ")
              },
              { role: "user", content: rr || "Generate the requested image." }
            ],
            stream: !1,
            response_format: { type: "json_object" }
          },
          p0.signal
        );
        if (p0.signal.aborted) return;
        const nt = (pt = (j0 = (Xe = f0.choices) == null ? void 0 : Xe[0]) == null ? void 0 : j0.message) == null ? void 0 : pt.content, ar = b1(nt);
        at = ar.length ? ar : at, console.info("[image-planner]", {
          raw: nt,
          parsedCount: ar.length,
          parsedShots: ar,
          finalCount: at.length,
          finalShots: at
        });
        const Wl = {
          input_tokens: ((tr = f0.usage) == null ? void 0 : tr.prompt_tokens) || ((qe = f0.usage) == null ? void 0 : qe.input_tokens) || 0,
          output_tokens: ((Ke = f0.usage) == null ? void 0 : Ke.completion_tokens) || ((ft = f0.usage) == null ? void 0 : ft.output_tokens) || 0,
          model: f0.model || ei,
          cost: ((on = f0.usage) == null ? void 0 : on.cost) || 0
        }, Gl = at.map((Le) => new Promise((U0, hn) => {
          let ir = "", mn = !1;
          const pn = () => {
            mn || !ir.trim() || (I0 = g1(I0, ir), S(I0), mn = !0);
          };
          Xn(
            _,
            {
              ...un,
              messages: x1(T, Le).map((g0) => ({
                role: g0.role,
                // user message 可能含 blob URL（参考图被前端转过），上游需要原 base64，
                // 调 toChatMessageContent 之前先反转。assistant message 在 stripImageMarkdown
                // 时图片已被剥掉，反转一次也无害（幂等）。
                content: li(g0.role, ma(g0.content, rt.current))
              })),
              n: 1
            },
            {
              onData: (g0) => {
                ir += ha(g0, rt.current), pa(ir) && pn();
              },
              onReasoning: (g0) => {
                Rt += g0, A(Rt);
              },
              onDone: (g0) => {
                pn(), U0(g0);
              },
              onError: (g0) => hn(new Error(g0))
            },
            p0.signal
          ).catch(hn);
        })), Yr = await Promise.allSettled(Gl);
        if (p0.signal.aborted) return;
        const dn = Yr.flatMap((Le) => Le.status === "fulfilled" ? [Le.value] : []), nr = Yr.length - dn.length;
        if (nr && !I0) {
          const Le = Yr.find((U0) => U0.status === "rejected");
          throw (Le == null ? void 0 : Le.status) === "rejected" && Le.reason instanceof Error ? Le.reason : new Error("stream failed");
        }
        const _l = dn.reduce((Le, U0) => ({
          input_tokens: Le.input_tokens + U0.input_tokens,
          output_tokens: Le.output_tokens + U0.output_tokens,
          model: U0.model || Le.model,
          cost: Le.cost + U0.cost
        }), Wl);
        await cn(_l), nr && We.current === v && ne(`${nr} image${nr === 1 ? "" : "s"} failed to generate`);
        return;
      }
      await Xn(
        _,
        {
          ...un
        },
        {
          onData: (Oe) => {
            I0 += ha(Oe, rt.current), S(I0);
          },
          onReasoning: (Oe) => {
            Rt += Oe, A(Rt);
          },
          onDone: cn,
          onError: (Oe) => {
            We.current === v && (ne(Oe), ge(fe)), D(!1), S(""), A(""), b(null), l0.current = null;
          }
        },
        p0.signal
      );
    } catch (p0) {
      We.current === v && (ne(p0 instanceof Error ? p0.message : "stream failed"), ge(fe)), D(!1), S(""), A(""), b(null), l0.current = null;
    }
  }, [Fe, r]), _r = le(async () => {
    if (!O.trim() && P.length === 0 || z || !i) return;
    ht.current = !0;
    const v = ni(O, P), T = y0();
    let B = i;
    const L = [...u, {
      id: Date.now(),
      conversation_id: i,
      role: "user",
      content: v,
      reasoning_effort: Bt ? Fe : void 0,
      platform: ve,
      model: me,
      group_id: T,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    $(""), G([]), d0.current && (d0.current.style.height = "24px"), Yt.current && (Yt.current.value = ""), ne(""), ge(null), Je(L), D(!0), b(B), l0.current = { conversationId: B, model: me }, S(""), A("");
    try {
      if (!ve || !me)
        throw new Error("Model required");
      if (B === _e) {
        const _ = await s0.createConversation({
          title: "",
          group_id: T,
          platform: ve,
          model: me
        });
        B = _.id, We.current === _e && (We.current = _.id, Kt.current = _.id, o(_.id), Je((Z) => Z.map((ae) => ({ ...ae, conversation_id: _.id })))), t((Z) => [_, ...Z.filter((ae) => ae.id !== _e)]);
      }
      await s0.persistMessage({
        conversation_id: B,
        role: "user",
        content: v,
        reasoning_effort: Bt ? Fe : void 0,
        platform: ve,
        model: me,
        group_id: T
      }), await _0({
        conversationID: B,
        requestMessages: L.map((_) => ({ ..._, conversation_id: B })),
        model: me,
        groupID: T,
        platform: ve,
        isImageRequest: h0,
        imageSize: h0 ? B0 : void 0,
        supportsReasoning: Bt,
        reasoningEffort: Fe,
        titleContent: v
      });
    } catch (_) {
      We.current === B && ne(_ instanceof Error ? _.message : "stream failed"), D(!1), S(""), A(""), b(null), l0.current = null;
    }
  }, [i, O, z, u, P, Fe, y0, B0, ve, me, h0, Bt, _0]), Zt = le(async (v) => {
    if (v.length)
      try {
        const T = await d1(v);
        if (!T.length) return;
        G((B) => [...B, ...T]), ne(""), ge(null);
      } catch (T) {
        ge(null), ne(T instanceof Error ? T.message : "Failed to read image");
      }
  }, []), en = le(async (v) => {
    if (v)
      try {
        const T = await gl(v);
        V(T), ie(!0), Q(null), ce(null), Ee(null), ne(""), ge(null);
      } catch (T) {
        ge(null), ne(T instanceof Error ? T.message : "Failed to read image");
      }
  }, []), Ml = le(async (v) => {
    await Zt(Array.from(v.target.files || [])), v.target.value = "";
  }, [Zt]), Tl = le(async (v) => {
    var T;
    await en((T = v.target.files) == null ? void 0 : T[0]), v.target.value = "";
  }, [en]), Al = le(async (v, T, B, L) => {
    if (!z)
      try {
        const _ = await h1(v, T);
        if (!h0) {
          const ae = (B ? de.find((he) => he.id === B && (!L || he.platform === L) && qt(he)) : void 0) || de.find(qt);
          if (ae)
            z0(st(ae));
          else {
            ne(r("playground.no_image_model_available", {
              defaultValue: "No image model available — pick one to edit this image."
            }));
            return;
          }
        }
        V(_), ie(!0), Q(null), ce(null), Ee(null), ne(""), ge(null), ht.current = !0;
      } catch (_) {
        ne(_ instanceof Error ? _.message : "Failed to load image");
      }
  }, [z, de, h0, r]), jr = le(() => {
    var v;
    (v = Ja.current) == null || v.click();
  }, []), zl = le(() => {
    Q(null), ce(null), tt.current = null;
  }, []), It = le(() => {
    ie(!1), V(null), Q(null), ce(null), Ee(null), tt.current = null;
  }, []);
  Qe(() => {
    if (!Y) return;
    const v = (T) => {
      T.key === "Escape" && It();
    };
    return window.addEventListener("keydown", v), () => window.removeEventListener("keydown", v);
  }, [Y, It]);
  const mt = le((v) => {
    const T = Ct.current;
    if (!T) return null;
    const B = T.getBoundingClientRect(), L = T.width / B.width, _ = T.height / B.height;
    return {
      x: ti((v.clientX - B.left) * L, 0, T.width),
      y: ti((v.clientY - B.top) * _, 0, T.height)
    };
  }, []), Cl = le((v) => {
    v.preventDefault();
    const T = mt(v);
    T && (tt.current = T, Q(null), ce({ x: T.x, y: T.y, width: 0, height: 0 }), v.currentTarget.setPointerCapture(v.pointerId));
  }, [mt]), Bl = le((v) => {
    const T = tt.current;
    if (!T) return;
    v.preventDefault();
    const B = mt(v);
    B && ce(ri(T, B));
  }, [mt]), tn = le((v) => {
    const T = tt.current, B = mt(v), L = T && B ? ri(T, B) : ze;
    tt.current = null, ce(null), Q(t1(L) ? L : null), v.currentTarget.hasPointerCapture(v.pointerId) && v.currentTarget.releasePointerCapture(v.pointerId);
  }, [ze, mt]), rn = le(async () => {
    const v = Ct.current;
    if (!v || !W || !J) throw new Error("Selection required");
    const T = await ai(W.url), B = document.createElement("canvas");
    B.width = T.naturalWidth, B.height = T.naturalHeight;
    const L = B.getContext("2d");
    if (!L) throw new Error("Failed to create mask");
    const _ = T.naturalWidth / v.width, Z = T.naturalHeight / v.height;
    return L.fillStyle = "#fff", L.fillRect(0, 0, B.width, B.height), L.clearRect(
      Math.floor(J.x * _),
      Math.floor(J.y * Z),
      Math.ceil(J.width * _),
      Math.ceil(J.height * Z)
    ), c1(B);
  }, [J, W]), Jt = le(async () => {
    if (!i || z || re) return;
    if (ht.current = !0, !ve || !me) {
      ge(null), ne(r("playground.select_model_first"));
      return;
    }
    if (!h0) {
      ge(null), ne(r("playground.select_image_model_first"));
      return;
    }
    if (!W) {
      ge(null), ne(r("playground.choose_source_image_first"));
      return;
    }
    const v = O.trim();
    if (!v) {
      ge(null), ne(r("playground.describe_image_change_first"));
      return;
    }
    const T = y0();
    let B = i;
    const L = Ct.current, _ = L && J ? {
      imageIndex: 0,
      rect: {
        x: J.x / L.width,
        y: J.y / L.height,
        width: J.width / L.width,
        height: J.height / L.height
      }
    } : null, Z = ni(v, [W], _ ? [_] : []), ae = {
      id: Date.now(),
      conversation_id: i,
      role: "user",
      content: Z,
      platform: ve,
      model: me,
      group_id: T,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    $(""), d0.current && (d0.current.style.height = "24px"), ne(""), ge(null), Je((he) => [...he, ae]), D(!0), U(!0), b(B), l0.current = { conversationId: B, model: me }, S(""), A("");
    try {
      if (B === _e) {
        const qe = await s0.createConversation({
          title: "",
          group_id: T,
          platform: ve,
          model: me
        });
        B = qe.id, We.current === _e && (We.current = qe.id, Kt.current = qe.id, o(qe.id), Je((Ke) => Ke.map((ft) => ({ ...ft, conversation_id: qe.id })))), b(qe.id), l0.current = { conversationId: qe.id, model: me }, t((Ke) => [qe, ...Ke.filter((ft) => ft.id !== _e)]);
      }
      const he = await s0.persistMessage({
        conversation_id: B,
        role: "user",
        content: Z,
        platform: ve,
        model: me,
        group_id: T
      });
      We.current === B && Je((qe) => qe.map((Ke) => Ke.id === ae.id ? he : Ke));
      const Re = new AbortController();
      W0.current = Re;
      const m0 = J ? await rn() : null;
      if (Re.signal.aborted) return;
      const fe = new FormData();
      fe.append("model", me), fe.append("prompt", v), fe.append("image", W.file, W.name || "image.png"), m0 && fe.append("mask", m0, "mask.png"), B0 && fe.append("size", B0);
      const Xe = await jo(ve, fe, Re.signal);
      if (Re.signal.aborted) return;
      const j0 = p1(Xe, "edited-image");
      if (!j0) throw new Error("No image returned");
      const pt = f1(Xe), tr = await s0.persistMessage({
        conversation_id: B,
        role: "assistant",
        content: j0,
        platform: ve,
        model: Xe.model || me,
        group_id: T,
        input_tokens: pt.input_tokens,
        output_tokens: pt.output_tokens,
        cost: pt.cost
      });
      We.current === B && Je((qe) => [...qe, tr]), t((qe) => qe.map(
        (Ke) => Ke.id === B && !Ke.title ? { ...Ke, title: ii(Z), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : Ke
      )), V(null), ie(!1), Q(null), ce(null), Ee(null);
    } catch (he) {
      if (he instanceof DOMException && he.name === "AbortError") return;
      We.current === B && ne(he instanceof Error ? he.message : "image edit failed");
    } finally {
      D(!1), U(!1), S(""), A(""), b(null), l0.current = null;
    }
  }, [i, rn, J, W, O, re, z, y0, B0, me, h0, ve, r]), Il = le((v) => {
    const T = Array.from(v.clipboardData.items).filter((B) => B.kind === "file" && B.type.startsWith("image/")).map((B) => B.getAsFile()).filter((B) => !!B);
    T.length && Zt(T);
  }, [Zt]), El = le((v) => {
    G((T) => T.filter((B) => B.id !== v));
  }, []), an = le(() => {
    var T;
    ht.current = !0, (T = W0.current) == null || T.abort();
    const v = l0.current;
    if (w || k) {
      const B = v == null ? void 0 : v.conversationId;
      B && We.current === B && Je((L) => [...L, {
        id: Date.now() + 1,
        conversation_id: B,
        role: "assistant",
        content: w,
        reasoning: k,
        platform: "",
        model: v.model,
        group_id: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    }
    S(""), A(""), b(null), l0.current = null, U(!1), D(!1);
  }, [w, k]), x0 = e.find((v) => v.id === i), Ur = u[u.length - 1], Et = ze || J, Vr = !!(Y && W && O.trim() && ve && me && h0), Rl = !!(i && i !== _e && (Ur == null ? void 0 : Ur.role) === "user" && !b0 && !z), De = z && p === i, nn = !!((Y ? Vr : O.trim() || P.length > 0) && ve && me) && !z && !re, ln = le((v) => {
    if (v.key === "Enter" && !v.shiftKey) {
      if (v.preventDefault(), !ve || !me) {
        ge(null), ne(r("playground.select_model_first"));
        return;
      }
      if (Y) {
        Jt();
        return;
      }
      _r();
    }
  }, [Y, me, ve, _r, Jt, r]), Dl = le(() => {
    var v;
    (v = Yt.current) == null || v.click();
  }, []), ql = le((v) => {
    v.style.height = "auto", v.style.height = Math.min(v.scrollHeight, 200) + "px";
  }, []), Ol = le((v) => {
    o(v), ne(""), ge(null), ee && $0(!1);
  }, [ee]), Ll = le(() => {
    if (!F0 || z || i !== F0.conversationID) return;
    const v = F0;
    ne(""), ge(null), _0({
      ...v,
      requestMessages: v.requestMessages.map((T) => ({ ...T }))
    });
  }, [i, z, F0, _0]), Hl = le(() => {
    if (z || !i || i === _e) return;
    const v = u[u.length - 1];
    if ((v == null ? void 0 : v.role) !== "user") return;
    const T = v.model || (x0 == null ? void 0 : x0.model) || me, B = v.platform || (x0 == null ? void 0 : x0.platform) || ve;
    if (!T || !B) {
      ne("Model required");
      return;
    }
    const L = de.find((ae) => ae.id === T && ae.platform === B) || de.find((ae) => ae.id === T), _ = qt(L) || vl(T), Z = ga(L) || !!v.reasoning_effort;
    ne(""), ge(null), _0({
      conversationID: i,
      requestMessages: u.map((ae) => ({ ...ae })),
      model: T,
      groupID: v.group_id || (x0 == null ? void 0 : x0.group_id) || y0(),
      platform: B,
      isImageRequest: _,
      imageSize: _ ? B0 : void 0,
      supportsReasoning: Z,
      reasoningEffort: v.reasoning_effort || Fe
    });
  }, [x0, i, z, u, de, Fe, y0, B0, me, ve, _0]), Nl = le((v, T) => {
    Ne({ url: v, alt: T });
  }, []), Fl = le((v, T) => {
    o1(v, T).then(() => P0(r("playground.download_started"))).catch(() => P0(r("playground.download_failed")));
  }, [r]), Pl = le((v) => {
    if (z || !i || i === _e) return;
    const T = u.slice(0, v).map((Re) => Re.role).lastIndexOf("user");
    if (T < 0) {
      ge(null), ne(r("playground.no_image_prompt"));
      return;
    }
    const B = u.slice(0, T + 1), L = u[T], _ = u[v], Z = _.model || me, ae = _.platform || L.platform || ve, he = de.find((Re) => Re.id === Z && Re.platform === ae) || de.find((Re) => Re.id === Z);
    _0({
      conversationID: i,
      requestMessages: B,
      model: Z,
      groupID: _.group_id || L.group_id || y0(),
      platform: ae,
      isImageRequest: !0,
      imageSize: B0,
      supportsReasoning: ga(he)
    });
  }, [i, z, u, de, y0, B0, ve, me, _0, r]), $l = le((v) => {
    u1(v).then(() => P0("Message copied")).catch(() => P0("Copy failed"));
  }, []), Qt = {
    onImagePreview: Nl,
    imagePreviewTitle: r("playground.preview_image"),
    generatedImageAlt: r("playground.generated_image"),
    isMobile: ee
  }, er = (v, T = "Copy message", B = !1, L = {}) => /* @__PURE__ */ M(
    "button",
    {
      type: "button",
      style: { ...x.messageCopyBtn, ...L },
      title: T,
      "aria-label": T,
      onClick: (_) => {
        B && (_.preventDefault(), _.stopPropagation()), $l(v);
      },
      children: /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ M("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
        /* @__PURE__ */ M("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
      ] })
    }
  ), sn = (v, T) => {
    const B = ee || _t === v, L = a1(T), Z = s1(T) ? /* @__PURE__ */ M("span", { style: {
      ...x.messageCopyAfterText,
      ...B ? x.messageCopyAfterTextVisible : null
    }, children: er(L, "Copy message", !1, x.messageCopyAfterTextBtn) }) : void 0;
    return /* @__PURE__ */ M(
      "div",
      {
        style: x.messageContent,
        onMouseEnter: () => C0(v),
        onMouseLeave: () => C0((ae) => ae === v ? null : ae),
        onFocus: () => C0(v),
        onBlur: (ae) => {
          ae.currentTarget.contains(ae.relatedTarget) || C0((he) => he === v ? null : he);
        },
        children: fr(T, {
          ...Qt,
          trailingInlineAction: Z
        })
      }
    );
  };
  return /* @__PURE__ */ N("div", { "data-full-bleed": !0, "data-pg-aesthetic": !0, style: x.layout, children: [
    jt && ee && /* @__PURE__ */ M(
      "div",
      {
        style: x.sidebarBackdrop,
        onClick: () => $0(!1)
      }
    ),
    He && /* @__PURE__ */ M(
      "div",
      {
        style: x.imagePreviewOverlay,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": He.alt || r("playground.image_preview"),
        onClick: () => Ne(null),
        children: /* @__PURE__ */ N("div", { style: x.imagePreviewModal, onClick: (v) => v.stopPropagation(), children: [
          /* @__PURE__ */ M("img", { src: He.url, alt: He.alt, style: x.imagePreviewLarge }),
          /* @__PURE__ */ M(
            "button",
            {
              type: "button",
              style: x.imagePreviewCloseBtn,
              onClick: () => Ne(null),
              "aria-label": r("playground.close_image_preview"),
              children: "×"
            }
          )
        ] })
      }
    ),
    h0 && Y && /* @__PURE__ */ M(
      "div",
      {
        style: x.editModalOverlay,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": r("playground.edit_image_region"),
        onClick: It,
        children: /* @__PURE__ */ N(
          "div",
          {
            style: { ...x.editModalCard, ...ee ? x.editModalCardMobile : null },
            onClick: (v) => v.stopPropagation(),
            children: [
              /* @__PURE__ */ N("div", { style: x.editModalHeader, children: [
                /* @__PURE__ */ N("div", { style: x.imageEditTitleWrap, children: [
                  /* @__PURE__ */ M("span", { style: x.imageEditTitle, children: r("playground.edit_image_region") }),
                  /* @__PURE__ */ M("span", { style: x.imageEditSubtitle, children: W ? r("playground.edit_image_modal_hint", { defaultValue: "Drag a region for localized edits, or just describe the change for a full-image edit." }) : r("playground.choose_source_image_region_hint") })
                ] }),
                /* @__PURE__ */ N("div", { style: x.imageEditHeaderActions, children: [
                  /* @__PURE__ */ M(
                    "button",
                    {
                      type: "button",
                      style: x.imageEditGhostBtn,
                      onClick: jr,
                      disabled: De,
                      children: r(W ? "playground.replace_source" : "playground.choose_source")
                    }
                  ),
                  /* @__PURE__ */ M(
                    "button",
                    {
                      type: "button",
                      style: x.imageEditIconBtn,
                      onClick: It,
                      "aria-label": r("playground.close_image_preview", { defaultValue: "Close" }),
                      children: "×"
                    }
                  )
                ] })
              ] }),
              W ? /* @__PURE__ */ N("div", { style: { ...x.editModalBody, ...ee ? x.editModalBodyMobile : null }, children: [
                /* @__PURE__ */ M("div", { ref: Xt, style: x.editModalStageWrap, children: /* @__PURE__ */ N("div", { style: {
                  ...x.imageEditStage,
                  ...Ce ? { width: Ce.width, height: Ce.height } : null
                }, children: [
                  /* @__PURE__ */ M("img", { src: W.url, alt: W.name, style: x.imageEditSource, draggable: !1 }),
                  Et && /* @__PURE__ */ M(
                    "div",
                    {
                      style: {
                        ...x.imageEditSelection,
                        left: Et.x,
                        top: Et.y,
                        width: Et.width,
                        height: Et.height
                      }
                    }
                  ),
                  /* @__PURE__ */ M(
                    "canvas",
                    {
                      ref: Ct,
                      style: x.imageEditCanvas,
                      onPointerDown: Cl,
                      onPointerMove: Bl,
                      onPointerUp: tn,
                      onPointerCancel: tn,
                      "aria-label": "Box-select image edit region"
                    }
                  )
                ] }) }),
                /* @__PURE__ */ N("div", { style: x.editModalSide, children: [
                  /* @__PURE__ */ M("div", { style: x.imageEditBadge, children: r(J ? "playground.region_selected" : "playground.drag_to_select") }),
                  /* @__PURE__ */ M("div", { style: x.imageEditFilename, children: W.name }),
                  /* @__PURE__ */ M(
                    "button",
                    {
                      type: "button",
                      style: { ...x.imageEditGhostBtn, opacity: J ? 1 : 0.5 },
                      onClick: zl,
                      disabled: !J || De,
                      children: r("playground.clear_selection")
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ M(
                "button",
                {
                  type: "button",
                  style: x.imageEditEmptyBtn,
                  onClick: jr,
                  disabled: De,
                  children: r("playground.choose_source_image_for_regional_editing")
                }
              ),
              /* @__PURE__ */ N("div", { style: x.editModalFooter, children: [
                De && /* @__PURE__ */ N("div", { style: x.editModalStatus, children: [
                  /* @__PURE__ */ M("span", { style: x.streamingDot }),
                  /* @__PURE__ */ M("span", { children: r("playground.edit_modal_generating_bg", { defaultValue: "Generating edit — this can take 10–30 seconds. You can close this dialog; the result will appear in chat when ready." }) })
                ] }),
                b0 && !De && /* @__PURE__ */ N("div", { style: x.editModalError, children: [
                  /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ M("circle", { cx: "12", cy: "12", r: "10" }),
                    /* @__PURE__ */ M("path", { d: "M12 8v4m0 4h.01" })
                  ] }),
                  /* @__PURE__ */ M("span", { children: b0 })
                ] }),
                /* @__PURE__ */ M(
                  "textarea",
                  {
                    style: x.editModalPrompt,
                    value: O,
                    onChange: (v) => $(v.target.value),
                    onKeyDown: ln,
                    placeholder: r("playground.edit_prompt_placeholder", { defaultValue: 'Describe the change you want — e.g. "make the sky overcast" or "remove the person on the left".' }),
                    rows: 3,
                    disabled: De,
                    autoFocus: !0
                  }
                ),
                /* @__PURE__ */ N("div", { style: x.editModalActions, children: [
                  /* @__PURE__ */ M("span", { style: x.editModalHint, children: J ? r("playground.edit_modal_region_hint", { defaultValue: "Region edit · only the selected area will change" }) : r("playground.edit_modal_full_hint", { defaultValue: "Full-image edit · drag a region above for localized edits" }) }),
                  /* @__PURE__ */ N("div", { style: x.editModalBtnGroup, children: [
                    /* @__PURE__ */ M(
                      "button",
                      {
                        type: "button",
                        style: x.imageEditGhostBtn,
                        onClick: It,
                        children: De ? r("playground.edit_modal_run_in_background", { defaultValue: "Run in background" }) : r("playground.cancel", { defaultValue: "Cancel" })
                      }
                    ),
                    De ? /* @__PURE__ */ N(
                      "button",
                      {
                        type: "button",
                        style: x.editModalSubmitBtn,
                        onClick: an,
                        children: [
                          /* @__PURE__ */ M("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ M("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
                          r("playground.stop")
                        ]
                      }
                    ) : /* @__PURE__ */ N(
                      "button",
                      {
                        type: "button",
                        style: { ...x.editModalSubmitBtn, opacity: Vr ? 1 : 0.4 },
                        onClick: () => void Jt(),
                        disabled: !Vr,
                        children: [
                          /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                            /* @__PURE__ */ M("path", { d: "M22 2L11 13" }),
                            /* @__PURE__ */ M("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                          ] }),
                          r("playground.edit_modal_submit", { defaultValue: "Generate edit" })
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ]
          }
        )
      }
    ),
    jt ? /* @__PURE__ */ N("div", { style: { ...x.sidebar, ...ee ? x.sidebarMobile : null }, children: [
      /* @__PURE__ */ N("div", { style: x.sidebarHeader, children: [
        /* @__PURE__ */ N("div", { style: x.sidebarTitleGroup, children: [
          /* @__PURE__ */ M("button", { style: x.toggleBtn, onClick: () => $0(!1), "aria-label": "Collapse conversations", children: /* @__PURE__ */ N("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: [
            /* @__PURE__ */ M("path", { d: "M6 2v12" }),
            /* @__PURE__ */ M("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ M("path", { d: "M10 6l-2 2 2 2" })
          ] }) }),
          /* @__PURE__ */ M("span", { style: x.sidebarTitle, children: r("playground.conversations") })
        ] }),
        /* @__PURE__ */ M(
          "button",
          {
            style: x.newBtn,
            onClick: Qa,
            title: r("playground.new_conversation"),
            "aria-label": r("playground.new_conversation"),
            children: /* @__PURE__ */ M("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", children: /* @__PURE__ */ M("path", { d: "M7 1v12M1 7h12" }) })
          }
        )
      ] }),
      Kn,
      /* @__PURE__ */ N("div", { style: x.convList, children: [
        e.map((v) => {
          const T = v.id === i;
          return /* @__PURE__ */ N(
            "div",
            {
              className: `pg-conv-item${T ? " is-active" : ""}`,
              style: {
                ...x.convItem,
                background: T ? m("bgHover") : "transparent"
              },
              onClick: () => Ol(v.id),
              children: [
                /* @__PURE__ */ M("span", { style: {
                  ...x.convTitle,
                  color: m(T ? "text" : "textSecondary"),
                  fontWeight: T ? 500 : 400
                }, children: v.title || r("playground.new_conversation") }),
                /* @__PURE__ */ M(
                  "button",
                  {
                    type: "button",
                    className: "pg-conv-delete",
                    style: x.deleteBtn,
                    onClick: (B) => {
                      B.stopPropagation(), kl(v.id);
                    },
                    title: r("playground.delete_conversation"),
                    "aria-label": r("playground.delete_conversation"),
                    children: /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                      /* @__PURE__ */ M("path", { d: "M3 6h18" }),
                      /* @__PURE__ */ M("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
                      /* @__PURE__ */ M("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
                      /* @__PURE__ */ M("path", { d: "M10 11v6" }),
                      /* @__PURE__ */ M("path", { d: "M14 11v6" })
                    ] })
                  }
                )
              ]
            },
            v.id
          );
        }),
        e.length === 0 && /* @__PURE__ */ M("div", { style: x.emptyConvList, children: /* @__PURE__ */ M("span", { children: r("playground.no_conversations") }) })
      ] }),
      c0 && /* @__PURE__ */ N("div", { style: x.balanceBar, children: [
        /* @__PURE__ */ M("span", { style: x.balanceLabel, children: r("playground.balance") }),
        /* @__PURE__ */ N("span", { style: x.balanceValue, children: [
          "$",
          c0.balance.toFixed(4)
        ] })
      ] })
    ] }) : /* @__PURE__ */ N("div", { style: { ...x.sidebarRail, ...ee ? x.sidebarRailMobile : null }, children: [
      /* @__PURE__ */ M("button", { style: x.toggleBtn, onClick: () => $0(!0), "aria-label": "Expand conversations", children: /* @__PURE__ */ N("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: [
        /* @__PURE__ */ M("path", { d: "M6 2v12" }),
        /* @__PURE__ */ M("path", { d: "M2 2h12v12H2z" }),
        /* @__PURE__ */ M("path", { d: "M8 6l2 2-2 2" })
      ] }) }),
      Kn
    ] }),
    /* @__PURE__ */ N("div", { style: x.main, children: [
      /* @__PURE__ */ N("div", { style: x.messagesArea, children: [
        !i && /* @__PURE__ */ N("div", { style: { ...x.emptyState, ...ee ? x.emptyStateMobile : null }, children: [
          /* @__PURE__ */ M("div", { style: x.emptyTitle, children: r("playground.empty_title") }),
          /* @__PURE__ */ M("div", { style: x.emptyDesc, children: r("playground.empty_description") }),
          /* @__PURE__ */ M("button", { style: x.emptyBtn, onClick: Qa, children: r("playground.new_conversation") })
        ] }),
        i && u.map((v, T) => {
          const B = v.role === "user";
          return /* @__PURE__ */ M(
            "div",
            {
              style: {
                ...x.messageRow,
                ...ee ? x.messageRowMobile : null,
                ...B ? x.messageRowUser : x.messageRowAssistant
              },
              children: /* @__PURE__ */ N("div", { style: B ? { ...x.userBubble, ...ee ? x.userBubbleMobile : null } : x.assistantBlock, children: [
                !B && v.reasoning && /* @__PURE__ */ N("details", { style: x.reasoningBox, open: !0, children: [
                  /* @__PURE__ */ N("summary", { style: x.reasoningSummary, children: [
                    /* @__PURE__ */ M("span", { children: "Thinking" }),
                    er(v.reasoning, "Copy thinking", !0)
                  ] }),
                  /* @__PURE__ */ M("div", { style: x.reasoningContent, children: fr(v.reasoning, Qt) })
                ] }),
                sn(`message-${v.id}`, v.content),
                !B && (pa(v.content) || v.model) && (() => {
                  const L = l1(v.content);
                  return /* @__PURE__ */ N("div", { style: pa(v.content) ? x.imageMessageActions : x.messageMeta, children: [
                    L && /* @__PURE__ */ M(
                      "button",
                      {
                        type: "button",
                        style: x.imageDownloadBtn,
                        title: r("playground.download_image"),
                        "aria-label": r("playground.download_image"),
                        onClick: () => Fl(L.url, L.alt || r("playground.generated_image")),
                        children: /* @__PURE__ */ N("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                          /* @__PURE__ */ M("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                          /* @__PURE__ */ M("path", { d: "M7 10l5 5 5-5" }),
                          /* @__PURE__ */ M("path", { d: "M12 15V3" })
                        ] })
                      }
                    ),
                    L && /* @__PURE__ */ M(
                      "button",
                      {
                        type: "button",
                        style: { ...x.regenerateImageBtn, opacity: z ? 0.5 : 1 },
                        onClick: () => Al(L.url, L.alt || r("playground.generated_image"), v.model, v.platform),
                        disabled: z,
                        title: r("playground.edit_generated_image", { defaultValue: "Edit this image" }),
                        "aria-label": r("playground.edit_generated_image", { defaultValue: "Edit this image" }),
                        children: /* @__PURE__ */ N("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                          /* @__PURE__ */ M("path", { d: "M12 20h9" }),
                          /* @__PURE__ */ M("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
                        ] })
                      }
                    ),
                    L && /* @__PURE__ */ M(
                      "button",
                      {
                        type: "button",
                        style: { ...x.regenerateImageBtn, opacity: z ? 0.5 : 1 },
                        onClick: () => Pl(T),
                        disabled: z,
                        title: r("playground.retry_image"),
                        "aria-label": r("playground.retry_image"),
                        children: /* @__PURE__ */ N("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                          /* @__PURE__ */ M("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                          /* @__PURE__ */ M("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                          /* @__PURE__ */ M("path", { d: "M19 2v4h-4" }),
                          /* @__PURE__ */ M("path", { d: "M5 22v-4h4" })
                        ] })
                      }
                    ),
                    v.model && /* @__PURE__ */ M("span", { style: x.metaBadge, children: v.model })
                  ] });
                })()
              ] })
            },
            v.id
          );
        }),
        De && w && /* @__PURE__ */ M("div", { style: {
          ...x.messageRow,
          ...ee ? x.messageRowMobile : null,
          ...x.messageRowAssistant
        }, children: /* @__PURE__ */ N("div", { style: x.assistantBlock, children: [
          k && /* @__PURE__ */ N("details", { style: x.reasoningBox, open: !0, children: [
            /* @__PURE__ */ N("summary", { style: x.reasoningSummary, children: [
              /* @__PURE__ */ M("span", { children: "Thinking" }),
              er(k, "Copy thinking", !0)
            ] }),
            /* @__PURE__ */ M("div", { style: x.reasoningContent, children: fr(k, Qt) })
          ] }),
          sn(`stream-${p || "active"}`, w),
          /* @__PURE__ */ N("div", { style: x.messageMeta, children: [
            /* @__PURE__ */ M("span", { style: x.streamingDot }),
            /* @__PURE__ */ M("span", { children: r("playground.streaming") })
          ] })
        ] }) }),
        De && !w && /* @__PURE__ */ M("div", { style: {
          ...x.messageRow,
          ...ee ? x.messageRowMobile : null,
          ...x.messageRowAssistant
        }, children: /* @__PURE__ */ M("div", { style: x.assistantBlock, children: k ? /* @__PURE__ */ N("details", { style: x.reasoningBox, open: !0, children: [
          /* @__PURE__ */ N("summary", { style: x.reasoningSummary, children: [
            /* @__PURE__ */ M("span", { children: "Thinking" }),
            er(k, "Copy thinking", !0)
          ] }),
          /* @__PURE__ */ M("div", { style: x.reasoningContent, children: fr(k, Qt) })
        ] }) : /* @__PURE__ */ M("div", { style: { ...x.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ M("span", { style: x.thinkingDots, children: r("playground.thinking") }) }) }) }),
        Rl && /* @__PURE__ */ N("div", { style: { ...x.errorBar, ...x.recoverableBar, ...ee ? x.errorBarMobile : null }, children: [
          /* @__PURE__ */ N("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ M("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ M("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ M("span", { style: x.errorMessage, children: r("playground.response_unfinished", { defaultValue: "Response was interrupted before the assistant replied." }) }),
          /* @__PURE__ */ N(
            "button",
            {
              type: "button",
              style: x.recoverableRetryBtn,
              onClick: Hl,
              title: r("playground.regenerate"),
              "aria-label": r("playground.regenerate"),
              children: [
                /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ M("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ M("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ M("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ M("path", { d: "M5 22v-4h4" })
                ] }),
                r("playground.regenerate")
              ]
            }
          )
        ] }),
        b0 && /* @__PURE__ */ N("div", { style: { ...x.errorBar, ...ee ? x.errorBarMobile : null }, children: [
          /* @__PURE__ */ N("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ M("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ M("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ M("span", { style: x.errorMessage, children: b0 }),
          F0 && F0.conversationID === i && !z && /* @__PURE__ */ N(
            "button",
            {
              type: "button",
              style: x.errorRetryBtn,
              onClick: Ll,
              title: r("playground.regenerate"),
              "aria-label": r("playground.regenerate"),
              children: [
                /* @__PURE__ */ N("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ M("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ M("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ M("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ M("path", { d: "M5 22v-4h4" })
                ] }),
                r("playground.regenerate")
              ]
            }
          )
        ] }),
        dt && /* @__PURE__ */ M("div", { style: x.interactionNotice, children: dt }),
        /* @__PURE__ */ M("div", { ref: Vt })
      ] }),
      i && /* @__PURE__ */ M("div", { style: { ...x.inputArea, ...ee ? x.inputAreaMobile : null }, children: /* @__PURE__ */ N("div", { style: {
        ...x.inputWrapper,
        ...ee ? x.inputWrapperMobile : null,
        ...De ? x.inputWrapperStreaming : null
      }, children: [
        P.length > 0 && /* @__PURE__ */ M("div", { style: x.imagePreviewList, children: P.map((v) => /* @__PURE__ */ N("div", { style: x.imagePreviewItem, children: [
          /* @__PURE__ */ M("img", { src: v.url, alt: v.name, style: x.imagePreview }),
          /* @__PURE__ */ M(
            "button",
            {
              type: "button",
              style: x.removeImageBtn,
              onClick: () => El(v.id),
              "aria-label": `Remove ${v.name}`,
              children: "×"
            }
          )
        ] }, v.id)) }),
        /* @__PURE__ */ M(
          "textarea",
          {
            ref: d0,
            style: x.textarea,
            value: O,
            onChange: (v) => {
              $(v.target.value), ql(v.target);
            },
            onPaste: Il,
            onKeyDown: ln,
            placeholder: r("playground.input_placeholder"),
            rows: 1,
            disabled: De
          }
        ),
        /* @__PURE__ */ M(
          "input",
          {
            ref: Yt,
            type: "file",
            accept: "image/*",
            multiple: !0,
            style: x.fileInput,
            onChange: Ml,
            disabled: De
          }
        ),
        /* @__PURE__ */ M(
          "input",
          {
            ref: Ja,
            type: "file",
            accept: "image/*",
            style: x.fileInput,
            onChange: Tl,
            disabled: De
          }
        ),
        /* @__PURE__ */ N("div", { style: { ...x.inputActions, ...ee ? x.inputActionsMobile : null }, children: [
          /* @__PURE__ */ N("div", { style: { ...x.selectors, ...ee ? x.selectorsMobile : null }, children: [
            Gr({
              id: "model",
              value: ke,
              options: Sl,
              onChange: z0,
              ariaLabel: r("playground.model"),
              variant: "model"
            }),
            h0 && /* @__PURE__ */ N("div", { style: { ...x.imageSizeInlineControls, ...ee ? x.imageSizeInlineControlsMobile : null }, children: [
              Gr({
                id: "image-size",
                value: v0.value,
                options: Zo,
                onChange: (v) => xl({ value: v }),
                ariaLabel: "Image size"
              }),
              !ee && v0.value === Wr && /* @__PURE__ */ M("span", { style: x.imageSizeInlinePreview, children: "upstream default" })
            ] }),
            Bt && Gr({
              id: "reasoning-effort",
              value: Fe,
              options: [
                { value: "minimal", label: "Minimal" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "xhigh", label: "XHigh" }
              ],
              onChange: (v) => $t(v),
              ariaLabel: "Reasoning effort"
            })
          ] }),
          /* @__PURE__ */ N("div", { style: { ...x.inputButtonGroup, ...ee ? x.inputButtonGroupMobile : null }, children: [
            h0 && /* @__PURE__ */ N(
              "button",
              {
                type: "button",
                style: {
                  ...x.attachBtn,
                  ...Y ? x.attachBtnActive : null,
                  ...ee ? x.actionBtnMobile : null
                },
                onMouseDown: (v) => v.preventDefault(),
                onClick: () => {
                  if (W) {
                    ie((v) => !v);
                    return;
                  }
                  jr();
                },
                disabled: De,
                title: r("playground.edit_image_region"),
                children: [
                  /* @__PURE__ */ N("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ M("path", { d: "M12 20h9" }),
                    /* @__PURE__ */ M("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
                  ] }),
                  r("playground.edit")
                ]
              }
            ),
            /* @__PURE__ */ N(
              "button",
              {
                type: "button",
                style: { ...x.attachBtn, ...ee ? x.actionBtnMobile : null },
                onMouseDown: (v) => v.preventDefault(),
                onClick: Dl,
                disabled: De || Y,
                title: r("playground.attach_images"),
                children: [
                  /* @__PURE__ */ N("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ M("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
                    /* @__PURE__ */ M("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                    /* @__PURE__ */ M("path", { d: "M21 15l-5-5L5 21" })
                  ] }),
                  r("playground.image")
                ]
              }
            ),
            De ? /* @__PURE__ */ N(
              "button",
              {
                style: { ...x.stopBtn, ...ee ? x.actionBtnMobile : null },
                onMouseDown: (v) => v.preventDefault(),
                onClick: an,
                children: [
                  /* @__PURE__ */ M("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ M("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
                  r("playground.stop")
                ]
              }
            ) : /* @__PURE__ */ N(
              "button",
              {
                style: {
                  ...x.sendBtn,
                  ...ee ? x.actionBtnMobile : null,
                  opacity: nn ? 1 : 0.4
                },
                onMouseDown: (v) => v.preventDefault(),
                onClick: () => {
                  if (Y) {
                    Jt();
                    return;
                  }
                  _r();
                },
                disabled: !nn,
                title: ve && me ? void 0 : r("playground.select_model_first"),
                children: [
                  /* @__PURE__ */ N("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ M("path", { d: "M22 2L11 13" }),
                    /* @__PURE__ */ M("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                  ] }),
                  r("playground.send")
                ]
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ M("style", { children: D1 })
  ] });
}
const D1 = `
@keyframes pg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pg-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Quiet Modern aesthetic ──
   单一字体（系统 Chinese ladder + 现代 sans for Latin），多权重撑层级，
   完全跟随 SDK 主题色系。没有任何复古/编辑级装饰。 */
[data-pg-aesthetic] {
  font-feature-settings: 'cv11' on, 'ss01' on;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 删除按钮：hover 才显出，颜色保持中性，hover 时才染 danger */
.pg-conv-delete {
  opacity: 0;
  color: var(--ag-color-textTertiary, #9ca3af);
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease;
}
.pg-conv-item:hover .pg-conv-delete,
.pg-conv-item:focus-within .pg-conv-delete {
  opacity: 1;
}
.pg-conv-delete:hover {
  background: var(--ag-color-dangerSubtle, rgba(239, 68, 68, 0.12));
  color: var(--ag-color-danger, #ef4444);
}
.pg-conv-delete:focus-visible {
  opacity: 1;
  outline: 2px solid var(--ag-color-borderFocus, #3b82f6);
  outline-offset: 1px;
}

.pg-conv-item {
  position: relative;
}
`, x = {
  layout: {
    display: "flex",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    position: "relative",
    isolation: "isolate",
    background: m("bgDeep"),
    fontFamily: m("fontSans"),
    color: m("text"),
    overflow: "hidden"
  },
  // ── Sidebar ──
  sidebar: {
    width: 280,
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: m("bg"),
    borderRight: `1px solid ${m("borderSubtle")}`,
    position: "relative",
    zIndex: 3
  },
  sidebarRail: {
    width: 48,
    minWidth: 48,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 12,
    background: m("bg"),
    borderRight: `1px solid ${m("borderSubtle")}`,
    flexShrink: 0,
    zIndex: 3
  },
  sidebarRailMobile: {
    position: "absolute",
    top: 0,
    left: 0,
    background: "transparent",
    borderRight: "none",
    zIndex: 4
  },
  sidebarBackdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(6, 10, 18, 0.64)",
    zIndex: 2
  },
  sidebarMobile: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "min(84vw, 320px)",
    minWidth: "min(84vw, 320px)",
    boxShadow: "0 18px 48px rgba(0, 0, 0, 0.32)"
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "20px 12px 14px 8px"
  },
  sidebarTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: m("text"),
    letterSpacing: "-0.005em"
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: m("textSecondary"),
    cursor: "pointer",
    transition: m("transition"),
    flexShrink: 0
  },
  convList: {
    flex: 1,
    overflowY: "auto",
    padding: "2px 8px 8px"
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
    transition: m("transition"),
    marginBottom: 1
  },
  convTitle: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    lineHeight: "18px",
    letterSpacing: "-0.003em"
  },
  deleteBtn: {
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    marginTop: 0
  },
  emptyConvList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    color: m("textTertiary"),
    fontSize: 12
  },
  modeSwitcher: {
    border: `1px solid ${m("borderSubtle")}`,
    borderRadius: m("radiusSm"),
    background: m("bgDeep")
  },
  modeSwitcherItem: {
    color: m("textSecondary"),
    transition: m("transition")
  },
  modeSwitcherItemActive: {
    background: m("bg"),
    color: m("text")
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "14px 16px 18px"
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: m("textTertiary"),
    letterSpacing: "0.02em"
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 500,
    color: m("text"),
    fontVariantNumeric: "tabular-nums"
  },
  // ── Main ──
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden"
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "none",
    borderRadius: m("radiusSm"),
    background: "transparent",
    color: m("textSecondary"),
    cursor: "pointer",
    transition: m("transition"),
    flexShrink: 0
  },
  // 模型/尺寸/Effort 选择器现在嵌在输入卡片内（左侧），跟附件 / 图片 / 发送按钮
  // 同一行。所以 chip 走透明底，避免在 bgSurface 卡片上再叠一层 surface 制造
  // "卡上有卡"的层级噪声。
  selectors: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    minWidth: 0,
    flex: 1
  },
  selectorsMobile: {
    width: "100%",
    gap: 4,
    rowGap: 2
  },
  selectWrap: {
    position: "relative",
    minWidth: 0
  },
  modelSelectWrap: {
    flex: "0 1 280px"
  },
  selectTrigger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: m("textSecondary"),
    fontFamily: m("fontSans"),
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    transition: m("transition")
  },
  selectTriggerOpen: {
    background: m("bgHover"),
    color: m("text")
  },
  selectTriggerText: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  selectTriggerCaret: {
    flexShrink: 0,
    color: m("textTertiary"),
    fontSize: 10,
    lineHeight: 1
  },
  modelSelectTrigger: {
    maxWidth: 280,
    padding: "4px 8px",
    color: m("text"),
    fontSize: 13,
    letterSpacing: "-0.003em"
  },
  modelSelectTriggerMobile: {
    maxWidth: "100%",
    padding: "3px 6px",
    fontSize: 12
  },
  chipSelectTrigger: {
    height: 26,
    padding: "2px 8px",
    fontSize: 12
  },
  chipSelectTriggerMobile: {
    height: 24,
    padding: "1px 6px",
    fontSize: 11
  },
  selectPopover: {
    position: "absolute",
    left: 0,
    bottom: "calc(100% + 8px)",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    minWidth: "100%",
    maxHeight: 320,
    padding: 6,
    border: `1px solid ${m("border")}`,
    borderRadius: m("radiusSm"),
    background: m("bg"),
    boxShadow: "0 20px 54px rgba(0, 0, 0, 0.34)",
    overflowY: "auto"
  },
  selectPopoverModel: {
    width: 390,
    maxWidth: "calc(100vw - 32px)"
  },
  selectPopoverChip: {
    width: "max-content",
    minWidth: 116
  },
  selectOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1e3,
    display: "flex",
    alignItems: "flex-end",
    padding: 10,
    background: "rgba(4, 7, 13, 0.62)"
  },
  selectSheet: {
    width: "100%",
    maxHeight: "72vh",
    padding: 8,
    border: `1px solid ${m("border")}`,
    borderRadius: "18px 18px 14px 14px",
    background: m("bg"),
    boxShadow: "0 -18px 60px rgba(0, 0, 0, 0.38)",
    overflow: "hidden"
  },
  selectSheetHeader: {
    padding: "5px 8px 10px",
    color: m("textTertiary"),
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  },
  selectPopoverMobile: {
    position: "relative",
    left: "auto",
    bottom: "auto",
    zIndex: "auto",
    width: "100%",
    minWidth: "100%",
    maxWidth: "none",
    maxHeight: "calc(72vh - 48px)",
    padding: 0,
    border: "none",
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none"
  },
  selectOption: {
    display: "block",
    width: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: m("textSecondary"),
    fontFamily: m("fontSans"),
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.35,
    textAlign: "left",
    whiteSpace: "nowrap",
    cursor: "pointer"
  },
  selectOptionModel: {
    fontSize: 13
  },
  selectOptionActive: {
    background: m("primarySubtle"),
    color: m("primary")
  },
  imageSizeInlineControls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0
  },
  imageSizeInlineControlsMobile: {
    flex: "0 1 auto",
    flexWrap: "wrap",
    gap: 4
  },
  imageSizeInlinePreview: {
    padding: "3px 9px",
    color: m("textTertiary"),
    fontSize: 12,
    fontFamily: m("fontMono"),
    whiteSpace: "nowrap"
  },
  // ── Messages ──
  messagesArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  },
  // ── Empty state ──
  // 居中、克制、靠层级与留白说话。一个标题、一个描述、一个 primary CTA。
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 14,
    padding: "40px 32px",
    maxWidth: 480,
    margin: "0 auto",
    width: "100%",
    textAlign: "center",
    animation: "pg-fadein 0.4s ease-out"
  },
  emptyStateMobile: {
    padding: "32px 24px",
    gap: 12
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: 500,
    color: m("text"),
    lineHeight: 1.18,
    letterSpacing: "-0.018em",
    margin: 0
  },
  emptyDesc: {
    fontSize: 14,
    color: m("textTertiary"),
    lineHeight: 1.55,
    margin: 0
  },
  emptyBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    border: "none",
    borderRadius: 999,
    background: m("primary"),
    color: m("textInverse"),
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: m("transition"),
    marginTop: 12
  },
  // ── Message row ──
  // ChatGPT 风格：用户消息右对齐圆角气泡（bgSurface），助手消息左对齐无气泡纯
  // 排版。两侧都不显示 avatar 和"你/助手"role label。借助 padding 拉空气，
  // 取消行间分割线。整列居中、限定 768px 宽，营造窄列阅读体验。
  messageRow: {
    display: "flex",
    width: "100%",
    maxWidth: 768,
    margin: "0 auto",
    padding: "14px 24px",
    animation: "pg-fadein 0.25s ease-out"
  },
  messageRowMobile: {
    padding: "10px 14px"
  },
  messageRowUser: {
    justifyContent: "flex-end"
  },
  messageRowAssistant: {
    justifyContent: "flex-start"
  },
  userBubble: {
    maxWidth: "78%",
    minWidth: 0,
    padding: "11px 16px",
    borderRadius: 18,
    background: m("bgSurface"),
    border: `1px solid ${m("borderSubtle")}`
  },
  userBubbleMobile: {
    maxWidth: "82%",
    padding: "10px 13px",
    borderRadius: 16
  },
  assistantBlock: {
    maxWidth: "100%",
    width: "100%",
    minWidth: 0
  },
  messageCopyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px solid ${m("borderSubtle")}`,
    borderRadius: "999px",
    background: "transparent",
    color: m("textTertiary"),
    cursor: "pointer",
    transition: m("transition")
  },
  messageCopyAfterText: {
    display: "inline-flex",
    verticalAlign: "text-bottom",
    marginLeft: 6,
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(1px)",
    transition: m("transition")
  },
  messageCopyAfterTextVisible: {
    opacity: 1,
    pointerEvents: "auto"
  },
  messageCopyAfterTextBtn: {
    width: 22,
    height: 22
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 1.72,
    wordBreak: "break-word",
    color: m("text")
  },
  markdownParagraph: {
    margin: "0 0 11px"
  },
  markdownH1: {
    margin: "4px 0 14px",
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: "-0.015em",
    color: m("text")
  },
  markdownH2: {
    margin: "18px 0 10px",
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
    color: m("text")
  },
  markdownH3: {
    margin: "16px 0 8px",
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.35,
    color: m("text")
  },
  markdownH4: {
    margin: "14px 0 8px",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
    color: m("text")
  },
  markdownList: {
    margin: "0 0 12px",
    paddingLeft: 20,
    color: m("text")
  },
  markdownListItem: {
    margin: "4px 0"
  },
  markdownBlockquote: {
    margin: "0 0 12px",
    padding: "9px 13px",
    borderLeft: `3px solid ${m("primary")}`,
    borderRadius: "0 10px 10px 0",
    background: m("primarySubtle"),
    color: m("textSecondary")
  },
  markdownCodeBlock: {
    margin: "4px 0 14px",
    padding: "13px 15px",
    borderRadius: m("radiusSm"),
    background: m("bgDeep"),
    border: `1px solid ${m("borderSubtle")}`,
    color: m("text"),
    fontFamily: m("fontMono"),
    fontSize: 12.5,
    lineHeight: 1.72,
    overflowX: "auto",
    whiteSpace: "pre"
  },
  markdownInlineCode: {
    padding: "1px 5px 2px",
    borderRadius: 6,
    background: m("bgSurface"),
    border: `1px solid ${m("borderSubtle")}`,
    color: m("primary"),
    fontFamily: m("fontMono"),
    fontSize: "0.9em"
  },
  markdownInlineMath: {
    display: "inline-block",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    verticalAlign: "-0.18em"
  },
  markdownBlockMath: {
    margin: "4px 0 14px",
    padding: "12px 14px",
    borderRadius: m("radiusSm"),
    background: m("bgSurface"),
    border: `1px solid ${m("borderSubtle")}`,
    color: m("text"),
    overflowX: "auto",
    overflowY: "hidden"
  },
  markdownLink: {
    color: m("primary"),
    textDecoration: "underline",
    textDecorationColor: m("primary"),
    textUnderlineOffset: 3
  },
  markdownDivider: {
    height: 1,
    border: 0,
    background: m("border"),
    margin: "16px 0"
  },
  reasoningBox: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: m("radiusSm"),
    background: m("bgSurface"),
    border: `1px solid ${m("borderSubtle")}`
  },
  reasoningSummary: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: m("textSecondary"),
    userSelect: "none"
  },
  reasoningContent: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.6,
    wordBreak: "break-word",
    color: m("textSecondary")
  },
  imageGroup: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 12,
    maxWidth: "100%",
    margin: "10px 0 6px"
  },
  imageGroupMobile: {
    gap: 8,
    marginTop: 8
  },
  generatedImageFrame: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flex: "1 1 180px",
    maxWidth: "min(100%, 320px)",
    minWidth: 0
  },
  generatedImageFrameMobile: {
    flex: "1 1 140px",
    maxWidth: "min(100%, 240px)"
  },
  generatedImagePreviewBtn: {
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "zoom-in",
    textAlign: "left",
    font: "inherit"
  },
  generatedImageOverlayWrap: {
    position: "relative",
    display: "block",
    width: "100%",
    borderRadius: m("radiusMd"),
    overflow: "hidden"
  },
  generatedImage: {
    display: "block",
    maxHeight: 420,
    width: "100%",
    height: "auto",
    borderRadius: m("radiusMd"),
    border: `1px solid ${m("borderSubtle")}`,
    objectFit: "contain"
  },
  generatedImageDimOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: m("radiusMd"),
    background: "rgba(15, 23, 42, 0.34)",
    pointerEvents: "none"
  },
  generatedImageSelection: {
    position: "absolute",
    border: `2px solid ${m("primary")}`,
    background: "rgba(45, 212, 191, 0.2)",
    boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.18), 0 0 18px rgba(45, 212, 191, 0.35)",
    pointerEvents: "none"
  },
  imageDownloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: "999px",
    border: `1px solid ${m("borderSubtle")}`,
    background: m("bgSurface"),
    color: m("textSecondary"),
    cursor: "pointer",
    transition: m("transition")
  },
  imageMessageActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 0
  },
  regenerateImageBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: "999px",
    border: `1px solid ${m("borderSubtle")}`,
    background: m("bgSurface"),
    color: m("textSecondary"),
    cursor: "pointer",
    transition: m("transition")
  },
  imagePreviewOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "rgba(4, 7, 13, 0.78)",
    backdropFilter: "blur(10px)"
  },
  imagePreviewModal: {
    position: "relative",
    display: "flex",
    maxWidth: "min(94vw, 1120px)",
    maxHeight: "90vh",
    width: "fit-content",
    borderRadius: m("radiusLg"),
    border: `1px solid ${m("border")}`,
    background: m("bgDeep"),
    boxShadow: "0 28px 90px rgba(0, 0, 0, 0.45)",
    overflow: "hidden"
  },
  imagePreviewCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: "999px",
    background: "rgba(8, 12, 20, 0.72)",
    color: "#edf4ff",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.24)"
  },
  imagePreviewLarge: {
    display: "block",
    maxWidth: "min(94vw, 1120px)",
    maxHeight: "90vh",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    background: m("bgDeep")
  },
  interactionNotice: {
    position: "sticky",
    bottom: 12,
    alignSelf: "center",
    zIndex: 4,
    padding: "7px 12px",
    borderRadius: "999px",
    background: m("bgElevated"),
    border: `1px solid ${m("borderSubtle")}`,
    color: m("textSecondary"),
    fontSize: 12,
    boxShadow: m("shadowMd")
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: m("textTertiary")
  },
  metaBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "999px",
    background: m("bgSurface"),
    border: `1px solid ${m("borderSubtle")}`,
    fontSize: 11,
    fontFamily: m("fontMono"),
    color: m("textSecondary")
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: m("primary"),
    animation: "pg-pulse 1.2s ease-in-out infinite"
  },
  thinkingDots: {
    animation: "pg-pulse 1.5s ease-in-out infinite"
  },
  // ── Error ──
  errorBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "8px 28px",
    padding: "10px 14px",
    borderRadius: m("radiusSm"),
    background: m("dangerSubtle"),
    color: m("danger"),
    fontSize: 13,
    border: `1px solid ${m("danger")}`,
    borderColor: "rgba(251, 113, 133, 0.2)"
  },
  errorBarMobile: {
    margin: "8px 14px"
  },
  errorMessage: {
    flex: 1,
    minWidth: 0
  },
  recoverableBar: {
    background: m("primarySubtle"),
    color: m("primary"),
    borderColor: "rgba(45, 212, 191, 0.22)"
  },
  errorRetryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(251, 113, 133, 0.28)",
    background: "rgba(251, 113, 133, 0.1)",
    color: m("danger"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: m("fontSans")
  },
  recoverableRetryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(45, 212, 191, 0.3)",
    background: "rgba(45, 212, 191, 0.12)",
    color: m("primary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: m("fontSans")
  },
  // ── Input ──
  inputArea: {
    padding: "12px 28px 20px",
    background: "transparent",
    flexShrink: 0
  },
  inputAreaMobile: {
    padding: "8px 10px 10px"
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: `1px solid ${m("border")}`,
    borderRadius: 22,
    background: m("bgSurface"),
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 12,
    transition: m("transition"),
    width: "100%",
    maxWidth: 768,
    margin: "0 auto"
  },
  inputWrapperMobile: {
    gap: 7,
    borderRadius: 20,
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10
  },
  inputWrapperStreaming: {
    paddingTop: 8,
    paddingBottom: 8
  },
  imageEditPanel: {
    borderRadius: m("radiusMd"),
    border: `1px solid ${m("borderSubtle")}`,
    background: m("bgSurface")
  },
  imageEditTitleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0
  },
  imageEditTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: m("text")
  },
  imageEditSubtitle: {
    fontSize: 12,
    color: m("textTertiary")
  },
  imageEditHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0
  },
  imageEditGhostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    padding: "6px 10px",
    borderRadius: m("radiusSm"),
    border: `1px solid ${m("border")}`,
    background: "rgba(9, 14, 24, 0.5)",
    color: m("textSecondary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: m("transition"),
    fontFamily: m("fontSans")
  },
  imageEditIconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "999px",
    border: `1px solid ${m("borderSubtle")}`,
    background: "rgba(9, 14, 24, 0.52)",
    color: m("textSecondary"),
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer"
  },
  imageEditStageWrap: {
    borderRadius: m("radiusMd"),
    border: `1px solid ${m("borderSubtle")}`
  },
  imageEditStage: {
    position: "relative",
    display: "inline-flex",
    maxWidth: "100%",
    borderRadius: m("radiusSm"),
    overflow: "hidden",
    verticalAlign: "top"
  },
  imageEditSource: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none"
  },
  imageEditCanvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    touchAction: "none",
    cursor: "crosshair"
  },
  imageEditSelection: {
    position: "absolute",
    zIndex: 1,
    border: "2px solid rgba(45, 212, 191, 0.95)",
    background: "rgba(45, 212, 191, 0.2)",
    boxShadow: "0 0 0 9999px rgba(2, 6, 14, 0.28), 0 0 18px rgba(45, 212, 191, 0.35)",
    pointerEvents: "none"
  },
  imageEditSidePanel: {
    borderRadius: m("radiusSm"),
    border: `1px solid ${m("borderSubtle")}`
  },
  imageEditBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: "999px",
    background: m("primarySubtle"),
    color: m("primary"),
    fontSize: 11,
    fontWeight: 800,
    fontFamily: m("fontMono")
  },
  imageEditFilename: {
    color: m("textTertiary"),
    fontSize: 12,
    lineHeight: 1.4,
    wordBreak: "break-word"
  },
  imageEditEmptyBtn: {
    minHeight: 96,
    borderRadius: m("radiusMd"),
    border: `1px dashed ${m("border")}`,
    background: "rgba(45, 212, 191, 0.05)",
    color: m("primary"),
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: m("fontSans")
  },
  editModalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "rgba(4, 7, 13, 0.78)",
    backdropFilter: "blur(10px)"
  },
  editModalCard: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    width: "min(96vw, 1080px)",
    maxHeight: "92vh",
    padding: 18,
    borderRadius: m("radiusLg"),
    border: `1px solid ${m("border")}`,
    background: m("bgDeep"),
    boxShadow: "0 28px 90px rgba(0, 0, 0, 0.45)",
    overflow: "hidden"
  },
  editModalCardMobile: {
    width: "100%",
    maxHeight: "94vh",
    padding: 12,
    gap: 10
  },
  editModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  editModalBody: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 200px",
    gap: 14,
    minHeight: 0,
    flex: 1,
    alignItems: "stretch"
  },
  editModalBodyMobile: {
    gridTemplateColumns: "1fr"
  },
  editModalStageWrap: {
    minWidth: 0,
    overflow: "auto",
    borderRadius: m("radiusMd"),
    border: `1px solid ${m("borderSubtle")}`,
    background: "rgba(2, 6, 14, 0.44)",
    padding: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  editModalSide: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    borderRadius: m("radiusSm"),
    border: `1px solid ${m("borderSubtle")}`,
    background: "rgba(5, 10, 18, 0.38)"
  },
  editModalFooter: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  editModalPrompt: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: m("radiusSm"),
    border: `1px solid ${m("borderSubtle")}`,
    background: m("bgSurface"),
    color: m("text"),
    fontFamily: m("fontSans"),
    fontSize: 13,
    lineHeight: 1.5,
    resize: "vertical",
    minHeight: 60,
    outline: "none"
  },
  editModalActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  editModalHint: {
    fontSize: 11,
    color: m("textTertiary"),
    flex: 1,
    minWidth: 0
  },
  editModalBtnGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0
  },
  editModalSubmitBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    border: "none",
    borderRadius: m("radiusSm"),
    background: m("primary"),
    color: m("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    fontFamily: m("fontSans"),
    cursor: "pointer",
    transition: m("transition")
  },
  editModalStatus: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: m("radiusSm"),
    background: m("primarySubtle"),
    color: m("primary"),
    fontSize: 12,
    fontWeight: 500
  },
  editModalError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: m("radiusSm"),
    background: m("dangerSubtle"),
    color: m("danger"),
    fontSize: 12,
    fontWeight: 500
  },
  imagePreviewList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  imagePreviewItem: {
    position: "relative",
    width: 76,
    height: 76,
    borderRadius: m("radiusSm"),
    overflow: "hidden",
    border: `1px solid ${m("borderSubtle")}`,
    background: m("bgHover")
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    border: "none",
    borderRadius: 999,
    background: "rgba(0, 0, 0, 0.62)",
    color: "#fff",
    cursor: "pointer",
    lineHeight: "20px",
    padding: 0,
    fontSize: 16
  },
  textarea: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: m("text"),
    fontSize: 14,
    fontFamily: m("fontSans"),
    resize: "none",
    outline: "none",
    lineHeight: 1.55,
    height: 24,
    minHeight: 24,
    maxHeight: 128
  },
  inputActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  inputActionsMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 7
  },
  inputButtonGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  inputButtonGroupMobile: {
    width: "100%",
    minWidth: 0,
    justifyContent: "space-between",
    gap: 6
  },
  fileInput: {
    display: "none"
  },
  inputHint: {
    color: m("textTertiary")
  },
  attachBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: m("textSecondary"),
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: m("transition")
  },
  attachBtnActive: {
    background: m("primarySubtle"),
    color: m("primary")
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    border: "none",
    borderRadius: 999,
    background: m("primary"),
    color: m("textInverse"),
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: m("transition")
  },
  stopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    border: "none",
    borderRadius: 999,
    background: m("dangerSubtle"),
    color: m("danger"),
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer"
  },
  actionBtnMobile: {
    flex: "0 1 auto",
    minWidth: 44,
    minHeight: 36,
    justifyContent: "center",
    padding: "8px 11px"
  }
}, H1 = {
  routes: [
    { path: "/playground", component: R1 }
  ]
};
export {
  H1 as default
};
