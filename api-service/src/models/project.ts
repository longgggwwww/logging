import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "projects" },
);

projectSchema.pre("save", function (this: IProject, next: (err?: any) => void) {
  this.updatedAt = new Date();
  next();
});

export const ProjectModel =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default ProjectModel;
