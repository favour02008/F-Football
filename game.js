import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const FIELD_W=42, FIELD_L=68, HALF_W=21, HALF_L=34, GOAL_W=8;
const MATCH_SECONDS=180;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x75aadb);

const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,220);
camera.position.set(0,13,28);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x355c35,2));
const sun=new THREE.DirectionalLight(0xffffff,2);
sun.position.set(10,25,10);
sun.castShadow=true;
scene.add(sun);

const field=new THREE.Mesh(
  new THREE.PlaneGeometry(FIELD_W,FIELD_L),
  new THREE.MeshStandardMaterial({color:0x23823b})
);
field.rotation.x=-Math.PI/2;
field.receiveShadow=true;
scene.add(field);

const white=new THREE.MeshBasicMaterial({color:0xffffff});
function line(x,z,w,d){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),white);
  m.rotation.x=-Math.PI/2;
  m.position.set(x,.02,z);
  scene.add(m);
}
line(0,-HALF_L,FIELD_W,.15);
line(0,HALF_L,FIELD_W,.15);
line(-HALF_W,0,.15,FIELD_L);
line(HALF_W,0,.15,FIELD_L);
line(0,0,FIELD_W,.12);

const centerCircle=new THREE.Mesh(new THREE.RingGeometry(6,6.12,64),white);
centerCircle.rotation.x=-Math.PI/2;
centerCircle.position.y=.02;
scene.add(centerCircle);

function boxLine(x,z,w,d,h=.08){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),white);
  m.position.set(x,h/2,z);
  scene.add(m);
}
function makeGoal(z){
  const dir=z<0?-1:1;
  const group=new THREE.Group();
  const mat=new THREE.MeshBasicMaterial({color:0xffffff});
  const post1=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),mat);
  const post2=post1.clone();
  const bar=new THREE.Mesh(new THREE.BoxGeometry(GOAL_W, .18,.18),mat);
  post1.position.set(-GOAL_W/2,1.25,0);
  post2.position.set(GOAL_W/2,1.25,0);
  bar.position.set(0,2.5,0);
  group.add(post1,post2,bar);
  group.position.z=z;
  scene.add(group);
}
makeGoal(-HALF_L);
makeGoal(HALF_L);

function player(color,x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.CylinderGeometry(.42,.5,1.1,10),
    new THREE.MeshStandardMaterial({color})
  );
  body.position.y=.75;
  body.castShadow=true;
  g.add(body);
  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.3,10,8),
    new THREE.MeshStandardMaterial({color:0x8b5a3c})
  );
  head.position.y=1.55;
  head.castShadow=true;
  g.add(head);
  g.position.set(x,0,z);
  scene.add(g);
  return g;
}

const user=player(0x1769aa,0,18);
user.userData.team='blue';
user.userData.role='forward';

const matePositions=[[-8,10],[8,10],[-10,-2],[10,-2],[0,-8]];
const mates=matePositions.map(p=>{
  const g=player(0x1769aa,...p);
  g.userData.team='blue';
  return g;
});

const oppPositions=[[-7,-12],[7,-12],[-11,-3],[11,-3],[0,-20]];
const opponents=oppPositions.map(p=>{
  const g=player(0xd62d3b,...p);
  g.userData.team='red';
  return g;
});

const homeKeeper=player(0x1b3d9a,0,31);
homeKeeper.userData.team='blue';
homeKeeper.userData.keeper=true;

const awayKeeper=player(0xf08c24,0,-31);
awayKeeper.userData.team='red';
awayKeeper.userData.keeper=true;

const ball=new THREE.Mesh(
  new THREE.SphereGeometry(.3,16,12),
  new THREE.MeshStandardMaterial({color:0xffffff})
);
ball.position.set(0,.3,18);
ball.castShadow=true;
scene.add(ball);
ball.userData.vel=new THREE.Vector3();

const keys={};
addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key===' '){e.preventDefault();shoot();}
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function bind(id,key){
  const b=document.getElementById(id);
  b.onpointerdown=e=>{e.preventDefault();keys[key]=true};
  b.onpointerup=()=>keys[key]=false;
  b.onpointercancel=()=>keys[key]=false;
  b.onpointerleave=()=>keys[key]=false;
}
bind('up','w');bind('down','s');bind('left','a');bind('right','d');

let blueScore=0,redScore=0;
let matchTime=MATCH_SECONDS;
let running=true;
let owner=user;
let outCooldown=0;
let messageTimer=0;

