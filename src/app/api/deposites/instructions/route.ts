import { NextResponse } from "next/server";

export async function GET() {
  const accountName =
    process.env.TELEBIRR_ACCOUNT_NAME;

  const accountNumber =
    process.env.TELEBIRR_ACCOUNT_NUMBER;

  if (
    !accountName ||
    !accountNumber
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Telebirr payment information is not configured",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    success: true,

    data: {
      method: "Telebirr",

      accountName,

      accountNumber,

      instructions: [
        "Open your Telebirr application.",
        "Send the amount you want to deposit to the account shown above.",
        "Complete the payment.",
        "Keep your Telebirr transaction number.",
        "Take a screenshot of the successful payment.",
        "Submit the transaction number and screenshot below.",
        "Your balance will be updated after admin verification.",
      ],
    },
  });
}