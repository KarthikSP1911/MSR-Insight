import winston from "winston";
import chalk from "chalk";

const { combine, timestamp, json, errors, printf } = winston.format;

const LEVEL_STYLES = {
  error: chalk.bold.red("ERROR"),
  warn: chalk.bold.yellow("WARN "),
  info: chalk.bold.cyan("INFO "),
  http: chalk.bold.magenta("HTTP "),
  debug: chalk.bold.gray("DEBUG"),
};

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const label = LEVEL_STYLES[level] || level.toUpperCase();
  const time = chalk.dim(ts);
  const body = stack || message;

  delete meta.service;
  const extra = Object.keys(meta).length ? chalk.dim(` ${JSON.stringify(meta)}`) : "";

  return `${time} ${label} ${body}${extra}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(errors({ stack: true }), timestamp({ format: "HH:mm:ss" })),
  defaultMeta: { service: "express-backend" },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(timestamp(), json())
          : combine(timestamp({ format: "HH:mm:ss" }), consoleFormat),
    }),
  ],
});

export default logger;
