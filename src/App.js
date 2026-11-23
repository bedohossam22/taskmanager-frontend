import { useState, useEffect } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

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
    const newTask = { title: title, description: "test", completed: false };

    fetch("http://localhost:8080/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask)
    })
      .then(response => response.json())
      .then(savedTask => {
        // Update the React state with the new task
        setTasks([...tasks, savedTask]);
        setTitle(""); // Clear input
      });
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

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title} - {task.completed ? "✅ Done" : "⏳ Pending"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
