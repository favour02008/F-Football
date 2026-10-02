import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const FIELD_W=42, FIELD_L=68, HALF_W=21, HALF_L=34, GOAL_W=8;
const MATCH_SECONDS=180;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x78add6);
scene.fog=new THREE.Fog(0x78add6,65,150);

const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,220);
camera.position.set(0,12,27);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x284a2b,2.1));
const sun=new THREE.DirectionalLight(0xffffff,2.2);
sun.position.set(15,28,12);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
scene.add(sun);

// Stadium atmosphere
const standMat=new THREE.MeshStandardMaterial({color:0x263746});
for(let side of [-1,1]){
  const stand=new THREE.Mesh(new THREE.BoxGeometry(10,5,FIELD_L+8),standMat);
  stand.position.set(side*26,2.5,0);
  stand.castShadow=true; scene.add(stand);
}
for(let end of [-1,1]){
  const stand=new THREE.Mesh(new THREE.BoxGeometry(FIELD_W+18,5,7),standMat);
  stand.position.set(0,2.5,end*38);
  stand.castShadow=true; scene.add(stand);
}
// Original low-poly crowd: lightweight enough for phones.
const crowdColors=[0x223344,0x4a2b3b,0x315a42,0x7b5a2b,0x6b3d25,0x394b72];
function makeFan(x,y,z,scale=1){
  const fan=new THREE.Group();
  const shirt=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.2,3,6),new THREE.MeshStandardMaterial({color:crowdColors[Math.floor(Math.random()*crowdColors.length)]}));
  shirt.position.y=.32; fan.add(shirt);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshStandardMaterial({color:0x8b5a3c}));
  head.position.y=.57; fan.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.115,8,5),new THREE.MeshStandardMaterial({color:0x17120f}));
  hair.scale.y=.5; hair.position.y=.66; fan.add(hair);
  fan.position.set(x,y,z);fan.scale.setScalar(scale);fan.rotation.y=Math.random()*Math.PI*2;scene.add(fan);
}
for(let side of [-1,1]){
  for(let row=0;row<4;row++) for(let col=0;col<16;col++) makeFan(side*(22.5+row*.7),1.0+row*1.05,-29+col*3.8,.8);
}
for(let end of [-1,1]){
  for(let row=0;row<3;row++) for(let col=0;col<15;col++) makeFan(-27+col*3.85,1.0+row*1.05,end*(36.5+row*.7),.78);
}
const field=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W,FIELD_L),new THREE.MeshStandardMaterial({color:0x25823b}));
field.rotation.x=-Math.PI/2; field.receiveShadow=true; scene.add(field);

const white=new THREE.MeshBasicMaterial({color:0xffffff});
function line(x,z,w,d){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),white);m.rotation.x=-Math.PI/2;m.position.set(x,.021,z);scene.add(m);}
line(0,-HALF_L,FIELD_W,.15); line(0,HALF_L,FIELD_W,.15);
line(-HALF_W,0,.15,FIELD_L); line(HALF_W,0,.15,FIELD_L); line(0,0,FIELD_W,.12);
const circle=new THREE.Mesh(new THREE.RingGeometry(6,6.12,64),white);circle.rotation.x=-Math.PI/2;circle.position.y=.022;scene.add(circle);
function boxLine(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.08,d),white);m.position.set(x,.04,z);scene.add(m);}
boxLine(0,-28,16,.12);boxLine(0,28,16,.12);

function makeGoal(z){
  const group=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0xffffff});
  const a=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),mat),b=a.clone(),bar=new THREE.Mesh(new THREE.BoxGeometry(GOAL_W,.18,.18),mat);
  a.position.set(-GOAL_W/2,1.25,0);b.position.set(GOAL_W/2,1.25,0);bar.position.set(0,2.5,0);
  group.add(a,b,bar);group.position.z=z;scene.add(group);
}
makeGoal(-HALF_L);makeGoal(HALF_L);

