import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, runTransaction } from 'firebase/firestore';
import {
  LogIn, Users, TrendingUp, DollarSign, LogOut, Plus, Minus, CalendarDays, ClipboardList, Package, Scale, Percent, Wallet, Info, CheckCircle, XCircle, BarChart, ShoppingCart
} from 'lucide-react';

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'trackbus-a328c';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
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
  const [exitConfirm, setExitConfirm] = useState(false);

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
  const STATIC_PASSWORD = 'password123';

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

  const handleExit = () => {
    if (exitConfirm) {
      setCurrentPage('login');
      setUsername('');
      setPassword('');
      setExitConfirm(false);
      showNotification('success', 'Logged out successfully.');
    } else {
      setExitConfirm(true);
      showNotification('info', 'Click "Exit" again to confirm logout.');
      setTimeout(() => setExitConfirm(false), 3000); // Reset confirmation after 3 seconds
    }
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
      <div className={`relative p-6 rounded-xl shadow-lg max-w-sm w-full text-center transform scale-105 animate-pop-in
        ${type === 'success' ? 'bg-green-600 text-white' :
          type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'}`}>
        <div className="flex justify-center mb-3">
          {type === 'success' && <CheckCircle size={32} />}
          {type === 'error' && <XCircle size={32} />}
          {type === 'info' && <Info size={32} />}
        </div>
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </div>
  );

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-inter">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg text-blue-400">Loading application...</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'login':
        return (
          <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-inter p-4 overflow-hidden">
            {/* Background Image/Overlay */}
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('https://placehold.co/1920x1080/0A0A0A/B0B0B0?text=Badminton+Court')" }}>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 opacity-80"></div>

            <h1 className="relative z-10 text-5xl md:text-6xl font-extrabold mb-8 text-blue-500 drop-shadow-lg animate-fade-in-down">
              Test Business Name
            </h1>
            <div className="relative z-10 bg-gray-800 bg-opacity-90 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 backdrop-blur-sm animate-fade-in-up">
              <h2 className="text-3xl font-semibold mb-6 text-center text-blue-300">Login</h2>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="username">
                  Login ID
                </label>
                <input
                  type="text"
                  id="username"
                  className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                />
              </div>
              {loginError && <p className="text-red-500 text-sm italic mb-4 text-center">{loginError}</p>}
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3 px-6 rounded-lg w-full transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105"
                onClick={handleLogin}
              >
                Login
              </button>
            </div>
            {isAuthReady && userId && (
              <p className="relative z-10 text-gray-500 text-sm mt-4">User ID: {userId}</p>
            )}
            {!isAuthReady && (
              <p className="relative z-10 text-blue-400 text-sm mt-4">Connecting to database...</p>
            )}
          </div>
        );

      case 'functions':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-inter p-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-12 text-blue-500 text-center animate-fade-in-down">Functions</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <button
                className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 p-8 rounded-xl shadow-xl transition-all duration-300 ease-in-out border border-gray-700 text-blue-400 hover:text-blue-300 transform hover:scale-105 group"
                onClick={goToPartners}
              >
                <Users size={48} className="mb-3 text-blue-500 group-hover:text-blue-400 transition-colors duration-300" />
                <span className="text-xl font-semibold">Partner Details</span>
              </button>
              <button
                className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 p-8 rounded-xl shadow-xl transition-all duration-300 ease-in-out border border-gray-700 text-blue-400 hover:text-blue-300 transform hover:scale-105 group"
                onClick={goToExpenses}
              >
                <Minus size={48} className="mb-3 text-red-500 group-hover:text-red-400 transition-colors duration-300" />
                <span className="text-xl font-semibold">Expense Tab</span>
              </button>
              <button
                className="flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 p-8 rounded-xl shadow-xl transition-all duration-300 ease-in-out border border-gray-700 text-blue-400 hover:text-blue-300 transform hover:scale-105 group"
                onClick={goToSales}
              >
                <Plus size={48} className="mb-3 text-green-500 group-hover:text-green-400 transition-colors duration-300" />
                <span className="text-xl font-semibold">Sales Tab</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-xl transition-all duration-300 ease-in-out border border-gray-700 transform hover:scale-105 group
                  ${exitConfirm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300'}`}
                onClick={handleExit}
              >
                <LogOut size={48} className={`mb-3 ${exitConfirm ? 'text-white' : 'text-red-500 group-hover:text-red-400'} transition-colors duration-300`} />
                <span className="text-xl font-semibold">{exitConfirm ? 'Click to Confirm Exit' : 'Exit'}</span>
              </button>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="min-h-screen bg-gray-950 text-white font-inter p-4">
            <div className="flex items-center mb-6">
              <button onClick={goToFunctions} className="text-blue-400 hover:text-blue-300 mr-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-500">Partner Details</h2>
            </div>
            <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                      Name of the Partner
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Money Invested
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date of Investment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      % of Overall Investment
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Profit/Loss (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                      % Profit/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {partnerMetrics.length > 0 ? (
                    partnerMetrics.map((partner, index) => (
                      <tr key={partner.id} className={`hover:bg-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">{partner.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">AUD {partner.moneyInvested?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{partner.investmentDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{partner.percentOfOverallInvestment}%</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${parseFloat(partner.profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          AUD {partner.profitLoss}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${parseFloat(partner.percentOfProfitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {partner.percentOfProfitLoss}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-400">No partner data available. Add data in Firestore.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-gray-400 text-sm mt-6 max-w-3xl mx-auto">
              **Note:** Profit/Loss is calculated based on the overall business performance (Total Sales - Total Expenses) and allocated proportionally to each partner's investment percentage.
            </p>
          </div>
        );

      case 'expenses':
        return (
          <div className="min-h-screen bg-gray-950 text-white font-inter p-4">
            <div className="flex items-center mb-6">
              <button onClick={goToFunctions} className="text-blue-400 hover:text-blue-300 mr-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-500">Expense Tab</h2>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-3xl mx-auto mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-center text-blue-300">Add New Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Type of Entry</label>
                  <input
                    type="text"
                    value="Expense"
                    disabled
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight bg-gray-900 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="expenseType">Type of Expense</label>
                  <select
                    id="expenseType"
                    className="shadow-inner border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                  >
                    <option value="court booking cost">Court Booking Cost</option>
                    <option value="shuttle cost">Shuttle Cost</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="expenseDescription">Description (max 30 chars)</label>
                  <input
                    type="text"
                    id="expenseDescription"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value.slice(0, 30))}
                    maxLength={30}
                    placeholder="e.g., Badminton court rental, RSL"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="expenseDate">Date of Expense</label>
                  <input
                    type="date"
                    id="expenseDate"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="expensePerUnitCost">Per Unit Cost (AUD)</label>
                  <input
                    type="number"
                    id="expensePerUnitCost"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={expensePerUnitCost}
                    onChange={(e) => setExpensePerUnitCost(e.target.value)}
                    placeholder="e.g., 10.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="expenseQuantity">Quantity</label>
                  <input
                    type="number"
                    id="expenseQuantity"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value)}
                    placeholder="e.g., 2"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Total Cost (AUD)</label>
                  <input
                    type="text"
                    value={expenseTotalCost.toFixed(2)}
                    disabled
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight bg-gray-900 cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-3 px-6 rounded-lg w-full mt-6 transition-all duration-300 ease-in-out shadow-md transform hover:scale-105"
                onClick={handleAddExpense}
              >
                Add Expense
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-center text-blue-300">Recent Expenses</h3>
            <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                      Type of Expense
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Per Unit Cost (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                      Total Cost (AUD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {expenses.length > 0 ? (
                    expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense, index) => (
                      <tr key={expense.id} className={`hover:bg-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">{expense.typeOfExpense}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{expense.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{expense.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{expense.perUnitCost?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{expense.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{expense.totalCost?.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-400">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="min-h-screen bg-gray-950 text-white font-inter p-4">
            <div className="flex items-center mb-6">
              <button onClick={goToFunctions} className="text-blue-400 hover:text-blue-300 mr-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                <LogOut size={24} />
              </button>
              <h2 className="text-3xl md:text-4xl font-bold text-blue-500">Sales Tab</h2>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-3xl mx-auto mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-center text-blue-300">Add New Sale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Type of Entry</label>
                  <input
                    type="text"
                    value="Sale"
                    disabled
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight bg-gray-900 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="saleType">Type of Sale</label>
                  <select
                    id="saleType"
                    className="shadow-inner border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value)}
                  >
                    <option value="court booking recovered">Court Booking Recovered</option>
                    <option value="shuttle sale">Shuttle Sale</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="saleDescription">Description (max 30 chars)</label>
                  <input
                    type="text"
                    id="saleDescription"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={saleDescription}
                    onChange={(e) => setSaleDescription(e.target.value.slice(0, 30))}
                    maxLength={30}
                    placeholder="e.g., Booking for John Doe, 1 dozen shuttles"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="saleDate">Date of Sale</label>
                  <input
                    type="date"
                    id="saleDate"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="salePerUnitSalePrice">Per Unit Sale Price (AUD)</label>
                  <input
                    type="number"
                    id="salePerUnitSalePrice"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={salePerUnitSalePrice}
                    onChange={(e) => setSalePerUnitSalePrice(e.target.value)}
                    placeholder="e.g., 15.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="saleQuantity">Quantity</label>
                  <input
                    type="number"
                    id="saleQuantity"
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 transition-all duration-200"
                    value={saleQuantity}
                    onChange={(e) => setSaleQuantity(e.target.value)}
                    placeholder="e.g., 1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">Total Sale Price (AUD)</label>
                  <input
                    type="text"
                    value={saleTotalSalePrice.toFixed(2)}
                    disabled
                    className="shadow-inner appearance-none border border-gray-700 rounded-lg w-full py-3 px-4 text-gray-200 leading-tight bg-gray-900 cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold py-3 px-6 rounded-lg w-full mt-6 transition-all duration-300 ease-in-out shadow-md transform hover:scale-105"
                onClick={handleAddSale}
              >
                Add Sale
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-center text-blue-300">Recent Sales</h3>
            <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                      Type of Sale
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Per Unit Sale Price (AUD)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                      Total Sale Price (AUD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sales.length > 0 ? (
                    sales.sort((a, b) => new Date(b.date) - new Date(a.date)).map((sale, index) => (
                      <tr key={sale.id} className={`hover:bg-gray-700 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800'}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">{sale.typeOfSale}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{sale.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{sale.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{sale.perUnitSalePrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{sale.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{sale.totalSalePrice?.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-400">No sales recorded.</td>
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
    <div className="min-h-screen bg-gray-950 text-white font-inter">
      {renderPage()}
      {showModal && (
        <Modal
          type={modalContent.type}
          message={modalContent.message}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default App;
