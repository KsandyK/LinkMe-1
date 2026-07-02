/**
 * CCBill payment service helpers.
 * Used by routes/credits.ts for redirect URL construction and webhook verification.
 */
import crypto from "crypto";

/**
 * Build a CCBill one-time payment redirect URL.
 * The real URL format depends on your CCBill account configuration —
 * update the base URL and parameter names to match your form setup.
 */
export function generateCCBillPaymentUrl(
  amount: number,
  userId: string,
  packId: string,
): string {
  const accnum    = process.env.CCBILL_CLIENT_ACCNUM ?? "";
  const subAccount = process.env.CCBILL_SUBACCOUNT ?? "";
  const formName  = process.env.CCBILL_FORM_NAME ?? "";
  const salt      = process.env.CCBILL_SALT ?? "";

  const params = new URLSearchParams({
    clientAccnum:             accnum,
    clientSubacc:             subAccount,
    formName:                 formName,
    initialPeriod:            "1",
    initialPeriodAmount:      amount.toFixed(2),
    initialPeriodIsRecurring: "0",
    currencyCode:             "840",    // USD
    "x-userId":               userId,
    "x-packId":               packId,
    "x-credits":              String(amount),
  });

  // Hash = MD5(initialPeriodAmount + "." + currencyCode + salt)
  const toHash = `${amount.toFixed(2)}.840${salt}`;
  const formDigest = crypto.createHash("md5").update(toHash).digest("hex");
  params.set("formDigest", formDigest);

  return `https://secure.ccbill.com/jpost/signup.cgi?${params.toString()}`;
}

/**
 * Verify the MD5 signature on a CCBill webhook POST.
 * CCBill documentation: signature = MD5(subscriptionId + salt)
 */
export function verifyCCBillSignature(postData: Record<string, string>): boolean {
  const salt = process.env.CCBILL_SALT ?? "";
  const received = (postData.signature ?? "").toLowerCase();
  const subscriptionId = postData.subscriptionId ?? postData.transactionId ?? "";
  if (!subscriptionId || !received) return false;

  const expected = crypto
    .createHash("md5")
    .update(subscriptionId + salt)
    .digest("hex")
    .toLowerCase();

  return expected === received;
}
