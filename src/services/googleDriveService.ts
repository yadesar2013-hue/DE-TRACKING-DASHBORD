/**
 * Service d'intégration Google Drive (Google Workspace API)
 * Conforme au skill workspace-integration
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialisation unique de Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Scope Google Drive requis
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible d’obtenir le jeton d’accès Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Erreur de connexion Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

/**
 * Récupère les fichiers de sauvegarde ou justificatifs sur Google Drive
 */
export const listDriveFiles = async (): Promise<DriveFileItem[]> => {
  if (!cachedAccessToken) {
    throw new Error('Authentification requise avec Google Drive.');
  }

  const query = encodeURIComponent("trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,createdTime)&pageSize=30`,
    {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Erreur lors de la lecture de Google Drive.');
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Sauvegarde la fiche d'évaluation sur Google Drive au format JSON / Rapport
 */
export const saveEvaluationToDrive = async (
  filename: string,
  content: string,
  mimeType = 'application/json'
): Promise<DriveFileItem> => {
  if (!cachedAccessToken) {
    throw new Error('Authentification requise avec Google Drive.');
  }

  const metadata = {
    name: filename,
    mimeType: mimeType,
    description: "Sauvegarde Executive Performance Tracker - Fondation HYSTERESIS",
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Échec de la sauvegarde sur Google Drive.');
  }

  return await response.json();
};
