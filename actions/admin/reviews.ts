"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { reportError } from "@/lib/logger";
import { ActionResult, failFrom, ok } from "@/lib/action-result";


export async function deleteVoice(id: string): Promise<ActionResult> {
  try {
    await requireAdmin(); // Kluczowe zabezpieczenie

    await db.review.delete({ where: { id } });
    revalidatePath("/dashboard/comments");
    return ok();
  } catch (error) {
    // Wcześniej każda awaria — także błąd bazy — wracała jako "Action
    // forbidden.", więc log i komunikat mówiły co innego niż rzeczywistość.
    reportError(error, { area: "admin.reviews", id });
    return failFrom(error, "INTERNAL", "Failed to remove the voice.");
  }
}