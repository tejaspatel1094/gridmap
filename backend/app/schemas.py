from typing import List

from pydantic import BaseModel


class YearsResponse(BaseModel):
    years: List[int]
    latest: int


class StateTotal(BaseModel):
    code: str
    name: str
    total: float


class StatesResponse(BaseModel):
    year: int
    units: str
    states: List[StateTotal]


class FuelSlice(BaseModel):
    code: str
    name: str
    generation: float
    percent: float


class GenerationResponse(BaseModel):
    year: int
    state: str
    name: str
    units: str
    total: float
    fuels: List[FuelSlice]