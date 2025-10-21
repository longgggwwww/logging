export interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}

export interface Event {
  name: string;
  execute: (...args: any[]) => void;
}
