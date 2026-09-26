from sqlalchemy.orm import Session
from app import models
def get_role_permission_keys(db: Session, role_id: str) -> set:
    rows = db.query(models.Permission).join(
        models.RolePermission, models.Permission.id == models.RolePermission.permission_id
    ).filter(models.RolePermission.role_id == role_id).all()
    return {p.key for p in rows if p.key}
def build_menu_tree(perms: list) -> list:
    m = {p.id: {"id": p.id, "title": p.title, "key": p.key, "parent_id": p.parent_id,
                "grade": p.grade, "is_show": p.is_show, "type": p.type, "children": []} for p in perms}
    roots = []
    for p in perms:
        n = m[p.id]
        if p.parent_id == "0" or p.parent_id not in m:
            roots.append(n)
        else:
            m[p.parent_id]["children"].append(n)
    return roots
def get_user_menus(db: Session, role_id: str):
    q = db.query(models.Permission).join(
        models.RolePermission, models.Permission.id == models.RolePermission.permission_id
    ).filter(models.RolePermission.role_id == role_id, models.Permission.type == 1,
             models.Permission.is_show == 1
    ).order_by(models.Permission.grade, models.Permission.id).all()
    return build_menu_tree(q)
