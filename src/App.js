import { useState, useEffect, useMemo } from 'react';
import './App.css';

const API = "http://localhost:8080/tasks";

const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];
const PRIORITY_EMOJI = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };
const FILTER_OPTIONS = ["All", "Active", "Completed", "Overdue"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "deadline", label: "Deadline (soonest)" },
  { value: "priority", label: "Priority (highest)" },
  { value: "alpha", label: "A → Z" },
];
const PRIORITY_WEIGHT = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add-task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("");

  // Edit form
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editCategory, setEditCategory] = useState("");

  // Filter, sort, search
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ─── Fetch ───
  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(err => { console.error("Error fetching tasks:", err); setLoading(false); });
  }, []);

  // ─── Helpers ───
  const isOverdue = (task) => {
    if (!task.deadline || task.completed) return false;
    return new Date(task.deadline) < new Date(new Date().toDateString());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    return `${diff}d left`;
  };

  // Extract unique categories from tasks
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return [...cats].sort();
  }, [tasks]);

  // ─── Filtered + Sorted Tasks ───
  const displayedTasks = useMemo(() => {
    let result = [...tasks];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Filter
    if (filter === "Active") result = result.filter(t => !t.completed);
    else if (filter === "Completed") result = result.filter(t => t.completed);
    else if (filter === "Overdue") result = result.filter(t => isOverdue(t));

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return (a.id || 0) - (b.id || 0);
        case "newest": return (b.id || 0) - (a.id || 0);
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case "priority":
          return (PRIORITY_WEIGHT[a.priority] || 1) - (PRIORITY_WEIGHT[b.priority] || 1);
        case "alpha":
          return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, filter, sortBy]);

  // ─── Stats ───
  const completedCount = tasks.filter(t => t.completed).length;
  const overdueCount = tasks.filter(t => isOverdue(t)).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // ─── CRUD ───
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      title, description, completed: false,
      deadline: deadline || null,
      priority,
      category: category || null
    };

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask)
    })
      .then(r => r.json())
      .then(saved => {
        setTasks(prev => [...prev, saved]);
        setTitle(""); setDescription(""); setDeadline(""); setPriority("MEDIUM"); setCategory("");
      });
  };

  const handleDeleteTask = (id) => {
    fetch(`${API}/${id}`, { method: "DELETE" })
      .then(() => {
        setTasks(prev => prev.filter(t => t.id !== id));
        setConfirmDelete(null);
      })
      .catch(err => console.error("Error deleting task:", err));
  };

  const handleClearCompleted = () => {
    fetch(`${API}/completed`, { method: "DELETE" })
      .then(() => {
        setTasks(prev => prev.filter(t => !t.completed));
      })
      .catch(err => console.error("Error clearing completed:", err));
  };

  const handleToggleComplete = (task) => {
    const updated = { ...task, completed: !task.completed };
    fetch(`${API}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(r => r.json())
      .then(saved => setTasks(prev => prev.map(t => t.id === saved.id ? saved : t)))
      .catch(err => console.error("Error updating task:", err));
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDeadline(task.deadline || "");
    setEditPriority(task.priority || "MEDIUM");
    setEditCategory(task.category || "");
  };

  const handleSaveEdit = (task) => {
    const updated = {
      ...task,
      title: editTitle, description: editDescription,
      deadline: editDeadline || null,
      priority: editPriority,
      category: editCategory || null
    };

    fetch(`${API}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(r => r.json())
      .then(saved => {
        setTasks(prev => prev.map(t => t.id === saved.id ? saved : t));
        setEditingTask(null);
      })
      .catch(err => console.error("Error updating task:", err));
  };

  // ─── Render ───
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading tasks…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <h1>📋 Task Manager</h1>
        <p>Stay organized, stay productive</p>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="progress-section">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-label">{progress}% complete</div>
        </div>
      )}

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="stats-bar">
          <span>📌 {tasks.length} total</span>
          <span>✅ {completedCount} done</span>
          <span>⏳ {tasks.length - completedCount} pending</span>
          {overdueCount > 0 && <span className="stat-overdue">🔴 {overdueCount} overdue</span>}
        </div>
      )}

      {/* Add Task Form */}
      <form className="add-task-form" onSubmit={handleAddTask}>
        <div className="form-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="input-title"
          />
          <button className="btn-add" type="submit">+ Add</button>
        </div>
        <div className="form-row form-details">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="input-desc"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            title="Set a deadline"
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select-priority">
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{PRIORITY_EMOJI[p]} {p}</option>
            ))}
          </select>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="input-category"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </form>

      {/* Search + Filter + Sort */}
      <div className="toolbar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search tasks…"
          className="search-input"
        />
        <div className="filter-tabs">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f === "Overdue" && overdueCount > 0 && <span className="badge">{overdueCount}</span>}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {displayedTasks.length === 0 ? (
        <div className="empty-state">
          <span>{tasks.length === 0 ? "🎉" : "🔍"}</span>
          {tasks.length === 0
            ? "No tasks yet — add one above to get started!"
            : "No tasks match your search or filter."}
        </div>
      ) : (
        <ul className="task-list">
          {displayedTasks.map(task => (
            <li
              key={task.id}
              className={`task-card ${task.completed ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''} priority-${(task.priority || 'MEDIUM').toLowerCase()}`}
            >
              {editingTask === task.id ? (
                /* ── Edit Mode ── */
                <div className="edit-form">
                  <div className="edit-row">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                    <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
                  </div>
                  <div className="edit-row">
                    <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p} value={p}>{PRIORITY_EMOJI[p]} {p}</option>
                      ))}
                    </select>
                    <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category" list="category-suggestions" />
                  </div>
                  <div className="edit-actions">
                    <button className="btn-save" onClick={() => handleSaveEdit(task)}>💾 Save</button>
                    <button className="btn-cancel" onClick={() => setEditingTask(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ── */
                <>
                  <div className="task-checkbox" onClick={() => handleToggleComplete(task)}>
                    <div className={`checkbox ${task.completed ? 'checked' : ''}`}>
                      {task.completed && "✓"}
                    </div>
                  </div>
                  <div className="task-info" onClick={() => handleToggleComplete(task)}>
                    <div className="task-title-row">
                      <span className="task-title">{task.title}</span>
                      <span className={`priority-badge priority-${(task.priority || 'MEDIUM').toLowerCase()}`}>
                        {PRIORITY_EMOJI[task.priority] || "🟡"} {task.priority || "MEDIUM"}
                      </span>
                    </div>
                    <div className="task-meta">
                      {task.description && <span className="task-description">{task.description}</span>}
                      {task.deadline && (
                        <span className={`task-deadline ${isOverdue(task) ? 'overdue-text' : ''}`}>
                          📅 {formatDate(task.deadline)} · {daysUntil(task.deadline)}
                        </span>
                      )}
                      {task.category && <span className="task-category">🏷️ {task.category}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn-icon btn-edit" onClick={() => startEditing(task)} title="Edit">✏️</button>
                    {confirmDelete === task.id ? (
                      <div className="confirm-delete">
                        <button className="btn-confirm-yes" onClick={() => handleDeleteTask(task.id)}>Yes</button>
                        <button className="btn-confirm-no" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="btn-icon btn-delete" onClick={() => setConfirmDelete(task.id)} title="Delete">🗑️</button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer actions */}
      {completedCount > 0 && (
        <div className="footer-actions">
          <button className="btn-clear-completed" onClick={handleClearCompleted}>
            🧹 Clear {completedCount} completed task{completedCount > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
