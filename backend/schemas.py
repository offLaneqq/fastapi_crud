from pydantic import BaseModel
from typing import Optional

# Модель для даних, які ми отримуємо від клієнта (без ID)
class ItemBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

class ItemCreate(ItemBase):
    pass

# Модель для даних, які ми повертаємо клієнту (з ID)
class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True
