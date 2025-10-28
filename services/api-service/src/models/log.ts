import mongoose, { Schema, Document } from "mongoose";

export interface ILogModel extends Document {
  project: mongoose.Types.ObjectId;
  function: mongoose.Types.ObjectId;
  method: string;
  type: string;
  request?: any;
  response?: any;
  consoleLog?: string;
  additionalData?: any;
  latency?: number;
  createdBy?: any;
  createdAt: Date;
}

const logSchema = new Schema<ILogModel>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    function: {
      type: Schema.Types.ObjectId,
      ref: "Function",
      required: true,
      index: true,
    },
    method: { type: String, required: true },
    type: { type: String, required: true },
    request: { type: Schema.Types.Mixed },
    response: { type: Schema.Types.Mixed },
    consoleLog: { type: String },
    additionalData: { type: Schema.Types.Mixed },
    latency: { type: Number },
    createdBy: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true },
  },
  { collection: "logs" },
);

logSchema.index({ project: 1 });
logSchema.index({ function: 1 });
logSchema.index({ method: 1 });
logSchema.index({ type: 1 });
logSchema.index({ createdAt: 1 });

export const LogModel =
  mongoose.models.Log || mongoose.model<ILogModel>("Log", logSchema);

export default LogModel;
