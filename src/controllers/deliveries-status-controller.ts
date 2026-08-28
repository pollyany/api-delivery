import { prisma } from "@/database/prisma";
import { Request, Response } from "express";
import z from "zod";

class DeliveriesStatusController {
  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      status: z.enum(["processing", "shipped", "delivered"]),
    });



    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);

    await prisma.delivery.update({
      where: { id },
      data: { status },
    });

    return response.json({ message: "Delivery status updated successfully" });
  }
}

export { DeliveriesStatusController };