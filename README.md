# Impact ON ESG 규제 트래커

## 실행 방법

### 백엔드 (터미널 1)
```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드 (터미널 2)
```bash
cd frontend
npm install
npm run dev
```

브라우저: http://localhost:3000
