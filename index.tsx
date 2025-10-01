/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState, useMemo, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import { Icons } from './icons.tsx';
import { Images } from './images.ts';
import { loadData, saveData } from './storage.ts';

const CATEGORIES = ['Food', 'Travel', 'Dress', 'Entertainment', 'Other'];

// --- Custom Hooks & Utilities ---

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

// --- UI Components ---

const ProgressBar = ({ current, target }) => {
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isOverBudget = percentage > 100;
    
    let progressClass = 'progress-bar-fill';
    if (isOverBudget) progressClass += ' over-budget';

    return (
        <div className="progress-bar">
            <div 
                className={progressClass}
                style={{ width: `${Math.min(percentage, 120)}%` }}
                aria-valuenow={current}
                aria-valuemin={0}
                aria-valuemax={target}
            ></div>
        </div>
    );
};

const Navigation = ({ activePage, setActivePage }) => (
  <nav className="bottom-nav">
    <button onClick={() => setActivePage('summary')} className={activePage === 'summary' ? 'active' : ''} aria-label="Summary">
      {Icons.Summary}
      <span>Summary</span>
    </button>
    <button onClick={() => setActivePage('add')} className={activePage === 'add' ? 'active' : ''} aria-label="Add Expense">
      {Icons.Add}
      <span>Add</span>
    </button>
    <button onClick={() => setActivePage('history')} className={activePage === 'history' ? 'active' : ''} aria-label="History">
      {Icons.History}
      <span>History</span>
    </button>
    <button onClick={() => setActivePage('settings')} className={activePage === 'settings' ? 'active' : ''} aria-label="Settings">
      {Icons.Settings}
      <span>Settings</span>
    </button>
  </nav>
);

// --- Page Components ---

const SummaryPage = ({ weeklySpent, monthlySpent, weeklyTarget, monthlyTarget, categoryTotals }) => (
  <div className="page">
    <img src={Images.Summary} alt="Financial summary illustration" className="page-image"/>
    <h2>Summary</h2>
    <div className="summary-grid">
      <div className="summary-item card">
        <h3>This Week</h3>
        <p>₹{weeklySpent.toFixed(2)}</p>
        <small>Target: ₹{weeklyTarget.toFixed(2)}</small>
        <ProgressBar current={weeklySpent} target={weeklyTarget} />
      </div>
      <div className="summary-item card">
        <h3>This Month</h3>
        <p>₹{monthlySpent.toFixed(2)}</p>
        <small>Target: ₹{monthlyTarget.toFixed(2)}</small>
        <ProgressBar current={monthlySpent} target={monthlyTarget} />
      </div>
    </div>
    <div className="category-breakdown card">
      <h3>Monthly Spending by Category</h3>
      {CATEGORIES.map(cat => categoryTotals[cat] > 0 && (
        <div key={cat} className="category-item">
            <div className="category-icon">{Icons[cat]}</div>
            <span>{cat}</span>
            <strong>₹{categoryTotals[cat].toFixed(2)}</strong>
        </div>
      ))}
       {monthlySpent === 0 && <p>No spending this month to categorize.</p>}
    </div>
  </div>
);

const AddExpensePage = ({ onAddExpense }) => {
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.amount || isNaN(parseFloat(newExpense.amount))) return;
    onAddExpense(newExpense);
    setNewExpense({
      amount: '',
      category: CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="page">
        <img src={Images.AddExpense} alt="Adding expense illustration" className="page-image"/>
        <h2>Add New Expense</h2>
        <div className="card">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="amount">Amount (₹)</label>
                    <input type="number" id="amount" name="amount" value={newExpense.amount} onChange={handleInputChange} placeholder="0.00" step="0.01" required aria-label="Expense amount"/>
                </div>
                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" value={newExpense.category} onChange={handleInputChange} aria-label="Expense category">
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input type="date" id="date" name="date" value={newExpense.date} onChange={handleInputChange} aria-label="Expense date"/>
                </div>
                <button type="submit" className="btn">Add Expense</button>
            </form>
        </div>
    </div>
  );
};

