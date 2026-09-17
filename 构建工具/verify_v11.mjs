import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=path.resolve(process.argv[2]||'outputs/数学知识库');
const html=fs.readFileSync(path.join(root,'开始阅读.html'),'utf8');
const kb=JSON.parse(html.match(/<script id="kb-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
assert.equal(kb.modules.length,103);assert.equal(kb.stats.practice,287);assert.equal(kb.stats.deepStudyModules,12);assert.equal(kb.stats.diagrams,8);assert.equal(kb.stats.addedPractice,81);
const checks=[];const eq=(name,a,b,tol=1e-10)=>{assert(Math.abs(a-b)<=tol,name);checks.push({name,result:'通过'});};
eq('J06 分层去分母',(2*4-3)/4-(4+1)/6,5/12);eq('J12 盐质量',120*.1+80*.3,36);eq('J12 加水',36/240,.15);eq('J13 租车费用',3*500+2*360,2220);eq('J23 两面展开前顶',6**2+(3+4)**2,85);eq('J23 两面展开左顶',(3+6)**2+4**2,97);eq('J25 菱形半径边长',Math.sqrt(5**2+12**2),13);eq('J25 中点面积',6*8/2,24);eq('J27 两箱交点',40-2*6,10+3*6);eq('J31 盒底',22*12,264);eq('J31 体积',22*12*4,1056);eq('J33 定价利润',19*55,1045);eq('J37 梯形面积',18+50+30+30,128);eq('J40 内切圆半径',6*8/(6+8+10),2);eq('J43 加乙盒成功率',.5*2/3+.5*2/5,8/15);
eq('H04 受限围栏',2*4+48/4,20);eq('H11 倍角平方和',(-24/25)**2+(7/25)**2,1);eq('H13 夹角余弦',1/Math.sqrt(50),Math.sqrt(2)/10);eq('H18 点面距离',4/Math.sqrt(8),Math.sqrt(2));eq('H21 切线距离',3/Math.sqrt(5/4+1),2);eq('H24 竖直椭圆弦',2*Math.sqrt(1-1/4),Math.sqrt(3));eq('H26 错位和',Array.from({length:7},(_,i)=>(i+1)/2**(i+1)).reduce((a,b)=>a+b),2-9/128);eq('H28 盒体积',2*(12-4)**2,128);eq('H33 观察后来源',((1/3)*(2/3))/((1/3)*(2/3)+(2/3)*.5),2/5);eq('H39 卡方',2*(25/35+25/15),100/21);
eq('A06 中值点',2*1.5-2,1);eq('A07 四阶余项界',.3**4/24,.0003375);eq('A07 六阶余项界',.3**6/720,.0000010125);eq('A07 迁移误差界',.1**5/120,1/12000000);eq('A11 迁移取等约束',(3/Math.sqrt(5))**2+(-6/Math.sqrt(5))**2,9);eq('A12 带权平方差',(1**2+3*3**2)/4-((1+3*3)/4)**2,3*(1-3)**2/16);
const byId=new Map(kb.modules.map(m=>[m.id,m]));
for(const m of kb.modules){assert.equal(new Set(m.practice.map(p=>p.question)).size,m.practice.length);if(m.selfStudy){for(const type of ['entryCheck','exitCheck'])for(const key of ['question','answer','explanation'])assert(m.selfStudy[type][key]);assert(m.selfStudy.reasoning.length>=4);assert(m.selfStudy.workedWalkthrough.length>=4);for(const r of m.selfStudy.remediation)assert(byId.has(r.moduleId));}}
// Sample-grid checks are falsification attempts, not proofs.
for(let k=-12;k<=12;k++){if(k===1){eq('J31 参数一次退化',-2*.5+1,0);continue;}if(k>2)continue;for(const sign of [-1,1]){const x=(1+sign*Math.sqrt(2-k))/(k-1);eq('J31 参数代回 k='+k+' sign='+sign,(k-1)*x*x-2*x+1,0);}}
const qa={version:'1.1',checks:{counts:'通过',scriptSyntax:'通过',supplementFields:'通过',duplicatePractice:'无',numericalChecks:checks.length},numerical:checks,limits:['数值抽查与参数网格用于寻找错误，不构成一般性数学证明。','教学效果尚未经真实学生试学验证。']};
fs.writeFileSync(path.join(root,'深化验证.json'),JSON.stringify(qa,null,2));console.log(JSON.stringify(qa.checks,null,2));
