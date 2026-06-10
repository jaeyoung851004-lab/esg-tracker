from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RegulationSummary(BaseModel):
    id: str
    code: str
    title: str
    titleEn: str = Field(alias="titleEn")
    category: str
    region: str
    industry: str
    status: str
    statusKey: str = Field(alias="statusKey")
    statusTone: str = Field(alias="statusTone")
    deadline: str
    deadlineLabel: str = Field(alias="deadlineLabel")
    dDay: int | None = Field(alias="dDay")
    risk: str
    priority: str
    summary: str
    whyItMatters: str = Field(alias="whyItMatters")
    affectedIndustries: list[str] = Field(alias="affectedIndustries")
    sourceCount: int = Field(alias="sourceCount")
    historyCount: int = Field(alias="historyCount")
    checkpointCount: int = Field(alias="checkpointCount")
    newsQueryCount: int = Field(alias="newsQueryCount")
    tracking: dict[str, Any] = Field(default_factory=dict)
    officialMetadata: dict[str, Any] = Field(default_factory=dict, alias="officialMetadata")
    sourceName: str = Field(default="", alias="sourceName")
    sourceUrl: str = Field(default="", alias="sourceUrl")
    celexId: str = Field(default="", alias="celexId")
    officialDocumentUrl: str = Field(default="", alias="officialDocumentUrl")
    lastSyncedAt: str | None = Field(default=None, alias="lastSyncedAt")
    lastVerifiedAt: str | None = Field(default=None, alias="lastVerifiedAt")


class RegulationDetail(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    acronym: str
    name_ko: str
    name_en: str
    category: str
    legal: dict[str, Any]
    ai_layer: dict[str, Any]
    news_config: dict[str, Any] = Field(default_factory=dict)
    history: list[dict[str, Any]] = Field(default_factory=list)
    display: dict[str, Any]
    action_checkpoints: dict[str, list[str] | str] = Field(default_factory=dict)
    tracking: dict[str, Any] = Field(default_factory=dict)
    korean_company_note: str = ""
    company_mapping: dict[str, Any] = Field(default_factory=dict)
    why_it_matters: str = ""
    official_metadata: dict[str, Any] = Field(default_factory=dict)
    source_name: str = ""
    source_url: str = ""
    celex_id: str = ""
    official_document_url: str = ""
    last_synced_at: str | None = None
    last_verified_at: str | None = None


class NewsItem(BaseModel):
    id: str
    title: str
    titleKo: str = ""
    originalTitle: str = ""
    url: str
    source: str
    sourceRegion: str = ""
    publishedAt: str
    age: str = ""
    regulationId: str
    relatedRegulationIds: list[str] = Field(default_factory=list)
    relatedRegulationNames: list[str] = Field(default_factory=list)
    sourceType: str = "언론"
    actorType: str = "언론/기타"
    newsType: str = "시장 동향"
    reactionType: str = "기타"
    relevanceScore: int = 0
    importanceScore: int = 0
    summary: str = ""


class NewsRegulationMeta(BaseModel):
    id: str
    code: str
    name: str
    count: int


class RegionCount(BaseModel):
    region: str
    count: int


class TypeCount(BaseModel):
    type: str
    count: int


class SourceCount(BaseModel):
    source: str
    count: int


class NewsResponse(BaseModel):
    items: list[NewsItem]
    count: int
    lookbackDays: int
    generatedAt: str
    regulationId: str | None = None
    availableRegulations: list[NewsRegulationMeta] = Field(default_factory=list)
    regionCounts: list[RegionCount] = Field(default_factory=list)
    reactionTypeCounts: list[TypeCount] = Field(default_factory=list)
    actorTypeCounts: list[TypeCount] = Field(default_factory=list)
    sourceTypeCounts: list[TypeCount] = Field(default_factory=list)
    topSources: list[SourceCount] = Field(default_factory=list)


class DashboardStats(BaseModel):
    totalRegulations: int
    activeOrPhased: int
    watchItems: int
    officialSources: int
    newsEnabled: int
