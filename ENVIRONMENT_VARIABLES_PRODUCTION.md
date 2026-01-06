# Environment Variables for School Management System - Production

## Backend Environment Variables (Render)

Set these in your backend service on Render:

### Supabase Configuration
```
SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1NzY0MiwiZXhwIjoyMDc2NjMzNjQyfQ.Ip-_Pe0ERnW-5FrGruYfNjP1zRhEnV0I_vmiEZJb_aw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1NzY0MiwiZXhwIjoyMDc2NjMzNjQyfQ.Ip-_Pe0ERnW-5FrGruYfNjP1zRhEnV0I_vmiEZJb_aw
SUPABASE_JWT_SECRET=SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g==
```

### Database Configuration
```
DATABASE_URL=postgresql://postgres:150819Kt@db.okauzglpkrdatujkqczc.supabase.co:5432/postgres
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.okauzglpkrdatujkqczc
DB_PASSWORD=150819Kt
```

### JWT Configuration
```
JWT_SECRET=SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g==
SECRET_KEY=SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g==
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=90
```

### Application Configuration
```
ENVIRONMENT=production
DEBUG=False
HOST=0.0.0.0
PORT=10000
RENDER_PLAN=free
```

### CORS Configuration
```
CORS_ORIGINS=https://school-management-frontend.onrender.com,https://your-frontend-domain.onrender.com
FRONTEND_URL=https://school-management-frontend.onrender.com
```

### File Upload Configuration
```
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

## Frontend Environment Variables (Render)

Set these in your frontend service on Render:

### API Configuration
```
NEXT_PUBLIC_API_URL=https://school-management-backend-7yfd.onrender.com
```

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTc2NDIsImV4cCI6MjA3NjYzMzY0Mn0.wrDH2RNrGm-vQWBY4-JJE9_zASE2ImjE6O5upogUxfQ
```

### Production Optimization
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **JWT_SECRET**: This should be a strong, randomly generated secret key
2. **SUPABASE_SERVICE_ROLE_KEY**: Never expose this in frontend - only use in backend
3. **SUPABASE_ANON_KEY**: Safe to expose in frontend (NEXT_PUBLIC_)
4. **Database Credentials**: Keep secure and rotate periodically
5. **SMTP Credentials**: Consider using services like SendGrid for production

## Environment Variables Summary

### Backend (13 variables):
- SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
- DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
- ENVIRONMENT, DEBUG, HOST, PORT, RENDER_PLAN
- CORS_ORIGINS, FRONTEND_URL
- UPLOAD_DIR, MAX_FILE_SIZE

### Frontend (5 variables):
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- NODE_ENV, NEXT_TELEMETRY_DISABLED

## Quick Copy for Render Dashboard

**Backend:**
```
SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1NzY0MiwiZXhwIjoyMDc2NjMzNjQyfQ.Ip-_Pe0ERnW-5FrGruYfNjP1zRhEnV0I_vmiEZJb_aw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1NzY0MiwiZXhwIjoyMDc2NjMzNjQyfQ.Ip-_Pe0ERnW-5FrGruYfNjP1zRhEnV0I_vmiEZJb_aw
JWT_SECRET=SyiKSvHu6OBdYoebnEwxX0lNLvnDbnh9CRgbP83ylr/FBe+fK62GX272l5X/eTwgn0oQHY4syAKIS1MLIoCN8g==
ENVIRONMENT=production
DEBUG=False
FRONTEND_URL=https://school-management-frontend.onrender.com
```

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://school-management-backend-7yfd.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTc2NDIsImV4cCI6MjA3NjYzMzY0Mn0.wrDH2RNrGm-vQWBY4-JJE9_zASE2ImjE6O5upogUxfQ
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Testing

After setting environment variables:

1. **Backend Health Check**: `https://school-management-backend-7yfd.onrender.com/health`
2. **Frontend**: Should connect to backend API successfully
3. **Database**: Backend should connect to Supabase database
4. **Auth**: JWT tokens should work properly
