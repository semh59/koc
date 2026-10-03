# USDA SR Legacy (CC0) CSV'sinden, kaynak dosyalardaki anahtarların çözdüğü kayıtları usda-altkume.json'a yazar.
# Kullanım: python tools/besin/cikar.py <FoodData_Central_sr_legacy_food_csv_2018-04 klasörü> [ara kelime,kelime ...]
# Zip: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
import csv,json,os,sys
D=sys.argv[1].rstrip('/\\')+'/';H=os.path.dirname(os.path.abspath(__file__))+'/'
N={'1008':'k','1003':'p','1005':'c','1004':'f','1079':'l'}
rd=lambda f:csv.DictReader(open(D+f,encoding='utf-8'))
desc={r['fdc_id']:r['description'] for r in rd('food.csv')}
nut={}
for r in rd('food_nutrient.csv'):
    if r['nutrient_id'] in N:nut.setdefault(r['fdc_id'],{})[N[r['nutrient_id']]]=float(r['amount'])
full={i for i,v in nut.items() if all(k in v for k in 'kpcf')}
def coz(kw):
    if kw.startswith('#'):return kw[1:]
    ks=[k.strip().lower() for k in kw.split(',')]
    c=[i for i in full if all(k in desc[i].lower() for k in ks)]
    return min(c,key=lambda i:(len(desc[i]),int(i))) if c else None
if len(sys.argv)>2:
    for kw in sys.argv[2:]:
        ks=[k.strip().lower() for k in kw.split(',')]
        c=sorted((i for i in full if all(k in desc[i].lower() for k in ks)),key=lambda i:(len(desc[i]),int(i)))[:int(os.environ.get('N','3'))]
        print('##',kw)
        for i in c:print(f"  #{i} {nut[i]['k']:.0f}kcal {desc[i][:95]}")
    sys.exit()
por={}
for r in rd('food_portion.csv'):
    por.setdefault(r['fdc_id'],[]).append([(r['amount']+' '+r['modifier']).strip()+' '+r['portion_description'],float(r['gram_weight'])])
anah=set()
for f in ('genel.tsv','malzeme.tsv','ek.tsv'):
    for l in open(H+f,encoding='utf-8'):
        if l.strip() and not l.startswith('#'):anah.add(l.split('\t')[1].strip())
out={};hata=[]
for kw in sorted(k for k in anah if k[:4] not in('ciq:','cof:')):
    i=coz(kw)
    if not i or i not in full:hata.append(kw);continue
    out[kw]=dict(id=int(i),d=desc[i],**nut[i],por=por.get(i,[]))
if hata:sys.exit('ÇÖZÜLEMEYEN: '+' | '.join(hata))
json.dump(out,open(H+'usda-altkume.json','w',encoding='utf-8'),ensure_ascii=False,indent=0,separators=(',',':'))
print(len(out),'kayıt yazıldı')
