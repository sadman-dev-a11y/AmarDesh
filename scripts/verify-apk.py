"""Validate the built APK's bundled offline app; signature is checked by apksigner."""
import json
from pathlib import Path
import sys
import zipfile

apk = Path(sys.argv[1])
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None, 'Corrupt APK archive'
    names = set(archive.namelist())
    for required in ['AndroidManifest.xml', 'classes.dex', 'assets/public/index.html']:
        assert required in names, f'Missing {required}'
    config = json.loads(archive.read('assets/capacitor.config.json'))
    assert config['appId'] == 'bd.amardesh.explorer', 'Incorrect application ID'
    credits = json.loads(Path('public/photos/credits.json').read_text())
    for photo in credits:
        assert 'assets/public/photos/' + photo['id'] + '.jpg' in names, 'Missing bundled photo'
    assert not any('maplibre' in n or n.endswith('districts.geojson') for n in names)
    bundle = b''.join(archive.read(n) for n in names if n.startswith('assets/public/assets/') and n.endswith('.js'))
    assert b'Keep your next adventure close.' in bundle and b'Mezbani beef' in bundle
print(f'APK verified: {apk.stat().st_size} bytes; {len(credits)} bundled photographs; correct app identity and offline content')
