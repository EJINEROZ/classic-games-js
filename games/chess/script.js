"use strict";
(function(){
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height; // draw 480x480 board centered
const SIZE=480, TILE=SIZE/8, OFFX=(W-SIZE)/2, OFFY=(H-SIZE)/2;
const turnEl=document.getElementById('turn'); const statusEl=document.getElementById('status'); const resetBtn=document.getElementById('resetBtn');
const C={light:get('--light','#e2e8f0'), dark:get('--dark','#334155'), bg:get('--panel','#0f1524'), text:get('--text','#e6f2ff'), acc:get('--accent','#22d3ee')};
function get(n,f){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||f}


// Board uses simple piece codes: 'wP','wR','wN','wB','wQ','wK' and black equivalents
let board, whiteToMove, select=null, legal=[], over=false;
function start(){ board=setup(); whiteToMove=true; select=null; legal=[]; over=false; updateHUD(); draw(); }


function setup(){
const e=null; const b=[...Array(8)].map(()=>Array(8).fill(e));
const back=['R','N','B','Q','K','B','N','R'];
for(let i=0;i<8;i++){ b[0][i]='b'+back[i]; b[1][i]='bP'; b[6][i]='wP'; b[7][i]='w'+back[i]; }
return b;
}


function updateHUD(){ turnEl.textContent=whiteToMove?'White':'Black'; }


canvas.addEventListener('mousedown', e=>{ if(over) return; const {c,r}=hit(e); if(!inBoard(c,r)) return; const piece=board[r][c]; const side=whiteToMove?'w':'b';
if(select && includesMove(legal,c,r)){ makeMove(select.c,select.r,c,r); select=null; legal=[]; draw(); return; }
if(piece && piece[0]===side){ select={c,r}; legal=legalMoves(c,r); draw(); }
});
resetBtn.addEventListener('click', start);


function hit(e){ const rect=canvas.getBoundingClientRect(); const x=(e.clientX-rect.left)*(canvas.width/rect.width)-OFFX; const y=(e.clientY-rect.top)*(canvas.height/rect.height)-OFFY; return {c:Math.floor(x/TILE), r:Math.floor(y/TILE)} }
const inBoard=(c,r)=> c>=0&&c<8&&r>=0&&r<8;


function makeMove(sc,sr,dc,dr){ const piece=board[sr][sc]; const target=board[dr][dc];
// move and handle promotion
board[dr][dc]=piece; board[sr][sc]=null; if(piece==='wP'&&dr===0){ board[dr][dc]='wQ'; } if(piece==='bP'&&dr===7){ board[dr][dc]='bQ'; }
whiteToMove=!whiteToMove; updateHUD();
// check end
const nextSide=whiteToMove?'w':'b'; const any=anyLegal(nextSide); const inChk=isInCheck(nextSide);
if(!any){ over=true; statusEl.textContent= inChk? (whiteToMove? 'Black mates':'White mates') : 'Stalemate'; }
else statusEl.textContent= inChk? 'Check' : 'Ready';
}


function includesMove(list,c,r){ return list.some(m=>m.c===c&&m.r===r); }


function legalMoves(c,r){ const piece=board[r][c]; if(!piece) return []; const side=piece[0]; const type=piece[1]; const dirs=[]; const res=[]; const enemy= side==='w'?'b':'w';
const add=(cc,rr)=>{ if(!inBoard(cc,rr)) return; const t=board[rr][cc]; if(!t||t[0]!==side) res.push({c:cc,r:rr}); };
if(type==='P'){
const dir= side==='w'?-1:1; // forward
// single
if(inBoard(c,r+dir) && !board[r+dir][c]) res.push({c:c,r:r+dir});
// double from start
const startR = side==='w'?6:1; if(r===startR && !board[r+dir][c] && !board[r+2*dir][c]) res.push({c:c,r:r+2*dir});
// captures
for(const dc of [-1,1]){ const cc=c+dc, rr=r+dir; if(inBoard(cc,rr)&& board[rr][cc] && board[rr][cc][0]===enemy) res.push({c:cc,r:rr}); }
}
if(type==='N'){
const K=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]; for(const [dx,dy] of K){ add(c+dx,r+dy); }
}
if(type==='B' || type==='R' || type==='Q'){
if(type==='B'||type==='Q'){ dirs.push([1,1],[1,-1],[-1,1],[-1,-1]); }
if(type==='R'||type==='Q'){ dirs.push([1,0],[-1,0],[0,1],[0,-1]); }
for(const [dx,dy] of dirs){ let cc=c+dx, rr=r+dy; while(inBoard(cc,rr)){ const t=board[rr][cc]; if(!t){ res.push({c:cc,r:rr}); } else { if(t[0]!==side) res.push({c:cc,r:rr}); break; } cc+=dx; rr+=dy; }
}
}
if(type==='K'){
for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){ if(!dx&&!dy) continue; add(c+dx,r+dy); }
}
// filter out moves leaving own king in check
return res.filter(m=> !leavesKingInCheck(c,r,m.c,m.r));
}


