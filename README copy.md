# What to Eat — Food Review Community

เว็บรีวิวอาหาร Full-stack ภาษาไทย พัฒนาด้วย HTML, CSS, JavaScript, Node.js, Express และ MySQL

## ฟังก์ชันที่เชื่อมต่อ Backend และฐานข้อมูล

- สมัครสมาชิก / เข้าสู่ระบบ ด้วยรหัสผ่านที่ hash ด้วย bcrypt
- โปรไฟล์: ดูข้อมูล แก้ไขชื่อ/แนะนำตัว เปลี่ยนรหัสผ่าน และลบบัญชีโดยยืนยันรหัสผ่าน
- รีวิวอาหาร: สร้าง อ่าน แก้ไข และลบ (เจ้าของรีวิวหรือ admin เท่านั้น)
- อัปโหลดรูป JPG, PNG, WEBP ขนาดไม่เกิน 5MB
- ค้นหารีวิวและเรียงตามล่าสุด/ยอดนิยม
- กดถูกใจและบันทึกรายการโปรด
- แสดงความคิดเห็นและลบความคิดเห็นของตนเอง
- ส่งข้อความจากหน้า Contact และจัดการสถานะข้อความใน Admin Dashboard
- API health check สำหรับตรวจการเชื่อมต่อฐานข้อมูล
- ปุ่มลบรีวิว/ความคิดเห็น/บัญชี และออกจากระบบมีขั้นตอนยืนยัน

## โครงสร้างโปรเจกต์

```text
what-to-eat/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── db.js
│   │   ├── middleware/auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── reviews.js
│   │       ├── social.js
│   │       └── contact.js
│   └── uploads/
├── database/schema.sql
├── frontend/
│   ├── css/style.css
│   ├── js/app.js
│   └── *.html
├── .env.example
└── package.json
```

## ความต้องการ

- Node.js 18 หรือใหม่กว่า
- MySQL 8.0 หรือใหม่กว่า
- npm

## วิธีติดตั้งและรันบน Windows / VS Code

1. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
2. เปิด MySQL Workbench แล้วเปิด `database/schema.sql` จากนั้นกด Execute (สายฟ้า)
3. คัดลอก `.env.example` เป็น `.env` ที่โฟลเดอร์หลักของโปรเจกต์
4. แก้ `DB_USER`, `DB_PASSWORD` และ `DB_NAME` ให้ตรงกับ MySQL ของคุณ
5. ตั้ง `JWT_SECRET` เป็นข้อความลับสุ่มยาวอย่างน้อย 24 ตัวอักษร (ควรยาว 32 ตัวขึ้นไป)
6. เปิด Terminal ที่โฟลเดอร์หลักแล้วรัน:

```bash
npm install
npm start
```

7. เปิด `http://localhost:3000`

## ตรวจสอบระบบ

- เปิด `http://localhost:3000/api/health` ต้องได้ `status: ok` และ `database: connected`
- สมัครสมาชิกที่ `/register.html`
- เข้าสู่ระบบที่ `/login.html`
- เขียนรีวิวที่ `/write-review.html`
- โปรไฟล์ที่ `/profile.html`
- รายการโปรดที่ `/favorites.html`
- หน้าผู้ดูแลที่ `/admin.html` (ต้องมีบัญชี role `admin`)

## กำหนดผู้ดูแลระบบ

หลังสมัครสมาชิกแล้ว ใช้ MySQL Workbench รันคำสั่งนี้ โดยแทนที่อีเมลด้วยอีเมลบัญชีของคุณ:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## API หลัก

| Method | Endpoint | รายละเอียด |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET/PATCH/DELETE | `/api/auth/me` | ดู/แก้ไข/ลบบัญชี |
| PATCH | `/api/auth/password` | เปลี่ยนรหัสผ่าน |
| GET/POST | `/api/reviews` | ดู/สร้างรีวิว |
| GET/PATCH/DELETE | `/api/reviews/:id` | ดู/แก้ไข/ลบรีวิว |
| GET/POST | `/api/reviews/:id/comments` | ดู/เพิ่มความคิดเห็น |
| POST | `/api/reviews/:id/like` | สลับสถานะถูกใจ |
| GET | `/api/favorites` | รายการโปรดของฉัน |
| POST | `/api/reviews/:id/favorite` | สลับรายการโปรด |
| POST | `/api/contact` | ส่งข้อความติดต่อ |
| GET | `/api/admin/summary` | สรุปข้อมูลสำหรับ admin |
| GET/PATCH | `/api/admin/messages` | ดู/อัปเดตข้อความติดต่อ |
| GET | `/api/health` | ตรวจสุขภาพระบบและ DB |

## หมายเหตุด้านความปลอดภัย

- อย่าเผยแพร่ไฟล์ `.env` หรือส่ง JWT_SECRET ให้ผู้อื่น
- ระบบยืนยันก่อนลบเป็นการยืนยันในหน้าเว็บ และ API ตรวจสิทธิ์ซ้ำที่ฝั่ง Server
- การลบบัญชีจะลบข้อมูลที่เชื่อมโยงผ่าน Foreign Key แบบ CASCADE
- ควรเพิ่ม HTTPS, CSRF protection, email verification, backup และระบบจัดการรูปภาพสำหรับการนำขึ้น Production จริง
- Admin Dashboard จำกัดด้วย role ที่เก็บในฐานข้อมูล ห้ามให้ผู้ใช้ทั่วไปแก้ role ผ่านหน้าเว็บ
