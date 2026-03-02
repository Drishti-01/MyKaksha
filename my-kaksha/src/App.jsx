import { useState, useEffect, useRef } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family:'Poppins',sans-serif; background:#FAF8F3; color:#5a4a3a; overflow-x:hidden; }

  /* NAVBAR */
  .nav { position:fixed; top:0; left:0; right:0; z-index:100;
    background:rgba(250,248,243,0.92); backdrop-filter:blur(14px);
    padding:16px 48px; display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid #EED6C430; font-family:'Poppins',sans-serif; }
  .nav-logo { font-size:1.4rem; font-weight:800; color:#8B6F5E; }
  .nav-logo span { color:#C8B6A6; }
  .nav-links { display:flex; gap:32px; list-style:none; }
  .nav-links a { text-decoration:none; color:#8B6F5E; font-size:0.9rem; font-weight:500; transition:color .2s; }
  .nav-links a:hover { color:#4a3728; }
  .nav-cta { background:#EED6C4; color:#5a4a3a; border:none; padding:10px 24px; border-radius:50px;
    font-family:'Poppins',sans-serif; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all .25s; }
  .nav-cta:hover { background:#C8B6A6; color:#fff; transform:translateY(-1px); }

  /* HERO */
  .hero { min-height:100vh; padding:120px 48px 80px; display:grid; grid-template-columns:1fr 1fr;
    gap:60px; align-items:center; position:relative; overflow:hidden; }
  .nb-lines { position:absolute; inset:0; pointer-events:none; opacity:0.025;
    background-image:repeating-linear-gradient(transparent,transparent 28px,#8B6F5E 28px,#8B6F5E 29px); }
  .blob { position:absolute; border-radius:50%; filter:blur(60px); opacity:.55; pointer-events:none; }
  .b1 { width:500px; height:500px; background:radial-gradient(circle,#EED6C4,#F5EFE6);
    top:-100px; right:-100px; animation:fb 8s ease-in-out infinite; }
  .b2 { width:300px; height:300px; background:radial-gradient(circle,#C8B6A6,#EED6C4);
    bottom:50px; left:-50px; animation:fb 10s ease-in-out infinite reverse; }
  .b3 { width:200px; height:200px; background:radial-gradient(circle,#F5EFE6,#EED6C4);
    top:50%; left:38%; animation:fb 7s ease-in-out infinite 2s; }
  @keyframes fb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-20px) scale(1.05)} }
  .sp { position:absolute; animation:tw 3s ease-in-out infinite; pointer-events:none; color:#C8B6A6; opacity:.7; font-size:1.2rem; }
  @keyframes tw { 0%,100%{opacity:.3;transform:scale(1) rotate(0deg)} 50%{opacity:1;transform:scale(1.3) rotate(15deg)} }

  .badge { display:inline-flex; align-items:center; gap:8px; background:#F5EFE6; border:1px solid #EED6C4;
    padding:8px 18px; border-radius:50px; font-size:.8rem; color:#8B6F5E; font-weight:500; margin-bottom:24px; }
  .bdot { width:7px; height:7px; background:#C8B6A6; border-radius:50%; animation:pu 2s infinite; }
  @keyframes pu { 0%,100%{opacity:1} 50%{opacity:.3} }

  .h1 { font-size:3.8rem; font-weight:800; line-height:1.1; color:#4a3728; margin-bottom:20px; letter-spacing:-1.5px; }
  .uw { color:#8B6F5E; position:relative; display:inline-block; }
  .uw::after { content:''; position:absolute; bottom:4px; left:0; right:0; height:3px; background:#EED6C4; border-radius:2px; }
  .hsub { font-size:1.05rem; color:#8B6F5E; line-height:1.7; margin-bottom:36px; max-width:440px; }
  .bgrp { display:flex; gap:14px; flex-wrap:wrap; }
  .bp { background:linear-gradient(135deg,#C8B6A6,#8B6F5E); color:#fff; border:none;
    padding:14px 32px; border-radius:50px; font-family:'Poppins',sans-serif; font-weight:600; font-size:.95rem;
    cursor:pointer; box-shadow:0 8px 24px #C8B6A640; transition:all .3s cubic-bezier(.34,1.56,.64,1); }
  .bp:hover { transform:translateY(-3px) scale(1.04); box-shadow:0 14px 32px #C8B6A660; }
  .bs { background:#F5EFE6; color:#8B6F5E; border:1.5px solid #EED6C4;
    padding:14px 32px; border-radius:50px; font-family:'Poppins',sans-serif; font-weight:600; font-size:.95rem;
    cursor:pointer; transition:all .3s cubic-bezier(.34,1.56,.64,1); }
  .bs:hover { background:#EED6C4; transform:translateY(-3px) scale(1.04); }

  .hr { display:flex; justify-content:center; align-items:center; position:relative; }
  .bc { position:relative; animation:bf 4s ease-in-out infinite; }
  @keyframes bf { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-18px) rotate(1deg)} }
  .bsh { position:absolute; bottom:-30px; left:50%; transform:translateX(-50%);
    width:140px; height:20px; background:#C8B6A640; border-radius:50%; filter:blur(8px);
    animation:shp 4s ease-in-out infinite; }
  @keyframes shp { 0%,100%{width:140px;opacity:.5} 50%{width:100px;opacity:.3} }

  /* STATS */
  .ss { background:#F5EFE6; padding:36px 48px; display:flex; gap:0; align-items:center;
    justify-content:center; border-top:1px solid #EED6C440; border-bottom:1px solid #EED6C440; flex-wrap:wrap; }
  .si { text-align:center; padding:0 40px; }
  .sn { font-size:2rem; font-weight:800; color:#4a3728; }
  .sl { font-size:.8rem; color:#C8B6A6; font-weight:500; }
  .sdiv { width:1px; height:40px; background:#EED6C4; }

  /* SECTIONS */
  .sec { padding:100px 48px; font-family:'Poppins',sans-serif; }
  .stag { display:inline-block; background:#EED6C4; color:#8B6F5E; padding:6px 18px; border-radius:50px;
    font-size:.78rem; font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
  .stitle { font-size:2.4rem; font-weight:800; color:#4a3728; margin-bottom:12px; letter-spacing:-.8px; }
  .ssub { color:#8B6F5E; font-size:1rem; line-height:1.7; max-width:480px; }
  .sh { margin-bottom:60px; }
  .shc { text-align:center; }
  .shc .ssub { margin:0 auto; }

  /* FEATURES */
  .fg { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .fc { background:#F5EFE6; border-radius:28px; padding:36px 32px; position:relative; overflow:hidden;
    border:1px solid #EED6C430; transition:all .35s cubic-bezier(.34,1.56,.64,1); box-shadow:0 4px 20px #C8B6A610; }
  .fc:hover { transform:translateY(-8px); box-shadow:0 20px 50px #C8B6A625; }
  .fcc1 { position:absolute; top:-10px; right:-10px; width:60px; height:60px; border-radius:50%; background:#EED6C460; pointer-events:none; }
  .fcc2 { position:absolute; bottom:-15px; left:-15px; width:45px; height:45px; border-radius:50%; background:#C8B6A620; pointer-events:none; }
  .fi { font-size:2.2rem; margin-bottom:18px; display:block; }
  .ft { font-size:1.1rem; font-weight:700; color:#4a3728; margin-bottom:10px; }
  .fd { font-size:.88rem; color:#8B6F5E; line-height:1.65; }

  /* PREVIEW */
  .pvl { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
  .dm { background:#FFFDF9; border-radius:32px; padding:28px;
    box-shadow:0 20px 60px #C8B6A625,0 2px 8px #C8B6A615; border:1px solid #EED6C440; }
  .dtb { display:flex; align-items:center; gap:8px; margin-bottom:24px; }
  .dot { width:10px; height:10px; border-radius:50%; }
  .dr{background:#FFBBAA;} .dy{background:#FFE0A3;} .dg{background:#B8E0C8;}
  .dttl { font-size:.8rem; color:#C8B6A6; margin-left:8px; font-weight:500; }
  .dgrid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .dcard { background:#F5EFE6; border-radius:20px; padding:20px; border:1px solid #EED6C430; }
  .dcard.w { grid-column:1/-1; }
  .dlbl { font-size:.7rem; color:#C8B6A6; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .pt { font-size:2.2rem; font-weight:800; color:#4a3728; letter-spacing:-1px; }
  .ps { font-size:.75rem; color:#8B6F5E; margin-top:4px; }
  .cbars { display:flex; gap:8px; align-items:flex-end; height:70px; margin-top:10px; }
  .cbw { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
  .cb { width:100%; background:linear-gradient(180deg,#C8B6A6,#EED6C4); border-radius:6px 6px 0 0; }
  .cd { font-size:.6rem; color:#C8B6A6; font-weight:600; }
  .pr { margin-top:10px; }
  .prl { display:flex; justify-content:space-between; font-size:.72rem; color:#8B6F5E; margin-bottom:6px; font-weight:500; }
  .prt { height:8px; background:#EED6C4; border-radius:50px; overflow:hidden; }
  .prf { height:100%; background:linear-gradient(90deg,#C8B6A6,#8B6F5E); border-radius:50px; }

  /* STEPS */
  .stg { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; }
  .stc { text-align:center; background:#F5EFE6; border-radius:28px; padding:40px 24px;
    border:1px solid #EED6C430; position:relative; transition:transform .3s; }
  .stc:hover { transform:translateY(-6px); }
  .stn { position:absolute; top:-14px; left:50%; transform:translateX(-50%);
    background:linear-gradient(135deg,#C8B6A6,#8B6F5E); color:#fff;
    width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:.75rem; font-weight:700; }
  .sticon { font-size:2.4rem; margin-bottom:16px; display:block; }
  .sttitle { font-weight:700; color:#4a3728; margin-bottom:8px; font-size:1rem; }
  .stdesc { font-size:.83rem; color:#8B6F5E; line-height:1.6; }

  /* TESTI */
  .tgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .tc { background:#FFFDF9; border-radius:28px; padding:32px; border:1px solid #EED6C430;
    box-shadow:0 4px 20px #C8B6A610; transition:transform .3s; }
  .tc:hover { transform:translateY(-6px); }
  .tstars { color:#C8B6A6; font-size:.9rem; margin-bottom:14px; }
  .ttext { font-size:.9rem; color:#5a4a3a; line-height:1.7; margin-bottom:20px; font-style:italic; }
  .tauth { display:flex; align-items:center; gap:12px; }
  .tav { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#EED6C4,#C8B6A6);
    display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
  .tnm { font-weight:600; color:#4a3728; font-size:.88rem; }
  .trl { font-size:.75rem; color:#C8B6A6; }

  /* CTA */
  .ctas { background:linear-gradient(135deg,#F5EFE6,#EED6C4); text-align:center; padding:100px 48px; position:relative; overflow:hidden; font-family:'Poppins',sans-serif; }
  .ctat { font-size:3rem; font-weight:800; color:#4a3728; margin-bottom:16px; letter-spacing:-1px; }
  .ctas2 { color:#8B6F5E; font-size:1rem; margin-bottom:40px; }

  /* FOOTER */
  footer { background:#F5EFE6; padding:60px 48px 40px; border-top:1px solid #EED6C450; font-family:'Poppins',sans-serif; }
  .fgrid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:60px; margin-bottom:48px; }
  .fbrand { font-size:1.5rem; font-weight:800; color:#8B6F5E; margin-bottom:10px; }
  .ftag { font-size:.85rem; color:#C8B6A6; line-height:1.6; margin-bottom:24px; font-style:italic; }
  .fsoc { display:flex; gap:12px; }
  .sb { width:38px; height:38px; background:#EED6C4; border-radius:50%; display:flex; align-items:center;
    justify-content:center; cursor:pointer; transition:all .25s; border:none; color:#8B6F5E;
    text-decoration:none; font-size:.85rem; font-weight:700; }
  .sb:hover { background:#C8B6A6; color:#fff; transform:translateY(-3px); }
  .fct { font-weight:700; color:#4a3728; font-size:.9rem; margin-bottom:18px; }
  .flinks { list-style:none; display:flex; flex-direction:column; gap:10px; }
  .flinks a { text-decoration:none; color:#8B6F5E; font-size:.85rem; transition:color .2s; }
  .flinks a:hover { color:#4a3728; }
  .fbot { border-top:1px solid #EED6C440; padding-top:24px; display:flex; justify-content:space-between; align-items:center; }
  .fcp { font-size:.78rem; color:#C8B6A6; }

  .fade-in { opacity:0; transform:translateY(30px); transition:opacity .7s ease,transform .7s ease; }
  .fade-in.visible { opacity:1; transform:translateY(0); }

  @media(max-width:900px){
    .hero,.pvl{grid-template-columns:1fr; padding:100px 24px 60px;}
    .hr,.fgrid{display:none;}
    .fg,.tgrid,.stg{grid-template-columns:1fr 1fr;}
    .h1{font-size:2.6rem;}
    .ss{flex-wrap:wrap; padding:24px;}
    .sec{padding:60px 24px;}
    .nav{padding:16px 24px;}
    .nav-links{display:none;}
    .fgrid{display:grid; grid-template-columns:1fr; gap:32px; display:block;}
  }
  @media(max-width:600px){.fg,.tgrid,.stg{grid-template-columns:1fr;}}
`;

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => el.classList.add("visible"), delay); ob.unobserve(el); }
    }, { threshold: 0.1 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [delay]);
  return <div ref={ref} className="fade-in">{children}</div>;
}

function Pomo() {
  const [s, setS] = useState(1500);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setS(x => x > 0 ? x-1 : 0), 1000);
    return () => clearInterval(t);
  }, [on]);
  const m = String(Math.floor(s/60)).padStart(2,"0");
  const sec = String(s%60).padStart(2,"0");
  return (
    <div>
      <div className="pt">{m}:{sec}</div>
      <div className="ps">Focus session</div>
      <button onClick={()=>setOn(r=>!r)} style={{
        marginTop:10, background:on?"#EED6C4":"linear-gradient(135deg,#C8B6A6,#8B6F5E)",
        color:on?"#5a4a3a":"#fff", border:"none", padding:"7px 18px", borderRadius:50,
        fontSize:".75rem", fontWeight:600, fontFamily:"Poppins,sans-serif", cursor:"pointer"
      }}>{on?"⏸ Pause":"▶ Start"}</button>
    </div>
  );
}
const BearSVG = () => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 6), 2200);
    return () => clearInterval(t);
  }, []);

  const floatingSymbols = [
    { text: "?",   color: "#8B6F5E", size: "2rem" },
    { text: "!",   color: "#C8B6A6", size: "1.8rem" },
    { text: "??",  color: "#8B6F5E", size: "1.6rem" },
    { text: "?!",  color: "#A0785A", size: "1.9rem" },
    { text: "💡",  color: "#C8B6A6", size: "1.7rem" },
    { text: "...", color: "#C8B6A6", size: "1.5rem" },
  ];

  // per frame: left eye ry, right eye ry, eyebrow tilt, mouth type
  const frames = [
    { lry:5,  rry:5,  lbrow:"M136 136 Q144 132 152 135", rbrow:"M186 135 Q194 132 202 136", mouth:"slight_smile",  blush:0.3, sweat:false, headTilt:0    },   // calm reading
    { lry:3,  rry:3,  lbrow:"M136 133 Q144 130 152 133", rbrow:"M186 133 Q194 130 202 133", mouth:"focus",         blush:0.2, sweat:false, headTilt:-3   },   // squinting focused
    { lry:10, rry:10, lbrow:"M136 130 Q144 126 152 130", rbrow:"M186 130 Q194 126 202 130", mouth:"open_shock",    blush:0.5, sweat:false, headTilt:4    },   // shocked wide eyes
    { lry:4,  rry:9,  lbrow:"M136 132 Q144 128 152 134", rbrow:"M186 130 Q194 133 202 130", mouth:"confused_wave", blush:0.5, sweat:true,  headTilt:5    },   // confused one brow up
    { lry:1,  rry:1,  lbrow:"M136 136 Q144 133 152 136", rbrow:"M186 136 Q194 133 202 136", mouth:"slight_smile",  blush:0.3, sweat:false, headTilt:0    },   // blinking
    { lry:6,  rry:2,  lbrow:"M136 134 Q144 137 152 133", rbrow:"M186 131 Q194 128 202 132", mouth:"squiggle",      blush:0.6, sweat:true,  headTilt:-4   },   // very confused
  ];

  const fr = frames[frame];
  const sym = floatingSymbols[frame];

  return (
    <div style={{ position:"relative", width:"360px", height:"420px", fontFamily:"'Poppins',sans-serif" }}>
      <style>{`
        @keyframes symFloat {
          0%   { opacity:0; transform:translateX(-50%) translateY(4px) scale(0.7); }
          15%  { opacity:1; transform:translateX(-50%) translateY(-8px) scale(1.2); }
          70%  { opacity:1; transform:translateX(-50%) translateY(-12px) scale(1.05); }
          100% { opacity:0; transform:translateX(-50%) translateY(-20px) scale(0.85); }
        }
        @keyframes dotPop {
          0%,100% { opacity:0.2; transform:scale(0.8); }
          50%     { opacity:0.8; transform:scale(1.1); }
        }
        @keyframes starTwinkle {
          0%,100% { opacity:0.4; transform:scale(1) rotate(0deg); }
          50%     { opacity:1;   transform:scale(1.25) rotate(20deg); }
        }
        @keyframes steamUp {
          0%   { opacity:0.7; transform:translateY(0) scaleX(1); }
          100% { opacity:0;   transform:translateY(-14px) scaleX(1.3); }
        }
        @keyframes cloudDrift {
          0%,100% { transform:translateX(0px); }
          50%     { transform:translateX(6px); }
        }
        @keyframes sweatDrop {
          0%,100% { transform:translateY(0); opacity:0.6; }
          50%     { transform:translateY(4px); opacity:1; }
        }
        @keyframes screenFlicker {
          0%,100% { opacity:0.35; }
          50%     { opacity:0.55; }
        }
      `}</style>

      {/* ── CLOUDS ── */}
      <div style={{position:"absolute",top:"30px",left:"0px",animation:"cloudDrift 5s ease-in-out infinite"}}>
        <svg width="60" height="32" viewBox="0 0 60 32" fill="none">
          <ellipse cx="30" cy="22" rx="24" ry="11" fill="#F0E8DE" opacity="0.9"/>
          <ellipse cx="20" cy="17" rx="14" ry="11" fill="#F0E8DE" opacity="0.9"/>
          <ellipse cx="40" cy="18" rx="12" ry="9"  fill="#F0E8DE" opacity="0.9"/>
        </svg>
      </div>
      <div style={{position:"absolute",top:"45px",right:"0px",animation:"cloudDrift 6s ease-in-out 1s infinite"}}>
        <svg width="50" height="28" viewBox="0 0 50 28" fill="none">
          <ellipse cx="25" cy="19" rx="20" ry="9"  fill="#F0E8DE" opacity="0.9"/>
          <ellipse cx="16" cy="15" rx="11" ry="9"  fill="#F0E8DE" opacity="0.9"/>
          <ellipse cx="34" cy="16" rx="10" ry="8"  fill="#F0E8DE" opacity="0.9"/>
        </svg>
      </div>

      {/* ── SPARKLE STARS ── */}
      {[
        {top:"62px", left:"22px",  size:14, delay:"0s"},
        {top:"90px", right:"22px", size:12, delay:"0.6s"},
        {top:"155px",left:"8px",   size:10, delay:"1.1s"},
        {top:"148px",right:"8px",  size:16, delay:"0.3s"},
        {top:"220px",left:"18px",  size:9,  delay:"1.4s"},
      ].map((s,i) => (
        <div key={i} style={{
          position:"absolute", top:s.top, left:s.left, right:s.right,
          animation:`starTwinkle 2.5s ease-in-out ${s.delay} infinite`
        }}>
          <svg width={s.size} height={s.size} viewBox="0 0 20 20" fill="none">
            <path d="M10 1 L11.8 8.2 L19 10 L11.8 11.8 L10 19 L8.2 11.8 L1 10 L8.2 8.2 Z" fill="#C8B6A6"/>
          </svg>
        </div>
      ))}

      {/* ── FLOATING SYMBOL ── */}
      <div key={frame} style={{
        position:"absolute", top:"8px", left:"50%",
        transform:"translateX(-50%)",
        fontSize: sym.size, color: sym.color,
        fontWeight:800, animation:"symFloat 2.2s ease-out forwards",
        pointerEvents:"none", whiteSpace:"nowrap", zIndex:20,
      }}>
        {sym.text}
      </div>

      {/* Thought dots */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:"absolute",
          top:`${56 + i*9}px`,
          left:`calc(50% + ${(i-1)*7}px)`,
          width:`${8-i*2}px`, height:`${8-i*2}px`,
          borderRadius:"50%", background:"#C8B6A6",
          animation:`dotPop 2.2s ease-in-out ${i*0.18}s infinite`,
        }}/>
      ))}

      {/* ── MAIN SVG ── */}
      <svg viewBox="0 0 360 420" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{width:"360px", height:"420px", position:"absolute", top:0, left:0}}>

        {/* ══ CHAIR ══ */}
        {/* chair back */}
        <rect x="148" y="248" width="64" height="72" rx="10" fill="#DDD0BC" stroke="#C8B6A6" strokeWidth="1.5"/>
        <rect x="155" y="255" width="50" height="58" rx="7"  fill="#E8DDD0"/>
        {/* chair seat */}
        <rect x="138" y="315" width="84" height="18" rx="9" fill="#DDD0BC" stroke="#C8B6A6" strokeWidth="1.5"/>
        {/* chair legs */}
        <rect x="148" y="333" width="10" height="52" rx="5" fill="#C8B6A6"/>
        <rect x="202" y="333" width="10" height="52" rx="5" fill="#C8B6A6"/>
        <rect x="143" y="370" width="35" height="8"  rx="4" fill="#C8B6A6" opacity="0.6"/>
        <rect x="182" y="370" width="35" height="8"  rx="4" fill="#C8B6A6" opacity="0.6"/>

        {/* ══ TABLE ══ */}
        <rect x="28" y="318" width="304" height="16" rx="8" fill="#E8DDD0" stroke="#C8B6A6" strokeWidth="1.5"/>
        <rect x="42"  y="334" width="12" height="60" rx="6" fill="#DDD0BC"/>
        <rect x="306" y="334" width="12" height="60" rx="6" fill="#DDD0BC"/>
        <rect x="70"  y="334" width="10" height="54" rx="5" fill="#DDD0BC" opacity="0.7"/>
        <rect x="280" y="334" width="10" height="54" rx="5" fill="#DDD0BC" opacity="0.7"/>

        {/* ══ BOOKS (stacked, left side) ══ */}
        <rect x="42" y="292" width="68" height="26" rx="5" fill="#C4A882" stroke="#A08060" strokeWidth="1.2"/>
        <rect x="46" y="292" width="8"  height="26" rx="3" fill="#B89870"/>
        <line x1="54" y1="296" x2="54" y2="314" stroke="#A08060" strokeWidth="1.5"/>
        <line x1="58" y1="299" x2="100" y2="299" stroke="#A08060" strokeWidth="0.8" opacity="0.5"/>
        <line x1="58" y1="305" x2="96"  y2="305" stroke="#A08060" strokeWidth="0.8" opacity="0.5"/>

        <rect x="46" y="270" width="62" height="24" rx="5" fill="#D4B896" stroke="#C8B6A6" strokeWidth="1.2"/>
        <rect x="50" y="270" width="7"  height="24" rx="3" fill="#C4A882"/>
        <line x1="57" y1="274" x2="57" y2="290" stroke="#C8B6A6" strokeWidth="1.5"/>
        <line x1="61" y1="277" x2="97"  y2="277" stroke="#C8B6A6" strokeWidth="0.8" opacity="0.5"/>

        <rect x="50" y="249" width="56" height="23" rx="5" fill="#E8C8A0" stroke="#C8B6A6" strokeWidth="1.2"/>
        <rect x="54" y="249" width="7"  height="23" rx="3" fill="#D4B080"/>
        <line x1="61" y1="253" x2="61" y2="268" stroke="#C8B6A6" strokeWidth="1.5"/>
        <line x1="65" y1="256" x2="97"  y2="256" stroke="#C8B6A6" strokeWidth="0.8" opacity="0.5"/>
        <line x1="65" y1="261" x2="95"  y2="261" stroke="#C8B6A6" strokeWidth="0.8" opacity="0.5"/>

        {/* ══ LAPTOP ══ */}
        {/* screen */}
        <rect x="134" y="250" width="108" height="72" rx="8" fill="#C8C4C0" stroke="#B8B4B0" strokeWidth="1.5"/>
        <rect x="138" y="254" width="100" height="64" rx="5" fill="#E8E6E2"/>
        {/* screen content */}
        <rect x="144" y="260" width="88" height="7"  rx="3" fill="#C8B6A6" opacity="0.45" style={{animation:"screenFlicker 2s ease-in-out infinite"}}/>
        <rect x="144" y="272" width="70" height="4"  rx="2" fill="#C8B6A6" opacity="0.28"/>
        <rect x="144" y="280" width="80" height="4"  rx="2" fill="#C8B6A6" opacity="0.28"/>
        <rect x="144" y="288" width="55" height="4"  rx="2" fill="#C8B6A6" opacity="0.22"/>
        <rect x="144" y="296" width="65" height="4"  rx="2" fill="#C8B6A6" opacity="0.22"/>
        {/* webcam dot */}
        <circle cx="188" cy="257" r="2" fill="#C8B6A6" opacity="0.5"/>
        {/* laptop base */}
        <rect x="126" y="320" width="124" height="10" rx="5" fill="#C0BCBA" stroke="#B8B4B0" strokeWidth="1"/>
        <rect x="165" y="318" width="46"  height="5"  rx="2" fill="#C8C4C0"/>

        {/* ══ COFFEE CUP ══ */}
        <rect x="265" y="278" width="38" height="34" rx="9" fill="#EDE0D0" stroke="#C8B6A6" strokeWidth="1.5"/>
        <ellipse cx="284" cy="278" rx="19" ry="6" fill="#D8C8B0" stroke="#C8B6A6" strokeWidth="1"/>
        <path d="M303 284 Q315 284 315 293 Q315 303 303 303" stroke="#C8B6A6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="284" cy="280" rx="14" ry="4" fill="#7A5540" opacity="0.4"/>
        {/* steam */}
        <path d="M274 271 Q277 264 274 257" stroke="#C8B6A6" strokeWidth="1.5" fill="none" strokeLinecap="round"
          style={{animation:"steamUp 1.8s ease-in-out infinite"}}/>
        <path d="M284 269 Q287 262 284 255" stroke="#C8B6A6" strokeWidth="1.5" fill="none" strokeLinecap="round"
          style={{animation:"steamUp 1.8s ease-in-out 0.5s infinite"}}/>
        <path d="M294 271 Q297 264 294 257" stroke="#C8B6A6" strokeWidth="1.5" fill="none" strokeLinecap="round"
          style={{animation:"steamUp 1.8s ease-in-out 0.9s infinite"}}/>

        {/* ══ BEAR — drawn seated, leaning forward ══ */}

        {/* lower body / lap (behind table) */}
        <ellipse cx="180" cy="330" rx="46" ry="22" fill="#A0785A" stroke="#8B6040" strokeWidth="1.5"/>

        {/* ARMS on table / reaching toward laptop */}
        <ellipse cx="136" cy="308" rx="26" ry="13" fill="#A0785A" stroke="#8B6040" strokeWidth="1.5" transform="rotate(-15 136 308)"/>
        <ellipse cx="224" cy="308" rx="26" ry="13" fill="#A0785A" stroke="#8B6040" strokeWidth="1.5" transform="rotate(15 224 308)"/>
        {/* paws on table edge */}
        <ellipse cx="128" cy="316" rx="14" ry="10" fill="#B08870" stroke="#8B6040" strokeWidth="1.2"/>
        <ellipse cx="232" cy="316" rx="14" ry="10" fill="#B08870" stroke="#8B6040" strokeWidth="1.2"/>

        {/* BODY — leaning slightly forward */}
        <ellipse cx="180" cy="272" rx="50" ry="56" fill="#A0785A" stroke="#8B6040" strokeWidth="2"/>
        {/* tummy patch */}
        <ellipse cx="180" cy="285" rx="28" ry="32" fill="#C8A882" stroke="#B89060" strokeWidth="1"/>

        {/* NECK */}
        <rect x="162" y="218" width="36" height="22" rx="10" fill="#A0785A"/>

        {/* HEAD with tilt */}
        <g transform={`rotate(${fr.headTilt} 180 170)`}>

          {/* head */}
          <ellipse cx="180" cy="162" rx="58" ry="55" fill="#A0785A" stroke="#8B6040" strokeWidth="2"/>

          {/* ears */}
          <circle cx="130" cy="120" r="22" fill="#A0785A" stroke="#8B6040" strokeWidth="2"/>
          <circle cx="130" cy="120" r="13" fill="#C8A882"/>
          <circle cx="230" cy="120" r="22" fill="#A0785A" stroke="#8B6040" strokeWidth="2"/>
          <circle cx="230" cy="120" r="13" fill="#C8A882"/>

          {/* face base / muzzle */}
          <ellipse cx="180" cy="175" rx="26" ry="18" fill="#C8A882"/>

          {/* EYEBROWS — dynamic */}
          <path d={fr.lbrow} stroke="#5A3820" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d={fr.rbrow} stroke="#5A3820" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

          {/* EYES — dynamic */}
          <ellipse cx="152" cy="158" rx="9" ry={fr.lry} fill="#2D1810"
            style={{transition:"ry 0.2s ease"}}/>
          <ellipse cx="208" cy="158" rx="9" ry={fr.rry} fill="#2D1810"
            style={{transition:"ry 0.2s ease"}}/>

          {/* Eye shine */}
          {frame !== 4 && <>
            <circle cx="155" cy="154" r="3.5" fill="white"/>
            <circle cx="211" cy="154" r="3.5" fill="white"/>
          </>}
          {frame === 2 && <>
            <circle cx="158" cy="161" r="2"   fill="white" opacity="0.5"/>
            <circle cx="214" cy="161" r="2"   fill="white" opacity="0.5"/>
          </>}

          {/* GLASSES */}
          <circle cx="152" cy="158" r="18" fill="rgba(200,180,160,0.12)" stroke="#5A3820" strokeWidth="2.2"/>
          <circle cx="208" cy="158" r="18" fill="rgba(200,180,160,0.12)" stroke="#5A3820" strokeWidth="2.2"/>
          <line x1="170" y1="158" x2="190" y2="158" stroke="#5A3820" strokeWidth="2.2"/>
          <line x1="134" y1="153" x2="126" y2="148" stroke="#5A3820" strokeWidth="2"/>
          <line x1="226" y1="153" x2="234" y2="148" stroke="#5A3820" strokeWidth="2"/>

          {/* NOSE */}
          <ellipse cx="180" cy="174" rx="9" ry="6" fill="#5A3820"/>
          <ellipse cx="178" cy="172" rx="3" ry="2" fill="#7A5840" opacity="0.5"/>

          {/* MOUTH — dynamic */}
          {fr.mouth === "slight_smile"  && <path d="M168 182 Q180 191 192 182" stroke="#5A3820" strokeWidth="2.2" fill="none" strokeLinecap="round"/>}
          {fr.mouth === "focus"         && <path d="M170 183 Q180 188 190 183" stroke="#5A3820" strokeWidth="2" fill="none" strokeLinecap="round"/>}
          {fr.mouth === "open_shock"    && <ellipse cx="180" cy="185" rx="10" ry="8" fill="#5A3820" opacity="0.75"/>}
          {fr.mouth === "confused_wave" && <path d="M168 183 Q174 179 180 183 Q186 187 192 183" stroke="#5A3820" strokeWidth="2.2" fill="none" strokeLinecap="round"/>}
          {fr.mouth === "squiggle"      && <path d="M166 183 Q172 177 178 183 Q184 189 190 183 Q194 179 196 181" stroke="#5A3820" strokeWidth="2.2" fill="none" strokeLinecap="round"/>}

          {/* BLUSH */}
          <ellipse cx="136" cy="174" rx="14" ry="8" fill="#E8A090" opacity={fr.blush}
            style={{transition:"opacity 0.3s"}}/>
          <ellipse cx="224" cy="174" rx="14" ry="8" fill="#E8A090" opacity={fr.blush}
            style={{transition:"opacity 0.3s"}}/>

          {/* SWEAT DROP */}
          {fr.sweat && (
            <g style={{animation:"sweatDrop 1s ease-in-out infinite"}}>
              <ellipse cx="232" cy="138" rx="5" ry="9" fill="#A8C8E0" opacity="0.7"/>
              <ellipse cx="232" cy="132" rx="4" ry="4" fill="#A8C8E0" opacity="0.5"/>
            </g>
          )}

        </g>{/* end head group */}

        {/* floor shadow */}
        <ellipse cx="180" cy="392" rx="90" ry="10" fill="#C8B6A6" opacity="0.18"/>

      </svg>
    </div>
  );
};

const features = [
  {icon:"🍅",title:"Pomodoro Timer",desc:"Stay in the zone with customizable focus intervals. Watch your productivity bloom, one session at a time."},
  {icon:"📚",title:"Subject Tracker",desc:"Organize all your subjects in one cozy space. Add topics, mark progress, and never lose track."},
  {icon:"🔥",title:"Streak System",desc:"Build daily study habits with our satisfying streak counter. Don't break the chain!"},
  {icon:"📊",title:"Focus Analytics",desc:"Visualize your weekly focus hours with soft, beautiful charts. Celebrate how far you've come."},
  {icon:"✅",title:"Task Lists",desc:"Create to-do lists that feel delightful to check off. Prioritize smartly, stress less."},
  {icon:"🎯",title:"Goal Setting",desc:"Set weekly and monthly goals. My Kaksha keeps you gently accountable without the pressure."},
];

const steps = [
  {icon:"🪴",title:"Create Your Space",desc:"Set up your personal study dashboard in minutes."},
  {icon:"📝",title:"Add Your Subjects",desc:"Organize what you need to study, chapter by chapter."},
  {icon:"⏱️",title:"Start Focusing",desc:"Hit start on your Pomodoro and enter deep work mode."},
  {icon:"🌟",title:"Track & Grow",desc:"Watch your streaks grow and celebrate every win."},
];

const testimonials = [
  {text:"My Kaksha genuinely changed how I study. The Pomodoro timer is so cute I actually want to study now!",name:"Aanya Sharma",role:"NEET Aspirant",avatar:"🌸"},
  {text:"Finally an app that doesn't stress me out! The soft design helps me focus without feeling overwhelmed.",name:"Rohan Mehra",role:"Engineering Student",avatar:"☕"},
  {text:"My study streak is at 47 days. I've never been this consistent in my life. Thank you My Kaksha!",name:"Priya Nair",role:"CA Foundation Student",avatar:"✨"},
];

const chartData = [{d:"Mon",h:55},{d:"Tue",h:70},{d:"Wed",h:45},{d:"Thu",h:80},{d:"Fri",h:65},{d:"Sat",h:90},{d:"Sun",h:40}];

export default function MyKaksha() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: css}} />

      {/* NAVBAR */}
      <nav className="nav" style={{fontFamily:"'Poppins',sans-serif"}}>
        <div className="nav-logo">My <span>Kaksha</span> ✦</div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#preview">Preview</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#stories">Stories</a></li>
        </ul>
        <button className="nav-cta">Get Started Free ✨</button>
      </nav>

      {/* HERO */}
      <section className="hero" style={{fontFamily:"'Poppins',sans-serif"}}>
        <div className="nb-lines" />
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        {[{top:"15%",left:"5%",d:0,s:"✦"},{top:"70%",left:"55%",d:1.5,s:"✧"},{top:"40%",right:"5%",d:.5,s:"⋆"},{top:"25%",left:"63%",d:2,s:"✦"},{bottom:"10%",right:"20%",d:1,s:"✧"},{top:"80%",left:"8%",d:3,s:"⋆"}].map((sp,i) => (
          <span key={i} className="sp" style={{top:sp.top,left:sp.left,right:sp.right,bottom:sp.bottom,animationDelay:`${sp.d}s`}}>{sp.s}</span>
        ))}
        <div style={{position:"relative",zIndex:2}}>
          <div className="badge"><span className="bdot" /> Now live · Your warm study companion</div>
          <h1 className="h1">Study, But Make<br />It <span className="uw">Consistent.</span></h1>
          <p className="hsub">My Kaksha is your warm, aesthetic digital study space — built to help students build habits, track focus, and actually show up for themselves every single day. 🌿</p>
          <div className="bgrp">
            <button className="bp">Start Studying Free ✨</button>
            <button className="bs">See How It Works →</button>
          </div>
        </div>
        <div className="hr" style={{position:"relative",zIndex:2}}>
          <div className="bc">
            <BearSVG />
            <div className="bsh" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="ss" style={{fontFamily:"'Poppins',sans-serif"}}>
        {[{n:"12,000+",l:"Active Students"},{n:"1.2M+",l:"Focus Sessions"},{n:"98%",l:"Feel Consistent"},{n:"4.9 ★",l:"Avg Rating"}].map((s,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:0}}>
            {i>0 && <div className="sdiv" style={{margin:"0 40px"}} />}
            <div className="si"><div className="sn">{s.n}</div><div className="sl">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="sec">
        <div className="sh shc">
          <FadeIn><span className="stag">✦ Features</span><h2 className="stitle">Everything you need to thrive</h2><p className="ssub">From timers to streaks, My Kaksha has all the gentle tools to build a consistent, joyful study life.</p></FadeIn>
        </div>
        <div className="fg">
          {features.map((f,i) => (
            <FadeIn key={i} delay={i*80}>
              <div className="fc" style={{height:"100%"}}>
                <div className="fcc1" /><div className="fcc2" />
                <span className="fi">{f.icon}</span>
                <div className="ft">{f.title}</div>
                <p className="fd">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="sec" style={{background:"linear-gradient(160deg,#F5EFE6,#FAF8F3)"}}>
        <div className="pvl">
          <FadeIn>
            <div>
              <span className="stag">✦ Dashboard</span>
              <h1 className="section-title">
     The cozy study command center
  <br />
  <span style={{ fontSize: "1.4rem", fontWeight: 600, color: "#5a4a3a", letterSpacing: "0.3px" }}>
    Your Study dashboard{" "}
    <span style={{ color: "#E8A090", fontStyle: "italic", fontWeight: 700 }}>but pretty ✦</span>
  </span>
</h1>
              <p className="ssub">A beautifully organized dashboard showing your Pomodoro timer, streak progress, and weekly focus chart — all in one calming place.</p>
              <div style={{marginTop:32,display:"flex",gap:12,flexWrap:"wrap"}}>
                {["🍅 Pomodoro Timer","🔥 Daily Streaks","📊 Focus Charts"].map((t,i) => (
                  <div key={i} style={{background:"#F5EFE6",borderRadius:16,padding:"12px 20px",fontSize:".82rem",color:"#8B6F5E",fontWeight:500}}>{t}</div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="dm">
              <div className="dtb">
                <div className="dot dr"/><div className="dot dy"/><div className="dot dg"/>
                <span className="dttl">My Kaksha — Dashboard</span>
              </div>
              <div className="dgrid">
                <div className="dcard"><div className="dlbl">🍅 Pomodoro</div><Pomo /></div>
                <div className="dcard">
                  <div className="dlbl">🔥 Streak</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:"1.6rem"}}>🔥</span>
                    <span style={{fontSize:"2rem",fontWeight:800,color:"#8B6F5E"}}>23</span>
                  </div>
                  <div style={{fontSize:".72rem",color:"#8B6F5E",marginTop:4}}>days in a row!</div>
                  <div style={{display:"flex",gap:4,marginTop:10}}>
                    {["M","T","W","T","F","S","S"].map((d,i) => (
                      <div key={i} style={{width:22,height:22,borderRadius:6,background:i<5?"linear-gradient(135deg,#C8B6A6,#8B6F5E)":"#EED6C4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".55rem",color:i<5?"#fff":"#C8B6A6",fontWeight:700}}>{d}</div>
                    ))}
                  </div>
                </div>
                <div className="dcard w">
                  <div className="dlbl">📊 Weekly Focus Hours</div>
                  <div className="cbars">
                    {chartData.map((b,i) => (
                      <div key={i} className="cbw"><div className="cb" style={{height:`${b.h}%`}} /><span className="cd">{b.d}</span></div>
                    ))}
                  </div>
                </div>
                <div className="dcard w">
                  <div className="dlbl">📚 Today's Progress</div>
                  {[{l:"Mathematics",p:75},{l:"Physics",p:45}].map((pr,i) => (
                    <div key={i} className="pr">
                      <div className="prl"><span>{pr.l}</span><span>{pr.p}%</span></div>
                      <div className="prt"><div className="prf" style={{width:`${pr.p}%`}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="sec">
        <div className="sh shc">
          <FadeIn><span className="stag">✦ How It Works</span><h2 className="stitle">Simple as brewing your morning chai ☕</h2></FadeIn>
        </div>
        <div className="stg">
          {steps.map((s,i) => (
            <FadeIn key={i} delay={i*100}>
              <div className="stc">
                <div className="stn">{i+1}</div>
                <span className="sticon">{s.icon}</span>
                <div className="sttitle">{s.title}</div>
                <p className="stdesc">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="stories" className="sec" style={{background:"#F5EFE6"}}>
        <div className="sh shc">
          <FadeIn><span className="stag">✦ Student Stories</span><h2 className="stitle">Loved by students across India</h2></FadeIn>
        </div>
        <div className="tgrid">
          {testimonials.map((t,i) => (
            <FadeIn key={i} delay={i*120}>
              <div className="tc">
                <div className="tstars">★★★★★</div>
                <p className="ttext">"{t.text}"</p>
                <div className="tauth">
                  <div className="tav">{t.avatar}</div>
                  <div><div className="tnm">{t.name}</div><div className="trl">{t.role}</div></div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="ctas">
        <div style={{position:"absolute",width:400,height:400,background:"radial-gradient(circle,#FFFDF9,#EED6C4)",top:-100,right:-100,borderRadius:"50%",filter:"blur(70px)",opacity:.6,pointerEvents:"none"}} />
        <FadeIn>
          <h2 className="ctat">Your best study era starts today 🌸</h2>
          <p className="ctas2">Join thousands of students building better habits with My Kaksha.</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="bp" style={{fontSize:"1rem",padding:"16px 40px"}}>Start for Free ✨</button>
            <button className="bs" style={{fontSize:"1rem",padding:"16px 40px"}}>See Features →</button>
          </div>
        </FadeIn>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="fgrid">
          <div>
            <div className="fbrand">My Kaksha ✦</div>
            <div className="ftag">"Build Discipline. Track Focus. Stay Consistent."</div>
            <div className="fsoc">
              {[{i:"𝕏",l:"Twitter"},{i:"in",l:"LinkedIn"},{i:"📸",l:"Instagram"},{i:"▶",l:"YouTube"}].map((s,i) => (
                <a key={i} href="#" className="sb" title={s.l}>{s.i}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="fct">Navigate</div>
            <ul className="flinks">
              {["Home","Features","Preview","Contact"].map((l,i) => <li key={i}><a href="#">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="fct">Support</div>
            <ul className="flinks">
              {["Contact Us","Help Center","Privacy Policy","Terms of Use"].map((l,i) => <li key={i}><a href="#">{l}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span className="fcp">© 2025 My Kaksha. Made with ☕ & love for students.</span>
          <span className="fcp">Study soft. Grow steady. 🌿</span>
        </div>
      </footer>
    </>
  );
}