const HistoryPage = ({ expenses, onDeleteExpense }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(exp => {
      months.add(exp.date.slice(0, 7)); // Extracts 'YYYY-MM'
    });
    return Array.from(months).sort().reverse(); // Sort with most recent month first
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') {
      return expenses;
    }
    return expenses.filter(exp => exp.date.slice(0, 7) === selectedMonth);
  }, [expenses, selectedMonth]);

  const formatMonthForDisplay = (monthString) => { // e.g., "2024-07"
    const [year, month] = monthString.split('-');
    const date = new Date(Date.UTC(year, parseInt(month, 10) - 1, 2));
    return date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="page">
      <img src={Images.History} alt="Expense history illustration" className="page-image"/>
      <h2>Expense History</h2>

      {availableMonths.length > 0 && (
        <div className="history-filter-container">
          <label htmlFor="month-filter">Filter by Month</label>
          <select id="month-filter" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="all">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{formatMonthForDisplay(month)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="card expense-list">
        <ul>
          {filteredExpenses.length === 0 ? (
            <p>{expenses.length === 0 ? 'No expenses added yet.' : 'No expenses for this period.'}</p>
          ) : filteredExpenses.map(expense => (
            <li key={expense.id} className="expense-item">
              <div className="expense-details">
                <div className="category-icon">{Icons[expense.category]}</div>
                <div className="expense-info">
                  <span className="expense-category">{expense.category}</span>
                  <span className="expense-date">{new Date(expense.date + 'T00:00:00').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="expense-right">
                <span className="expense-amount">₹{expense.amount.toFixed(2)}</span>
                <button onClick={() => onDeleteExpense(expense.id)} className="delete-btn" aria-label={`Delete expense of ₹${expense.amount.toFixed(2)} for ${expense.category}`}>
                  {Icons.Delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SettingsPage = ({ weeklyTarget, monthlyTarget, onWeeklyTargetChange, onMonthlyTargetChange }) => {
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(weeklyTarget.toString());
  const [monthlyTargetInput, setMonthlyTargetInput] = useState(monthlyTarget.toString());
  
   const handleWeeklyChange = (e) => {
    const { value } = e.target;
    setWeeklyTargetInput(value);
    onWeeklyTargetChange(parseFloat(value) || 0);
  };

  const handleMonthlyChange = (e) => {
    const { value } = e.target;
    setMonthlyTargetInput(value);
    onMonthlyTargetChange(parseFloat(value) || 0);
  };

  useEffect(() => {
    setWeeklyTargetInput(weeklyTarget.toString());
  }, [weeklyTarget]);

  useEffect(() => {
    setMonthlyTargetInput(monthlyTarget.toString());
  }, [monthlyTarget]);

  return (
    <div className="page">
       <img src={Images.Settings} alt="Settings and targets illustration" className="page-image"/>
       <h2>Set Your Targets</h2>
       <div className="card">
           <div className="target-inputs">
               <div className="form-group">
                   <label htmlFor="weeklyTarget">Weekly Target (₹)</label>
                   <input type="number" id="weeklyTarget" value={weeklyTargetInput} onChange={handleWeeklyChange} aria-label="Set weekly spending target"/>
               </div>
               <div className="form-group">
                   <label htmlFor="monthlyTarget">Monthly Target (₹)</label>
                   <input type="number" id="monthlyTarget" value={monthlyTargetInput} onChange={handleMonthlyChange} aria-label="Set monthly spending target"/>
               </div>
           </div>
       </div>
    </div>
  );
};


// --- Main App Component ---

function App() {
  const [expenses, setExpenses] = useState([]);
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [activePage, setActivePage] = useState('summary');

  // Load data from localStorage on initial component mount
  useEffect(() => {
    const data = loadData();
    setExpenses(data.expenses);
    setWeeklyTarget(data.weeklyTarget);
    setMonthlyTarget(data.monthlyTarget);
  }, []); // Empty dependency array ensures this runs only once

  // Save data to localStorage whenever it changes
  useEffect(() => {
    // We check for initial state to avoid overwriting stored data with defaults on first render
    if (expenses.length > 0 || weeklyTarget > 0 || monthlyTarget > 0) {
      saveData({ expenses, weeklyTarget, monthlyTarget });
    }
  }, [expenses, weeklyTarget, monthlyTarget]);

  const handleAddExpense = (newExpense) => {
    setExpenses(prev => [
      ...prev,
      {
        id: Date.now(),
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
      }
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setActivePage('history');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };
  
  const { weeklySpent, monthlySpent, categoryTotals } = useMemo(() => {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    let weekly = 0;
    let monthly = 0;
    const catTotals = CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {});

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date + 'T00:00:00');

      if (expenseDate >= startOfMonth) {
        monthly += expense.amount;
        if(catTotals[expense.category] !== undefined) {
          catTotals[expense.category] += expense.amount;
        }
      }
      if (expenseDate >= startOfWeek) {
        weekly += expense.amount;
      }
    });

    return { weeklySpent: weekly, monthlySpent: monthly, categoryTotals: catTotals };
  }, [expenses]);
  
  const renderPage = () => {
    switch (activePage) {
      case 'add':
        return <AddExpensePage onAddExpense={handleAddExpense} />;
      case 'history':
        return <HistoryPage expenses={expenses} onDeleteExpense={handleDeleteExpense} />;
      case 'settings':
        return <SettingsPage 
                  weeklyTarget={weeklyTarget} 
                  monthlyTarget={monthlyTarget} 
                  onWeeklyTargetChange={setWeeklyTarget} 
                  onMonthlyTargetChange={setMonthlyTarget} 
               />;
      case 'summary':
      default:
        return <SummaryPage 
                  weeklySpent={weeklySpent} 
                  monthlySpent={monthlySpent}
                  weeklyTarget={weeklyTarget}
                  monthlyTarget={monthlyTarget}
                  categoryTotals={categoryTotals}
               />;
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Expense Tracker</h1>
      </header>
      
      <main>
        {renderPage()}
      </main>

      <Navigation activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);