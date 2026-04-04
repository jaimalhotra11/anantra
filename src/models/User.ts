import { User } from '@/types'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema<User>({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String, 
        required: [true, 'Email is required'],
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    }, 
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    avatar: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false,
    },
    verificationTokenExpiry: {
        type: Date,
        select: false,
    }
}, {
    timestamps: true
})

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        console.log(error)
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema)

export default UserModel