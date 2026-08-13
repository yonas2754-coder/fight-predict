import {
  NextRequest,
  NextResponse,
} from "next/server";

import cloudinary from "@/lib/cloudinary";

import {
  validateTelegramInitData,
} from "@/lib/telegram-auth";

export async function POST(
  request: NextRequest,
) {
  try {
    // ---------------------------------------------
    // Read form data
    // ---------------------------------------------

    const formData =
      await request.formData();

    const initData =
      formData.get("initData");

    const file =
      formData.get("file");

    // ---------------------------------------------
    // Validate Telegram authentication
    // ---------------------------------------------

    if (
      typeof initData !== "string" ||
      !initData
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Telegram authentication is required",
        },
        {
          status: 401,
        },
      );
    }

    const telegramUser =
      validateTelegramInitData(
        initData,
      );

    if (!telegramUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Telegram authentication",
        },
        {
          status: 401,
        },
      );
    }

    // ---------------------------------------------
    // Validate file
    // ---------------------------------------------

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment screenshot is required",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate file type
    // ---------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only JPG, PNG, and WEBP images are allowed",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Validate file size
    // ---------------------------------------------

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Screenshot must be smaller than 5MB",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------
    // Convert file
    // ---------------------------------------------

    const bytes =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(bytes);

    // ---------------------------------------------
    // Upload to Cloudinary
    // ---------------------------------------------

    const uploadResult =
      await new Promise<any>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder:
                  "fight-predict/deposits",

                resource_type:
                  "image",

                public_id:
                  `telegram-${telegramUser.id}-${Date.now()}`,
              },

              (
                error,
                result,
              ) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              },
            )
            .end(buffer);
        },
      );

    // ---------------------------------------------
    // Return image URL
    // ---------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        url:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,
      },
    });
  } catch (error) {
    console.error(
      "Screenshot upload error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to upload screenshot",
      },
      {
        status: 500,
      },
    );
  }
}