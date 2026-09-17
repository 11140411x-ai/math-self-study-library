import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||(path.basename(here)==='构建工具'?path.dirname(here):path.join(here,'../outputs/数学知识库')));
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
const write=(p,t)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,t,'utf8');};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceFiles=fs.readdirSync(path.join(root,'data')).filter(x=>x.endsWith('.json')).sort();
const rank={J:0,H:1,A:2};
const modules=sourceFiles.flatMap(f=>JSON.parse(read(path.join(root,'data',f)))).sort((a,b)=>rank[a.id[0]]-rank[b.id[0]]||a.id.localeCompare(b.id));
const meta=JSON.parse(read(path.join(root,'library_meta.json'))),byId=new Map();
for(const m of modules){assert(/^[JHA]\d{2}$/.test(m.id),'Invalid id '+m.id);assert(!byId.has(m.id),'Duplicate '+m.id);byId.set(m.id,m);assert(m.title&&m.stage&&m.domain);assert(m.concepts.length>=3);assert(m.example.solution.length>=2);assert(m.practice.length>=2);assert(m.sources.length);for(const s of m.sources){assert(/^https:\/\//.test(s.url));assert(s.locator);}if(m.stage==='高阶拓展'){assert(m.theorem?.assumptions.length&&m.theorem?.proof.length);assert(m.derivation?.length);}}
const extraDir=path.join(root,'扩充资料'), extraFiles=fs.existsSync(extraDir)?fs.readdirSync(extraDir).filter(f=>f.endsWith('.json')).sort():[];
let addedPractice=0;
for(const file of extraFiles){const extras=JSON.parse(read(path.join(extraDir,file)));assert(Array.isArray(extras),file);for(const item of extras){const m=byId.get(item.moduleId);assert(m,'Invalid supplemental module '+item.moduleId);
 if(file.endsWith('分层练习.json')){assert(item.practice.length===3,file);assert.deepEqual(item.practice.map(p=>p.level),['基础巩固','条件变式','综合应用']);for(const p of item.practice){assert(p.question&&p.answer&&p.solution);assert(!m.practice.some(x=>x.question===p.question),'Duplicate practice '+m.id);m.practice.push(p);addedPractice++;}}
 else if(file.endsWith('自学讲解.json')){assert(!m.selfStudy,'Duplicate selfStudy '+m.id);assert(item.entryCheck?.explanation&&item.exitCheck?.explanation&&item.intuition&&item.wrongApproach?.correction);assert(item.reasoning.length>=4&&item.workedWalkthrough.length>=4);for(const r of item.remediation)assert(byId.has(r.moduleId),'Invalid remediation '+r.moduleId);m.selfStudy=item;}
 else if(file==='图解索引.json'){const svgPath=path.resolve(root,item.file);assert(svgPath.startsWith(root+path.sep));const svg=read(svgPath);assert(/<svg/.test(svg)&&/<title/.test(svg)&&/<desc/.test(svg));assert(!/<script|<foreignObject|(?:href|src)\s*=/i.test(svg),'Unsafe/non-self-contained SVG');(m.illustrations??=[]).push({...item,svg});}
 else assert.fail('Unsupported supplement '+file);
}}
for(const m of modules)for(const id of m.prerequisites){assert(byId.has(id),'Missing '+id+' required by '+m.id);assert(id!==m.id,'Self dependency');}
const seen=new Set(),visiting=new Set(),order=[];
function visit(id){if(seen.has(id))return;assert(!visiting.has(id),'Dependency cycle at '+id);visiting.add(id);for(const p of byId.get(id).prerequisites)visit(p);visiting.delete(id);seen.add(id);order.push(id);}
modules.forEach(m=>visit(m.id));
for(const route of meta.routes)route.ids.forEach(id=>assert(byId.has(id)));
for(const e of meta.evidence)e.modules.forEach(id=>assert(byId.has(id)));
const fileOf=m=>m.id+'_'+m.title.replace(/[<>:"/\\|?*]/g,'_')+'.md';
const relative=m=>'知识卡/'+m.stage+'/'+fileOf(m);
const markdownLink=(m,prefix='')=>'['+m.id+' '+m.title+'](<'+prefix+relative(m)+'>)';
const bullets=arr=>arr.map(x=>'- '+x).join('\n');
const ordered=arr=>arr.map((x,i)=>(i+1)+'. '+x).join('\n');
function moduleMD(m,compiled=false){const link=id=>compiled?'['+id+' '+byId.get(id).title+']('+(byId.get(id).stage===m.stage?'':byId.get(id).stage+'_合订.md')+'#'+id.toLowerCase()+')':markdownLink(byId.get(id),'../../');let md=(compiled?'<a id="'+m.id.toLowerCase()+'"></a>\n\n':'')+'# '+m.id+' '+m.title+'\n\n'+m.stage+' · '+m.grade+(m.courseType?' · '+m.courseType:'')+' · '+m.domain+'\n\n## 前置知识\n\n'+(m.prerequisites.length?m.prerequisites.map(link).join(' · '):'本库起点，无必须先读的模块。')+'\n\n## 本节目标\n\n'+bullets(m.goals)+'\n\n## 基础与概念\n\n'+m.concepts.map(c=>'### '+c.name+'\n\n'+c.explanation).join('\n\n');
if(m.theorem){const t=m.theorem;md+='\n\n## 定理：'+t.name+'\n\n### 成立条件\n\n'+bullets(t.assumptions)+'\n\n### 结论\n\n'+t.statement+'\n\n### 证明\n\n证明范围：'+t.proofLevel+'\n\n'+ordered(t.proof);}
if(m.derivation)md+='\n\n## 公式如何衍生\n\n'+ordered(m.derivation);
if(m.selfStudy){const s=m.selfStudy;md+='\n\n## 自学加深：先查起点，再问为什么\n\n### 入门检查（先独立回答）\n\n'+s.entryCheck.question+'\n\n<details><summary>检查起点</summary>\n\n'+s.entryCheck.answer+'\n\n'+s.entryCheck.explanation+'\n\n</details>\n\n### 直观入口（不是证明）\n\n'+s.intuition+'\n\n### 不跳步的推理\n\n'+s.reasoning.map(x=>'#### '+x.step+'\n\n'+x.detail).join('\n\n');}
if(m.illustrations)md+='\n\n## 图解与读图提示\n\n'+m.illustrations.map(x=>'!['+x.title+']('+(compiled?'../':'../../')+x.file+')\n\n'+x.caption).join('\n\n');
md+='\n\n## 解题方法\n\n'+bullets(m.methods)+'\n\n## 易错与限制\n\n'+bullets(m.pitfalls)+'\n\n## 完整例题\n\n'+m.example.question+'\n\n'+ordered(m.example.solution)+'\n\n答案：'+m.example.answer;
if(m.selfStudy){const s=m.selfStudy;md+='\n\n### 老师怎样想到并检查每一步\n\n'+s.workedWalkthrough.map(x=>'#### '+x.step+'\n\n'+x.detail).join('\n\n')+'\n\n### 错解对照\n\n错误说法：'+s.wrongApproach.claim+'\n\n错在哪里：'+s.wrongApproach.whyWrong+'\n\n怎样修正：'+s.wrongApproach.correction;}
md+='\n\n## 自测与解析\n\n'+m.practice.map((p,i)=>'### '+(i+1)+'. '+p.level+'\n\n'+p.question+'\n\n<details>\n<summary>展开答案与解析</summary>\n\n答案：'+p.answer+'\n\n解析：'+p.solution+'\n\n</details>').join('\n\n');
if(m.selfStudy){const s=m.selfStudy;md+='\n\n## 离开本节前：独立迁移\n\n'+s.exitCheck.question+'\n\n<details><summary>核对迁移题</summary>\n\n'+s.exitCheck.answer+'\n\n'+s.exitCheck.explanation+'\n\n</details>\n\n### 卡住时回哪里补\n\n'+s.remediation.map(r=>'- '+r.difficulty+'：'+link(r.moduleId)+'。'+r.action).join('\n');}
md+='\n\n## 掌握检查\n\n'+bullets(m.mastery)+'\n\n## 核查来源与对应范围\n\n'+m.sources.map(s=>'- ['+s.title+']('+s.url+')：'+s.locator).join('\n')+'\n\n本卡为自行组织的讲解与训练，不是教材的逐字摘录。来源定位不代表逐页核完该教材。\n';
if(m.selfStudy){const deep=md.match(/\n\n## 自学加深：[\s\S]*?(?=\n\n## )/);if(deep){md=md.replace(deep[0],'');const parts=deep[0].split('\n\n### 不跳步的推理\n\n');md=md.replace('\n\n## 基础与概念',parts[0]+'\n\n## 基础与概念');const marker=m.theorem?'\n\n## 定理：':'\n\n## 解题方法';md=md.replace(marker,'\n\n## 不跳步的推理\n\n'+parts[1]+marker);}}
return md;}
for(const m of modules)write(path.join(root,relative(m)),moduleMD(m));
for(const stage of ['初中','高中','高阶拓展'])write(path.join(root,'分册',stage+'_合订.md'),'# '+stage+'知识卡合订本\n\n版本 '+meta.version+' · '+meta.updated+'。所有标为原创的练习均为本次自行编写。\n\n'+modules.filter(m=>m.stage===stage).map(m=>moduleMD(m,true)).join('\n\n---\n\n'));
let index='# 全部知识索引\n\n共 '+modules.length+' 个模块。模块编号稳定，建议按前置关系学习；高阶不作为统一高考必修。\n\n';
for(const stage of ['初中','高中','高阶拓展']){index+='## '+stage+'\n\n| 模块 | 领域 | 前置 |\n| --- | --- | --- |\n';for(const m of modules.filter(m=>m.stage===stage))index+='| '+markdownLink(m)+' | '+m.domain+' | '+(m.prerequisites.join('、')||'无')+' |\n';index+='\n';}write(path.join(root,'00_总索引.md'),index);
let routeMD='# 学习路线\n\n这是主题主线，不是所有分支的严格线性课表。点击知识卡核对跨分支前置。阅读器的上一／下一顺序按照依赖关系自动拓扑排序。\n\n';for(const r of meta.routes)routeMD+='## '+r.title+'\n\n'+r.description+'\n\n'+r.ids.map(id=>markdownLink(byId.get(id))).join(' → ')+'\n\n';routeMD+='## 完整无环依赖顺序\n\n'+order.map(id=>markdownLink(byId.get(id))).join(' → ')+'\n\n## 自学方法\n\n先判断前置是否熟练，阅读概念与例题，再独立做两道自测。记下错因和成立条件；无法解释的步骤回到前置卡补上。题目完成不等于掌握整个专题，仍需增加变式和综合题训练。\n';write(path.join(root,'01_学习路线.md'),routeMD);
const inventoryPath=path.join(root,'参考资料清单.json');
const inventory=JSON.parse(read(inventoryPath));
const srcPath=path.join(root,'02_来源与版本核查.md');const sourcePrefix=read(srcPath).split('<!-- DRIVE_INVENTORY -->')[0];
write(srcPath,sourcePrefix+'<!-- DRIVE_INVENTORY -->\n\n## 原文件清单\n\n| 原文件（点击打开） | 本次使用／核查状态 |\n| --- | --- |\n'+inventory.map(s=>'| ['+s.title+']('+s.url+') | '+s.status+' |').join('\n')+'\n');
const examPath=path.join(root,'03_真题证据与缺口.md');let examDoc=read(examPath);
const examTable='<!-- EXAM_TABLE -->\n\n| 题号 | 知识主题 | 对应知识卡 | 官方答案 | 题面印刷页 / PDF页 |\n| --- | --- | --- | --- | --- |\n'+meta.evidence.map(e=>'| '+e.question+' | '+e.theme+' | '+e.modules.join('、')+' | '+e.answer+' | '+e.printedPage+' / '+e.pdfPage+' |').join('\n')+'\n\n';
examDoc=examDoc.replace(/<!-- EXAM_TABLE -->[\s\S]*?(?=\n## 已读)/,examTable);write(examPath,examDoc);
function inline(s){return esc(s).replace(/\[([^\]]+)\]\(<?([^\s)>]+)>?\)/g,(_,label,url)=>'<a href="'+url+'"'+(url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':'')+'>'+label+'</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
function docHTML(md){const lines=md.split('\n');let html='',i=0;while(i<lines.length){const line=lines[i];if(!line.trim()||line.startsWith('<!--')){i++;continue;}if(line.startsWith('```')){const code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);i++;html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';continue;}if(/^#{1,6} /.test(line)){const n=line.match(/^#+/)[0].length;html+='<h'+n+'>'+inline(line.slice(n+1))+'</h'+n+'>';i++;continue;}if(line.startsWith('|')){const rows=[];while(i<lines.length&&lines[i].startsWith('|'))rows.push(lines[i++]);const cells=r=>r.slice(1,r.lastIndexOf('|')).split('|').map(c=>c.trim());html+='<div class="table-wrap"><table><thead><tr>'+cells(rows[0]).map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(2).map(r=>'<tr>'+cells(r).map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;}if(/^[-\d]+[.)]? /.test(line)){const ol=/^\d/.test(line),tag=ol?'ol':'ul',items=[];while(i<lines.length&&(ol?/^\d+[.)] /:/^- /).test(lines[i]))items.push(lines[i++].replace(ol?/^\d+[.)] /:/^- /,''));if(items.length){html+='<'+tag+'>'+items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</'+tag+'>';continue;}}html+='<p>'+inline(line)+'</p>';i++;}return html;}
const stats={modules:modules.length,concepts:modules.reduce((n,m)=>n+m.concepts.length,0),examples:modules.length,practice:modules.reduce((n,m)=>n+m.practice.length,0),theorems:modules.filter(m=>m.theorem).length,stages:Object.fromEntries(['初中','高中','高阶拓展'].map(s=>[s,modules.filter(m=>m.stage===s).length])),textCharacters:modules.reduce((n,m)=>n+JSON.stringify(m).length,0)};
const docs={sources:docHTML(read(srcPath)),exams:docHTML(read(examPath)),help:docHTML(read(path.join(root,'04_使用与维护.md')))};
stats.addedPractice=addedPractice;stats.layeredModules=modules.filter(m=>m.practice.length>2).length;stats.deepStudyModules=modules.filter(m=>m.selfStudy).length;stats.diagrams=modules.reduce((n,m)=>n+(m.illustrations?.length||0),0);stats.diagnosticAndTransferQuestions=stats.deepStudyModules*2;
const auditPath=path.join(root,'06_严谨性与自学审查.md');if(fs.existsSync(auditPath))docs.audit=docHTML(read(auditPath));
const payload=JSON.stringify({modules,meta,order,stats,docs}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const template=read(path.join(here,'reader.template.html'));
const html=template.replace('v1.0','v'+meta.version).replace('<button data-view="help">使用说明</button>','<button data-view="help">使用说明</button><button data-view="audit">自学审查</button>').replace('__CSS__',()=>read(path.join(here,'reader.css'))).replace('__DATA__',()=>payload).replace('__JS__',()=>read(path.join(here,'reader.js')));
assert(!/__CSS__|__DATA__|__JS__/.test(html));assert(!/<script[^>]+src=|<link[^>]+stylesheet/i.test(html),'Must be self-contained');
write(path.join(root,'开始阅读.html'),html);
write(path.join(root,'依赖图.json'),JSON.stringify({order,nodes:modules.map(m=>({id:m.id,title:m.title,stage:m.stage})),edges:modules.flatMap(m=>m.prerequisites.map(p=>({from:p,to:m.id})))},null,2));
const numeric=[];function check(name,value,expected,tol=1e-10){assert(Math.abs(value-expected)<=tol,name);numeric.push({name,result:'通过',value,expected});}
check('J03 混合运算',-9+2*16-18/(-3),29);check('J06 方程代回',((13-1)/2-1)-(13+2)/3,0);check('J12 票款',6*30+6*18,288);check('J25 菱形面积',6*8/2,24);check('J28 方差',(4+0+0+4)/4,2);check('J30 第一分类平方和',.25*4,1);check('J30 第二分类平方和',12.25*4,49);check('J32 韦达组合',5**2-2*3,19);check('J38 面积单位',30*10000/10000,30);check('J41 圆锥展开角',360*3/5,216);check('J43 放回同色',(2/3)**2+(1/3)**2,5/9);check('H04 限制区间最值',4+9/4,25/4);check('H18 体积换底距离',3*(4/3)/(2*Math.sqrt(3)),2/Math.sqrt(3));check('H24 椭圆弦长',Math.sqrt(2)*4/Math.sqrt(5),4*Math.sqrt(10)/5);check('H31 二项式系数',6*4,24);check('H34 分布方差',9/3+36/6-(3/3+6/6)**2,5);check('H35 超几何概率',6*6/120,.3);check('H38 回归斜率',(4/3+5/3)/2,1.5);check('H39 卡方',4*25/25,4);check('A07 余项界',.2**4/24,1/15000);check('A10 等比余项',(1/3)**5/(1-1/3),1/162);check('A11 最大值取等',3*6/5+4*8/5,10);check('A16 贝叶斯',.4*.03/(.6*.01+.4*.03),2/3);check('A17 样本量',1/(4*.05*.1**2),500,1e-8);
const broken=[];function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const f of walk(root).filter(f=>f.endsWith('.md'))){const text=read(f);for(const match of text.matchAll(/\]\(([^)]+)\)/g)){let target=match[1].replace(/^<|>$/g,'');if(/^(?:https?:|#|mailto:)/.test(target))continue;target=decodeURI(target.split('#')[0]);if(target&&!fs.existsSync(path.resolve(path.dirname(f),target)))broken.push({file:path.relative(root,f),target});}}
assert.equal(broken.length,0,JSON.stringify(broken));
const quality={version:meta.version,generatedAt:new Date().toISOString(),stats,checks:{uniqueIDs:'通过',requiredFields:'通过',prerequisiteReferences:'通过',dependencyCycles:'无',localMarkdownLinks:'通过',selfContainedHTML:'通过',examEvidenceRecords:meta.evidence.length,numericalSpotChecks:numeric.length},numerical:numeric,limits:['自动数值检查为抽查，不是全部正文的机器证明。','外部来源链接有访问权限、网络及站点变更限制。','结构检查不等于完成全部教材逐页对照或地区考纲核对。']};
write(path.join(root,'质量检查.json'),JSON.stringify(quality,null,2));
for(const name of ['build_kb.mjs','build_diagrams.mjs','verify_v11.mjs','reader.css','reader.js','reader.template.html']){const src=path.join(here,name),dest=path.join(root,'构建工具',name);if(path.resolve(src)!==path.resolve(dest))write(dest,read(src));}
console.log(JSON.stringify({output:root,...stats,dependencyOrder:order,checks:quality.checks},null,2));
