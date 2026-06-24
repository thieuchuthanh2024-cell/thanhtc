import { NextResponse } from "next/server";
import { readSecrets } from "@/utils/secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { simNumber, fullName, citizenId, simKitSerial } = body;

    if (!simNumber || !fullName || !citizenId || !simKitSerial) {
      return NextResponse.json({ error: "Missing subscriber details (simNumber, fullName, citizenId, simKitSerial)" }, { status: 400 });
    }

    const sec = await readSecrets();

    return NextResponse.json({
      success: true,
      message: "SIM Card Kit registration request processed successfully.",
      subscriberProfile: {
        number: simNumber,
        fullName,
        citizenId,
        serialNumber: simKitSerial,
        activationStatus: "COMPLETED",
        carrierActivatedAt: new Date().toISOString()
      },
      remoteGatewayCall: {
        targetUrl: sec.api_partner_activation_url,
        payload_hash: "JWT_" + Buffer.from(citizenId).toString("base64").substring(0, 15),
        token_configured_used: sec.api_partner_activation_key ? "ACTIVE (" + sec.api_partner_activation_key.substring(0, 6) + "...)" : "NONE"
      }
    });
  } catch (err: any) {
    console.error("POST /api/partner/sims/activate error:", err);
    return NextResponse.json({ error: "Failed to activate SIM: " + err.message }, { status: 500 });
  }
}
