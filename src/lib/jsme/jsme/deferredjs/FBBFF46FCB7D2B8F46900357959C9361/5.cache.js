$wnd.jsme.runAsyncCallback5('var n0="400px",o0="Accept",p0="Cancel",q0="Paste",r0="Paste the text to import into the text area below.",s0="dragend",t0="dragenter",u0="dragover",v0="drop",w0="gwt-HTML",x0="gwt-TextArea",y0="textarea";q(204,192,{});function z0(){z0=r;A0=new Qx(s0,new B0)}function C0(a){a.a.cancelBubble=!0;uw(a.a)}function B0(){}q(205,204,{},B0);_.Qc=function(){C0(this)};_.Tc=function(){return A0};var A0;function D0(){D0=r;E0=new Qx(t0,new F0)}function F0(){}q(206,204,{},F0);_.Qc=function(){C0(this)};_.Tc=function(){return E0};\nvar E0;function G0(){G0=r;H0=new Qx(u0,new I0)}function I0(){}q(207,204,{},I0);_.Qc=function(){C0(this)};_.Tc=function(){return H0};var H0;function J0(){J0=r;K0=new Qx(v0,new L0)}function L0(){}q(208,204,{},L0);\n_.Qc=function(a){var b,c,d,e;this.a.cancelBubble=!0;uw(this.a);d=(this.a.dataTransfer||null).files;e=0;a:for(;e<d.length;++e){if(0<a.a.d&&e>=a.a.d)break a;b=d[e];c=new FileReader;M0(c,a.a.b);1==a.a.c&&c.readAsText(b)}0==d.length&&(b=(this.a.dataTransfer||null).getData(Dp),a.a.b.a.a.e.ob[fq]=null!=b?b:l)};_.Tc=function(){return K0};var K0;function N0(a,b,c){pz(!a.lb?a.lb=new Ez(a):a.lb,c,b)}\nfunction O0(a){var b=G(Yj);yS(np,xS(b));this.ob=b;this.b=new fU(this.ob);this.ob[sj]=w0;eU(this.b,a,!0);nU(this)}q(328,329,{13:1,15:1,17:1,18:1,20:1,21:1,22:1,23:1,24:1,25:1,26:1,27:1,28:1,30:1,31:1,32:1,36:1,37:1,38:1,39:1,40:1,41:1,42:1,43:1,44:1,45:1,47:1,49:1,53:1,58:1,68:1,69:1,70:1,73:1,77:1,80:1,81:1,83:1},O0);function P0(){wE();var a=G(y0);!OA&&(OA=new NA);!MA&&(MA=new LA);this.ob=a;this.ob[sj]=x0}q(368,369,Ar,P0);\nfunction Q0(a,b){var c,d;c=G(Rp);d=G(Cp);d[Ci]=a.a.a;d.style[gq]=a.b.a;var e=(QA(),RA(d));c.appendChild(e);PA(a.d,c);nC(a,b,d)}function R0(){hD.call(this);this.a=(kD(),rD);this.b=(sD(),vD);this.e[lj]=$b;this.e[kj]=$b}q(377,322,wr,R0);_.Id=function(a){var b;b=tw(a.ob);(a=rC(this,a))&&this.d.removeChild(tw(b));return a};\nfunction S0(a){try{a.v=!1;var b,c,d;d=a.gb;c=a._;d||(a.ob.style[hq]=al,HD(a.ob,!1),a._=!1,a.Vd());b=a.ob;b.style[Jl]=0+(kx(),ao);b.style[Lp]=ac;ZV(a,os(Jw($doc)+(Iw()-pw(a.ob,$m)>>1),0),os(Kw($doc)+(Hw()-pw(a.ob,Zm)>>1),0));d||((a._=c)?(a.ob.style[yj]=yo,a.ob.style[hq]=iq,HD(a.ob,!0),Qr(a.fb,200)):(a.ob.style[hq]=iq,HD(a.ob,!0)))}finally{a.v=!0}}function T0(a){a.f=(new kV(a.i)).mc.Ke();YB(a.f,new U0(a),(Wx(),Wx(),Xx));a.d=E(V0,m,60,[a.f])}\nfunction W0(){tW();var a,b,c,d,e,f;QW.call(this,(hX(),iX),null,!0);this.Cg();this.cb=!0;a=new O0(this.j);this.e=new P0;this.e.ob.style[oq]=dc;MB(this.e,dc);this.Ag();kW(this,n0);f=new R0;f.ob.style[$k]=dc;f.e[lj]=10;c=(kD(),lD);f.a=c;Q0(f,a);Q0(f,this.e);e=new zD;e.e[lj]=20;for(b=this.d,c=0,d=b.length;c<d;++c)a=b[c],wD(e,a);Q0(f,e);yW(this,f);tV(this,!1);this.Bg()}q(619,620,qP,W0);_.Ag=function(){T0(this)};_.Bg=function(){var a=this.e;a.ob.readOnly=!0;var b=PB(a.ob)+"-readonly";LB(a.vd(),b,!0)};\n_.Cg=function(){sV(this.H.b,"Copy")};_.d=null;_.e=null;_.f=null;_.i="Close";_.j="Press Ctrl-C (Command-C on Mac) or right click (Option-click on Mac) on the selected text to copy it, then paste into another program.";function U0(a){this.a=a}q(622,1,{},U0);_.Vc=function(){AW(this.a,!1)};_.a=null;function X0(a){this.a=a}q(623,1,{},X0);\n_.Cc=function(){UB(this.a.e.ob,!0);JD(this.a.e.ob);var a=this.a.e,b;b=qw(a.ob,fq).length;if(0<b&&a.jb){if(0>b)throw new bM("Length must be a positive integer. Length: "+b);if(b>qw(a.ob,fq).length)throw new bM("From Index: 0  To Index: "+b+"  Text Length: "+qw(a.ob,fq).length);var a=a.ob,c=0;try{var d=a.createTextRange(),e=a.value.substr(c,b).match(/(\\r\\n)/gi);null!=e&&(b-=e.length);var f=a.value.substring(0,c).match(/(\\r\\n)/gi);null!=f&&(c-=f.length);d.collapse(!0);d.moveStart("character",c);d.moveEnd("character",\nb);d.select()}catch(g){}}};_.a=null;function Y0(a){a.i=p0;a.j=r0;a.b=o0;sV(a.H.b,q0)}function Z0(a){tW();W0.call(this);this.c=a}q(625,619,qP,Z0);_.Ag=function(){T0(this);this.a=(new kV(this.b)).mc.Ke();YB(this.a,new $0(this),(Wx(),Wx(),Xx));this.d=E(V0,m,60,[this.a,this.f])};_.Bg=function(){MB(this.e,"150px")};_.Cg=function(){Y0(this)};_.Vd=function(){PW(this);ew((bw(),cw),new a1(this))};_.a=null;_.b=null;_.c=null;function b1(a){tW();Z0.call(this,a)}q(624,625,qP,b1);\n_.Bg=function(){MB(this.e,"150px");var a=new c1(this),b=this.e;N0(b,new d1,(D0(),D0(),E0));N0(b,new e1,(z0(),z0(),A0));N0(b,new f1,(G0(),G0(),H0));N0(b,new g1(a),(J0(),J0(),K0))};_.Cg=function(){Y0(this);this.j+=" Or drag and drop a file on it."};q(628,1,{});q(627,628,{});_.b=null;_.c=1;_.d=-1;function c1(a){this.a=a;this.b=new h1(this);this.c=this.d=1}q(626,627,{},c1);_.a=null;function h1(a){this.a=a}q(629,1,{},h1);_.Dg=function(a){this.a.a.e.ob[fq]=null!=a?a:l};_.a=null;\nfunction $0(a){this.a=a}q(633,1,{},$0);_.Vc=function(){if(this.a.c){var a=this.a.c,b;b=new tH(a.a,0,qw(this.a.e.ob,fq));SM(a.a.a,b.a)}AW(this.a,!1)};_.a=null;function a1(a){this.a=a}q(634,1,{},a1);_.Cc=function(){UB(this.a.e.ob,!0);JD(this.a.e.ob)};_.a=null;q(635,1,Wq);_.Mc=LH;_.Nc=function(){var a,b;a=new i1(this.a);void 0!=$wnd.FileReader?b=new b1(a):b=new Z0(a);mW(b);S0(b)};_.a=null;function i1(a){this.a=a}q(636,1,{},i1);_.a=null;q(637,1,Wq);_.Mc=LH;\n_.Nc=function(){var a;a=new W0;var b=this.a,c;vE(a.e,b);b=(c=gM(b,"\\r\\n|\\r|\\n|\\n\\r"),c.length);MB(a.e,20*(10>b?b:10)+ao);ew((bw(),cw),new X0(a));mW(a);S0(a)};_.a=null;function M0(a,b){a.onloadend=function(a){b.Dg(a.target.result)}}function g1(a){this.a=a}q(642,1,{},g1);_.a=null;function d1(){}q(643,1,{},d1);function e1(){}q(644,1,{},e1);function f1(){}q(645,1,{},f1);Y(628);Y(627);Y(642);Y(643);Y(644);Y(645);Y(204);Y(206);Y(205);Y(207);Y(208);Y(619);var V0=PL(783,tZ);Y(625);Y(624);Y(635);Y(636);Y(637);\nY(622);Y(623);Y(633);Y(634);Y(626);Y(629);Y(328);Y(377);Y(368);x(jP)(5);function LH(){};\n//@ sourceURL=5.js\n')
