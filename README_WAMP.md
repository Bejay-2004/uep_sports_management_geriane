# 🚀 Quick Start - WAMP Server Setup

## UEP Sports Management System
**Professional Blue & Gold Design**

---

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ Move Files to WAMP
```
Copy this folder to: C:\wamp64\www\
```

### 2️⃣ Start WAMP
- Launch WAMP Server
- Wait for **GREEN** icon

### 3️⃣ Create Database
1. Open: `http://localhost/phpmyadmin/`
2. Create database: `uep_sports_management`
3. Import: `vms_complete/uep_sports_management (5).sql`

### 4️⃣ Change WAMP MySQL Port to 3308
Your config files are **already set to port 3308** (to avoid XAMPP conflict).

**Now change WAMP's port to match:**
1. WAMP icon → MySQL → my.ini
2. Change `port=3306` to `port=3308` (change BOTH occurrences)
3. Save and restart WAMP

**📖 Detailed instructions:** See `HOW_TO_CHANGE_WAMP_PORT_TO_3308.md`

### 5️⃣ Access Website

**IMPORTANT:** Don't just use `http://localhost/` - you'll get a 404 error!

**Use the FULL path:**
```
http://localhost/uep_sports_management_geriane/vms_complete/
```

**Or test connection first:**
```
http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php
```

---

## 🔑 Important Configuration

### Database Settings (Configured for Port 3308)
- **Host**: localhost
- **Port**: 3308 ✅ (To avoid XAMPP conflict on 3306)
- **Database**: uep_sports_management
- **Username**: root
- **Password**: "" (empty - WAMP default)

### If You Get "Connection Failed"
1. Open `vms_complete/config/db.php`
2. Change password to empty string if needed:
   ```php
   $pass = "";  // WAMP default
   ```

---

## 📖 Full Documentation
For detailed setup instructions, troubleshooting, and tips:
👉 **See: `vms_complete/WAMP_SETUP_GUIDE.md`**

---

## ✅ What You'll See

### Landing Page
✨ Blue and gold header  
✨ Professional gradient hero section  
✨ Modern card designs with UEP colors  

### Login Page
✨ Animated blue gradient background  
✨ Gold login button  
✨ Clean, professional design  

### Dashboards
✨ Blue gradient sidebar  
✨ Gold accent elements  
✨ User-friendly interface  

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Connection failed** | Check password in `db.php` |
| **Database not found** | Import SQL file in phpMyAdmin |
| **404 Error / URL NOT FOUND** | Use FULL URL: `http://localhost/uep_sports_management_geriane/vms_complete/` |
| **Getting 404 at localhost/** | Add your project path! Don't use just `http://localhost/` |
| **WAMP not green** | Check port conflicts (Skype, IIS) |
| **Styles not loading** | Clear browser cache (Ctrl+F5) |

---

## 📞 Support Files
- 📘 **Full Setup Guide**: `vms_complete/WAMP_SETUP_GUIDE.md`
- 🎨 **Design System**: `vms_complete/DESIGN_SYSTEM.md`
- ⚙️ **Database Config**: `vms_complete/config/db.php`

---

**Ready to go! 🏆**
