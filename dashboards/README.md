# Dashboard de Prospecção - Vercel Deploy

Dashboard público acessível de qualquer lugar, com dados sempre atualizados.

## 🚀 Deploy Rápido (5 min)

### 1. Push para GitHub
```bash
cd ~/.operacao-ia/prospecting/dashboards
git init
git add .
git commit -m "Dashboard Vercel deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/prospeccao-dashboard.git
git push -u origin main
```

### 2. Conectar no Vercel
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Import o repositório GitHub
3. **Framework Preset:** Other
4. **Build Command:** (deixe vazio)
5. **Output Directory:** `./`
6. **Deploy**

### 3. URL Final
`https://prospeccao-dashboard.vercel.app` (ou seu subdomínio)

---

## 🔄 Como Atualizar os Dados

### Opção A: Automática (GitHub Actions) - Recomendado
Crie `.github/workflows/sync.yml`:

```yaml
name: Sync Leads
on:
  schedule:
    - cron: '*/30 * * * *'  # a cada 30 min
  workflow_dispatch:  # manual
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Sync leads (requer acesso ao DB local - veja Opção B)
        run: echo "Use Opção B para sync real"
```

**Limitação:** GitHub Actions não tem acesso ao seu SQLite local.

### Opção B: Sync Local + Push (Recomendado para SQLite local)
```bash
# No seu PC (onde roda a prospecção):
cd ~/.operacao-ia/prospecting/dashboards
npm install
npm run sync-leads   # lê SQLite local → escreve leads.json
git add leads.json
git commit -m "sync: $(date '+%Y-%m-%d %H:%M')"
git push
```
> O deploy no Vercel é automático ao fazer push.

### Opção C: Supabase (Dados 100% na nuvem)
1. Crie projeto em [supabase.com](https://supabase.com)
2. Configure no Vercel (Settings → Environment Variables):
   - `SUPABASE_URL` = `https://xxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (service_role, não anon)
   - `SUPABASE_TABLE` = `prospects` (opcional)
3. No seu `config.json` local, adicione:
   ```json
   "supabase_url": "https://xxx.supabase.co",
   "supabase_service_role_key": "eyJ..."
   ```
4. O `apify_scraper.py` já sincroniza com Supabase (`--sync-supabase`)

---

## 📁 Estrutura

```
dashboards/
├── api/
│   └── leads.js          # Serverless function (GET /api/leads)
├── scripts/
│   └── sync-leads.js     # Sync SQLite → leads.json
├── prospecting-dashboard.html  # Dashboard (fetch da API)
├── leads.json            # Fallback estático (commitado)
├── vercel.json           # Config Vercel
├── package.json
└── .gitignore
```

---

## 🔧 API Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/leads` | Lista todos os leads + stats |
| `GET /api/leads?segment=logistica` | Filtra por segmento |
| `GET /api/leads?temperature=quente` | Filtra por temperatura |
| `GET /api/leads?status=respondeu` | Filtra por status |
| `GET /api/leads?limit=10&offset=0` | Paginação |

**Response:**
```json
{
  "leads": [...],
  "stats": { "total": 50, "byTemperature": {...}, "byStatus": {...}, "averageScore": 6.2 },
  "meta": { "source": "supabase|local", "timestamp": "2026-11-16T20:30:00.000Z" }
}
```

---

## 🎯 Dashboard Features

- ✅ **Dados em tempo real** (via API Supabase ou sync local)
- ✅ **Filtros** por segmento, temperatura, status
- ✅ **Cards de resumo** (Total, Quentes, Mornos, Frios, Em Sequência, Responderam)
- ✅ **Tabela ordenável** (Score desc, Step asc)
- ✅ **Status editável** (salva no localStorage do browser)
- ✅ **Auto-refresh** a cada 5 min
- ✅ **Dark theme** responsivo
- ✅ **HTTPS + CDN global** (Vercel)

---

## 🛠 Desenvolvimento Local

```bash
cd ~/.operacao-ia/prospecting/dashboards
npm install
npm run dev    # roda em http://localhost:3000
```

---

## 🔐 Segurança

- API usa `service_role_key` do Supabase (apenas backend)
- CORS liberado (`*`) para dashboard funcionar
- Variáveis sensíveis só no Vercel Dashboard (Environment Variables)
- `.gitignore` protege `.env` e `node_modules`

---

## 📞 Suporte

Problemas? Verifique:
1. Vercel Dashboard → Functions → Logs
2. Console do browser (F12) → Network → `/api/leads`
3. `npm run sync-leads` roda sem erro localmente