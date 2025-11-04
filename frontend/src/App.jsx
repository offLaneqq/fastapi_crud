import { useState, useEffect } from "react";
import './App.css';

const API_URL = "http://localhost:8000/items/";

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: parseFloat(price), description }),
      });

      if (response.ok) {
        setName("");
        setPrice("");
        setDescription("");
        fetchItems();
      } else {
        console.error("Error to create item:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await fetch(`${API_URL}${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchItems();
      } else {
        console.error("Error deleting item:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // ПРАВИЛЬНО: return знаходиться безпосередньо в компоненті App
  return (
    <div className="App">
      <h1>Items Manager</h1>

      <div className="container">
        <form onSubmit={handleSubmit} className="item-form">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add Item</button>
        </form>

        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong> - ${item.price ? item.price.toFixed(2) : '0.00'}
                <p>{item.description}</p>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;