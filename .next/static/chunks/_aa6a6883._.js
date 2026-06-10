(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/hooks/useMobile.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useMobile": (()=>useMobile)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function useMobile(breakpoint = 768) {
    _s();
    const [isMobile, setIsMobile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMobile.useEffect": ()=>{
            const check = {
                "useMobile.useEffect.check": ()=>setIsMobile(window.innerWidth < breakpoint)
            }["useMobile.useEffect.check"];
            check();
            const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
            mql.addEventListener("change", check);
            return ({
                "useMobile.useEffect": ()=>mql.removeEventListener("change", check)
            })["useMobile.useEffect"];
        }
    }["useMobile.useEffect"], [
        breakpoint
    ]);
    return isMobile;
}
_s(useMobile, "0VTTNJATKABQPGLm9RVT0tKGUgU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/shared/CustomCursor.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "CustomCursor": (()=>CustomCursor)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMobile$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useMobile.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function CustomCursor() {
    _s();
    const isMobile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMobile$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMobile"])();
    const ringRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dotRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const target = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0,
        y: 0
    });
    const current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0,
        y: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CustomCursor.useEffect": ()=>{
            if (isMobile) return;
            document.body.classList.add("custom-cursor-active");
            const onMove = {
                "CustomCursor.useEffect.onMove": (e)=>{
                    target.current.x = e.clientX;
                    target.current.y = e.clientY;
                }
            }["CustomCursor.useEffect.onMove"];
            window.addEventListener("mousemove", onMove, {
                passive: true
            });
            let rafId;
            const tick = {
                "CustomCursor.useEffect.tick": ()=>{
                    current.current.x += (target.current.x - current.current.x) * 0.12;
                    current.current.y += (target.current.y - current.current.y) * 0.12;
                    ringRef.current?.style.setProperty("transform", `translate(${current.current.x - 20}px, ${current.current.y - 20}px)`);
                    dotRef.current?.style.setProperty("transform", `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`);
                    rafId = requestAnimationFrame(tick);
                }
            }["CustomCursor.useEffect.tick"];
            rafId = requestAnimationFrame(tick);
            const onEnter = {
                "CustomCursor.useEffect.onEnter": ()=>{
                    ringRef.current?.classList.add("scale-150");
                    if (ringRef.current) ringRef.current.style.borderColor = "rgba(0,229,255,0.9)";
                }
            }["CustomCursor.useEffect.onEnter"];
            const onLeave = {
                "CustomCursor.useEffect.onLeave": ()=>{
                    ringRef.current?.classList.remove("scale-150");
                    if (ringRef.current) ringRef.current.style.borderColor = "rgba(0,229,255,0.4)";
                }
            }["CustomCursor.useEffect.onLeave"];
            const els = document.querySelectorAll("a, button, [data-cursor='pointer']");
            els.forEach({
                "CustomCursor.useEffect": (el)=>{
                    el.addEventListener("mouseenter", onEnter);
                    el.addEventListener("mouseleave", onLeave);
                }
            }["CustomCursor.useEffect"]);
            return ({
                "CustomCursor.useEffect": ()=>{
                    cancelAnimationFrame(rafId);
                    window.removeEventListener("mousemove", onMove);
                    document.body.classList.remove("custom-cursor-active");
                    els.forEach({
                        "CustomCursor.useEffect": (el)=>{
                            el.removeEventListener("mouseenter", onEnter);
                            el.removeEventListener("mouseleave", onLeave);
                        }
                    }["CustomCursor.useEffect"]);
                }
            })["CustomCursor.useEffect"];
        }
    }["CustomCursor.useEffect"], [
        isMobile
    ]);
    if (isMobile) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: ringRef,
                className: "fixed top-0 left-0 w-10 h-10 rounded-full border border-cyan-400/40 pointer-events-none z-[9999] transition-colors duration-200 mix-blend-difference",
                style: {
                    willChange: "transform"
                }
            }, void 0, false, {
                fileName: "[project]/components/shared/CustomCursor.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: dotRef,
                className: "fixed top-0 left-0 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none z-[9999]",
                style: {
                    willChange: "transform"
                }
            }, void 0, false, {
                fileName: "[project]/components/shared/CustomCursor.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(CustomCursor, "Csdgj1bYUfYXf0uujoku1Nhfivs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMobile$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMobile"]
    ];
});
_c = CustomCursor;
var _c;
__turbopack_context__.k.register(_c, "CustomCursor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/shared/CustomCursor.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/components/shared/CustomCursor.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=_aa6a6883._.js.map