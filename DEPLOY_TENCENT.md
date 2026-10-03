# Drunkplay CloudBase 部署

- 目标环境 domestic / ap-shanghai / khris-brain-1023-d6eg3f4f6151646。
- 服务 drunkplay-web，根目录 Dockerfile，端口 8080，入口 https://kelve.cn/drunkplay。
- 网关 /drunkplay 开启完整路径透传，保留其他服务和路由。
- 构建 npm run lint、npm run build。
- 运行变量 APP_ORIGIN=https://kelve.cn、CLOUDBASE_ENV_ID 和 Drunkplay 服务端 CLOUDBASE_APIKEY；不要提交密钥。
- 数据库表均带 drunkplay_ 前缀，RLS 启用；数据只经同域服务端 API 访问。
- 原账号密码哈希仅用于服务端验证；旧会话不迁移。新密码使用 scrypt，Cookie 为 HttpOnly/Secure、Path=/drunkplay。
- 上传图片最大 2 MB；媒体存入独立数据库表，后续大规模使用可迁移至对象存储。
- 发布新游戏保持 pending，需要管理员在数据库审核；网站不开放直接审批操作。
- /drunkplay/healthz 检查进程，/drunkplay/api/health 检查数据库。
- 私有数据导入仅从本机备份生成，禁止将备份、导入数据或凭据推送至 GitHub。
