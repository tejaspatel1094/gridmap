from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class State(Base):
    __tablename__ = "states"

    code = Column(String(2), primary_key=True)
    name = Column(String, nullable=False)
    is_national = Column(Boolean, nullable=False, default=False)


class Generation(Base):
    __tablename__ = "generation"

    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), ForeignKey("states.code"), nullable=False)
    year = Column(Integer, nullable=False)
    fuel_code = Column(String(10), nullable=False)
    fuel_name = Column(String, nullable=False)
    generation = Column(Float, nullable=False)
    units = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("state_code", "year", "fuel_code", name="uq_state_year_fuel"),
    )