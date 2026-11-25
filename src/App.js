import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // 1. Fetch tasks from Spring Boot when the page loads
  useEffect(() => {
    fetch("http://localhost:8080/tasks")
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(error => console.error("Error fetching tasks:", error));
  }, []);

  // 2. Add a new task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask = {
      title: title,
      description: "",
      completed: false,
      deadline: deadline || null
    };

    fetch("http://localhost:8080/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask)
    })
      .then(response => response.json())
      .then(savedTask => {
        setTasks([...tasks, savedTask]);
        setTitle("");
        setDeadline("");
      });
  };

  // 3. Delete a task
  const handleDeleteTask = (id) => {
    fetch(`http://localhost:8080/tasks/${id}`, {
      method: "DELETE"
    })
      .then(() => {
        setTasks(tasks.filter(task => task.id !== id));
      })
      .catch(error => console.error("Error deleting task:", error));
};

// 4. Toggle task completed status
const handleToggleComplete = (task) => {
  const updatedTask = { ...task, completed: !task.completed };

  fetch(`http://localhost:8080/tasks/${task.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  })
    .then(response => response.json())
    .then(savedTask => {
      setTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t));
    })
    .catch(error => console.error("Error updating task:", error));
};

// 5. Start editing a task
const startEditing = (task) => {
  setEditingTask(task.id);
  setEditTitle(task.title);
  setEditDescription(task.description || "");
  setEditDeadline(task.deadline || "");
};

// 6. Save edited task
const handleSaveEdit = (task) => {
  const updatedTask = {
    ...task,
    title: editTitle,
    description: editDescription,
    deadline: editDeadline || null
  };

  fetch(`http://localhost:8080/tasks/${task.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedTask)
  })
    .then(response => response.json())
    .then(savedTask => {
      setTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t));
      setEditingTask(null);
    })
    .catch(error => console.error("Error updating task:", error));
};

// Helper: check if a deadline is overdue
const isOverdue = (task) => {
  if (!task.deadline || task.completed) return false;
  return new Date(task.deadline) < new Date(new Date().toDateString());
};

// Helper: format a date string nicely
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const completedCount = tasks.filter(t => t.completed).length;
const overdueCount = tasks.filter(t => isOverdue(t)).length;

return (
    <div className="app-container">
      <div className="app-header">
        <h1>📋 Task Manager</h1>
        <p>Stay organized, stay productive</p>
      </div>

        {tasks.length > 0 && (
          <div className="stats-bar">
            <span>📌 {tasks.length} total</span>
            <span>✅ {completedCount} done</span>
            {overdueCount > 0 && <span>🔴 {overdueCount} overdue</span>}
          </div>
        )}

        <form className="add-task-form" onSubmit={handleAddTask}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            title="Set a deadline"
          />
          <button className="btn-add" type="submit">+ Add Task</button>
        </form>

                    {tasks.length === 0 ? (
                      <div className="empty-state">
                        <span>🎉</span>
                        No tasks yet — add one above to get started!
                      </div>
                    ) : (
                      <ul className="task-list">
                        {tasks.map(task => (
                          <li
                            key={task.id}
                            className={`task-card ${task.completed ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''}`}
                          >
                            {editingTask === task.id ? (
                              <div className="edit-form">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  placeholder="Title"
                                />
                                <input
                                  type="text"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Description"
                                />
                                <input
                                  type="date"
                                  value={editDeadline}
                                  onChange={(e) => setEditDeadline(e.target.value)}
                                />
                                <button className="btn-save" onClick={() => handleSaveEdit(task)}>💾 Save</button>
                                <button className="btn-cancel" onClick={() => setEditingTask(null)}>Cancel</button>
                              </div>
                  ) : (
                  <>
                    <div className="task-info" onClick={() => handleToggleComplete(task)}>
                      <div className="task-title">
                        {task.completed ? "✅" : "⏳"} {task.title}
                      </div>
                      <div className="task-meta">
                        {task.description && (
                          <span className="task-description">{task.description}</span>
                        )}
                        {task.deadline && (
                          <span className="task-deadline">
                            📅 {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="btn-icon btn-edit" onClick={() => startEditing(task)}>✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteTask(task.id)}>🗑️</button>
                    </div>
                  </>
              )}
                </li>
          ))}
            </ul>
          )}
        </div>
        );
}

        export default App;
