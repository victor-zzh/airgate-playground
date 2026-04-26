import { jsxs as d, jsx as r, Fragment as fe } from "react/jsx-runtime";
import { useState as M, useRef as ie, useEffect as oe, useCallback as B, isValidElement as Ft, cloneElement as tt, Children as nt } from "react";
import { useTranslation as Nt } from "react-i18next";
const st = {
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
}, qt = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, Ut = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, Ue = {
  ...qt,
  ...Ut
}, lt = {
  dark: st
};
function Vt(e) {
  return e.replace(/[A-Z]/g, (i) => "-" + i.toLowerCase());
}
function dt(e = "ag") {
  return e.trim() || "ag";
}
function ze(e, i) {
  return `--${e}-${Vt(i)}`;
}
Object.keys(lt.dark).reduce((e, i) => (e[i] = ze("ag", i), e), {});
Object.keys(Ue).reduce((e, i) => (e[i] = ze("ag", i), e), {});
function ct(e = {}) {
  const i = dt(e.prefix);
  return Object.keys(lt.dark).reduce((s, o) => (s[o] = ze(i, o), s), {});
}
function pt(e = {}) {
  const i = dt(e.prefix);
  return Object.keys(Ue).reduce((s, o) => (s[o] = ze(i, o), s), {});
}
const Kt = ct(), Jt = pt();
function a(e, i = {}) {
  const s = i.prefix ? ct(i) : Kt, o = i.prefix ? pt(i) : Jt;
  if (e in s) {
    const c = e;
    return `var(${s[c]}, ${st[c]})`;
  }
  const u = e;
  return `var(${o[u]}, ${Ue[u]})`;
}
const ut = "/api/v1/ext-user/airgate-playground", Xt = "/api/v1";
function gt() {
  const e = {}, i = localStorage.getItem("token");
  return i && (e.Authorization = `Bearer ${i}`), e;
}
async function F(e, i, s, o = ut) {
  const u = { ...gt() };
  s !== void 0 && (u["Content-Type"] = "application/json");
  const c = await fetch(o + i, {
    method: e,
    headers: u,
    body: s ? JSON.stringify(s) : void 0
  });
  if (!c.ok) {
    const x = await c.text();
    let v = `HTTP ${c.status}`;
    try {
      const I = JSON.parse(x);
      v = I.error || I.message || v;
    } catch {
    }
    throw c.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login"), new Error(v);
  }
  const g = await c.text();
  return g ? JSON.parse(g) : null;
}
async function Yt(e, i, s) {
  const o = await F(e, i, s, Xt);
  if (o.code !== 0)
    throw new Error(o.message || "request failed");
  return o.data;
}
const J = {
  listConversations: () => F("GET", "/conversations"),
  createConversation: (e) => F("POST", "/conversations", e),
  getConversation: (e) => F("GET", `/conversations/${e}`),
  updateConversation: (e, i) => F("PUT", `/conversations/${e}`, i),
  deleteConversation: (e) => F("DELETE", `/conversations/${e}`),
  listMessages: (e) => F("GET", `/messages/${e}`),
  persistMessage: (e) => F("POST", "/messages", e),
  listPlatforms: async () => (await F("GET", "/platforms")).map((i) => {
    const s = i.name || i.Name || "", o = i.display_name || i.DisplayName || s;
    return { name: s, display_name: o };
  }).filter((i) => i.name),
  listModels: async (e) => {
    const i = await F("GET", `/models?platform=${encodeURIComponent(e)}`);
    return (Array.isArray(i) ? i : i.data || []).map((o) => {
      const u = o.id || o.ID || "";
      return {
        id: u,
        name: o.name || o.Name || u,
        platform: e,
        input_price: o.input_price ?? o.InputPrice ?? 0,
        output_price: o.output_price ?? o.OutputPrice ?? 0,
        context_window: o.context_window ?? o.ContextWindow ?? 0,
        max_output_tokens: o.max_output_tokens ?? o.MaxOutputTokens ?? 0,
        image_only: !!(o.image_only ?? o.ImageOnly),
        capabilities: o.capabilities || o.Capabilities || []
      };
    }).filter((o) => o.id);
  },
  getUserInfo: () => Yt("GET", "/users/me")
};
async function Zt(e, i, s, o) {
  var C, _, T;
  const u = {
    ...i,
    stream_options: {
      include_usage: !0,
      ...i.stream_options
    }
  }, c = await fetch(`${ut}/chat/completions`, {
    method: "POST",
    headers: {
      ...gt(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Airgate-Platform": e
    },
    body: JSON.stringify(u),
    signal: o
  });
  if (!c.ok || !c.body) {
    const y = await c.text();
    let w = `HTTP ${c.status}`;
    try {
      const $ = JSON.parse(y);
      w = ((C = $.error) == null ? void 0 : C.message) || $.error || $.message || w;
    } catch {
    }
    s.onError(w);
    return;
  }
  const g = c.body.getReader(), x = new TextDecoder();
  let v = "", I = { input_tokens: 0, output_tokens: 0, model: i.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: y, value: w } = await g.read();
      if (y) break;
      v += x.decode(w, { stream: !0 });
      const $ = v.split(`
`);
      v = $.pop() || "";
      for (const ee of $) {
        const m = ee.trim();
        if (!m.startsWith("data: ")) continue;
        const H = m.slice(6);
        if (H === "[DONE]") {
          s.onDone(I);
          return;
        }
        try {
          const S = JSON.parse(H);
          if (S.error) {
            s.onError(S.error.message || S.error);
            return;
          }
          const z = (T = (_ = S.choices) == null ? void 0 : _[0]) == null ? void 0 : T.delta, N = z == null ? void 0 : z.reasoning_content;
          N && s.onReasoning(N);
          const G = z == null ? void 0 : z.content;
          G && s.onData(G), S.usage && (I = {
            input_tokens: S.usage.prompt_tokens || S.usage.input_tokens || 0,
            output_tokens: S.usage.completion_tokens || S.usage.output_tokens || 0,
            model: S.model || I.model,
            cost: S.usage.cost || 0
          });
        } catch {
        }
      }
    }
    s.onDone(I);
  } catch (y) {
    if (o != null && o.aborted) return;
    s.onError(y instanceof Error ? y.message : "stream failed");
  }
}
const rt = 960, O = -1, ue = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, pe = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, Qt = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/, ht = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, en = /(^|[-_])(?:gpt-?5|o[134]|codex)(?:[-_.]|$)/i, it = /(^|[-_])(?:gpt[-_]?image|image)(?:[-_.]|\d|$)/i, tn = 10 * 1024 * 1024, Fe = 16, ce = 3840, nn = [
  { value: 1024, label: "1K" },
  { value: 2048, label: "2K" },
  { value: 3840, label: "4K" }
], rn = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9" }
], on = {
  mode: "ratio",
  baseResolution: 1024,
  ratio: "1:1"
};
function an(e) {
  return { ...e };
}
function sn(e) {
  const [i, s] = e.split(":").map((o) => Number.parseInt(o, 10));
  return i > 0 && s > 0 ? { width: i, height: s } : null;
}
function Le(e) {
  return Math.max(Fe, Math.floor(e / Fe) * Fe);
}
function ln(e, i) {
  return e <= ce && i <= ce ? { width: e, height: i } : e >= i ? { width: ce, height: Le(i * ce / e) } : { width: Le(e * ce / i), height: ce };
}
function Ne(e, i) {
  const s = ln(Le(e), Le(i));
  return `${s.width}x${s.height}`;
}
function dn(e) {
  return sn(e.ratio);
}
function mt(e) {
  if (e.mode === "auto") return;
  const i = dn(e);
  if (!i) return;
  const s = e.baseResolution;
  return i.width === i.height ? Ne(s, s) : i.width > i.height ? Ne(s, s * i.height / i.width) : Ne(s * i.width / i.height, s);
}
function cn(e) {
  return e.mode === "auto" ? "Auto" : mt(e) || "Invalid size";
}
function pn(e) {
  return e.replace(ue, "[Image generated]").trim() || "[Image generated]";
}
function un(e) {
  return e.replace(ue, "[Image]").trim() || "[Image]";
}
function ot(e) {
  return Qt.test(e);
}
function gn(e) {
  pe.lastIndex = 0;
  const i = pe.exec(e);
  return pe.lastIndex = 0, i ? { alt: i[1], url: i[2] } : null;
}
function hn(e) {
  return e.replace(ue, "").trim().length > 0;
}
function mn(e) {
  return e.replace(/[\]\\]/g, "");
}
function fn(e) {
  const i = e.match(ht);
  if (i) return i[1].toLowerCase() === "jpeg" ? "jpg" : i[1].toLowerCase();
  try {
    const o = new URL(e).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return o ? o[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}
function yn(e, i) {
  return `${(e || "generated-image").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80) || "generated-image"}.${fn(i)}`;
}
function qe(e, i) {
  const s = document.createElement("a");
  s.href = e, s.download = i, s.rel = "noreferrer", document.body.appendChild(s), s.click(), s.remove();
}
async function bn(e, i) {
  const s = yn(i, e);
  if (ht.test(e)) {
    qe(e, s);
    return;
  }
  try {
    const o = await fetch(e);
    if (!o.ok) throw new Error(`HTTP ${o.status}`);
    const u = URL.createObjectURL(await o.blob());
    try {
      qe(u, s);
    } finally {
      URL.revokeObjectURL(u);
    }
  } catch {
    qe(e, s);
  }
}
async function xn(e) {
  var o;
  if ((o = navigator.clipboard) != null && o.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(e);
    return;
  }
  const i = document.createElement("textarea");
  i.value = e, i.style.position = "fixed", i.style.opacity = "0", i.style.pointerEvents = "none", document.body.appendChild(i), i.select();
  const s = document.execCommand("copy");
  if (i.remove(), !s) throw new Error("copy failed");
}
function vn(e) {
  return new Promise((i, s) => {
    const o = new FileReader();
    o.onload = () => i(String(o.result || "")), o.onerror = () => s(o.error || new Error("Failed to read image")), o.readAsDataURL(e);
  });
}
function wn(e, i) {
  const s = e.trim(), o = i.map((u) => `![${mn(u.name)}](${u.url})`).join(`
`);
  return [s, o].filter(Boolean).join(`

`);
}
async function kn(e) {
  const i = e.filter((s) => s.type.startsWith("image/"));
  if (i.some((s) => s.size > tn))
    throw new Error("Images must be 10MB or smaller");
  return Promise.all(i.map(async (s) => ({
    id: `${s.name}-${s.lastModified}-${s.size}`,
    name: s.name || "pasted-image",
    url: await vn(s)
  })));
}
function Sn(e) {
  const i = e.replace(ue, "[Image]").trim() || "[Image]";
  return i.slice(0, 30) + (i.length > 30 ? "..." : "");
}
function Mn(e, i) {
  if (e !== "user") return pn(i);
  const s = [];
  let o = 0, u;
  for (ue.lastIndex = 0; (u = ue.exec(i)) !== null; ) {
    const g = i.slice(o, u.index).trim();
    g && s.push({ type: "text", text: g }), s.push({ type: "image_url", image_url: { url: u[1] } }), o = u.index + u[0].length;
  }
  const c = i.slice(o).trim();
  return c && s.push({ type: "text", text: c }), s.length ? s : i;
}
function ft(e, i) {
  return !!(e && it.test(e) || i && it.test(i));
}
function Te(e) {
  var i;
  return !!(e && (e.image_only || (i = e.capabilities) != null && i.includes("image_generation") || ft(e.id, e.name)));
}
function Be(e) {
  var i, s;
  return !e || Te(e) ? !1 : !!((i = e.capabilities) != null && i.includes("reasoning") || (s = e.capabilities) != null && s.includes("thinking") || en.test(e.id));
}
function ye(e) {
  return `${encodeURIComponent(e.platform || "")}:${encodeURIComponent(e.id)}`;
}
function In(e, i) {
  var s;
  return ((s = e.find((o) => o.name === i)) == null ? void 0 : s.display_name) || i || "";
}
function Cn(e) {
  return /^(https?:|mailto:|#)/i.test(e);
}
function _n(e) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:)/i.test(e);
}
function at(e, i, s) {
  i.split(`
`).forEach((u, c) => {
    c > 0 && e.push(/* @__PURE__ */ r("br", {}, `${s}-br-${c}`)), u && e.push(u);
  });
}
function yt(e, i, s, o) {
  const u = /* @__PURE__ */ r("img", { src: i, alt: s, style: n.generatedImage, loading: "lazy" }), c = o.imagePreviewTitle || "Preview image", g = o.onImagePreview ? /* @__PURE__ */ r(
    "button",
    {
      type: "button",
      style: n.generatedImagePreviewBtn,
      title: c,
      "aria-label": c,
      onClick: () => {
        var x;
        return (x = o.onImagePreview) == null ? void 0 : x.call(o, i, s);
      },
      children: u
    }
  ) : u;
  return /* @__PURE__ */ r("span", { style: n.generatedImageFrame, children: g }, e);
}
function ae(e, i, s = {}) {
  const o = [], u = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let c = 0, g;
  for (; (g = u.exec(e)) !== null; ) {
    g.index > c && at(o, e.slice(c, g.index), `${i}-text-${c}`);
    const x = `${i}-${g.index}`, v = g[2], I = g[3], C = g[4], _ = g[5], T = g[6], y = g[7] || g[8], w = g[9] || g[10];
    I && _n(I) ? o.push(yt(x, I, v || s.generatedImageAlt || "Generated image", s)) : _ && Cn(_) ? o.push(
      /* @__PURE__ */ r("a", { href: _, style: n.markdownLink, target: "_blank", rel: "noreferrer", children: ae(C, `${x}-link`, s) }, x)
    ) : T ? o.push(/* @__PURE__ */ r("code", { style: n.markdownInlineCode, children: T }, x)) : y ? o.push(/* @__PURE__ */ r("strong", { children: ae(y, `${x}-bold`, s) }, x)) : w ? o.push(/* @__PURE__ */ r("em", { children: ae(w, `${x}-em`, s) }, x)) : o.push(g[0]), c = g.index + g[0].length;
  }
  return c < e.length && at(o, e.slice(c), `${i}-text-${c}`), o.length > 0 ? o : e;
}
function Bn(e, i, s, o = {}) {
  const u = ae(i, `${s}-inline`, o);
  return e === 1 ? /* @__PURE__ */ r("h1", { style: n.markdownH1, children: u }, s) : e === 2 ? /* @__PURE__ */ r("h2", { style: n.markdownH2, children: u }, s) : e === 3 ? /* @__PURE__ */ r("h3", { style: n.markdownH3, children: u }, s) : /* @__PURE__ */ r("h4", { style: n.markdownH4, children: u }, s);
}
function Rn(e, i, s = {}) {
  const o = [];
  let u;
  for (pe.lastIndex = 0; (u = pe.exec(e)) !== null; )
    o.push({ alt: u[1], url: u[2] });
  const c = e.replace(pe, "").trim();
  return !o.length || c ? null : /* @__PURE__ */ r("div", { style: n.imageGroup, children: o.map((g, x) => yt(`${i}-${x}`, g.url, g.alt || s.generatedImageAlt || "Generated image", s)) }, i);
}
const Tn = /* @__PURE__ */ new Set(["p", "h1", "h2", "h3", "h4", "blockquote", "li"]);
function bt(e, i) {
  if (!Ft(e) || typeof e.type != "string") return null;
  if (Tn.has(e.type))
    return tt(e, void 0, ...nt.toArray(e.props.children), i);
  if (e.type === "ol" || e.type === "ul") {
    const s = nt.toArray(e.props.children);
    for (let o = s.length - 1; o >= 0; o--) {
      const u = bt(s[o], i);
      if (u) {
        const c = [...s];
        return c[o] = u, tt(e, void 0, ...c);
      }
    }
  }
  return null;
}
function Ln(e, i) {
  if (!i) return e;
  for (let s = e.length - 1; s >= 0; s--) {
    const o = bt(e[s], i);
    if (o) {
      const u = [...e];
      return u[s] = o, u;
    }
  }
  return e;
}
function Re(e, i = {}) {
  const s = e.replace(/\r\n?/g, `
`).split(`
`), o = [];
  let u = [], c = [], g = [], x = [], v = !1, I = 0;
  const C = (m) => `${m}-${I++}`, _ = () => {
    if (!u.length) return;
    const m = C("p"), H = u.join(`
`);
    o.push(Rn(H, m, i) || /* @__PURE__ */ r("p", { style: n.markdownParagraph, children: ae(H, m, i) }, m)), u = [];
  }, T = () => {
    if (!c.length) return;
    const m = C("quote");
    o.push(/* @__PURE__ */ r("blockquote", { style: n.markdownBlockquote, children: ae(c.join(`
`), m, i) }, m)), c = [];
  }, y = () => {
    if (!g.length) return;
    const m = C("list"), H = g.map((S, z) => /* @__PURE__ */ r("li", { style: n.markdownListItem, children: ae(S.text, `${m}-${z}`, i) }, `${m}-${z}`));
    o.push(g[0].ordered ? /* @__PURE__ */ r("ol", { style: n.markdownList, children: H }, m) : /* @__PURE__ */ r("ul", { style: n.markdownList, children: H }, m)), g = [];
  }, w = () => {
    _(), T(), y();
  }, $ = () => {
    const m = C("code");
    o.push(/* @__PURE__ */ r("pre", { style: n.markdownCodeBlock, children: /* @__PURE__ */ r("code", { children: x.join(`
`) }) }, m)), x = [];
  };
  for (const m of s) {
    if (m.match(/^```/)) {
      v ? ($(), v = !1) : (w(), v = !0);
      continue;
    }
    if (v) {
      x.push(m);
      continue;
    }
    if (!m.trim()) {
      w();
      continue;
    }
    const S = m.match(/^(#{1,6})\s+(.+)$/);
    if (S) {
      w(), o.push(Bn(Math.min(S[1].length, 4), S[2].trim(), C("heading"), i));
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(m)) {
      w(), o.push(/* @__PURE__ */ r("hr", { style: n.markdownDivider }, C("hr")));
      continue;
    }
    const z = m.match(/^>\s?(.*)$/);
    if (z) {
      _(), y(), c.push(z[1]);
      continue;
    }
    const N = m.match(/^\s*[-*+]\s+(.+)$/), G = m.match(/^\s*\d+[.)]\s+(.+)$/);
    if (N || G) {
      _(), T();
      const P = !!G;
      g.length && g[0].ordered !== P && y(), g.push({ ordered: P, text: ((G == null ? void 0 : G[1]) || (N == null ? void 0 : N[1]) || "").trim() });
      continue;
    }
    T(), y(), u.push(m);
  }
  v && $(), w();
  const ee = Ln(o, i.trailingInlineAction);
  return ee.length > 0 ? ee : e;
}
function zn() {
  const { t: e } = Nt(), [i, s] = M([]), [o, u] = M(null), [c, g] = M([]), [x, v] = M(null), [I, C] = M(""), [_, T] = M(""), [y, w] = M(!1), [$, ee] = M(""), [m, H] = M([]), [S, z] = M(null), [N, G] = M([]), [P, Ve] = M([]), [Ke, Ee] = M(""), [q, xt] = M("medium"), [se, vt] = M(() => an(on)), [X, wt] = M(null), [Ae, E] = M(""), [le, W] = M(null), [be, ge] = M(""), [kt, xe] = M(null), [ve, he] = M(!0), [h, St] = M(() => typeof window < "u" ? window.innerWidth <= rt : !1), Je = ie(null), Xe = ie(null), $e = ie(null), we = ie(null), U = ie(null), V = ie(null), We = ie(null);
  oe(() => {
    J.listConversations().then(s).catch(() => {
    }), J.getUserInfo().then(wt).catch(() => {
    });
    let t = !1;
    return J.listPlatforms().then(async (l) => {
      if (t) return;
      G(l);
      const p = await Promise.all(l.map((f) => J.listModels(f.name).catch(() => [])));
      if (t) return;
      const b = p.flat();
      Ve(b), Ee((f) => b.some((R) => ye(R) === f) ? f : b[0] ? ye(b[0]) : "");
    }).catch((l) => {
      t || (Ve([]), Ee(""), W(null), E(l instanceof Error ? l.message : "Failed to load models"));
    }), () => {
      t = !0;
    };
  }, []), oe(() => {
    U.current = o;
  }, [o]), oe(() => {
    if (!o || o === O) {
      g([]);
      return;
    }
    if (We.current === o) {
      We.current = null;
      return;
    }
    J.listMessages(o).then(g).catch(() => {
    });
  }, [o]), oe(() => {
    var t;
    (t = Je.current) == null || t.scrollIntoView({ behavior: "smooth" });
  }, [c, I, _]), oe(() => {
    if (typeof window > "u") return;
    const t = window.matchMedia(`(max-width: ${rt}px)`), l = (p) => {
      St(p ? p.matches : t.matches);
    };
    return l(), t.addEventListener ? (t.addEventListener("change", l), () => t.removeEventListener("change", l)) : (t.addListener(l), () => t.removeListener(l));
  }, []), oe(() => {
    he(!h);
  }, [h]), oe(() => {
    if (!be) return;
    const t = window.setTimeout(() => ge(""), 1400);
    return () => window.clearTimeout(t);
  }, [be]);
  const Y = B(() => 0, []), He = B((t) => {
    vt((l) => ({ ...l, ...t }));
  }, []), Z = P.find((t) => ye(t) === Ke), L = (Z == null ? void 0 : Z.id) || "", Mt = (Z == null ? void 0 : Z.platform) || "", ke = Te(Z), me = Be(Z), de = mt(se), It = cn(se), A = Mt, Ye = B(() => {
    const t = (/* @__PURE__ */ new Date()).toISOString(), l = {
      id: O,
      user_id: (X == null ? void 0 : X.id) || 0,
      title: "",
      group_id: Y(),
      platform: A,
      model: L,
      created_at: t,
      updated_at: t
    };
    s((p) => [l, ...p.filter((b) => b.id !== O)]), u(O), g([]), H([]), E(""), W(null), h && he(!1);
  }, [h, Y, A, L, X == null ? void 0 : X.id]), Ct = B(async (t) => {
    var p, b;
    if (await ((b = (p = window.airgate) == null ? void 0 : p.confirm) == null ? void 0 : b.call(p, e("playground.delete_conversation_confirm"), {
      title: e("playground.delete_conversation"),
      danger: !0
    }))) {
      if (t === O) {
        s((f) => f.filter((R) => R.id !== t)), o === t && (u(null), g([]));
        return;
      }
      try {
        await J.deleteConversation(t), s((f) => f.filter((R) => R.id !== t)), o === t && (u(null), g([]));
      } catch {
      }
    }
  }, [o, e]), Q = B(async ({
    conversationID: t,
    requestMessages: l,
    model: p,
    groupID: b,
    platform: f,
    isImageRequest: R,
    imageSize: k,
    supportsReasoning: ne,
    reasoningEffort: K,
    titleContent: et
  }) => {
    const Pe = {
      conversationID: t,
      requestMessages: l.map((re) => ({ ...re })),
      model: p,
      groupID: b,
      platform: f,
      isImageRequest: R,
      imageSize: k,
      supportsReasoning: ne,
      reasoningEffort: K
    };
    E(""), W(null), w(!0), v(t), V.current = { conversationId: t, model: p }, C(""), T("");
    try {
      const re = new AbortController();
      Xe.current = re;
      let Ce = "", Oe = "";
      await Zt(
        f,
        {
          model: p,
          messages: l.map((j) => ({ role: j.role, content: Mn(j.role, j.content) })),
          stream: !0,
          ...R && k ? { size: k } : {},
          ...ne ? { reasoning_effort: K ?? q } : {}
        },
        {
          onData: (j) => {
            Ce += j, C(Ce);
          },
          onReasoning: (j) => {
            Oe += j, T(Oe);
          },
          onDone: async (j) => {
            if (!Ce) {
              U.current === t && (E(e("playground.no_response")), W(Pe)), C(""), T(""), v(null), V.current = null, w(!1);
              return;
            }
            const Gt = await J.persistMessage({
              conversation_id: t,
              role: "assistant",
              content: Ce,
              reasoning: Oe,
              platform: f,
              model: j.model || p,
              group_id: b,
              input_tokens: j.input_tokens,
              output_tokens: j.output_tokens,
              cost: j.cost
            });
            U.current === t && g((Ge) => [...Ge, Gt]), W(null), et && s((Ge) => Ge.map(
              (_e) => _e.id === t && !_e.title ? { ..._e, title: Sn(et), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : _e
            )), C(""), T(""), v(null), V.current = null, w(!1);
          },
          onError: (j) => {
            U.current === t && (E(j), W(Pe)), w(!1), C(""), T(""), v(null), V.current = null;
          }
        },
        re.signal
      );
    } catch (re) {
      U.current === t && (E(re instanceof Error ? re.message : "stream failed"), W(Pe)), w(!1), C(""), T(""), v(null), V.current = null;
    }
  }, [q, e]), je = B(async () => {
    if (!$.trim() && m.length === 0 || y || !o) return;
    const t = wn($, m), l = Y();
    let p = o;
    const b = [...c, {
      id: Date.now(),
      conversation_id: o,
      role: "user",
      content: t,
      reasoning_effort: me ? q : void 0,
      platform: A,
      model: L,
      group_id: l,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    ee(""), H([]), $e.current && ($e.current.style.height = "24px"), we.current && (we.current.value = ""), E(""), W(null), g(b), w(!0), v(p), V.current = { conversationId: p, model: L }, C(""), T("");
    try {
      if (!A || !L)
        throw new Error("Model required");
      if (p === O) {
        const f = await J.createConversation({
          title: "",
          group_id: l,
          platform: A,
          model: L
        });
        p = f.id, U.current === O && (U.current = f.id, We.current = f.id, u(f.id), g((R) => R.map((k) => ({ ...k, conversation_id: f.id })))), s((R) => [f, ...R.filter((k) => k.id !== O)]);
      }
      await J.persistMessage({
        conversation_id: p,
        role: "user",
        content: t,
        reasoning_effort: me ? q : void 0,
        platform: A,
        model: L,
        group_id: l
      }), await Q({
        conversationID: p,
        requestMessages: b.map((f) => ({ ...f, conversation_id: p })),
        model: L,
        groupID: l,
        platform: A,
        isImageRequest: ke,
        imageSize: ke ? de : void 0,
        supportsReasoning: me,
        reasoningEffort: q,
        titleContent: t
      });
    } catch (f) {
      U.current === p && E(f instanceof Error ? f.message : "stream failed"), w(!1), C(""), T(""), v(null), V.current = null;
    }
  }, [o, $, y, c, m, q, Y, de, A, L, ke, me, Q]), Se = B(async (t) => {
    if (t.length)
      try {
        const l = await kn(t);
        if (!l.length) return;
        H((p) => [...p, ...l]), E(""), W(null);
      } catch (l) {
        W(null), E(l instanceof Error ? l.message : "Failed to read image");
      }
  }, []), _t = B(async (t) => {
    await Se(Array.from(t.target.files || [])), t.target.value = "";
  }, [Se]), Bt = B((t) => {
    const l = Array.from(t.clipboardData.items).filter((p) => p.kind === "file" && p.type.startsWith("image/")).map((p) => p.getAsFile()).filter((p) => !!p);
    l.length && Se(l);
  }, [Se]), Rt = B((t) => {
    H((l) => l.filter((p) => p.id !== t));
  }, []), Tt = B(() => {
    var l;
    (l = Xe.current) == null || l.abort();
    const t = V.current;
    if (I || _) {
      const p = t == null ? void 0 : t.conversationId;
      p && U.current === p && g((b) => [...b, {
        id: Date.now() + 1,
        conversation_id: p,
        role: "assistant",
        content: I,
        reasoning: _,
        platform: "",
        model: t.model,
        group_id: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    }
    C(""), T(""), v(null), V.current = null, w(!1);
  }, [I, _]), D = i.find((t) => t.id === o), De = c[c.length - 1], Lt = !!(o && o !== O && (De == null ? void 0 : De.role) === "user" && !Ae && !y), te = y && x === o, Ze = !!($.trim() || m.length > 0) && !!(A && L) && !y, zt = B((t) => {
    if (t.key === "Enter" && !t.shiftKey) {
      if (t.preventDefault(), !A || !L) {
        W(null), E("Select a model first");
        return;
      }
      je();
    }
  }, [L, A, je]), Et = B(() => {
    var t;
    (t = we.current) == null || t.click();
  }, []), At = B((t) => {
    t.style.height = "auto", t.style.height = Math.min(t.scrollHeight, 200) + "px";
  }, []), $t = B((t) => {
    u(t), E(""), W(null), h && he(!1);
  }, [h]), Wt = B(() => {
    if (!le || y || o !== le.conversationID) return;
    const t = le;
    E(""), W(null), Q({
      ...t,
      requestMessages: t.requestMessages.map((l) => ({ ...l }))
    });
  }, [o, y, le, Q]), Ht = B(() => {
    if (y || !o || o === O) return;
    const t = c[c.length - 1];
    if ((t == null ? void 0 : t.role) !== "user") return;
    const l = t.model || (D == null ? void 0 : D.model) || L, p = t.platform || (D == null ? void 0 : D.platform) || A;
    if (!l || !p) {
      E("Model required");
      return;
    }
    const b = P.find((k) => k.id === l && k.platform === p) || P.find((k) => k.id === l), f = Te(b) || ft(l), R = Be(b) || !!t.reasoning_effort;
    E(""), W(null), Q({
      conversationID: o,
      requestMessages: c.map((k) => ({ ...k })),
      model: l,
      groupID: t.group_id || (D == null ? void 0 : D.group_id) || Y(),
      platform: p,
      isImageRequest: f,
      imageSize: f ? de : void 0,
      supportsReasoning: R,
      reasoningEffort: t.reasoning_effort || q
    });
  }, [D, o, y, c, P, q, Y, de, L, A, Q]), jt = B((t, l) => {
    z({ url: t, alt: l });
  }, []), Dt = B((t, l) => {
    bn(t, l).then(() => ge(e("playground.download_started"))).catch(() => ge(e("playground.download_failed")));
  }, [e]), Pt = B((t) => {
    if (y || !o || o === O) return;
    const l = c.slice(0, t).map((K) => K.role).lastIndexOf("user");
    if (l < 0) {
      W(null), E(e("playground.no_image_prompt"));
      return;
    }
    const p = c.slice(0, l + 1), b = c[l], f = c[t], R = f.model || L, k = f.platform || b.platform || A, ne = P.find((K) => K.id === R && K.platform === k) || P.find((K) => K.id === R);
    Q({
      conversationID: o,
      requestMessages: p,
      model: R,
      groupID: f.group_id || b.group_id || Y(),
      platform: k,
      isImageRequest: !0,
      imageSize: de,
      supportsReasoning: Be(ne)
    });
  }, [o, y, c, P, Y, de, A, L, Q, e]), Ot = B((t) => {
    xn(t).then(() => ge("Message copied")).catch(() => ge("Copy failed"));
  }, []), Me = {
    onImagePreview: jt,
    imagePreviewTitle: e("playground.preview_image"),
    generatedImageAlt: e("playground.generated_image")
  }, Ie = (t, l = "Copy message", p = !1, b = {}) => /* @__PURE__ */ r(
    "button",
    {
      type: "button",
      style: { ...n.messageCopyBtn, ...b },
      title: l,
      "aria-label": l,
      onClick: (f) => {
        p && (f.preventDefault(), f.stopPropagation()), Ot(t);
      },
      children: /* @__PURE__ */ d("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ r("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
        /* @__PURE__ */ r("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
      ] })
    }
  ), Qe = (t, l) => {
    const p = h || kt === t, b = un(l), R = hn(l) ? /* @__PURE__ */ r("span", { style: {
      ...n.messageCopyAfterText,
      ...p ? n.messageCopyAfterTextVisible : null
    }, children: Ie(b, "Copy message", !1, n.messageCopyAfterTextBtn) }) : void 0;
    return /* @__PURE__ */ r(
      "div",
      {
        style: n.messageContent,
        onMouseEnter: () => xe(t),
        onMouseLeave: () => xe((k) => k === t ? null : k),
        onFocus: () => xe(t),
        onBlur: (k) => {
          k.currentTarget.contains(k.relatedTarget) || xe((ne) => ne === t ? null : ne);
        },
        children: Re(l, {
          ...Me,
          trailingInlineAction: R
        })
      }
    );
  };
  return /* @__PURE__ */ d("div", { "data-full-bleed": !0, style: n.layout, children: [
    ve && h && /* @__PURE__ */ r(
      "div",
      {
        style: n.sidebarBackdrop,
        onClick: () => he(!1)
      }
    ),
    S && /* @__PURE__ */ r(
      "div",
      {
        style: n.imagePreviewOverlay,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": S.alt || e("playground.image_preview"),
        onClick: () => z(null),
        children: /* @__PURE__ */ d("div", { style: n.imagePreviewModal, onClick: (t) => t.stopPropagation(), children: [
          /* @__PURE__ */ r("img", { src: S.url, alt: S.alt, style: n.imagePreviewLarge }),
          /* @__PURE__ */ r(
            "button",
            {
              type: "button",
              style: n.imagePreviewCloseBtn,
              onClick: () => z(null),
              "aria-label": e("playground.close_image_preview"),
              children: "×"
            }
          )
        ] })
      }
    ),
    ve && /* @__PURE__ */ d("div", { style: { ...n.sidebar, ...h ? n.sidebarMobile : null }, children: [
      /* @__PURE__ */ d("div", { style: n.sidebarHeader, children: [
        /* @__PURE__ */ r("span", { style: n.sidebarTitle, children: e("playground.conversations") }),
        /* @__PURE__ */ r(
          "button",
          {
            style: n.newBtn,
            onClick: Ye,
            title: e("playground.new_conversation"),
            children: /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M7 1v12M1 7h12" }) })
          }
        )
      ] }),
      /* @__PURE__ */ d("div", { style: n.convList, children: [
        i.map((t) => {
          const l = t.id === o;
          return /* @__PURE__ */ d(
            "div",
            {
              style: {
                ...n.convItem,
                background: l ? a("primarySubtle") : "transparent",
                borderColor: l ? a("borderFocus") : "transparent"
              },
              onClick: () => $t(t.id),
              children: [
                /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: a(l ? "primary" : "textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ r("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
                /* @__PURE__ */ r("span", { style: {
                  ...n.convTitle,
                  color: a(l ? "text" : "textSecondary")
                }, children: t.title || e("playground.new_conversation") }),
                /* @__PURE__ */ r(
                  "button",
                  {
                    style: n.deleteBtn,
                    onClick: (p) => {
                      p.stopPropagation(), Ct(t.id);
                    },
                    title: e("playground.delete_conversation"),
                    children: /* @__PURE__ */ r("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M2 2l8 8M10 2l-8 8" }) })
                  }
                )
              ]
            },
            t.id
          );
        }),
        i.length === 0 && /* @__PURE__ */ d("div", { style: n.emptyConvList, children: [
          /* @__PURE__ */ r("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: a("textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5 }, children: /* @__PURE__ */ r("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ r("span", { children: e("playground.no_conversations") })
        ] })
      ] }),
      X && /* @__PURE__ */ d("div", { style: n.balanceBar, children: [
        /* @__PURE__ */ r("span", { style: n.balanceLabel, children: e("playground.balance") }),
        /* @__PURE__ */ d("span", { style: n.balanceValue, children: [
          "$",
          X.balance.toFixed(4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ d("div", { style: n.main, children: [
      /* @__PURE__ */ d("div", { style: { ...n.topBar, ...h ? n.topBarMobile : null }, children: [
        /* @__PURE__ */ d("div", { style: { ...n.topBarLeft, ...h ? n.topBarLeftMobile : null }, children: [
          /* @__PURE__ */ r("button", { style: n.toggleBtn, onClick: () => he(!ve), children: /* @__PURE__ */ r("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: ve ? /* @__PURE__ */ d(fe, { children: [
            /* @__PURE__ */ r("path", { d: "M6 2v12" }),
            /* @__PURE__ */ r("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ r("path", { d: "M10 6l-2 2 2 2" })
          ] }) : /* @__PURE__ */ d(fe, { children: [
            /* @__PURE__ */ r("path", { d: "M6 2v12" }),
            /* @__PURE__ */ r("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ r("path", { d: "M8 6l2 2-2 2" })
          ] }) }) }),
          /* @__PURE__ */ d("div", { style: { ...n.selectors, ...h ? n.selectorsMobile : null }, children: [
            /* @__PURE__ */ d("div", { style: { ...n.selectorGroup, ...h ? n.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ r("label", { style: n.selectorLabel, children: e("playground.model") }),
              /* @__PURE__ */ r(
                "select",
                {
                  style: { ...n.select, ...h ? n.selectMobile : null },
                  value: Ke,
                  onChange: (t) => Ee(t.target.value),
                  children: P.map((t) => /* @__PURE__ */ d("option", { value: ye(t), children: [
                    t.name || t.id,
                    " · ",
                    In(N, t.platform),
                    Te(t) ? " · image" : Be(t) ? " · reasoning" : ""
                  ] }, ye(t)))
                }
              )
            ] }),
            ke && /* @__PURE__ */ d(fe, { children: [
              !h && /* @__PURE__ */ r("div", { style: n.selectorDivider }),
              /* @__PURE__ */ d("div", { style: { ...n.selectorGroup, ...h ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ r("label", { style: n.selectorLabel, children: "Size" }),
                /* @__PURE__ */ d("div", { style: { ...n.imageSizeInlineControls, ...h ? n.imageSizeInlineControlsMobile : null }, children: [
                  /* @__PURE__ */ d(
                    "select",
                    {
                      style: { ...n.imageSizeMiniSelect, ...h ? n.imageSizeMiniSelectMobile : null },
                      value: se.mode,
                      onChange: (t) => He({ mode: t.target.value }),
                      "aria-label": "Image size mode",
                      children: [
                        /* @__PURE__ */ r("option", { value: "auto", children: "Auto" }),
                        /* @__PURE__ */ r("option", { value: "ratio", children: "Ratio" })
                      ]
                    }
                  ),
                  se.mode === "ratio" && /* @__PURE__ */ d(fe, { children: [
                    /* @__PURE__ */ r(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...h ? n.imageSizeMiniSelectMobile : null },
                        value: se.baseResolution,
                        onChange: (t) => He({ baseResolution: Number(t.target.value) }),
                        "aria-label": "Base resolution",
                        children: nn.map((t) => /* @__PURE__ */ r("option", { value: t.value, children: t.label }, t.value))
                      }
                    ),
                    /* @__PURE__ */ r(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...h ? n.imageSizeMiniSelectMobile : null },
                        value: se.ratio,
                        onChange: (t) => He({ ratio: t.target.value }),
                        "aria-label": "Image ratio",
                        children: rn.map((t) => /* @__PURE__ */ r("option", { value: t.value, children: t.label }, t.value))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ r("span", { style: n.imageSizeInlinePreview, children: It })
                ] })
              ] })
            ] }),
            me && /* @__PURE__ */ d(fe, { children: [
              !h && /* @__PURE__ */ r("div", { style: n.selectorDivider }),
              /* @__PURE__ */ d("div", { style: { ...n.selectorGroup, ...h ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ r("label", { style: n.selectorLabel, children: "Effort" }),
                /* @__PURE__ */ d(
                  "select",
                  {
                    style: { ...n.select, ...h ? n.selectMobile : null },
                    value: q,
                    onChange: (t) => xt(t.target.value),
                    children: [
                      /* @__PURE__ */ r("option", { value: "minimal", children: "Minimal" }),
                      /* @__PURE__ */ r("option", { value: "low", children: "Low" }),
                      /* @__PURE__ */ r("option", { value: "medium", children: "Medium" }),
                      /* @__PURE__ */ r("option", { value: "high", children: "High" }),
                      /* @__PURE__ */ r("option", { value: "xhigh", children: "XHigh" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        D && /* @__PURE__ */ r("span", { style: { ...n.topBarTitle, ...h ? n.topBarTitleMobile : null }, children: D.title || e("playground.new_conversation") })
      ] }),
      /* @__PURE__ */ d("div", { style: n.messagesArea, children: [
        !o && /* @__PURE__ */ d("div", { style: { ...n.emptyState, ...h ? n.emptyStateMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: n.emptyIcon, children: /* @__PURE__ */ d("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [
            /* @__PURE__ */ r("rect", { x: "4", y: "4", width: "40", height: "40", rx: "20", fill: a("primarySubtle") }),
            /* @__PURE__ */ r("path", { d: "M24 16v6m0 0v6m0-6h6m-6 0h-6", stroke: a("primary"), strokeWidth: "2", strokeLinecap: "round" })
          ] }) }),
          /* @__PURE__ */ r("div", { style: n.emptyTitle, children: e("playground.empty_title") }),
          /* @__PURE__ */ r("div", { style: n.emptyDesc, children: e("playground.empty_description") }),
          /* @__PURE__ */ d("button", { style: n.emptyBtn, onClick: Ye, children: [
            /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M7 1v12M1 7h12" }) }),
            e("playground.new_conversation")
          ] })
        ] }),
        o && c.map((t, l) => /* @__PURE__ */ d("div", { style: { ...n.messageRow, ...h ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: t.role === "user" ? n.avatarUser : n.avatarAssistant, children: t.role === "user" ? /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ r("circle", { cx: "12", cy: "7", r: "4" })
          ] }) : /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: n.messageBody, children: [
            /* @__PURE__ */ r("div", { style: n.messageHeader, children: /* @__PURE__ */ r("div", { style: n.messageRole, children: t.role === "user" ? e("playground.you") : e("playground.assistant") }) }),
            t.role === "assistant" && t.reasoning && /* @__PURE__ */ d("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ d("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ r("span", { children: "Thinking" }),
                Ie(t.reasoning, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ r("div", { style: n.reasoningContent, children: Re(t.reasoning, Me) })
            ] }),
            Qe(`message-${t.id}`, t.content),
            t.role === "assistant" && (ot(t.content) || t.model) && (() => {
              const p = gn(t.content);
              return /* @__PURE__ */ d("div", { style: ot(t.content) ? n.imageMessageActions : n.messageMeta, children: [
                p && /* @__PURE__ */ r(
                  "button",
                  {
                    type: "button",
                    style: n.imageDownloadBtn,
                    title: e("playground.download_image"),
                    "aria-label": e("playground.download_image"),
                    onClick: () => Dt(p.url, p.alt || e("playground.generated_image")),
                    children: /* @__PURE__ */ d("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ r("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                      /* @__PURE__ */ r("path", { d: "M7 10l5 5 5-5" }),
                      /* @__PURE__ */ r("path", { d: "M12 15V3" })
                    ] })
                  }
                ),
                p && /* @__PURE__ */ r(
                  "button",
                  {
                    type: "button",
                    style: { ...n.regenerateImageBtn, opacity: y ? 0.5 : 1 },
                    onClick: () => Pt(l),
                    disabled: y,
                    title: e("playground.retry_image"),
                    "aria-label": e("playground.retry_image"),
                    children: /* @__PURE__ */ d("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ r("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                      /* @__PURE__ */ r("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                      /* @__PURE__ */ r("path", { d: "M19 2v4h-4" }),
                      /* @__PURE__ */ r("path", { d: "M5 22v-4h4" })
                    ] })
                  }
                ),
                t.model && /* @__PURE__ */ r("span", { style: n.metaBadge, children: t.model })
              ] });
            })()
          ] })
        ] }, t.id)),
        te && I && /* @__PURE__ */ d("div", { style: { ...n.messageRow, ...h ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: n.avatarAssistant, children: /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: n.messageBody, children: [
            /* @__PURE__ */ r("div", { style: n.messageHeader, children: /* @__PURE__ */ r("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            _ && /* @__PURE__ */ d("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ d("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ r("span", { children: "Thinking" }),
                Ie(_, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ r("div", { style: n.reasoningContent, children: Re(_, Me) })
            ] }),
            Qe(`stream-${x || "active"}`, I),
            /* @__PURE__ */ d("div", { style: n.messageMeta, children: [
              /* @__PURE__ */ r("span", { style: n.streamingDot }),
              /* @__PURE__ */ r("span", { children: e("playground.streaming") })
            ] })
          ] })
        ] }),
        te && !I && /* @__PURE__ */ d("div", { style: { ...n.messageRow, ...h ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: n.avatarAssistant, children: /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: n.messageBody, children: [
            /* @__PURE__ */ r("div", { style: n.messageHeader, children: /* @__PURE__ */ r("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            _ ? /* @__PURE__ */ d("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ d("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ r("span", { children: "Thinking" }),
                Ie(_, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ r("div", { style: n.reasoningContent, children: Re(_, Me) })
            ] }) : /* @__PURE__ */ r("div", { style: { ...n.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ r("span", { style: n.thinkingDots, children: e("playground.thinking") }) })
          ] })
        ] }),
        Lt && /* @__PURE__ */ d("div", { style: { ...n.errorBar, ...n.recoverableBar, ...h ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ r("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ r("span", { style: n.errorMessage, children: e("playground.response_unfinished", { defaultValue: "Response was interrupted before the assistant replied." }) }),
          /* @__PURE__ */ d(
            "button",
            {
              type: "button",
              style: n.recoverableRetryBtn,
              onClick: Ht,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ d("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ r("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ r("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ r("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ r("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        Ae && /* @__PURE__ */ d("div", { style: { ...n.errorBar, ...h ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ r("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ r("span", { style: n.errorMessage, children: Ae }),
          le && le.conversationID === o && !y && /* @__PURE__ */ d(
            "button",
            {
              type: "button",
              style: n.errorRetryBtn,
              onClick: Wt,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ d("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ r("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ r("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ r("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ r("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        be && /* @__PURE__ */ r("div", { style: n.interactionNotice, children: be }),
        /* @__PURE__ */ r("div", { ref: Je })
      ] }),
      o && /* @__PURE__ */ r("div", { style: { ...n.inputArea, ...h ? n.inputAreaMobile : null }, children: /* @__PURE__ */ d("div", { style: { ...n.inputWrapper, ...te ? n.inputWrapperStreaming : null }, children: [
        m.length > 0 && /* @__PURE__ */ r("div", { style: n.imagePreviewList, children: m.map((t) => /* @__PURE__ */ d("div", { style: n.imagePreviewItem, children: [
          /* @__PURE__ */ r("img", { src: t.url, alt: t.name, style: n.imagePreview }),
          /* @__PURE__ */ r(
            "button",
            {
              type: "button",
              style: n.removeImageBtn,
              onClick: () => Rt(t.id),
              "aria-label": `Remove ${t.name}`,
              children: "×"
            }
          )
        ] }, t.id)) }),
        /* @__PURE__ */ r(
          "textarea",
          {
            ref: $e,
            style: n.textarea,
            value: $,
            onChange: (t) => {
              ee(t.target.value), At(t.target);
            },
            onPaste: Bt,
            onKeyDown: zt,
            placeholder: e("playground.input_placeholder"),
            rows: 1,
            disabled: te
          }
        ),
        /* @__PURE__ */ r(
          "input",
          {
            ref: we,
            type: "file",
            accept: "image/*",
            multiple: !0,
            style: n.fileInput,
            onChange: _t,
            disabled: te
          }
        ),
        /* @__PURE__ */ d("div", { style: { ...n.inputActions, ...h ? n.inputActionsMobile : null }, children: [
          /* @__PURE__ */ r("span", { style: { ...n.inputHint, ...h ? n.inputHintMobile : null }, children: e("playground.input_hint") }),
          /* @__PURE__ */ d("div", { style: { ...n.inputButtonGroup, ...h ? n.inputButtonGroupMobile : null }, children: [
            /* @__PURE__ */ d(
              "button",
              {
                type: "button",
                style: { ...n.attachBtn, ...h ? n.actionBtnMobile : null },
                onClick: Et,
                disabled: te,
                title: "Attach images",
                children: [
                  /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ r("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
                    /* @__PURE__ */ r("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                    /* @__PURE__ */ r("path", { d: "M21 15l-5-5L5 21" })
                  ] }),
                  "Image"
                ]
              }
            ),
            te ? /* @__PURE__ */ d("button", { style: { ...n.stopBtn, ...h ? n.actionBtnMobile : null }, onClick: Tt, children: [
              /* @__PURE__ */ r("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ r("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
              e("playground.stop")
            ] }) : /* @__PURE__ */ d(
              "button",
              {
                style: {
                  ...n.sendBtn,
                  ...h ? n.actionBtnMobile : null,
                  opacity: Ze ? 1 : 0.4
                },
                onClick: je,
                disabled: !Ze,
                title: A && L ? void 0 : "Select a model first",
                children: [
                  /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ r("path", { d: "M22 2L11 13" }),
                    /* @__PURE__ */ r("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                  ] }),
                  e("playground.send")
                ]
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ r("style", { children: En })
  ] });
}
const En = `
@keyframes pg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pg-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`, n = {
  layout: {
    display: "flex",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    position: "relative",
    isolation: "isolate",
    background: a("bgDeep"),
    fontFamily: a("fontSans"),
    color: a("text"),
    overflow: "hidden"
  },
  // ── Sidebar ──
  sidebar: {
    width: 280,
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: a("bg"),
    borderRight: `1px solid ${a("borderSubtle")}`,
    position: "relative",
    zIndex: 3
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
    padding: "18px 16px 14px"
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: a("textTertiary")
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: `1px solid ${a("border")}`,
    borderRadius: a("radiusSm"),
    background: a("bgSurface"),
    color: a("textSecondary"),
    cursor: "pointer",
    transition: a("transition")
  },
  convList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 8px"
  },
  convItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 10px",
    borderRadius: a("radiusSm"),
    cursor: "pointer",
    transition: a("transition"),
    border: "1px solid transparent",
    marginBottom: 2
  },
  convTitle: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    lineHeight: "18px"
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: a("textTertiary"),
    cursor: "pointer",
    padding: "2px",
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.5,
    transition: a("transition"),
    marginTop: 1
  },
  emptyConvList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    color: a("textTertiary"),
    fontSize: 12
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: `1px solid ${a("borderSubtle")}`
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: a("textTertiary")
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: a("fontMono"),
    color: a("primary")
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
  // ── Top bar ──
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "8px 20px",
    borderBottom: `1px solid ${a("borderSubtle")}`,
    background: a("bg"),
    flexShrink: 0,
    minHeight: 52
  },
  topBarMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    padding: "8px 12px",
    gap: 8
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  topBarLeftMobile: {
    width: "100%",
    alignItems: "flex-start",
    gap: 8
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "none",
    borderRadius: a("radiusSm"),
    background: "transparent",
    color: a("textSecondary"),
    cursor: "pointer",
    transition: a("transition"),
    flexShrink: 0
  },
  selectors: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: a("bgSurface"),
    borderRadius: a("radiusSm"),
    border: `1px solid ${a("borderSubtle")}`,
    overflow: "hidden"
  },
  selectorsMobile: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "stretch",
    gap: 6,
    padding: 6,
    overflow: "visible"
  },
  selectorGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    minWidth: 0
  },
  selectorGroupMobile: {
    minWidth: 0,
    padding: 0,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 3
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: a("textTertiary"),
    whiteSpace: "nowrap"
  },
  selectorDivider: {
    width: 1,
    height: 24,
    background: a("borderSubtle"),
    flexShrink: 0
  },
  select: {
    padding: "2px 4px",
    border: "none",
    background: "transparent",
    color: a("text"),
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    fontFamily: a("fontSans"),
    minWidth: 0
  },
  selectMobile: {
    width: "100%",
    minHeight: 30,
    borderRadius: a("radiusSm"),
    padding: "5px 7px",
    background: a("bgDeep"),
    fontSize: 12
  },
  imageSizeInlineControls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0
  },
  imageSizeInlineControlsMobile: {
    flexWrap: "wrap"
  },
  imageSizeMiniSelect: {
    height: 28,
    maxWidth: 96,
    padding: "3px 6px",
    border: `1px solid ${a("borderSubtle")}`,
    borderRadius: a("radiusSm"),
    background: a("bgDeep"),
    color: a("text"),
    fontSize: 12,
    fontWeight: 600,
    outline: "none",
    fontFamily: a("fontSans")
  },
  imageSizeMiniSelectMobile: {
    flex: "1 1 74px",
    maxWidth: "none"
  },
  imageSizeInlinePreview: {
    minWidth: 82,
    padding: "3px 7px",
    borderRadius: a("radiusSm"),
    background: a("primarySubtle"),
    color: a("primary"),
    fontSize: 12,
    fontWeight: 700,
    fontFamily: a("fontMono"),
    whiteSpace: "nowrap"
  },
  topBarTitle: {
    fontSize: 12,
    color: a("textTertiary"),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  topBarTitleMobile: {
    width: "100%",
    display: "none"
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
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 12,
    padding: 40,
    animation: "pg-fadein 0.4s ease-out"
  },
  emptyStateMobile: {
    padding: "32px 20px"
  },
  emptyIcon: {
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: a("text"),
    letterSpacing: "-0.02em"
  },
  emptyDesc: {
    fontSize: 13,
    color: a("textSecondary"),
    maxWidth: 300,
    textAlign: "center",
    lineHeight: 1.5
  },
  emptyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    border: "none",
    borderRadius: a("radiusMd"),
    background: a("primary"),
    color: a("textInverse"),
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: a("transition"),
    marginTop: 8,
    fontFamily: a("fontSans")
  },
  // ── Message row ──
  messageRow: {
    display: "flex",
    gap: 14,
    padding: "20px 28px",
    animation: "pg-fadein 0.25s ease-out",
    borderBottom: `1px solid ${a("borderSubtle")}`
  },
  messageRowMobile: {
    gap: 10,
    padding: "16px 14px"
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: a("primary"),
    color: a("textInverse"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarAssistant: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: a("bgSurface"),
    border: `1px solid ${a("border")}`,
    color: a("textSecondary"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  messageBody: {
    flex: 1,
    minWidth: 0
  },
  messageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 24,
    marginBottom: 4
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 600,
    color: a("text")
  },
  messageCopyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px solid ${a("borderSubtle")}`,
    borderRadius: "999px",
    background: "transparent",
    color: a("textTertiary"),
    cursor: "pointer",
    transition: a("transition")
  },
  messageCopyAfterText: {
    display: "inline-flex",
    verticalAlign: "text-bottom",
    marginLeft: 6,
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(1px)",
    transition: a("transition")
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
    color: "#cfd6e6"
  },
  markdownParagraph: {
    margin: "0 0 11px"
  },
  markdownH1: {
    margin: "2px 0 14px",
    fontSize: 21,
    lineHeight: 1.25,
    color: "#eef4ff",
    letterSpacing: "-0.02em"
  },
  markdownH2: {
    margin: "18px 0 10px",
    fontSize: 17,
    lineHeight: 1.3,
    color: "#e8eefb",
    letterSpacing: "-0.01em"
  },
  markdownH3: {
    margin: "16px 0 8px",
    fontSize: 15,
    lineHeight: 1.35,
    color: "#dfe7f6"
  },
  markdownH4: {
    margin: "14px 0 8px",
    fontSize: 14,
    lineHeight: 1.4,
    color: "#d8e0ef"
  },
  markdownList: {
    margin: "0 0 12px",
    paddingLeft: 20,
    color: "#cfd6e6"
  },
  markdownListItem: {
    margin: "4px 0"
  },
  markdownBlockquote: {
    margin: "0 0 12px",
    padding: "9px 13px",
    borderLeft: "3px solid rgba(62, 207, 180, 0.48)",
    borderRadius: "0 10px 10px 0",
    background: "rgba(62, 207, 180, 0.055)",
    color: "#aeb8ca"
  },
  markdownCodeBlock: {
    margin: "4px 0 14px",
    padding: "13px 15px",
    borderRadius: a("radiusSm"),
    background: "linear-gradient(180deg, rgba(17, 23, 36, 0.92), rgba(10, 14, 24, 0.92))",
    border: "1px solid rgba(148, 175, 225, 0.075)",
    color: "#d5deef",
    fontFamily: a("fontMono"),
    fontSize: 12.5,
    lineHeight: 1.72,
    overflowX: "auto",
    whiteSpace: "pre",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.025)"
  },
  markdownInlineCode: {
    padding: "1px 5px 2px",
    borderRadius: 6,
    background: "rgba(125, 211, 252, 0.08)",
    border: "1px solid rgba(125, 211, 252, 0.11)",
    color: "#b8e7ff",
    fontFamily: a("fontMono"),
    fontSize: "0.9em"
  },
  markdownLink: {
    color: "#6ee7d1",
    textDecoration: "underline",
    textDecorationColor: "rgba(110, 231, 209, 0.28)",
    textUnderlineOffset: 3
  },
  markdownDivider: {
    height: 1,
    border: 0,
    background: "linear-gradient(90deg, transparent, rgba(148, 175, 225, 0.14), transparent)",
    margin: "16px 0"
  },
  reasoningBox: {
    marginBottom: 10,
    padding: "10px 12px",
    borderRadius: a("radiusSm"),
    background: a("bgSurface"),
    border: `1px solid ${a("borderSubtle")}`
  },
  reasoningSummary: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: a("textSecondary"),
    userSelect: "none"
  },
  reasoningContent: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.6,
    wordBreak: "break-word",
    color: "#9ea9bd"
  },
  imageGroup: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 16,
    margin: "10px 0 6px"
  },
  generatedImageFrame: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flex: "1 1 260px",
    maxWidth: "min(100%, 420px)"
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
  generatedImage: {
    display: "block",
    maxHeight: 420,
    width: "100%",
    height: "auto",
    borderRadius: a("radiusMd"),
    border: `1px solid ${a("borderSubtle")}`,
    objectFit: "contain"
  },
  imageDownloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: "999px",
    border: `1px solid ${a("borderSubtle")}`,
    background: a("bgSurface"),
    color: a("textSecondary"),
    cursor: "pointer",
    transition: a("transition")
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
    border: `1px solid ${a("borderSubtle")}`,
    background: a("bgSurface"),
    color: a("textSecondary"),
    cursor: "pointer",
    transition: a("transition")
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
    borderRadius: a("radiusLg"),
    border: `1px solid ${a("border")}`,
    background: a("bgDeep"),
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
    background: a("bgDeep")
  },
  interactionNotice: {
    position: "sticky",
    bottom: 12,
    alignSelf: "center",
    zIndex: 4,
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(10, 14, 24, 0.9)",
    border: `1px solid ${a("borderSubtle")}`,
    color: a("textSecondary"),
    fontSize: 12,
    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)"
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: a("textTertiary")
  },
  metaBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "999px",
    background: a("bgSurface"),
    border: `1px solid ${a("borderSubtle")}`,
    fontSize: 11,
    fontFamily: a("fontMono"),
    color: a("textSecondary")
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: a("primary"),
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
    borderRadius: a("radiusSm"),
    background: a("dangerSubtle"),
    color: a("danger"),
    fontSize: 13,
    border: `1px solid ${a("danger")}`,
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
    background: a("primarySubtle"),
    color: a("primary"),
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
    color: a("danger"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: a("fontSans")
  },
  recoverableRetryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(45, 212, 191, 0.3)",
    background: "rgba(45, 212, 191, 0.12)",
    color: a("primary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: a("fontSans")
  },
  // ── Input ──
  inputArea: {
    padding: "16px 28px 20px",
    borderTop: `1px solid ${a("borderSubtle")}`,
    background: a("bg"),
    flexShrink: 0
  },
  inputAreaMobile: {
    padding: "10px 12px 12px"
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: `1px solid ${a("border")}`,
    borderRadius: a("radiusMd"),
    background: a("bgSurface"),
    padding: "10px 12px 8px",
    transition: a("transition")
  },
  inputWrapperStreaming: {
    paddingTop: 8,
    paddingBottom: 8
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
    borderRadius: a("radiusSm"),
    overflow: "hidden",
    border: `1px solid ${a("borderSubtle")}`,
    background: a("bgHover")
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
    color: a("text"),
    fontSize: 14,
    fontFamily: a("fontSans"),
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
    alignItems: "center",
    gap: 8
  },
  inputButtonGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  inputButtonGroupMobile: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-end"
  },
  fileInput: {
    display: "none"
  },
  inputHint: {
    fontSize: 11,
    color: a("textTertiary")
  },
  inputHintMobile: {
    display: "none"
  },
  attachBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: `1px solid ${a("border")}`,
    borderRadius: a("radiusSm"),
    background: a("bgSurface"),
    color: a("textSecondary"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: a("transition"),
    fontFamily: a("fontSans")
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: a("radiusSm"),
    background: a("primary"),
    color: a("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: a("transition"),
    fontFamily: a("fontSans")
  },
  stopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: a("radiusSm"),
    background: a("danger"),
    color: a("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: a("fontSans")
  },
  actionBtnMobile: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center"
  }
}, Hn = {
  routes: [
    { path: "/playground", component: zn }
  ]
};
export {
  Hn as default
};
