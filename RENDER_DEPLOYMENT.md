# Hướng Dẫn Deployment School Management System trên Render

## Tổng Quan

Hệ thống quản lý trường học được deploy trên Render với kiến trúc microservices:
- **Backend**: FastAPI (Python) - API server
- **Frontend**: Next.js (React) - Web application

## Bước 1: Chuẩn Bị

### 1.1 Tạo tài khoản Render
- Truy cập [render.com](https://render.com)
- Đăng ký tài khoản và xác minh email

### 1.2 Chuẩn bị Supabase
- Tạo project trên [supabase.com](https://supabase.com)
- Lấy các thông tin sau:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Chuẩn bị mã nguồn
- Đảm bảo code đã được commit và push lên GitHub
- Kiểm tra `render.yaml` đã có trong root directory

## Bước 2: Deploy Backend

### 2.1 Tạo Web Service cho Backend
1. Trong Render Dashboard, click "New" → "Blueprint"
2. Chọn repository GitHub chứa project
3. Chọn branch `main` (hoặc branch chính)
4. Render sẽ tự động detect file `render.yaml`

### 2.2 Cấu hình Environment Variables cho Backend
Trong Render Dashboard, vào service backend và thêm các biến môi trường:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Lưu ý**: `JWT_SECRET` nên là một chuỗi ngẫu nhiên mạnh, có thể generate từ Render.

## Bước 3: Deploy Frontend

### 3.1 Frontend Service sẽ được tạo tự động
Render sẽ tự động tạo frontend service từ `render.yaml`

### 3.2 Cấu hình Environment Variables cho Frontend
Trong Render Dashboard, vào service frontend và thêm các biến môi trường:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Bước 4: Cấu hình Database (Tùy chọn)

Nếu bạn muốn sử dụng PostgreSQL managed by Render thay vì Supabase:

1. Trong `render.yaml`, uncomment phần `databases`
2. Redeploy services
3. Render sẽ tạo database instance
4. Cập nhật environment variables để sử dụng database connection string

## Bước 5: Kiểm tra Deployment

### 5.1 Health Checks
- Backend: `https://your-backend.onrender.com/health`
- Frontend: `https://your-frontend.onrender.com`

### 5.2 Test API
```bash
curl https://your-backend.onrender.com/api/health
```

### 5.3 Test Frontend
Truy cập `https://your-frontend.onrender.com` và thử đăng nhập

## Bước 6: Cấu hình Domain (Tùy chọn)

### 6.1 Custom Domain
1. Mua domain từ registrar (Namecheap, GoDaddy, etc.)
2. Trong Render Dashboard → Service → Settings → Custom Domain
3. Thêm domain và follow instructions để cấu hình DNS

### 6.2 SSL Certificate
Render tự động cung cấp SSL certificate miễn phí cho tất cả domains.

## Troubleshooting

### Lỗi thường gặp:

1. **Build Failures**
   - Kiểm tra requirements.txt có đầy đủ dependencies
   - Đảm bảo Python/Node version tương thích

2. **Environment Variables**
   - Kiểm tra tất cả required env vars đã được set
   - Đảm bảo không có typo trong tên biến

3. **CORS Issues**
   - Đảm bảo `FRONTEND_URL` trong backend đúng với frontend URL
   - Kiểm tra CORS settings trong backend

4. **Database Connection**
   - Verify Supabase credentials
   - Kiểm tra database permissions

### Logs và Monitoring
- Xem logs trong Render Dashboard → Service → Logs
- Set up alerts cho downtime và errors

## Performance Optimization

### Free Tier Limitations
- Memory: 512MB
- CPU: Shared
- Build timeout: 15 minutes
- Request timeout: 30 seconds

### Optimization Tips
1. **Caching**: Implement Redis caching nếu cần
2. **CDN**: Sử dụng CDN cho static assets
3. **Database**: Optimize queries và indexes
4. **Upgrade Plan**: Nâng cấp lên Starter plan cho performance tốt hơn

## Backup và Recovery

### Database Backup
- Supabase tự động backup hàng ngày
- Manual backup có thể thực hiện qua Supabase Dashboard

### Code Backup
- Tất cả code đã được backup trên GitHub
- Sử dụng Git tags cho production releases

## Security Best Practices

1. **Environment Variables**: Không commit secrets vào Git
2. **API Keys**: Rotate keys định kỳ
3. **HTTPS**: Luôn sử dụng HTTPS
4. **Rate Limiting**: Implement rate limiting cho API
5. **Input Validation**: Validate tất cả user inputs

## Support

Nếu gặp vấn đề:
1. Kiểm tra Render status page
2. Xem logs chi tiết trong Dashboard
3. Contact Render support nếu cần
4. Check GitHub issues cho known problems

## Chi phí ước tính

- **Free Tier**: $0/tháng (2 services)
- **Starter Plan**: $7/tháng per service
- **Supabase**: Free tier có đủ cho small applications

Happy deploying! 🚀
