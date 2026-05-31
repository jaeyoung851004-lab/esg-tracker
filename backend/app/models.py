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
    korean_company_note: str = ""
    company_mapping: dict[str, Any] = Field(default_factory=dict)
    why_it_matters: str = ""


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
    actorType: str = "시장/솔루션"
    newsType: str = "시장 동향"
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


class NewsResponse(BaseModel):
    items: list[NewsItem]
    count: int
    lookbackDays: int
    generatedAt: str
    regulationId: str | None = None
    availableRegulations: list[NewsRegulationMeta] = Field(default_factory=list)
    regionCounts: list[RegionCount] = Field(default_factory=list)


class DashboardStats(BaseModel):
    totalRegulations: int
    activeOrPhased: int
    watchItems: int
    officialSources: int
    newsEnabled: int