function player(color,x,z,role='midfielder',isUser=false){
  const g=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.68});
  const skin=new THREE.MeshStandardMaterial({color:0x8b5a3c,roughness:.8});
  const dark=new THREE.MeshStandardMaterial({color:0x17120f,roughness:.9});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.62,5,8),bodyMat);
  body.position.y=.86;body.castShadow=true;g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.14,8),skin);neck.position.y=1.32;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,14,10),skin);head.position.y=1.62;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.30,14,8),dark);hair.scale.set(1,.58,1);hair.position.y=1.79;g.add(hair);
  const eyeMat=new THREE.MeshBasicMaterial({color:0x111111});
  for(const sx of [-.09,.09]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),eyeMat);eye.position.set(sx,1.65,.275);g.add(eye);}
  const legMat=new THREE.MeshStandardMaterial({color:0x111827});
  for(const sx of [-.16,.16]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.58,.16),legMat);leg.position.set(sx,.35,0);leg.castShadow=true;g.add(leg);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.19,.09,.34),dark);shoe.position.set(sx,.055,.09);shoe.castShadow=true;g.add(shoe);
  }
  const marker=new THREE.Mesh(new THREE.RingGeometry(.43,.5,20),new THREE.MeshBasicMaterial({color:0xffff66,side:THREE.DoubleSide}));
  marker.rotation.x=-Math.PI/2;marker.position.y=.025;marker.visible=isUser;g.add(marker);
  g.position.set(x,0,z);
  g.userData={team:color===0x1769aa?'blue':'red',role,isUser,speed:role==='defender'?5.1:5.5,accel:14,home:new THREE.Vector3(x,0,z)};
  scene.add(g);return g;
}

const blueFormation=[
  ['defender',-15,10],['defender',-5,13],['defender',5,13],['defender',15,10],
  ['midfielder',-14,1],['midfielder',-5,3],['midfielder',5,3],['midfielder',14,1],
  ['forward',-8,-9],['forward',8,-9]
];
const redFormation=[
  ['defender',-15,-10],['defender',-5,-13],['defender',5,-13],['defender',15,-10],
  ['midfielder',-14,-1],['midfielder',-5,-3],['midfielder',5,-3],['midfielder',14,-1],
  ['forward',-8,9],['forward',8,9]
];

const user=player(0x1769aa,0,19,'forward',true);
const mates=blueFormation.map(([r,x,z])=>player(0x1769aa,x,z,r));
const opponents=redFormation.map(([r,x,z])=>player(0xd62d3b,x,z,r));
const homeKeeper=player(0x1b3d9a,0,31,'keeper');
const awayKeeper=player(0xf08c24,0,-31,'keeper');

const ball=new THREE.Mesh(new THREE.SphereGeometry(.3,20,14),new THREE.MeshStandardMaterial({color:0xf5f5f5,roughness:.45}));
ball.position.set(0,.3,19);ball.castShadow=true;scene.add(ball);
ball.userData={vel:new THREE.Vector3(),spin:0};

