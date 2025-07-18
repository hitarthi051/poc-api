/* eslint-disable */
import express, { Request, Response } from "express";
import { addTask, addUser, deleteTask, deleteUser, getAllTasks, getAllUsers, getTaskById, getTaskByUsername, getUserById, updateTask, updateUser } from "../repository/poc-repo";

const router: express.Router = express.Router();

router.get("/details", (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Documentation</title>
      <link rel="stylesheet" type="text/css" href="/swagger/swagger-ui/swagger-ui.css" />
    </head>
    <body>
      Hello from serverless
    </body>
    </html>`;
  // console.log('This is Html File:', html);
  res.send(html);
});

router.get("/get-all-users", async (req: Request, res: Response) => {
  try {
    const result = await getAllUsers();

    res.status(result.statusCode).json({
      message:
        result.statusCode === 200 ? "Users fetched successfully not neww" : result.body,
      data: result.statusCode === 200 ? result.body : undefined,
      error: result.statusCode !== 200 ? result.body : undefined,
    });
  } catch (error: any) {
    console.error("Error in /get-all-users route:", error);
    res.status(500).json({
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
});

router.post(
  "/get-tasks-by-username",
  async (req: Request, res: Response) => {
    try {
      const result = await getTaskByUsername(req);
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error: any) {
      console.error("Error in /get-tasks-by-username route:", error);
      res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/get-all-tasks",
  async (req: Request, res: Response) => {
    try {
      const result = await getAllTasks();

      res.status(result.statusCode).json({
        message:
          result.statusCode === 200
            ? "Tasks fetched successfully (green)"
            : result.body,
        data: result.statusCode === 200 ? result.body : undefined,
        error: result.statusCode !== 200 ? result.body : undefined,
      });
    } catch (error: any) {
      console.error("Error in /get-all-tasks route:", error);
      res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.post("/add-user", async (req: Request, res: Response) => {
  try {
    console.log("add-user from app.ts called");
    const result = await addUser(req);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error("Error in /add-user route:", error);
    res.status(500).json({
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
});

router.post("/add-task", async (req: Request, res: Response) => {
  try {
    const result = await addTask(req);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error("Error in /add-task route:", error);
    res.status(500).json({
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
});

router.post(
  "/get-single-task",
  async (req: Request, res: Response) => {
    try {
      const result = await getTaskById(req);
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error: any) {
      console.error("Error in /get-single-task route:", error);
      res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/get-single-user",
  async (req: Request, res: Response) => {
    try {
      const result = await getUserById(req);
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error: any) {
      console.error("Error in /get-single-user route:", error);
      res.status(500).json({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.put(
  "/update-task/:id",
  async (req: Request, res: Response) => {
    try {
      const result = await updateTask(req);

      // Return the appropriate status and body from the result
      res.status(result.statusCode).send(result.body);
    } catch (error: any) {
      console.error("Error in /update-task route:", error);
      res.status(500).send({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.put(
  "/update-user/:id",
  async (req: Request, res: Response) => {
    try {
      const result = await updateUser(req);

      // Return the appropriate status and body from the result
      res.status(result.statusCode).send(result.body);
    } catch (error: any) {
      console.error("Error in /update-user route:", error);
      res.status(500).send({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/delete-task/:id",
  async (req: Request, res: Response) => {
    try {
      const result = await deleteTask(req);

      // Return the appropriate status and body from the result
      res.status(result.statusCode).send(result.body);
    } catch (error: any) {
      console.error("Error in /delete-task route:", error);
      res.status(500).send({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/delete-user/:id",
  async (req: Request, res: Response) => {
    try {
      const result = await deleteUser(req);

      // Return the appropriate status and body from the result
      res.status(result.statusCode).send(result.body);
    } catch (error: any) {
      console.error("Error in /delete-task route:", error);
      res.status(500).send({
        message: "An unexpected error occurred.",
        error: error.message,
      });
    }
  }
);

export = router;
