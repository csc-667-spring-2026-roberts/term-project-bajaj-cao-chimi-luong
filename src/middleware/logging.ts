import { NextFunction, Request, Response } from "express";

const logging = (req: Request, _res: Response, next: NextFunction): void => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
};

export default logging;
