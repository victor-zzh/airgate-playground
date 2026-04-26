import { jsxs as c, jsx as o, Fragment as qe } from "react/jsx-runtime";
import { useState as M, useRef as ne, useEffect as Se, useCallback as S, isValidElement as Vn, cloneElement as Nt, Children as Gt } from "react";
import { useTranslation as Kn } from "react-i18next";
const en = {
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
}, Jn = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, Xn = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, Et = {
  ...Jn,
  ...Xn
}, tn = {
  dark: en
};
function Yn(e) {
  return e.replace(/[A-Z]/g, (i) => "-" + i.toLowerCase());
}
function nn(e = "ag") {
  return e.trim() || "ag";
}
function dt(e, i) {
  return `--${e}-${Yn(i)}`;
}
Object.keys(tn.dark).reduce((e, i) => (e[i] = dt("ag", i), e), {});
Object.keys(Et).reduce((e, i) => (e[i] = dt("ag", i), e), {});
function rn(e = {}) {
  const i = nn(e.prefix);
  return Object.keys(tn.dark).reduce((l, r) => (l[r] = dt(i, r), l), {});
}
function on(e = {}) {
  const i = nn(e.prefix);
  return Object.keys(Et).reduce((l, r) => (l[r] = dt(i, r), l), {});
}
const Zn = rn(), Qn = on();
function a(e, i = {}) {
  const l = i.prefix ? rn(i) : Zn, r = i.prefix ? on(i) : Qn;
  if (e in l) {
    const u = e;
    return `var(${l[u]}, ${en[u]})`;
  }
  const g = e;
  return `var(${r[g]}, ${Et[g]})`;
}
const Bt = "/api/v1/ext-user/airgate-playground", er = "/api/v1";
function Rt() {
  const e = {}, i = localStorage.getItem("token");
  return i && (e.Authorization = `Bearer ${i}`), e;
}
async function se(e, i, l, r = Bt) {
  const g = { ...Rt() };
  l !== void 0 && (g["Content-Type"] = "application/json");
  const u = await fetch(r + i, {
    method: e,
    headers: g,
    body: l ? JSON.stringify(l) : void 0
  });
  if (!u.ok) {
    const b = await u.text();
    let k = `HTTP ${u.status}`;
    try {
      const I = JSON.parse(b);
      k = I.error || I.message || k;
    } catch {
    }
    throw u.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login"), new Error(k);
  }
  const p = await u.text();
  return p ? JSON.parse(p) : null;
}
async function tr(e, i, l) {
  const r = await se(e, i, l, er);
  if (r.code !== 0)
    throw new Error(r.message || "request failed");
  return r.data;
}
const Q = {
  listConversations: () => se("GET", "/conversations"),
  createConversation: (e) => se("POST", "/conversations", e),
  getConversation: (e) => se("GET", `/conversations/${e}`),
  updateConversation: (e, i) => se("PUT", `/conversations/${e}`, i),
  deleteConversation: (e) => se("DELETE", `/conversations/${e}`),
  listMessages: (e) => se("GET", `/messages/${e}`),
  persistMessage: (e) => se("POST", "/messages", e),
  listPlatforms: async () => (await se("GET", "/platforms")).map((i) => {
    const l = i.name || i.Name || "", r = i.display_name || i.DisplayName || l;
    return { name: l, display_name: r };
  }).filter((i) => i.name),
  listModels: async (e) => {
    const i = await se("GET", `/models?platform=${encodeURIComponent(e)}`);
    return (Array.isArray(i) ? i : i.data || []).map((r) => {
      const g = r.id || r.ID || "";
      return {
        id: g,
        name: r.name || r.Name || g,
        platform: e,
        input_price: r.input_price ?? r.InputPrice ?? 0,
        output_price: r.output_price ?? r.OutputPrice ?? 0,
        context_window: r.context_window ?? r.ContextWindow ?? 0,
        max_output_tokens: r.max_output_tokens ?? r.MaxOutputTokens ?? 0,
        image_only: !!(r.image_only ?? r.ImageOnly),
        capabilities: r.capabilities || r.Capabilities || []
      };
    }).filter((r) => r.id);
  },
  getUserInfo: () => tr("GET", "/users/me")
};
async function nr(e, i, l) {
  var p;
  const r = await fetch(`${Bt}/images/edits`, {
    method: "POST",
    headers: {
      ...Rt(),
      Accept: "application/json",
      "X-Airgate-Platform": e
    },
    body: i,
    signal: l
  }), g = await r.text();
  let u = null;
  try {
    u = g ? JSON.parse(g) : null;
  } catch {
  }
  if (!r.ok) {
    r.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login");
    const b = u, k = typeof (b == null ? void 0 : b.error) == "string" ? b.error : ((p = b == null ? void 0 : b.error) == null ? void 0 : p.message) || (b == null ? void 0 : b.message) || `HTTP ${r.status}`;
    throw new Error(k);
  }
  return u || {};
}
async function Ut(e, i, l, r) {
  var T, B, R;
  const g = {
    ...i,
    stream_options: {
      include_usage: !0,
      ...i.stream_options
    }
  }, u = await fetch(`${Bt}/chat/completions`, {
    method: "POST",
    headers: {
      ...Rt(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Airgate-Platform": e
    },
    body: JSON.stringify(g),
    signal: r
  });
  if (!u.ok || !u.body) {
    const w = await u.text();
    let z = `HTTP ${u.status}`;
    try {
      const P = JSON.parse(w);
      z = ((T = P.error) == null ? void 0 : T.message) || P.error || P.message || z;
    } catch {
    }
    l.onError(z);
    return;
  }
  const p = u.body.getReader(), b = new TextDecoder();
  let k = "", I = { input_tokens: 0, output_tokens: 0, model: i.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: w, value: z } = await p.read();
      if (w) break;
      k += b.decode(z, { stream: !0 });
      const P = k.split(`
`);
      k = P.pop() || "";
      for (const re of P) {
        const F = re.trim();
        if (!F.startsWith("data: ")) continue;
        const ie = F.slice(6);
        if (ie === "[DONE]") {
          l.onDone(I);
          return;
        }
        try {
          const v = JSON.parse(ie);
          if (v.error) {
            l.onError(v.error.message || v.error);
            return;
          }
          const y = (R = (B = v.choices) == null ? void 0 : B[0]) == null ? void 0 : R.delta, W = y == null ? void 0 : y.reasoning_content;
          W && l.onReasoning(W);
          const U = y == null ? void 0 : y.content;
          U && l.onData(U), v.usage && (I = {
            input_tokens: v.usage.prompt_tokens || v.usage.input_tokens || 0,
            output_tokens: v.usage.completion_tokens || v.usage.output_tokens || 0,
            model: v.model || I.model,
            cost: v.usage.cost || 0
          });
        } catch {
        }
      }
    }
    l.onDone(I);
  } catch (w) {
    if (r != null && r.aborted) return;
    l.onError(w instanceof Error ? w.message : "stream failed");
  }
}
const qt = 960, K = -1, $e = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, fe = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, rr = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/, at = /<!--airgate:image-edit:([A-Za-z0-9+/=]+)-->/g, an = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, ir = /(^|[-_])(?:gpt-?5|o[134]|codex)(?:[-_.]|$)/i, Vt = /(^|[-_])(?:gpt[-_]?image|image)(?:[-_.]|\d|$)/i, ln = 10 * 1024 * 1024, Kt = 8, or = "gpt-5.5", wt = 16, Ae = 3840, ze = 1, St = [1, 2, 3, 4], ar = [
  { value: 1024, label: "1K" },
  { value: 2048, label: "2K" },
  { value: 3840, label: "4K" }
], lr = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9" }
], sr = {
  mode: "auto",
  baseResolution: 1024,
  ratio: "1:1"
};
function kt(e, i, l) {
  return Math.min(l, Math.max(i, e));
}
function Jt(e, i) {
  const l = Math.min(e.x, i.x), r = Math.min(e.y, i.y);
  return {
    x: l,
    y: r,
    width: Math.abs(i.x - e.x),
    height: Math.abs(i.y - e.y)
  };
}
function dr(e) {
  return !!(e && e.width >= Kt && e.height >= Kt);
}
function cr(e) {
  return { ...e };
}
function ur(e) {
  const [i, l] = e.split(":").map((r) => Number.parseInt(r, 10));
  return i > 0 && l > 0 ? { width: i, height: l } : null;
}
function st(e) {
  return Math.max(wt, Math.floor(e / wt) * wt);
}
function gr(e, i) {
  return e <= Ae && i <= Ae ? { width: e, height: i } : e >= i ? { width: Ae, height: st(i * Ae / e) } : { width: st(e * Ae / i), height: Ae };
}
function It(e, i) {
  const l = gr(st(e), st(i));
  return `${l.width}x${l.height}`;
}
function pr(e) {
  return ur(e.ratio);
}
function sn(e) {
  if (e.mode === "auto") return;
  const i = pr(e);
  if (!i) return;
  const l = e.baseResolution;
  return i.width === i.height ? It(l, l) : i.width > i.height ? It(l, l * i.height / i.width) : It(l * i.width / i.height, l);
}
function mr(e) {
  return e.mode === "auto" ? "Auto" : sn(e) || "Invalid size";
}
function We(e) {
  return e.replace(at, "");
}
function hr(e) {
  return We(e).replace($e, "[Image generated]").trim() || "[Image generated]";
}
function fr(e) {
  return We(e).replace($e, "[Image]").trim() || "[Image]";
}
function Mt(e) {
  return rr.test(e);
}
function br(e) {
  return `<!--airgate:image-edit:${btoa(encodeURIComponent(JSON.stringify(e)))}-->`;
}
function yr(e) {
  const i = [];
  let l;
  for (at.lastIndex = 0; (l = at.exec(e)) !== null; )
    try {
      const r = JSON.parse(decodeURIComponent(atob(l[1])));
      r && Number.isInteger(r.imageIndex) && r.rect && [r.rect.x, r.rect.y, r.rect.width, r.rect.height].every((g) => typeof g == "number") && i.push(r);
    } catch {
    }
  return at.lastIndex = 0, i;
}
function xr(e) {
  fe.lastIndex = 0;
  const i = fe.exec(e);
  return fe.lastIndex = 0, i ? { alt: i[1], url: i[2] } : null;
}
function vr(e) {
  return We(e).replace($e, "").trim().length > 0;
}
function dn(e) {
  return e.replace(/[\]\\]/g, "");
}
function wr(e) {
  const i = e.match(an);
  if (i) return i[1].toLowerCase() === "jpeg" ? "jpg" : i[1].toLowerCase();
  try {
    const r = new URL(e).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return r ? r[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}
function Sr(e, i) {
  return `${(e || "generated-image").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80) || "generated-image"}.${wr(i)}`;
}
function _t(e, i) {
  const l = document.createElement("a");
  l.href = e, l.download = i, l.rel = "noreferrer", document.body.appendChild(l), l.click(), l.remove();
}
async function kr(e, i) {
  const l = Sr(i, e);
  if (an.test(e)) {
    _t(e, l);
    return;
  }
  try {
    const r = await fetch(e);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const g = URL.createObjectURL(await r.blob());
    try {
      _t(g, l);
    } finally {
      URL.revokeObjectURL(g);
    }
  } catch {
    _t(e, l);
  }
}
async function Ir(e) {
  var r;
  if ((r = navigator.clipboard) != null && r.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(e);
    return;
  }
  const i = document.createElement("textarea");
  i.value = e, i.style.position = "fixed", i.style.opacity = "0", i.style.pointerEvents = "none", document.body.appendChild(i), i.select();
  const l = document.execCommand("copy");
  if (i.remove(), !l) throw new Error("copy failed");
}
function cn(e) {
  return new Promise((i, l) => {
    const r = new FileReader();
    r.onload = () => i(String(r.result || "")), r.onerror = () => l(r.error || new Error("Failed to read image")), r.readAsDataURL(e);
  });
}
function Mr(e) {
  return new Promise((i, l) => {
    e.toBlob((r) => {
      if (r) {
        i(r);
        return;
      }
      l(new Error("Failed to create mask"));
    }, "image/png");
  });
}
function Xt(e) {
  return new Promise((i, l) => {
    const r = new Image();
    r.onload = () => i(r), r.onerror = () => l(new Error("Failed to load image")), r.src = e;
  });
}
function Yt(e, i, l = []) {
  const r = e.trim(), g = i.map((p) => `![${dn(p.name)}](${p.url})`).join(`
`), u = l.map(br).join(`
`);
  return [r, g, u].filter(Boolean).join(`

`);
}
async function _r(e) {
  const i = e.filter((l) => l.type.startsWith("image/"));
  if (i.some((l) => l.size > ln))
    throw new Error("Images must be 10MB or smaller");
  return Promise.all(i.map(async (l) => ({
    id: `${l.name}-${l.lastModified}-${l.size}`,
    name: l.name || "pasted-image",
    url: await cn(l)
  })));
}
async function Cr(e) {
  if (!e.type.startsWith("image/"))
    throw new Error("Select an image file");
  if (e.size > ln)
    throw new Error("Images must be 10MB or smaller");
  return {
    id: `${e.name}-${e.lastModified}-${e.size}`,
    name: e.name || "source-image",
    url: await cn(e),
    file: e
  };
}
function Er(e) {
  var l;
  const i = (l = e.data) == null ? void 0 : l[0];
  return i ? i.url ? i.url : i.b64_json ? `data:image/png;base64,${i.b64_json}` : "" : "";
}
function Br(e, i) {
  var g, u, p;
  const l = Er(e);
  return l ? [(p = (u = (g = e.data) == null ? void 0 : g[0]) == null ? void 0 : u.revised_prompt) == null ? void 0 : p.trim(), `![${dn(i)}](${l})`].filter(Boolean).join(`

`) : "";
}
function Rr(e) {
  var i, l, r, g, u;
  return {
    input_tokens: ((i = e.usage) == null ? void 0 : i.prompt_tokens) || ((l = e.usage) == null ? void 0 : l.input_tokens) || 0,
    output_tokens: ((r = e.usage) == null ? void 0 : r.completion_tokens) || ((g = e.usage) == null ? void 0 : g.output_tokens) || 0,
    cost: ((u = e.usage) == null ? void 0 : u.cost) || 0
  };
}
function Tr(e) {
  fe.lastIndex = 0;
  let i = 0;
  for (; fe.exec(e) !== null; ) i += 1;
  return fe.lastIndex = 0, i;
}
function Ar(e, i) {
  return [e.trim(), i.trim()].filter(Boolean).join(`

`);
}
function Zt(e) {
  const i = We(e).replace($e, "[Image]").trim() || "[Image]";
  return i.slice(0, 30) + (i.length > 30 ? "..." : "");
}
function zr(e, i) {
  const l = We(i);
  if (e !== "user") return hr(l);
  const r = [];
  let g = 0, u;
  for ($e.lastIndex = 0; (u = $e.exec(l)) !== null; ) {
    const b = l.slice(g, u.index).trim();
    b && r.push({ type: "text", text: b }), r.push({ type: "image_url", image_url: { url: u[1] } }), g = u.index + u[0].length;
  }
  const p = l.slice(g).trim();
  return p && r.push({ type: "text", text: p }), r.length ? r : l;
}
function un(e, i) {
  return !!(e && Vt.test(e) || i && Vt.test(i));
}
function lt(e) {
  var i;
  return !!(e && (e.image_only || (i = e.capabilities) != null && i.includes("image_generation") || un(e.id, e.name)));
}
function it(e) {
  var i, l;
  return !e || lt(e) ? !1 : !!((i = e.capabilities) != null && i.includes("reasoning") || (l = e.capabilities) != null && l.includes("thinking") || ir.test(e.id));
}
function Le(e) {
  return `${encodeURIComponent(e.platform || "")}:${encodeURIComponent(e.id)}`;
}
function Ct(e) {
  return (e || "").toLowerCase().replace(/[-_\s]/g, "");
}
function Lr(e) {
  const i = Ct(or), l = e.find((r) => Ct(r.id) === i || Ct(r.name) === i);
  return l ? Le(l) : e[0] ? Le(e[0]) : "";
}
function $r(e, i) {
  var l;
  return ((l = e.find((r) => r.name === i)) == null ? void 0 : l.display_name) || i || "";
}
function Wr(e) {
  return /^(https?:|mailto:|#)/i.test(e);
}
function Dr(e) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:)/i.test(e);
}
function Qt(e, i, l) {
  i.split(`
`).forEach((g, u) => {
    u > 0 && e.push(/* @__PURE__ */ o("br", {}, `${l}-br-${u}`)), g && e.push(g);
  });
}
function gn(e, i, l, r) {
  var T, B;
  const g = ((T = r.takeImageIndex) == null ? void 0 : T.call(r)) ?? -1, u = (B = r.imageEditAnnotations) == null ? void 0 : B.find((R) => R.imageIndex === g), p = /* @__PURE__ */ o("img", { src: i, alt: l, style: n.generatedImage, loading: "lazy" }), b = u ? /* @__PURE__ */ c("span", { style: n.generatedImageOverlayWrap, children: [
    p,
    /* @__PURE__ */ o("span", { style: n.generatedImageDimOverlay }),
    /* @__PURE__ */ o(
      "span",
      {
        style: {
          ...n.generatedImageSelection,
          left: `${u.rect.x * 100}%`,
          top: `${u.rect.y * 100}%`,
          width: `${u.rect.width * 100}%`,
          height: `${u.rect.height * 100}%`
        }
      }
    )
  ] }) : p, k = r.imagePreviewTitle || "Preview image", I = r.onImagePreview ? /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      style: n.generatedImagePreviewBtn,
      title: k,
      "aria-label": k,
      onClick: () => {
        var R;
        return (R = r.onImagePreview) == null ? void 0 : R.call(r, i, l);
      },
      children: b
    }
  ) : b;
  return /* @__PURE__ */ o("span", { style: n.generatedImageFrame, children: I }, e);
}
function Me(e, i, l = {}) {
  const r = [], g = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let u = 0, p;
  for (; (p = g.exec(e)) !== null; ) {
    p.index > u && Qt(r, e.slice(u, p.index), `${i}-text-${u}`);
    const b = `${i}-${p.index}`, k = p[2], I = p[3], T = p[4], B = p[5], R = p[6], w = p[7] || p[8], z = p[9] || p[10];
    I && Dr(I) ? r.push(gn(b, I, k || l.generatedImageAlt || "Generated image", l)) : B && Wr(B) ? r.push(
      /* @__PURE__ */ o("a", { href: B, style: n.markdownLink, target: "_blank", rel: "noreferrer", children: Me(T, `${b}-link`, l) }, b)
    ) : R ? r.push(/* @__PURE__ */ o("code", { style: n.markdownInlineCode, children: R }, b)) : w ? r.push(/* @__PURE__ */ o("strong", { children: Me(w, `${b}-bold`, l) }, b)) : z ? r.push(/* @__PURE__ */ o("em", { children: Me(z, `${b}-em`, l) }, b)) : r.push(p[0]), u = p.index + p[0].length;
  }
  return u < e.length && Qt(r, e.slice(u), `${i}-text-${u}`), r.length > 0 ? r : e;
}
function Pr(e, i, l, r = {}) {
  const g = Me(i, `${l}-inline`, r);
  return e === 1 ? /* @__PURE__ */ o("h1", { style: n.markdownH1, children: g }, l) : e === 2 ? /* @__PURE__ */ o("h2", { style: n.markdownH2, children: g }, l) : e === 3 ? /* @__PURE__ */ o("h3", { style: n.markdownH3, children: g }, l) : /* @__PURE__ */ o("h4", { style: n.markdownH4, children: g }, l);
}
function Hr(e, i, l = {}) {
  const r = [];
  let g;
  for (fe.lastIndex = 0; (g = fe.exec(e)) !== null; )
    r.push({ alt: g[1], url: g[2] });
  const u = e.replace(fe, "").trim();
  return !r.length || u ? null : /* @__PURE__ */ o("div", { style: n.imageGroup, children: r.map((p, b) => gn(`${i}-${b}`, p.url, p.alt || l.generatedImageAlt || "Generated image", l)) }, i);
}
const Or = /* @__PURE__ */ new Set(["p", "h1", "h2", "h3", "h4", "blockquote", "li"]);
function pn(e, i) {
  if (!Vn(e) || typeof e.type != "string") return null;
  if (Or.has(e.type))
    return Nt(e, void 0, ...Gt.toArray(e.props.children), i);
  if (e.type === "ol" || e.type === "ul") {
    const l = Gt.toArray(e.props.children);
    for (let r = l.length - 1; r >= 0; r--) {
      const g = pn(l[r], i);
      if (g) {
        const u = [...l];
        return u[r] = g, Nt(e, void 0, ...u);
      }
    }
  }
  return null;
}
function jr(e, i) {
  if (!i) return e;
  for (let l = e.length - 1; l >= 0; l--) {
    const r = pn(e[l], i);
    if (r) {
      const g = [...e];
      return g[l] = r, g;
    }
  }
  return e;
}
function ot(e, i = {}) {
  const l = We(e);
  let r = -1;
  const g = {
    ...i,
    imageEditAnnotations: i.imageEditAnnotations || yr(e),
    takeImageIndex: () => (r += 1, r)
  }, u = l.replace(/\r\n?/g, `
`).split(`
`), p = [];
  let b = [], k = [], I = [], T = [], B = !1, R = 0;
  const w = (y) => `${y}-${R++}`, z = () => {
    if (!b.length) return;
    const y = w("p"), W = b.join(`
`);
    p.push(Hr(W, y, g) || /* @__PURE__ */ o("p", { style: n.markdownParagraph, children: Me(W, y, g) }, y)), b = [];
  }, P = () => {
    if (!k.length) return;
    const y = w("quote");
    p.push(/* @__PURE__ */ o("blockquote", { style: n.markdownBlockquote, children: Me(k.join(`
`), y, g) }, y)), k = [];
  }, re = () => {
    if (!I.length) return;
    const y = w("list"), W = I.map((U, de) => /* @__PURE__ */ o("li", { style: n.markdownListItem, children: Me(U.text, `${y}-${de}`, g) }, `${y}-${de}`));
    p.push(I[0].ordered ? /* @__PURE__ */ o("ol", { style: n.markdownList, children: W }, y) : /* @__PURE__ */ o("ul", { style: n.markdownList, children: W }, y)), I = [];
  }, F = () => {
    z(), P(), re();
  }, ie = () => {
    const y = w("code");
    p.push(/* @__PURE__ */ o("pre", { style: n.markdownCodeBlock, children: /* @__PURE__ */ o("code", { children: T.join(`
`) }) }, y)), T = [];
  };
  for (const y of u) {
    if (y.match(/^```/)) {
      B ? (ie(), B = !1) : (F(), B = !0);
      continue;
    }
    if (B) {
      T.push(y);
      continue;
    }
    if (!y.trim()) {
      F();
      continue;
    }
    const U = y.match(/^(#{1,6})\s+(.+)$/);
    if (U) {
      F(), p.push(Pr(Math.min(U[1].length, 4), U[2].trim(), w("heading"), g));
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(y)) {
      F(), p.push(/* @__PURE__ */ o("hr", { style: n.markdownDivider }, w("hr")));
      continue;
    }
    const de = y.match(/^>\s?(.*)$/);
    if (de) {
      z(), re(), k.push(de[1]);
      continue;
    }
    const be = y.match(/^\s*[-*+]\s+(.+)$/), L = y.match(/^\s*\d+[.)]\s+(.+)$/);
    if (be || L) {
      z(), P();
      const ee = !!L;
      I.length && I[0].ordered !== ee && re(), I.push({ ordered: ee, text: ((L == null ? void 0 : L[1]) || (be == null ? void 0 : be[1]) || "").trim() });
      continue;
    }
    P(), re(), b.push(y);
  }
  B && ie(), F();
  const v = jr(p, i.trailingInlineAction);
  return v.length > 0 ? v : l;
}
function Fr() {
  const { t: e } = Kn(), [i, l] = M([]), [r, g] = M(null), [u, p] = M([]), [b, k] = M(null), [I, T] = M(""), [B, R] = M(""), [w, z] = M(!1), [P, re] = M(""), [F, ie] = M([]), [v, y] = M(null), [W, U] = M(!1), [de, be] = M(!1), [L, ee] = M(null), [ct, ce] = M(null), [ut, De] = M(null), [Ve, gt] = M(null), [mn, hn] = M([]), [ye, Tt] = M([]), [At, pt] = M(""), [ue, fn] = M("medium"), [_e, bn] = M(() => cr(sr)), [Pe, yn] = M(ze), [xe, xn] = M(null), [mt, _] = M(""), [Ce, $] = M(null), [Ke, He] = M(""), [vn, Je] = M(null), [Xe, Oe] = M(!0), [f, wn] = M(() => typeof window < "u" ? window.innerWidth <= qt : !1), zt = ne(null), ht = ne(null), je = ne(null), Ye = ne(null), Lt = ne(null), Fe = ne(null), Ze = ne(null), ke = ne(null), N = ne(null), Y = ne(null), Qe = ne(null);
  Se(() => {
    Q.listConversations().then(l).catch(() => {
    }), Q.getUserInfo().then(xn).catch(() => {
    });
    let t = !1;
    return Q.listPlatforms().then(async (s) => {
      if (t) return;
      hn(s);
      const d = await Promise.all(s.map((h) => Q.listModels(h.name).catch(() => [])));
      if (t) return;
      const m = d.flat();
      Tt(m), pt((h) => m.some((x) => Le(x) === h) ? h : Lr(m));
    }).catch((s) => {
      t || (Tt([]), pt(""), $(null), _(s instanceof Error ? s.message : "Failed to load models"));
    }), () => {
      t = !0;
    };
  }, []), Se(() => {
    N.current = r;
  }, [r]), Se(() => {
    if (!r || r === K) {
      p([]);
      return;
    }
    if (Qe.current === r) {
      Qe.current = null;
      return;
    }
    Q.listMessages(r).then(p).catch(() => {
    });
  }, [r]), Se(() => {
    var t;
    (t = zt.current) == null || t.scrollIntoView({ behavior: "smooth" });
  }, [u, I, B]), Se(() => {
    if (typeof window > "u") return;
    const t = window.matchMedia(`(max-width: ${qt}px)`), s = (d) => {
      wn(d ? d.matches : t.matches);
    };
    return s(), t.addEventListener ? (t.addEventListener("change", s), () => t.removeEventListener("change", s)) : (t.addListener(s), () => t.removeListener(s));
  }, []), Se(() => {
    Oe(!f);
  }, [f]), Se(() => {
    if (!Ke) return;
    const t = window.setTimeout(() => He(""), 1400);
    return () => window.clearTimeout(t);
  }, [Ke]), Se(() => {
    if (!v || !W) return;
    let t = !1;
    const s = async () => {
      const m = Fe.current, h = Ze.current;
      if (!m || !h) return;
      const x = await Xt(v.url);
      if (t) return;
      const C = h.clientWidth || x.naturalWidth, H = f ? 220 : 260, O = Math.min(1, C / x.naturalWidth, H / x.naturalHeight), pe = Math.max(1, Math.round(x.naturalWidth * O)), q = Math.max(1, Math.round(x.naturalHeight * O));
      m.width = pe, m.height = q, m.style.width = `${pe}px`, m.style.height = `${q}px`, De({ width: pe, height: q });
      const te = m.getContext("2d");
      te && (te.clearRect(0, 0, pe, q), ee(null), ce(null), ke.current = null);
    };
    if (s().catch((m) => _(m instanceof Error ? m.message : "Failed to load image")), typeof ResizeObserver > "u")
      return () => {
        t = !0;
      };
    const d = new ResizeObserver(() => {
      s().catch((m) => _(m instanceof Error ? m.message : "Failed to load image"));
    });
    return Ze.current && d.observe(Ze.current), () => {
      t = !0, d.disconnect();
    };
  }, [v, W, f]);
  const oe = S(() => 0, []), ft = S((t) => {
    bn((s) => ({ ...s, ...t }));
  }, []), ve = ye.find((t) => Le(t) === At), E = (ve == null ? void 0 : ve.id) || "", Sn = (ve == null ? void 0 : ve.platform) || "", ae = lt(ve), Ne = it(ve), ge = sn(_e), kn = mr(_e), A = Sn, $t = S(() => {
    const t = (/* @__PURE__ */ new Date()).toISOString(), s = {
      id: K,
      user_id: (xe == null ? void 0 : xe.id) || 0,
      title: "",
      group_id: oe(),
      platform: A,
      model: E,
      created_at: t,
      updated_at: t
    };
    l((d) => [s, ...d.filter((m) => m.id !== K)]), g(K), p([]), ie([]), y(null), U(!1), ee(null), ce(null), De(null), _(""), $(null), f && Oe(!1);
  }, [f, oe, A, E, xe == null ? void 0 : xe.id]), In = S(async (t) => {
    var d, m;
    if (await ((m = (d = window.airgate) == null ? void 0 : d.confirm) == null ? void 0 : m.call(d, e("playground.delete_conversation_confirm"), {
      title: e("playground.delete_conversation"),
      danger: !0
    }))) {
      if (t === K) {
        l((h) => h.filter((x) => x.id !== t)), r === t && (g(null), p([]));
        return;
      }
      try {
        await Q.deleteConversation(t), l((h) => h.filter((x) => x.id !== t)), r === t && (g(null), p([]));
      } catch {
      }
    }
  }, [r, e]), we = S(async ({
    conversationID: t,
    requestMessages: s,
    model: d,
    groupID: m,
    platform: h,
    isImageRequest: x,
    imageSize: C,
    imageCount: H = ze,
    supportsReasoning: O,
    reasoningEffort: pe,
    titleContent: q
  }) => {
    const te = x ? kt(Math.round(H || ze), 1, St[St.length - 1]) : ze, Be = {
      conversationID: t,
      requestMessages: s.map((X) => ({ ...X })),
      model: d,
      groupID: m,
      platform: h,
      isImageRequest: x,
      imageSize: C,
      imageCount: te,
      supportsReasoning: O,
      reasoningEffort: pe
    };
    _(""), $(null), z(!0), k(t), Y.current = { conversationId: t, model: d }, T(""), R("");
    try {
      const X = new AbortController();
      ht.current = X;
      let le = "", D = "";
      const V = {
        model: d,
        messages: s.map((j) => ({ role: j.role, content: zr(j.role, j.content) })),
        stream: !0,
        ...x && C ? { size: C } : {},
        ...O ? { reasoning_effort: pe ?? ue } : {}
      }, Re = async (j) => {
        if (!le) {
          N.current === t && (_(e("playground.no_response")), $(Be)), T(""), R(""), k(null), Y.current = null, z(!1);
          return;
        }
        const Ue = await Q.persistMessage({
          conversation_id: t,
          role: "assistant",
          content: le,
          reasoning: D,
          platform: h,
          model: j.model || d,
          group_id: m,
          input_tokens: j.input_tokens,
          output_tokens: j.output_tokens,
          cost: j.cost
        });
        N.current === t && p((Te) => [...Te, Ue]), $(null), q && l((Te) => Te.map(
          (me) => me.id === t && !me.title ? { ...me, title: Zt(q), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : me
        )), T(""), R(""), k(null), Y.current = null, z(!1);
      };
      if (x && te > 1) {
        const j = Array.from({ length: te }, () => new Promise((G, he) => {
          let rt = "", jt = !1;
          const Ft = () => {
            jt || !rt.trim() || (le = Ar(le, rt), T(le), jt = !0);
          };
          Ut(
            h,
            { ...V, n: 1 },
            {
              onData: (Ie) => {
                rt += Ie, Mt(rt) && Ft();
              },
              onReasoning: (Ie) => {
                D += Ie, R(D);
              },
              onDone: (Ie) => {
                Ft(), G(Ie);
              },
              onError: (Ie) => he(new Error(Ie))
            },
            X.signal
          ).catch(he);
        })), Ue = await Promise.allSettled(j);
        if (X.signal.aborted) return;
        const Te = Ue.flatMap((G) => G.status === "fulfilled" ? [G.value] : []), me = Ue.length - Te.length;
        if (me && !le) {
          const G = Ue.find((he) => he.status === "rejected");
          throw (G == null ? void 0 : G.status) === "rejected" && G.reason instanceof Error ? G.reason : new Error("stream failed");
        }
        const qn = Te.reduce((G, he) => ({
          input_tokens: G.input_tokens + he.input_tokens,
          output_tokens: G.output_tokens + he.output_tokens,
          model: he.model || G.model,
          cost: G.cost + he.cost
        }), { input_tokens: 0, output_tokens: 0, model: d, cost: 0 });
        await Re(qn), me && N.current === t && _(`${me} image${me === 1 ? "" : "s"} failed to generate`);
        return;
      }
      await Ut(
        h,
        {
          ...V,
          ...x ? { n: te } : {}
        },
        {
          onData: (j) => {
            le += j, T(le);
          },
          onReasoning: (j) => {
            D += j, R(D);
          },
          onDone: Re,
          onError: (j) => {
            N.current === t && (_(j), $(Be)), z(!1), T(""), R(""), k(null), Y.current = null;
          }
        },
        X.signal
      );
    } catch (X) {
      N.current === t && (_(X instanceof Error ? X.message : "stream failed"), $(Be)), z(!1), T(""), R(""), k(null), Y.current = null;
    }
  }, [ue, e]), bt = S(async () => {
    if (!P.trim() && F.length === 0 || w || !r) return;
    const t = Yt(P, F), s = oe();
    let d = r;
    const m = [...u, {
      id: Date.now(),
      conversation_id: r,
      role: "user",
      content: t,
      reasoning_effort: Ne ? ue : void 0,
      platform: A,
      model: E,
      group_id: s,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    re(""), ie([]), je.current && (je.current.style.height = "24px"), Ye.current && (Ye.current.value = ""), _(""), $(null), p(m), z(!0), k(d), Y.current = { conversationId: d, model: E }, T(""), R("");
    try {
      if (!A || !E)
        throw new Error("Model required");
      if (d === K) {
        const h = await Q.createConversation({
          title: "",
          group_id: s,
          platform: A,
          model: E
        });
        d = h.id, N.current === K && (N.current = h.id, Qe.current = h.id, g(h.id), p((x) => x.map((C) => ({ ...C, conversation_id: h.id })))), l((x) => [h, ...x.filter((C) => C.id !== K)]);
      }
      await Q.persistMessage({
        conversation_id: d,
        role: "user",
        content: t,
        reasoning_effort: Ne ? ue : void 0,
        platform: A,
        model: E,
        group_id: s
      }), await we({
        conversationID: d,
        requestMessages: m.map((h) => ({ ...h, conversation_id: d })),
        model: E,
        groupID: s,
        platform: A,
        isImageRequest: ae,
        imageSize: ae ? ge : void 0,
        imageCount: ae ? Pe : ze,
        supportsReasoning: Ne,
        reasoningEffort: ue,
        titleContent: t
      });
    } catch (h) {
      N.current === d && _(h instanceof Error ? h.message : "stream failed"), z(!1), T(""), R(""), k(null), Y.current = null;
    }
  }, [r, Pe, P, w, u, F, ue, oe, ge, A, E, ae, Ne, we]), et = S(async (t) => {
    if (t.length)
      try {
        const s = await _r(t);
        if (!s.length) return;
        ie((d) => [...d, ...s]), _(""), $(null);
      } catch (s) {
        $(null), _(s instanceof Error ? s.message : "Failed to read image");
      }
  }, []), Wt = S(async (t) => {
    if (t)
      try {
        const s = await Cr(t);
        y(s), U(!0), ee(null), ce(null), De(null), _(""), $(null);
      } catch (s) {
        $(null), _(s instanceof Error ? s.message : "Failed to read image");
      }
  }, []), Mn = S(async (t) => {
    await et(Array.from(t.target.files || [])), t.target.value = "";
  }, [et]), _n = S(async (t) => {
    var s;
    await Wt((s = t.target.files) == null ? void 0 : s[0]), t.target.value = "";
  }, [Wt]), yt = S(() => {
    var t;
    (t = Lt.current) == null || t.click();
  }, []), Cn = S(() => {
    ee(null), ce(null), ke.current = null;
  }, []), En = S(() => {
    U(!1), y(null), ee(null), ce(null), De(null), ke.current = null;
  }, []), Ee = S((t) => {
    const s = Fe.current;
    if (!s) return null;
    const d = s.getBoundingClientRect(), m = s.width / d.width, h = s.height / d.height;
    return {
      x: kt((t.clientX - d.left) * m, 0, s.width),
      y: kt((t.clientY - d.top) * h, 0, s.height)
    };
  }, []), Bn = S((t) => {
    t.preventDefault();
    const s = Ee(t);
    s && (ke.current = s, ee(null), ce({ x: s.x, y: s.y, width: 0, height: 0 }), t.currentTarget.setPointerCapture(t.pointerId));
  }, [Ee]), Rn = S((t) => {
    const s = ke.current;
    if (!s) return;
    t.preventDefault();
    const d = Ee(t);
    d && ce(Jt(s, d));
  }, [Ee]), Dt = S((t) => {
    const s = ke.current, d = Ee(t), m = s && d ? Jt(s, d) : ct;
    ke.current = null, ce(null), ee(dr(m) ? m : null), t.currentTarget.hasPointerCapture(t.pointerId) && t.currentTarget.releasePointerCapture(t.pointerId);
  }, [ct, Ee]), Pt = S(async () => {
    const t = Fe.current;
    if (!t || !v || !L) throw new Error("Selection required");
    const s = await Xt(v.url), d = document.createElement("canvas");
    d.width = s.naturalWidth, d.height = s.naturalHeight;
    const m = d.getContext("2d");
    if (!m) throw new Error("Failed to create mask");
    const h = s.naturalWidth / t.width, x = s.naturalHeight / t.height;
    return m.fillStyle = "#fff", m.fillRect(0, 0, d.width, d.height), m.clearRect(
      Math.floor(L.x * h),
      Math.floor(L.y * x),
      Math.ceil(L.width * h),
      Math.ceil(L.height * x)
    ), Mr(d);
  }, [L, v]), xt = S(async () => {
    if (!r || w || de) return;
    if (!A || !E) {
      $(null), _(e("playground.select_model_first"));
      return;
    }
    if (!ae) {
      $(null), _(e("playground.select_image_model_first"));
      return;
    }
    if (!v) {
      $(null), _(e("playground.choose_source_image_first"));
      return;
    }
    if (!L) {
      $(null), _(e("playground.select_edit_area_first"));
      return;
    }
    const t = P.trim();
    if (!t) {
      $(null), _(e("playground.describe_image_change_first"));
      return;
    }
    const s = oe();
    let d = r;
    const m = Fe.current, h = m ? {
      imageIndex: 0,
      rect: {
        x: L.x / m.width,
        y: L.y / m.height,
        width: L.width / m.width,
        height: L.height / m.height
      }
    } : null, x = Yt(t, [v], h ? [h] : []), C = {
      id: Date.now(),
      conversation_id: r,
      role: "user",
      content: x,
      platform: A,
      model: E,
      group_id: s,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    re(""), je.current && (je.current.style.height = "24px"), _(""), $(null), p((H) => [...H, C]), z(!0), be(!0), k(d), Y.current = { conversationId: d, model: E }, T(""), R("");
    try {
      if (d === K) {
        const D = await Q.createConversation({
          title: "",
          group_id: s,
          platform: A,
          model: E
        });
        d = D.id, N.current === K && (N.current = D.id, Qe.current = D.id, g(D.id), p((V) => V.map((Re) => ({ ...Re, conversation_id: D.id })))), k(D.id), Y.current = { conversationId: D.id, model: E }, l((V) => [D, ...V.filter((Re) => Re.id !== K)]);
      }
      const H = await Q.persistMessage({
        conversation_id: d,
        role: "user",
        content: x,
        platform: A,
        model: E,
        group_id: s
      });
      N.current === d && p((D) => D.map((V) => V.id === C.id ? H : V));
      const O = new AbortController();
      ht.current = O;
      const pe = await Pt();
      if (O.signal.aborted) return;
      const q = new FormData();
      q.append("model", E), q.append("prompt", t), q.append("image", v.file, v.name || "image.png"), q.append("mask", pe, "mask.png"), ge && q.append("size", ge);
      const te = await nr(A, q, O.signal);
      if (O.signal.aborted) return;
      const Be = Br(te, "edited-image");
      if (!Be) throw new Error("No image returned");
      const X = Rr(te), le = await Q.persistMessage({
        conversation_id: d,
        role: "assistant",
        content: Be,
        platform: A,
        model: te.model || E,
        group_id: s,
        input_tokens: X.input_tokens,
        output_tokens: X.output_tokens,
        cost: X.cost
      });
      N.current === d && p((D) => [...D, le]), l((D) => D.map(
        (V) => V.id === d && !V.title ? { ...V, title: Zt(x), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : V
      )), y(null), U(!1), ee(null), ce(null), De(null);
    } catch (H) {
      if (H instanceof DOMException && H.name === "AbortError") return;
      N.current === d && _(H instanceof Error ? H.message : "image edit failed");
    } finally {
      z(!1), be(!1), T(""), R(""), k(null), Y.current = null;
    }
  }, [r, Pt, L, v, P, de, w, oe, ge, E, ae, A, e]), Tn = S((t) => {
    const s = Array.from(t.clipboardData.items).filter((d) => d.kind === "file" && d.type.startsWith("image/")).map((d) => d.getAsFile()).filter((d) => !!d);
    s.length && et(s);
  }, [et]), An = S((t) => {
    ie((s) => s.filter((d) => d.id !== t));
  }, []), zn = S(() => {
    var s;
    (s = ht.current) == null || s.abort();
    const t = Y.current;
    if (I || B) {
      const d = t == null ? void 0 : t.conversationId;
      d && N.current === d && p((m) => [...m, {
        id: Date.now() + 1,
        conversation_id: d,
        role: "assistant",
        content: I,
        reasoning: B,
        platform: "",
        model: t.model,
        group_id: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    }
    T(""), R(""), k(null), Y.current = null, be(!1), z(!1);
  }, [I, B]), Z = i.find((t) => t.id === r), vt = u[u.length - 1], Ge = ct || L, Ln = !!(W && v && L && P.trim() && A && E && ae), $n = !!(r && r !== K && (vt == null ? void 0 : vt.role) === "user" && !mt && !w), J = w && b === r, Ht = !!((W ? Ln : P.trim() || F.length > 0) && A && E) && !w && !de, Wn = S((t) => {
    if (t.key === "Enter" && !t.shiftKey) {
      if (t.preventDefault(), !A || !E) {
        $(null), _(e("playground.select_model_first"));
        return;
      }
      if (W) {
        xt();
        return;
      }
      bt();
    }
  }, [W, E, A, bt, xt, e]), Dn = S(() => {
    var t;
    (t = Ye.current) == null || t.click();
  }, []), Pn = S((t) => {
    t.style.height = "auto", t.style.height = Math.min(t.scrollHeight, 200) + "px";
  }, []), Hn = S((t) => {
    g(t), _(""), $(null), f && Oe(!1);
  }, [f]), On = S(() => {
    if (!Ce || w || r !== Ce.conversationID) return;
    const t = Ce;
    _(""), $(null), we({
      ...t,
      requestMessages: t.requestMessages.map((s) => ({ ...s }))
    });
  }, [r, w, Ce, we]), jn = S(() => {
    if (w || !r || r === K) return;
    const t = u[u.length - 1];
    if ((t == null ? void 0 : t.role) !== "user") return;
    const s = t.model || (Z == null ? void 0 : Z.model) || E, d = t.platform || (Z == null ? void 0 : Z.platform) || A;
    if (!s || !d) {
      _("Model required");
      return;
    }
    const m = ye.find((C) => C.id === s && C.platform === d) || ye.find((C) => C.id === s), h = lt(m) || un(s), x = it(m) || !!t.reasoning_effort;
    _(""), $(null), we({
      conversationID: r,
      requestMessages: u.map((C) => ({ ...C })),
      model: s,
      groupID: t.group_id || (Z == null ? void 0 : Z.group_id) || oe(),
      platform: d,
      isImageRequest: h,
      imageSize: h ? ge : void 0,
      imageCount: h ? Pe : ze,
      supportsReasoning: x,
      reasoningEffort: t.reasoning_effort || ue
    });
  }, [Z, r, Pe, w, u, ye, ue, oe, ge, E, A, we]), Fn = S((t, s) => {
    gt({ url: t, alt: s });
  }, []), Nn = S((t, s) => {
    kr(t, s).then(() => He(e("playground.download_started"))).catch(() => He(e("playground.download_failed")));
  }, [e]), Gn = S((t) => {
    if (w || !r || r === K) return;
    const s = u.slice(0, t).map((O) => O.role).lastIndexOf("user");
    if (s < 0) {
      $(null), _(e("playground.no_image_prompt"));
      return;
    }
    const d = u.slice(0, s + 1), m = u[s], h = u[t], x = h.model || E, C = h.platform || m.platform || A, H = ye.find((O) => O.id === x && O.platform === C) || ye.find((O) => O.id === x);
    we({
      conversationID: r,
      requestMessages: d,
      model: x,
      groupID: h.group_id || m.group_id || oe(),
      platform: C,
      isImageRequest: !0,
      imageSize: ge,
      imageCount: Math.max(1, Tr(h.content)),
      supportsReasoning: it(H)
    });
  }, [r, w, u, ye, oe, ge, A, E, we, e]), Un = S((t) => {
    Ir(t).then(() => He("Message copied")).catch(() => He("Copy failed"));
  }, []), tt = {
    onImagePreview: Fn,
    imagePreviewTitle: e("playground.preview_image"),
    generatedImageAlt: e("playground.generated_image")
  }, nt = (t, s = "Copy message", d = !1, m = {}) => /* @__PURE__ */ o(
    "button",
    {
      type: "button",
      style: { ...n.messageCopyBtn, ...m },
      title: s,
      "aria-label": s,
      onClick: (h) => {
        d && (h.preventDefault(), h.stopPropagation()), Un(t);
      },
      children: /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ o("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
        /* @__PURE__ */ o("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
      ] })
    }
  ), Ot = (t, s) => {
    const d = f || vn === t, m = fr(s), x = vr(s) ? /* @__PURE__ */ o("span", { style: {
      ...n.messageCopyAfterText,
      ...d ? n.messageCopyAfterTextVisible : null
    }, children: nt(m, "Copy message", !1, n.messageCopyAfterTextBtn) }) : void 0;
    return /* @__PURE__ */ o(
      "div",
      {
        style: n.messageContent,
        onMouseEnter: () => Je(t),
        onMouseLeave: () => Je((C) => C === t ? null : C),
        onFocus: () => Je(t),
        onBlur: (C) => {
          C.currentTarget.contains(C.relatedTarget) || Je((H) => H === t ? null : H);
        },
        children: ot(s, {
          ...tt,
          trailingInlineAction: x
        })
      }
    );
  };
  return /* @__PURE__ */ c("div", { "data-full-bleed": !0, style: n.layout, children: [
    Xe && f && /* @__PURE__ */ o(
      "div",
      {
        style: n.sidebarBackdrop,
        onClick: () => Oe(!1)
      }
    ),
    Ve && /* @__PURE__ */ o(
      "div",
      {
        style: n.imagePreviewOverlay,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": Ve.alt || e("playground.image_preview"),
        onClick: () => gt(null),
        children: /* @__PURE__ */ c("div", { style: n.imagePreviewModal, onClick: (t) => t.stopPropagation(), children: [
          /* @__PURE__ */ o("img", { src: Ve.url, alt: Ve.alt, style: n.imagePreviewLarge }),
          /* @__PURE__ */ o(
            "button",
            {
              type: "button",
              style: n.imagePreviewCloseBtn,
              onClick: () => gt(null),
              "aria-label": e("playground.close_image_preview"),
              children: "×"
            }
          )
        ] })
      }
    ),
    Xe && /* @__PURE__ */ c("div", { style: { ...n.sidebar, ...f ? n.sidebarMobile : null }, children: [
      /* @__PURE__ */ c("div", { style: n.sidebarHeader, children: [
        /* @__PURE__ */ o("span", { style: n.sidebarTitle, children: e("playground.conversations") }),
        /* @__PURE__ */ o(
          "button",
          {
            style: n.newBtn,
            onClick: $t,
            title: e("playground.new_conversation"),
            children: /* @__PURE__ */ o("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ o("path", { d: "M7 1v12M1 7h12" }) })
          }
        )
      ] }),
      /* @__PURE__ */ c("div", { style: n.convList, children: [
        i.map((t) => {
          const s = t.id === r;
          return /* @__PURE__ */ c(
            "div",
            {
              style: {
                ...n.convItem,
                background: s ? a("primarySubtle") : "transparent",
                borderColor: s ? a("borderFocus") : "transparent"
              },
              onClick: () => Hn(t.id),
              children: [
                /* @__PURE__ */ o("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: a(s ? "primary" : "textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ o("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
                /* @__PURE__ */ o("span", { style: {
                  ...n.convTitle,
                  color: a(s ? "text" : "textSecondary")
                }, children: t.title || e("playground.new_conversation") }),
                /* @__PURE__ */ o(
                  "button",
                  {
                    style: n.deleteBtn,
                    onClick: (d) => {
                      d.stopPropagation(), In(t.id);
                    },
                    title: e("playground.delete_conversation"),
                    children: /* @__PURE__ */ o("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: /* @__PURE__ */ o("path", { d: "M2 2l8 8M10 2l-8 8" }) })
                  }
                )
              ]
            },
            t.id
          );
        }),
        i.length === 0 && /* @__PURE__ */ c("div", { style: n.emptyConvList, children: [
          /* @__PURE__ */ o("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: a("textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5 }, children: /* @__PURE__ */ o("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ o("span", { children: e("playground.no_conversations") })
        ] })
      ] }),
      xe && /* @__PURE__ */ c("div", { style: n.balanceBar, children: [
        /* @__PURE__ */ o("span", { style: n.balanceLabel, children: e("playground.balance") }),
        /* @__PURE__ */ c("span", { style: n.balanceValue, children: [
          "$",
          xe.balance.toFixed(4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c("div", { style: n.main, children: [
      /* @__PURE__ */ c("div", { style: { ...n.topBar, ...f ? n.topBarMobile : null }, children: [
        /* @__PURE__ */ c("div", { style: { ...n.topBarLeft, ...f ? n.topBarLeftMobile : null }, children: [
          /* @__PURE__ */ o("button", { style: n.toggleBtn, onClick: () => Oe(!Xe), children: /* @__PURE__ */ o("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: Xe ? /* @__PURE__ */ c(qe, { children: [
            /* @__PURE__ */ o("path", { d: "M6 2v12" }),
            /* @__PURE__ */ o("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ o("path", { d: "M10 6l-2 2 2 2" })
          ] }) : /* @__PURE__ */ c(qe, { children: [
            /* @__PURE__ */ o("path", { d: "M6 2v12" }),
            /* @__PURE__ */ o("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ o("path", { d: "M8 6l2 2-2 2" })
          ] }) }) }),
          /* @__PURE__ */ c("div", { style: { ...n.selectors, ...f ? n.selectorsMobile : null }, children: [
            /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ o("label", { style: n.selectorLabel, children: e("playground.model") }),
              /* @__PURE__ */ o(
                "select",
                {
                  style: { ...n.select, ...f ? n.selectMobile : null },
                  value: At,
                  onChange: (t) => pt(t.target.value),
                  children: ye.map((t) => /* @__PURE__ */ c("option", { value: Le(t), children: [
                    t.name || t.id,
                    " · ",
                    $r(mn, t.platform),
                    lt(t) ? " · image" : it(t) ? " · reasoning" : ""
                  ] }, Le(t)))
                }
              )
            ] }),
            ae && /* @__PURE__ */ c(qe, { children: [
              !f && /* @__PURE__ */ o("div", { style: n.selectorDivider }),
              /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ o("label", { style: n.selectorLabel, children: "Images" }),
                /* @__PURE__ */ o(
                  "select",
                  {
                    style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                    value: Pe,
                    onChange: (t) => yn(Number(t.target.value)),
                    "aria-label": "Image count",
                    children: St.map((t) => /* @__PURE__ */ o("option", { value: t, children: t }, t))
                  }
                )
              ] }),
              !f && /* @__PURE__ */ o("div", { style: n.selectorDivider }),
              /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ o("label", { style: n.selectorLabel, children: "Size" }),
                /* @__PURE__ */ c("div", { style: { ...n.imageSizeInlineControls, ...f ? n.imageSizeInlineControlsMobile : null }, children: [
                  /* @__PURE__ */ c(
                    "select",
                    {
                      style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                      value: _e.mode,
                      onChange: (t) => ft({ mode: t.target.value }),
                      "aria-label": "Image size mode",
                      children: [
                        /* @__PURE__ */ o("option", { value: "auto", children: "Auto" }),
                        /* @__PURE__ */ o("option", { value: "ratio", children: "Ratio" })
                      ]
                    }
                  ),
                  _e.mode === "ratio" && /* @__PURE__ */ c(qe, { children: [
                    /* @__PURE__ */ o(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                        value: _e.baseResolution,
                        onChange: (t) => ft({ baseResolution: Number(t.target.value) }),
                        "aria-label": "Base resolution",
                        children: ar.map((t) => /* @__PURE__ */ o("option", { value: t.value, children: t.label }, t.value))
                      }
                    ),
                    /* @__PURE__ */ o(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                        value: _e.ratio,
                        onChange: (t) => ft({ ratio: t.target.value }),
                        "aria-label": "Image ratio",
                        children: lr.map((t) => /* @__PURE__ */ o("option", { value: t.value, children: t.label }, t.value))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ o("span", { style: n.imageSizeInlinePreview, children: kn })
                ] })
              ] })
            ] }),
            Ne && /* @__PURE__ */ c(qe, { children: [
              !f && /* @__PURE__ */ o("div", { style: n.selectorDivider }),
              /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ o("label", { style: n.selectorLabel, children: "Effort" }),
                /* @__PURE__ */ c(
                  "select",
                  {
                    style: { ...n.select, ...f ? n.selectMobile : null },
                    value: ue,
                    onChange: (t) => fn(t.target.value),
                    children: [
                      /* @__PURE__ */ o("option", { value: "minimal", children: "Minimal" }),
                      /* @__PURE__ */ o("option", { value: "low", children: "Low" }),
                      /* @__PURE__ */ o("option", { value: "medium", children: "Medium" }),
                      /* @__PURE__ */ o("option", { value: "high", children: "High" }),
                      /* @__PURE__ */ o("option", { value: "xhigh", children: "XHigh" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        Z && /* @__PURE__ */ o("span", { style: { ...n.topBarTitle, ...f ? n.topBarTitleMobile : null }, children: Z.title || e("playground.new_conversation") })
      ] }),
      /* @__PURE__ */ c("div", { style: n.messagesArea, children: [
        !r && /* @__PURE__ */ c("div", { style: { ...n.emptyState, ...f ? n.emptyStateMobile : null }, children: [
          /* @__PURE__ */ o("div", { style: n.emptyIcon, children: /* @__PURE__ */ c("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [
            /* @__PURE__ */ o("rect", { x: "4", y: "4", width: "40", height: "40", rx: "20", fill: a("primarySubtle") }),
            /* @__PURE__ */ o("path", { d: "M24 16v6m0 0v6m0-6h6m-6 0h-6", stroke: a("primary"), strokeWidth: "2", strokeLinecap: "round" })
          ] }) }),
          /* @__PURE__ */ o("div", { style: n.emptyTitle, children: e("playground.empty_title") }),
          /* @__PURE__ */ o("div", { style: n.emptyDesc, children: e("playground.empty_description") }),
          /* @__PURE__ */ c("button", { style: n.emptyBtn, onClick: $t, children: [
            /* @__PURE__ */ o("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ o("path", { d: "M7 1v12M1 7h12" }) }),
            e("playground.new_conversation")
          ] })
        ] }),
        r && u.map((t, s) => /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ o("div", { style: t.role === "user" ? n.avatarUser : n.avatarAssistant, children: t.role === "user" ? /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ o("circle", { cx: "12", cy: "7", r: "4" })
          ] }) : /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ o("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ o("div", { style: n.messageHeader, children: /* @__PURE__ */ o("div", { style: n.messageRole, children: t.role === "user" ? e("playground.you") : e("playground.assistant") }) }),
            t.role === "assistant" && t.reasoning && /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ o("span", { children: "Thinking" }),
                nt(t.reasoning, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ o("div", { style: n.reasoningContent, children: ot(t.reasoning, tt) })
            ] }),
            Ot(`message-${t.id}`, t.content),
            t.role === "assistant" && (Mt(t.content) || t.model) && (() => {
              const d = xr(t.content);
              return /* @__PURE__ */ c("div", { style: Mt(t.content) ? n.imageMessageActions : n.messageMeta, children: [
                d && /* @__PURE__ */ o(
                  "button",
                  {
                    type: "button",
                    style: n.imageDownloadBtn,
                    title: e("playground.download_image"),
                    "aria-label": e("playground.download_image"),
                    onClick: () => Nn(d.url, d.alt || e("playground.generated_image")),
                    children: /* @__PURE__ */ c("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ o("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                      /* @__PURE__ */ o("path", { d: "M7 10l5 5 5-5" }),
                      /* @__PURE__ */ o("path", { d: "M12 15V3" })
                    ] })
                  }
                ),
                d && /* @__PURE__ */ o(
                  "button",
                  {
                    type: "button",
                    style: { ...n.regenerateImageBtn, opacity: w ? 0.5 : 1 },
                    onClick: () => Gn(s),
                    disabled: w,
                    title: e("playground.retry_image"),
                    "aria-label": e("playground.retry_image"),
                    children: /* @__PURE__ */ c("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ o("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                      /* @__PURE__ */ o("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                      /* @__PURE__ */ o("path", { d: "M19 2v4h-4" }),
                      /* @__PURE__ */ o("path", { d: "M5 22v-4h4" })
                    ] })
                  }
                ),
                t.model && /* @__PURE__ */ o("span", { style: n.metaBadge, children: t.model })
              ] });
            })()
          ] })
        ] }, t.id)),
        J && I && /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ o("div", { style: n.avatarAssistant, children: /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ o("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ o("div", { style: n.messageHeader, children: /* @__PURE__ */ o("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            B && /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ o("span", { children: "Thinking" }),
                nt(B, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ o("div", { style: n.reasoningContent, children: ot(B, tt) })
            ] }),
            Ot(`stream-${b || "active"}`, I),
            /* @__PURE__ */ c("div", { style: n.messageMeta, children: [
              /* @__PURE__ */ o("span", { style: n.streamingDot }),
              /* @__PURE__ */ o("span", { children: e("playground.streaming") })
            ] })
          ] })
        ] }),
        J && !I && /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ o("div", { style: n.avatarAssistant, children: /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ o("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ o("div", { style: n.messageHeader, children: /* @__PURE__ */ o("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            B ? /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ o("span", { children: "Thinking" }),
                nt(B, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ o("div", { style: n.reasoningContent, children: ot(B, tt) })
            ] }) : /* @__PURE__ */ o("div", { style: { ...n.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ o("span", { style: n.thinkingDots, children: e("playground.thinking") }) })
          ] })
        ] }),
        $n && /* @__PURE__ */ c("div", { style: { ...n.errorBar, ...n.recoverableBar, ...f ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ o("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ o("span", { style: n.errorMessage, children: e("playground.response_unfinished", { defaultValue: "Response was interrupted before the assistant replied." }) }),
          /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              style: n.recoverableRetryBtn,
              onClick: jn,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ o("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ o("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ o("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ o("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        mt && /* @__PURE__ */ c("div", { style: { ...n.errorBar, ...f ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ o("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ o("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ o("span", { style: n.errorMessage, children: mt }),
          Ce && Ce.conversationID === r && !w && /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              style: n.errorRetryBtn,
              onClick: On,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ o("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ o("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ o("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ o("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        Ke && /* @__PURE__ */ o("div", { style: n.interactionNotice, children: Ke }),
        /* @__PURE__ */ o("div", { ref: zt })
      ] }),
      r && /* @__PURE__ */ o("div", { style: { ...n.inputArea, ...f ? n.inputAreaMobile : null }, children: /* @__PURE__ */ c("div", { style: { ...n.inputWrapper, ...J ? n.inputWrapperStreaming : null }, children: [
        ae && W && /* @__PURE__ */ c("div", { style: { ...n.imageEditPanel, ...f ? n.imageEditPanelMobile : null }, children: [
          /* @__PURE__ */ c("div", { style: { ...n.imageEditHeader, ...f ? n.imageEditHeaderMobile : null }, children: [
            /* @__PURE__ */ c("div", { style: n.imageEditTitleWrap, children: [
              /* @__PURE__ */ o("span", { style: n.imageEditTitle, children: e("playground.edit_image_region") }),
              /* @__PURE__ */ o("span", { style: n.imageEditSubtitle, children: e(v ? "playground.edit_image_region_hint" : "playground.choose_source_image_region_hint") })
            ] }),
            /* @__PURE__ */ c("div", { style: n.imageEditHeaderActions, children: [
              /* @__PURE__ */ o(
                "button",
                {
                  type: "button",
                  style: n.imageEditGhostBtn,
                  onClick: yt,
                  disabled: J,
                  children: e(v ? "playground.replace_source" : "playground.choose_source")
                }
              ),
              /* @__PURE__ */ o(
                "button",
                {
                  type: "button",
                  style: n.imageEditIconBtn,
                  onClick: En,
                  disabled: J,
                  "aria-label": "Close image editor",
                  children: "×"
                }
              )
            ] })
          ] }),
          v ? /* @__PURE__ */ c("div", { style: { ...n.imageEditBody, ...f ? n.imageEditBodyMobile : null }, children: [
            /* @__PURE__ */ o("div", { ref: Ze, style: n.imageEditStageWrap, children: /* @__PURE__ */ c("div", { style: {
              ...n.imageEditStage,
              ...ut ? { width: ut.width, height: ut.height } : null
            }, children: [
              /* @__PURE__ */ o("img", { src: v.url, alt: v.name, style: n.imageEditSource, draggable: !1 }),
              Ge && /* @__PURE__ */ o(
                "div",
                {
                  style: {
                    ...n.imageEditSelection,
                    left: Ge.x,
                    top: Ge.y,
                    width: Ge.width,
                    height: Ge.height
                  }
                }
              ),
              /* @__PURE__ */ o(
                "canvas",
                {
                  ref: Fe,
                  style: n.imageEditCanvas,
                  onPointerDown: Bn,
                  onPointerMove: Rn,
                  onPointerUp: Dt,
                  onPointerCancel: Dt,
                  "aria-label": "Box-select image edit region"
                }
              )
            ] }) }),
            /* @__PURE__ */ c("div", { style: n.imageEditSidePanel, children: [
              /* @__PURE__ */ o("div", { style: n.imageEditBadge, children: e(L ? "playground.region_selected" : "playground.drag_to_select") }),
              /* @__PURE__ */ o("div", { style: n.imageEditFilename, children: v.name }),
              /* @__PURE__ */ o(
                "button",
                {
                  type: "button",
                  style: { ...n.imageEditGhostBtn, opacity: L ? 1 : 0.5 },
                  onClick: Cn,
                  disabled: !L || J,
                  children: e("playground.clear_selection")
                }
              )
            ] })
          ] }) : /* @__PURE__ */ o(
            "button",
            {
              type: "button",
              style: n.imageEditEmptyBtn,
              onClick: yt,
              disabled: J,
              children: e("playground.choose_source_image_for_regional_editing")
            }
          )
        ] }),
        F.length > 0 && /* @__PURE__ */ o("div", { style: n.imagePreviewList, children: F.map((t) => /* @__PURE__ */ c("div", { style: n.imagePreviewItem, children: [
          /* @__PURE__ */ o("img", { src: t.url, alt: t.name, style: n.imagePreview }),
          /* @__PURE__ */ o(
            "button",
            {
              type: "button",
              style: n.removeImageBtn,
              onClick: () => An(t.id),
              "aria-label": `Remove ${t.name}`,
              children: "×"
            }
          )
        ] }, t.id)) }),
        /* @__PURE__ */ o(
          "textarea",
          {
            ref: je,
            style: n.textarea,
            value: P,
            onChange: (t) => {
              re(t.target.value), Pn(t.target);
            },
            onPaste: Tn,
            onKeyDown: Wn,
            placeholder: e("playground.input_placeholder"),
            rows: 1,
            disabled: J
          }
        ),
        /* @__PURE__ */ o(
          "input",
          {
            ref: Ye,
            type: "file",
            accept: "image/*",
            multiple: !0,
            style: n.fileInput,
            onChange: Mn,
            disabled: J
          }
        ),
        /* @__PURE__ */ o(
          "input",
          {
            ref: Lt,
            type: "file",
            accept: "image/*",
            style: n.fileInput,
            onChange: _n,
            disabled: J
          }
        ),
        /* @__PURE__ */ c("div", { style: { ...n.inputActions, ...f ? n.inputActionsMobile : null }, children: [
          /* @__PURE__ */ o("span", { style: { ...n.inputHint, ...f ? n.inputHintMobile : null }, children: e("playground.input_hint") }),
          /* @__PURE__ */ c("div", { style: { ...n.inputButtonGroup, ...f ? n.inputButtonGroupMobile : null }, children: [
            ae && /* @__PURE__ */ c(
              "button",
              {
                type: "button",
                style: {
                  ...n.attachBtn,
                  ...W ? n.attachBtnActive : null,
                  ...f ? n.actionBtnMobile : null
                },
                onClick: () => {
                  if (v) {
                    U((t) => !t);
                    return;
                  }
                  yt();
                },
                disabled: J,
                title: e("playground.edit_image_region"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ o("path", { d: "M12 20h9" }),
                    /* @__PURE__ */ o("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
                  ] }),
                  e("playground.edit")
                ]
              }
            ),
            /* @__PURE__ */ c(
              "button",
              {
                type: "button",
                style: { ...n.attachBtn, ...f ? n.actionBtnMobile : null },
                onClick: Dn,
                disabled: J || W,
                title: e("playground.attach_images"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ o("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
                    /* @__PURE__ */ o("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                    /* @__PURE__ */ o("path", { d: "M21 15l-5-5L5 21" })
                  ] }),
                  e("playground.image")
                ]
              }
            ),
            J ? /* @__PURE__ */ c("button", { style: { ...n.stopBtn, ...f ? n.actionBtnMobile : null }, onClick: zn, children: [
              /* @__PURE__ */ o("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ o("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
              e("playground.stop")
            ] }) : /* @__PURE__ */ c(
              "button",
              {
                style: {
                  ...n.sendBtn,
                  ...f ? n.actionBtnMobile : null,
                  opacity: Ht ? 1 : 0.4
                },
                onClick: () => {
                  if (W) {
                    xt();
                    return;
                  }
                  bt();
                },
                disabled: !Ht,
                title: A && E ? void 0 : e("playground.select_model_first"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ o("path", { d: "M22 2L11 13" }),
                    /* @__PURE__ */ o("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                  ] }),
                  e("playground.send")
                ]
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ o("style", { children: Nr })
  ] });
}
const Nr = `
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
  generatedImageOverlayWrap: {
    position: "relative",
    display: "block",
    width: "100%",
    borderRadius: a("radiusMd"),
    overflow: "hidden"
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
  generatedImageDimOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: a("radiusMd"),
    background: "rgba(15, 23, 42, 0.34)",
    pointerEvents: "none"
  },
  generatedImageSelection: {
    position: "absolute",
    border: `2px solid ${a("primary")}`,
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
  imageEditPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 12,
    borderRadius: a("radiusMd"),
    border: `1px solid ${a("borderSubtle")}`,
    background: "linear-gradient(180deg, rgba(19, 28, 43, 0.72), rgba(10, 15, 26, 0.72))",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.035)"
  },
  imageEditPanelMobile: {
    padding: 10
  },
  imageEditHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  imageEditHeaderMobile: {
    flexDirection: "column"
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
    color: "#edf4ff"
  },
  imageEditSubtitle: {
    fontSize: 12,
    color: a("textTertiary")
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
    borderRadius: a("radiusSm"),
    border: `1px solid ${a("border")}`,
    background: "rgba(9, 14, 24, 0.5)",
    color: a("textSecondary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: a("transition"),
    fontFamily: a("fontSans")
  },
  imageEditIconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "999px",
    border: `1px solid ${a("borderSubtle")}`,
    background: "rgba(9, 14, 24, 0.52)",
    color: a("textSecondary"),
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer"
  },
  imageEditBody: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 150px",
    gap: 12,
    alignItems: "stretch"
  },
  imageEditBodyMobile: {
    gridTemplateColumns: "1fr"
  },
  imageEditStageWrap: {
    minWidth: 0,
    overflow: "auto",
    borderRadius: a("radiusMd"),
    border: `1px solid ${a("borderSubtle")}`,
    background: "rgba(2, 6, 14, 0.44)",
    padding: 8
  },
  imageEditStage: {
    position: "relative",
    display: "inline-flex",
    maxWidth: "100%",
    borderRadius: a("radiusSm"),
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
    display: "flex",
    flexDirection: "column",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 10,
    borderRadius: a("radiusSm"),
    border: `1px solid ${a("borderSubtle")}`,
    background: "rgba(5, 10, 18, 0.38)"
  },
  imageEditBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: "999px",
    background: a("primarySubtle"),
    color: a("primary"),
    fontSize: 11,
    fontWeight: 800,
    fontFamily: a("fontMono")
  },
  imageEditFilename: {
    color: a("textTertiary"),
    fontSize: 12,
    lineHeight: 1.4,
    wordBreak: "break-word"
  },
  imageEditEmptyBtn: {
    minHeight: 96,
    borderRadius: a("radiusMd"),
    border: `1px dashed ${a("border")}`,
    background: "rgba(45, 212, 191, 0.05)",
    color: a("primary"),
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: a("fontSans")
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
  attachBtnActive: {
    borderColor: a("borderFocus"),
    background: a("primarySubtle"),
    color: a("primary")
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
}, Vr = {
  routes: [
    { path: "/playground", component: Fr }
  ]
};
export {
  Vr as default
};
