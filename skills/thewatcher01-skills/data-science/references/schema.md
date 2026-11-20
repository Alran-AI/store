# Schéma Datalake — Tables principales

## dl_entities (2.8M rows)

| Colonne | Type | Description |
|---------|------|-------------|
| id | text PK | UUID |
| siren | text NOT NULL | SIREN 9 chiffres |
| siretSiege | text | SIRET siège 14 chiffres |
| rna | text | RNA (W + 9 chiffres) |
| legalName | text NOT NULL | Dénomination légale |
| entityType | enum | COMPANY, ASSOCIATION, MUTUELLE, COLLECTIVITE, SCOP, ESMS, FONDATION |
| nafCode | text | Code NAF/APE (ex: 88.99B) |
| nafLabel | text | Libellé NAF |
| address, postalCode, city, department, region, country | text | Géolocalisation |
| geoLat, geoLng | float | Coordonnées GPS |
| employeeCount | int | Effectif salarié |
| annualRevenue | numeric | Chiffre d'affaires |
| foundingDate | timestamp | Date création |
| isActive | bool | Entité active |
| hasDpo | bool | DPO enregistré CNIL |
| website, email, phone | text | Contacts |
| objetSocial | text | Objet social |
| industryData | JSONB | Données RNA/SIRENE (ess, rnaId, nature, categorieJuridique...) |
| fundabilityScore | int | Score finançabilité 10-100 |
| digitalMaturityScore | int | Score maturité numérique 0-100 |
| cnilRiskScore | float | Score risque CNIL 0-100 |
| hotLeadScore | float | Score lead composite |
| embedding | vector(1024) | Embedding bge-m3 |

**Index** : siren (unique), nafCode, department, region, entityType, embedding (HNSW cosine)

## dl_subventions_versees (168K rows)

| Colonne | Type | Description |
|---------|------|-------------|
| id | serial PK | |
| siren | text NOT NULL | SIREN bénéficiaire |
| financeur | text | Nom du financeur |
| programme | text | Nom du programme |
| montant | numeric | Montant versé (EUR) |
| annee | int | Année du versement |

**Index** : siren, financeur, annee

## dl_subvention_anomalies (3.1K rows)

| Colonne | Type | Description |
|---------|------|-------------|
| siren | text UNIQUE | |
| anomaly_type | text | UNUSUAL_PATTERN, OVER_FUNDED, UNDER_FUNDED |
| anomaly_score | numeric | Score -1 à 1 |
| nb_subventions | int | Nombre de versements |
| total_montant | numeric | Total cumulé |
| ratio_vs_sector | numeric | Ratio vs médiane secteur |
| naf2 | text | Code NAF 2 digits |
| department | text | Département |

## dl_job_queue

| Colonne | Type | Description |
|---------|------|-------------|
| id | text PK | |
| jobType | text | embed_entities_batch, vlm_web_extract, classify_subvention... |
| status | enum | PENDING, PROCESSING, COMPLETED, FAILED |
| payload | JSONB | Paramètres du job |
| result | JSONB | Résultat du job |
| workerTarget | text | workstation (GPU) ou vps (CPU) |
