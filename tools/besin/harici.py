# harici.tsv'deki CIQUAL ve CoFID kayıtlarını harici.json'a yazar (değerler kaynaktan okunur, elle yazılmaz).
# Kullanım: python tools/besin/harici.py <CIQUAL 2025 klasörü (alim_*.xml, compo_*.xml)> <CoFID 2021 xlsx>
# CIQUAL: https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY (Etalab 2.0). CoFID: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid (OGL v3).
# Karbonhidrat USDA tanımına çevrilir (lif dahil): CIQUAL 31000+34100, CoFID Carbohydrate + AOAC lifi. Protein CIQUAL 25000 (Jones faktörlü), enerji kcal (CIQUAL 328).
import glob,json,os,re,sys
import openpyxl
H=os.path.dirname(os.path.abspath(__file__))+'/'
anah=[l.split('\t')[0].strip() for l in open(H+'harici.tsv',encoding='utf-8') if l.strip() and not l.startswith('#')]
num=lambda s:0.0 if s.strip().startswith(('traces','Tr','-')) else float(s.strip().replace('&lt;','').lstrip('<').strip().replace(',','.') or 'nan')
out={}
cq=[k[4:] for k in anah if k.startswith('ciq:')]
if cq:
    rd=lambda p:open(glob.glob(sys.argv[1]+'/'+p)[0],encoding='utf-8-sig').read()
    ad={m[0]:m[1] for m in re.findall(r'<alim_code>\s*(\d+)\s*</alim_code>\s*<alim_nom_fr>[^<]*</alim_nom_fr>\s*<alim_nom_eng>\s*([^<]*?)\s*</alim_nom_eng>',rd('alim_2*.xml'))}
    W={'328':'k','25000':'p','31000':'c','34100':'l','40000':'f'};v={}
    for a,c,t in re.findall(r'<alim_code>\s*(\d+)\s*</alim_code>\s*<const_code>\s*(\d+)\s*</const_code>\s*<teneur>\s*([^<]*?)\s*</teneur>',rd('compo_2*.xml')):
        if a in cq and c in W:v.setdefault(a,{})[W[c]]=num(t)
    for a in cq:
        x=v[a];x['c']=x['c']+x.get('l',0.0)
        out['ciq:'+a]=dict(d=ad[a].replace('&apos;',"'"),k=x['k'],p=x['p'],c=round(x['c'],2),f=x['f'])
cf=[k[4:] for k in anah if k.startswith('cof:')]
if cf:
    ws=openpyxl.load_workbook(sys.argv[2],read_only=True)['1.3 Proximates']
    for i,r in enumerate(ws.iter_rows(values_only=True)):
        if r[0] in cf:
            n=lambda j:0.0 if r[j] in('Tr',None) else float(r[j])
            out['cof:'+r[0]]=dict(d=r[1],k=n(12),p=n(9),c=round(n(11)+n(25),2),f=n(10))
bozuk=[k for k,x in out.items() if abs(x['k']-4*x['p']-4*x['c']-9*x['f'])>0.15*x['k']+5]
if bozuk:sys.exit('KCAL/MAKRO TUTMUYOR (eksik bileşen?): '+' | '.join(bozuk))
miss=[k for k in anah if k not in out]
if miss:sys.exit('ÇÖZÜLEMEYEN: '+' | '.join(miss))
json.dump(out,open(H+'harici.json','w',encoding='utf-8'),ensure_ascii=False,indent=0,separators=(',',':'))
print(len(out),'kayıt yazıldı')
