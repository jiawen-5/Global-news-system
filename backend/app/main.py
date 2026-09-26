import os, time, uuid, jwt, bcrypt
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from dotenv import load_dotenv
from app.db import Base, engine, get_db
from app import models
from app.rbac import get_role_permission_keys, get_user_menus, build_menu_tree

load_dotenv()
SECRET = os.getenv("JWT_SECRET", "news-secret")

app = FastAPI(title="news-system-python")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)

def mk_token(u):
    return jwt.encode({"sub": u.id, "username": u.username, "roleId": u.roleId,
                       "region": u.region, "exp": int(time.time()) + 86400}, SECRET, algorithm="HS256")

def cur_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(401, "missing token")
    try:
        d = jwt.decode(authorization.replace("Bearer ", ""), SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "invalid token")
    u = db.query(models.User).filter(models.User.id == d["sub"]).first()
    if not u:
        raise HTTPException(401, "user gone")
    return u

def need(key):
    def dep(db: Session = Depends(get_db), u=Depends(cur_user)):
        ks = get_role_permission_keys(db, u.roleId)
        if key not in ks and "/".join(key.split("/")[:2]) not in ks:
            raise HTTPException(403, f"no perm {key}")
        return u
    return dep

def me_data(db, u):
    r = db.query(models.Role).filter(models.Role.id == u.roleId).first()
    return {"token": None, "user": {"id": u.id, "username": u.username, "roleId": u.roleId,
            "region": u.region, "role": {"id": r.id if r else u.roleId,
            "roleName": r.roleName if r else "", "roleType": r.roleType if r else 3}},
            "menus": get_user_menus(db, u.roleId), "keys": sorted(get_role_permission_keys(db, u.roleId))}

@app.post("/api/auth/login")
def login(b: dict, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.username == b.get("username")).first()
    if not u:
        raise HTTPException(400, "user not found")
    ok = False
    try:
        ok = bcrypt.checkpw(b.get("password", "").encode(), u.password.encode())
    except Exception:
        ok = b.get("password") == u.password
    if not ok:
        raise HTTPException(400, "bad password")
    d = me_data(db, u)
    d["token"] = mk_token(u)
    return d

@app.get("/api/auth/me")
def me(db: Session = Depends(get_db), u=Depends(cur_user)):
    return me_data(db, u)

@app.get("/api/menus")
def menus(db: Session = Depends(get_db), u=Depends(cur_user)):
    return get_user_menus(db, u.roleId)

@app.get("/api/permissions")
def all_perms(db: Session = Depends(get_db), u=Depends(cur_user)):
    ps = db.query(models.Permission).order_by(models.Permission.grade).all()
    return {"tree": build_menu_tree(ps),
            "list": [{"id": p.id, "title": p.title, "key": p.key, "parent_id": p.parent_id,
                      "grade": p.grade, "is_show": p.is_show, "type": p.type} for p in ps]}

@app.get("/api/roles/{rid}/permissions")
def role_perms(rid: str, db: Session = Depends(get_db), u=Depends(cur_user)):
    return sorted(get_role_permission_keys(db, rid))

@app.put("/api/roles/{rid}/permissions")
def set_role_perms(rid: str, b: dict, db: Session = Depends(get_db), u=Depends(need("/right-manage/role/list"))):
    db.query(models.RolePermission).filter(models.RolePermission.role_id == rid).delete()
    for pid in b.get("permission_ids", []):
        db.add(models.RolePermission(role_id=rid, permission_id=pid))
    db.commit()
    return {"ok": True}

@app.get("/api/news")
def list_news(auditState: int = None, publishState: int = None, author: str = None,
              region: str = None, categoryId: str = None, q: str = None,
              page: int = 1, size: int = 20,
              sort: str = None, order: str = None,
              _sort: str = None, _order: str = None, _limit: int = None,
              db: Session = Depends(get_db), u=Depends(cur_user)):
    query = db.query(models.News)
    r = db.query(models.Role).filter(models.Role.id == u.roleId).first()
    rt = r.roleType if r else 3
    if rt == 3:
        query = query.filter(models.News.author == u.username)
    elif rt == 2:
        query = query.filter(or_(models.News.region == u.region, models.News.author == u.username))
    if auditState is not None:
        query = query.filter(models.News.auditState == auditState)
    if publishState is not None:
        query = query.filter(models.News.publishState == publishState)
    if author:
        query = query.filter(models.News.author == author)
    if region:
        query = query.filter(models.News.region == region)
    if categoryId:
        query = query.filter(models.News.categoryId == categoryId)
    if q:
        query = query.filter(models.News.title.like(f"%{q}%"))
    total = query.count()
    # 排序：兼容 json-server 风格 _sort=-view&_order=desc 和 sort=view&order=desc
    sort_field = _sort or sort
    sort_order = (_order or order or "desc").lower()
    allowed = {"star": models.News.star, "view": models.News.view,
               "createTime": models.News.createTime, "publishTime": models.News.publishTime,
               "title": models.News.title, "id": models.News.id}
    if sort_field:
        col = allowed.get(sort_field.lstrip("-"), models.News.createTime)
        neg = sort_field.startswith("-")
        # -前缀即降序，否则看 order 参数（默认 desc）
        is_desc = True if neg else (sort_order == "desc")
        query = query.order_by(col.desc() if is_desc else col.asc())
    else:
        query = query.order_by(models.News.createTime.desc())
    if _limit is not None:
        rows = query.limit(_limit).all()
    else:
        rows = query.offset((page - 1) * size).limit(size).all()
    return {"total": total, "list": [
        dict(id=x.id, title=x.title, author=x.author, region=x.region, roleId=x.roleId,
             content=x.content, categoryId=x.categoryId, auditState=x.auditState,
             publishState=x.publishState, createTime=x.createTime, publishTime=x.publishTime,
             star=x.star, view=x.view) for x in rows]}

