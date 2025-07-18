import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, runTransaction } from 'firebase/firestore';
import {
  LogIn, Users, TrendingUp, DollarSign, LogOut, Plus, Minus, CalendarDays, ClipboardList, Package, Scale, Percent, Wallet, Info, CheckCircle, XCircle, BarChart, ShoppingCart
} from 'lucide-react';

// Global variables provided by the Canvas environment
// Using the provided Firebase projectId for appId fallback
const appId = typeof __app_id !== 'undefined' ? __app_id : 'trackbus-a328c'; // Updated with your actual Firebase Project ID
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  // Your actual Firebase config from Firebase Console
  apiKey: "AIzaSyCi8YlQoXI9GYOPIYeAXdFNlZ9sp_0zRDk",
  authDomain: "trackbus-a328c.firebaseapp.com",
  projectId: "trackbus-a328c",
  storageBucket: "trackbus-a328c.firebasestorage.app",
  messagingSenderId: "957001124011",
  appId: "1:957001124011:web:c5fc8db59d40105f388fee",
  measurementId: "G-5DR4VEQLK8"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase (only once)
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Handle case where firebaseConfig might be missing or invalid
  // Display a user-friendly message or fallback UI
}

// Ensure Inter font is loaded
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const App = () => {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'functions', 'partners', 'expenses', 'sales'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false); // New state for exit confirmation modal

  const [partners, setPartners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  // Static login credentials (client-side only for this example)
  const STATIC_USERNAME = 'admin';
  const STATIC_PASSWORD = 'password123'; // Corrected to 'password123'

  // --- Firebase Authentication and Data Fetching ---
  useEffect(() => {
    if (!app || !db || !auth) {
      setLoginError("Firebase not configured. Please ensure __firebase_config is set.");
      setIsLoading(false); // Stop loading if Firebase isn't configured
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Sign in anonymously if no user is authenticated
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
          setUserId(auth.currentUser?.uid || crypto.randomUUID()); // Fallback if anonymous fails or no uid
        } catch (error) {
          console.error("Firebase anonymous sign-in failed:", error);
          setLoginError("Failed to connect to database. Please check Firebase configuration.");
          setIsLoading(false); // Stop loading on error
        }
      } else {
        setUserId(user.uid);
      }
      setIsAuthReady(true);
      setIsLoading(false); // Authentication is ready, stop loading
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch data from Firestore in real-time
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    // Define collection paths based on app ID and user ID for public data
    const partnersColRef = collection(db, `artifacts/${appId}/public/data/partners`);
    const expensesColRef = collection(db, `artifacts/${appId}/public/data/expenses`);
    const salesColRef = collection(db, `artifacts/${appId}/public/data/sales`);

    // Partners Listener
    const unsubscribePartners = onSnapshot(partnersColRef, (snapshot) => {
      const partnersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(partnersData);
    }, (error) => {
      console.error("Error fetching partners:", error);
      showNotification('error', 'Failed to load partner data.');
    });

    // Expenses Listener
    const unsubscribeExpenses = onSnapshot(expensesColRef, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      showNotification('error', 'Failed to load expense data.');
    });

    // Sales Listener
    const unsubscribeSales = onSnapshot(salesColRef, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
    }, (error) => {
      console.error("Error fetching sales:", error);
      showNotification('error', 'Failed to load sales data.');
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribePartners();
      unsubscribeExpenses();
      unsubscribeSales();
    };
  }, [isAuthReady, userId]); // Re-run when auth status changes

  // --- Utility Functions ---
  const showNotification = (type, message) => {
    setModalContent({ type, message });
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000); // Hide after 3 seconds
  };

  // --- Login Logic ---
  const handleLogin = () => {
    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
      setCurrentPage('functions');
      setLoginError('');
    } else {
      setLoginError('Invalid Login ID or Password');
    }
  };

  // --- Navigation Handlers ---
  const goToFunctions = () => setCurrentPage('functions');
  const goToPartners = () => setCurrentPage('partners');
  const goToExpenses = () => setCurrentPage('expenses');
  const goToSales = () => setCurrentPage('sales');

  // New Exit Confirmation Logic
  const handleExitClick = () => {
    setShowExitConfirmModal(true);
  };

  const confirmExit = () => {
    setCurrentPage('login');
    setUsername('');
    setPassword('');
    setShowExitConfirmModal(false);
    showNotification('success', 'Logged out successfully.');
  };

  const cancelExit = () => {
    setShowExitConfirmModal(false);
  };

  // --- Calculations for Partner Details ---
  const calculatePartnerMetrics = useCallback(() => {
    const totalInvestment = partners.reduce((sum, partner) => sum + (partner.moneyInvested || 0), 0);
    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalSalePrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.totalCost || 0), 0);
    const overallBusinessProfitLoss = totalSales - totalExpenses;

    return partners.map(partner => {
      const invested = partner.moneyInvested || 0;
      const percentOfOverallInvestment = totalInvestment > 0 ? (invested / totalInvestment) * 100 : 0;

      // Allocate overall profit/loss proportionally to investment
      const partnerProfitLoss = overallBusinessProfitLoss * (percentOfOverallInvestment / 100);
      const percentOfProfitLoss = invested > 0 ? (partnerProfitLoss / invested) * 100 : 0;

      return {
        ...partner,
        percentOfOverallInvestment: percentOfOverallInvestment.toFixed(2),
        profitLoss: partnerProfitLoss.toFixed(2),
        percentOfProfitLoss: percentOfProfitLoss.toFixed(2)
      };
    });
  }, [partners, sales, expenses]);

  const partnerMetrics = calculatePartnerMetrics();

  // --- Expense Tab Logic ---
  const [expenseType, setExpenseType] = useState('court booking cost');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expensePerUnitCost, setExpensePerUnitCost] = useState('');
  const [expenseQuantity, setExpenseQuantity] = useState('');
  const [expenseTotalCost, setExpenseTotalCost] = useState(0);

  useEffect(() => {
    const unitCost = parseFloat(expensePerUnitCost) || 0;
    const quantity = parseFloat(expenseQuantity) || 0;
    setExpenseTotalCost(unitCost * quantity);
  }, [expensePerUnitCost, expenseQuantity]);

  const handleAddExpense = async () => {
    if (!expenseDescription || !expenseDate || !expensePerUnitCost || !expenseQuantity) {
      showNotification('error', 'Please fill all expense fields.');
      return;
    }
    if (!db || !userId) {
      showNotification('error', 'Database not ready. Please try again.');
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/expenses`), {
        typeOfEntry: 'expense',
        typeOfExpense: expenseType,
        description: expenseDescription,
        date: expenseDate,
        perUnitCost: parseFloat(expensePerUnitCost),
        quantity: parseFloat(expenseQuantity),
        totalCost: expenseTotalCost,
        timestamp: new Date().toISOString()
      });
      showNotification('success', 'Expense added successfully!');
      // Clear form
      setExpenseDescription('');
      setExpenseDate('');
      setExpensePerUnitCost('');
      setExpenseQuantity('');
      setExpenseType('court booking cost');
    } catch (e) {
      console.error("Error adding document: ", e);
      showNotification('error', 'Failed to add expense.');
    }
  };

  // --- Sales Tab Logic ---
  const [saleType, setSaleType] = useState('shuttle sale'); // Changed default to shuttle sale
  const [saleDescription, setSaleDescription] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [salePerUnitSalePrice, setSalePerUnitSalePrice] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleTotalSalePrice, setSaleTotalSalePrice] = useState(0);

  useEffect(() => {
    const unitPrice = parseFloat(salePerUnitSalePrice) || 0;
    const quantity = parseFloat(saleQuantity) || 0;
    setSaleTotalSalePrice(unitPrice * quantity);
  }, [salePerUnitSalePrice, saleQuantity]);

  const handleAddSale = async () => {
    if (!saleDescription || !saleDate || !salePerUnitSalePrice || !saleQuantity) {
      showNotification('error', 'Please fill all sale fields.');
      return;
    }
    if (!db || !userId) {
      showNotification('error', 'Database not ready. Please try again.');
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/sales`), {
        typeOfEntry: 'sale',
        typeOfSale: saleType,
        description: saleDescription,
        date: saleDate,
        perUnitSalePrice: parseFloat(salePerUnitSalePrice),
        quantity: parseFloat(saleQuantity),
        totalSalePrice: saleTotalSalePrice,
        timestamp: new Date().toISOString()
      });
      showNotification('success', 'Sale added successfully!');
      // Clear form
      setSaleDescription('');
      setSaleDate('');
      setSalePerUnitSalePrice('');
      setSaleQuantity('');
      setSaleType('shuttle sale'); // Changed default to shuttle sale
    } catch (e) {
      console.error("Error adding document: ", e);
      showNotification('error', 'Failed to add sale.');
    }
  };

  // --- UI Components ---

  const Modal = ({ type, message, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className={`relative p-6 rounded-2xl shadow-soft-xl max-w-sm w-full text-center
        ${type === 'success' ? 'bg-app-green text-app-text-primary' :
          type === 'error' ? 'bg-app-red text-app-text-primary' :
          'bg-app-blue text-app-text-primary'}`}>
        <div className="flex justify-center mb-3">
          {type === 'success' && <CheckCircle size={32} />}
          {type === 'error' && <XCircle size={32} />}
          {type === 'info' && <Info size={32} />}
        </div>
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </div>
  );

  const ExitConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className="relative bg-app-card p-8 rounded-2xl shadow-soft-xl w-full max-w-sm text-center border border-app-border">
        <h3 className="text-xl font-semibold mb-6 text-app-text-primary">Confirm Logout</h3>
        <p className="text-app-text-secondary mb-8">Are you sure you want to exit and return to the login page?</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onConfirm}
            className="bg-app-blue hover:bg-app-blue-dark text-app-text-primary font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-soft-lg transform hover:scale-105 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue"
          >
            Confirm Exit
          </button>
          <button
            onClick={onCancel}
            className="bg-app-button-bg hover:bg-app-button-hover text-app-text-primary font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-soft-lg transform hover:scale-105 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );


  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-app-bg text-app-text-primary font-inter">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-app-blue"></div>
          <p className="mt-4 text-lg text-app-text-secondary">Loading application...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'login':
        return (
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-app-bg text-app-text-primary font-inter p-4 overflow-hidden">
            {/* Background Image/Overlay */}
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/1C1C1E/AEAEB2?text=Badminton+Racket+Subtle')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-app-bg via-black to-app-bg opacity-80"></div>

            <h1 className="relative z-10 text-5xl md:text-6xl font-extrabold mb-8 text-app-text-primary drop-shadow-lg animate-fade-in-down">
              Test Business Name
            </h1>
            <div className="relative z-10 bg-app-card bg-opacity-90 p-8 rounded-2xl shadow-soft-xl w-full max-w-md border border-app-border backdrop-blur-sm animate-fade-in-up">
              <h2 className="text-3xl font-semibold mb-6 text-center text-app-text-primary">Login</h2>
              <div className="mb-4">
                <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="username">
                  Login ID
                </label>
                <input
                  type="text"
                  id="username"
                  className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="mb-6">
                <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                />
              </div>
              {loginError && <p className="text-app-red text-sm italic mb-4 text-center">{loginError}</p>}
              <button
                className="bg-app-blue hover:bg-app-blue-dark text-app-text-primary font-bold py-3 px-6 rounded-lg w-full transition-all duration-300 ease-in-out shadow-soft-lg transform hover:scale-105 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={handleLogin}
              >
                Login
              </button>
            </div>
            {isAuthReady && userId && (
              <p className="relative z-10 text-app-text-secondary text-sm mt-4">User ID: {userId}</p>
            )}
            {!isAuthReady && (
              <p className="relative z-10 text-app-blue text-sm mt-4">Connecting to database...</p>
            )}
          </div>
        );

      case 'functions':
        return (
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-app-bg text-app-text-primary font-inter p-4 md:p-8 overflow-hidden">
            {/* Background Image/Overlay */}
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/1C1C1E/AEAEB2?text=Shuttlecock+Pattern+Subtle')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-app-bg via-black to-app-bg opacity-80"></div>

            <h1 className="relative z-10 text-4xl md:text-5xl font-bold mb-12 text-app-text-primary text-center animate-fade-in-down">Functions</h1>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <button
                className="flex flex-col items-center justify-center bg-app-button-bg hover:bg-app-button-hover p-8 rounded-2xl shadow-soft-lg transition-all duration-300 ease-in-out border border-app-border text-app-text-primary transform hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={goToPartners}
              >
                <Users size={48} className="mb-3 text-app-blue group-hover:text-app-blue-dark transition-colors duration-300" />
                <span className="text-xl font-semibold">Partner Details</span>
              </button>
              <button
                className="flex flex-col items-center justify-center bg-app-button-bg hover:bg-app-button-hover p-8 rounded-2xl shadow-soft-lg transition-all duration-300 ease-in-out border border-app-border text-app-text-primary transform hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={goToExpenses}
              >
                <Minus size={48} className="mb-3 text-app-red group-hover:text-app-red transition-colors duration-300" />
                <span className="text-xl font-semibold">Expense Tab</span>
              </button>
              <button
                className="flex flex-col items-center justify-center bg-app-button-bg hover:bg-app-button-hover p-8 rounded-2xl shadow-soft-lg transition-all duration-300 ease-in-out border border-app-border text-app-text-primary transform hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={goToSales}
              >
                <Plus size={48} className="mb-3 text-app-green group-hover:text-app-green transition-colors duration-300" />
                <span className="text-xl font-semibold">Sales Tab</span>
              </button>
              <button
                className="flex flex-col items-center justify-center bg-app-button-bg hover:bg-app-button-hover p-8 rounded-2xl shadow-soft-lg transition-all duration-300 ease-in-out border border-app-border text-app-text-primary transform hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={handleExitClick} // Changed to open the modal
              >
                <LogOut size={48} className="mb-3 text-app-text-secondary group-hover:text-app-text-primary transition-colors duration-300" />
                <span className="text-xl font-semibold">Exit</span>
              </button>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="relative min-h-screen bg-app-bg text-app-text-primary font-inter p-4 md:p-8 overflow-hidden">
             {/* Background Image/Overlay */}
             <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/1C1C1E/AEAEB2?text=Team+Huddle+Subtle')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-app-bg via-black to-app-bg opacity-80"></div>

            <div className="relative z-10 flex items-center mb-6">
              <button onClick={goToFunctions} className="text-app-blue hover:text-app-blue-dark mr-4 p-2 rounded-lg bg-app-card hover:bg-app-border transition-colors duration-200 shadow-soft-lg border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-app-text-primary">Partner Details</h2>
            </div>
            <div className="relative z-10 overflow-x-auto bg-app-card rounded-2xl shadow-soft-lg border border-app-border p-4">
              <table className="min-w-full divide-y divide-app-border">
                <thead className="bg-app-border">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tl-xl">
                      Name of the Partner
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Money Invested
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Date of Investment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      % of Overall Investment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Profit/Loss (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tr-xl">
                      % Profit/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {partnerMetrics.length > 0 ? (
                    partnerMetrics.map((partner, index) => (
                      <tr key={partner.id} className={`hover:bg-app-border transition-colors duration-200 ${index % 2 === 0 ? 'bg-app-card' : 'bg-app-bg'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-app-text-primary">{partner.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">AUD {partner.moneyInvested?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{partner.investmentDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{partner.percentOfOverallInvestment}%</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${parseFloat(partner.profitLoss) >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                          AUD {partner.profitLoss}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${parseFloat(partner.percentOfProfitLoss) >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                          {partner.percentOfProfitLoss}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-app-text-secondary">No partner data available. Add data in Firebase Firestore.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="relative z-10 text-app-text-secondary text-sm mt-6 max-w-3xl mx-auto">
              **Note:** Profit/Loss is calculated based on the overall business performance (Total Sales - Total Expenses) and allocated proportionally to each partner's investment percentage.
            </p>
          </div>
        );

      case 'expenses':
        return (
          <div className="relative min-h-screen bg-app-bg text-app-text-primary font-inter p-4 md:p-8 overflow-hidden">
             {/* Background Image/Overlay */}
             <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/1C1C1E/AEAEB2?text=Financial+Tracking+Subtle')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-app-bg via-black to-app-bg opacity-80"></div>

            <div className="relative z-10 flex items-center mb-6">
              <button onClick={goToFunctions} className="text-app-blue hover:text-app-blue-dark mr-4 p-2 rounded-lg bg-app-card hover:bg-app-border transition-colors duration-200 shadow-soft-lg border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-app-text-primary">Expense Tab</h2>
            </div>

            <div className="relative z-10 bg-app-card p-6 rounded-2xl shadow-soft-lg w-full max-w-3xl mx-auto mb-8 border border-app-border">
              <h3 className="text-xl font-semibold mb-4 text-center text-app-text-primary">Add New Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2">Type of Entry</label>
                  <input
                    type="text"
                    value="Expense"
                    disabled
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight bg-app-bg cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-app-blue"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="expenseType">Type of Expense</label>
                  <select
                    id="expenseType"
                    className="shadow-inner border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                  >
                    <option value="court booking cost">Court Booking Cost</option>
                    <option value="shuttle cost">Shuttle Cost</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="expenseDescription">Description (max 30 chars)</label>
                  <input
                    type="text"
                    id="expenseDescription"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value.slice(0, 30))}
                    maxLength={30}
                    placeholder="e.g., Badminton court rental, RSL"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="expenseDate">Date of Expense</label>
                  <input
                    type="date"
                    id="expenseDate"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="expensePerUnitCost">Per Unit Cost (AUD)</label>
                  <input
                    type="number"
                    id="expensePerUnitCost"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={expensePerUnitCost}
                    onChange={(e) => setExpensePerUnitCost(e.target.value)}
                    placeholder="e.g., 10.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="expenseQuantity">Quantity</label>
                  <input
                    type="number"
                    id="expenseQuantity"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value)}
                    placeholder="e.g., 2"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2">Total Cost (AUD)</label>
                  <input
                    type="text"
                    value={expenseTotalCost.toFixed(2)}
                    disabled
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight bg-app-bg cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-app-blue"
                  />
                </div>
              </div>
              <button
                className="bg-app-red hover:bg-app-red text-app-text-primary font-bold py-3 px-6 rounded-lg w-full mt-6 transition-all duration-300 ease-in-out shadow-soft-lg transform hover:scale-105 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={handleAddExpense}
              >
                Add Expense
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-center text-app-text-primary">Recent Expenses</h3>
            <div className="relative z-10 overflow-x-auto bg-app-card rounded-2xl shadow-soft-lg border border-app-border p-4">
              <table className="min-w-full divide-y divide-app-border">
                <thead className="bg-app-border">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tl-xl">
                      Type of Expense
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Per Unit Cost (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tr-xl">
                      Total Cost (AUD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {expenses.length > 0 ? (
                    expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense, index) => (
                      <tr key={expense.id} className={`hover:bg-app-border transition-colors duration-200 ${index % 2 === 0 ? 'bg-app-card' : 'bg-app-bg'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-app-text-primary">{expense.typeOfExpense}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{expense.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{expense.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{expense.perUnitCost?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{expense.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{expense.totalCost?.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-app-text-secondary">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="relative min-h-screen bg-app-bg text-app-text-primary font-inter p-4 md:p-8 overflow-hidden">
             {/* Background Image/Overlay */}
             <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/1C1C1E/AEAEB2?text=Sales+Growth+Subtle')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-app-bg via-black to-app-bg opacity-80"></div>

            <div className="relative z-10 flex items-center mb-6">
              <button onClick={goToFunctions} className="text-app-blue hover:text-app-blue-dark mr-4 p-2 rounded-lg bg-app-card hover:bg-app-border transition-colors duration-200 shadow-soft-lg border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-app-text-primary">Sales Tab</h2>
            </div>

            <div className="relative z-10 bg-app-card p-6 rounded-2xl shadow-soft-lg w-full max-w-3xl mx-auto mb-8 border border-app-border">
              <h3 className="text-xl font-semibold mb-4 text-center text-app-text-primary">Add New Sale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2">Type of Entry</label>
                  <input
                    type="text"
                    value="Sale"
                    disabled
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight bg-app-bg cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-app-blue"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="saleType">Type of Sale</label>
                  <select
                    id="saleType"
                    className="shadow-inner border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value)}
                  >
                    <option value="court booking recovered">Court Booking Recovered</option>
                    <option value="shuttle sale">Shuttle Sale</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="saleDescription">Description (max 30 chars)</label>
                  <input
                    type="text"
                    id="saleDescription"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value.slice(0, 30))}
                    maxLength={30}
                    placeholder="e.g., Booking for John Doe, 1 dozen shuttles"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="saleDate">Date of Sale</label>
                  <input
                    type="date"
                    id="saleDate"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="salePerUnitSalePrice">Per Unit Sale Price (AUD)</label>
                  <input
                    type="number"
                    id="salePerUnitSalePrice"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={salePerUnitSalePrice}
                    onChange={(e) => setSalePerUnitSalePrice(e.target.value)}
                    placeholder="e.g., 15.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2" htmlFor="saleQuantity">Quantity</label>
                  <input
                    type="number"
                    id="saleQuantity"
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-app-blue bg-app-bg transition-all duration-200"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    placeholder="e.g., 1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-app-text-secondary text-sm font-bold mb-2">Total Sale Price (AUD)</label>
                  <input
                    type="text"
                    value={saleTotalSalePrice.toFixed(2)}
                    disabled
                    className="shadow-inner appearance-none border border-app-border rounded-lg w-full py-3 px-4 text-app-text-primary leading-tight bg-app-bg cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-app-blue"
                  />
                </div>
              </div>
              <button
                className="bg-app-green hover:bg-app-green text-app-text-primary font-bold py-3 px-6 rounded-lg w-full mt-6 transition-all duration-300 ease-in-out shadow-soft-lg transform hover:scale-105 border border-app-border focus:outline-none focus:ring-2 focus:ring-app-blue"
                onClick={handleAddSale}
              >
                Add Sale
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-center text-app-text-primary">Recent Sales</h3>
            <div className="relative z-10 overflow-x-auto bg-app-card rounded-2xl shadow-soft-lg border border-app-border p-4">
              <table className="min-w-full divide-y divide-app-border">
                <thead className="bg-app-border">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tl-xl">
                      Type of Sale
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Per Unit Sale Price (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-app-text-secondary uppercase tracking-wider rounded-tr-xl">
                      Total Sale Price (AUD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {sales.length > 0 ? (
                    sales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale, index) => (
                      <tr key={sale.id} className={`hover:bg-app-border transition-colors duration-200 ${index % 2 === 0 ? 'bg-app-card' : 'bg-app-bg'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-app-text-primary">{sale.typeOfSale}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{sale.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{sale.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{sale.perUnitSalePrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{sale.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-app-text-primary">{sale.totalSalePrice?.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-app-text-secondary">No sales recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary font-inter">
      {renderPage()}
      {showModal && (
        <Modal
          type={modalContent.type}
          message={modalContent.message}
          onClose={() => setShowModal(false)}
        />
      )}
      {showExitConfirmModal && (
        <ExitConfirmModal
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      )}
    </div>
  );
};

export default App;
