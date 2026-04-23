import { jsxs as a, jsx as n, Fragment as Z } from "react/jsx-runtime";
import { useState as h, useRef as ee, useEffect as R, useCallback as T } from "react";
import { useTranslation as Ce } from "react-i18next";
const ce = {
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
}, Be = {
  radiusSm: "12px",
  radiusMd: "18px",
  radiusLg: "22px",
  radiusXl: "28px",
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
  transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  transitionSlow: "400ms cubic-bezier(0.4, 0, 0.2, 1)"
}, Te = {
  sidebarWidth: "260px",
  sidebarCollapsed: "72px",
  topbarHeight: "64px"
}, te = {
  ...Be,
  ...Te
}, pe = {
  dark: ce
};
function Ie(o) {
  return o.replace(/[A-Z]/g, (l) => "-" + l.toLowerCase());
}
function ue(o = "ag") {
  return o.trim() || "ag";
}
function U(o, l) {
  return `--${o}-${Ie(l)}`;
}
Object.keys(pe.dark).reduce((o, l) => (o[l] = U("ag", l), o), {});
Object.keys(te).reduce((o, l) => (o[l] = U("ag", l), o), {});
function ge(o = {}) {
  const l = ue(o.prefix);
  return Object.keys(pe.dark).reduce((p, s) => (p[s] = U(l, s), p), {});
}
function he(o = {}) {
  const l = ue(o.prefix);
  return Object.keys(te).reduce((p, s) => (p[s] = U(l, s), p), {});
}
const Le = ge(), ze = he();
function r(o, l = {}) {
  const p = l.prefix ? ge(l) : Le, s = l.prefix ? he(l) : ze;
  if (o in p) {
    const y = o;
    return `var(${p[y]}, ${ce[y]})`;
  }
  const m = o;
  return `var(${s[m]}, ${te[m]})`;
}
const De = "/api/v1/ext-user/airgate-playground", Ae = "/api/v1";
function Re() {
  const o = {}, l = localStorage.getItem("token");
  return l && (o.Authorization = `Bearer ${l}`), o;
}
async function _(o, l, p, s = De) {
  const m = { ...Re() };
  p !== void 0 && (m["Content-Type"] = "application/json");
  const y = await fetch(s + l, {
    method: o,
    headers: m,
    body: p ? JSON.stringify(p) : void 0
  });
  if (!y.ok) {
    const v = await y.text();
    let f = `HTTP ${y.status}`;
    try {
      const w = JSON.parse(v);
      f = w.error || w.message || f;
    } catch {
    }
    throw y.status === 401 && (localStorage.removeItem("token"), window.location.href = "/login"), new Error(f);
  }
  const k = await y.text();
  return k ? JSON.parse(k) : null;
}
async function F(o, l, p) {
  const s = await _(o, l, p, Ae);
  if (s.code !== 0)
    throw new Error(s.message || "request failed");
  return s.data;
}
const S = {
  listConversations: () => _("GET", "/conversations"),
  createConversation: (o) => _("POST", "/conversations", o),
  getConversation: (o) => _("GET", `/conversations/${o}`),
  updateConversation: (o, l) => _("PUT", `/conversations/${o}`, l),
  deleteConversation: (o) => _("DELETE", `/conversations/${o}`),
  listMessages: (o) => _("GET", `/messages/${o}`),
  persistMessage: (o) => _("POST", "/messages", o),
  listPlatforms: () => _("GET", "/platforms"),
  listModels: (o) => _("GET", `/models?platform=${encodeURIComponent(o)}`),
  getUserInfo: () => F("GET", "/users/me"),
  listAPIKeys: () => F("GET", "/api-keys?page=1&page_size=100"),
  revealAPIKey: (o) => F("GET", `/api-keys/${o}/reveal`),
  listGroups: () => F("GET", "/groups?page=1&page_size=100")
};
async function Ee(o, l, p, s) {
  var w, C, B, W;
  const m = await fetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${o}`
    },
    body: JSON.stringify(l),
    signal: s
  });
  if (!m.ok || !m.body) {
    const I = await m.text();
    let z = `HTTP ${m.status}`;
    try {
      const L = JSON.parse(I);
      z = ((w = L.error) == null ? void 0 : w.message) || L.error || L.message || z;
    } catch {
    }
    p.onError(z);
    return;
  }
  const y = m.body.getReader(), k = new TextDecoder();
  let v = "", f = { input_tokens: 0, output_tokens: 0, model: l.model, cost: 0 };
  try {
    for (; ; ) {
      const { done: I, value: z } = await y.read();
      if (I) break;
      v += k.decode(z, { stream: !0 });
      const L = v.split(`
`);
      v = L.pop() || "";
      for (const J of L) {
        const b = J.trim();
        if (!b.startsWith("data: ")) continue;
        const E = b.slice(6);
        if (E === "[DONE]") {
          p.onDone(f);
          return;
        }
        try {
          const u = JSON.parse(E);
          if (u.error) {
            p.onError(u.error.message || u.error);
            return;
          }
          const H = (W = (B = (C = u.choices) == null ? void 0 : C[0]) == null ? void 0 : B.delta) == null ? void 0 : W.content;
          H && p.onData(H), u.usage && (f = {
            input_tokens: u.usage.prompt_tokens || u.usage.input_tokens || 0,
            output_tokens: u.usage.completion_tokens || u.usage.output_tokens || 0,
            model: u.model || f.model,
            cost: u.usage.cost || 0
          });
        } catch {
        }
      }
    }
    p.onDone(f);
  } catch (I) {
    if (s != null && s.aborted) return;
    p.onError(I instanceof Error ? I.message : "stream failed");
  }
}
const de = 960;
function We() {
  const { t: o } = Ce(), [l, p] = h([]), [s, m] = h(null), [y, k] = h([]), [v, f] = h(""), [w, C] = h(!1), [B, W] = h(""), [I, z] = h([]), [L, J] = h([]), [b, E] = h(""), [u, H] = h(""), [c, fe] = h(null), [D, me] = h([]), [q, ye] = h([]), [x, re] = h(null), [Y, P] = h(""), [ne, $] = h(""), [G, j] = h(!0), [d, be] = h(() => typeof window < "u" ? window.innerWidth <= de : !1), oe = ee(null), ie = ee(null), xe = ee(null);
  R(() => {
    S.listConversations().then(p).catch(() => {
    }), S.listPlatforms().then((e) => {
      z(e), e.length > 0 && E(e[0].Name);
    }).catch(() => {
    }), S.getUserInfo().then(async (e) => {
      fe(e);
      const i = sessionStorage.getItem("apikey_session_secret") || "";
      e.api_key_id && i && (re(e.api_key_id), P(i));
    }).catch(() => {
    }), S.listAPIKeys().then((e) => me(e.list.filter((i) => i.status === "active" && i.group_id != null))).catch(() => {
    }), S.listGroups().then((e) => ye(e.list)).catch(() => {
    });
  }, []), R(() => {
    b && S.listModels(b).then((e) => {
      var i;
      J(e), e.some((g) => g.id === u) || H(((i = e[0]) == null ? void 0 : i.id) || "");
    }).catch(() => {
    });
  }, [b, u]), R(() => {
    if (!x) return;
    const e = D.find((g) => g.id === x);
    if (!(e != null && e.group_id)) return;
    const i = q.find((g) => g.id === e.group_id);
    i && b !== i.platform && E(i.platform);
  }, [x, D, q, b]), R(() => {
    if (!s) {
      k([]);
      return;
    }
    S.listMessages(s).then(k).catch(() => {
    });
  }, [s]), R(() => {
    var e;
    (e = oe.current) == null || e.scrollIntoView({ behavior: "smooth" });
  }, [y, v]), R(() => {
    if (typeof window > "u") return;
    const e = window.matchMedia(`(max-width: ${de}px)`), i = (g) => {
      be(g ? g.matches : e.matches);
    };
    return i(), e.addEventListener ? (e.addEventListener("change", i), () => e.removeEventListener("change", i)) : (e.addListener(i), () => e.removeListener(i));
  }, []), R(() => {
    j(!d);
  }, [d]);
  const O = T(() => {
    if (c != null && c.api_key_id && c.api_key_platform) {
      const i = D.find((g) => g.id === c.api_key_id);
      return (i == null ? void 0 : i.group_id) || 0;
    }
    const e = D.find((i) => i.id === x);
    return (e == null ? void 0 : e.group_id) || 0;
  }, [D, x, c]), ae = T(async () => {
    if (Y) return Y;
    if (c != null && c.api_key_id) {
      const i = sessionStorage.getItem("apikey_session_secret") || "";
      if (i)
        return P(i), i;
    }
    if (!x)
      throw new Error("API key required");
    const e = await S.revealAPIKey(x);
    if (!e.key)
      throw new Error("Failed to reveal API key");
    return P(e.key), e.key;
  }, [Y, x, c]), se = T(async () => {
    try {
      const e = await S.createConversation({
        title: "",
        group_id: O(),
        platform: b,
        model: u
      });
      p((i) => [e, ...i]), m(e.id), k([]), d && j(!1);
    } catch (e) {
      $(e instanceof Error ? e.message : o("playground.create_failed"));
    }
  }, [d, O, b, u, o]), ve = T(async (e) => {
    try {
      await S.deleteConversation(e), p((i) => i.filter((g) => g.id !== e)), s === e && (m(null), k([]));
    } catch {
    }
  }, [s]), Q = T(async () => {
    if (!B.trim() || w || !s) return;
    const e = B.trim(), i = O(), g = [...y, {
      id: Date.now(),
      conversation_id: s,
      role: "user",
      content: e,
      platform: b,
      model: u,
      group_id: i,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }];
    W(""), $(""), k(g), C(!0), f("");
    try {
      const A = await ae();
      await S.persistMessage({
        conversation_id: s,
        role: "user",
        content: e,
        platform: b,
        model: u,
        group_id: i
      });
      const K = new AbortController();
      ie.current = K;
      let N = "";
      await Ee(
        A,
        {
          model: u,
          messages: g.map((M) => ({ role: M.role, content: M.content })),
          stream: !0
        },
        {
          onData: (M) => {
            N += M, f(N);
          },
          onDone: async (M) => {
            if (!N) {
              $(o("playground.no_response")), f(""), C(!1);
              return;
            }
            const _e = await S.persistMessage({
              conversation_id: s,
              role: "assistant",
              content: N,
              platform: b,
              model: M.model || u,
              group_id: i,
              input_tokens: M.input_tokens,
              output_tokens: M.output_tokens,
              cost: M.cost
            });
            k((X) => [...X, _e]), p((X) => X.map(
              (V) => V.id === s && !V.title ? { ...V, title: e.slice(0, 30) + (e.length > 30 ? "..." : ""), updated_at: (/* @__PURE__ */ new Date()).toISOString() } : V
            )), f(""), C(!1);
          },
          onError: (M) => {
            $(M), C(!1), f("");
          }
        },
        K.signal
      );
    } catch (A) {
      $(A instanceof Error ? A.message : "stream failed"), C(!1), f("");
    }
  }, [s, ae, B, w, y, O, u, b, o]), ke = T(() => {
    var e;
    (e = ie.current) == null || e.abort(), v && k((i) => [...i, {
      id: Date.now() + 1,
      conversation_id: s,
      role: "assistant",
      content: v,
      platform: "",
      model: u,
      group_id: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost: 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }]), f(""), C(!1);
  }, [v, s, u]), we = T((e) => {
    e.key === "Enter" && !e.shiftKey && (e.preventDefault(), Q());
  }, [Q]), Se = T((e) => {
    e.style.height = "auto", e.style.height = Math.min(e.scrollHeight, 200) + "px";
  }, []), Me = T((e) => {
    m(e), d && j(!1);
  }, [d]), le = l.find((e) => e.id === s);
  return /* @__PURE__ */ a("div", { "data-full-bleed": !0, style: t.layout, children: [
    G && d && /* @__PURE__ */ n(
      "div",
      {
        style: t.sidebarBackdrop,
        onClick: () => j(!1)
      }
    ),
    G && /* @__PURE__ */ a("div", { style: { ...t.sidebar, ...d ? t.sidebarMobile : null }, children: [
      /* @__PURE__ */ a("div", { style: t.sidebarHeader, children: [
        /* @__PURE__ */ n("span", { style: t.sidebarTitle, children: o("playground.conversations") }),
        /* @__PURE__ */ n(
          "button",
          {
            style: t.newBtn,
            onClick: se,
            title: o("playground.new_conversation"),
            children: /* @__PURE__ */ n("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", children: /* @__PURE__ */ n("path", { d: "M7 1v12M1 7h12" }) })
          }
        )
      ] }),
      /* @__PURE__ */ a("div", { style: t.convList, children: [
        l.map((e) => {
          const i = e.id === s;
          return /* @__PURE__ */ a(
            "div",
            {
              style: {
                ...t.convItem,
                background: i ? r("primarySubtle") : "transparent",
                borderColor: i ? r("borderFocus") : "transparent"
              },
              onClick: () => Me(e.id),
              children: [
                /* @__PURE__ */ n("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: r(i ? "primary" : "textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: 2 }, children: /* @__PURE__ */ n("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
                /* @__PURE__ */ n("span", { style: {
                  ...t.convTitle,
                  color: r(i ? "text" : "textSecondary")
                }, children: e.title || o("playground.new_conversation") }),
                /* @__PURE__ */ n(
                  "button",
                  {
                    style: t.deleteBtn,
                    onClick: (g) => {
                      g.stopPropagation(), ve(e.id);
                    },
                    title: o("playground.delete_conversation"),
                    children: /* @__PURE__ */ n("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: /* @__PURE__ */ n("path", { d: "M2 2l8 8M10 2l-8 8" }) })
                  }
                )
              ]
            },
            e.id
          );
        }),
        l.length === 0 && /* @__PURE__ */ a("div", { style: t.emptyConvList, children: [
          /* @__PURE__ */ n("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: r("textTertiary"), strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.5 }, children: /* @__PURE__ */ n("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ n("span", { children: o("playground.no_conversations") })
        ] })
      ] }),
      c && /* @__PURE__ */ a("div", { style: t.balanceBar, children: [
        /* @__PURE__ */ n("span", { style: t.balanceLabel, children: o("playground.balance") }),
        /* @__PURE__ */ a("span", { style: t.balanceValue, children: [
          "$",
          c.balance.toFixed(4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ a("div", { style: t.main, children: [
      /* @__PURE__ */ a("div", { style: { ...t.topBar, ...d ? t.topBarMobile : null }, children: [
        /* @__PURE__ */ a("div", { style: { ...t.topBarLeft, ...d ? t.topBarLeftMobile : null }, children: [
          /* @__PURE__ */ n("button", { style: t.toggleBtn, onClick: () => j(!G), children: /* @__PURE__ */ n("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", children: G ? /* @__PURE__ */ a(Z, { children: [
            /* @__PURE__ */ n("path", { d: "M6 2v12" }),
            /* @__PURE__ */ n("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ n("path", { d: "M10 6l-2 2 2 2" })
          ] }) : /* @__PURE__ */ a(Z, { children: [
            /* @__PURE__ */ n("path", { d: "M6 2v12" }),
            /* @__PURE__ */ n("path", { d: "M2 2h12v12H2z" }),
            /* @__PURE__ */ n("path", { d: "M8 6l2 2-2 2" })
          ] }) }) }),
          /* @__PURE__ */ a("div", { style: { ...t.selectors, ...d ? t.selectorsMobile : null }, children: [
            !(c != null && c.api_key_id) && /* @__PURE__ */ a(Z, { children: [
              /* @__PURE__ */ a("div", { style: { ...t.selectorGroup, ...d ? t.selectorGroupMobile : null }, children: [
                /* @__PURE__ */ n("label", { style: t.selectorLabel, children: "API Key" }),
                /* @__PURE__ */ a(
                  "select",
                  {
                    style: { ...t.select, ...d ? t.selectMobile : null },
                    value: x ?? "",
                    onChange: (e) => {
                      const i = Number(e.target.value || 0);
                      re(i || null), P("");
                    },
                    children: [
                      /* @__PURE__ */ n("option", { value: "", children: "Select key" }),
                      D.map((e) => /* @__PURE__ */ n("option", { value: e.id, children: e.name }, e.id))
                    ]
                  }
                )
              ] }),
              !d && /* @__PURE__ */ n("div", { style: t.selectorDivider })
            ] }),
            /* @__PURE__ */ a("div", { style: { ...t.selectorGroup, ...d ? t.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ n("label", { style: t.selectorLabel, children: o("playground.platform") }),
              /* @__PURE__ */ n(
                "select",
                {
                  style: { ...t.select, ...d ? t.selectMobile : null },
                  value: b,
                  onChange: (e) => E(e.target.value),
                  disabled: !!x || !!(c != null && c.api_key_id),
                  children: I.filter((e) => {
                    var i;
                    return !x || ((i = q.find((g) => {
                      var A;
                      return g.id === ((A = D.find((K) => K.id === x)) == null ? void 0 : A.group_id);
                    })) == null ? void 0 : i.platform) === e.Name;
                  }).filter((e) => !(c != null && c.api_key_platform) || c.api_key_platform === e.Name).map((e) => /* @__PURE__ */ n("option", { value: e.Name, children: e.DisplayName || e.Name }, e.Name))
                }
              )
            ] }),
            !d && /* @__PURE__ */ n("div", { style: t.selectorDivider }),
            /* @__PURE__ */ a("div", { style: { ...t.selectorGroup, ...d ? t.selectorGroupMobile : null }, children: [
              /* @__PURE__ */ n("label", { style: t.selectorLabel, children: o("playground.model") }),
              /* @__PURE__ */ n(
                "select",
                {
                  style: { ...t.select, ...d ? t.selectMobile : null },
                  value: u,
                  onChange: (e) => H(e.target.value),
                  children: L.map((e) => /* @__PURE__ */ n("option", { value: e.id, children: e.name || e.id }, e.id))
                }
              )
            ] })
          ] })
        ] }),
        le && /* @__PURE__ */ n("span", { style: { ...t.topBarTitle, ...d ? t.topBarTitleMobile : null }, children: le.title || o("playground.new_conversation") })
      ] }),
      /* @__PURE__ */ a("div", { style: t.messagesArea, children: [
        !s && /* @__PURE__ */ a("div", { style: { ...t.emptyState, ...d ? t.emptyStateMobile : null }, children: [
          /* @__PURE__ */ n("div", { style: t.emptyIcon, children: /* @__PURE__ */ a("svg", { width: "48", height: "48", viewBox: "0 0 48 48", fill: "none", children: [
            /* @__PURE__ */ n("rect", { x: "4", y: "4", width: "40", height: "40", rx: "20", fill: r("primarySubtle") }),
            /* @__PURE__ */ n("path", { d: "M24 16v6m0 0v6m0-6h6m-6 0h-6", stroke: r("primary"), strokeWidth: "2", strokeLinecap: "round" })
          ] }) }),
          /* @__PURE__ */ n("div", { style: t.emptyTitle, children: o("playground.empty_title") }),
          /* @__PURE__ */ n("div", { style: t.emptyDesc, children: o("playground.empty_description") }),
          /* @__PURE__ */ a("button", { style: t.emptyBtn, onClick: se, children: [
            /* @__PURE__ */ n("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ n("path", { d: "M7 1v12M1 7h12" }) }),
            o("playground.new_conversation")
          ] })
        ] }),
        s && y.map((e) => /* @__PURE__ */ a("div", { style: { ...t.messageRow, ...d ? t.messageRowMobile : null }, children: [
          /* @__PURE__ */ n("div", { style: e.role === "user" ? t.avatarUser : t.avatarAssistant, children: e.role === "user" ? /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ n("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ n("circle", { cx: "12", cy: "7", r: "4" })
          ] }) : /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ n("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ n("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ a("div", { style: t.messageBody, children: [
            /* @__PURE__ */ n("div", { style: t.messageRole, children: e.role === "user" ? o("playground.you") : o("playground.assistant") }),
            /* @__PURE__ */ n("div", { style: t.messageContent, children: e.content }),
            e.role === "assistant" && e.model && /* @__PURE__ */ n("div", { style: t.messageMeta, children: /* @__PURE__ */ n("span", { style: t.metaBadge, children: e.model }) })
          ] })
        ] }, e.id)),
        w && v && /* @__PURE__ */ a("div", { style: { ...t.messageRow, ...d ? t.messageRowMobile : null }, children: [
          /* @__PURE__ */ n("div", { style: t.avatarAssistant, children: /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ n("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ n("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ a("div", { style: t.messageBody, children: [
            /* @__PURE__ */ n("div", { style: t.messageRole, children: o("playground.assistant") }),
            /* @__PURE__ */ n("div", { style: t.messageContent, children: v }),
            /* @__PURE__ */ a("div", { style: t.messageMeta, children: [
              /* @__PURE__ */ n("span", { style: t.streamingDot }),
              /* @__PURE__ */ n("span", { children: o("playground.streaming") })
            ] })
          ] })
        ] }),
        w && !v && /* @__PURE__ */ a("div", { style: { ...t.messageRow, ...d ? t.messageRowMobile : null }, children: [
          /* @__PURE__ */ n("div", { style: t.avatarAssistant, children: /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ n("path", { d: "M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" }),
            /* @__PURE__ */ n("path", { d: "M6 12h12l2 8H4l2-8z" })
          ] }) }),
          /* @__PURE__ */ a("div", { style: t.messageBody, children: [
            /* @__PURE__ */ n("div", { style: t.messageRole, children: o("playground.assistant") }),
            /* @__PURE__ */ n("div", { style: { ...t.messageContent, opacity: 0.5 }, children: /* @__PURE__ */ n("span", { style: t.thinkingDots, children: o("playground.thinking") }) })
          ] })
        ] }),
        ne && /* @__PURE__ */ a("div", { style: { ...t.errorBar, ...d ? t.errorBarMobile : null }, children: [
          /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ n("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ n("path", { d: "M12 8v4m0 4h.01" })
          ] }),
          ne
        ] }),
        /* @__PURE__ */ n("div", { ref: oe })
      ] }),
      s && /* @__PURE__ */ n("div", { style: { ...t.inputArea, ...d ? t.inputAreaMobile : null }, children: /* @__PURE__ */ a("div", { style: t.inputWrapper, children: [
        /* @__PURE__ */ n(
          "textarea",
          {
            ref: xe,
            style: t.textarea,
            value: B,
            onChange: (e) => {
              W(e.target.value), Se(e.target);
            },
            onKeyDown: we,
            placeholder: o("playground.input_placeholder"),
            rows: 1,
            disabled: w
          }
        ),
        /* @__PURE__ */ a("div", { style: { ...t.inputActions, ...d ? t.inputActionsMobile : null }, children: [
          /* @__PURE__ */ n("span", { style: { ...t.inputHint, ...d ? t.inputHintMobile : null }, children: o("playground.input_hint") }),
          w ? /* @__PURE__ */ a("button", { style: { ...t.stopBtn, ...d ? t.actionBtnMobile : null }, onClick: ke, children: [
            /* @__PURE__ */ n("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "currentColor", children: /* @__PURE__ */ n("rect", { x: "2", y: "2", width: "8", height: "8", rx: "1" }) }),
            o("playground.stop")
          ] }) : /* @__PURE__ */ a(
            "button",
            {
              style: {
                ...t.sendBtn,
                ...d ? t.actionBtnMobile : null,
                opacity: B.trim() && (c != null && c.api_key_id || x) ? 1 : 0.4
              },
              onClick: Q,
              disabled: !B.trim() || !(c != null && c.api_key_id) && !x,
              children: [
                /* @__PURE__ */ a("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ n("path", { d: "M22 2L11 13" }),
                  /* @__PURE__ */ n("path", { d: "M22 2l-7 20-4-9-9-4 20-7z" })
                ] }),
                o("playground.send")
              ]
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ n("style", { children: He })
  ] });
}
const He = `
@keyframes pg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pg-fadein {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`, t = {
  layout: {
    display: "flex",
    height: "100%",
    background: r("bgDeep"),
    fontFamily: r("fontSans"),
    color: r("text"),
    overflow: "hidden"
  },
  // ── Sidebar ──
  sidebar: {
    width: 280,
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    background: r("bg"),
    borderRight: `1px solid ${r("borderSubtle")}`,
    position: "relative",
    zIndex: 2
  },
  sidebarBackdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(6, 10, 18, 0.64)",
    zIndex: 1
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
    color: r("textTertiary")
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: `1px solid ${r("border")}`,
    borderRadius: r("radiusSm"),
    background: r("bgSurface"),
    color: r("textSecondary"),
    cursor: "pointer",
    transition: r("transition")
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
    borderRadius: r("radiusSm"),
    cursor: "pointer",
    transition: r("transition"),
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
    color: r("textTertiary"),
    cursor: "pointer",
    padding: "2px",
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.5,
    transition: r("transition"),
    marginTop: 1
  },
  emptyConvList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "32px 16px",
    color: r("textTertiary"),
    fontSize: 12
  },
  balanceBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: `1px solid ${r("borderSubtle")}`
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: r("textTertiary")
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: r("fontMono"),
    color: r("primary")
  },
  // ── Main ──
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  // ── Top bar ──
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "8px 20px",
    borderBottom: `1px solid ${r("borderSubtle")}`,
    background: r("bg"),
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
    borderRadius: r("radiusSm"),
    background: "transparent",
    color: r("textSecondary"),
    cursor: "pointer",
    transition: r("transition"),
    flexShrink: 0
  },
  selectors: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: r("bgSurface"),
    borderRadius: r("radiusSm"),
    border: `1px solid ${r("borderSubtle")}`,
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
    color: r("textTertiary"),
    whiteSpace: "nowrap"
  },
  selectorDivider: {
    width: 1,
    height: 24,
    background: r("borderSubtle"),
    flexShrink: 0
  },
  select: {
    padding: "2px 4px",
    border: "none",
    background: "transparent",
    color: r("text"),
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    fontFamily: r("fontSans"),
    minWidth: 0
  },
  selectMobile: {
    width: "100%",
    minHeight: 34,
    borderRadius: r("radiusSm"),
    padding: "6px 8px",
    background: r("bgDeep")
  },
  topBarTitle: {
    fontSize: 12,
    color: r("textTertiary"),
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
    color: r("text"),
    letterSpacing: "-0.02em"
  },
  emptyDesc: {
    fontSize: 13,
    color: r("textSecondary"),
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
    borderRadius: r("radiusMd"),
    background: r("primary"),
    color: r("textInverse"),
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: r("transition"),
    marginTop: 8,
    fontFamily: r("fontSans")
  },
  // ── Message row ──
  messageRow: {
    display: "flex",
    gap: 14,
    padding: "20px 28px",
    animation: "pg-fadein 0.25s ease-out",
    borderBottom: `1px solid ${r("borderSubtle")}`
  },
  messageRowMobile: {
    gap: 10,
    padding: "16px 14px"
  },
  avatarUser: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: r("primary"),
    color: r("textInverse"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  avatarAssistant: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: r("bgSurface"),
    border: `1px solid ${r("border")}`,
    color: r("textSecondary"),
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
    color: r("text")
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: r("text")
  },
  messageMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 11,
    color: r("textTertiary")
  },
  metaBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "999px",
    background: r("bgSurface"),
    border: `1px solid ${r("borderSubtle")}`,
    fontSize: 11,
    fontFamily: r("fontMono"),
    color: r("textSecondary")
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: r("primary"),
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
    borderRadius: r("radiusSm"),
    background: r("dangerSubtle"),
    color: r("danger"),
    fontSize: 13,
    border: `1px solid ${r("danger")}`,
    borderColor: "rgba(251, 113, 133, 0.2)"
  },
  errorBarMobile: {
    margin: "8px 14px"
  },
  // ── Input ──
  inputArea: {
    padding: "16px 28px 20px",
    borderTop: `1px solid ${r("borderSubtle")}`,
    background: r("bg"),
    flexShrink: 0
  },
  inputAreaMobile: {
    padding: "12px 14px 16px"
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: `1px solid ${r("border")}`,
    borderRadius: r("radiusMd"),
    background: r("bgSurface"),
    padding: "12px 14px 8px",
    transition: r("transition")
  },
  textarea: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: r("text"),
    fontSize: 14,
    fontFamily: r("fontSans"),
    resize: "none",
    outline: "none",
    lineHeight: 1.6,
    minHeight: 24,
    maxHeight: 200
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
  inputHint: {
    fontSize: 11,
    color: r("textTertiary")
  },
  inputHintMobile: {
    order: 2
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: r("radiusSm"),
    background: r("primary"),
    color: r("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: r("transition"),
    fontFamily: r("fontSans")
  },
  stopBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    border: "none",
    borderRadius: r("radiusSm"),
    background: r("danger"),
    color: r("textInverse"),
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: r("fontSans")
  },
  actionBtnMobile: {
    width: "100%",
    justifyContent: "center"
  }
}, Ge = {
  routes: [
    { path: "/playground", component: We }
  ]
};
export {
  Ge as default
};
