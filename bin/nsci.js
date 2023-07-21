#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { Command } from "commander";
import { $ } from "execa";
import fs from "node:fs";
import path from "node:path";

const log = {
  success: (message) => {
    console.log(chalk.bold.greenBright(message));
  },
  error: (message) => {
    console.log(chalk.bold.redBright(message));
  },
  warning: (message) => {
    console.log(chalk.bold.yellowBright(message));
  },
};

const program = new Command();

program
  .name("nsci")
  .description("A nodejs-based script for setting up SSH key logins")
  .version("1.0.0");

program
  .command("copy", { isDefault: true })
  .description("upload ssh public key to server")
  .action(async () => {
    // TODO: support windows
    if (process.platform === "win32") {
      log.error("Windows is not supported");
      process.exit(1);
    }

    // console.log(process.env.HOME);
    // TODO: ssh-keygen -R hostname

    // judge the id_rsa.pub file exists
    const defaultPath = path.join(process.env.HOME, ".ssh", "id_rsa.pub");
    if (fs.existsSync(defaultPath)) {
      const content = fs.readFileSync(defaultPath);
      console.log(content.toString());
      log.success("defaultPath exists");
    } else {
      log.warning("defaultPath not exists");
      await $({ stdio: "inherit" })`ssh-keygen -t rsa -b 4096`;
      log.success("generate success!");
    }

    const user = await input({
      message: "Please input your user on host",
      default: "root",
    });
    const host = await input({ message: "Please input host" });

    const pubkeyPath = await input({
      message: "Please input your pubkey path",
      default: path.join(process.env.HOME, ".ssh", "id_rsa.pub"),
    });

    try {
      const { stdout } = await $({
        stdio: "inherit",
      })`ssh-copy-id -i ${pubkeyPath} ${user}@${host}`;

      log.success("upload success", stdout);
    } catch (error) {
      log.error(error.shortMessage);
      log.error("upload error");
    }
  });

program.parseAsync();
