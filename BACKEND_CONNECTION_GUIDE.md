# دليل ربط النظام الأمامي بالخادم الخلفي

## ملخص التحديثات

تم ربط النظام الأمامي بالخادم الخلفي بنجاح مع التحديثات التالية:

### 1. ملف API Service (`src/utils/api.js`)
- إنشاء فئة `ApiService` للتعامل مع جميع استدعاءات API
- دعم المصادقة التلقائية مع JWT tokens
- دوال شاملة للمصادقة، المساهمين، المعاملات، الأرباح، والتقارير
- معالجة الأخطاء بطريقة احترافية

### 2. تحديث صفحة تسجيل الدخول (`src/pages/Login.jsx`)
- ربط مع API endpoint: `POST /api/auth/login`
- معالجة الاستجابات والأخطاء
- حفظ التوكن ومعلومات المستخدم في localStorage
- رسائل خطأ باللغة العربية

### 3. تحديث صفحة التسجيل (`src/pages/Register.jsx`)
- ربط مع API endpoint: `POST /api/auth/register`
- **ملاحظة مهمة**: التسجيل يتطلب صلاحيات المدير (admin)
- التحقق من وجود التوكن قبل المحاولة
- معالجة أخطاء الصلاحيات

### 4. تحديث Sidebar (`src/components/Sidebar.jsx`)
- ربط زر تسجيل الخروج مع API
- تنظيف localStorage عند الخروج

## كيفية الاستخدام

### 1. تشغيل الخادم الخلفي
```bash
cd backend
npm start
```

### 2. تشغيل النظام الأمامي
```bash
cd frontend
npm run dev
```

### 3. إنشاء مستخدم أولي (مدير)
نظراً لأن التسجيل يتطلب صلاحيات المدير، يجب إنشاء مستخدم أولي في قاعدة البيانات:

```javascript
// يمكن تشغيل هذا الكود في MongoDB Compass أو في ملف منفصل
// أو إضافة endpoint مؤقت في الخادم لإنشاء المدير الأول

const bcrypt = require('bcrypt');

const adminUser = {
  username: 'admin',
  password: await bcrypt.hash('admin123', 10), // كلمة مرور مُشفرة
  fullName: 'مدير النظام',
  email: 'admin@investors.com',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// إدراج في collection "users"
```

### 4. اختبار الاتصال
افتح الملف `test-connection.html` في المتصفح لاختبار الاتصال:
```
file:///path/to/frontend/test-connection.html
```

## تكوين الخادم

### متغيرات البيئة المطلوبة (في ملف .env للخادم):
```env
MONGODB_URI=mongodb://localhost:27017/investors-system
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
NODE_ENV=development
PORT=5000
```

### CORS
الخادم مُعد للسماح بطلبات CORS من النظام الأمامي.

## استكشاف الأخطاء

### 1. خطأ "Failed to fetch"
- تأكد من تشغيل الخادم الخلفي على المنفذ 5000
- تحقق من إعدادات CORS

### 2. خطأ "Invalid credentials"
- تأكد من صحة اسم المستخدم وكلمة المرور
- تحقق من وجود المستخدم في قاعدة البيانات

### 3. خطأ "Unauthorized" في التسجيل
- التسجيل يتطلب تسجيل دخول كمدير أولاً
- تأكد من وجود توكن صالح

### 4. مشاكل في قاعدة البيانات
- تحقق من اتصال MongoDB
- تأكد من وجود قاعدة البيانات والمجموعات

## الخطوات التالية

1. **إنشاء المدير الأول**: أنشئ مستخدم مدير في قاعدة البيانات
2. **اختبار تسجيل الدخول**: استخدم بيانات المدير للدخول
3. **إنشاء مستخدمين جدد**: استخدم صفحة التسجيل لإنشاء مستخدمين
4. **ربط الصفحات الأخرى**: يمكنك الآن ربط صفحات المساهمين والمعاملات وغيرها

## دوال API المتاحة

### المصادقة
- `authAPI.login(credentials)` - تسجيل الدخول
- `authAPI.register(userData)` - تسجيل مستخدم جديد (مدير فقط)
- `authAPI.logout()` - تسجيل الخروج
- `authAPI.getProfile()` - جلب ملف المستخدم

### المساهمين
- `investorsAPI.getAll()` - جلب جميع المساهمين
- `investorsAPI.create(data)` - إنشاء مساهم جديد

### المعاملات
- `transactionsAPI.getAll()` - جلب المعاملات
- `transactionsAPI.create(data)` - إنشاء معاملة جديدة

### الأرباح والتقارير
- `profitsAPI.getAll()` - جلب توزيعات الأرباح
- `reportsAPI.getAll()` - جلب التقارير

جميع الدوال تعيد Promise ويمكن استخدامها مع async/await. 