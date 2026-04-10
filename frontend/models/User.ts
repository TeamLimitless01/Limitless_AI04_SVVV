import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  username?: string;
  email: string;
  password?: string;
  provider?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  provider: { type: String, required: false, default: 'local' },
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
