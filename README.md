# BioHelix

Workbench IA open-source pour la recherche scientifique et l'analyse de donnees.
Maintenu et developpe par Tomcu.

BioHelix est un environnement de recherche autonome concu pour assister les chercheurs, bio-informaticiens et ingenieurs de donnees. La plateforme permet d'executer des analyses de sequences genomiques, des calculs de biochimie, des simulations et de rediger des syntheses scientifiques verifiables a partir de vos propres donnees et fichiers locaux.

L'affichage des reflexions internes du modele (thinking) est entierement desactive dans l'interface afin de garantir une restitution directe, propre et concise des resultats.

---

## Fonctionnalites principales

- Interface web dediee accessible localement sur le port 4096.
- Execution directe de scripts Python et de commandes terminal avec gestion des autorisations.
- Connecteurs specialises pour la recherche de litterature et de bases de donnees biologiques (PubMed, UniProt, ChEMBL, ClinicalTrials).
- Architecture modulaire supportant les principaux fournisseurs d'intelligence artificielle (Google Gemini, Groq, OpenAI, Anthropic, DeepSeek).
- Restitution immediate des reponses sans pollution visuelle ni affichage des chaines de pensee interieures.

---

## Pre-requis systeme

Avant d'installer et d'executer BioHelix, assurez-vous d'avoir installe les outils suivants sur votre machine :

1. **Bun** (version 1.1 ou superieure) : moteur d'execution JavaScript et gestionnaire de paquets principal.
2. **Node.js** (version 18 ou superieure) et npm.
3. **Python 3** (version 3.10 ou superieure) avec les bibliotheques scientifiques souhaitees (ex. Biopython, pandas, numpy).
4. **Git** pour la gestion de versions.

---

## Installation

Clonez le depot puis installez l'ensemble des dependances :

```bash
git clone https://github.com/tomcu78/BioHelix.git
cd BioHelix
bun install
```

Compilez l'interface web frontend et regenerez les ressources statiques :

```bash
bun run --cwd frontend/workspace build
bun run backend/cli/script/generate-web-assets.ts
```

---

## Demarrage de BioHelix

Pour lancer le serveur web de BioHelix avec l'interface graphique :

```bash
export PATH="$HOME/.bun/bin:$PATH"
OPENSCIENCE_SKIP_ONBOARDING=1 bun --no-env-file run --cwd backend/cli --conditions=browser src/index.ts web --port 4096
```

L'application demarre et ouvre automatiquement votre navigateur sur :
**http://localhost:4096**

---

## Configuration des Providers et Cles API

BioHelix utilise un systeme standard de configuration situe dans votre repertoire personnel (`~/.config/openscience/` et `~/.openscience/`).

### 1. Enregistrement des cles API

Vos cles d'acces aux differents fournisseurs sont stockees dans le fichier `~/.openscience/auth.json`.

Exemple de structure complete pour `~/.openscience/auth.json` :

```json
{
  "google": {
    "type": "api",
    "key": "VOTRE_CLE_API_GOOGLE_GEMINI"
  },
  "groq": {
    "type": "api",
    "key": "VOTRE_CLE_API_GROQ"
  },
  "openai": {
    "type": "api",
    "key": "VOTRE_CLE_API_OPENAI"
  }
}
```

Pour creer ou modifier ce fichier manuellement en ligne de commande :

```bash
mkdir -p ~/.openscience
cat << 'AUTH_EOF' > ~/.openscience/auth.json
{
  "google": {
    "type": "api",
    "key": "VOTRE_CLE_API_ICI"
  }
}
AUTH_EOF
chmod 600 ~/.openscience/auth.json
```

Vous pouvez egalement ajouter une cle de maniere interactive via la commande integree :

```bash
bun --no-env-file run --cwd backend/cli src/index.ts keys add
```

### 2. Selection du modele par defaut

Le choix du modele utilise par l'agent est defini dans le fichier de configuration `~/.config/openscience/openscience.json`.

Exemple pour Google Gemini (recommande) :

```json
{
  "model": "google/gemini-2.0-flash"
}
```

Exemple pour Groq :

```json
{
  "model": "groq/qwen/qwen3.8-27b"
}
```

Exemple pour OpenAI :

```json
{
  "model": "openai/gpt-4o"
}
```

Pour appliquer une configuration par defaut rapidement :

```bash
mkdir -p ~/.config/openscience
cat << 'CONFIG_EOF' > ~/.config/openscience/openscience.json
{
  "model": "google/gemini-2.0-flash"
}
CONFIG_EOF
```

---

## Modeles recommandes

### Google Gemini
- `google/gemini-2.0-flash` : Optimise, rapide, avec support des outils scientifiques et quota standard.
- `google/gemini-3.5-flash-lite` : Modele leger pour des requetes rapides a faible latence.
- `google/gemini-3-flash-preview` : Modele avance pour le raisonnement multimodal complexe.

### Groq
- `groq/qwen/qwen3.8-27b` : Vitesse de generation tres elevee.
- `groq/openai/gpt-oss-120b` : Grand modele ouvert pour les taches textuelles denses.

---

## Utilisation via le Terminal (CLI)

En complement de l'interface web, BioHelix peut executer des requetes directement en ligne de commande :

```bash
bun --no-env-file run --cwd backend/cli src/index.ts run --model google/gemini-2.0-flash "Ecris un script Python pour calculer le taux de GC d'un fichier FASTA"
```

Pour lister l'ensemble des modeles disponibles selon vos cles configurees :

```bash
bun --no-env-file run --cwd backend/cli src/index.ts models
```

---

## Architecture du projet

- `backend/cli` : Coeur applicatif en TypeScript, gestionnaire de sessions, orchestrateur d'outils, moteur de communication avec les fournisseurs d'IA.
- `frontend/workspace` : Application web principale fournissant l'interface utilisateur.
- `frontend/ui` : Bibliotheque de composants graphiques pour les visualisations, le traceur d'actions et le rendu Markdown.
- `assets` : Identite visuelle et logos de BioHelix.

---

## Licence

Ce projet est sous licence Apache 2.0. Consultez le fichier [LICENSE](LICENSE) pour plus de details.