function setStatus(text){
  document.getElementById('status').textContent=text;
}
function updateHud(){
  document.getElementById('score').textContent=blueScore+' - '+redScore;
  const t=Math.max(0,Math.ceil(matchTime));
  const min=String(Math.floor(t/60)).padStart(2,'0');
  const sec=String(t%60).padStart(2,'0');
  document.getElementById('timer').textContent=min+':'+sec;
}
function showMessage(text,seconds=1){
  const el=document.getElementById('message');
  el.textContent=text;
  messageTimer=seconds;
}
function distance(a,b){
  return Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
}
function nearest(list,target){
  let best=null,bd=Infinity;
  for(const p of list){
    const d=Math.hypot(p.position.x-target.x,p.position.z-target.z);
    if(d<bd){bd=d;best=p}
  }
  return best;
}
function hasBall(p){return owner===p}

function giveBall(p){
  owner=p;
  ball.userData.vel.set(0,0,0);
  setStatus(p.userData.team==='blue'?'BLUE POSSESSION':'RED POSSESSION');
}

function releaseBall(direction,power){
  owner=null;
  ball.position.y=.3;
  ball.userData.vel.copy(direction).normalize().multiplyScalar(power);
}

function pass(){
  if(!running)return;
  if(!hasBall(user)){
    if(distance(user,ball)<2.2 && !owner)giveBall(user);
    else {setStatus('GET THE BALL');return}
  }
  const target=nearest(mates,user);
  if(!target)return;
  const dir=new THREE.Vector3(target.position.x-user.position.x,0,target.position.z-user.position.z);
  if(dir.lengthSq()<.1)return;
  releaseBall(dir,12);
  setStatus('PASS');
}

function shoot(){
  if(!running)return;
  if(!hasBall(user)){
    if(distance(user,ball)<2.2 && !owner)giveBall(user);
    else {setStatus('GET THE BALL');return}
  }
  const target=new THREE.Vector3(0,.3,-HALF_L-1);
  const dir=new THREE.Vector3(target.x-user.position.x,0,target.z-user.position.z);
  releaseBall(dir,18);
  setStatus('SHOT!');
}

function tackle(){
  if(!running)return;
  if(owner && owner.userData.team==='red' && distance(user,owner)<2.4){
    showMessage('TACKLE!',.6);
    giveBall(user);
  }else if(!owner && distance(user,ball)<2.2){
    giveBall(user);
  }else{
    setStatus('TOO FAR');
  }
}
document.getElementById('pass').onclick=pass;
document.getElementById('shoot').onclick=shoot;
document.getElementById('tackle').onclick=tackle;

function resetKickoff(){
  user.position.set(0,0,18);
  mates.forEach((p,i)=>p.position.set(...matePositions[i],0));
  opponents.forEach((p,i)=>p.position.set(...oppPositions[i],0));
  homeKeeper.position.set(0,0,31);
  awayKeeper.position.set(0,0,-31);
  ball.position.set(0,.3,18);
  giveBall(user);
  outCooldown=.8;
}

function goal(team){
  if(team==='blue'){
    blueScore++;
    showMessage('GOAL! BLUE',1.6);
  }else{
    redScore++;
    showMessage('GOAL! RED',1.6);
  }
  updateHud();
  owner=null;
  ball.userData.vel.set(0,0,0);
  outCooldown=1.7;
  setTimeout(()=>{if(running)resetKickoff()},1700);
}

function resetOut(){
  const p=nearest([...mates,user,...opponents],ball.position);
  if(p)giveBall(p);
  else resetKickoff();
  showMessage('THROW-IN',.7);
}

function moveControlled(dt){
  let dx=(keys.d?1:0)-(keys.a?1:0);
  let dz=(keys.s?1:0)-(keys.w?1:0);
  const len=Math.hypot(dx,dz)||1;
  const speed=8;
  user.position.x=THREE.MathUtils.clamp(user.position.x+dx/len*speed*dt,-19.2,19.2);
  user.position.z=THREE.MathUtils.clamp(user.position.z+dz/len*speed*dt,-32,32);
}

function updateTeammates(dt){
  mates.forEach((p,i)=>{
    const home=new THREE.Vector3(matePositions[i][0],0,matePositions[i][1]);
    const target=new THREE.Vector3(
      THREE.MathUtils.clamp(ball.position.x*.18+home.x,-17,17),
      0,
      THREE.MathUtils.clamp(ball.position.z*.12+home.z,-28,28)
    );
    p.position.lerp(target,.8*dt);
  });
  homeKeeper.position.x=THREE.MathUtils.clamp(ball.position.x*.35,-5,5);
}

