import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  functions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  populateFunctions(): Promise<IProject>;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, unique: true },
    functions: [{ type: Schema.Types.ObjectId, ref: "Function" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "projects" },
);

projectSchema.pre("save", function (this: IProject, next: (err?: any) => void) {
  this.updatedAt = new Date();
  next();
});

projectSchema.methods.populateFunctions = async function (): Promise<IProject> {
  return this.populate("functions");
};

export const ProjectModel =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default ProjectModel;
