import './App.css';
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";

/************************************
 * Helpers
 ************************************/
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useUsersFiltered(users, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);
}

/************************************
 * Components
 ************************************/
function Header({ count }) {
  return (
    <header className="header">
      <h1 className="header-title">Users ({count})</h1>
      <nav>
        <Link to="/" className="link">List</Link>
      </nav>
    </header>
  );
}

function SearchBar({ search, setSearch }) {
  return (
    <input
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Search by name or email…"
      className="input-search"
    />
  );
}

function AddUserButton({ addUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-add">+ Add User</button>
      {open && <UserForm onClose={() => setOpen(false)} addUser={addUser} />}
    </>
  );
}

function UserForm({ onClose, addUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const es = {};
    if (!name.trim()) es.name = "Name is required";
    if (!email.trim()) es.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) es.email = "Invalid email";
    return es;
  }, [name, email]);

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    addUser({ name, email, company });
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} className="modal">
        <h3 className="modal-title">Add a new User</h3>
        <label className="modal-label">
          Name *
          <input
            className={classNames("modal-input", touched && errors.name && "input-error")}
            value={name} onChange={e => setName(e.target.value)} />
          {touched && errors.name && <div className="input-error-text">{errors.name}</div>}
        </label>
        <label className="modal-label">
          Email *
          <input
            className={classNames("modal-input", touched && errors.email && "input-error")}
            value={email} onChange={e => setEmail(e.target.value)} />
          {touched && errors.email && <div className="input-error-text">{errors.email}</div>}
        </label>
        <label className="modal-label">
          Company
          <input className="modal-input" value={company} onChange={e => setCompany(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
          <button type="submit" className="btn-submit">Add</button>
        </div>
      </form>
    </div>
  );
}

function UsersTable({ users, navigate }) {
  if (!users.length) return <div className="no-users">No users found.</div>;
  return (
    <table className="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Company</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="users-row">
            <td>
              <button className="link" onClick={() => navigate(`/users/${u.id}`)}>{u.name}</button>
            </td>
            <td>{u.email}</td>
            <td>{u.company || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ListPage({ setUsersCount }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          company: u.company?.name || "—",
          phone: u.phone || "—",
          website: u.website || "—",
          address: u.address || null
        }));
        setUsers(mapped);
        setUsersCount(mapped.length);
      });
  }, []);

  const addUser = ({ name, email, company }) => {
    const newUser = { id: Date.now(), name, email, company };
    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    setUsersCount(updatedUsers.length);
  };

  const filteredUsers = useUsersFiltered(users, search);

  return (
    <main className="main">
      <SearchBar search={search} setSearch={setSearch} />
      <AddUserButton addUser={addUser} />
      <UsersTable users={filteredUsers} navigate={navigate} />
    </main>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || "—"}</div>
    </div>
  );
}

function UserDetailsPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then(res => res.json())
      .then(u => setUser(u));
  }, [id]);

  if (!user) return <div className="loading">Loading...</div>;

  const addressText = user.address
    ? `${user.address.street}, ${user.address.suite}, ${user.address.city} ${user.address.zipcode}`
    : "—";

  return (
    <main className="main-detail">
      <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
      <div className="detail-card">
        <h1 className="detail-name">{user.name}</h1>
        <p className="detail-company">{user.company?.name}</p>
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Phone" value={user.phone} />
        <DetailRow label="Website" value={user.website} />
        <DetailRow label="Address" value={addressText} />
      </div>
    </main>
  );
}

/************************************
 * App root
 ************************************/
export default function App() {
  const [usersCount, setUsersCount] = useState(0);

  return (
    <BrowserRouter>
      <Header count={usersCount} />
      <Routes>
        <Route path="/" element={<ListPage setUsersCount={setUsersCount} />} />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route path="*" element={<div className="loading">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
