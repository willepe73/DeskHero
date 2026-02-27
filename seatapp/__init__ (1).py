from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)

    floors: Mapped[list[Floor]] = relationship(back_populates="building")


class Floor(Base):
    __tablename__ = "floors"
    __table_args__ = (UniqueConstraint("building_id", "floor_number", name="uq_floor"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), index=True)
    floor_number: Mapped[int] = mapped_column(Integer, index=True)
    floorplan_file: Mapped[str | None] = mapped_column(String, nullable=True)

    building: Mapped[Building] = relationship(back_populates="floors")
    seats: Mapped[list[Seat]] = relationship(back_populates="floor")


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = (UniqueConstraint("floor_id", "seat_number", name="uq_seat"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    floor_id: Mapped[int] = mapped_column(ForeignKey("floors.id"), index=True)
    seat_number: Mapped[int] = mapped_column(Integer, index=True)

    floor: Mapped[Floor] = relationship(back_populates="seats")
    reservations: Mapped[list[Reservation]] = relationship(back_populates="seat")


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (UniqueConstraint("seat_id", "date", name="uq_reservation"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seat_id: Mapped[int] = mapped_column(ForeignKey("seats.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    reserved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    seat: Mapped[Seat] = relationship(back_populates="reservations")


