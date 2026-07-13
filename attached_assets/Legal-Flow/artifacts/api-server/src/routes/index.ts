import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import analyticsRouter from "./analytics";
import usersRouter from "./users";
import clientsRouter from "./clients";
import casesRouter from "./cases";
import activitiesRouter from "./activities";
import documentsRouter from "./documents";
import tasksRouter from "./tasks";
import notificationsRouter from "./notifications";
import calendarRouter from "./calendar";
import telegramRouter from "./telegram";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(analyticsRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(casesRouter);
router.use(activitiesRouter);
router.use(documentsRouter);
router.use(tasksRouter);
router.use(notificationsRouter);
router.use(calendarRouter);
router.use(telegramRouter);

export default router;
