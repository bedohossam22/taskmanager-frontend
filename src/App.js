import { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // 1. Fetch tasks from Spring Boot when the page loads
  useEffect(() => {
    fetch("http://localhost:8080/tasks")
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(error => console.error("Error fetching tasks:", error));
  }, []);

  // 2. Add a new task to Spring Boot
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask = { title: title, description: "", completed: false };

    fetch("http://localhost:8080/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask)
    })
      .then(response => response.json())
      .then(savedTask => {
        setTasks([...tasks, savedTask]);
        setTitle("");
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
  };

  // 6. Save edited task
  const handleSaveEdit = (task) => {
    const updatedTask = { ...task, title: editTitle, description: editDescription };

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

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Hybrid Task Manager</h1>

      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title..."
        />
        <button type="submit">Add Task</button>
      </form>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map(task => (
              <li key={task.id} style={{
                padding: "10px",
                marginTop: "8px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                {editingTask === task.id ? (
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ marginRight: "8px" }}
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description..."
                      style={{ marginRight: "8px" }}
                    />
                    <button onClick={() => handleSaveEdit(task)}>💾 Save</button>
                    <button onClick={() => setEditingTask(null)} style={{ marginLeft: "4px" }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span
                      style={{
                        textDecoration: task.completed ? "line-through" : "none",
                        cursor: "pointer",
                        flex: 1
                      }}
                      onClick={() => handleToggleComplete(task)}
                    >
                      {task.completed ? "✅" : "⏳"} {task.title}
                      {task.description && <small style={{ color: "#888", marginLeft: "8px" }}>— {task.description}</small>}
                    </span>
                    <div>
                      <button onClick={() => startEditing(task)} style={{ marginRight: "4px" }}>✏️ Edit</button>
                      <button onClick={() => handleDeleteTask(task.id)} style={{ color: "red" }}>🗑️ Delete</button>
                    </div>
                  </>
                )}
              </li>
        ))}
            </ul>
    </div>
        );
}

        export default App;
