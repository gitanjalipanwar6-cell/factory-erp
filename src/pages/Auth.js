import { supabase } from '../lib/supabase'

export function renderLogin(container) {
    container.innerHTML = `
        <div class="auth-container mx-auto mt-20">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access Factory ERP</p>
                </div>

                <form id="login-form">
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="email">Email Address</label>
                        <input type="email" id="email" class="auth-input-field" placeholder="name@factory.com" required>
                        <div class="auth-error-msg" id="email-error">Please enter a valid email.</div>
                    </div>

                    <div class="auth-form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label class="auth-form-label" for="password" style="margin-bottom: 0;">Password</label>
                            <a href="#" class="auth-link" style="font-size: 13px;">Forgot password?</a>
                        </div>
                        <div class="auth-input-container">
                            <input type="password" id="password" class="auth-input-field" placeholder="••••••••" required>
                            <button type="button" class="auth-password-toggle" id="toggle-password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                    </div>

                    <div class="auth-form-options">
                        <label class="auth-checkbox-group">
                            <input type="checkbox" id="remember-me">
                            <span>Remember me</span>
                        </label>
                    </div>

                    <button type="submit" class="auth-btn-primary" id="submit-btn">
                        <span class="btn-text">Log in</span>
                        <div class="auth-spinner"></div>
                    </button>
                </form>

                <div class="auth-social-login">
                    <button class="auth-btn-google">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </button>
                </div>

                <div class="auth-footer-text">
                    Don't have an account? <a href="#signup" class="auth-link">Sign up</a>
                </div>
            </div>
        </div>
    `;

    setupAuthHandlers('login');
}

export function renderSignup(container) {
    container.innerHTML = `
        <div class="auth-container mx-auto mt-20">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Create Account</h1>
                    <p>Join Factory ERP Management System</p>
                </div>

                <div class="auth-success-msg" id="signup-success">
                    Account created successfully! Redirecting to login...
                </div>

                <form id="signup-form">
                    <div class="auth-form-group">
                        <label class="auth-form-label" for="fullname">Full Name</label>
                        <input type="text" id="fullname" class="auth-input-field" placeholder="John Doe" required>
                    </div>

                    <div class="auth-form-group">
                        <label class="auth-form-label" for="email">Email Address</label>
                        <input type="email" id="email" class="auth-input-field" placeholder="name@factory.com" required>
                        <div class="auth-error-msg" id="email-error">Please enter a valid email.</div>
                    </div>

                    <div class="auth-form-group">
                        <label class="auth-form-label" for="password">Password</label>
                        <div class="auth-input-container">
                            <input type="password" id="password" class="auth-input-field" placeholder="••••••••" required minlength="8">
                            <button type="button" class="auth-password-toggle" id="toggle-password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                        </div>
                        <div class="auth-error-msg" id="password-error">Password must be at least 8 characters.</div>
                    </div>

                    <div class="auth-form-group">
                        <label class="auth-form-label" for="confirm-password">Confirm Password</label>
                        <input type="password" id="confirm-password" class="auth-input-field" placeholder="••••••••" required>
                        <div class="auth-error-msg" id="confirm-error">Passwords do not match.</div>
                    </div>

                    <button type="submit" class="auth-btn-primary" id="submit-btn">
                        <span class="btn-text">Create Account</span>
                        <div class="auth-spinner"></div>
                    </button>
                </form>

                <div class="auth-footer-text">
                    Already have an account? <a href="#login" class="auth-link">Log in</a>
                </div>
            </div>
        </div>
    `;

    setupAuthHandlers('signup');
}

function setupAuthHandlers(mode) {
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.onclick = () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = togglePasswordBtn.querySelector('svg');
            if (type === 'text') {
                icon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>';
            } else {
                icon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
            }
        };
    }

    const getUsers = async (email) => {
        const { data, error } = await supabase.from('erp_users').select('*').eq('email', email).single();
        return { data, error };
    };

    const saveUser = async (user) => {
        const { data, error } = await supabase.from('erp_users').insert([user]);
        return { data, error };
    };

    if (mode === 'login') {
        const loginForm = document.getElementById('login-form');
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submit-btn');
            
            if (!validateEmail(email)) {
                showError('email-error');
                return;
            }

            setLoading(true, submitBtn);
            
            const { data: user, error } = await getUsers(email);

            if (user && user.password === password) {
                localStorage.setItem('erp_currentUser', JSON.stringify(user));
                window.location.hash = 'dashboard';
            } else {
                setLoading(false, submitBtn);
                alert('Invalid credentials or user not found. Please sign up.');
            }
        };
    } else {
        const signupForm = document.getElementById('signup-form');
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = document.getElementById('submit-btn');
            const successMsg = document.getElementById('signup-success');

            if (!validateEmail(email)) { showError('email-error'); return; }
            if (password.length < 8) { showError('password-error'); return; }
            if (password !== confirmPassword) { showError('confirm-error'); return; }

            const { data: existingUser } = await getUsers(email);
            if (existingUser) {
                alert('Email already registered.');
                return;
            }

            setLoading(true, submitBtn);
            const { error } = await saveUser({ fullname, email, password });
            
            if (error) {
                alert('Error creating account: ' + error.message);
                setLoading(false, submitBtn);
                return;
            }

            setLoading(false, submitBtn);
            successMsg.style.display = 'block';
            signupForm.style.display = 'none';
            setTimeout(() => { window.location.hash = 'login'; }, 1500);
        };
    }
}

function validateEmail(email) {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function showError(id) {
    document.getElementById(id).style.display = 'block';
}

function setLoading(isLoading, btn) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.auth-spinner');
    if (isLoading) {
        btn.disabled = true;
        text.style.display = 'none';
        spinner.style.display = 'block';
    } else {
        btn.disabled = false;
        text.style.display = 'block';
        spinner.style.display = 'none';
    }
}
