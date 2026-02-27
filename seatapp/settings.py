from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import SessionLocal, engine
from .models import Base, Building, Floor, Seat
from .seat_registry import load_floorplan_seats
from .settings import settings
from .api.reservations import router as reservations_router
from .api.locations import router as locations_router

import uvicorn #to run this backend api on a local port


def _seed_seats_from_floorplans() -> None:
    floorplan_seats = load_floorplan_seats(
        floorplans_dir=settings.floorplans_dir,
        cache_path=settings.seat_registry_cache_path,
    )

    db = SessionLocal()
    try:
        for fp in floorplan_seats:
            building = db.query(Building).filter(Building.name == fp.building).one_or_none()
            if building is None:
                building = Building(name=fp.building)
                db.add(building)
                db.flush()

            floor = (
                db.query(Floor)
                .filter(
                    Floor.building_id == building.id,
                    Floor.floor_number == fp.floor,
                )
                .one_or_none()
            )
            if floor is None:
                floor = Floor(
                    building_id=building.id,
                    floor_number=fp.floor,
                    floorplan_file=fp.floorplan_file,
                )
                db.add(floor)
                db.flush()
            else:
                # Keep floorplan filename updated
                floor.floorplan_file = fp.floorplan_file

            existing = {
                s.seat_number
                for s in db.query(Seat).filter(Seat.floor_id == floor.id).all()
            }
            for seat_number in fp.seat_numbers:
                if seat_number in existing:
                    continue
                db.add(Seat(floor_id=floor.id, seat_number=seat_number))

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_seats_from_floorplans()
    yield


app = FastAPI(title="Seat Reservation API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(reservations_router, prefix=settings.api_prefix)
app.include_router(locations_router, prefix=settings.api_prefix)

#so that when I run this application, the api will be available on local port 8000
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)