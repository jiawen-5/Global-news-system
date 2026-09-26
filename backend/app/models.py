from sqlalchemy import Column, String, Integer, BigInteger, Text, SmallInteger, UniqueConstraint
from app.db import Base
class News(Base):
    __tablename__ = "news"
    id = Column(String(255), primary_key=True)
    title = Column(String(255)); author = Column(String(255)); region = Column(String(255))
    roleId = Column(String(255), index=True); content = Column(Text); categoryId = Column(String(255), index=True)
    auditState = Column(Integer, index=True, default=0); publishState = Column(Integer, index=True, default=0)
    createTime = Column(BigInteger); publishTime = Column(BigInteger)
    star = Column(Integer, default=0); view = Column(Integer, default=0)
class User(Base):
    __tablename__ = "users"
    id = Column(String(255), primary_key=True); username = Column(String(255), unique=True, index=True)
    password = Column(String(255)); roleId = Column(String(255), index=True); region = Column(String(255))
class Role(Base):
    __tablename__ = "roles"
    id = Column(String(255), primary_key=True); roleName = Column(String(255), unique=True); roleType = Column(Integer)
class Permission(Base):
    __tablename__ = "permission"
    id = Column(String(255), primary_key=True); title = Column(String(100)); key = Column(String(255), index=True)
    parent_id = Column(String(255), index=True, default="0"); grade = Column(Integer)
    is_show = Column(SmallInteger, default=1); type = Column(SmallInteger, default=1)
class RolePermission(Base):
    __tablename__ = "role_permission"
    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(String(255), index=True); permission_id = Column(String(255), index=True)
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uk_role_perm"),)
class Category(Base):
    __tablename__ = "categories"
    id = Column(String(255), primary_key=True); title = Column(String(255)); value = Column(String(255))
class Region(Base):
    __tablename__ = "regions"
    id = Column(String(255), primary_key=True); title = Column(String(255)); value = Column(String(255))
