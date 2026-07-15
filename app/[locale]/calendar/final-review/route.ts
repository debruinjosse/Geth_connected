import { NextRequest } from "next/server";
import { createFinalReviewIcs } from "@/lib/calendar/final-review";

export function GET(request: NextRequest) {
  const ics = createFinalReviewIcs(request.nextUrl.origin);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"geth-final-project-review.ics\"",
      "Cache-Control": "no-store"
    }
  });
}
