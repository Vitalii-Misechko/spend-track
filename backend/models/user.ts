import bcrypt from 'bcrypt';
import db from '../database';
import { AppError } from '../api/middleware/error';

// User interface
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  preferred_currency: string;
  preferred_date_format: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

// User creation interface (subset of User)
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  preferred_currency?: string;
  preferred_date_format?: string;
  preferred_language?: string;
}

// User update interface (all fields optional)
export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  preferred_currency?: string;
  preferred_date_format?: string;
  preferred_language?: string;
}

// Public user info (for API responses)
export interface UserPublic {
  id: number;
  name: string;
  email: string;
  preferred_currency: string;
  preferred_date_format: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

// User model class
class UserModel {
  // Create a new user
  async create(userData: CreateUserData): Promise<UserPublic> {
    try {
      // Check if email already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('Email is already in use', 400);
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Insert user into database
      const result = await db.run(
        `INSERT INTO users (
          name, 
          email, 
          password, 
          preferred_currency, 
          preferred_date_format, 
          preferred_language
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.name,
          userData.email,
          hashedPassword,
          userData.preferred_currency || 'USD',
          userData.preferred_date_format || 'MM/DD/YYYY',
          userData.preferred_language || 'en'
        ]
      );
      
      // Fetch and return the created user
      const user = await this.findById(result.lastID);
      if (!user) {
        throw new AppError('Failed to create user', 500);
      }
      
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new AppError('Failed to create user', 500);
    }
  }
  
  // Find user by ID
  async findById(id: number): Promise<User | null> {
    try {
      return await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new AppError('Failed to find user', 500);
    }
  }
  
  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await db.get<User>('SELECT * FROM users WHERE email = ?', [email]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new AppError('Failed to find user', 500);
    }
  }
  
  // Update user
  async update(id: number, userData: UpdateUserData): Promise<UserPublic> {
    try {
      // Get current user
      const user = await this.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check if email is being changed and if it's already in use
      if (userData.email && userData.email !== user.email) {
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          throw new AppError('Email is already in use', 400);
        }
      }
      
      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      
      if (userData.name) {
        updates.push('name = ?');
        values.push(userData.name);
      }
      
      if (userData.email) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        updates.push('password = ?');
        values.push(hashedPassword);
      }
      
      if (userData.preferred_currency) {
        updates.push('preferred_currency = ?');
        values.push(userData.preferred_currency);
      }
      
      if (userData.preferred_date_format) {
        updates.push('preferred_date_format = ?');
        values.push(userData.preferred_date_format);
      }
      
      if (userData.preferred_language) {
        updates.push('preferred_language = ?');
        values.push(userData.preferred_language);
      }
      
      // Add updated_at timestamp
      updates.push('updated_at = CURRENT_TIMESTAMP');
      
      // Add user ID to values array
      values.push(id);
      
      // Execute update
      if (updates.length > 0) {
        await db.run(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      
      // Fetch and return updated user
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new AppError('Failed to update user', 500);
      }
      
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating user:', error);
      throw new AppError('Failed to update user', 500);
    }
  }
  
  // Delete user
  async delete(id: number): Promise<boolean> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new AppError('Failed to delete user', 500);
    }
  }
  
  // Verify password
  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw new AppError('Failed to verify password', 500);
    }
  }
  
  // Remove sensitive data from user object
  sanitizeUser(user: User): UserPublic {
    const { password, ...publicUser } = user;
    return publicUser as UserPublic;
  }
}

export default new UserModel(); 