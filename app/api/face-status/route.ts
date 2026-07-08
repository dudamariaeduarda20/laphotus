import { NextResponse } from "next/server";
import {
  awsEnabled,
  isUsingAWSRekognition,
  AWS_FACE_THRESHOLD,
} from "@/lib/services/faceService";

// Lê env em runtime (não no build) — senão o valor fica congelado no bundle.
export const dynamic = "force-dynamic";

/**
 * GET /api/face-status
 *
 * Diagnóstico do motor de busca facial em produção. NÃO expõe valores de
 * credenciais — só booleanos e metadados não-sensíveis. Abrir esta URL no
 * ambiente de produção mostra exatamente que peça está em falta.
 */
export async function GET() {
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";

  return NextResponse.json({
    // Resultado final: se true → busca usa Rekognition (verde "ativa").
    rekognitionActive: isUsingAWSRekognition(),
    awsEnabledOnUpload: awsEnabled(),

    // Peças (booleanos — nunca o valor real da secret):
    hasAccessKey: accessKey.length > 0,
    hasSecretKey: secret.length > 0,
    accessKeyPrefix: accessKey ? `${accessKey.slice(0, 4)}…` : null, // ex "AKIA…"
    enabledFlagRaw: process.env.AWS_REKOGNITION_ENABLED ?? null, // "true"/"false"/null (não é secret)
    region: process.env.AWS_REGION ?? null,
    collectionId: process.env.AWS_REKOGNITION_COLLECTION_ID ?? null,
    faceMatchThreshold: AWS_FACE_THRESHOLD,

    hint:
      "rekognitionActive precisa ser true. Se false: falta hasAccessKey/hasSecretKey (env não chegou ao runtime — reveja scope Production + redeploy) ou enabledFlagRaw='false'.",
  });
}
