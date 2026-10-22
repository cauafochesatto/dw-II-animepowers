import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DB_CONFIG } from '../config/db';

const USERS_STORAGE_KEY = `${DB_CONFIG.dbName}_users_table`;
const SESSION_STORAGE_KEY = `${DB_CONFIG.dbName}_auth_session`;

// Nenhuma conta é pré-carregada: usuários se cadastram pelo formulário.

const AuthContext = createContext(null);

// Decodificador seguro de JWT do Google compatível com UTF-8
function decodeGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}

// Carregar Google Identity Services (GIS) script dinamicamente
function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      if (window.google?.accounts?.id) {
        resolve(window.google);
        return;
      }
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      console.warn('Google Identity Services não pôde ser carregado externamente.');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [googleReady, setGoogleReady] = useState(false);
  const [authNotification, setAuthNotification] = useState(null);

  const getUsers = useCallback(() => {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const handleGoogleCredential = useCallback((response) => {
    try {
      if (!response?.credential) {
        return { success: false, message: 'Nenhuma credencial Google recebida.' };
      }

      // Decodifica o JWT token do Google com suporte completo a UTF-8
      const payload = decodeGoogleJwt(response.credential);
      if (!payload || !payload.email) {
        return { success: false, message: 'Não foi possível ler os dados da conta Google.' };
      }

      const users = getUsers();
      let user = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());

      if (!user) {
        // Cria novo usuário se não existir
        user = {
          id: 'google_' + (payload.sub || Date.now()),
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          avatar: payload.picture || null,
          role: 'Membro via Google',
          createdAt: new Date().toISOString(),
          provider: 'google'
        };
        const updatedUsers = [...users, user];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      } else {
        // Atualiza avatar com a foto do Google se não tiver ou estiver desatualizado
        if (payload.picture && !user.avatar) {
          user.avatar = payload.picture;
        }
        if (!user.name && payload.name) {
          user.name = payload.name;
        }
        user.provider = 'google';
        const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      }

      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        role: user.role || 'Membro do arquivo',
        provider: 'google'
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      setAuthNotification({ type: 'success', text: `Login Google bem-sucedido! Bem-vindo, ${user.name}.` });
      return { success: true, message: `Bem-vindo, ${user.name}!`, user: sessionData };
    } catch (err) {
      console.error('Erro ao processar credencial Google:', err);
      return { success: false, message: 'Falha ao autenticar com o Google.' };
    }
  }, [getUsers]);

  // Inicializa Google Identity Services
  useEffect(() => {
    let mounted = true;
    loadGoogleScript().then((google) => {
      if (!mounted || !google?.accounts?.id) return;
      try {
        google.accounts.id.initialize({
          client_id: DB_CONFIG.googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true
        });
        setGoogleReady(true);
      } catch (err) {
        console.warn('Aviso na inicialização do Google GIS:', err);
      }
    });
    return () => {
      mounted = false;
    };
  }, [handleGoogleCredential]);

  const register = (email, password, avatarUrl = null) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'Por favor, preencha todos os campos.' };
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, message: 'Digite um e-mail válido.' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    const users = getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (exists) {
      return { success: false, message: 'Este e-mail já está cadastrado! Faça login.' };
    }

    const chosenAvatar = avatarUrl || null;

    const newUser = {
      id: 'user_' + Date.now(),
      email: cleanEmail,
      password: cleanPassword,
      name: cleanEmail.split('@')[0],
      avatar: chosenAvatar,
      role: 'Membro do arquivo',
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      const sessionData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        role: newUser.role
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      return { success: true, message: 'Conta criada com sucesso!' };
    } catch {
      return { success: false, message: 'Erro ao salvar no banco local do navegador.' };
    }
  };

  const login = (email, password, remember = true) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'Por favor, informe seu e-mail e senha.' };
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (!user) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      role: user.role || 'Membro do arquivo'
    };

    if (remember) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentUser(sessionData);
    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const loginWithGoogle = () => {
    if (!window.google?.accounts?.id) {
      return { success: false, message: 'Google Identity Services não está pronto.' };
    }
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap não pôde ser exibido automaticamente:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
        }
      });
      return { success: true, message: 'Selecione sua conta no popup do Google.' };
    } catch (e) {
      console.warn('Erro ao abrir prompt Google:', e);
      return { success: false, message: 'Não foi possível abrir o prompt do Google.' };
    }
  };

  // Login de contingência / acesso rápido Google caso o navegador ou firewall bloqueie o iframe externo
  const loginWithGoogleSimulated = (customEmail) => {
    const userEmail = (customEmail || 'guerreiro.google@gmail.com').trim().toLowerCase();
    const userName = userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const users = getUsers();
    let user = users.find((u) => u.email.toLowerCase() === userEmail);
    if (!user) {
      user = {
        id: 'google_sim_' + Date.now(),
        email: userEmail,
        name: userName,
        avatar: null,
        role: 'Membro via Google',
        createdAt: new Date().toISOString(),
        provider: 'google'
      };
      const updatedUsers = [...users, user];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role || 'Membro via Google',
      provider: 'google'
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    setCurrentUser(sessionData);
    setAuthNotification({ type: 'success', text: `Login Google concluído como ${user.name}!` });
    return { success: true, message: `Conectado com sucesso via Google (${user.email})!`, user: sessionData };
  };

  const renderGoogleButton = (elementId, customOptions = {}) => {
    if (!window.google?.accounts?.id) return false;
    const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!el) return false;
    try {
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        type: 'standard',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 320,
        locale: 'pt-BR',
        ...customOptions
      });
      return true;
    } catch (e) {
      console.warn('Erro ao renderizar botão oficial Google GIS:', e);
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      // Revoga o token do Google se logado via Google
      if (currentUser?.provider === 'google' && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  const updateUserAvatar = (newAvatarUrl) => {
    if (!currentUser) return;
    const updated = { ...currentUser, avatar: newAvatarUrl };
    setCurrentUser(updated);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      const users = getUsers();
      const nextUsers = users.map((u) =>
        u.id === currentUser.id ? { ...u, avatar: newAvatarUrl } : u
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register,
        login,
        loginWithGoogle,
        loginWithGoogleSimulated,
        renderGoogleButton,
        handleGoogleCredential,
        googleReady,
        authNotification,
        setAuthNotification,
        logout,
        updateUserAvatar,
        dbConfig: DB_CONFIG,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
