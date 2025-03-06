import { ChildProcess, spawn } from "child_process";
import path from "path";
import config from "../config";

interface FrotzProcess {
  process: ChildProcess;
  sessionId: string;
  lastActivity: Date;
}

class FrotzService {
  private processes: Map<string, FrotzProcess> = new Map();

  /**
   * Start a new dfrotz process for a game
   * @param sessionId The session ID
   * @param gameName The name of the game file
   * @returns The initial output from the game
   */
  async startGame(sessionId: string, gameName: string): Promise<string> {
    const gamePath = path.join(config.gamePath, gameName);

    // Start dfrotz process
    const process = spawn("dfrotz", ["-p", gamePath]);

    // Store the process
    this.processes.set(sessionId, {
      process,
      sessionId,
      lastActivity: new Date(),
    });

    // Wait for initial output
    return new Promise((resolve, reject) => {
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();

        // Check if the game is showing a "MORE" prompt
        if (output.includes("***MORE***")) {
          // Send a newline to continue
          if (process.stdin) {
            process.stdin.write("\n");
          }
          // Remove the "MORE" prompt from the output
          output = output.replace(/\*\*\*MORE\*\*\*\s*$/, "");
          return; // Continue waiting for more data
        }

        // Check if the game is waiting for input
        if (output.includes(">")) {
          // Remove the prompt
          output = output.replace(/>\s*$/, "");
          resolve(output.trim());
        }
      });

      process.stderr.on("data", (data) => {
        console.error(`dfrotz error: ${data}`);
      });

      process.on("error", (error) => {
        reject(error);
      });

      process.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`dfrotz process exited with code ${code}`));
        }
      });

      // Set a timeout in case the game doesn't output a prompt
      setTimeout(() => {
        resolve(output.trim());
      }, 5000);
    });
  }

  /**
   * Send a command to a running dfrotz process
   * @param sessionId The session ID
   * @param command The command to send
   * @returns The output from the game
   */
  async sendCommand(sessionId: string, command: string): Promise<string> {
    const frotzProcess = this.processes.get(sessionId);

    if (!frotzProcess) {
      throw new Error(`No active process found for session ${sessionId}`);
    }

    // Update last activity time
    frotzProcess.lastActivity = new Date();

    // Send the command to the process
    if (!frotzProcess.process.stdin) {
      throw new Error("Process stdin is not available");
    }
    frotzProcess.process.stdin.write(`${command}\n`);

    // Wait for output
    return new Promise((resolve, reject) => {
      let output = "";

      if (!frotzProcess.process.stdout) {
        reject(new Error("Process stdout is not available"));
        return;
      }

      const dataHandler = (data: Buffer) => {
        output += data.toString();

        // Check if the game is showing a "MORE" prompt
        if (output.includes("***MORE***")) {
          // Send a newline to continue
          if (frotzProcess.process.stdin) {
            frotzProcess.process.stdin.write("\n");
          }
          // Remove the "MORE" prompt from the output
          output = output.replace(/\*\*\*MORE\*\*\*\s*$/, "");
          return; // Continue waiting for more data
        }

        // Check if the game is waiting for input
        if (output.includes(">")) {
          // Remove the prompt
          output = output.replace(/>\s*$/, "");

          // Remove the command from the output (if it's echoed back)
          const commandRegex = new RegExp(`^${command}\\s*\\n`, "i");
          output = output.replace(commandRegex, "");

          // Clean up listeners
          frotzProcess.process.stdout?.removeListener("data", dataHandler);

          resolve(output.trim());
        }
      };

      frotzProcess.process.stdout.on("data", dataHandler);

      // Set a timeout in case the game doesn't output a prompt
      setTimeout(() => {
        frotzProcess.process.stdout?.removeListener("data", dataHandler);
        resolve(output.trim());
      }, 5000);
    });
  }

  /**
   * Terminate a dfrotz process
   * @param sessionId The session ID
   */
  terminateProcess(sessionId: string): void {
    const frotzProcess = this.processes.get(sessionId);

    if (frotzProcess) {
      frotzProcess.process.kill();
      this.processes.delete(sessionId);
    }
  }

  /**
   * Clean up inactive processes
   * @param maxInactiveTime Maximum inactive time in milliseconds
   */
  cleanupInactiveProcesses(maxInactiveTime: number = 30 * 60 * 1000): void {
    const now = new Date();

    for (const [sessionId, process] of this.processes.entries()) {
      const inactiveTime = now.getTime() - process.lastActivity.getTime();

      if (inactiveTime > maxInactiveTime) {
        this.terminateProcess(sessionId);
      }
    }
  }
}

export default new FrotzService();
