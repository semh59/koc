# Besin listesini USDA SR Legacy (CC0) ile karşılaştırır. Kullanım:
# 1) https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip dosyasını bu betiğin yanına açın
# 2) PYTHONIOENCODING=utf-8 python tools/usda-karsilastir.py
import csv,re,subprocess,json,sys
import os
D=os.path.dirname(os.path.abspath(__file__))+'/FoodData_Central_sr_legacy_food_csv_2018-04/'
desc={r['fdc_id']:r['description'] for r in csv.DictReader(open(D+'food.csv',encoding='utf-8'))}
N={'1008':'k','1003':'p','1005':'c','1004':'f'};nut={}
for r in csv.DictReader(open(D+'food_nutrient.csv',encoding='utf-8')):
    if r['nutrient_id'] in N: nut.setdefault(r['fdc_id'],{})[N[r['nutrient_id']]]=float(r['amount'])
# my foods from foods.js via node
js=subprocess.run(['node','-e','console.log(JSON.stringify(require(process.cwd()+"/www/foods.js").FOODS))'],capture_output=True,encoding='utf-8').stdout
mine={f['n']:f for f in json.loads(js)}
# mapping: my name -> list of keywords (all must appear in USDA description, lowercase); first by shortest description
M={
"Haşlanmış yumurta":["egg, whole, cooked, hard-boiled"],"Sahanda yumurta":["egg, whole, cooked, fried"],"Omlet":["egg, whole, cooked, omelet"],
"Beyaz peynir":["cheese, feta"],"Kaşar peyniri":["cheese, provolone"],"Lor peyniri":["cheese, ricotta, part skim"],
"Zeytin":["olives, ripe, canned"],"Bal":["honey"],"Reçel":["jams and preserves"],"Tahin":["seeds, sesame butter, tahini"],
"Tereyağı":["butter, salted"],"Zeytinyağı":["oil, olive, salad"],"Yulaf ezmesi (kuru)":["cereals, oats, regular and quick"],
"Beyaz ekmek":["bread, white, commercially"],"Tam buğday ekmeği":["bread, whole-wheat, commercially"],
"Pizza":["pizza, cheese topping, regular crust"],
"Pirinç pilavı":["rice, white, long-grain, regular, cooked"],"Bulgur pilavı":["bulgur, cooked"],"Makarna (haşlanmış)":["pasta, cooked, enriched, without added salt"],
"Kuru fasulye yemeği":["beans, white, mature seeds, cooked, boiled, without salt"],"Nohut (haşlanmış)":["chickpeas","cooked, boiled, without salt"],
"Mercimek (haşlanmış)":["lentils, mature seeds, cooked, boiled, without salt"],"Humus":["hummus, commercial"],
"Izgara tavuk göğsü":["chicken, broilers or fryers, breast, meat only, cooked, roasted"],"Fırın tavuk but":["chicken, broilers or fryers, drumstick, meat only, cooked, roasted"],
"Pişmiş kıyma":["beef, ground, 80% lean meat / 20% fat, patty, cooked, broiled"],
"Izgara balık (levrek, çipura)":["fish, bass, striped, cooked, dry heat"],"Izgara somon":["fish, salmon, atlantic, farmed, cooked, dry heat"],
"Ton balığı (konserve, suda)":["fish, tuna, light, canned in water, drained solids"],
"Domates":["tomatoes, red, ripe, raw, year round average"],"Salatalık":["cucumber, with peel, raw"],"Havuç":["carrots, raw"],"Yeşil salata":["lettuce, green leaf, raw"],
"Brokoli (haşlanmış)":["broccoli, cooked, boiled, drained, without salt"],"Haşlanmış patates":["potatoes, boiled, cooked in skin, flesh, without salt"],
"Patates kızartması":["potatoes, french fried, all types, salt added in processing, frozen, home-prepared, oven heated"],
"Haşlanmış mısır":["corn, sweet, yellow, cooked, boiled, drained, without salt"],
"Süt (tam yağlı)":["milk, whole, 3.25% milkfat, with added vitamin d"],"Yoğurt (tam yağlı)":["yogurt, plain, whole milk"],"Kola":["beverages, carbonated, cola, contains caffeine"],"Şeker":["sugars, granulated"],
"Elma":["apples, raw, with skin"],"Muz":["bananas, raw"],"Portakal":["oranges, raw, all commercial varieties"],"Mandalina":["tangerines, (mandarin oranges), raw"],
"Çilek":["strawberries, raw"],"Üzüm":["grapes, red or green (european type"],"Karpuz":["watermelon, raw"],"Kavun":["melons, cantaloupe, raw"],
"Şeftali":["peaches, yellow, raw"],"Armut":["pears, raw"],"Kiraz":["cherries, sweet, raw"],"İncir (taze)":["figs, raw"],"Kivi":["kiwifruit, green, raw"],"Nar":["pomegranates, raw"],
"Kuru üzüm":["raisins, seedless"],"Kuru kayısı":["apricots, dried, sulfured, uncooked"],"Fındık":["nuts, hazelnuts or filberts"],"Ceviz":["nuts, walnuts, english"],"Badem":["nuts, almonds"],
"Sütlü çikolata":["candies, milk chocolate"],"Dondurma":["ice creams, vanilla"],"Cips":["snacks, potato chips, plain, salted"],
}
rows=[];miss=[]
for n,kw in M.items():
    c=[i for i,d in desc.items() if all(k in d.lower() for k in kw) and i in nut and 'k' in nut[i]]
    if not c: miss.append(n);continue
    i=min(c,key=lambda x:len(desc[x]));u=nut[i];m=mine[n]
    d=lambda a,b:(a-b)/b*100 if b else 0
    rows.append((n,desc[i][:48],m['k'],u['k'],d(m['k'],u['k']),m['p'],u.get('p',0),m['c'],u.get('c',0),m['f'],u.get('f',0)))
print("ESLESMEYEN:",miss)
print(f"{'Besin':28}{'USDA kaydı':50}{'kcal(ben/USDA/%)':22}{'P':12}{'K':12}{'Y':12}")
for r in sorted(rows,key=lambda r:-abs(r[4])):
    print(f"{r[0][:27]:28}{r[1]:50}{r[2]:>5.0f}/{r[3]:<5.0f}{r[4]:>+6.0f}%   {r[5]:>4.1f}/{r[6]:<4.1f}  {r[7]:>4.1f}/{r[8]:<4.1f}  {r[9]:>4.1f}/{r[10]:<4.1f}")
big=[r for r in rows if abs(r[4])>15];print("\n>%15 sapma:",len(big),"/",len(rows)); import statistics as s;print("medyan mutlak sapma %:",round(s.median(abs(r[4]) for r in rows),1))

# doğrulanmış (USDA ile uyumlu) besin adlarını yaz
ver=[r[0] for r in rows if abs(r[4])<=6 and abs(r[5]-r[6])<=1.5 and abs(r[7]-r[8])<=2 and abs(r[9]-r[10])<=1.5]
json.dump(ver,open(os.path.dirname(os.path.abspath(__file__))+'/verified.json','w',encoding='utf-8'),ensure_ascii=False)
print("DOĞRULANAN:",len(ver))
