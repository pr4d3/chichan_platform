from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from schemas.settings_schema import HomePageResponse, AboutUsResponse
from services import settings_service

router = APIRouter(tags=["General Pages & Settings"])

@router.get("/api/v1/general/home", response_model=HomePageResponse, status_code=status.HTTP_200_OK)
async def get_home(db: AsyncSession = Depends(get_db)):
    data = await settings_service.get_home_page_data(db)
    return HomePageResponse(success=True, data=data)

@router.get("/api/v1/general/about-us", response_model=AboutUsResponse, status_code=status.HTTP_200_OK)
async def get_about_us(db: AsyncSession = Depends(get_db)):
    data = await settings_service.get_about_us_data(db)
    return AboutUsResponse(success=True, data=data)
