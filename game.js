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
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.7});
  const skin=new THREE.MeshStandardMaterial({color:0x8b5a3c,roughness:.8});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.62,4,8),bodyMat);
  body.position.y=.86;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,10),skin);
  head.position.y=1.62;head.castShadow=true;g.add(head);
  const legMat=new THREE.MeshStandardMaterial({color:0x111827});
  for(const sx of [-.16,.16]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.58,.16),legMat);leg.position.set(sx,.35,0);leg.castShadow=true;g.add(leg);}
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
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' '){e.preventDefault();shoot();}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function bind(id,key){const b=document.getElementById(id);b.onpointerdown=e=>{e.preventDefault();keys[key]=true};b.onpointerup=()=>keys[key]=false;b.onpointercancel=()=>keys[key]=false;b.onpointerleave=()=>keys[key]=false;}
bind('up','w');bind('down','s');bind('left','a');bind('right','d');

let blueScore=0,redScore=0,matchTime=MATCH_SECONDS,running=true,owner=user,outCooldown=.8,messageTimer=0;

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
document.getElementById('pass').onclick=pass;document.getElementById('shoot').onclick=shoot;document.getElementById('tackle').onclick=tackle;

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
  let dx=(keys.d?1:0)-(keys.a?1:0),dz=(keys.s?1:0)-(keys.w?1:0),len=Math.hypot(dx,dz);
  if(len){const speed=9;user.position.x+=dx/len*speed*dt;user.position.z+=dz/len*speed*dt;user.rotation.y=Math.atan2(dx,dz);}
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

function endMatch(){running=false;owner=null;setStatus('FULL TIME');showMessage('FULL TIME  '+blueScore+' - '+redScore,999);}

let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-last)/1000,.033);last=now;
  if(running){
    matchTime=Math.max(0,matchTime-dt);if(matchTime<=0)endMatch();
    if(outCooldown>0)outCooldown-=dt;
    if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)document.getElementById('message').textContent='';}
    moveControlled(dt);updateBlueAI(dt);updateRedAI(dt);updatePossession();checkCollisions();updateBall(dt);updateHud();
  }
  const camTarget=new THREE.Vector3(user.position.x,11,user.position.z+15);
  camera.position.lerp(camTarget,.07);camera.lookAt(user.position.x,0,user.position.z-8);
  renderer.render(scene,camera);
}
resetKickoff();updateHud();requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
