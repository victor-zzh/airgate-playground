import { jsxs as d, jsx as r, Fragment as be } from "react/jsx-runtime";
import { useState as w, useRef as J, useEffect as Y, useCallback as H } from "react";
import { useTranslation as Qe } from "react-i18next";
const Re = {
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
}, Ze = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, et = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, xe = {
  ...Ze,
  ...et
}, $e = {
  dark: Re
};
function tt(n) {
  return n.replace(/[A-Z]/g, (a) => "-" + a.toLowerCase());
}
function Ae(n = "ag") {
  return n.trim() || "ag";
}
function ue(n, a) {
  return `--${n}-${tt(a)}`;
}
Object.keys($e.dark).reduce((n, a) => (n[a] = ue("ag", a), n), {});
Object.keys(xe).reduce((n, a) => (n[a] = ue("ag", a), n), {});
function ze(n = {}) {
  const a = Ae(n.prefix);
  return Object.keys($e.dark).reduce((o, s) => (o[s] = ue(a, s), o), {});
}
function He(n = {}) {
  const a = Ae(n.prefix);
  return Object.keys(xe).reduce((o, s) => (o[s] = ue(a, s), o), {});
}
const nt = ze(), rt = He();
function i(n, a = {}) {
  const o = a.prefix ? ze(a) : nt, s = a.prefix ? He(a) : rt;
  if (n in o) {
    const l = n;
    return `var(${o[l]}, ${Re[l]})`;
  }
  const p = n;
  return `var(${s[p]}, ${xe[p]})`;
}
const it = "/api/v1/ext-user/airgate-playground", ot = "/api/v1";
function at() {
  const n = {}, a = localStorage.getItem("token");
  return a && (n.Authorization = `Bearer ${a}`), n;
}
async function K(n, a, o, s = it) {
  const p = { ...at() };
  o !== void 0 && (p["Content-Type"] = "application/json");
  const l = await fetch(s + a, {
    method: n,
    headers: p,
    body: o ? JSON.stringify(o) : void 0
  });
  if (!l.ok) {
    const C = await l.text();
    let v = `HTTP ${l.status}`;
    try {
      const b = JSON.parse(C);
      v = b.error || b.message || v;
    } catch {
    }
    throw l.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login"), new Error(v);
  }
  const m = await l.text();
  return m ? JSON.parse(m) : null;
}
async function ce(n, a, o) {
  const s = await K(n, a, o, ot);
  if (s.code !== 0)
    throw new Error(s.message || "request failed");
  return s.data;
}
const D = {
  listConversations: () => K("GET", "/conversations"),
  createConversation: (n) => K("POST", "/conversations", n),
  getConversation: (n) => K("GET", `/conversations/${n}`),
  updateConversation: (n, a) => K("PUT", `/conversations/${n}`, a),
  deleteConversation: (n) => K("DELETE", `/conversations/${n}`),
  listMessages: (n) => K("GET", `/messages/${n}`),
  persistMessage: (n) => K("POST", "/messages", n),
  listModelsByAPIKey: async (n) => {
    var p;
    const a = await fetch("/v1/models", {
      headers: { Authorization: `Bearer ${n}` }
    });
    if (!a.ok) {
      const l = await a.text();
      let m = `HTTP ${a.status}`;
      try {
        const C = JSON.parse(l);
        m = ((p = C.error) == null ? void 0 : p.message) || C.error || C.message || m;
      } catch {
      }
      throw new Error(m);
    }
    const o = await a.json();
    return (Array.isArray(o) ? o : o.data || []).map((l) => ({
      id: l.id,
      name: l.name || l.id,
      input_price: l.input_price || 0,
      output_price: l.output_price || 0,
      context_window: l.context_window || 0,
      max_output_tokens: l.max_output_tokens || 0,
      image_only: !!l.image_only,
      capabilities: l.capabilities || []
    }));
  },
  getUserInfo: () => ce("GET", "/users/me"),
  listAPIKeys: () => ce("GET", "/api-keys?page=1&page_size=100"),
  revealAPIKey: (n) => ce("GET", `/api-keys/${n}/reveal`),
  listGroups: () => ce("GET", "/groups?page=1&page_size=100")
};
async function st(n, a, o, s) {
  var M, _, I;
  const p = {
    ...a,
    stream_options: {
      include_usage: !0,
      ...a.stream_options
    }
  }, l = await fetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${n}`
    },
    body: JSON.stringify(p),
    signal: s
  });
  if (!l.ok || !l.body) {
    const k = await l.text();
    let R = `HTTP ${l.status}`;
    try {
      const h = JSON.parse(k);
      R = ((M = h.error) == null ? void 0 : M.message) || h.error || h.message || R;
    } catch {
    }
    o.onError(R);
    return;
  }
  const m = l.body.getReader(), C = new TextDecoder();
  let v = "", b = { input_tokens: 0, output_tokens: 0, model: a.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: k, value: R } = await m.read();
      if (k) break;
      v += C.decode(R, { stream: !0 });
      const h = v.split(`
`);
      v = h.pop() || "";
      for (const P of h) {
        const $ = P.trim();
        if (!$.startsWith("data: ")) continue;
        const z = $.slice(6);
        if (z === "[DONE]") {
          o.onDone(b);
          return;
        }
        try {
          const S = JSON.parse(z);
          if (S.error) {
            o.onError(S.error.message || S.error);
            return;
          }
          const L = (I = (_ = S.choices) == null ? void 0 : _[0]) == null ? void 0 : I.delta, B = L == null ? void 0 : L.reasoning_content;
          B && o.onReasoning(B);
          const F = L == null ? void 0 : L.content;
          F && o.onData(F), S.usage && (b = {
            input_tokens: S.usage.prompt_tokens || S.usage.input_tokens || 0,
            output_tokens: S.usage.completion_tokens || S.usage.output_tokens || 0,
            model: S.model || b.model,
            cost: S.usage.cost || 0
          });
        } catch {
        }
      }
    }
    o.onDone(b);
  } catch (k) {
    if (s != null && s.aborted) return;
    o.onError(k instanceof Error ? k.message : "stream failed");
  }
}
const Ce = 960, G = -1, pe = /!\[[^\]]*\]\((data:image\/(?:png|jpeg|jpg|webp|gif);base64,[^)]+|https?:\/\/[^\s)]+)\)/g, lt = /(^|[-_])(?:gpt-?5|o[134]|codex)(?:[-_.]|$)/i, dt = 10 * 1024 * 1024;
function ct(n) {
  return n.replace(pe, "[Image generated]").trim() || "[Image generated]";
}
function pt(n) {
  return n.replace(/[\]\\]/g, "");
}
function ut(n) {
  return new Promise((a, o) => {
    const s = new FileReader();
    s.onload = () => a(String(s.result || "")), s.onerror = () => o(s.error || new Error("Failed to read image")), s.readAsDataURL(n);
  });
}
function gt(n, a) {
  const o = n.trim(), s = a.map((p) => `![${pt(p.name)}](${p.url})`).join(`
`);
  return [o, s].filter(Boolean).join(`

`);
}
function ht(n) {
  const a = n.replace(pe, "[Image]").trim() || "[Image]";
  return a.slice(0, 30) + (a.length > 30 ? "..." : "");
}
function mt(n, a) {
  if (n !== "user") return ct(a);
  const o = [];
  let s = 0, p;
  for (pe.lastIndex = 0; (p = pe.exec(a)) !== null; ) {
    const m = a.slice(s, p.index).trim();
    m && o.push({ type: "text", text: m }), o.push({ type: "image_url", image_url: { url: p[1] } }), s = p.index + p[0].length;
  }
  const l = a.slice(s).trim();
  return l && o.push({ type: "text", text: l }), o.length ? o : a;
}
function De(n) {
  var a;
  return !!(n != null && n.image_only || (a = n == null ? void 0 : n.capabilities) != null && a.includes("image_generation"));
}
function Te(n) {
  var a, o;
  return !n || De(n) ? !1 : !!((a = n.capabilities) != null && a.includes("reasoning") || (o = n.capabilities) != null && o.includes("thinking") || lt.test(n.id));
}
function ft(n) {
  return /^(https?:|mailto:|#)/i.test(n);
}
function yt(n) {
  return /^(data:image\/(?:png|jpeg|jpg|webp|gif);base64,|https?:)/i.test(n);
}
function Le(n, a, o) {
  a.split(`
`).forEach((p, l) => {
    l > 0 && n.push(/* @__PURE__ */ r("br", {}, `${o}-br-${l}`)), p && n.push(p);
  });
}
function X(n, a) {
  const o = [], s = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let p = 0, l;
  for (; (l = s.exec(n)) !== null; ) {
    l.index > p && Le(o, n.slice(p, l.index), `${a}-text-${p}`);
    const m = `${a}-${l.index}`, C = l[2], v = l[3], b = l[4], M = l[5], _ = l[6], I = l[7] || l[8], k = l[9] || l[10];
    v && yt(v) ? o.push(/* @__PURE__ */ r("img", { src: v, alt: C || "Generated image", style: e.generatedImage, loading: "lazy" }, m)) : M && ft(M) ? o.push(
      /* @__PURE__ */ r("a", { href: M, style: e.markdownLink, target: "_blank", rel: "noreferrer", children: X(b, `${m}-link`) }, m)
    ) : _ ? o.push(/* @__PURE__ */ r("code", { style: e.markdownInlineCode, children: _ }, m)) : I ? o.push(/* @__PURE__ */ r("strong", { children: X(I, `${m}-bold`) }, m)) : k ? o.push(/* @__PURE__ */ r("em", { children: X(k, `${m}-em`) }, m)) : o.push(l[0]), p = l.index + l[0].length;
  }
  return p < n.length && Le(o, n.slice(p), `${a}-text-${p}`), o.length > 0 ? o : n;
}
function bt(n, a, o) {
  const s = X(a, `${o}-inline`);
  return n === 1 ? /* @__PURE__ */ r("h1", { style: e.markdownH1, children: s }, o) : n === 2 ? /* @__PURE__ */ r("h2", { style: e.markdownH2, children: s }, o) : n === 3 ? /* @__PURE__ */ r("h3", { style: e.markdownH3, children: s }, o) : /* @__PURE__ */ r("h4", { style: e.markdownH4, children: s }, o);
}
function ie(n) {
  const a = n.replace(/\r\n?/g, `
`).split(`
`), o = [];
  let s = [], p = [], l = [], m = [], C = !1, v = 0;
  const b = (h) => `${h}-${v++}`, M = () => {
    if (!s.length) return;
    const h = b("p");
    o.push(/* @__PURE__ */ r("p", { style: e.markdownParagraph, children: X(s.join(`
`), h) }, h)), s = [];
  }, _ = () => {
    if (!p.length) return;
    const h = b("quote");
    o.push(/* @__PURE__ */ r("blockquote", { style: e.markdownBlockquote, children: X(p.join(`
`), h) }, h)), p = [];
  }, I = () => {
    if (!l.length) return;
    const h = b("list"), P = l.map(($, z) => /* @__PURE__ */ r("li", { style: e.markdownListItem, children: X($.text, `${h}-${z}`) }, `${h}-${z}`));
    o.push(l[0].ordered ? /* @__PURE__ */ r("ol", { style: e.markdownList, children: P }, h) : /* @__PURE__ */ r("ul", { style: e.markdownList, children: P }, h)), l = [];
  }, k = () => {
    M(), _(), I();
  }, R = () => {
    const h = b("code");
    o.push(/* @__PURE__ */ r("pre", { style: e.markdownCodeBlock, children: /* @__PURE__ */ r("code", { children: m.join(`
`) }) }, h)), m = [];
  };
  for (const h of a) {
    if (h.match(/^```/)) {
      C ? (R(), C = !1) : (k(), C = !0);
      continue;
    }
    if (C) {
      m.push(h);
      continue;
    }
    if (!h.trim()) {
      k();
      continue;
    }
    const $ = h.match(/^(#{1,6})\s+(.+)$/);
    if ($) {
      k(), o.push(bt(Math.min($[1].length, 4), $[2].trim(), b("heading")));
      continue;
    }
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(h)) {
      k(), o.push(/* @__PURE__ */ r("hr", { style: e.markdownDivider }, b("hr")));
      continue;
    }
    const z = h.match(/^>\s?(.*)$/);
    if (z) {
      M(), I(), p.push(z[1]);
      continue;
    }
    const S = h.match(/^\s*[-*+]\s+(.+)$/), L = h.match(/^\s*\d+[.)]\s+(.+)$/);
    if (S || L) {
      M(), _();
      const B = !!L;
      l.length && l[0].ordered !== B && I(), l.push({ ordered: B, text: ((L == null ? void 0 : L[1]) || (S == null ? void 0 : S[1]) || "").trim() });
      continue;
    }
    _(), I(), s.push(h);
  }
  return C && R(), k(), o.length > 0 ? o : n;
}
function xt() {
  const { t: n } = Qe(), [a, o] = w([]), [s, p] = w(null), [l, m] = w([]), [C, v] = w(null), [b, M] = w(""), [_, I] = w(""), [k, R] = w(!1), [h, P] = w(""), [$, z] = w([]), [S, L] = w([]), [B, F] = w(""), [ge, Ee] = w("medium"), [g, We] = w(null), [oe, Pe] = w([]), [je, Oe] = w([]), [A, ve] = w(null), [Q, Z] = w(""), [ke, E] = w(""), [ae, ee] = w(!0), [f, Ge] = w(() => typeof window < "u" ? window.innerWidth <= Ce : !1), we = J(null), Se = J(null), he = J(null), se = J(null), j = J(null), O = J(null), me = J(null);
  Y(() => {
    D.listConversations().then(o).catch(() => {
    }), D.getUserInfo().then(async (t) => {
      We(t);
      const c = sessionStorage.getItem("apikey_session_secret") || "";
      t.api_key_id && c && (ve(t.api_key_id), Z(c));
    }).catch(() => {
    }), D.listAPIKeys().then((t) => Pe(t.list.filter((c) => c.status === "active" && c.group_id != null))).catch(() => {
    }), D.listGroups().then((t) => Oe(t.list)).catch(() => {
    });
  }, []), Y(() => {
    let t = !1;
    return (async () => {
      const u = g != null && g.api_key_id && (!A || A === g.api_key_id) && sessionStorage.getItem("apikey_session_secret") || "";
      let T = Q || u;
      try {
        if (!T && A && (T = (await D.revealAPIKey(A)).key || "", t || Z(T)), !T) {
          t || (L([]), F(""));
          return;
        }
        const y = await D.listModelsByAPIKey(T);
        if (t) return;
        L(y), F((W) => {
          var U;
          return y.some((ne) => ne.id === W) ? W : ((U = y[0]) == null ? void 0 : U.id) || "";
        });
      } catch (y) {
        if (t) return;
        L([]), F(""), E(y instanceof Error ? y.message : "Failed to load models");
      }
    })(), () => {
      t = !0;
    };
  }, [Q, A, g == null ? void 0 : g.api_key_id]), Y(() => {
    j.current = s;
  }, [s]), Y(() => {
    if (!s || s === G) {
      m([]);
      return;
    }
    if (me.current === s) {
      me.current = null;
      return;
    }
    D.listMessages(s).then(m).catch(() => {
    });
  }, [s]), Y(() => {
    var t;
    (t = we.current) == null || t.scrollIntoView({ behavior: "smooth" });
  }, [l, b, _]), Y(() => {
    if (typeof window > "u") return;
    const t = window.matchMedia(`(max-width: ${Ce}px)`), c = (u) => {
      Ge(u ? u.matches : t.matches);
    };
    return c(), t.addEventListener ? (t.addEventListener("change", c), () => t.removeEventListener("change", c)) : (t.addListener(c), () => t.removeListener(c));
  }, []), Y(() => {
    ee(!f);
  }, [f]);
  const te = H(() => {
    const t = A || (g == null ? void 0 : g.api_key_id), c = oe.find((u) => u.id === t);
    return (c == null ? void 0 : c.group_id) || 0;
  }, [oe, A, g]), N = (() => {
    var c;
    const t = te();
    return t ? ((c = je.find((u) => u.id === t)) == null ? void 0 : c.platform) || "" : (g == null ? void 0 : g.api_key_platform) || "";
  })(), Ke = S.find((t) => t.id === B), fe = Te(Ke), Me = H(async () => {
    if (Q) return Q;
    if (g != null && g.api_key_id && (!A || A === g.api_key_id)) {
      const c = sessionStorage.getItem("apikey_session_secret") || "";
      if (c)
        return Z(c), c;
    }
    if (!A)
      throw new Error("API key required");
    const t = await D.revealAPIKey(A);
    if (!t.key)
      throw new Error("Failed to reveal API key");
    return Z(t.key), t.key;
  }, [Q, A, g]), _e = H(() => {
    const t = (/* @__PURE__ */ new Date()).toISOString(), c = {
      id: G,
      user_id: (g == null ? void 0 : g.id) || 0,
      title: "",
      group_id: te(),
      platform: N,
      model: B,
      created_at: t,
      updated_at: t
    };
    o((u) => [c, ...u.filter((T) => T.id !== G)]), p(G), m([]), z([]), E(""), f && ee(!1);
  }, [f, te, N, B, g == null ? void 0 : g.id]), Fe = H(async (t) => {
    var u, T;
    if (await ((T = (u = window.airgate) == null ? void 0 : u.confirm) == null ? void 0 : T.call(u, n("playground.delete_conversation_confirm"), {
      title: n("playground.delete_conversation"),
      danger: !0
    }))) {
      if (t === G) {
        o((y) => y.filter((W) => W.id !== t)), s === t && (p(null), m([]));
        return;
      }
      try {
        await D.deleteConversation(t), o((y) => y.filter((W) => W.id !== t)), s === t && (p(null), m([]));
      } catch {
      }
    }
  }, [s, n]), ye = H(async () => {
    if (!h.trim() && $.length === 0 || k || !s) return;
    const t = gt(h, $), c = te();
    let u = s;
    const T = [...l, {
      id: Date.now(),
      conversation_id: s,
      role: "user",
      content: t,
      platform: N,
      model: B,
      group_id: c,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    P(""), z([]), he.current && (he.current.style.height = "24px"), se.current && (se.current.value = ""), E(""), m(T), R(!0), v(u), O.current = { conversationId: u, model: B }, M(""), I("");
    try {
      const y = await Me();
      if (u === G) {
        const x = await D.createConversation({
          title: "",
          group_id: c,
          platform: N,
          model: B
        });
        u = x.id, O.current = { conversationId: x.id, model: B }, v(x.id), j.current === G && (j.current = x.id, me.current = x.id, p(x.id), m((re) => re.map((q) => ({ ...q, conversation_id: x.id })))), o((re) => [x, ...re.filter((q) => q.id !== G)]);
      }
      await D.persistMessage({
        conversation_id: u,
        role: "user",
        content: t,
        platform: N,
        model: B,
        group_id: c
      });
      const W = new AbortController();
      Se.current = W;
      let U = "", ne = "";
      await st(
        y,
        {
          model: B,
          messages: T.map((x) => ({ role: x.role, content: mt(x.role, x.content) })),
          stream: !0,
          ...fe ? { reasoning_effort: ge } : {}
        },
        {
          onData: (x) => {
            U += x, M(U);
          },
          onReasoning: (x) => {
            ne += x, I(ne);
          },
          onDone: async (x) => {
            if (!U) {
              j.current === u && E(n("playground.no_response")), M(""), I(""), v(null), O.current = null, R(!1);
              return;
            }
            const re = await D.persistMessage({
              conversation_id: u,
              role: "assistant",
              content: U,
              reasoning: ne,
              platform: N,
              model: x.model || B,
              group_id: c,
              input_tokens: x.input_tokens,
              output_tokens: x.output_tokens,
              cost: x.cost
            });
            j.current === u && m((q) => [...q, re]), o((q) => q.map(
              (de) => de.id === u && !de.title ? { ...de, title: ht(t), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : de
            )), M(""), I(""), v(null), O.current = null, R(!1);
          },
          onError: (x) => {
            j.current === u && E(x), R(!1), M(""), I(""), v(null), O.current = null;
          }
        },
        W.signal
      );
    } catch (y) {
      j.current === u && E(y instanceof Error ? y.message : "stream failed"), R(!1), M(""), I(""), v(null), O.current = null;
    }
  }, [s, Me, h, k, l, $, ge, te, B, N, fe, n]), Ne = H(async (t) => {
    const c = Array.from(t.target.files || []);
    if (c.length)
      try {
        const u = c.filter((y) => y.type.startsWith("image/"));
        if (u.some((y) => y.size > dt)) {
          E("Images must be 10MB or smaller");
          return;
        }
        const T = await Promise.all(u.map(async (y) => ({
          id: `${y.name}-${y.lastModified}-${y.size}`,
          name: y.name,
          url: await ut(y)
        })));
        z((y) => [...y, ...T]), E("");
      } catch (u) {
        E(u instanceof Error ? u.message : "Failed to read image");
      } finally {
        t.target.value = "";
      }
  }, []), Ve = H((t) => {
    z((c) => c.filter((u) => u.id !== t));
  }, []), Ue = H(() => {
    var c;
    (c = Se.current) == null || c.abort();
    const t = O.current;
    if (b || _) {
      const u = t == null ? void 0 : t.conversationId;
      u && j.current === u && m((T) => [...T, {
        id: Date.now() + 1,
        conversation_id: u,
        role: "assistant",
        content: b,
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
    M(""), I(""), v(null), O.current = null, R(!1);
  }, [b, _]), Ie = a.find((t) => t.id === s), V = k && C === s, le = !!(g != null && g.api_key_id || A), Be = !!(h.trim() || $.length > 0) && le && !k, qe = H((t) => {
    if (t.key === "Enter" && !t.shiftKey) {
      if (t.preventDefault(), !le) {
        E("API key required");
        return;
      }
      ye();
    }
  }, [le, ye]), Je = H(() => {
    var t;
    (t = se.current) == null || t.click();
  }, []), Ye = H((t) => {
    t.style.height = "auto", t.style.height = Math.min(t.scrollHeight, 200) + "px";
  }, []), Xe = H((t) => {
    p(t), f && ee(!1);
  }, [f]);
  return /* @__PURE__ */ d("div", { "data-full-bleed": !0, style: e.layout, children: [
    ae && f && /* @__PURE__ */ r(
      "div",
      {
        style: e.sidebarBackdrop,
        onClick: () => ee(!1)
      }
    ),
    ae && /* @__PURE__ */ d("div", { style: { ...e.sidebar, ...f ? e.sidebarMobile : null }, children: [
      /* @__PURE__ */ d("div", { style: e.sidebarHeader, children: [
        /* @__PURE__ */ r("span", { style: e.sidebarTitle, children: n("playground.conversations") }),
        /* @__PURE__ */ r(
          "button",
          {
            style: e.newBtn,
            onClick: _e,
            title: n("playground.new_conversation"),
            children: /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M7 1v12M1 7h12" }) })
          }
        )
      ] }),
      /* @__PURE__ */ d("div", { style: e.convList, children: [
        a.map((t) => {
          const c = t.id === s;
          return /* @__PURE__ */ d(
            "div",
            {
              style: {
                ...e.convItem,
                background: c ? i("primarySubtle") : "transparent",
                borderColor: c ? i("borderFocus") : "transparent"
              },
              onClick: () => Xe(t.id),
              children: [
                /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: i(c ? "primary" : "textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ r("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
                /* @__PURE__ */ r("span", { style: {
                  ...e.convTitle,
                  color: i(c ? "text" : "textSecondary")
                }, children: t.title || n("playground.new_conversation") }),
                /* @__PURE__ */ r(
                  "button",
                  {
                    style: e.deleteBtn,
                    onClick: (u) => {
                      u.stopPropagation(), Fe(t.id);
                    },
                    title: n("playground.delete_conversation"),
                    children: /* @__PURE__ */ r("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M2 2l8 8M10 2l-8 8" }) })
                  }
                )
              ]
            },
            t.id
          );
        }),
        a.length === 0 && /* @__PURE__ */ d("div", { style: e.emptyConvList, children: [
          /* @__PURE__ */ r("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: i("textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5 }, children: /* @__PURE__ */ r("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ r("span", { children: n("playground.no_conversations") })
        ] })
      ] }),
      g && /* @__PURE__ */ d("div", { style: e.balanceBar, children: [
        /* @__PURE__ */ r("span", { style: e.balanceLabel, children: n("playground.balance") }),
        /* @__PURE__ */ d("span", { style: e.balanceValue, children: [
          "$",
          g.balance.toFixed(4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ d("div", { style: e.main, children: [
      /* @__PURE__ */ d("div", { style: { ...e.topBar, ...f ? e.topBarMobile : null }, children: [
        /* @__PURE__ */ d("div", { style: { ...e.topBarLeft, ...f ? e.topBarLeftMobile : null }, children: [
          /* @__PURE__ */ r("button", { style: e.toggleBtn, onClick: () => ee(!ae), children: /* @__PURE__ */ r("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: ae ? /* @__PURE__ */ d(be, { children: [
            /* @__PURE__ */ r("path", { d: "M6 2v12" }),
            /* @__PURE__ */ r("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ r("path", { d: "M10 6l-2 2 2 2" })
          ] }) : /* @__PURE__ */ d(be, { children: [
            /* @__PURE__ */ r("path", { d: "M6 2v12" }),
            /* @__PURE__ */ r("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ r("path", { d: "M8 6l2 2-2 2" })
          ] }) }) }),
          /* @__PURE__ */ d("div", { style: { ...e.selectors, ...f ? e.selectorsMobile : null }, children: [
            /* @__PURE__ */ d("div", { style: { ...e.selectorGroup, ...f ? e.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ r("label", { style: e.selectorLabel, children: "API Key" }),
              /* @__PURE__ */ d(
                "select",
                {
                  style: { ...e.select, ...f ? e.selectMobile : null },
                  value: A ?? (g == null ? void 0 : g.api_key_id) ?? "",
                  onChange: (t) => {
                    const c = Number(t.target.value || 0);
                    ve(c || null), Z("");
                  },
                  children: [
                    /* @__PURE__ */ r("option", { value: "", children: "Select key" }),
                    (g == null ? void 0 : g.api_key_id) && !oe.some((t) => t.id === g.api_key_id) && /* @__PURE__ */ r("option", { value: g.api_key_id, children: g.api_key_name || "Current key" }),
                    oe.map((t) => /* @__PURE__ */ r("option", { value: t.id, children: t.name }, t.id))
                  ]
                }
              )
            ] }),
            !f && /* @__PURE__ */ r("div", { style: e.selectorDivider }),
            /* @__PURE__ */ d("div", { style: { ...e.selectorGroup, ...f ? e.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ r("label", { style: e.selectorLabel, children: n("playground.model") }),
              /* @__PURE__ */ r(
                "select",
                {
                  style: { ...e.select, ...f ? e.selectMobile : null },
                  value: B,
                  onChange: (t) => F(t.target.value),
                  children: S.map((t) => /* @__PURE__ */ d("option", { value: t.id, children: [
                    t.name || t.id,
                    De(t) ? " · image" : Te(t) ? " · reasoning" : ""
                  ] }, t.id))
                }
              )
            ] }),
            fe && /* @__PURE__ */ d(be, { children: [
              !f && /* @__PURE__ */ r("div", { style: e.selectorDivider }),
              /* @__PURE__ */ d("div", { style: { ...e.selectorGroup, ...f ? e.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ r("label", { style: e.selectorLabel, children: "Effort" }),
                /* @__PURE__ */ d(
                  "select",
                  {
                    style: { ...e.select, ...f ? e.selectMobile : null },
                    value: ge,
                    onChange: (t) => Ee(t.target.value),
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
        Ie && /* @__PURE__ */ r("span", { style: { ...e.topBarTitle, ...f ? e.topBarTitleMobile : null }, children: Ie.title || n("playground.new_conversation") })
      ] }),
      /* @__PURE__ */ d("div", { style: e.messagesArea, children: [
        !s && /* @__PURE__ */ d("div", { style: { ...e.emptyState, ...f ? e.emptyStateMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: e.emptyIcon, children: /* @__PURE__ */ d("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [
            /* @__PURE__ */ r("rect", { x: "4", y: "4", width: "40", height: "40", rx: "20", fill: i("primarySubtle") }),
            /* @__PURE__ */ r("path", { d: "M24 16v6m0 0v6m0-6h6m-6 0h-6", stroke: i("primary"), strokeWidth: "2", strokeLinecap: "round" })
          ] }) }),
          /* @__PURE__ */ r("div", { style: e.emptyTitle, children: n("playground.empty_title") }),
          /* @__PURE__ */ r("div", { style: e.emptyDesc, children: n("playground.empty_description") }),
          /* @__PURE__ */ d("button", { style: e.emptyBtn, onClick: _e, children: [
            /* @__PURE__ */ r("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ r("path", { d: "M7 1v12M1 7h12" }) }),
            n("playground.new_conversation")
          ] })
        ] }),
        s && l.map((t) => /* @__PURE__ */ d("div", { style: { ...e.messageRow, ...f ? e.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: t.role === "user" ? e.avatarUser : e.avatarAssistant, children: t.role === "user" ? /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ r("circle", { cx: "12", cy: "7", r: "4" })
          ] }) : /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: e.messageBody, children: [
            /* @__PURE__ */ r("div", { style: e.messageRole, children: t.role === "user" ? n("playground.you") : n("playground.assistant") }),
            t.role === "assistant" && t.reasoning && /* @__PURE__ */ d("details", { style: e.reasoningBox, open: !0, children: [
              /* @__PURE__ */ r("summary", { style: e.reasoningSummary, children: "Thinking" }),
              /* @__PURE__ */ r("div", { style: e.reasoningContent, children: ie(t.reasoning) })
            ] }),
            /* @__PURE__ */ r("div", { style: e.messageContent, children: ie(t.content) }),
            t.role === "assistant" && t.model && /* @__PURE__ */ r("div", { style: e.messageMeta, children: /* @__PURE__ */ r("span", { style: e.metaBadge, children: t.model }) })
          ] })
        ] }, t.id)),
        V && b && /* @__PURE__ */ d("div", { style: { ...e.messageRow, ...f ? e.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: e.avatarAssistant, children: /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: e.messageBody, children: [
            /* @__PURE__ */ r("div", { style: e.messageRole, children: n("playground.assistant") }),
            _ && /* @__PURE__ */ d("details", { style: e.reasoningBox, open: !0, children: [
              /* @__PURE__ */ r("summary", { style: e.reasoningSummary, children: "Thinking" }),
              /* @__PURE__ */ r("div", { style: e.reasoningContent, children: ie(_) })
            ] }),
            /* @__PURE__ */ r("div", { style: e.messageContent, children: ie(b) }),
            /* @__PURE__ */ d("div", { style: e.messageMeta, children: [
              /* @__PURE__ */ r("span", { style: e.streamingDot }),
              /* @__PURE__ */ r("span", { children: n("playground.streaming") })
            ] })
          ] })
        ] }),
        V && !b && /* @__PURE__ */ d("div", { style: { ...e.messageRow, ...f ? e.messageRowMobile : null }, children: [
          /* @__PURE__ */ r("div", { style: e.avatarAssistant, children: /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ r("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ d("div", { style: e.messageBody, children: [
            /* @__PURE__ */ r("div", { style: e.messageRole, children: n("playground.assistant") }),
            _ ? /* @__PURE__ */ d("details", { style: e.reasoningBox, open: !0, children: [
              /* @__PURE__ */ r("summary", { style: e.reasoningSummary, children: "Thinking" }),
              /* @__PURE__ */ r("div", { style: e.reasoningContent, children: ie(_) })
            ] }) : /* @__PURE__ */ r("div", { style: { ...e.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ r("span", { style: e.thinkingDots, children: n("playground.thinking") }) })
          ] })
        ] }),
        ke && /* @__PURE__ */ d("div", { style: { ...e.errorBar, ...f ? e.errorBarMobile : null }, children: [
          /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ r("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ r("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          ke
        ] }),
        /* @__PURE__ */ r("div", { ref: we })
      ] }),
      s && /* @__PURE__ */ r("div", { style: { ...e.inputArea, ...f ? e.inputAreaMobile : null }, children: /* @__PURE__ */ d("div", { style: { ...e.inputWrapper, ...V ? e.inputWrapperStreaming : null }, children: [
        $.length > 0 && /* @__PURE__ */ r("div", { style: e.imagePreviewList, children: $.map((t) => /* @__PURE__ */ d("div", { style: e.imagePreviewItem, children: [
          /* @__PURE__ */ r("img", { src: t.url, alt: t.name, style: e.imagePreview }),
          /* @__PURE__ */ r(
            "button",
            {
              type: "button",
              style: e.removeImageBtn,
              onClick: () => Ve(t.id),
              "aria-label": `Remove ${t.name}`,
              children: "×"
            }
          )
        ] }, t.id)) }),
        /* @__PURE__ */ r(
          "textarea",
          {
            ref: he,
            style: e.textarea,
            value: h,
            onChange: (t) => {
              P(t.target.value), Ye(t.target);
            },
            onKeyDown: qe,
            placeholder: n("playground.input_placeholder"),
            rows: 1,
            disabled: V
          }
        ),
        /* @__PURE__ */ r(
          "input",
          {
            ref: se,
            type: "file",
            accept: "image/*",
            multiple: !0,
            style: e.fileInput,
            onChange: Ne,
            disabled: V
          }
        ),
        /* @__PURE__ */ d("div", { style: { ...e.inputActions, ...f ? e.inputActionsMobile : null }, children: [
          /* @__PURE__ */ r("span", { style: { ...e.inputHint, ...f ? e.inputHintMobile : null }, children: n("playground.input_hint") }),
          /* @__PURE__ */ d("div", { style: { ...e.inputButtonGroup, ...f ? e.inputButtonGroupMobile : null }, children: [
            /* @__PURE__ */ d(
              "button",
              {
                type: "button",
                style: { ...e.attachBtn, ...f ? e.actionBtnMobile : null },
                onClick: Je,
                disabled: V,
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
            V ? /* @__PURE__ */ d("button", { style: { ...e.stopBtn, ...f ? e.actionBtnMobile : null }, onClick: Ue, children: [
              /* @__PURE__ */ r("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ r("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
              n("playground.stop")
            ] }) : /* @__PURE__ */ d(
              "button",
              {
                style: {
                  ...e.sendBtn,
                  ...f ? e.actionBtnMobile : null,
                  opacity: Be ? 1 : 0.4
                },
                onClick: ye,
                disabled: !Be,
                title: le ? void 0 : "Select an API key first",
                children: [
                  /* @__PURE__ */ d("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ r("path", { d: "M22 2L11 13" }),
                    /* @__PURE__ */ r("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                  ] }),
                  n("playground.send")
                ]
              }
            )
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ r("style", { children: vt })
  ] });
}
const vt = `
@keyframes pg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pg-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`, e = {
  layout: {
    display: "flex",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    position: "relative",
    isolation: "isolate",
    background: i("bgDeep"),
    fontFamily: i("fontSans"),
    color: i("text"),
    overflow: "hidden"
  },
  // ── Sidebar ──
  sidebar: {
    width: 280,
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: i("bg"),
    borderRight: `1px solid ${i("borderSubtle")}`,
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
    color: i("textTertiary")
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: `1px solid ${i("border")}`,
    borderRadius: i("radiusSm"),
    background: i("bgSurface"),
    color: i("textSecondary"),
    cursor: "pointer",
    transition: i("transition")
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
    borderRadius: i("radiusSm"),
    cursor: "pointer",
    transition: i("transition"),
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
    color: i("textTertiary"),
    cursor: "pointer",
    padding: "2px",
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.5,
    transition: i("transition"),
    marginTop: 1
  },
  emptyConvList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    color: i("textTertiary"),
    fontSize: 12
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: `1px solid ${i("borderSubtle")}`
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: i("textTertiary")
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: i("fontMono"),
    color: i("primary")
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
    borderBottom: `1px solid ${i("borderSubtle")}`,
    background: i("bg"),
    flexShrink: 0,
    minHeight: 52
  },
  topBarMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    padding: "10px 14px",
    gap: 10
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  topBarLeftMobile: {
    width: "100%",
    alignItems: "flex-start",
    gap: 10
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "none",
    borderRadius: i("radiusSm"),
    background: "transparent",
    color: i("textSecondary"),
    cursor: "pointer",
    transition: i("transition"),
    flexShrink: 0
  },
  selectors: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: i("bgSurface"),
    borderRadius: i("radiusSm"),
    border: `1px solid ${i("borderSubtle")}`,
    overflow: "hidden"
  },
  selectorsMobile: {
    flex: 1,
    minWidth: 0,
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 8,
    padding: 8,
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
    width: "100%",
    padding: 0,
    flexDirection: "column",
    alignItems: "stretch",
    gap: 4
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: i("textTertiary"),
    whiteSpace: "nowrap"
  },
  selectorDivider: {
    width: 1,
    height: 24,
    background: i("borderSubtle"),
    flexShrink: 0
  },
  select: {
    padding: "2px 4px",
    border: "none",
    background: "transparent",
    color: i("text"),
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    fontFamily: i("fontSans"),
    minWidth: 0
  },
  selectMobile: {
    width: "100%",
    minHeight: 34,
    borderRadius: i("radiusSm"),
    padding: "6px 8px",
    background: i("bgDeep")
  },
  topBarTitle: {
    fontSize: 12,
    color: i("textTertiary"),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  topBarTitleMobile: {
    width: "100%"
  },
  // ── Messages ──
  messagesArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column"
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
    color: i("text"),
    letterSpacing: "-0.02em"
  },
  emptyDesc: {
    fontSize: 13,
    color: i("textSecondary"),
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
    borderRadius: i("radiusMd"),
    background: i("primary"),
    color: i("textInverse"),
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: i("transition"),
    marginTop: 8,
    fontFamily: i("fontSans")
  },
  // ── Message row ──
  messageRow: {
    display: "flex",
    gap: 14,
    padding: "20px 28px",
    animation: "pg-fadein 0.25s ease-out",
    borderBottom: `1px solid ${i("borderSubtle")}`
  },
  messageRowMobile: {
    gap: 10,
    padding: "16px 14px"
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: i("primary"),
    color: i("textInverse"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarAssistant: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: i("bgSurface"),
    border: `1px solid ${i("border")}`,
    color: i("textSecondary"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  messageBody: {
    flex: 1,
    minWidth: 0
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: i("text")
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
    borderRadius: i("radiusSm"),
    background: "linear-gradient(180deg, rgba(17, 23, 36, 0.92), rgba(10, 14, 24, 0.92))",
    border: "1px solid rgba(148, 175, 225, 0.075)",
    color: "#d5deef",
    fontFamily: i("fontMono"),
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
    fontFamily: i("fontMono"),
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
    borderRadius: i("radiusSm"),
    background: i("bgSurface"),
    border: `1px solid ${i("borderSubtle")}`
  },
  reasoningSummary: {
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    color: i("textSecondary"),
    userSelect: "none"
  },
  reasoningContent: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.6,
    wordBreak: "break-word",
    color: "#9ea9bd"
  },
  generatedImage: {
    display: "block",
    maxWidth: "min(100%, 420px)",
    maxHeight: 420,
    width: "auto",
    height: "auto",
    marginTop: 10,
    borderRadius: i("radiusMd"),
    border: `1px solid ${i("borderSubtle")}`,
    objectFit: "contain"
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: i("textTertiary")
  },
  metaBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "999px",
    background: i("bgSurface"),
    border: `1px solid ${i("borderSubtle")}`,
    fontSize: 11,
    fontFamily: i("fontMono"),
    color: i("textSecondary")
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: i("primary"),
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
    borderRadius: i("radiusSm"),
    background: i("dangerSubtle"),
    color: i("danger"),
    fontSize: 13,
    border: `1px solid ${i("danger")}`,
    borderColor: "rgba(251, 113, 133, 0.2)"
  },
  errorBarMobile: {
    margin: "8px 14px"
  },
  // ── Input ──
  inputArea: {
    padding: "16px 28px 20px",
    borderTop: `1px solid ${i("borderSubtle")}`,
    background: i("bg"),
    flexShrink: 0
  },
  inputAreaMobile: {
    padding: "12px 14px 16px"
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: `1px solid ${i("border")}`,
    borderRadius: i("radiusMd"),
    background: i("bgSurface"),
    padding: "12px 14px 8px",
    transition: i("transition")
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
    borderRadius: i("radiusSm"),
    overflow: "hidden",
    border: `1px solid ${i("borderSubtle")}`,
    background: i("bgHover")
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
    color: i("text"),
    fontSize: 14,
    fontFamily: i("fontSans"),
    resize: "none",
    outline: "none",
    lineHeight: 1.6,
    height: 24,
    minHeight: 24,
    maxHeight: 160
  },
  inputActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  inputActionsMobile: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  inputButtonGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  inputButtonGroupMobile: {
    width: "100%",
    flexDirection: "column"
  },
  fileInput: {
    display: "none"
  },
  inputHint: {
    fontSize: 11,
    color: i("textTertiary")
  },
  inputHintMobile: {
    order: 2
  },
  attachBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: `1px solid ${i("border")}`,
    borderRadius: i("radiusSm"),
    background: i("bgSurface"),
    color: i("textSecondary"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: i("transition"),
    fontFamily: i("fontSans")
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: i("radiusSm"),
    background: i("primary"),
    color: i("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: i("transition"),
    fontFamily: i("fontSans")
  },
  stopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: i("radiusSm"),
    background: i("danger"),
    color: i("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: i("fontSans")
  },
  actionBtnMobile: {
    width: "100%",
    justifyContent: "center"
  }
}, Mt = {
  routes: [
    { path: "/playground", component: xt }
  ]
};
export {
  Mt as default
};
