import { NextResponse } from "next/server";
import { CommunicationIdentityClient } from "@azure/communication-identity";

export async function POST(req: Request) {
  try {
    const connectionString = process.env.ACS_CONNECTION_STRING;
    
    if (!connectionString) {
      console.error("ACS_CONNECTION_STRING is missing in environment variables.");
      return NextResponse.json(
        { error: "Server configuration error - missing connection string" },
        { status: 500 }
      );
    }

    // Initialize the identity client
    const client = new CommunicationIdentityClient(connectionString);

    // Create a new unique user identity and a token valid for VoIP and Chat
    const { user, token, expiresOn } = await client.createUserAndToken(["voip", "chat"]);

    // In a real app we might link `user.communicationUserId` to a database user here.

    return NextResponse.json({
      communicationUserId: user.communicationUserId,
      token,
      expiresOn,
    });
  } catch (error) {
    console.error("Error creating ACS user/token:", error);
    return NextResponse.json(
      { error: "Failed to create communication user/token" },
      { status: 500 }
    );
  }
}