const keys={};
const joystick={x:0,y:0,active:false};
const raycaster=new THREE.Raycaster();
const touchPoint=new THREE.Vector2();
const aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const aimTarget=new THREE.Vector3();
let aiming=false,aimPointerId=null,aimDistance=0,aimLine;
function makeAimGuide(){
  const mat=new THREE.LineBasicMaterial({color:0xffff66,transparent:true,opacity:.9});
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  aimLine=new THREE.Line(geo,mat);aimLine.visible=false;scene.add(aimLine);
}
makeAimGuide();
function screenToField(e){
  touchPoint.x=e.clientX/innerWidth*2-1;touchPoint.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(touchPoint,camera);return raycaster.ray.intersectPlane(aimPlane,aimTarget);
}
function beginAim(e){
  if(!running||owner!==user||aiming)return;
  touchPoint.x=e.clientX/innerWidth*2-1;touchPoint.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(touchPoint,camera);
  if(!raycaster.intersectObject(user,true).length)return;
  e.preventDefault();aiming=true;aimPointerId=e.pointerId;aimTarget.copy(user.position);if(renderer.domElement.setPointerCapture)renderer.domElement.setPointerCapture(e.pointerId);
  aimDistance=0;aimLine.visible=true;setStatus('AIM — DRAG TO TARGET');
}
function updateAim(e){
  if(!aiming||e.pointerId!==aimPointerId)return;
  e.preventDefault();if(!screenToField(e))return;
  aimDistance=THREE.MathUtils.clamp(user.position.distanceTo(aimTarget),0,16);
  aimLine.geometry.setFromPoints([new THREE.Vector3(user.position.x,.38,user.position.z),new THREE.Vector3(aimTarget.x,.38,aimTarget.z)]);
  setStatus(aimDistance<1?'DRAG FARTHER':'POWER '+Math.round(THREE.MathUtils.clamp(aimDistance*1.45,7,22))+' — RELEASE');
}
function finishAim(e){
  if(!aiming||e.pointerId!==aimPointerId)return;
  e.preventDefault();if(screenToField(e)){
    const dx=aimTarget.x-user.position.x,dz=aimTarget.z-user.position.z,d=Math.hypot(dx,dz);
    if(d>.65){const power=THREE.MathUtils.clamp(d*1.45,7,22);releaseBall(new THREE.Vector3(dx,0,dz),power,Math.min(.2,power*.008));setStatus(power>17?'SHOT!':'PASS');}
  }
  if(renderer.domElement.releasePointerCapture&&renderer.domElement.hasPointerCapture?.(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);aiming=false;aimPointerId=null;aimLine.visible=false;aimDistance=0;
}
renderer.domElement.addEventListener('pointerdown',beginAim,{passive:false});
renderer.domElement.addEventListener('pointermove',updateAim,{passive:false});
renderer.domElement.addEventListener('pointerup',finishAim,{passive:false});
renderer.domElement.addEventListener('pointercancel',e=>{if(e.pointerId===aimPointerId){if(renderer.domElement.releasePointerCapture&&renderer.domElement.hasPointerCapture?.(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);aiming=false;aimPointerId=null;aimLine.visible=false;aimDistance=0;setStatus('AIM CANCELLED');}});

let blueScore=0,redScore=0,matchTime=MATCH_SECONDS,running=false,owner=user,outCooldown=.8,messageTimer=0;

const careerKey='f-football-career-v1';
const clubs=['Bolga United','Accra City','Kumasi Stars','Tamale FC','Cape Coast FC','Ho Rangers'];
const careerDefault={club:'Bolga United',season:1,week:1,money:250000,points:0,wins:0,draws:0,losses:0,goals:0,training:0,rating:68,energy:100,transfers:[],fixtures:[],tab:'dashboard'};
let career=loadCareer();
function loadCareer(){try{return {...careerDefault,...JSON.parse(localStorage.getItem(careerKey)||'null')}}catch(e){return {...careerDefault}}}
function saveCareer(){localStorage.setItem(careerKey,JSON.stringify(career));showMessage('CAREER SAVED',1);renderCareer();}
function newCareer(){if(confirm('Start a new career?')){career={...careerDefault};saveCareer();}}
function nextOpponent(){return clubs[(clubs.indexOf(career.club)+career.week)%clubs.length]||'Accra City';}
function ensureFixtures(){
  if(career.fixtures.length)return;
  for(let i=1;i<=10;i++)career.fixtures.push({week:i,home:i%2===0?career.club:clubs[(clubs.indexOf(career.club)+i)%clubs.length],away:i%2===0?clubs[(clubs.indexOf(career.club)+i)%clubs.length]:career.club,played:false,result:''});
}
function bar(label,val){return '<div class="stat"><span>'+label+'</span><b>'+Math.round(val)+'</b></div><div class="bar"><i style="width:'+Math.min(100,val)+'%"></i></div>';}
function renderCareer(){
  ensureFixtures();
  const c=document.getElementById('careerContent'); if(!c)return;
  let h='';
  if(career.tab==='dashboard')h='<div class="careerGrid"><div class="careerBox"><h3>'+career.club+'</h3><div class="small">Season '+career.season+' • Week '+career.week+'</div>'+bar('Squad rating',career.rating)+bar('Energy',career.energy)+'<p>Budget: GH₵ '+career.money.toLocaleString()+'</p></div><div class="careerBox"><h3>Season Record</h3><p>Wins: '+career.wins+' &nbsp; Draws: '+career.draws+' &nbsp; Losses: '+career.losses+'</p><p>Points: <b>'+career.points+'</b> • Goals: '+career.goals+'</p></div><div class="careerBox"><h3>Next Fixture</h3><p><b>'+career.club+' vs '+nextOpponent()+'</b></p><p class="small">Week '+career.week+' • 3-minute match</p></div><div class="careerBox"><h3>Career</h3><p>Train your squad, manage energy, sign players and climb the table.</p></div></div>';
  if(career.tab==='training')h='<div class="careerGrid"><div class="careerBox"><h3>Training Ground</h3><p>Each session improves squad rating but uses energy.</p><button class="careerBtn" id="trainBtn">TRAIN SQUAD</button><p>Training sessions: '+career.training+'</p></div><div class="careerBox"><h3>Squad Development</h3>'+bar('Rating',career.rating)+bar('Energy',career.energy)+'<p class="small">Rest is automatic after matches.</p></div></div>';
  if(career.tab==='transfers'){const market=[['Kwame Mensah','Forward',74,85000],['Yaw Boateng','Midfielder',72,70000],['Kojo Asare','Defender',70,60000],['Abdul Karim','Keeper',73,78000]];h='<div class="careerBox"><h3>Transfer Market</h3><p class="small">Budget: GH₵ '+career.money.toLocaleString()+'</p>'+market.map((p,i)=>'<div class="playerRow"><span>'+p[0]+' • '+p[1]+' • OVR '+p[2]+'</span><button class="careerBtn" data-buy="'+i+'">GH₵ '+p[3].toLocaleString()+'</button></div>').join('')+'</div>';career._market=market;}
  if(career.tab==='fixtures')h='<div class="careerBox"><h3>Fixtures</h3>'+career.fixtures.map(f=>'<div class="fixture"><span>W'+f.week+' • '+f.home+' vs '+f.away+'</span><b>'+ (f.played?f.result:'UPCOMING')+'</b></div>').join('')+'</div>';
  if(career.tab==='table'){const rows=clubs.map((x,i)=>({club:x,pts:x===career.club?career.points:Math.max(0,12-i*2)})).sort((a,b)=>b.pts-a.pts);h='<div class="careerBox"><h3>League Table</h3>'+rows.map((x,i)=>'<div class="fixture"><span>'+ (i+1)+'. '+x.club+'</span><b>'+x.pts+' pts</b></div>').join('')+'</div>';}
  c.innerHTML=h;
  document.querySelectorAll('#careerTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===career.tab));
  document.getElementById('trainBtn')?.addEventListener('click',()=>{if(career.energy<15){showMessage('NOT ENOUGH ENERGY',1);return;}career.energy-=15;career.rating=Math.min(95,career.rating+1);career.training++;saveCareer();});
  document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{const p=career._market[Number(b.dataset.buy)];if(career.money<p[3]){showMessage('NOT ENOUGH MONEY',1);return;}career.money-=p[3];career.rating=Math.min(95,career.rating+1);career.transfers.push(p[0]);saveCareer();showMessage(p[0]+' SIGNED',1);}));
}
document.querySelectorAll('#careerTabs button').forEach(b=>b.onclick=()=>{career.tab=b.dataset.tab;renderCareer();});
document.getElementById('careerSave').onclick=saveCareer;
document.getElementById('careerReset').onclick=newCareer;
document.getElementById('careerMatch').onclick=()=>{
  ensureFixtures(); document.getElementById('careerMenu').style.display='none'; running=true; matchTime=MATCH_SECONDS; blueScore=0; redScore=0; resetKickoff(); showMessage('MATCHDAY',1);
};
function finishCareerMatch(){
  const f=career.fixtures.find(x=>x.week===career.week&&!x.played);
  if(f){f.played=true;f.result=blueScore>redScore?'W':blueScore<redScore?'L':'D';}
  if(blueScore>redScore){career.wins++;career.points+=3;career.goals+=blueScore;}
  else if(blueScore<redScore){career.losses++;career.goals+=blueScore;}
  else{career.draws++;career.points++;career.goals+=blueScore;}
  career.energy=Math.min(100,career.energy+20);career.week++;career.money+=blueScore*5000;career.tab='dashboard';saveCareer();
  document.getElementById('careerMenu').style.display='flex';running=false;renderCareer();
}
ensureFixtures();renderCareer();

function setStatus(t){document.getElementById('status').textContent=t;}
function updateHud(){document.getElementById('score').textContent=blueScore+' - '+redScore;const t=Math.max(0,Math.ceil(matchTime));document.getElementById('timer').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function showMessage(t,s=1){document.getElementById('message').textContent=t;messageTimer=s;}
function dist(a,b){return Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);}
function nearest(list,target){let best=null,bd=Infinity;for(const p of list){const d=Math.hypot(p.position.x-target.x,p.position.z-target.z);if(d<bd){bd=d;best=p;}}return best;}
function hasBall(p){return owner===p;}
function giveBall(p){owner=p;ball.userData.vel.set(0,0,0);setStatus(p.userData.team==='blue'?'BLUE POSSESSION':'RED POSSESSION');}

function releaseBall(direction,power,lift=.12){
  owner=null;const d=direction.clone().normalize();
  ball.position.y=.34;ball.userData.vel.set(d.x*power,lift*power,d.z*power);ball.userData.spin=power*.45;
}
function pass(){
  if(!running)return;
  if(!hasBall(user)){if(!owner&&dist(user,ball)<2.1)giveBall(user);else{setStatus('GET THE BALL');return;}}
  const target=nearest(mates,user);if(!target)return;
  releaseBall(new THREE.Vector3(target.position.x-user.position.x,0,target.position.z-user.position.z),12,.04);setStatus('PASS');
}
function shoot(){
  if(!running)return;
  if(!hasBall(user)){if(!owner&&dist(user,ball)<2.1)giveBall(user);else{setStatus('GET THE BALL');return;}}
  const target=new THREE.Vector3(0,1.0,-HALF_L-1);
  releaseBall(new THREE.Vector3(target.x-user.position.x,0,target.z-user.position.z),20,.18);setStatus('SHOT!');
}
function tackle(){
  if(!running)return;
  if(owner&&owner.userData.team==='red'&&dist(user,owner)<2.3){giveBall(user);showMessage('TACKLE!',.6);}
  else if(!owner&&dist(user,ball)<2.0)giveBall(user);else setStatus('TOO FAR');
}
// Touch controls are handled by the Score! Hero-style tap-and-drag system above.

function resetKickoff(){
  user.position.set(0,0,19);
  mates.forEach((p,i)=>{const q=blueFormation[i];p.position.set(q[1],0,q[2]);p.userData.home.set(q[1],0,q[2]);});
  opponents.forEach((p,i)=>{const q=redFormation[i];p.position.set(q[1],0,q[2]);p.userData.home.set(q[1],0,q[2]);});
  homeKeeper.position.set(0,0,31);awayKeeper.position.set(0,0,-31);
  ball.position.set(0,.3,19);giveBall(user);outCooldown=1.0;
}
function goal(team){
  if(team==='blue'){blueScore++;showMessage('GOAL! BLUE',1.6);}else{redScore++;showMessage('GOAL! RED',1.6);}
  updateHud();owner=null;ball.userData.vel.set(0,0,0);outCooldown=1.8;
  setTimeout(()=>{if(running)resetKickoff()},1800);
}
function resetOut(){const p=nearest([user,...mates,...opponents],ball);if(p)giveBall(p);else resetKickoff();showMessage('THROW-IN',.7);}

function moveToward(p,target,dt,speed=p.userData.speed){
  const dx=target.x-p.position.x,dz=target.z-p.position.z,mag=Math.hypot(dx,dz);
  if(mag<.05)return;
  const desired=new THREE.Vector3(dx/mag,0,dz/mag).multiplyScalar(speed);
  const v=p.userData.velocity||new THREE.Vector3();
  v.lerp(desired,Math.min(1,p.userData.accel*dt/speed));p.userData.velocity=v;
  p.position.addScaledVector(v,dt);
  p.rotation.y=Math.atan2(v.x,v.z);
}
function clampPlayer(p){p.position.x=THREE.MathUtils.clamp(p.position.x,-19.2,19.2);p.position.z=THREE.MathUtils.clamp(p.position.z,-32,32);}

function moveControlled(dt){
  if(aiming)return;
  if(owner!==user){const target=owner&&owner.userData.team==='blue'?owner.position:ball.position;moveToward(user,new THREE.Vector3(target.x,0,target.z),dt,7.2);}
  clampPlayer(user);
}

function formationTarget(p){
  const h=p.userData.home;
  const attack=ball.position.z>0?-1:1;
  const shiftZ=THREE.MathUtils.clamp(ball.position.z*.18,-8,8);
  let x=h.x+THREE.MathUtils.clamp(ball.position.x*.16,-4,4),z=h.z+shiftZ;
  if(p.userData.role==='forward'&&owner?.userData.team==='blue')z-=3;
  if(p.userData.role==='defender'&&owner?.userData.team==='red')z+=3;
  return new THREE.Vector3(x,0,z);
}

function updateBlueAI(dt){
  const all=[user,...mates];
  const chase=owner?.userData.team==='red'?nearest(mates,owner):nearest(mates,ball);
  for(const p of mates){
    let target=formationTarget(p);
    if(p===chase && (!owner||owner.userData.team==='red'))target=owner?owner.position:ball.position;
    else if(owner===p)target=p.position;
    moveToward(p,target,dt);
    clampPlayer(p);
  }
  const targetX=THREE.MathUtils.clamp(ball.position.x,-4,4);
  moveToward(homeKeeper,new THREE.Vector3(targetX,0,31),dt,4.8);
  clampPlayer(homeKeeper);
  if(!owner){
    const c=nearest(all,ball);if(c&&dist(c,ball)<.9)giveBall(c);
  }
}

function updateRedAI(dt){
  const target=owner?.userData.team==='blue'?owner:ball;
  const chaser=nearest(opponents,target);
  for(const p of opponents){
    let t=formationTarget(p);
    if(p===chaser)t=target.position;
    else if(owner?.userData.team==='blue'&&p.userData.role==='defender'){
      const mark=nearest([user,...mates],p);if(mark&&dist(p,mark)<12)t=mark.position;
    }
    moveToward(p,t,dt);
    clampPlayer(p);
  }
  const keeperTarget=new THREE.Vector3(THREE.MathUtils.clamp(ball.position.x,-GOAL_W/2,GOAL_W/2),0,-31);
  moveToward(awayKeeper,keeperTarget,dt,4.8);clampPlayer(awayKeeper);

  if(!owner){
    const c=nearest(opponents,ball);if(c&&dist(c,ball)<.9)giveBall(c);
  }
  if(owner?.userData.team==='red'){
    const red=owner;
    const target=new THREE.Vector3(-user.position.x*.35,0,34);
    moveToward(red,target,dt,red.userData.speed);
    if(red.position.z>23&&Math.random()<dt*.7){
      releaseBall(new THREE.Vector3(-red.position.x*.08,0,34-red.position.z),15,.08);setStatus('RED SHOT!');
    }
  }
}

function keeperSave(keeper,team){
  if(owner||ball.userData.vel.length()<5)return false;
  if(dist(keeper,ball)<1.7){
    const clear=team==='red'?1:-1;
    releaseBall(new THREE.Vector3(ball.position.x-keeper.position.x,0,clear),10,.05);
    showMessage('SAVE!',.7);setStatus(team==='red'?'RED KEEPER SAVE':'BLUE KEEPER SAVE');return true;
  }
  return false;
}

function checkCollisions(){
  keeperSave(awayKeeper,'red');keeperSave(homeKeeper,'blue');
  if(owner&&owner.userData.team==='red'&&dist(user,owner)<1.25&&Math.random()<.08)giveBall(user);
  if(!owner&&dist(user,ball)<1.0)giveBall(user);
}

function updatePossession(){
  if(!owner){ball.position.y=Math.max(.3,ball.position.y);return;}
  const forward=owner.userData.team==='blue'?1:-1;
  const offset=new THREE.Vector3(0,0,forward*.72);
  ball.position.set(owner.position.x+offset.x,.34,owner.position.z+offset.z);
}

function updateBall(dt){
  if(owner)return;
  ball.position.addScaledVector(ball.userData.vel,dt);
  ball.userData.vel.y-=12*dt;
  if(ball.position.y<.3){ball.position.y=.3;if(ball.userData.vel.y<0)ball.userData.vel.y*=-.38;ball.userData.vel.x*=.992;ball.userData.vel.z*=.992;}
  ball.userData.vel.x*=Math.pow(.32,dt);ball.userData.vel.z*=Math.pow(.32,dt);
  ball.rotation.x+=ball.userData.spin*dt;ball.rotation.z+=ball.userData.spin*.7*dt;
  if(ball.position.z<-HALF_L&&Math.abs(ball.position.x)<=GOAL_W/2){goal('blue');return;}
  if(ball.position.z>HALF_L&&Math.abs(ball.position.x)<=GOAL_W/2){goal('red');return;}
  if(Math.abs(ball.position.x)>HALF_W||Math.abs(ball.position.z)>HALF_L){if(outCooldown<=0)resetOut();}
}

function endMatch(){running=false;owner=null;setStatus('FULL TIME');showMessage('FULL TIME  '+blueScore+' - '+redScore,2.5);setTimeout(()=>finishCareerMatch(),2600);}

let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-last)/1000,.033);last=now;
  if(running){
    if(!aiming)matchTime=Math.max(0,matchTime-dt);if(!aiming&&matchTime<=0)endMatch();
    if(outCooldown>0)outCooldown-=dt;
    if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)document.getElementById('message').textContent='';}
    if(!aiming){moveControlled(dt);updateBlueAI(dt);updateRedAI(dt);updatePossession();checkCollisions();updateBall(dt);updateHud();}
    const animPlayers=[user,...mates,...opponents,homeKeeper,awayKeeper];
    for(const p of animPlayers){const moving=(p.userData.velocity?.length?.()||0)>0.15 || (p===user&&!aiming&&owner!==user);p.userData.anim=(p.userData.anim||0)+(moving?dt*10:dt*3);p.children.forEach((c,j)=>{if(c.geometry?.type==='BoxGeometry'&&j>=4)c.rotation.x=moving?Math.sin(p.userData.anim)*.18:0;});}
  }
  const camTarget=new THREE.Vector3(user.position.x,11,user.position.z+15);
  camera.position.lerp(camTarget,.07);camera.lookAt(user.position.x,0,user.position.z-8);
  renderer.render(scene,camera);
}
resetKickoff();updateHud();requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
