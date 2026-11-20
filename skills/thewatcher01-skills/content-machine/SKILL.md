---
name: content-machine
description: "Génère du contenu marketing pour LinkedIn, blog, newsletter et études de cas. Utiliser quand l'utilisateur demande de rédiger du contenu, un post LinkedIn, un article de blog, ou une newsletter."
metadata: { "openclaw": { "emoji": "✍️" } }
user-invocable: true
---

# Content Machine

## Objectif

Générer du **contenu marketing professionnel** pour les canaux de communication de Teddy Deberdt, en respectant le tone of voice et les formats définis dans les références.

## Déclencheurs

- `/contenu LinkedIn post NIS2`
- `/contenu blog article subventions cyber`
- `/contenu newsletter mars 2026`
- `/contenu case-study ACME Corp`
- "écris un post LinkedIn sur les subventions"
- "rédige un article de blog sur NIS2"
- "prépare la newsletter de ce mois"
- "fais une étude de cas sur cette mission"

## Types de contenu

| Type | Identifiant | Format de référence |
|------|-------------|---------------------|
| Post LinkedIn | `linkedin_post` | `references/formats/linkedin-post.md` |
| Article de blog | `blog_article` | Structure SEO : titre, chapô, H2/H3, conclusion, CTA |
| Newsletter | `newsletter` | Édito + 3 actus + 1 conseil + CTA |
| Étude de cas | `case_study` | Contexte → Problème → Solution → Résultats |

## Paramètres d'entrée

| Paramètre | Obligatoire | Exemple |
|-----------|-------------|---------|
| `type` | Oui | `linkedin_post`, `blog_article`, `newsletter`, `case_study` |
| `sujet` | Oui | "NIS2", "subventions cyber", "audit RGPD association" |
| `angle` | Non | "retour d'expérience", "data chiffrée", "actualité", "conseil pratique" |
| `cta` | Non | "Prenez RDV", "Téléchargez le guide", lien spécifique |

## Processus de génération

1. **Identifier le type** de contenu demandé
2. **Charger le format** de référence correspondant (`references/formats/`)
3. **Appliquer le tone of voice** défini dans `references/formats/tone-of-voice.md`
4. **Générer le contenu** en respectant :
   - La structure du format (hook, corps, CTA pour LinkedIn)
   - Les contraintes de longueur (1300 chars max pour LinkedIn)
   - Le ton expert, data-driven, sans fluff
   - La langue française
5. **Vérifier** la cohérence, les faits cités, et les données chiffrées

## Format de sortie

Le contenu brut, prêt à copier-coller, avec :
- Le contenu principal formaté selon le type
- Les hashtags recommandés (LinkedIn)
- Le meilleur créneau de publication suggéré
- Des suggestions de visuels/illustrations (description textuelle)

## Règles

- Tout contenu en **français**.
- Ton expert et factuel — voir `references/formats/tone-of-voice.md`.
- Les données chiffrées doivent être **sourcées et vérifiables**.
- Ne jamais inventer de statistiques. Si pas de données fiables, reformuler sans chiffre.
- Respecter les limites de caractères par plateforme.
- Chaque contenu doit avoir un **CTA clair** (appel à l'action).
- Ne pas mentionner de clients nommément sans accord explicite — utiliser des anonymisations ("une PME toulousaine", "une association de santé").
