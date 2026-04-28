/**
 * Authentication utilities for TaskFlow
 * Uses localStorage for user management
 */

import { getUsers, saveUsers, setCurrentUser, clearCurrentUser, getCurrentUser, seedDemoData } from './storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * SHA-256 hash fonksiyonu
 * localStorage tabanlı demo için yeterli güvenlik seviyesi
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'taskflow_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register a new user
 */
export async function register(name, email, password) {
  const users = getUsers();

  // Check if email already exists
  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor.' };
  }

  // Validate inputs
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'İsim en az 2 karakter olmalıdır.' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Geçerli bir e-posta adresi giriniz.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
  }

  const hashedPassword = await hashPassword(password);
  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  // Set current user (without password)
  const { password: _, ...safeUser } = user;
  setCurrentUser(safeUser);

  // Seed demo data for new user
  seedDemoData(user.id);

  return { success: true, user: safeUser };
}

/**
 * Login with email and password
 */
export async function login(email, password) {
  const users = getUsers();

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return { success: false, error: 'E-posta veya şifre hatalı.' };
  }

  const hashedPassword = await hashPassword(password);
  if (user.password !== hashedPassword) {
    return { success: false, error: 'E-posta veya şifre hatalı.' };
  }

  const { password: _, ...safeUser } = user;
  setCurrentUser(safeUser);

  return { success: true, user: safeUser };
}

/**
 * Logout current user
 */
export function logout() {
  clearCurrentUser();
}

/**
 * Get the currently logged-in user
 */
export function getLoggedInUser() {
  return getCurrentUser();
}

/**
 * Ensure a demo user exists for testing purposes
 * Called on login page load - creates the user if not already present
 */
export async function ensureDemoUser() {
  const users = getUsers();
  const demoEmail = 'demo@taskflow.com';
  const existing = users.find((u) => u.email === demoEmail);
  if (existing) return; // Already exists

  const hashedPassword = await hashPassword('demo123');
  const user = {
    id: uuidv4(),
    name: 'Demo Kullanıcı',
    email: demoEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  // Seed demo board data for this user
  seedDemoData(user.id);
}
