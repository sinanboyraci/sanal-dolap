---
description: Projeyi otomatik olarak GitHub'a gönderir ve Vercel'e deploy eder.
---
// turbo-all
1. Git'e tüm değişiklikleri ekle.
2. Commit mesajını oluştur ve gönder.
3. Projeyi Vercel prod ortamına yükle.
```bash
git add . && git commit -m "auto-deploy from antigravity" && git push && npx vercel --prod --yes
```
