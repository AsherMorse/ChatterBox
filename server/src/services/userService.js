import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class UserService {
    async createUser({ id, username, firstName, lastName, imageUrl }) {
        try {
            // Check if user exists in both Clerk and our database
            let clerkUser;
            try {
                clerkUser = await clerkClient.users.getUser(id);
            } catch (error) {
                // Create Clerk user if doesn't exist
                clerkUser = await clerkClient.users.createUser({
                    externalId: id,
                    username,
                    firstName,
                    lastName,
                    imageUrl
                });
            }

            // Check if user exists in our database
            const { data: existingUser } = await supabase
                .from('users')
                .select()
                .eq('id', id)
                .single();

            if (existingUser) {
                console.log('User already exists:', existingUser);
                return existingUser;
            }

            // Create new user in our database
            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{
                    id,
                    username: username || `user_${id.slice(0, 8)}`,
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: imageUrl,
                    status: 'active'
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating user:', error);
                throw new Error(`Error creating user: ${error.message}`);
            }

            console.log('Created new user:', newUser);
            return newUser;
        } catch (error) {
            console.error('UserService error:', error);
            throw error;
        }
    }

    async updateUser(id, updates) {
        // Update user in Clerk
        await clerkClient.users.updateUser(id, {
            firstName: updates.first_name,
            lastName: updates.last_name,
            imageUrl: updates.avatar_url
        });

        // Update user in our database
        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }

        return user;
    }

    async deleteUser(id) {
        // Delete user from Clerk
        await clerkClient.users.deleteUser(id);

        // Delete user from our database
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }
}

export default new UserService();