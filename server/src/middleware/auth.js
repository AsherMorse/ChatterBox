import passport from 'passport';
import jwt from 'jsonwebtoken';

export const authenticateJWT = passport.authenticate('jwt', { session: false });

export const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
    );
}; 