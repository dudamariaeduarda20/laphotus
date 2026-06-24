"""
Laphotus Face Service — InsightFace (ArcFace) embedding microservice.

Recebe uma imagem e devolve o embedding facial 512-D (ArcFace / buffalo_l).
É consumido pelo backend Next.js, que guarda/compara os vetores em pgvector.

Endpoints:
  GET  /health        -> estado + modelo carregado
  POST /embed         -> multipart "file" (imagem) -> { embedding: [512], bbox, det_score }
"""

import io
from typing import Optional
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
from insightface.app import FaceAnalysis

app = FastAPI(title="Laphotus Face Service", version="1.0.0")

# Modelo carregado uma vez no arranque (buffalo_l = deteção + ArcFace 512-D)
_face_app: Optional[FaceAnalysis] = None


def get_model() -> FaceAnalysis:
    global _face_app
    if _face_app is None:
        fa = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )
        # det_size maior = melhor deteção de rostos pequenos
        fa.prepare(ctx_id=-1, det_size=(640, 640))
        _face_app = fa
    return _face_app


@app.on_event("startup")
def _warmup():
    # Carrega o modelo no arranque para o 1º pedido ser rápido
    get_model()


@app.get("/health")
def health():
    loaded = _face_app is not None
    return {"status": "ok", "model": "buffalo_l", "loaded": loaded}


@app.post("/embed")
async def embed(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Ficheiro vazio")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Imagem inválida")

    # InsightFace espera BGR (formato OpenCV)
    rgb = np.array(img)
    bgr = rgb[:, :, ::-1]

    faces = get_model().get(bgr)
    if not faces:
        return {"found": False, "embedding": None}

    # Maior rosto (mais provável o principal)
    faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
               reverse=True)
    face = faces[0]

    # Embedding normalizado (norm L2 = 1) -> cosine via produto interno
    emb = face.normed_embedding.astype(float).tolist()

    return {
        "found": True,
        "embedding": emb,
        "dims": len(emb),
        "det_score": float(face.det_score),
        "bbox": [float(x) for x in face.bbox.tolist()],
        "faces_detected": len(faces),
    }
