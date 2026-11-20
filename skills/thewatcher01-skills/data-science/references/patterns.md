# Patterns d'analyse courants — Datalake SubventionAI

## 1. Analyse sectorielle

```sql
-- KPIs par secteur NAF
SELECT e."nafCode", count(*) as total,
  count(CASE WHEN e."fundabilityScore" > 40 THEN 1 END) as eligible,
  round(avg(e."fundabilityScore")::numeric, 1) as avg_score
FROM dl_entities e
WHERE e."entityType" = 'ASSOCIATION' AND e."nafCode" IS NOT NULL
GROUP BY e."nafCode" ORDER BY count(*) DESC LIMIT 20;
```

## 2. Taux de financement par région

```sql
SELECT e.region,
  count(DISTINCT e.siren) as total_assos,
  count(DISTINCT v.siren) as financees,
  round(100.0 * count(DISTINCT v.siren) / NULLIF(count(DISTINCT e.siren), 0), 1) as taux
FROM dl_entities e
LEFT JOIN dl_subventions_versees v ON e.siren = v.siren
WHERE e."entityType" = 'ASSOCIATION' AND e.region NOT SIMILAR TO '[0-9]+'
GROUP BY e.region ORDER BY taux DESC;
```

## 3. Feature engineering pour scoring

```python
import pandas as pd
import psycopg2

conn = psycopg2.connect("dbname=datalake user=datalake password=datalake_dev host=127.0.0.1 port=5434")

df = pd.read_sql("""
    SELECT e.siren, e."nafCode", e.department, e.region,
           e."employeeCount", e."fundabilityScore", e."digitalMaturityScore",
           e.website IS NOT NULL as has_website,
           e.email IS NOT NULL as has_email,
           e."hasDpo",
           (e."industryData"->>'ess') = 'O' as is_ess,
           count(v.id) as nb_versements,
           coalesce(sum(v.montant), 0) as total_montant
    FROM dl_entities e
    LEFT JOIN dl_subventions_versees v ON e.siren = v.siren
    WHERE e."entityType" = 'ASSOCIATION'
    GROUP BY e.siren, e."nafCode", e.department, e.region,
             e."employeeCount", e."fundabilityScore", e."digitalMaturityScore",
             e.website, e.email, e."hasDpo", e."industryData"
""", conn)
```

## 4. Anomaly detection

```python
from sklearn.ensemble import IsolationForest

features = ['nb_versements', 'total_montant', 'employeeCount']
X = df[features].fillna(0)
clf = IsolationForest(contamination=0.05, random_state=42)
df['anomaly'] = clf.fit_predict(X)
anomalies = df[df['anomaly'] == -1]
```

## 5. Embedding similarity search

```sql
-- Top 10 associations similaires à un SIREN donné
SELECT b.siren, b."legalName", b.city,
  1 - (a.embedding <=> b.embedding) as similarity
FROM dl_entities a, dl_entities b
WHERE a.siren = '813065398'
  AND b.siren != a.siren
  AND b.embedding IS NOT NULL
ORDER BY a.embedding <=> b.embedding
LIMIT 10;
```

## 6. Scoring batch reimport

```python
# Export scores → CSV → reimport PG (séparer compute et I/O)
scores_df.to_csv('/tmp/scores.csv', index=False)

# Reimport via COPY
with conn.cursor() as cur:
    cur.execute("CREATE TEMP TABLE tmp_scores (siren text, score int)")
    with open('/tmp/scores.csv') as f:
        cur.copy_expert("COPY tmp_scores FROM STDIN CSV HEADER", f)
    cur.execute("""
        UPDATE dl_entities e SET "fundabilityScore" = t.score
        FROM tmp_scores t WHERE e.siren = t.siren
    """)
    conn.commit()
```
