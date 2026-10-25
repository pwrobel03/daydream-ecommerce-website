"use server"
import * as z from "zod"
import bcrypt from "bcrypt"
import { DeleteAccountSchema } from "@/schemas"
import { db } from "@/lib/db"
import { requireOwnAccountWrites } from "@/lib/guards"
import { releaseOrderReservationIn } from "@/lib/orders"
import { isBackOfficeRole } from "@/lib/demo"
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result"

/**
 * Usuwa konto zalogowanego użytkownika razem z jego danymi, w jednej transakcji.
 * `Order.user` nie ma `onDelete`, więc zamówienia kasujemy jawnie; adresy
 * dopiero po użytkowniku i zamówieniach, bo to one trzymają klucze obce.
 */
export const deleteAccount = async (
  values: z.infer<typeof DeleteAccountSchema>
): Promise<ActionResult> => {
  let userId: string
  try {
    const session = await requireOwnAccountWrites()
    userId = session.user.id!
  } catch (error) {
    return failFrom(error, "UNAUTHORIZED", "Unauthorized!")
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true, role: true, addressId: true },
  })
  if (!user) return fail("NOT_FOUND", "User not found!")
  if (isBackOfficeRole(user.role)) return fail("FORBIDDEN", "Admin accounts cannot be deleted")

  // Konto z hasłem potwierdza hasłem, konto OAuth — wpisanym ponownie e-mailem.
  const confirmed = user.password
    ? !!values.password && (await bcrypt.compare(values.password, user.password))
    : !!values.email && !!user.email && values.email.trim().toLowerCase() === user.email.toLowerCase()
  if (!confirmed) return fail("INVALID_INPUT", "Confirmation does not match")

  await db.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { userId },
      select: { id: true, addressId: true },
    })
    for (const order of orders) await releaseOrderReservationIn(tx, order.id)

    const addressIds = [user.addressId, ...orders.map((o) => o.addressId)].filter(
      (id): id is string => !!id
    )

    await tx.order.deleteMany({ where: { userId } })
    await tx.review.deleteMany({ where: { userId } })
    await tx.account.deleteMany({ where: { userId } })
    if (user.email) {
      await tx.verificationToken.deleteMany({ where: { email: user.email } })
      await tx.passwordResetToken.deleteMany({ where: { email: user.email } })
    }
    await tx.user.delete({ where: { id: userId } })
    await tx.address.deleteMany({ where: { id: { in: addressIds } } })
  })

  return ok()
}
