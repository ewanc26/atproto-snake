import { goto } from '$app/navigation';

/**
 * Handles the login process.
 * @param username The username entered by the user.
 * @param password The password entered by the user.
 * @returns A promise that resolves to a boolean indicating login success.
 */
export async function login(username: string, password: string): Promise<boolean> {
    // Basic validation for demonstration purposes
    if (username === 'user' && password === 'password') {
        localStorage.setItem('loggedIn', 'true');
        await goto('/'); // Redirect to the game page
        return true;
    } else {
        return false;
    }
}

/**
 * Handles the logout process.
 * Clears the 'loggedIn' flag from localStorage and redirects to the login page.
 */
export function logout(): void {
    localStorage.removeItem('loggedIn');
    goto('/login');
}

/**
 * Checks if the user is currently logged in.
 * @returns True if the user is logged in, false otherwise.
 */
export function isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
}