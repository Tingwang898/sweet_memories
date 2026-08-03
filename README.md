# 情侣与帕恰足迹纪念地图

深色科幻毛玻璃风格的情侣与宠物旅行足迹纪念网页。当前前端使用 Vite + React，部署目标为 Netlify，长期数据和认证预留给 Supabase。

## 技术栈

- Frontend: Vite 6 + React 19
- Map: d3-geo + topojson-client + world-atlas
- Icons: lucide-react
- Hosting: Netlify
- Database/Auth: Supabase
- Package manager: pnpm

## 本地运行

```bash
cd footprint-prototype
pnpm install
pnpm run dev
```

生产构建和检查：

```bash
pnpm run check
```

## 环境变量

复制样例文件：

```bash
cd footprint-prototype
cp .env.example .env.local
```

填写：

```text
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

这些是 Supabase 浏览器端公开配置。不要把 service role key、数据库密码、GitHub token、Netlify token 写入前端代码、Git 提交或公开页面。

## Supabase 数据库与认证

1. 打开 Supabase，新建项目。
2. 进入 SQL Editor。
3. 粘贴并执行 `supabase/schema.sql`。
4. 进入 Project Settings → API，复制 `Project URL` 和 `anon public key`。
5. 本地写入 `footprint-prototype/.env.local`。
6. Netlify 后台写入同名环境变量。

默认 RLS 策略：

- `anon` 和 `authenticated` 都可以读取 `travel_cities`。
- 只有 `authenticated` 用户可以新增、更新、删除。

当前前端没有把登录 UI 做成必填流程。未登录时新增打卡会先保存在当前页面状态；开启 Supabase Auth 并登录后，写入才会持久化。后续如果你希望网页里直接有管理员登录入口，可以继续加邮箱 magic link 或 OAuth 登录。

## 在 Supabase 后台管理数据

- 查看/编辑：Table Editor → `travel_cities`
- 导出：Table Editor → `travel_cities` → Export CSV
- 备份：Project Settings → Database → Backups
- 手动备份 SQL：使用 Supabase CLI 或 `pg_dump`

建议定期导出 CSV，重大修改前先做一次备份。

## GitHub 连接

如果你还没有 GitHub 仓库，请先在 GitHub 网页创建一个空仓库，不要勾选自动生成 README、`.gitignore` 或 license。然后在项目根目录执行：

```bash
git branch -M main
git remote add origin git@github.com:<your-user>/<your-repo>.git
git add .
git commit -m "Prepare Netlify production build"
git push -u origin main
```

如果你使用 HTTPS remote，也可以把 remote 换成：

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
```

## Netlify 持续部署

1. 打开 Netlify。
2. 选择 Add new site → Import an existing project。
3. 授权并选择 GitHub 仓库。
4. Netlify 会读取 `footprint-prototype/netlify.toml`。
5. 确认构建配置：
   - Base directory: `footprint-prototype`
   - Build command: `pnpm run build`
   - Publish directory: `dist/client`
6. 在 Site configuration → Environment variables 添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. 点击 Deploy。

之后每次提交并推送到 `main`，Netlify 会自动构建并发布生产站点。需要预览环境时，可以推送到 `preview` 分支或用 Pull Request，Netlify 会生成 deploy preview。

## 发布更新

```bash
git checkout main
git pull
cd footprint-prototype
pnpm install
pnpm run check
cd ..
git add .
git commit -m "Describe your update"
git push origin main
```

推送后去 Netlify Deploys 页面查看构建日志和发布状态。

## 上线检查清单

- `pnpm run check` 通过。
- Netlify deploy log 没有 build error。
- 首页可打开，刷新后仍能进入 SPA。
- 随便访问一个不存在路径时，会回到应用入口或显示 404 兜底页。
- 移动端宽度下导航、地图、时间线、信息卡不互相遮挡。
- Browser console 没有 error。
- Netlify 环境变量存在，且没有把密钥写入仓库。
- Supabase RLS 已启用。
- `travel_cities` 表能读取；登录后的写入权限按预期工作。
- Netlify headers 生效：`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`。
