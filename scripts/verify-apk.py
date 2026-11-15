"""Check offline contents. Release flags and signatures are checked with Android tools."""
import json, sys, zipfile
from pathlib import Path
apk=Path(sys.argv[1])
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    names=set(z.namelist())
    for n in ['AndroidManifest.xml','classes.dex','assets/public/index.html','assets/public/data/districts.geojson']:
        assert n in names,n
    assert json.loads(z.read('assets/capacitor.config.json'))['appId']=='bd.amardesh.explorer'
    for name,count in [('districts',64),('divisions',8),('attractions',103)]:
        data=json.loads(z.read('assets/public/data/'+name+'.json'))
        assert data['version']==3 and len(data['items'])==count
    assert len(json.loads(z.read('assets/public/data/foods.json'))['items'])>=23
    for c in json.loads(z.read('assets/public/photos/credits.json')):
        for size in ['thumb','hero']:assert f"assets/public/photos/{c['id']}-{size}.webp" in names
    plugins=json.loads(z.read('assets/capacitor.plugins.json'))
    assert len(plugins)>=8
print(f'Offline release contents verified: {apk.stat().st_size} bytes')
