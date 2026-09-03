import QRCode from "qrcode";

/**
 * Returns the permanent public join URL for a business token.
 */
export function getBusinessJoinUrl(businessToken: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${appUrl}/join/${businessToken}`;
}

/**
 * Generates a PNG data URL for a given text/URL.
 * Optimized for mobile display and crisp printing.
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a", // Deep slate
      light: "#ffffff", // Pure white
    },
  });
}

/**
 * Generates an SVG string for a given text/URL.
 */
export async function generateQRCodeSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
