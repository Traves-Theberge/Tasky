import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function TodoList() {
  const [todos, setTodos] = useState([
    { text: "Try the new UI!", completed: false },
    { text: "Add a reminder", completed: false },
  ]);
  const [input, setInput] = useState("");

  const addTodo = e => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([{ text: input, completed: false }, ...todos]);
    setInput("");
  };

  const toggleTodo = idx => {
    setTodos(todos.map((todo, i) =>
      i === idx ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const removeTodo = idx => {
    setTodos(todos.filter((_, i) => i !== idx));
  };

  return (
    <div className="todo-list">
      <div className="todo-list-title">Todo List</div>
<form className="todo-add-form" onSubmit={addTodo}>
  <Input
    value={input}
  onChange={e => setInput(e.target.value)}
    placeholder="Add a new task..."
    className="flex-1"
  />
  <Button type="submit" className="ml-2">
    Add
  </Button>
</form>
      {todos.length === 0 && <div className="empty-state">No todos yet!</div>}
      {todos.map((todo, idx) => (
        <div
          className={`todo-item${todo.completed ? " completed" : ""}`}
          key={idx}
        >
<label className="flex items-center flex-1 cursor-pointer">
<Switch
  checked={todo.completed}
  onCheckedChange={() => toggleTodo(idx)}
  aria-label={`Mark task ${idx + 1} as complete`}
  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
/>
            <span style={{ flex: 1 }}>{todo.text}</span>
          </label>
          <button
            className="todo-remove-btn"
            onClick={() => removeTodo(idx)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