@app.post("/api/news")
def create_news(b: dict, db: Session = Depends(get_db), u=Depends(cur_user)):
    nid, now = str(uuid.uuid4()), int(time.time() * 1000)
    db.add(models.News(id=nid, title=b.get("title", ""), author=u.username, region=u.region,
                       roleId=u.roleId, content=b.get("content", ""), categoryId=b.get("categoryId", ""),
                       auditState=b.get("auditState", 0), publishState=b.get("publishState", 0),
                       createTime=now, publishTime=b.get("publishTime"), star=0, view=0))
    db.commit()
    return {"id": nid}

@app.patch("/api/news/{nid}")
def patch_news(nid: str, b: dict, db: Session = Depends(get_db), u=Depends(cur_user)):
    n = db.query(models.News).filter(models.News.id == nid).first()
    if not n:
        raise HTTPException(404, "not found")
    r = db.query(models.Role).filter(models.Role.id == u.roleId).first()
    rt = r.roleType if r else 3
    if rt == 3 and n.author != u.username:
        raise HTTPException(403, "no")
    if rt == 2 and n.region != u.region and n.author != u.username:
        raise HTTPException(403, "no")
    for k in ["title", "content", "categoryId", "auditState", "publishState", "publishTime", "star", "view"]:
        if k in b:
            setattr(n, k, b[k])
    db.commit()
    return {"ok": True}

@app.delete("/api/news/{nid}")
def del_news(nid: str, db: Session = Depends(get_db), u=Depends(cur_user)):
    n = db.query(models.News).filter(models.News.id == nid).first()
    if n:
        db.delete(n)
        db.commit()
    return {"ok": True}

@app.get("/api/news/{nid}")
def get_news(nid: str, db: Session = Depends(get_db), u=Depends(cur_user)):
    from fastapi import HTTPException as HE
    n = db.query(models.News).filter(models.News.id == nid).first()
    if not n:
        raise HE(404, "not found")
    return dict(id=n.id, title=n.title, author=n.author, region=n.region, roleId=n.roleId,
                content=n.content, categoryId=n.categoryId, auditState=n.auditState,
                publishState=n.publishState, createTime=n.createTime, publishTime=n.publishTime,
                star=n.star, view=n.view)

@app.post("/api/auth/register")
def register(b: dict, db: Session = Depends(get_db)):
    import uuid as _uuid
    if not b.get("username") or not b.get("password"):
        from fastapi import HTTPException as HE
        raise HE(400, "username and password required")
    if db.query(models.User).filter(models.User.username == b["username"]).first():
        from fastapi import HTTPException as HE
        raise HE(400, "username exists")
    hashed = bcrypt.hashpw(b["password"].encode(), bcrypt.gensalt()).decode()
    u = models.User(id=str(_uuid.uuid4()), username=b["username"], password=hashed,
                    roleId=b.get("roleId", "3"), region=b.get("region", ""))
    db.add(u)
    db.commit()
    return {"ok": True}

@app.get("/api/roles")
def list_roles(db: Session = Depends(get_db), u=Depends(cur_user)):
    return [{"id": x.id, "roleName": x.roleName, "roleType": x.roleType}
            for x in db.query(models.Role).all()]

@app.post("/api/users")
def create_user(b: dict, db: Session = Depends(get_db), u=Depends(need("/user-manage/list"))):
    import uuid as _uuid
    if db.query(models.User).filter(models.User.username == b.get("username")).first():
        from fastapi import HTTPException as HE
        raise HE(400, "username exists")
    hashed = bcrypt.hashpw(b.get("password", "").encode(), bcrypt.gensalt()).decode()
    nu = models.User(id=str(_uuid.uuid4()), username=b["username"], password=hashed,
                     roleId=b.get("roleId", "3"), region=b.get("region", ""))
    db.add(nu)
    db.commit()
    return {"id": nu.id}

@app.get("/api/users")
def list_users(db: Session = Depends(get_db), u=Depends(need("/user-manage/list"))):
    return [{"id": x.id, "username": x.username, "roleId": x.roleId, "region": x.region}
            for x in db.query(models.User).all()]

@app.get("/api/categories")
def list_cat(db: Session = Depends(get_db), u=Depends(cur_user)):
    return [{"id": x.id, "title": x.title, "value": x.value} for x in db.query(models.Category).all()]

@app.delete("/api/categories/{cid}")
def del_cat(cid: str, db: Session = Depends(get_db), u=Depends(cur_user)):
    c = db.query(models.Category).filter(models.Category.id == cid).first()
    if c:
        db.delete(c)
        db.commit()
    return {"ok": True}

@app.patch("/api/categories/{cid}")
def patch_cat(cid: str, b: dict, db: Session = Depends(get_db), u=Depends(cur_user)):
    from fastapi import HTTPException as HE
    c = db.query(models.Category).filter(models.Category.id == cid).first()
    if not c:
        raise HE(404, "not found")
    for k in ["title", "value"]:
        if k in b:
            setattr(c, k, b[k])
    db.commit()
    return {"ok": True}

@app.get("/api/regions")
def list_reg(db: Session = Depends(get_db), u=Depends(cur_user)):
    return [{"id": x.id, "title": x.title, "value": x.value} for x in db.query(models.Region).all()]

@app.get("/health")
def h():
    return {"ok": True}
