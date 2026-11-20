# ISO 8000-8 — Les 9 Dimensions Qualite Data

Reference complete pour l'audit data.

## Definitions operationnelles

### 1. Validite (Syntactic Quality)
Conformite au schema declare : types, domaines de valeurs, formats.
- SIREN = exactement 9 chiffres, passe la validation Luhn
- RNA = W suivi de 9 chiffres
- NAF = 4 chiffres + 1 lettre (ex: 6201Z)
- Dates = ISO 8601 (YYYY-MM-DD)
- Emails = format RFC 5322
- URLs = format RFC 3986 avec scheme

**Metrique** : % records passant la validation Zod complete.
**Seuil Gold** : >= 99.5%

### 2. Exactitude (Semantic Accuracy)
Concordance avec la source de reference. Le nom en base correspond-il au nom officiel ?
**Methode** : Cross-ref automatique via API officielle (SIRENE, RNA).
**Metrique** : % champs verifies par cross-ref.

### 3. Fiabilite (Source Reliability)
Score de confiance par source.
- **Tier A** (0.9-1.0) : API officielle certifiee (INSEE, DJEPVA)
- **Tier B** (0.7-0.9) : API officielle non certifiee (data.gouv.fr CSV)
- **Tier C** (0.3-0.7) : Scraping, OCR, VLM
**Metrique** : Score pondere 0-100 par source.

### 4. Fraicheur (Timeliness)
Age de la donnee = `now() - source_updated_at`.
- **Critique** : J+1 (subventions actives, eligibilite)
- **Standard** : J+7 (stats, signaux)
- **Tolere** : J+30 (archives)
**Metrique** : Delai median d'ingestion en heures.

### 5. Completude (Completeness)
Taux de champs obligatoires non-null.
Champs critiques : siren, legalName, entityType, department.
**Seuil Gold** : >= 97%

### 6. Coherence (Consistency)
Absence de contradictions.
- Intra-record : deadline >= date_ouverture
- Inter-record : meme SIREN = memes infos de base
**Metrique** : nombre anomalies / total records.

### 7. Unicite (Uniqueness)
Pas de doublons sur la cle primaire metier.
- Entites : SIREN unique
- Subventions : externalId unique
- Marches : uid unique
**Seuil Gold** : >= 99.5%

### 8. Structure (Structural Quality)
Parseabilite et normalisation.
- Encodage UTF-8 valide
- Dates au format ISO
- Noms normalises (trim, capitalisation)
**Seuil Gold** : >= 99%

### 9. Tracabilite (Traceability)
Provenance complete de chaque enregistrement.
Champs requis : source_name, source_updated_at, ingested_at, lineage_run_id.
**Seuil** : = 100% (bloquant, pas de degradation acceptee)

## SLOs par tier

| Dimension | Gold | Silver | Bronze |
|-----------|------|--------|--------|
| Validite | >= 99.5% | 98-99.5% | >= 90% |
| Completude | >= 97% | 90-97% | >= 80% |
| Unicite | >= 99.5% | 98-99.5% | >= 95% |
| Fraicheur | J+1 | J+7 | J+30 |
| Tracabilite | 100% | 100% | 100% |
