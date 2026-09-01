import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CreateAppointmentRequestBody,
  CreateAppointmentRequestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const clinicAddress =
  "Shop No: 01, Bldg No: 84, Navchaitanya CHS, Police Colony, Nehru Nagar, Kurla East - 400024";

router.post("/appointments", (req, res) => {
  const parsed = CreateAppointmentRequestBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please check the appointment details and try again.",
    });
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(parsed.data.email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const response = CreateAppointmentRequestResponse.parse({
    appointmentId: `DC-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: "request_received",
    receivedAt: new Date(),
    clinicAddress,
  });

  res.status(201).json(response);
});

export default router;