
# Impact ON ESG Regulation Intelligence — Product Vision

## 핵심 정의
이 서비스는 ESG 뉴스 사이트가 아니다.
"기업 ESG 담당자의 규제 관제실(Regulation Intelligence Workspace)"이다.

## 타깃 사용자
대기업·중견기업 ESG팀 실무자.
규제를 처음 배우는 사람이 아니라 이미 알고 있으며,
변화 추적과 영향 해석이 필요한 사람.

## 사용자가 매일 묻는 질문
1. 최근 어떤 규제가 변경되었는가?
2. 우리 회사에 영향을 주는가?
3. 언제까지 모니터링해야 하는가?
4. 다른 기업들은 어떻게 대응하고 있는가?

## 화면 구조 (v6 목표)
최초 1회: 로그인 → 기업 설정 → 진단 결과 → 관심 규제(홈)
일상: 관심 규제 → 최근 변경사항 → 시장 반응 → 규제 상세

## 메뉴 구조
- 관심 규제 (홈, Watchlist) ← 로그인 후 첫 화면
- 최근 변경사항
- 시장 반응
- 규제 라이브러리
- 설정

## 절대 원칙
- 숫자 KPI 카드 남발 금지
- 뉴스 목록 나열 금지
- 지도·차트는 실제 의사결정에 기여할 때만 사용
- 한 화면당 핵심 메시지 1개
- 뉴스는 "변화 데이터"와 "시장 반응 데이터"로 구조화

## DB 구조 (8개 테이블)
REG_MASTER / REG_TRACKING / REG_SCOPE /
REG_CONDITIONS / REG_SOURCES /
TRACKING_UNITS / CHECKPOINTS / REG_RELATIONSHIPS

## 각 화면이 답하는 질문
- 관심 규제: 무엇을 계속 봐야 하는가
- 최근 변경사항: 무슨 일이 있었는가
- 시장 반응: 남들은 어떻게 대응하는가
- 규제 상세: 이 규제는 정확히 무엇인가

## 디자인 지향점
- Stripe Dashboard 수준의 단순함
- 텍스트 정보 밀도 우선
- 카드 테두리·색상으로 상태 전달
- Bloomberg Terminal처럼 복잡하게 만들지 않음

## 관리 대상 규제 (15개)
ESPR / PPWR / CSDDD / CSRD / CBAM / EUDR / GCD /
AI Act / Battery Regulation / DPP / ELV /
California SB253 / California SB261 /
SEC Climate Disclosure Rule / IMO Net-Zero Framework
