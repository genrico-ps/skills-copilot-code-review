"""
Announcement endpoints for the High School Management System API
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import announcements_collection, teachers_collection

router = APIRouter(prefix="/announcements", tags=["announcements"])


class AnnouncementPayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=1000)
    start_date: Optional[date] = None
    expiry_date: date


def _utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _require_teacher(teacher_username: Optional[str]) -> Dict[str, Any]:
    if not teacher_username:
        raise HTTPException(
            status_code=401,
            detail="Authentication required for this action",
        )

    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(
            status_code=401,
            detail="Invalid teacher credentials",
        )

    return teacher


def _parse_date(date_value: Optional[str]) -> Optional[date]:
    if not date_value:
        return None
    return date.fromisoformat(date_value)


def _announcement_status(announcement: Dict[str, Any]) -> str:
    today = date.today()
    start_date = _parse_date(announcement.get("start_date"))
    expiry_date = _parse_date(announcement.get("expiry_date"))

    if expiry_date and expiry_date < today:
        return "expired"
    if start_date and start_date > today:
        return "upcoming"
    return "active"


def _serialize_announcement(announcement: Dict[str, Any]) -> Dict[str, Any]:
    start_date = announcement.get("start_date")
    expiry_date = announcement.get("expiry_date")

    return {
        "id": str(announcement["_id"]),
        "title": announcement.get("title", ""),
        "message": announcement.get("message", ""),
        "start_date": start_date,
        "expiry_date": expiry_date,
        "created_at": announcement.get("created_at"),
        "updated_at": announcement.get("updated_at"),
        "status": _announcement_status(announcement),
        "is_active": _announcement_status(announcement) == "active",
    }


def _announcement_sort_key(announcement: Dict[str, Any]) -> tuple:
    status_order = {"active": 0, "upcoming": 1, "expired": 2}
    status = _announcement_status(announcement)
    start_date = announcement.get("start_date") or "9999-12-31"
    expiry_date = announcement.get("expiry_date") or "9999-12-31"
    return (status_order.get(status, 3), start_date, expiry_date, str(announcement.get("_id")))


def _validate_dates(payload: AnnouncementPayload) -> None:
    if payload.start_date and payload.expiry_date < payload.start_date:
        raise HTTPException(
            status_code=400,
            detail="Expiry date must be on or after the start date",
        )


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def get_announcements() -> List[Dict[str, Any]]:
    announcements = list(announcements_collection.find({}))
    announcements.sort(key=_announcement_sort_key)
    return [_serialize_announcement(announcement) for announcement in announcements]


@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
def create_announcement(
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None),
) -> Dict[str, Any]:
    _require_teacher(teacher_username)
    _validate_dates(payload)

    document = {
        "title": payload.title.strip(),
        "message": payload.message.strip(),
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expiry_date": payload.expiry_date.isoformat(),
        "created_at": _utc_now_iso(),
        "updated_at": _utc_now_iso(),
    }

    result = announcements_collection.insert_one(document)
    stored_announcement = announcements_collection.find_one({"_id": result.inserted_id})
    if not stored_announcement:
        raise HTTPException(status_code=500, detail="Failed to create announcement")

    return _serialize_announcement(stored_announcement)


@router.put("/{announcement_id}", response_model=Dict[str, Any])
def update_announcement(
    announcement_id: str,
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None),
) -> Dict[str, Any]:
    _require_teacher(teacher_username)
    _validate_dates(payload)

    try:
        object_id = ObjectId(announcement_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from exc

    announcement = announcements_collection.find_one({"_id": object_id})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    update_result = announcements_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "title": payload.title.strip(),
                "message": payload.message.strip(),
                "start_date": payload.start_date.isoformat() if payload.start_date else None,
                "expiry_date": payload.expiry_date.isoformat(),
                "updated_at": _utc_now_iso(),
            }
        },
    )

    if update_result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update announcement")

    updated_announcement = announcements_collection.find_one({"_id": object_id})
    if not updated_announcement:
        raise HTTPException(status_code=500, detail="Failed to load updated announcement")

    return _serialize_announcement(updated_announcement)


@router.delete("/{announcement_id}", response_model=Dict[str, Any])
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = Query(None),
) -> Dict[str, Any]:
    _require_teacher(teacher_username)

    try:
        object_id = ObjectId(announcement_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from exc

    announcement = announcements_collection.find_one({"_id": object_id})
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    delete_result = announcements_collection.delete_one({"_id": object_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete announcement")

    return {"message": "Announcement deleted successfully"}