function leavesKingInCheck(sc,sr,dc,dr){ const piece=board[sr][sc]; const saved=board[dr][dc]; board[dr][dc]=piece; board[sr][sc]=null; const side=piece[0]; const bad=isInCheck(side); board[sr][sc]=piece; board[dr][dc]=saved; return bad; }


function isInCheck(side){ // find king
let kc=-1,kr=-1; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ if(board[r][c]===side+'K'){ kc=c; kr=r; } }
const enemy= side==='w'?'b':'w';
// knight attacks
const K=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]; for(const [dx,dy] of K){ const c=kc+dx,r=kr+dy; if(inBoard(c,r)&& board[r][c]===enemy+'N') return true; }
// pawn attacks
const dir= side==='w'?-1:1; for(const dc of [-1,1]){ const c=kc+dc,r=kr+dir; if(inBoard(c,r)&& board[r][c]===enemy+'P') return true; }
// king adjacency
for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){ if(dx||dy){ const c=kc+dx,r=kr+dy; if(inBoard(c,r)&& board[r][c]===enemy+'K') return true; } }
// sliders: bishops/rooks/queens
const rays=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
for(const [dx,dy] of rays){ let c=kc+dx,r=kr+dy; while(inBoard(c,r)){ const t=board[r][c]; if(t){ if(t[0]===enemy){ const T=t[1]; if((dx===0||dy===0) && (T==='R'||T==='Q')) return true; if((dx!==0&&dy!==0) && (T==='B'||T==='Q')) return true; } break; } c+=dx; r+=dy; }
}
return false;
}


function anyLegal(side){ for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p&&p[0]===side){ if(legalMoves(c,r).length) return true; } } return false; }


function draw(){ ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H); // board
for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const x=OFFX+c*TILE, y=OFFY+r*TILE; ctx.fillStyle=(r+c)%2? C.dark: C.light; ctx.fillRect(x,y,TILE,TILE); }
// highlights
if(select){ ctx.fillStyle='rgba(34,211,238,.18)'; ctx.fillRect(OFFX+select.c*TILE, OFFY+select.r*TILE, TILE, TILE); for(const m of legal){ ctx.fillStyle='rgba(34,211,238,.28)'; ctx.beginPath(); ctx.arc(OFFX+m.c*TILE+TILE/2, OFFY+m.r*TILE+TILE/2, 8, 0, Math.PI*2); ctx.fill(); } }
// pieces
ctx.textAlign='center'; ctx.textBaseline='middle';
for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(!p) continue; const x=OFFX+c*TILE+TILE/2, y=OFFY+r*TILE+TILE/2; const isWhite=p[0]==='w'; ctx.fillStyle=isWhite? '#fff':'#111827'; ctx.strokeStyle=isWhite? '#0f172a':'#e5e7eb'; ctx.lineWidth=2;
drawPiece(p[1], x, y, isWhite);
}
if(over){ ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(0,0,W,H); ctx.fillStyle=C.text; ctx.textAlign='center'; ctx.font='700 26px system-ui'; ctx.fillText(statusEl.textContent, W/2, H/2); }
}


function drawPiece(t,x,y,white){ // minimal glyphs
ctx.save(); ctx.translate(x,y);
if(t==='P'){ ctx.beginPath(); ctx.arc(0,-6,10,0,Math.PI*2); ctx.rect(-8,-2,16,18); ctx.fill(); ctx.stroke(); }
if(t==='R'){ ctx.beginPath(); ctx.rect(-12,-14,24,28); ctx.fill(); ctx.stroke(); }
if(t==='N'){ ctx.beginPath(); ctx.moveTo(-12,14); ctx.lineTo(0,-6); ctx.lineTo(12,14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
if(t==='B'){ ctx.beginPath(); ctx.arc(0,-4,12,0,Math.PI*2); ctx.rect(-8,2,16,12); ctx.fill(); ctx.stroke(); }
if(t==='Q'){ ctx.beginPath(); ctx.arc(0,-10,10,0,Math.PI*2); ctx.rect(-12,-2,24,20); ctx.fill(); ctx.stroke(); }
if(t==='K'){ ctx.beginPath(); ctx.rect(-10,-10,20,24); ctx.moveTo(-10,-2); ctx.lineTo(10,-2); ctx.moveTo(0,-14); ctx.lineTo(0,8); ctx.stroke(); ctx.fill(); }
ctx.restore();
}


start();
})();