/**
 * Configuración global para Jest
 */
import '@testing-library/jest-dom';

// Mock de Firebase completo
const mockFirebaseAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    setPersistence: jest.fn(() => Promise.resolve())
};

const mockFirebaseFirestore = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            set: jest.fn(() => Promise.resolve()),
            get: jest.fn(() => Promise.resolve({
                exists: true,
                data: () => ({}),
                id: 'test-id'
            })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve()),
            onSnapshot: jest.fn()
        })),
        add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
        get: jest.fn(() => Promise.resolve({
            docs: [],
            forEach: jest.fn()
        })),
        where: jest.fn(() => mockFirebaseFirestore.collection()),
        orderBy: jest.fn(() => mockFirebaseFirestore.collection()),
        limit: jest.fn(() => mockFirebaseFirestore.collection()),
        onSnapshot: jest.fn()
    }))
};

const mockFirebaseStorage = {
    ref: jest.fn(() => ({
        put: jest.fn(() => Promise.resolve({
            ref: {
                getDownloadURL: jest.fn(() => Promise.resolve('https://test-url.com/image.jpg'))
            }
        })),
        delete: jest.fn(() => Promise.resolve())
    }))
};

// Mock global de Firebase
global.firebase = {
    apps: [{ name: 'test-app' }],
    auth: jest.fn(() => mockFirebaseAuth),
    firestore: jest.fn(() => mockFirebaseFirestore),
    storage: jest.fn(() => mockFirebaseStorage),
    initializeApp: jest.fn()
};

// Mock de window.auth, window.db, window.storage
global.window.auth = mockFirebaseAuth;
global.window.db = mockFirebaseFirestore;
global.window.storage = mockFirebaseStorage;

// Mock de localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock de location
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000',
        hostname: 'localhost',
        pathname: '/index.html',
        search: ''
    },
    writable: true
});

// Mock de console para tests más limpios
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Helpers globales para tests
global.testHelpers = {
    createMockUser: (overrides = {}) => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        ...overrides
    }),
    
    createMockElement: (tag = 'div', attributes = {}) => {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    },
    
    waitFor: (fn, timeout = 1000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                try {
                    const result = fn();
                    if (result) {
                        resolve(result);
                    } else if (Date.now() - startTime >= timeout) {
                        reject(new Error('Timeout waiting for condition'));
                    } else {
                        setTimeout(check, 10);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            check();
        });
    }
};

// Limpiar mocks antes de cada test// filepath: c:\Users\julian\EduCheck-Pro\tests\setup.js
/**
 * Configuración global para Jest
 */
import '@testing-library/jest-dom';

// Mock de Firebase completo
const mockFirebaseAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    setPersistence: jest.fn(() => Promise.resolve())
};

const mockFirebaseFirestore = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            set: jest.fn(() => Promise.resolve()),
            get: jest.fn(() => Promise.resolve({
                exists: true,
                data: () => ({}),
                id: 'test-id'
            })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve()),
            onSnapshot: jest.fn()
        })),
        add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
        get: jest.fn(() => Promise.resolve({
            docs: [],
            forEach: jest.fn()
        })),
        where: jest.fn(() => mockFirebaseFirestore.collection()),
        orderBy: jest.fn(() => mockFirebaseFirestore.collection()),
        limit: jest.fn(() => mockFirebaseFirestore.collection()),
        onSnapshot: jest.fn()
    }))
};

const mockFirebaseStorage = {
    ref: jest.fn(() => ({
        put: jest.fn(() => Promise.resolve({
            ref: {
                getDownloadURL: jest.fn(() => Promise.resolve('https://test-url.com/image.jpg'))
            }
        })),
        delete: jest.fn(() => Promise.resolve())
    }))
};

// Mock global de Firebase
global.firebase = {
    apps: [{ name: 'test-app' }],
    auth: jest.fn(() => mockFirebaseAuth),
    firestore: jest.fn(() => mockFirebaseFirestore),
    storage: jest.fn(() => mockFirebaseStorage),
    initializeApp: jest.fn()
};

// Mock de window.auth, window.db, window.storage
global.window.auth = mockFirebaseAuth;
global.window.db = mockFirebaseFirestore;
global.window.storage = mockFirebaseStorage;

// Mock de localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock de location
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000',
        hostname: 'localhost',
        pathname: '/index.html',
        search: ''
    },
    writable: true
});

// Mock de console para tests más limpios
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Helpers globales para tests
global.testHelpers = {
    createMockUser: (overrides = {}) => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        ...overrides
    }),
    
    createMockElement: (tag = 'div', attributes = {}) => {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    },
    
    waitFor: (fn, timeout = 1000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                try {
                    const result = fn();
                    if (result) {
                        resolve(result);
                    } else if (Date.now() - startTime >= timeout) {
                        reject(new Error('Timeout waiting for condition'));
                    } else {
                        setTimeout(check, 10);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            check();
        });
    }
};

// Limpiar mocks antes de cada test