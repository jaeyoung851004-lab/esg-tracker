from pydantic import BaseModel, Field

class Regulation(BaseModel):
    id: str
    code: str
    title: str
    category: str
    country: str
    industry: str
    status: str
    statusTone: str = Field(alias="statusTone")
    deadline: str
    dDay: int = Field(alias="dDay")
    readiness: int
    risk: str
    priority: str
    summary: str

class NewsItem(BaseModel):
    id: str
    source: str
    title: str
    age: str
    url: str

class DashboardStats(BaseModel):
    totalRegulations: int
    urgentTasks: int
    averageReadiness: int
    highPriority: int
