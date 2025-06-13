# تشغيل موقع Clyne باستخدام Docker

هذا الدليل يوضح كيفية تشغيل موقع Clyne باستخدام Docker.

## المتطلبات

- Docker Engine
- Docker Compose

## التثبيت والتشغيل

### 1. بناء وتشغيل الخدمات

```bash
# بناء وتشغيل كل الخدمات في الخلفية
docker-compose up -d
```

هذا سيقوم بتشغيل:
- تطبيق الويب على المنفذ 5000
- Redis على المنفذ 6379 
- MongoDB على المنفذ 27017
- Prometheus على المنفذ 9090
- Grafana على المنفذ 3000

### 2. عرض السجلات

```bash
# عرض سجلات تطبيق الويب
docker-compose logs -f web

# عرض سجلات جميع الخدمات
docker-compose logs -f
```

### 3. إيقاف الخدمات

```bash
# إيقاف كل الخدمات
docker-compose down

# إيقاف وحذف البيانات (يزيل كل البيانات المخزنة!)
docker-compose down -v
```

## الوصول للخدمات

- **تطبيق الويب**: http://localhost:5000
- **واجهة Prometheus**: http://localhost:9090
- **لوحة معلومات Grafana**: http://localhost:3000 (اسم المستخدم: admin، كلمة المرور: clyne_secure_grafana_password)

## تغيير الإعدادات

قم بتعديل متغيرات البيئة في ملف `docker-compose.yml` لتغيير:
- كلمات المرور
- حدود الذاكرة
- إعدادات أخرى

## النشر على الإنتاج

عند النشر على خادم VPS، قم بتغيير:
1. كلمات المرور في `docker-compose.yml`
2. تحديث `SECRET_KEY` بمفتاح آمن جديد
3. إضافة HTTPS/SSL باستخدام Nginx أو Traefik (موصى به للإنتاج)

## الصيانة

### تحديث الخدمات

```bash
# سحب أحدث الصور وإعادة البناء
docker-compose pull
docker-compose build --no-cache
docker-compose up -d
```

### نسخ احتياطي للبيانات

```bash
# نسخ احتياطي لقاعدة بيانات MongoDB
docker-compose exec mongo mongodump --username clyne --password clyne_secure_mongodb_password --out /data/backup

# نسخ الملفات من الحاوية إلى النظام المضيف
docker cp $(docker-compose ps -q mongo):/data/backup ./mongo-backup
``` 