function updateOpponents(dt){
  const target=owner && owner.userData.team==='red'?user:ball;
  opponents.forEach((p,i)=>{
    const d=distance(p,target);
    const chase=(p===nearest(opponents,target) || !owner);
    if(chase){
      const dir=new THREE.Vector3(target.position.x-p.position.x,0,target.position.z-p.position.z);
      if(dir.lengthSq()>1){
        dir.normalize();
        p.position.addScaledVector(dir,3.7*dt);
      }
    }else{
      const home=new THREE.Vector3(oppPositions[i][0],0,oppPositions[i][1]);
      p.position.lerp(home,.7*dt);
    }
    p.position.x=THREE.MathUtils.clamp(p.position.x,-19,19);
    p.position.z=THREE.MathUtils.clamp(p.position.z,-32,32);
  });

  const keeperTarget=new THREE.Vector3(
    THREE.MathUtils.clamp(ball.position.x,-GOAL_W/2,GOAL_W/2),
    0,-31
  );
  awayKeeper.position.lerp(keeperTarget,Math.min(1,4*dt));

  const closest=nearest(opponents,ball.position);
  if(!owner && closest && distance(closest,ball)<1.05){
    giveBall(closest);
  }

  if(owner && owner.userData.team==='red'){
    const d=new THREE.Vector3(-user.position.x,0,34-owner.position.z);
    if(d.lengthSq()>0)owner.position.addScaledVector(d.normalize(),2.8*dt);
    if(owner.position.z>25 && Math.random()<dt*.9){
      const shotDir=new THREE.Vector3(-owner.position.x*.15,0,34-owner.position.z);
      releaseBall(shotDir,14);
      setStatus('RED SHOT!');
    }
  }
}

function updatePossession(){
  if(!owner){
    ball.position.y=.3;
    const blue=nearest([user,...mates],ball.position);
    const red=nearest(opponents,ball.position);
    if(blue && distance(blue,ball)<.95)giveBall(blue);
    else if(red && distance(red,ball)<.95)giveBall(red);
  }else{
    const offset=owner.userData.team==='blue'?-.75:.75;
    ball.position.set(owner.position.x,owner.position.y+.35,owner.position.z+offset);
  }
}

function keeperSave(keeper,team){
  if(owner)return false;
  if(distance(keeper,ball)<1.65 && ball.userData.vel.length()>4){
    const attackingGoal=team==='red' ? -1 : 1;
    const dir=new THREE.Vector3(ball.position.x-keeper.position.x,0,attackingGoal);
    releaseBall(dir,9);
    showMessage('SAVE!',.7);
    setStatus(team==='red'?'RED KEEPER SAVE':'BLUE KEEPER SAVE');
    return true;
  }
  return false;
}

function checkCollisions(){
  keeperSave(awayKeeper,'red');
  keeperSave(homeKeeper,'blue');
  if(owner && owner.userData.team==='red' && distance(user,owner)<1.25){
    if(Math.random()<.035)giveBall(user);
  }
  if(!owner && distance(user,ball)<1.05)giveBall(user);
}

function updateBall(dt){
  if(owner)return;
  ball.position.addScaledVector(ball.userData.vel,dt);
  ball.userData.vel.multiplyScalar(Math.pow(.07,dt));
  ball.position.y=.3;

  if(ball.position.z<-HALF_L && Math.abs(ball.position.x)<=GOAL_W/2){
    goal('blue');return;
  }
  if(ball.position.z>HALF_L && Math.abs(ball.position.x)<=GOAL_W/2){
    goal('red');return;
  }
  if(Math.abs(ball.position.x)>HALF_W || Math.abs(ball.position.z)>HALF_L){
    if(outCooldown<=0)resetOut();
  }
}

function endMatch(){
  running=false;
  owner=null;
  setStatus('FULL TIME');
  showMessage('FULL TIME  '+blueScore+' - '+redScore,999);
}

let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-last)/1000,.033);
  last=now;

  if(running){
    matchTime=Math.max(0,matchTime-dt);
    if(matchTime<=0)endMatch();
    if(outCooldown>0)outCooldown-=dt;
    if(messageTimer>0){
      messageTimer-=dt;
      if(messageTimer<=0)document.getElementById('message').textContent='';
    }

    moveControlled(dt);
    updateTeammates(dt);
    updateOpponents(dt);
    updatePossession();
    checkCollisions();
    updateBall(dt);
    updateHud();
  }

  const camTarget=new THREE.Vector3(user.position.x,11,user.position.z+14);
  camera.position.lerp(camTarget,.08);
  camera.lookAt(user.position.x,0,user.position.z-7);
  renderer.render(scene,camera);
}
resetKickoff();
updateHud();
requestAnimationFrame(loop);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});