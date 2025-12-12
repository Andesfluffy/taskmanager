const firebaseVersion = "11.0.1";

const firebaseScriptIds = {
  app: "firebase-app-compat",
  auth: "firebase-auth-compat",
};

function injectScript(id: string, src: string) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Firebase scripts can only load in the browser."));
  }

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.getAttribute("data-loaded") === "true") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export type FirebaseUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

export type GoogleAuthProvider = {
  providerId?: string;
};

export type FirebaseAuth = {
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
  signInWithPopup: (provider: GoogleAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

type FirebaseNamespace = {
  apps: object[];
  initializeApp: (config: FirebaseConfig) => void;
  auth: (() => FirebaseAuth) & { GoogleAuthProvider: new () => GoogleAuthProvider };
};

let firebasePromise: Promise<{ firebase: FirebaseNamespace; auth: FirebaseAuth }> | null = null;

export async function getFirebase(config: FirebaseConfig) {
  if (firebasePromise) return firebasePromise;

  firebasePromise = (async () => {
    await injectScript(
      firebaseScriptIds.app,
      `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js`,
    );
    await injectScript(
      firebaseScriptIds.auth,
      `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth-compat.js`,
    );
    const firebase = (window as typeof window & { firebase?: FirebaseNamespace }).firebase;
    if (!firebase) {
      throw new Error("Firebase SDK failed to load.");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const auth = firebase.auth();
    return { firebase, auth };
  })();

  return firebasePromise;
}
