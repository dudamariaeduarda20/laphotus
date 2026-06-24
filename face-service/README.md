# Laphotus Face Service (InsightFace)

Microserviço Python que extrai embeddings faciais **ArcFace 512-D** (modelo
`buffalo_l`) a partir de imagens. É consumido pelo backend Next.js, que guarda
e compara os vetores em **pgvector**.

## Arquitetura

```
Browser (MediaPipe câmera) ──captura frame──► Next.js /api/photos/search-face
                                                      │
                                                      ▼
                                          face-service /embed (InsightFace)
                                                      │ embedding 512-D
                                                      ▼
                                          pgvector KNN (distância cosseno)
                                                      │ photoIds + score
                                                      ▼
                                                  resultados
```

## Setup (uma vez)

```bash
cd face-service
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

O modelo `buffalo_l` (~280MB) é descarregado automaticamente no 1º arranque
para `~/.insightface/models/`.

## Arrancar

```bash
# a partir da raiz do projeto
npm run face-service
# ou diretamente:
cd face-service && ./venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
```

## Endpoints

- `GET /health` → estado + se o modelo está carregado
- `POST /embed` (multipart `file`) → `{ found, embedding: [512], det_score, bbox }`

## Re-indexar fotos existentes

Fotos carregadas antes desta integração não têm embedding. Para indexá-las:

```bash
npm run reindex-faces
```

## Variáveis de ambiente (Next.js)

- `FACE_SERVICE_URL` (default `http://127.0.0.1:8000`)
