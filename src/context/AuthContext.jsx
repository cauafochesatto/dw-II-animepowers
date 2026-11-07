import React, { useState, useEffect, useCallback } from 'react';
import { DB_CONFIG } from '../config/db';
import { AuthContext } from './authContextInstance';
import { saveUserRecord } from '../services/dataService';

const USERS_STORAGE_KEY = `${DB_CONFIG.dbName}_users_table`;
const SESSION_STORAGE_KEY = `${DB_CONFIG.dbName}_auth_session`;

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
        return JSON.parse(session);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [googleReady, setGoogleReady] = useState(false);
  const [authNotification, setAuthNotification] = useState(null);
  const [googleErrorDetails, setGoogleErrorDetails] = useState(null);

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

  const handleGoogleCredential = useCallback(async (response) => {
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

      const chosenName = payload.name || payload.email.split('@')[0];
      const syntheticUsername = payload.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');

      if (!user) {
        // Cria novo usuário no backend e storage local
        user = {
          id: 'google_' + (payload.sub || Date.now()),
          username: syntheticUsername,
          name: chosenName,
          email: payload.email.toLowerCase(),
          avatar: payload.picture || null,
          role: 'Guerreiro Google',
          createdAt: new Date().toISOString(),
          provider: 'google',
        };
        const updatedUsers = [...users, user];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      } else {
        // Atualiza avatar com a foto do Google se disponível
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

      // Persiste no backend / dataService
      const saveRes = await saveUserRecord(user);
      const authToken = saveRes.user?.token || user.token || null;

      const sessionData = {
        id: saveRes.user?.id || user.id,
        username: user.username || syntheticUsername,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        role: user.role || 'Guerreiro Google',
        provider: 'google',
        token: authToken,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      setAuthNotification({
        type: 'success',
        text: `Login Google realizado com sucesso! Bem-vindo, ${user.name}.`,
      });
      return { success: true, message: `Bem-vindo, ${user.name}!`, user: sessionData };
    } catch (err) {
      console.error('Erro ao processar credencial Google:', err);
      return { success: false, message: 'Falha ao autenticar com o Google.' };
    }
  }, [getUsers]);

  // Captura retorno OAuth por URL (hash ou query params) caso o fluxo direto seja acionado
  useEffect(() => {
    try {
      const fullHash = window.location.hash || '';
      if (fullHash.includes('id_token=')) {
        const hashParams = new URLSearchParams(fullHash.replace(/^#/, ''));
        const idToken = hashParams.get('id_token');
        if (idToken) {
          // Limpa hash mantendo rota limpa
          window.history.replaceState(null, '', window.location.pathname);
          setTimeout(() => {
            handleGoogleCredential({ credential: idToken });
          }, 50);
        }
      }

      if (window.location.search.includes('error=')) {
        const searchParams = new URLSearchParams(window.location.search);
        const err = searchParams.get('error');
        if (err) {
          setTimeout(() => {
            setGoogleErrorDetails(`Aviso OAuth do Google: ${err}`);
          }, 50);
        }
      }
    } catch {
      // ignora
    }
  }, [handleGoogleCredential]);

  // Inicializa Google Identity Services com tratamento de erro
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
          use_fedcm_for_prompt: false,
          error_callback: (err) => {
            console.warn('[Google Auth] Erro retornado pelo GIS:', err);
            if (mounted) {
              setGoogleErrorDetails(
                'O Google bloqueou a solicitação ou a origem atual não está cadastrada no Google Cloud Console.'
              );
            }
          },
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

  const register = async (nicknameOrEmail, password, avatarUrl = null) => {
    const cleanNick = (nicknameOrEmail || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanNick || !cleanPassword) {
      return { success: false, message: 'Por favor, preencha o nickname e a senha.' };
    }

    if (cleanNick.length < 2) {
      return { success: false, message: 'O nickname deve ter pelo menos 2 caracteres.' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    const users = getUsers();
    const cleanLower = cleanNick.toLowerCase();
    const exists = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanLower) ||
        (u.name && u.name.toLowerCase() === cleanLower) ||
        (u.email && u.email.toLowerCase() === cleanLower)
    );

    if (exists) {
      return { success: false, message: 'Este nickname já está cadastrado! Escolha outro ou faça login.' };
    }

    const chosenAvatar = avatarUrl || null;
    const syntheticEmail = cleanNick.includes('@')
      ? cleanNick.toLowerCase()
      : `${cleanNick.toLowerCase().replace(/[^a-z0-9_-]/g, '')}@animepowers.local`;

    const newUser = {
      id: 'user_' + Date.now(),
      username: cleanNick,
      name: cleanNick,
      email: syntheticEmail,
      password: cleanPassword,
      avatar: chosenAvatar,
      role: 'Guerreiro do arquivo',
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      const regRes = await saveUserRecord(newUser);

      const sessionData = {
        id: regRes.user?.id || newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        token: regRes.user?.token || null,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      return { success: true, message: `Conta criada com sucesso! Bem-vindo, ${cleanNick}.` };
    } catch {
      return { success: false, message: 'Erro ao salvar no banco local do navegador.' };
    }
  };

  const login = async (nicknameOrEmail, password, remember = true) => {
    const cleanInput = (nicknameOrEmail || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanInput || !cleanPassword) {
      return { success: false, message: 'Por favor, informe seu nickname e senha.' };
    }

    // 1. Tenta autenticar na API Neon Functions (PostgreSQL)
    try {
      const apiBase = DB_CONFIG.apiUrl || 'http://localhost:3001/api';
      const isEmail = cleanInput.includes('@');
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? cleanInput : undefined,
          username: !isEmail ? cleanInput : undefined,
          password: cleanPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const sessionData = {
            id: data.user.id,
            username: data.user.username || data.user.name,
            name: data.user.name || data.user.username,
            email: data.user.email,
            avatar: data.user.avatar || null,
            role: data.user.role || 'Guerreiro',
            provider: data.user.provider || 'local',
            token: data.token || null,
          };

          if (remember) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          }

          // Atualiza cache local de usuários com a senha para fallback offline
          const users = getUsers();
          const nextUsers = users.filter(
            (u) => u.id !== sessionData.id && u.email?.toLowerCase() !== sessionData.email?.toLowerCase()
          );
          nextUsers.push({ ...sessionData, password: cleanPassword });
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));

          setCurrentUser(sessionData);
          return {
            success: true,
            message: `Login realizado com sucesso! Bem-vindo de volta, ${sessionData.name}.`,
            user: sessionData,
          };
        }
      } else if (res.status === 401) {
        const errData = await res.json().catch(() => null);
        return { success: false, message: errData?.error || 'Senha incorreta.' };
      }
    } catch {
      // API offline: segue para autenticação local
    }

    // 2. Fallback para banco local
    const users = getUsers();
    const cleanLower = cleanInput.toLowerCase();
    const user = users.find(
      (u) =>
        ((u.username && u.username.toLowerCase() === cleanLower) ||
          (u.name && u.name.toLowerCase() === cleanLower) ||
          (u.email && u.email.toLowerCase() === cleanLower)) &&
        u.password === cleanPassword
    );

    if (!user) {
      return { success: false, message: 'Nickname ou senha incorretos.' };
    }

    const sessionData = {
      id: user.id,
      username: user.username || user.name,
      name: user.name || user.username || user.email.split('@')[0],
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || 'Guerreiro do arquivo',
      provider: user.provider || 'local',
    };

    if (remember) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentUser(sessionData);
    return { success: true, message: `Login realizado com sucesso! Bem-vindo de volta, ${sessionData.name}.` };
  };

  /**
   * Dispara o fluxo OAuth2 padrão do Google via redirecionamento de autorização
   */
  const startGoogleOAuthRedirect = () => {
    try {
      const clientId = DB_CONFIG.googleClientId;
      const redirectUri = window.location.origin + window.location.pathname;
      const nonce = Math.random().toString(36).substring(2);
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}&prompt=select_account`;

      window.location.href = authUrl;
    } catch (err) {
      console.warn('Erro ao redirecionar para OAuth Google:', err);
    }
  };

  const loginWithGoogle = () => {
    if (!window.google?.accounts?.id) {
      startGoogleOAuthRedirect();
      return { success: true, message: 'Iniciando autenticação Google...' };
    }
    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Se o OneTap for bloqueado pelo navegador, usa o fluxo OAuth explícito
          startGoogleOAuthRedirect();
        }
      });
      return { success: true, message: 'Selecione sua conta no popup do Google.' };
    } catch {
      startGoogleOAuthRedirect();
      return { success: true, message: 'Abrindo autenticação Google...' };
    }
  };

  // Login de contingência / acesso com perfil Google caso o cliente não tenha configurado OAuth Cloud
  const loginWithGoogleSimulated = async (customEmail) => {
    const userEmail = (customEmail || 'guerreiro.anime@gmail.com').trim().toLowerCase();
    const userName = userEmail
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const users = getUsers();
    let user = users.find((u) => u.email.toLowerCase() === userEmail);
    if (!user) {
      user = {
        id: 'google_user_' + Date.now(),
        username: userEmail.split('@')[0],
        email: userEmail,
        name: userName,
        avatar: null,
        role: 'Membro via Google',
        createdAt: new Date().toISOString(),
        provider: 'google',
      };
      const updatedUsers = [...users, user];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    }

    await saveUserRecord(user);

    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role || 'Membro via Google',
      provider: 'google',
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
        ...customOptions,
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
      saveUserRecord(updated);
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
        startGoogleOAuthRedirect,
        loginWithGoogleSimulated,
        renderGoogleButton,
        handleGoogleCredential,
        googleReady,
        googleErrorDetails,
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
