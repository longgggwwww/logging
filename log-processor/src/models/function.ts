import mongoose, { Schema, Document } from "mongoose";

export interface IFunctionModel extends Document {
  name: string;
  projectId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const functionSchema = new Schema<IFunctionModel>(
  {
    name: { type: String, required: true },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "functions" },
);

functionSchema.index({ projectId: 1, name: 1 }, { unique: true });
functionSchema.pre(
  "save",
  function (this: IFunctionModel, next: (err?: any) => void) {
    this.updatedAt = new Date();
    next();
  },
);

export const FunctionModel =
  mongoose.models.Function ||
  mongoose.model<IFunctionModel>("Function", functionSchema);

export default FunctionModel;
