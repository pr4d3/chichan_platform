from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class CategoryResponseData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    slug: str
    description: Optional[str] = None

class CategoryListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    success: bool
    data: list[CategoryResponseData]

class PostAuthorInfo(BaseModel):
    id: UUID
    full_name: str
    role: str
    avatar_url: Optional[str] = None

class PostListData(BaseModel):
    id: UUID
    category_id: int
    category_name: str
    title: str
    short_content: str
    author: PostAuthorInfo
    comment_count: int
    views_count: int = 0
    likes_count: int = 0
    is_liked: bool = False
    is_anonymous: bool = False
    is_owner: bool = False
    status: str
    created_at: datetime

class PostListResponse(BaseModel):
    success: bool
    data: list[PostListData]

class PostListPaginatedData(BaseModel):
    # Shape phân trang mới của GET /forum/posts (chỉ dùng khi client truyền limit/offset)
    items: list[PostListData]
    total: int
    limit: int
    offset: int

class PostListPaginatedResponse(BaseModel):
    success: bool
    data: PostListPaginatedData

class CommentAuthorInfo(BaseModel):
    id: UUID
    full_name: str
    role: str
    avatar_url: Optional[str] = None

class CommentNode(BaseModel):
    id: UUID
    parent_comment_id: Optional[UUID] = None
    content: str
    status: str
    is_anonymous: bool = False
    created_at: datetime
    author: CommentAuthorInfo
    reply_to_author: Optional[CommentAuthorInfo] = None
    replies: list['CommentNode'] = []

class PostDetailData(BaseModel):
    id: UUID
    category_id: int
    category_name: str
    title: str
    content: str
    status: str
    views_count: int = 0
    likes_count: int = 0
    is_liked: bool = False
    is_anonymous: bool = False
    is_owner: bool = False
    created_at: datetime
    author: PostAuthorInfo
    comments: list[CommentNode]

class PostDetailResponse(BaseModel):
    success: bool
    data: PostDetailData

class PostCreate(BaseModel):
    category_id: int
    title: str = Field(..., max_length=255, min_length=5)
    content: str = Field(..., min_length=10)
    is_anonymous: bool = False

class PostCreateResponseData(BaseModel):
    post_id: UUID
    title: str
    status: str
    is_anonymous: bool = False
    created_at: datetime

class PostCreateResponse(BaseModel):
    success: bool
    message: str
    data: PostCreateResponseData

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=2)
    parent_comment_id: Optional[UUID] = None
    is_anonymous: bool = False

class CommentCreateResponseData(BaseModel):
    comment_id: UUID
    post_id: UUID
    content: str
    parent_comment_id: Optional[UUID] = None
    status: str
    is_anonymous: bool = False
    created_at: datetime

class CommentCreateResponse(BaseModel):
    success: bool
    message: str
    data: CommentCreateResponseData

class PostModerateAction(BaseModel):
    action: str = Field(..., pattern="^(HIDE|DELETE|UNHIDE)$")

class CommentModerateAction(BaseModel):
    action: str = Field(..., pattern="^(HIDE|DELETE|UNHIDE)$")

class ModerateResponse(BaseModel):
    success: bool
    message: str

class LikeToggleResponseData(BaseModel):
    post_id: UUID
    liked: bool
    likes_count: int

class LikeToggleResponse(BaseModel):
    success: bool
    message: str
    data: LikeToggleResponseData
