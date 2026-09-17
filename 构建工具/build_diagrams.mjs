import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.argv[2]||(path.basename(here)==='构建工具'?path.dirname(here):path.join(here,'../outputs/数学知识库')));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line=(x1,y1,x2,y2,cls='line')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const txt=(x,y,s,cls='label')=>`<text x="${x}" y="${y}" class="${cls}">${esc(s)}</text>`;
const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" fill="#245c4d"/>`;
const poly=(ps,cls='shape')=>`<polygon points="${ps.map(p=>p.join(',')).join(' ')}" class="${cls}"/>`;
function svg(id,title,desc,body){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 450" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc><defs><clipPath id="${id}-clip"><rect x="72" y="55" width="485" height="325"/></clipPath></defs><style>text{font-family:'Microsoft YaHei','PingFang SC',sans-serif;fill:#203833;font-size:18px}.title{font-size:22px;font-weight:bold}.small{font-size:16px}.label{font-size:18px}.line{stroke:#245c4d;stroke-width:3;fill:none}.axis{stroke:#91a69b;stroke-width:1.5}.dash{stroke:#ad7138;stroke-width:2.5;stroke-dasharray:7 5;fill:none}.shape{stroke:#245c4d;stroke-width:2;fill:#e8f0e7}.curve{stroke:#245c4d;stroke-width:3;fill:none}.highlight{stroke:#b26e36;stroke-width:3;fill:none}.faint{stroke:#b9c7bd;stroke-width:2;fill:none}</style><rect width="720" height="450" rx="12" fill="#fffefa"/>${txt(28,32,title,'title')}${body}</svg>`;}
const entries=[];
function add(moduleId,title,caption,body,desc=caption){const file=moduleId+'.svg';const data=svg(moduleId,title,desc,body).replace(/<style>([\s\S]*?)<\/style>/,(_,css)=>'<style>'+css.replace(/(^|})([^{}]+)\{/g,(_,sep,selector)=>sep+'svg '+selector+'{')+'</style>');fs.mkdirSync(path.join(root,'图解'),{recursive:true});fs.writeFileSync(path.join(root,'图解',file),data);entries.push({moduleId,title,caption,file:'图解/'+file});}
add('J16','中线为什么也是高？先全等，再判角', '图中AB=AC，BD=CD，AD为公共边。△ABD与△ACD由SSS全等，再由邻补角推出两个角都是90°。图形只是关系示意，不能用“看起来垂直”代替证明。',
 poly([[320,70],[120,320],[520,320]])+line(320,70,320,320,'dash')+line(211,189,228,203)+line(412,189,429,203)+line(215,311,215,329)+line(225,311,225,329)+line(415,311,415,329)+line(425,311,425,329)+txt(310,60,'A')+txt(94,345,'B')+txt(527,345,'C')+txt(309,348,'D')+txt(52,396,'相同刻痕表示已知相等；虚线AD是两三角形的公共边。'));
add('J23','勾股定理的面积证明', '示意选a=2、b=3，外正方形边长a+b。四个角放全等直角三角形，中间四边形的边长都是c、角都是90°。外面积=(四个三角形面积)+c²，得到(a+b)²=2ab+c²。',
 poly([[50,80],[350,80],[350,380],[50,380]])+poly([[170,80],[350,200],[230,380],[50,260]])+txt(101,68,'a')+txt(255,68,'b')+txt(368,145,'a')+txt(368,290,'b')+txt(198,230,'c²')+txt(262,132,'c')+txt(50,416,'四个三角形：总面积 4×ab/2')+txt(420,150,'外面积：(a+b)²')+txt(420,203,'分块合计：2ab+c²')+txt(420,256,'相减：a²+b²=c²')+txt(420,322,'图示帮助理解；','small')+txt(420,350,'角度与面积理由见正文。','small'));
function plot(id,bounds){const [xmin,xmax,ymin,ymax]=bounds;const X=x=>72+(x-xmin)/(xmax-xmin)*485,Y=y=>380-(y-ymin)/(ymax-ymin)*325;
 const axes=line(72,Y(0),557,Y(0),'axis')+line(X(0),55,X(0),380,'axis')+txt(566,Y(0)+4,'x')+txt(X(0)-18,51,'y');
 const curve=(f,a,b,cls='curve')=>{const points=Array.from({length:201},(_,i)=>{const x=a+(b-a)*i/200;return X(x)+','+Y(f(x));});return `<polyline points="${points.join(' ')}" class="${cls}" clip-path="url(#${id}-clip)"/>`;};
 return {X,Y,axes,curve};}
{
 const p=plot('J33',[-.6,4.2,-3.8,2.2]),{X,Y}=p;
 add('J33','闭区间最值：顶点之外，还要看端点', 'y=(x−2)²−3，深绿部分是题设0≤x≤3；浅灰部分只作趋势提示，不属于本题允许范围。顶点(2,−3)给最小值，比较端点(0,1)、(3,−2)得最大值1。',p.axes+p.curve(x=>(x-2)**2-3,-.6,4.2,'faint')+p.curve(x=>(x-2)**2-3,0,3)+line(X(2),Y(-3.5),X(2),Y(1.5),'dash')+dot(X(0),Y(1))+dot(X(2),Y(-3))+dot(X(3),Y(-2))+txt(X(0)+12,Y(1)-8,'(0,1)')+txt(X(2)-38,Y(-3)+30,'(2,−3)')+txt(X(3)+13,Y(-2),'(3,−2)')+txt(100,420,'先查定义范围 → 顶点是否允许 → 比较候选值'));
}
{
 const o=[280,210],a=[420,140],b=[350,350];
 add('H13','点积为0：先确认向量非零', '两个向量起点同在O；a=(2,1)，b=(1,−2)。坐标轴等比例，a·b=2×1+1×(−2)=0且两向量非零，因此夹角90°；长度都是√5。',line(80,210,600,210,'axis')+line(280,65,280,375,'axis')+line(...o,...a)+line(...o,...b)+dot(...a)+dot(...b)+txt(255,235,'O')+txt(434,134,'a=(2,1)')+txt(364,364,'b=(1,−2)')+txt(603,216,'x')+txt(259,62,'y')+line(298,201,307,219)+line(307,219,289,228)+txt(67,412,'点积是实数；零向量没有确定的几何夹角。'));
}
{
 const p=plot('H28',[-2.4,2.4,-3,3]),{X,Y}=p;
 add('H28','极值与闭区间最值：别漏端点', 'f(x)=x³−3x，范围[−2,2]。导数在(−2,−1)、(1,2)为正，在(−1,1)为负。两个驻点与两个端点的函数值都要比较；本例最大值、最小值各在两处取得。',p.axes+p.curve(x=>x**3-3*x,-2,2)+[-2,-1,1,2].map(x=>dot(X(x),Y(x**3-3*x))).join('')+txt(X(-2)-32,Y(-2)+27,'(−2,−2)')+txt(X(-1)-55,Y(2)-12,'(−1,2)')+txt(X(1)-22,Y(-2)+27,'(1,−2)')+txt(X(2)-8,Y(2)-12,'(2,2)')+txt(112,420,'导数符号：   ＋             −              ＋'));
}
add('H33','全概率：先沿路径相乘，再把互斥路径相加', '产品来源甲、乙互斥且穷尽。P(甲)=0.6，P(次品|甲)=0.02；P(乙)=0.4，P(次品|乙)=0.05。甲且次品概率0.012，乙且次品概率0.020，总次品概率0.032。其余分支为正品，不能把0.02与0.05直接相加。',
 line(80,230,250,135)+line(80,230,250,325)+line(290,135,490,85)+line(290,135,490,180)+line(290,325,490,275)+line(290,325,490,370)+txt(32,236,'产品')+txt(258,141,'甲')+txt(258,331,'乙')+txt(150,157,'0.6')+txt(150,319,'0.4')+txt(367,95,'0.02')+txt(367,178,'0.98')+txt(367,284,'0.05')+txt(367,374,'0.95')+txt(500,90,'次品：0.012')+txt(500,185,'正品：0.588')+txt(500,280,'次品：0.020')+txt(500,375,'正品：0.380')+txt(54,425,'P(次品)=0.012+0.020=0.032；四个末端概率之和为1。'));
{
 const p=plot('A06',[0,4.6,-1,18]),{X,Y}=p;
 add('A06','中值定理：某条切线平行于割线', '原例f(x)=x²在[1,4]连续、在(1,4)可导。割线斜率(16−1)/(4−1)=5；f′(2.5)=5，因此内部点ξ=2.5处切线平行于割线。图示不能证明对所有函数的存在性；一般证明在正文。',p.axes+p.curve(x=>x*x,.2,4.2)+p.curve(x=>5*x-4,1,4,'highlight')+p.curve(x=>5*x-6.25,1.2,4.1,'dash')+[1,2.5,4].map(x=>dot(X(x),Y(x*x))).join('')+txt(X(1)-42,Y(1)+25,'(1,1)')+txt(X(2.5)+12,Y(6.25)+24,'(2.5,6.25)')+txt(X(4)+6,Y(16),'(4,16)')+txt(588,160,'绿：曲线','small')+txt(588,198,'棕：割线','small')+txt(588,236,'虚：切线','small')+txt(72,420,'“存在至少一点”不等于“每一点”，也不保证唯一。'));
}
add('A11','投影：把向量拆成平行分量与垂直残差', '示例u=(2,1)，v=(1,0)。投影系数t=(u·v)/||v||²=2，投影tv=(2,0)，残差u−tv=(0,1)与v正交。非负残差范数是正文柯西证明的关键；一般定理不依赖二维图形。',
 line(110,335,540,335,'axis')+line(110,335,110,85,'axis')+line(110,335,410,185)+line(110,335,410,335,'highlight')+line(410,335,410,185,'dash')+dot(410,185)+dot(410,335)+line(390,335,390,315,'axis')+line(390,315,410,315,'axis')+txt(87,363,'O')+txt(410,165,'u=(2,1)')+txt(325,371,'tv=(2,0)')+txt(430,258,'u−tv=(0,1)')+txt(178,319,'v=(1,0)')+dot(260,335)+txt(67,419,'v≠0才可以除以||v||²；v=0的情况要单独处理。'));
fs.mkdirSync(path.join(root,'扩充资料'),{recursive:true});
fs.writeFileSync(path.join(root,'扩充资料','图解索引.json'),JSON.stringify(entries,null,2));
console.log('Generated '+entries.length+' SVG mathematical diagrams.');
