import { jsxs as c, jsx as a, Fragment as De } from "react/jsx-runtime";
import { useState as _, useRef as ee, useEffect as be, useCallback as S, isValidElement as Tn, cloneElement as Et, Children as Bt } from "react";
import { useTranslation as zn } from "react-i18next";
const jt = {
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
}, An = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, Ln = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, ht = {
  ...An,
  ...Ln
}, Ot = {
  dark: jt
};
function $n(e) {
  return e.replace(/[A-Z]/g, (i) => "-" + i.toLowerCase());
}
function Ft(e = "ag") {
  return e.trim() || "ag";
}
function Qe(e, i) {
  return `--${e}-${$n(i)}`;
}
Object.keys(Ot.dark).reduce((e, i) => (e[i] = Qe("ag", i), e), {});
Object.keys(ht).reduce((e, i) => (e[i] = Qe("ag", i), e), {});
function Nt(e = {}) {
  const i = Ft(e.prefix);
  return Object.keys(Ot.dark).reduce((l, r) => (l[r] = Qe(i, r), l), {});
}
function Gt(e = {}) {
  const i = Ft(e.prefix);
  return Object.keys(ht).reduce((l, r) => (l[r] = Qe(i, r), l), {});
}
const Wn = Nt(), Dn = Gt();
function o(e, i = {}) {
  const l = i.prefix ? Nt(i) : Wn, r = i.prefix ? Gt(i) : Dn;
  if (e in l) {
    const u = e;
    return `var(${l[u]}, ${jt[u]})`;
  }
  const g = e;
  return `var(${r[g]}, ${ht[g]})`;
}
const ft = "/api/v1/ext-user/airgate-playground", Hn = "/api/v1";
function bt() {
  const e = {}, i = localStorage.getItem("token");
  return i && (e.Authorization = `Bearer ${i}`), e;
}
async function ie(e, i, l, r = ft) {
  const g = { ...bt() };
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
async function Pn(e, i, l) {
  const r = await ie(e, i, l, Hn);
  if (r.code !== 0)
    throw new Error(r.message || "request failed");
  return r.data;
}
const Z = {
  listConversations: () => ie("GET", "/conversations"),
  createConversation: (e) => ie("POST", "/conversations", e),
  getConversation: (e) => ie("GET", `/conversations/${e}`),
  updateConversation: (e, i) => ie("PUT", `/conversations/${e}`, i),
  deleteConversation: (e) => ie("DELETE", `/conversations/${e}`),
  listMessages: (e) => ie("GET", `/messages/${e}`),
  persistMessage: (e) => ie("POST", "/messages", e),
  listPlatforms: async () => (await ie("GET", "/platforms")).map((i) => {
    const l = i.name || i.Name || "", r = i.display_name || i.DisplayName || l;
    return { name: l, display_name: r };
  }).filter((i) => i.name),
  listModels: async (e) => {
    const i = await ie("GET", `/models?platform=${encodeURIComponent(e)}`);
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
  getUserInfo: () => Pn("GET", "/users/me")
};
async function jn(e, i, l) {
  var p;
  const r = await fetch(`${ft}/images/edits`, {
    method: "POST",
    headers: {
      ...bt(),
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
async function On(e, i, l, r) {
  var z, B, R;
  const g = {
    ...i,
    stream_options: {
      include_usage: !0,
      ...i.stream_options
    }
  }, u = await fetch(`${ft}/chat/completions`, {
    method: "POST",
    headers: {
      ...bt(),
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Airgate-Platform": e
    },
    body: JSON.stringify(g),
    signal: r
  });
  if (!u.ok || !u.body) {
    const v = await u.text();
    let A = `HTTP ${u.status}`;
    try {
      const D = JSON.parse(v);
      A = ((z = D.error) == null ? void 0 : z.message) || D.error || D.message || A;
    } catch {
    }
    l.onError(A);
    return;
  }
  const p = u.body.getReader(), b = new TextDecoder();
  let k = "", I = { input_tokens: 0, output_tokens: 0, model: i.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: v, value: A } = await p.read();
      if (v) break;
      k += b.decode(A, { stream: !0 });
      const D = k.split(`
`);
      k = D.pop() || "";
      for (const te of D) {
        const F = te.trim();
        if (!F.startsWith("data: ")) continue;
        const ne = F.slice(6);
        if (ne === "[DONE]") {
          l.onDone(I);
          return;
        }
        try {
          const x = JSON.parse(ne);
          if (x.error) {
            l.onError(x.error.message || x.error);
            return;
          }
          const y = (R = (B = x.choices) == null ? void 0 : B[0]) == null ? void 0 : R.delta, W = y == null ? void 0 : y.reasoning_content;
          W && l.onReasoning(W);
          const U = y == null ? void 0 : y.content;
          U && l.onData(U), x.usage && (I = {
            input_tokens: x.usage.prompt_tokens || x.usage.input_tokens || 0,
            output_tokens: x.usage.completion_tokens || x.usage.output_tokens || 0,
            model: x.model || I.model,
            cost: x.usage.cost || 0
          });
        } catch {
        }
      }
    }
    l.onDone(I);
  } catch (v) {
    if (r != null && r.aborted) return;
    l.onError(v instanceof Error ? v.message : "stream failed");
  }
}
const Rt = 960, K = -1, Ee = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, Ce = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, Fn = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/, Xe = /<!--airgate:image-edit:([A-Za-z0-9+/=]+)-->/g, Ut = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i, Nn = /(^|[-_])(?:gpt-?5|o[134]|codex)(?:[-_.]|$)/i, Tt = /(^|[-_])(?:gpt[-_]?image|image)(?:[-_.]|\d|$)/i, qt = 10 * 1024 * 1024, zt = 8, Gn = "gpt-5.5", ut = 16, Me = 3840, Un = [
  { value: 1024, label: "1K" },
  { value: 2048, label: "2K" },
  { value: 3840, label: "4K" }
], qn = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9" }
], Vn = {
  mode: "auto",
  baseResolution: 1024,
  ratio: "1:1"
};
function At(e, i, l) {
  return Math.min(l, Math.max(i, e));
}
function Lt(e, i) {
  const l = Math.min(e.x, i.x), r = Math.min(e.y, i.y);
  return {
    x: l,
    y: r,
    width: Math.abs(i.x - e.x),
    height: Math.abs(i.y - e.y)
  };
}
function Kn(e) {
  return !!(e && e.width >= zt && e.height >= zt);
}
function Jn(e) {
  return { ...e };
}
function Xn(e) {
  const [i, l] = e.split(":").map((r) => Number.parseInt(r, 10));
  return i > 0 && l > 0 ? { width: i, height: l } : null;
}
function Ze(e) {
  return Math.max(ut, Math.floor(e / ut) * ut);
}
function Yn(e, i) {
  return e <= Me && i <= Me ? { width: e, height: i } : e >= i ? { width: Me, height: Ze(i * Me / e) } : { width: Ze(e * Me / i), height: Me };
}
function gt(e, i) {
  const l = Yn(Ze(e), Ze(i));
  return `${l.width}x${l.height}`;
}
function Zn(e) {
  return Xn(e.ratio);
}
function Vt(e) {
  if (e.mode === "auto") return;
  const i = Zn(e);
  if (!i) return;
  const l = e.baseResolution;
  return i.width === i.height ? gt(l, l) : i.width > i.height ? gt(l, l * i.height / i.width) : gt(l * i.width / i.height, l);
}
function Qn(e) {
  return e.mode === "auto" ? "Auto" : Vt(e) || "Invalid size";
}
function Be(e) {
  return e.replace(Xe, "");
}
function er(e) {
  return Be(e).replace(Ee, "[Image generated]").trim() || "[Image generated]";
}
function tr(e) {
  return Be(e).replace(Ee, "[Image]").trim() || "[Image]";
}
function $t(e) {
  return Fn.test(e);
}
function nr(e) {
  return `<!--airgate:image-edit:${btoa(encodeURIComponent(JSON.stringify(e)))}-->`;
}
function rr(e) {
  const i = [];
  let l;
  for (Xe.lastIndex = 0; (l = Xe.exec(e)) !== null; )
    try {
      const r = JSON.parse(decodeURIComponent(atob(l[1])));
      r && Number.isInteger(r.imageIndex) && r.rect && [r.rect.x, r.rect.y, r.rect.width, r.rect.height].every((g) => typeof g == "number") && i.push(r);
    } catch {
    }
  return Xe.lastIndex = 0, i;
}
function ir(e) {
  Ce.lastIndex = 0;
  const i = Ce.exec(e);
  return Ce.lastIndex = 0, i ? { alt: i[1], url: i[2] } : null;
}
function or(e) {
  return Be(e).replace(Ee, "").trim().length > 0;
}
function Kt(e) {
  return e.replace(/[\]\\]/g, "");
}
function ar(e) {
  const i = e.match(Ut);
  if (i) return i[1].toLowerCase() === "jpeg" ? "jpg" : i[1].toLowerCase();
  try {
    const r = new URL(e).pathname.match(/\.([a-z0-9]{2,5})$/i);
    return r ? r[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}
function lr(e, i) {
  return `${(e || "generated-image").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80) || "generated-image"}.${ar(i)}`;
}
function pt(e, i) {
  const l = document.createElement("a");
  l.href = e, l.download = i, l.rel = "noreferrer", document.body.appendChild(l), l.click(), l.remove();
}
async function sr(e, i) {
  const l = lr(i, e);
  if (Ut.test(e)) {
    pt(e, l);
    return;
  }
  try {
    const r = await fetch(e);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const g = URL.createObjectURL(await r.blob());
    try {
      pt(g, l);
    } finally {
      URL.revokeObjectURL(g);
    }
  } catch {
    pt(e, l);
  }
}
async function dr(e) {
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
function Jt(e) {
  return new Promise((i, l) => {
    const r = new FileReader();
    r.onload = () => i(String(r.result || "")), r.onerror = () => l(r.error || new Error("Failed to read image")), r.readAsDataURL(e);
  });
}
function cr(e) {
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
function Wt(e) {
  return new Promise((i, l) => {
    const r = new Image();
    r.onload = () => i(r), r.onerror = () => l(new Error("Failed to load image")), r.src = e;
  });
}
function Dt(e, i, l = []) {
  const r = e.trim(), g = i.map((p) => `![${Kt(p.name)}](${p.url})`).join(`
`), u = l.map(nr).join(`
`);
  return [r, g, u].filter(Boolean).join(`

`);
}
async function ur(e) {
  const i = e.filter((l) => l.type.startsWith("image/"));
  if (i.some((l) => l.size > qt))
    throw new Error("Images must be 10MB or smaller");
  return Promise.all(i.map(async (l) => ({
    id: `${l.name}-${l.lastModified}-${l.size}`,
    name: l.name || "pasted-image",
    url: await Jt(l)
  })));
}
async function gr(e) {
  if (!e.type.startsWith("image/"))
    throw new Error("Select an image file");
  if (e.size > qt)
    throw new Error("Images must be 10MB or smaller");
  return {
    id: `${e.name}-${e.lastModified}-${e.size}`,
    name: e.name || "source-image",
    url: await Jt(e),
    file: e
  };
}
function pr(e) {
  var l;
  const i = (l = e.data) == null ? void 0 : l[0];
  return i ? i.url ? i.url : i.b64_json ? `data:image/png;base64,${i.b64_json}` : "" : "";
}
function mr(e, i) {
  var g, u, p;
  const l = pr(e);
  return l ? [(p = (u = (g = e.data) == null ? void 0 : g[0]) == null ? void 0 : u.revised_prompt) == null ? void 0 : p.trim(), `![${Kt(i)}](${l})`].filter(Boolean).join(`

`) : "";
}
function hr(e) {
  var i, l, r, g, u;
  return {
    input_tokens: ((i = e.usage) == null ? void 0 : i.prompt_tokens) || ((l = e.usage) == null ? void 0 : l.input_tokens) || 0,
    output_tokens: ((r = e.usage) == null ? void 0 : r.completion_tokens) || ((g = e.usage) == null ? void 0 : g.output_tokens) || 0,
    cost: ((u = e.usage) == null ? void 0 : u.cost) || 0
  };
}
function Ht(e) {
  const i = Be(e).replace(Ee, "[Image]").trim() || "[Image]";
  return i.slice(0, 30) + (i.length > 30 ? "..." : "");
}
function fr(e, i) {
  const l = Be(i);
  if (e !== "user") return er(l);
  const r = [];
  let g = 0, u;
  for (Ee.lastIndex = 0; (u = Ee.exec(l)) !== null; ) {
    const b = l.slice(g, u.index).trim();
    b && r.push({ type: "text", text: b }), r.push({ type: "image_url", image_url: { url: u[1] } }), g = u.index + u[0].length;
  }
  const p = l.slice(g).trim();
  return p && r.push({ type: "text", text: p }), r.length ? r : l;
}
function Xt(e, i) {
  return !!(e && Tt.test(e) || i && Tt.test(i));
}
function Ye(e) {
  var i;
  return !!(e && (e.image_only || (i = e.capabilities) != null && i.includes("image_generation") || Xt(e.id, e.name)));
}
function Ke(e) {
  var i, l;
  return !e || Ye(e) ? !1 : !!((i = e.capabilities) != null && i.includes("reasoning") || (l = e.capabilities) != null && l.includes("thinking") || Nn.test(e.id));
}
function _e(e) {
  return `${encodeURIComponent(e.platform || "")}:${encodeURIComponent(e.id)}`;
}
function mt(e) {
  return (e || "").toLowerCase().replace(/[-_\s]/g, "");
}
function br(e) {
  const i = mt("gpt-5.5"), l = e.find((r) => mt(r.id) === i || mt(r.name) === i);
  return l ? _e(l) : e[0] ? _e(e[0]) : "";
}
function yr(e, i) {
  var l;
  return ((l = e.find((r) => r.name === i)) == null ? void 0 : l.display_name) || i || "";
}
function xr(e) {
  return /^(https?:|mailto:|#)/i.test(e);
}
function vr(e) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:)/i.test(e);
}
function Pt(e, i, l) {
  i.split(`
`).forEach((g, u) => {
    u > 0 && e.push(/* @__PURE__ */ a("br", {}, `${l}-br-${u}`)), g && e.push(g);
  });
}
function Yt(e, i, l, r) {
  var z, B;
  const g = ((z = r.takeImageIndex) == null ? void 0 : z.call(r)) ?? -1, u = (B = r.imageEditAnnotations) == null ? void 0 : B.find((R) => R.imageIndex === g), p = /* @__PURE__ */ a("img", { src: i, alt: l, style: n.generatedImage, loading: "lazy" }), b = u ? /* @__PURE__ */ c("span", { style: n.generatedImageOverlayWrap, children: [
    p,
    /* @__PURE__ */ a("span", { style: n.generatedImageDimOverlay }),
    /* @__PURE__ */ a(
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
  ] }) : p, k = r.imagePreviewTitle || "Preview image", I = r.onImagePreview ? /* @__PURE__ */ a(
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
  return /* @__PURE__ */ a("span", { style: n.generatedImageFrame, children: I }, e);
}
function we(e, i, l = {}) {
  const r = [], g = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let u = 0, p;
  for (; (p = g.exec(e)) !== null; ) {
    p.index > u && Pt(r, e.slice(u, p.index), `${i}-text-${u}`);
    const b = `${i}-${p.index}`, k = p[2], I = p[3], z = p[4], B = p[5], R = p[6], v = p[7] || p[8], A = p[9] || p[10];
    I && vr(I) ? r.push(Yt(b, I, k || l.generatedImageAlt || "Generated image", l)) : B && xr(B) ? r.push(
      /* @__PURE__ */ a("a", { href: B, style: n.markdownLink, target: "_blank", rel: "noreferrer", children: we(z, `${b}-link`, l) }, b)
    ) : R ? r.push(/* @__PURE__ */ a("code", { style: n.markdownInlineCode, children: R }, b)) : v ? r.push(/* @__PURE__ */ a("strong", { children: we(v, `${b}-bold`, l) }, b)) : A ? r.push(/* @__PURE__ */ a("em", { children: we(A, `${b}-em`, l) }, b)) : r.push(p[0]), u = p.index + p[0].length;
  }
  return u < e.length && Pt(r, e.slice(u), `${i}-text-${u}`), r.length > 0 ? r : e;
}
function wr(e, i, l, r = {}) {
  const g = we(i, `${l}-inline`, r);
  return e === 1 ? /* @__PURE__ */ a("h1", { style: n.markdownH1, children: g }, l) : e === 2 ? /* @__PURE__ */ a("h2", { style: n.markdownH2, children: g }, l) : e === 3 ? /* @__PURE__ */ a("h3", { style: n.markdownH3, children: g }, l) : /* @__PURE__ */ a("h4", { style: n.markdownH4, children: g }, l);
}
function Sr(e, i, l = {}) {
  const r = [];
  let g;
  for (Ce.lastIndex = 0; (g = Ce.exec(e)) !== null; )
    r.push({ alt: g[1], url: g[2] });
  const u = e.replace(Ce, "").trim();
  return !r.length || u ? null : /* @__PURE__ */ a("div", { style: n.imageGroup, children: r.map((p, b) => Yt(`${i}-${b}`, p.url, p.alt || l.generatedImageAlt || "Generated image", l)) }, i);
}
const kr = /* @__PURE__ */ new Set(["p", "h1", "h2", "h3", "h4", "blockquote", "li"]);
function Zt(e, i) {
  if (!Tn(e) || typeof e.type != "string") return null;
  if (kr.has(e.type))
    return Et(e, void 0, ...Bt.toArray(e.props.children), i);
  if (e.type === "ol" || e.type === "ul") {
    const l = Bt.toArray(e.props.children);
    for (let r = l.length - 1; r >= 0; r--) {
      const g = Zt(l[r], i);
      if (g) {
        const u = [...l];
        return u[r] = g, Et(e, void 0, ...u);
      }
    }
  }
  return null;
}
function Ir(e, i) {
  if (!i) return e;
  for (let l = e.length - 1; l >= 0; l--) {
    const r = Zt(e[l], i);
    if (r) {
      const g = [...e];
      return g[l] = r, g;
    }
  }
  return e;
}
function Je(e, i = {}) {
  const l = Be(e);
  let r = -1;
  const g = {
    ...i,
    imageEditAnnotations: i.imageEditAnnotations || rr(e),
    takeImageIndex: () => (r += 1, r)
  }, u = l.replace(/\r\n?/g, `
`).split(`
`), p = [];
  let b = [], k = [], I = [], z = [], B = !1, R = 0;
  const v = (y) => `${y}-${R++}`, A = () => {
    if (!b.length) return;
    const y = v("p"), W = b.join(`
`);
    p.push(Sr(W, y, g) || /* @__PURE__ */ a("p", { style: n.markdownParagraph, children: we(W, y, g) }, y)), b = [];
  }, D = () => {
    if (!k.length) return;
    const y = v("quote");
    p.push(/* @__PURE__ */ a("blockquote", { style: n.markdownBlockquote, children: we(k.join(`
`), y, g) }, y)), k = [];
  }, te = () => {
    if (!I.length) return;
    const y = v("list"), W = I.map((U, oe) => /* @__PURE__ */ a("li", { style: n.markdownListItem, children: we(U.text, `${y}-${oe}`, g) }, `${y}-${oe}`));
    p.push(I[0].ordered ? /* @__PURE__ */ a("ol", { style: n.markdownList, children: W }, y) : /* @__PURE__ */ a("ul", { style: n.markdownList, children: W }, y)), I = [];
  }, F = () => {
    A(), D(), te();
  }, ne = () => {
    const y = v("code");
    p.push(/* @__PURE__ */ a("pre", { style: n.markdownCodeBlock, children: /* @__PURE__ */ a("code", { children: z.join(`
`) }) }, y)), z = [];
  };
  for (const y of u) {
    if (y.match(/^```/)) {
      B ? (ne(), B = !1) : (F(), B = !0);
      continue;
    }
    if (B) {
      z.push(y);
      continue;
    }
    if (!y.trim()) {
      F();
      continue;
    }
    const U = y.match(/^(#{1,6})\s+(.+)$/);
    if (U) {
      F(), p.push(wr(Math.min(U[1].length, 4), U[2].trim(), v("heading"), g));
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(y)) {
      F(), p.push(/* @__PURE__ */ a("hr", { style: n.markdownDivider }, v("hr")));
      continue;
    }
    const oe = y.match(/^>\s?(.*)$/);
    if (oe) {
      A(), te(), k.push(oe[1]);
      continue;
    }
    const ue = y.match(/^\s*[-*+]\s+(.+)$/), L = y.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ue || L) {
      A(), D();
      const Q = !!L;
      I.length && I[0].ordered !== Q && te(), I.push({ ordered: Q, text: ((L == null ? void 0 : L[1]) || (ue == null ? void 0 : ue[1]) || "").trim() });
      continue;
    }
    D(), te(), b.push(y);
  }
  B && ne(), F();
  const x = Ir(p, i.trailingInlineAction);
  return x.length > 0 ? x : l;
}
function Mr() {
  const { t: e } = zn(), [i, l] = _([]), [r, g] = _(null), [u, p] = _([]), [b, k] = _(null), [I, z] = _(""), [B, R] = _(""), [v, A] = _(!1), [D, te] = _(""), [F, ne] = _([]), [x, y] = _(null), [W, U] = _(!1), [oe, ue] = _(!1), [L, Q] = _(null), [et, ae] = _(null), [tt, Re] = _(null), [He, nt] = _(null), [Qt, en] = _([]), [ge, yt] = _([]), [xt, rt] = _(""), [le, tn] = _("medium"), [Se, nn] = _(() => Jn(Vn)), [pe, rn] = _(null), [it, C] = _(""), [ke, $] = _(null), [Pe, Te] = _(""), [on, je] = _(null), [Oe, ze] = _(!0), [f, an] = _(() => typeof window < "u" ? window.innerWidth <= Rt : !1), vt = ee(null), ot = ee(null), Ae = ee(null), Fe = ee(null), wt = ee(null), Le = ee(null), Ne = ee(null), ye = ee(null), q = ee(null), X = ee(null), Ge = ee(null);
  be(() => {
    Z.listConversations().then(l).catch(() => {
    }), Z.getUserInfo().then(rn).catch(() => {
    });
    let t = !1;
    return Z.listPlatforms().then(async (s) => {
      if (t) return;
      en(s);
      const d = await Promise.all(s.map((h) => Z.listModels(h.name).catch(() => [])));
      if (t) return;
      const m = d.flat();
      yt(m), rt((h) => m.some((w) => _e(w) === h) ? h : br(m));
    }).catch((s) => {
      t || (yt([]), rt(""), $(null), C(s instanceof Error ? s.message : "Failed to load models"));
    }), () => {
      t = !0;
    };
  }, []), be(() => {
    q.current = r;
  }, [r]), be(() => {
    if (!r || r === K) {
      p([]);
      return;
    }
    if (Ge.current === r) {
      Ge.current = null;
      return;
    }
    Z.listMessages(r).then(p).catch(() => {
    });
  }, [r]), be(() => {
    var t;
    (t = vt.current) == null || t.scrollIntoView({ behavior: "smooth" });
  }, [u, I, B]), be(() => {
    if (typeof window > "u") return;
    const t = window.matchMedia(`(max-width: ${Rt}px)`), s = (d) => {
      an(d ? d.matches : t.matches);
    };
    return s(), t.addEventListener ? (t.addEventListener("change", s), () => t.removeEventListener("change", s)) : (t.addListener(s), () => t.removeListener(s));
  }, []), be(() => {
    ze(!f);
  }, [f]), be(() => {
    if (!Pe) return;
    const t = window.setTimeout(() => Te(""), 1400);
    return () => window.clearTimeout(t);
  }, [Pe]), be(() => {
    if (!x || !W) return;
    let t = !1;
    const s = async () => {
      const m = Le.current, h = Ne.current;
      if (!m || !h) return;
      const w = await Wt(x.url);
      if (t) return;
      const M = h.clientWidth || w.naturalWidth, H = f ? 220 : 260, P = Math.min(1, M / w.naturalWidth, H / w.naturalHeight), ce = Math.max(1, Math.round(w.naturalWidth * P)), N = Math.max(1, Math.round(w.naturalHeight * P));
      m.width = ce, m.height = N, m.style.width = `${ce}px`, m.style.height = `${N}px`, Re({ width: ce, height: N });
      const V = m.getContext("2d");
      V && (V.clearRect(0, 0, ce, N), Q(null), ae(null), ye.current = null);
    };
    if (s().catch((m) => C(m instanceof Error ? m.message : "Failed to load image")), typeof ResizeObserver > "u")
      return () => {
        t = !0;
      };
    const d = new ResizeObserver(() => {
      s().catch((m) => C(m instanceof Error ? m.message : "Failed to load image"));
    });
    return Ne.current && d.observe(Ne.current), () => {
      t = !0, d.disconnect();
    };
  }, [x, W, f]);
  const re = S(() => 0, []), at = S((t) => {
    nn((s) => ({ ...s, ...t }));
  }, []), me = ge.find((t) => _e(t) === xt), E = (me == null ? void 0 : me.id) || "", ln = (me == null ? void 0 : me.platform) || "", se = Ye(me), $e = Ke(me), de = Vt(Se), sn = Qn(Se), T = ln, St = S(() => {
    const t = (/* @__PURE__ */ new Date()).toISOString(), s = {
      id: K,
      user_id: (pe == null ? void 0 : pe.id) || 0,
      title: "",
      group_id: re(),
      platform: T,
      model: E,
      created_at: t,
      updated_at: t
    };
    l((d) => [s, ...d.filter((m) => m.id !== K)]), g(K), p([]), ne([]), y(null), U(!1), Q(null), ae(null), Re(null), C(""), $(null), f && ze(!1);
  }, [f, re, T, E, pe == null ? void 0 : pe.id]), dn = S(async (t) => {
    var d, m;
    if (await ((m = (d = window.airgate) == null ? void 0 : d.confirm) == null ? void 0 : m.call(d, e("playground.delete_conversation_confirm"), {
      title: e("playground.delete_conversation"),
      danger: !0
    }))) {
      if (t === K) {
        l((h) => h.filter((w) => w.id !== t)), r === t && (g(null), p([]));
        return;
      }
      try {
        await Z.deleteConversation(t), l((h) => h.filter((w) => w.id !== t)), r === t && (g(null), p([]));
      } catch {
      }
    }
  }, [r, e]), he = S(async ({
    conversationID: t,
    requestMessages: s,
    model: d,
    groupID: m,
    platform: h,
    isImageRequest: w,
    imageSize: M,
    supportsReasoning: H,
    reasoningEffort: P,
    titleContent: ce
  }) => {
    const N = {
      conversationID: t,
      requestMessages: s.map((V) => ({ ...V })),
      model: d,
      groupID: m,
      platform: h,
      isImageRequest: w,
      imageSize: M,
      supportsReasoning: H,
      reasoningEffort: P
    };
    C(""), $(null), A(!0), k(t), X.current = { conversationId: t, model: d }, z(""), R("");
    try {
      const V = new AbortController();
      ot.current = V;
      let xe = "", ve = "";
      await On(
        h,
        {
          model: d,
          messages: s.map((j) => ({ role: j.role, content: fr(j.role, j.content) })),
          stream: !0,
          ...w && M ? { size: M } : {},
          ...H ? { reasoning_effort: P ?? le } : {}
        },
        {
          onData: (j) => {
            xe += j, z(xe);
          },
          onReasoning: (j) => {
            ve += j, R(ve);
          },
          onDone: async (j) => {
            if (!xe) {
              q.current === t && (C(e("playground.no_response")), $(N)), z(""), R(""), k(null), X.current = null, A(!1);
              return;
            }
            const O = await Z.persistMessage({
              conversation_id: t,
              role: "assistant",
              content: xe,
              reasoning: ve,
              platform: h,
              model: j.model || d,
              group_id: m,
              input_tokens: j.input_tokens,
              output_tokens: j.output_tokens,
              cost: j.cost
            });
            q.current === t && p((G) => [...G, O]), $(null), ce && l((G) => G.map(
              (fe) => fe.id === t && !fe.title ? { ...fe, title: Ht(ce), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : fe
            )), z(""), R(""), k(null), X.current = null, A(!1);
          },
          onError: (j) => {
            q.current === t && (C(j), $(N)), A(!1), z(""), R(""), k(null), X.current = null;
          }
        },
        V.signal
      );
    } catch (V) {
      q.current === t && (C(V instanceof Error ? V.message : "stream failed"), $(N)), A(!1), z(""), R(""), k(null), X.current = null;
    }
  }, [le, e]), lt = S(async () => {
    if (!D.trim() && F.length === 0 || v || !r) return;
    const t = Dt(D, F), s = re();
    let d = r;
    const m = [...u, {
      id: Date.now(),
      conversation_id: r,
      role: "user",
      content: t,
      reasoning_effort: $e ? le : void 0,
      platform: T,
      model: E,
      group_id: s,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    te(""), ne([]), Ae.current && (Ae.current.style.height = "24px"), Fe.current && (Fe.current.value = ""), C(""), $(null), p(m), A(!0), k(d), X.current = { conversationId: d, model: E }, z(""), R("");
    try {
      if (!T || !E)
        throw new Error("Model required");
      if (d === K) {
        const h = await Z.createConversation({
          title: "",
          group_id: s,
          platform: T,
          model: E
        });
        d = h.id, q.current === K && (q.current = h.id, Ge.current = h.id, g(h.id), p((w) => w.map((M) => ({ ...M, conversation_id: h.id })))), l((w) => [h, ...w.filter((M) => M.id !== K)]);
      }
      await Z.persistMessage({
        conversation_id: d,
        role: "user",
        content: t,
        reasoning_effort: $e ? le : void 0,
        platform: T,
        model: E,
        group_id: s
      }), await he({
        conversationID: d,
        requestMessages: m.map((h) => ({ ...h, conversation_id: d })),
        model: E,
        groupID: s,
        platform: T,
        isImageRequest: se,
        imageSize: se ? de : void 0,
        supportsReasoning: $e,
        reasoningEffort: le,
        titleContent: t
      });
    } catch (h) {
      q.current === d && C(h instanceof Error ? h.message : "stream failed"), A(!1), z(""), R(""), k(null), X.current = null;
    }
  }, [r, D, v, u, F, le, re, de, T, E, se, $e, he]), Ue = S(async (t) => {
    if (t.length)
      try {
        const s = await ur(t);
        if (!s.length) return;
        ne((d) => [...d, ...s]), C(""), $(null);
      } catch (s) {
        $(null), C(s instanceof Error ? s.message : "Failed to read image");
      }
  }, []), kt = S(async (t) => {
    if (t)
      try {
        const s = await gr(t);
        y(s), U(!0), Q(null), ae(null), Re(null), C(""), $(null);
      } catch (s) {
        $(null), C(s instanceof Error ? s.message : "Failed to read image");
      }
  }, []), cn = S(async (t) => {
    await Ue(Array.from(t.target.files || [])), t.target.value = "";
  }, [Ue]), un = S(async (t) => {
    var s;
    await kt((s = t.target.files) == null ? void 0 : s[0]), t.target.value = "";
  }, [kt]), st = S(() => {
    var t;
    (t = wt.current) == null || t.click();
  }, []), gn = S(() => {
    Q(null), ae(null), ye.current = null;
  }, []), pn = S(() => {
    U(!1), y(null), Q(null), ae(null), Re(null), ye.current = null;
  }, []), Ie = S((t) => {
    const s = Le.current;
    if (!s) return null;
    const d = s.getBoundingClientRect(), m = s.width / d.width, h = s.height / d.height;
    return {
      x: At((t.clientX - d.left) * m, 0, s.width),
      y: At((t.clientY - d.top) * h, 0, s.height)
    };
  }, []), mn = S((t) => {
    t.preventDefault();
    const s = Ie(t);
    s && (ye.current = s, Q(null), ae({ x: s.x, y: s.y, width: 0, height: 0 }), t.currentTarget.setPointerCapture(t.pointerId));
  }, [Ie]), hn = S((t) => {
    const s = ye.current;
    if (!s) return;
    t.preventDefault();
    const d = Ie(t);
    d && ae(Lt(s, d));
  }, [Ie]), It = S((t) => {
    const s = ye.current, d = Ie(t), m = s && d ? Lt(s, d) : et;
    ye.current = null, ae(null), Q(Kn(m) ? m : null), t.currentTarget.hasPointerCapture(t.pointerId) && t.currentTarget.releasePointerCapture(t.pointerId);
  }, [et, Ie]), Mt = S(async () => {
    const t = Le.current;
    if (!t || !x || !L) throw new Error("Selection required");
    const s = await Wt(x.url), d = document.createElement("canvas");
    d.width = s.naturalWidth, d.height = s.naturalHeight;
    const m = d.getContext("2d");
    if (!m) throw new Error("Failed to create mask");
    const h = s.naturalWidth / t.width, w = s.naturalHeight / t.height;
    return m.fillStyle = "#fff", m.fillRect(0, 0, d.width, d.height), m.clearRect(
      Math.floor(L.x * h),
      Math.floor(L.y * w),
      Math.ceil(L.width * h),
      Math.ceil(L.height * w)
    ), cr(d);
  }, [L, x]), dt = S(async () => {
    if (!r || v || oe) return;
    if (!T || !E) {
      $(null), C(e("playground.select_model_first"));
      return;
    }
    if (!se) {
      $(null), C(e("playground.select_image_model_first"));
      return;
    }
    if (!x) {
      $(null), C(e("playground.choose_source_image_first"));
      return;
    }
    if (!L) {
      $(null), C(e("playground.select_edit_area_first"));
      return;
    }
    const t = D.trim();
    if (!t) {
      $(null), C(e("playground.describe_image_change_first"));
      return;
    }
    const s = re();
    let d = r;
    const m = Le.current, h = m ? {
      imageIndex: 0,
      rect: {
        x: L.x / m.width,
        y: L.y / m.height,
        width: L.width / m.width,
        height: L.height / m.height
      }
    } : null, w = Dt(t, [x], h ? [h] : []), M = {
      id: Date.now(),
      conversation_id: r,
      role: "user",
      content: w,
      platform: T,
      model: E,
      group_id: s,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    te(""), Ae.current && (Ae.current.style.height = "24px"), C(""), $(null), p((H) => [...H, M]), A(!0), ue(!0), k(d), X.current = { conversationId: d, model: E }, z(""), R("");
    try {
      if (d === K) {
        const O = await Z.createConversation({
          title: "",
          group_id: s,
          platform: T,
          model: E
        });
        d = O.id, q.current === K && (q.current = O.id, Ge.current = O.id, g(O.id), p((G) => G.map((fe) => ({ ...fe, conversation_id: O.id })))), k(O.id), X.current = { conversationId: O.id, model: E }, l((G) => [O, ...G.filter((fe) => fe.id !== K)]);
      }
      const H = await Z.persistMessage({
        conversation_id: d,
        role: "user",
        content: w,
        platform: T,
        model: E,
        group_id: s
      });
      q.current === d && p((O) => O.map((G) => G.id === M.id ? H : G));
      const P = new AbortController();
      ot.current = P;
      const ce = await Mt();
      if (P.signal.aborted) return;
      const N = new FormData();
      N.append("model", E), N.append("prompt", t), N.append("image", x.file, x.name || "image.png"), N.append("mask", ce, "mask.png"), de && N.append("size", de);
      const V = await jn(T, N, P.signal);
      if (P.signal.aborted) return;
      const xe = mr(V, "edited-image");
      if (!xe) throw new Error("No image returned");
      const ve = hr(V), j = await Z.persistMessage({
        conversation_id: d,
        role: "assistant",
        content: xe,
        platform: T,
        model: V.model || E,
        group_id: s,
        input_tokens: ve.input_tokens,
        output_tokens: ve.output_tokens,
        cost: ve.cost
      });
      q.current === d && p((O) => [...O, j]), l((O) => O.map(
        (G) => G.id === d && !G.title ? { ...G, title: Ht(w), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : G
      )), y(null), U(!1), Q(null), ae(null), Re(null);
    } catch (H) {
      if (H instanceof DOMException && H.name === "AbortError") return;
      q.current === d && C(H instanceof Error ? H.message : "image edit failed");
    } finally {
      A(!1), ue(!1), z(""), R(""), k(null), X.current = null;
    }
  }, [r, Mt, L, x, D, oe, v, re, de, E, se, T, e]), fn = S((t) => {
    const s = Array.from(t.clipboardData.items).filter((d) => d.kind === "file" && d.type.startsWith("image/")).map((d) => d.getAsFile()).filter((d) => !!d);
    s.length && Ue(s);
  }, [Ue]), bn = S((t) => {
    ne((s) => s.filter((d) => d.id !== t));
  }, []), yn = S(() => {
    var s;
    (s = ot.current) == null || s.abort();
    const t = X.current;
    if (I || B) {
      const d = t == null ? void 0 : t.conversationId;
      d && q.current === d && p((m) => [...m, {
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
    z(""), R(""), k(null), X.current = null, ue(!1), A(!1);
  }, [I, B]), Y = i.find((t) => t.id === r), ct = u[u.length - 1], We = et || L, xn = !!(W && x && L && D.trim() && T && E && se), vn = !!(r && r !== K && (ct == null ? void 0 : ct.role) === "user" && !it && !v), J = v && b === r, _t = !!((W ? xn : D.trim() || F.length > 0) && T && E) && !v && !oe, wn = S((t) => {
    if (t.key === "Enter" && !t.shiftKey) {
      if (t.preventDefault(), !T || !E) {
        $(null), C(e("playground.select_model_first"));
        return;
      }
      if (W) {
        dt();
        return;
      }
      lt();
    }
  }, [W, E, T, lt, dt, e]), Sn = S(() => {
    var t;
    (t = Fe.current) == null || t.click();
  }, []), kn = S((t) => {
    t.style.height = "auto", t.style.height = Math.min(t.scrollHeight, 200) + "px";
  }, []), In = S((t) => {
    g(t), C(""), $(null), f && ze(!1);
  }, [f]), Mn = S(() => {
    if (!ke || v || r !== ke.conversationID) return;
    const t = ke;
    C(""), $(null), he({
      ...t,
      requestMessages: t.requestMessages.map((s) => ({ ...s }))
    });
  }, [r, v, ke, he]), _n = S(() => {
    if (v || !r || r === K) return;
    const t = u[u.length - 1];
    if ((t == null ? void 0 : t.role) !== "user") return;
    const s = t.model || (Y == null ? void 0 : Y.model) || E, d = t.platform || (Y == null ? void 0 : Y.platform) || T;
    if (!s || !d) {
      C("Model required");
      return;
    }
    const m = ge.find((M) => M.id === s && M.platform === d) || ge.find((M) => M.id === s), h = Ye(m) || Xt(s), w = Ke(m) || !!t.reasoning_effort;
    C(""), $(null), he({
      conversationID: r,
      requestMessages: u.map((M) => ({ ...M })),
      model: s,
      groupID: t.group_id || (Y == null ? void 0 : Y.group_id) || re(),
      platform: d,
      isImageRequest: h,
      imageSize: h ? de : void 0,
      supportsReasoning: w,
      reasoningEffort: t.reasoning_effort || le
    });
  }, [Y, r, v, u, ge, le, re, de, E, T, he]), Cn = S((t, s) => {
    nt({ url: t, alt: s });
  }, []), En = S((t, s) => {
    sr(t, s).then(() => Te(e("playground.download_started"))).catch(() => Te(e("playground.download_failed")));
  }, [e]), Bn = S((t) => {
    if (v || !r || r === K) return;
    const s = u.slice(0, t).map((P) => P.role).lastIndexOf("user");
    if (s < 0) {
      $(null), C(e("playground.no_image_prompt"));
      return;
    }
    const d = u.slice(0, s + 1), m = u[s], h = u[t], w = h.model || E, M = h.platform || m.platform || T, H = ge.find((P) => P.id === w && P.platform === M) || ge.find((P) => P.id === w);
    he({
      conversationID: r,
      requestMessages: d,
      model: w,
      groupID: h.group_id || m.group_id || re(),
      platform: M,
      isImageRequest: !0,
      imageSize: de,
      supportsReasoning: Ke(H)
    });
  }, [r, v, u, ge, re, de, T, E, he, e]), Rn = S((t) => {
    dr(t).then(() => Te("Message copied")).catch(() => Te("Copy failed"));
  }, []), qe = {
    onImagePreview: Cn,
    imagePreviewTitle: e("playground.preview_image"),
    generatedImageAlt: e("playground.generated_image")
  }, Ve = (t, s = "Copy message", d = !1, m = {}) => /* @__PURE__ */ a(
    "button",
    {
      type: "button",
      style: { ...n.messageCopyBtn, ...m },
      title: s,
      "aria-label": s,
      onClick: (h) => {
        d && (h.preventDefault(), h.stopPropagation()), Rn(t);
      },
      children: /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ a("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
        /* @__PURE__ */ a("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
      ] })
    }
  ), Ct = (t, s) => {
    const d = f || on === t, m = tr(s), w = or(s) ? /* @__PURE__ */ a("span", { style: {
      ...n.messageCopyAfterText,
      ...d ? n.messageCopyAfterTextVisible : null
    }, children: Ve(m, "Copy message", !1, n.messageCopyAfterTextBtn) }) : void 0;
    return /* @__PURE__ */ a(
      "div",
      {
        style: n.messageContent,
        onMouseEnter: () => je(t),
        onMouseLeave: () => je((M) => M === t ? null : M),
        onFocus: () => je(t),
        onBlur: (M) => {
          M.currentTarget.contains(M.relatedTarget) || je((H) => H === t ? null : H);
        },
        children: Je(s, {
          ...qe,
          trailingInlineAction: w
        })
      }
    );
  };
  return /* @__PURE__ */ c("div", { "data-full-bleed": !0, style: n.layout, children: [
    Oe && f && /* @__PURE__ */ a(
      "div",
      {
        style: n.sidebarBackdrop,
        onClick: () => ze(!1)
      }
    ),
    He && /* @__PURE__ */ a(
      "div",
      {
        style: n.imagePreviewOverlay,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": He.alt || e("playground.image_preview"),
        onClick: () => nt(null),
        children: /* @__PURE__ */ c("div", { style: n.imagePreviewModal, onClick: (t) => t.stopPropagation(), children: [
          /* @__PURE__ */ a("img", { src: He.url, alt: He.alt, style: n.imagePreviewLarge }),
          /* @__PURE__ */ a(
            "button",
            {
              type: "button",
              style: n.imagePreviewCloseBtn,
              onClick: () => nt(null),
              "aria-label": e("playground.close_image_preview"),
              children: "×"
            }
          )
        ] })
      }
    ),
    Oe && /* @__PURE__ */ c("div", { style: { ...n.sidebar, ...f ? n.sidebarMobile : null }, children: [
      /* @__PURE__ */ c("div", { style: n.sidebarHeader, children: [
        /* @__PURE__ */ a("span", { style: n.sidebarTitle, children: e("playground.conversations") }),
        /* @__PURE__ */ a(
          "button",
          {
            style: n.newBtn,
            onClick: St,
            title: e("playground.new_conversation"),
            children: /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ a("path", { d: "M7 1v12M1 7h12" }) })
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
                background: s ? o("primarySubtle") : "transparent",
                borderColor: s ? o("borderFocus") : "transparent"
              },
              onClick: () => In(t.id),
              children: [
                /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: o(s ? "primary" : "textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
                /* @__PURE__ */ a("span", { style: {
                  ...n.convTitle,
                  color: o(s ? "text" : "textSecondary")
                }, children: t.title || e("playground.new_conversation") }),
                /* @__PURE__ */ a(
                  "button",
                  {
                    style: n.deleteBtn,
                    onClick: (d) => {
                      d.stopPropagation(), dn(t.id);
                    },
                    title: e("playground.delete_conversation"),
                    children: /* @__PURE__ */ a("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: /* @__PURE__ */ a("path", { d: "M2 2l8 8M10 2l-8 8" }) })
                  }
                )
              ]
            },
            t.id
          );
        }),
        i.length === 0 && /* @__PURE__ */ c("div", { style: n.emptyConvList, children: [
          /* @__PURE__ */ a("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: o("textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5 }, children: /* @__PURE__ */ a("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ a("span", { children: e("playground.no_conversations") })
        ] })
      ] }),
      pe && /* @__PURE__ */ c("div", { style: n.balanceBar, children: [
        /* @__PURE__ */ a("span", { style: n.balanceLabel, children: e("playground.balance") }),
        /* @__PURE__ */ c("span", { style: n.balanceValue, children: [
          "$",
          pe.balance.toFixed(4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ c("div", { style: n.main, children: [
      /* @__PURE__ */ c("div", { style: { ...n.topBar, ...f ? n.topBarMobile : null }, children: [
        /* @__PURE__ */ c("div", { style: { ...n.topBarLeft, ...f ? n.topBarLeftMobile : null }, children: [
          /* @__PURE__ */ a("button", { style: n.toggleBtn, onClick: () => ze(!Oe), children: /* @__PURE__ */ a("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: Oe ? /* @__PURE__ */ c(De, { children: [
            /* @__PURE__ */ a("path", { d: "M6 2v12" }),
            /* @__PURE__ */ a("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ a("path", { d: "M10 6l-2 2 2 2" })
          ] }) : /* @__PURE__ */ c(De, { children: [
            /* @__PURE__ */ a("path", { d: "M6 2v12" }),
            /* @__PURE__ */ a("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ a("path", { d: "M8 6l2 2-2 2" })
          ] }) }) }),
          /* @__PURE__ */ c("div", { style: { ...n.selectors, ...f ? n.selectorsMobile : null }, children: [
            /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ a("label", { style: n.selectorLabel, children: e("playground.model") }),
              /* @__PURE__ */ a(
                "select",
                {
                  style: { ...n.select, ...f ? n.selectMobile : null },
                  value: xt,
                  onChange: (t) => rt(t.target.value),
                  children: ge.map((t) => /* @__PURE__ */ c("option", { value: _e(t), children: [
                    t.name || t.id,
                    " · ",
                    yr(Qt, t.platform),
                    Ye(t) ? " · image" : Ke(t) ? " · reasoning" : ""
                  ] }, _e(t)))
                }
              )
            ] }),
            se && /* @__PURE__ */ c(De, { children: [
              !f && /* @__PURE__ */ a("div", { style: n.selectorDivider }),
              /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ a("label", { style: n.selectorLabel, children: "Size" }),
                /* @__PURE__ */ c("div", { style: { ...n.imageSizeInlineControls, ...f ? n.imageSizeInlineControlsMobile : null }, children: [
                  /* @__PURE__ */ c(
                    "select",
                    {
                      style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                      value: Se.mode,
                      onChange: (t) => at({ mode: t.target.value }),
                      "aria-label": "Image size mode",
                      children: [
                        /* @__PURE__ */ a("option", { value: "auto", children: "Auto" }),
                        /* @__PURE__ */ a("option", { value: "ratio", children: "Ratio" })
                      ]
                    }
                  ),
                  Se.mode === "ratio" && /* @__PURE__ */ c(De, { children: [
                    /* @__PURE__ */ a(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                        value: Se.baseResolution,
                        onChange: (t) => at({ baseResolution: Number(t.target.value) }),
                        "aria-label": "Base resolution",
                        children: Un.map((t) => /* @__PURE__ */ a("option", { value: t.value, children: t.label }, t.value))
                      }
                    ),
                    /* @__PURE__ */ a(
                      "select",
                      {
                        style: { ...n.imageSizeMiniSelect, ...f ? n.imageSizeMiniSelectMobile : null },
                        value: Se.ratio,
                        onChange: (t) => at({ ratio: t.target.value }),
                        "aria-label": "Image ratio",
                        children: qn.map((t) => /* @__PURE__ */ a("option", { value: t.value, children: t.label }, t.value))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ a("span", { style: n.imageSizeInlinePreview, children: sn })
                ] })
              ] })
            ] }),
            $e && /* @__PURE__ */ c(De, { children: [
              !f && /* @__PURE__ */ a("div", { style: n.selectorDivider }),
              /* @__PURE__ */ c("div", { style: { ...n.selectorGroup, ...f ? n.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ a("label", { style: n.selectorLabel, children: "Effort" }),
                /* @__PURE__ */ c(
                  "select",
                  {
                    style: { ...n.select, ...f ? n.selectMobile : null },
                    value: le,
                    onChange: (t) => tn(t.target.value),
                    children: [
                      /* @__PURE__ */ a("option", { value: "minimal", children: "Minimal" }),
                      /* @__PURE__ */ a("option", { value: "low", children: "Low" }),
                      /* @__PURE__ */ a("option", { value: "medium", children: "Medium" }),
                      /* @__PURE__ */ a("option", { value: "high", children: "High" }),
                      /* @__PURE__ */ a("option", { value: "xhigh", children: "XHigh" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        Y && /* @__PURE__ */ a("span", { style: { ...n.topBarTitle, ...f ? n.topBarTitleMobile : null }, children: Y.title || e("playground.new_conversation") })
      ] }),
      /* @__PURE__ */ c("div", { style: n.messagesArea, children: [
        !r && /* @__PURE__ */ c("div", { style: { ...n.emptyState, ...f ? n.emptyStateMobile : null }, children: [
          /* @__PURE__ */ a("div", { style: n.emptyIcon, children: /* @__PURE__ */ c("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [
            /* @__PURE__ */ a("rect", { x: "4", y: "4", width: "40", height: "40", rx: "20", fill: o("primarySubtle") }),
            /* @__PURE__ */ a("path", { d: "M24 16v6m0 0v6m0-6h6m-6 0h-6", stroke: o("primary"), strokeWidth: "2", strokeLinecap: "round" })
          ] }) }),
          /* @__PURE__ */ a("div", { style: n.emptyTitle, children: e("playground.empty_title") }),
          /* @__PURE__ */ a("div", { style: n.emptyDesc, children: e("playground.empty_description") }),
          /* @__PURE__ */ c("button", { style: n.emptyBtn, onClick: St, children: [
            /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ a("path", { d: "M7 1v12M1 7h12" }) }),
            e("playground.new_conversation")
          ] })
        ] }),
        r && u.map((t, s) => /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ a("div", { style: t.role === "user" ? n.avatarUser : n.avatarAssistant, children: t.role === "user" ? /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ a("circle", { cx: "12", cy: "7", r: "4" })
          ] }) : /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ a("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ a("div", { style: n.messageHeader, children: /* @__PURE__ */ a("div", { style: n.messageRole, children: t.role === "user" ? e("playground.you") : e("playground.assistant") }) }),
            t.role === "assistant" && t.reasoning && /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ a("span", { children: "Thinking" }),
                Ve(t.reasoning, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ a("div", { style: n.reasoningContent, children: Je(t.reasoning, qe) })
            ] }),
            Ct(`message-${t.id}`, t.content),
            t.role === "assistant" && ($t(t.content) || t.model) && (() => {
              const d = ir(t.content);
              return /* @__PURE__ */ c("div", { style: $t(t.content) ? n.imageMessageActions : n.messageMeta, children: [
                d && /* @__PURE__ */ a(
                  "button",
                  {
                    type: "button",
                    style: n.imageDownloadBtn,
                    title: e("playground.download_image"),
                    "aria-label": e("playground.download_image"),
                    onClick: () => En(d.url, d.alt || e("playground.generated_image")),
                    children: /* @__PURE__ */ c("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ a("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                      /* @__PURE__ */ a("path", { d: "M7 10l5 5 5-5" }),
                      /* @__PURE__ */ a("path", { d: "M12 15V3" })
                    ] })
                  }
                ),
                d && /* @__PURE__ */ a(
                  "button",
                  {
                    type: "button",
                    style: { ...n.regenerateImageBtn, opacity: v ? 0.5 : 1 },
                    onClick: () => Bn(s),
                    disabled: v,
                    title: e("playground.retry_image"),
                    "aria-label": e("playground.retry_image"),
                    children: /* @__PURE__ */ c("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ a("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                      /* @__PURE__ */ a("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                      /* @__PURE__ */ a("path", { d: "M19 2v4h-4" }),
                      /* @__PURE__ */ a("path", { d: "M5 22v-4h4" })
                    ] })
                  }
                ),
                t.model && /* @__PURE__ */ a("span", { style: n.metaBadge, children: t.model })
              ] });
            })()
          ] })
        ] }, t.id)),
        J && I && /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ a("div", { style: n.avatarAssistant, children: /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ a("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ a("div", { style: n.messageHeader, children: /* @__PURE__ */ a("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            B && /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ a("span", { children: "Thinking" }),
                Ve(B, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ a("div", { style: n.reasoningContent, children: Je(B, qe) })
            ] }),
            Ct(`stream-${b || "active"}`, I),
            /* @__PURE__ */ c("div", { style: n.messageMeta, children: [
              /* @__PURE__ */ a("span", { style: n.streamingDot }),
              /* @__PURE__ */ a("span", { children: e("playground.streaming") })
            ] })
          ] })
        ] }),
        J && !I && /* @__PURE__ */ c("div", { style: { ...n.messageRow, ...f ? n.messageRowMobile : null }, children: [
          /* @__PURE__ */ a("div", { style: n.avatarAssistant, children: /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ a("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ c("div", { style: n.messageBody, children: [
            /* @__PURE__ */ a("div", { style: n.messageHeader, children: /* @__PURE__ */ a("div", { style: n.messageRole, children: e("playground.assistant") }) }),
            B ? /* @__PURE__ */ c("details", { style: n.reasoningBox, open: !0, children: [
              /* @__PURE__ */ c("summary", { style: n.reasoningSummary, children: [
                /* @__PURE__ */ a("span", { children: "Thinking" }),
                Ve(B, "Copy thinking", !0)
              ] }),
              /* @__PURE__ */ a("div", { style: n.reasoningContent, children: Je(B, qe) })
            ] }) : /* @__PURE__ */ a("div", { style: { ...n.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ a("span", { style: n.thinkingDots, children: e("playground.thinking") }) })
          ] })
        ] }),
        vn && /* @__PURE__ */ c("div", { style: { ...n.errorBar, ...n.recoverableBar, ...f ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ a("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ a("span", { style: n.errorMessage, children: e("playground.response_unfinished", { defaultValue: "Response was interrupted before the assistant replied." }) }),
          /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              style: n.recoverableRetryBtn,
              onClick: _n,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ a("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ a("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ a("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ a("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        it && /* @__PURE__ */ c("div", { style: { ...n.errorBar, ...f ? n.errorBarMobile : null }, children: [
          /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ a("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ a("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          /* @__PURE__ */ a("span", { style: n.errorMessage, children: it }),
          ke && ke.conversationID === r && !v && /* @__PURE__ */ c(
            "button",
            {
              type: "button",
              style: n.errorRetryBtn,
              onClick: Mn,
              title: e("playground.regenerate"),
              "aria-label": e("playground.regenerate"),
              children: [
                /* @__PURE__ */ c("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ a("path", { d: "M21 12a9 9 0 0 1-15.6 6" }),
                  /* @__PURE__ */ a("path", { d: "M3 12a9 9 0 0 1 15.6-6" }),
                  /* @__PURE__ */ a("path", { d: "M19 2v4h-4" }),
                  /* @__PURE__ */ a("path", { d: "M5 22v-4h4" })
                ] }),
                e("playground.regenerate")
              ]
            }
          )
        ] }),
        Pe && /* @__PURE__ */ a("div", { style: n.interactionNotice, children: Pe }),
        /* @__PURE__ */ a("div", { ref: vt })
      ] }),
      r && /* @__PURE__ */ a("div", { style: { ...n.inputArea, ...f ? n.inputAreaMobile : null }, children: /* @__PURE__ */ c("div", { style: { ...n.inputWrapper, ...J ? n.inputWrapperStreaming : null }, children: [
        se && W && /* @__PURE__ */ c("div", { style: { ...n.imageEditPanel, ...f ? n.imageEditPanelMobile : null }, children: [
          /* @__PURE__ */ c("div", { style: { ...n.imageEditHeader, ...f ? n.imageEditHeaderMobile : null }, children: [
            /* @__PURE__ */ c("div", { style: n.imageEditTitleWrap, children: [
              /* @__PURE__ */ a("span", { style: n.imageEditTitle, children: e("playground.edit_image_region") }),
              /* @__PURE__ */ a("span", { style: n.imageEditSubtitle, children: e(x ? "playground.edit_image_region_hint" : "playground.choose_source_image_region_hint") })
            ] }),
            /* @__PURE__ */ c("div", { style: n.imageEditHeaderActions, children: [
              /* @__PURE__ */ a(
                "button",
                {
                  type: "button",
                  style: n.imageEditGhostBtn,
                  onClick: st,
                  disabled: J,
                  children: e(x ? "playground.replace_source" : "playground.choose_source")
                }
              ),
              /* @__PURE__ */ a(
                "button",
                {
                  type: "button",
                  style: n.imageEditIconBtn,
                  onClick: pn,
                  disabled: J,
                  "aria-label": "Close image editor",
                  children: "×"
                }
              )
            ] })
          ] }),
          x ? /* @__PURE__ */ c("div", { style: { ...n.imageEditBody, ...f ? n.imageEditBodyMobile : null }, children: [
            /* @__PURE__ */ a("div", { ref: Ne, style: n.imageEditStageWrap, children: /* @__PURE__ */ c("div", { style: {
              ...n.imageEditStage,
              ...tt ? { width: tt.width, height: tt.height } : null
            }, children: [
              /* @__PURE__ */ a("img", { src: x.url, alt: x.name, style: n.imageEditSource, draggable: !1 }),
              We && /* @__PURE__ */ a(
                "div",
                {
                  style: {
                    ...n.imageEditSelection,
                    left: We.x,
                    top: We.y,
                    width: We.width,
                    height: We.height
                  }
                }
              ),
              /* @__PURE__ */ a(
                "canvas",
                {
                  ref: Le,
                  style: n.imageEditCanvas,
                  onPointerDown: mn,
                  onPointerMove: hn,
                  onPointerUp: It,
                  onPointerCancel: It,
                  "aria-label": "Box-select image edit region"
                }
              )
            ] }) }),
            /* @__PURE__ */ c("div", { style: n.imageEditSidePanel, children: [
              /* @__PURE__ */ a("div", { style: n.imageEditBadge, children: e(L ? "playground.region_selected" : "playground.drag_to_select") }),
              /* @__PURE__ */ a("div", { style: n.imageEditFilename, children: x.name }),
              /* @__PURE__ */ a(
                "button",
                {
                  type: "button",
                  style: { ...n.imageEditGhostBtn, opacity: L ? 1 : 0.5 },
                  onClick: gn,
                  disabled: !L || J,
                  children: e("playground.clear_selection")
                }
              )
            ] })
          ] }) : /* @__PURE__ */ a(
            "button",
            {
              type: "button",
              style: n.imageEditEmptyBtn,
              onClick: st,
              disabled: J,
              children: e("playground.choose_source_image_for_regional_editing")
            }
          )
        ] }),
        F.length > 0 && /* @__PURE__ */ a("div", { style: n.imagePreviewList, children: F.map((t) => /* @__PURE__ */ c("div", { style: n.imagePreviewItem, children: [
          /* @__PURE__ */ a("img", { src: t.url, alt: t.name, style: n.imagePreview }),
          /* @__PURE__ */ a(
            "button",
            {
              type: "button",
              style: n.removeImageBtn,
              onClick: () => bn(t.id),
              "aria-label": `Remove ${t.name}`,
              children: "×"
            }
          )
        ] }, t.id)) }),
        /* @__PURE__ */ a(
          "textarea",
          {
            ref: Ae,
            style: n.textarea,
            value: D,
            onChange: (t) => {
              te(t.target.value), kn(t.target);
            },
            onPaste: fn,
            onKeyDown: wn,
            placeholder: e("playground.input_placeholder"),
            rows: 1,
            disabled: J
          }
        ),
        /* @__PURE__ */ a(
          "input",
          {
            ref: Fe,
            type: "file",
            accept: "image/*",
            multiple: !0,
            style: n.fileInput,
            onChange: cn,
            disabled: J
          }
        ),
        /* @__PURE__ */ a(
          "input",
          {
            ref: wt,
            type: "file",
            accept: "image/*",
            style: n.fileInput,
            onChange: un,
            disabled: J
          }
        ),
        /* @__PURE__ */ c("div", { style: { ...n.inputActions, ...f ? n.inputActionsMobile : null }, children: [
          /* @__PURE__ */ a("span", { style: { ...n.inputHint, ...f ? n.inputHintMobile : null }, children: e("playground.input_hint") }),
          /* @__PURE__ */ c("div", { style: { ...n.inputButtonGroup, ...f ? n.inputButtonGroupMobile : null }, children: [
            se && /* @__PURE__ */ c(
              "button",
              {
                type: "button",
                style: {
                  ...n.attachBtn,
                  ...W ? n.attachBtnActive : null,
                  ...f ? n.actionBtnMobile : null
                },
                onClick: () => {
                  if (x) {
                    U((t) => !t);
                    return;
                  }
                  st();
                },
                disabled: J,
                title: e("playground.edit_image_region"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ a("path", { d: "M12 20h9" }),
                    /* @__PURE__ */ a("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
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
                onClick: Sn,
                disabled: J || W,
                title: e("playground.attach_images"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ a("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
                    /* @__PURE__ */ a("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                    /* @__PURE__ */ a("path", { d: "M21 15l-5-5L5 21" })
                  ] }),
                  e("playground.image")
                ]
              }
            ),
            J ? /* @__PURE__ */ c("button", { style: { ...n.stopBtn, ...f ? n.actionBtnMobile : null }, onClick: yn, children: [
              /* @__PURE__ */ a("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ a("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
              e("playground.stop")
            ] }) : /* @__PURE__ */ c(
              "button",
              {
                style: {
                  ...n.sendBtn,
                  ...f ? n.actionBtnMobile : null,
                  opacity: _t ? 1 : 0.4
                },
                onClick: () => {
                  if (W) {
                    dt();
                    return;
                  }
                  lt();
                },
                disabled: !_t,
                title: T && E ? void 0 : e("playground.select_model_first"),
                children: [
                  /* @__PURE__ */ c("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ a("path", { d: "M22 2L11 13" }),
                    /* @__PURE__ */ a("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                  ] }),
                  e("playground.send")
                ]
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ a("style", { children: _r })
  ] });
}
const _r = `
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
    background: o("bgDeep"),
    fontFamily: o("fontSans"),
    color: o("text"),
    overflow: "hidden"
  },
  // ── Sidebar ──
  sidebar: {
    width: 280,
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: o("bg"),
    borderRight: `1px solid ${o("borderSubtle")}`,
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
    color: o("textTertiary")
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: `1px solid ${o("border")}`,
    borderRadius: o("radiusSm"),
    background: o("bgSurface"),
    color: o("textSecondary"),
    cursor: "pointer",
    transition: o("transition")
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
    borderRadius: o("radiusSm"),
    cursor: "pointer",
    transition: o("transition"),
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
    color: o("textTertiary"),
    cursor: "pointer",
    padding: "2px",
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.5,
    transition: o("transition"),
    marginTop: 1
  },
  emptyConvList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    color: o("textTertiary"),
    fontSize: 12
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: `1px solid ${o("borderSubtle")}`
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: o("textTertiary")
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: o("fontMono"),
    color: o("primary")
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
    borderBottom: `1px solid ${o("borderSubtle")}`,
    background: o("bg"),
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
    borderRadius: o("radiusSm"),
    background: "transparent",
    color: o("textSecondary"),
    cursor: "pointer",
    transition: o("transition"),
    flexShrink: 0
  },
  selectors: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: o("bgSurface"),
    borderRadius: o("radiusSm"),
    border: `1px solid ${o("borderSubtle")}`,
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
    color: o("textTertiary"),
    whiteSpace: "nowrap"
  },
  selectorDivider: {
    width: 1,
    height: 24,
    background: o("borderSubtle"),
    flexShrink: 0
  },
  select: {
    padding: "2px 4px",
    border: "none",
    background: "transparent",
    color: o("text"),
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    fontFamily: o("fontSans"),
    minWidth: 0
  },
  selectMobile: {
    width: "100%",
    minHeight: 30,
    borderRadius: o("radiusSm"),
    padding: "5px 7px",
    background: o("bgDeep"),
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
    border: `1px solid ${o("borderSubtle")}`,
    borderRadius: o("radiusSm"),
    background: o("bgDeep"),
    color: o("text"),
    fontSize: 12,
    fontWeight: 600,
    outline: "none",
    fontFamily: o("fontSans")
  },
  imageSizeMiniSelectMobile: {
    flex: "1 1 74px",
    maxWidth: "none"
  },
  imageSizeInlinePreview: {
    minWidth: 82,
    padding: "3px 7px",
    borderRadius: o("radiusSm"),
    background: o("primarySubtle"),
    color: o("primary"),
    fontSize: 12,
    fontWeight: 700,
    fontFamily: o("fontMono"),
    whiteSpace: "nowrap"
  },
  topBarTitle: {
    fontSize: 12,
    color: o("textTertiary"),
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
    color: o("text"),
    letterSpacing: "-0.02em"
  },
  emptyDesc: {
    fontSize: 13,
    color: o("textSecondary"),
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
    borderRadius: o("radiusMd"),
    background: o("primary"),
    color: o("textInverse"),
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: o("transition"),
    marginTop: 8,
    fontFamily: o("fontSans")
  },
  // ── Message row ──
  messageRow: {
    display: "flex",
    gap: 14,
    padding: "20px 28px",
    animation: "pg-fadein 0.25s ease-out",
    borderBottom: `1px solid ${o("borderSubtle")}`
  },
  messageRowMobile: {
    gap: 10,
    padding: "16px 14px"
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: o("primary"),
    color: o("textInverse"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarAssistant: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: o("bgSurface"),
    border: `1px solid ${o("border")}`,
    color: o("textSecondary"),
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
    color: o("text")
  },
  messageCopyBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    border: `1px solid ${o("borderSubtle")}`,
    borderRadius: "999px",
    background: "transparent",
    color: o("textTertiary"),
    cursor: "pointer",
    transition: o("transition")
  },
  messageCopyAfterText: {
    display: "inline-flex",
    verticalAlign: "text-bottom",
    marginLeft: 6,
    opacity: 0,
    pointerEvents: "none",
    transform: "translateY(1px)",
    transition: o("transition")
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
    borderRadius: o("radiusSm"),
    background: "linear-gradient(180deg, rgba(17, 23, 36, 0.92), rgba(10, 14, 24, 0.92))",
    border: "1px solid rgba(148, 175, 225, 0.075)",
    color: "#d5deef",
    fontFamily: o("fontMono"),
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
    fontFamily: o("fontMono"),
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
    borderRadius: o("radiusSm"),
    background: o("bgSurface"),
    border: `1px solid ${o("borderSubtle")}`
  },
  reasoningSummary: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    color: o("textSecondary"),
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
    borderRadius: o("radiusMd"),
    overflow: "hidden"
  },
  generatedImage: {
    display: "block",
    maxHeight: 420,
    width: "100%",
    height: "auto",
    borderRadius: o("radiusMd"),
    border: `1px solid ${o("borderSubtle")}`,
    objectFit: "contain"
  },
  generatedImageDimOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: o("radiusMd"),
    background: "rgba(15, 23, 42, 0.34)",
    pointerEvents: "none"
  },
  generatedImageSelection: {
    position: "absolute",
    border: `2px solid ${o("primary")}`,
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
    border: `1px solid ${o("borderSubtle")}`,
    background: o("bgSurface"),
    color: o("textSecondary"),
    cursor: "pointer",
    transition: o("transition")
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
    border: `1px solid ${o("borderSubtle")}`,
    background: o("bgSurface"),
    color: o("textSecondary"),
    cursor: "pointer",
    transition: o("transition")
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
    borderRadius: o("radiusLg"),
    border: `1px solid ${o("border")}`,
    background: o("bgDeep"),
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
    background: o("bgDeep")
  },
  interactionNotice: {
    position: "sticky",
    bottom: 12,
    alignSelf: "center",
    zIndex: 4,
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(10, 14, 24, 0.9)",
    border: `1px solid ${o("borderSubtle")}`,
    color: o("textSecondary"),
    fontSize: 12,
    boxShadow: "0 10px 28px rgba(0, 0, 0, 0.22)"
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: o("textTertiary")
  },
  metaBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "999px",
    background: o("bgSurface"),
    border: `1px solid ${o("borderSubtle")}`,
    fontSize: 11,
    fontFamily: o("fontMono"),
    color: o("textSecondary")
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: o("primary"),
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
    borderRadius: o("radiusSm"),
    background: o("dangerSubtle"),
    color: o("danger"),
    fontSize: 13,
    border: `1px solid ${o("danger")}`,
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
    background: o("primarySubtle"),
    color: o("primary"),
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
    color: o("danger"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: o("fontSans")
  },
  recoverableRetryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(45, 212, 191, 0.3)",
    background: "rgba(45, 212, 191, 0.12)",
    color: o("primary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: o("fontSans")
  },
  // ── Input ──
  inputArea: {
    padding: "16px 28px 20px",
    borderTop: `1px solid ${o("borderSubtle")}`,
    background: o("bg"),
    flexShrink: 0
  },
  inputAreaMobile: {
    padding: "10px 12px 12px"
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: `1px solid ${o("border")}`,
    borderRadius: o("radiusMd"),
    background: o("bgSurface"),
    padding: "10px 12px 8px",
    transition: o("transition")
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
    borderRadius: o("radiusMd"),
    border: `1px solid ${o("borderSubtle")}`,
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
    color: o("textTertiary")
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
    borderRadius: o("radiusSm"),
    border: `1px solid ${o("border")}`,
    background: "rgba(9, 14, 24, 0.5)",
    color: o("textSecondary"),
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: o("transition"),
    fontFamily: o("fontSans")
  },
  imageEditIconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "999px",
    border: `1px solid ${o("borderSubtle")}`,
    background: "rgba(9, 14, 24, 0.52)",
    color: o("textSecondary"),
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
    borderRadius: o("radiusMd"),
    border: `1px solid ${o("borderSubtle")}`,
    background: "rgba(2, 6, 14, 0.44)",
    padding: 8
  },
  imageEditStage: {
    position: "relative",
    display: "inline-flex",
    maxWidth: "100%",
    borderRadius: o("radiusSm"),
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
    borderRadius: o("radiusSm"),
    border: `1px solid ${o("borderSubtle")}`,
    background: "rgba(5, 10, 18, 0.38)"
  },
  imageEditBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "4px 8px",
    borderRadius: "999px",
    background: o("primarySubtle"),
    color: o("primary"),
    fontSize: 11,
    fontWeight: 800,
    fontFamily: o("fontMono")
  },
  imageEditFilename: {
    color: o("textTertiary"),
    fontSize: 12,
    lineHeight: 1.4,
    wordBreak: "break-word"
  },
  imageEditEmptyBtn: {
    minHeight: 96,
    borderRadius: o("radiusMd"),
    border: `1px dashed ${o("border")}`,
    background: "rgba(45, 212, 191, 0.05)",
    color: o("primary"),
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: o("fontSans")
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
    borderRadius: o("radiusSm"),
    overflow: "hidden",
    border: `1px solid ${o("borderSubtle")}`,
    background: o("bgHover")
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
    color: o("text"),
    fontSize: 14,
    fontFamily: o("fontSans"),
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
    color: o("textTertiary")
  },
  inputHintMobile: {
    display: "none"
  },
  attachBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: `1px solid ${o("border")}`,
    borderRadius: o("radiusSm"),
    background: o("bgSurface"),
    color: o("textSecondary"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: o("transition"),
    fontFamily: o("fontSans")
  },
  attachBtnActive: {
    borderColor: o("borderFocus"),
    background: o("primarySubtle"),
    color: o("primary")
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: o("radiusSm"),
    background: o("primary"),
    color: o("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: o("transition"),
    fontFamily: o("fontSans")
  },
  stopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: o("radiusSm"),
    background: o("danger"),
    color: o("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: o("fontSans")
  },
  actionBtnMobile: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center"
  }
}, Rr = {
  routes: [
    { path: "/playground", component: Mr }
  ]
};
export {
  Rr as default
};
