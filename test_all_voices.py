import sys
sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from app.main import app, VOICE_CATALOG

client = TestClient(app)

print(f"Total catalog size: {len(VOICE_CATALOG)}")
for v in VOICE_CATALOG:
    vid = v['id']
    vname = v['name']
    res = client.post('/api/tts/generate', data={
        'text': 'Hello, testing TideTone speech synthesis.',
        'voice_id': vid,
        'session_id': 'test_all'
    })
    status = res.status_code
    succ = res.json().get('success')
    print(f"Voice {vname} ({vid}): HTTP {status}, Success={succ}")
