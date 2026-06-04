import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/client";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Basic format validation: must be a data URL and an image type
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Must be a base64 image data URL." },
        { status: 400 },
      );
    }

    // Validate size (roughly 2MB limit in binary)
    // Base64 encoding is ~1.33x the binary size, so 2MB binary is ~2.7MB base64 characters.
    if (image.length > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size too large. Maximum size allowed is 2MB." },
        { status: 400 },
      );
    }

    // Update user's image field in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
    });

    // Invalidate client-side cache for all pages to reflect avatar updates instantly
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, avatarUrl: image }, { status: 200 });
  } catch (error) {
    console.error("[avatar-upload] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove user's image field from the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    // Invalidate client-side cache for all pages to reflect avatar updates instantly
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[avatar-delete] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete avatar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
