from fastapi import APIRouter, HTTPException, Depends
from models import NoteIn
from auth import get_current_user
from starlette import status
from operations import add_note, view_notes, reveal_note, delete_note

router = APIRouter(prefix="/notes", tags=["Encrypted Notes"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_note_route(note: NoteIn, user_id: str = Depends(get_current_user)):
    try:
        inserted_id = add_note(note.title, note.content, user_id)
        return {"id": inserted_id, "message": "Note added successfully"}
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK)
def view_notes_route(user_id: str = Depends(get_current_user)):
    try:
        return view_notes(user_id)
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")

@router.get("/{note_id}", status_code=status.HTTP_200_OK)
def reveal_note_route(note_id: str, user_id: str = Depends(get_current_user)):
    result = reveal_note(note_id, user_id)
    if result:
        return result
    raise HTTPException(404, "Note not found or access denied")

@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note_route(note_id: str, user_id: str = Depends(get_current_user)):
    result = delete_note(note_id, user_id)
    if result is None:
        raise HTTPException(404, "Note not found or access denied")
    elif result is False:
        raise HTTPException(500, "Failed to delete note")
    return {**result, "status": "Note deleted successfully"}
