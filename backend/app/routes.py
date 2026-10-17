from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Generation, State
from app.schemas import (
    FuelSlice,
    GenerationResponse,
    StateTotal,
    StatesResponse,
    YearsResponse,
)

router = APIRouter(prefix="/api")


@router.get("/years", response_model=YearsResponse)
def get_years(db: Session = Depends(get_db)):
    rows = db.execute(select(distinct(Generation.year)).order_by(Generation.year)).scalars().all()
    if not rows:
        raise HTTPException(status_code=404, detail="No data loaded")
    return YearsResponse(years=list(rows), latest=max(rows))


@router.get("/states", response_model=StatesResponse)
def get_states(year: int = Query(...), db: Session = Depends(get_db)):
    stmt = (
        select(
            State.code,
            State.name,
            func.sum(Generation.generation).label("total"),
            func.min(Generation.units).label("units"),
        )
        .join(Generation, Generation.state_code == State.code)
        .where(Generation.year == year, State.is_national.is_(False))
        .group_by(State.code, State.name)
        .order_by(func.sum(Generation.generation).desc())
    )
    rows = db.execute(stmt).all()
    units = rows[0].units if rows else ""
    return StatesResponse(
        year=year,
        units=units,
        states=[StateTotal(code=r.code, name=r.name, total=r.total) for r in rows],
    )


@router.get("/generation", response_model=GenerationResponse)
def get_generation(
    year: int = Query(...),
    state: str = Query("US"),
    db: Session = Depends(get_db),
):
    state = state.upper()
    state_row = db.get(State, state)
    if state_row is None:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state}")

    stmt = (
        select(Generation)
        .where(Generation.state_code == state, Generation.year == year)
        .order_by(Generation.generation.desc())
    )
    rows = db.execute(stmt).scalars().all()

    total = sum(r.generation for r in rows)
    denominator = sum(r.generation for r in rows if r.generation > 0) or 1

    return GenerationResponse(
        year=year,
        state=state,
        name=state_row.name,
        units=rows[0].units if rows else "",
        total=total,
        fuels=[
            FuelSlice(
                code=r.fuel_code,
                name=r.fuel_name,
                generation=r.generation,
                percent=round(r.generation / denominator * 100, 2),
            )
            for r in rows
        ],
    )