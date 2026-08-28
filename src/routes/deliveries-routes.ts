import { DeliveriesController } from "@/controllers/deliveries-controller";
import { DeliveriesStatusController } from "@/controllers/deliveries-status-controller";
import { ensureAuthenticated } from "@/middleware/ensure-authenticated";
import { verifyUserAuthorization } from "@/middleware/verify-user-authorization";
import { Router } from "express";

const deliveriesRoutes = Router();
const deliveriesController = new DeliveriesController();
const deliveriesStatusController = new DeliveriesStatusController();

deliveriesRoutes.use(ensureAuthenticated, verifyUserAuthorization(["sale"]));
deliveriesRoutes.post("/", deliveriesController.create);
deliveriesRoutes.get("/", deliveriesController.index);
deliveriesRoutes.patch("/:id/status", deliveriesStatusController.update);

export { deliveriesRoutes };
