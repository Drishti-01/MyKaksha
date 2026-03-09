import Landing from "./components/Landing";
import { useState, useEffect, useRef } from "react";
import Dashboard from "./Dashboard";

function App() {
  return (
    <div>
      <Landing />
    </div>
  );
}

export default App;
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
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard onBackToLanding={() => setShowDashboard(false)} />;
  }

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
        <button className="nav-cta" onClick={() => setShowDashboard(true)}>Get Started Free ✨</button>
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
            <button className="bp" onClick={() => setShowDashboard(true)}>Start Studying Free ✨</button>
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
            <button className="bp" style={{fontSize:"1rem",padding:"16px 40px"}} onClick={() => setShowDashboard(true)}>Start for Free ✨</button>
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
